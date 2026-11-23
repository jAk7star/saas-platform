package com.saas.core.routes

import com.saas.core.db.PostgresQuotaRepository
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class HealthResponse(
    val status: String = "ok",
    val service: String = "core-jvm",
)

@Serializable
data class VerifyLimitRequest(
    val requestedEvents: Int = 1,
)

@Serializable
data class VerifyLimitResponse(
    val tenantId: String,
    val allowed: Boolean,
    val planTier: String,
    val remainingQuota: Int,
)

@Serializable
data class BillingWebhookRequest(
    val event: String,
    val tenantId: String,
    val planTier: String,
    val status: String = "active",
)

@Serializable
data class BillingWebhookResponse(
    val success: Boolean,
    val tenantId: String,
    val planTier: String,
    val monthlyEventLimit: Int,
)

@Serializable
data class TenantPlanResponse(
    val tenantId: String,
    val planTier: String,
    val status: String,
    val monthlyEventLimit: Int,
)

interface QuotaVerifier {
    fun verify(tenantId: String, requestedEvents: Int): VerifyLimitResponse
    fun getPlan(tenantId: String): TenantPlanResponse
    fun handleBillingWebhook(request: BillingWebhookRequest): BillingWebhookResponse
}

class DefaultQuotaVerifier : QuotaVerifier {
    private val plans = mutableMapOf<String, Pair<String, Int>>()

    override fun verify(tenantId: String, requestedEvents: Int): VerifyLimitResponse {
        val (planTier, limit) = plans[tenantId] ?: ("starter" to 10_000)
        val remaining = (limit - requestedEvents).coerceAtLeast(0)
        return VerifyLimitResponse(
            tenantId = tenantId,
            allowed = requestedEvents <= limit,
            planTier = planTier,
            remainingQuota = remaining,
        )
    }

    override fun getPlan(tenantId: String): TenantPlanResponse {
        val (planTier, limit) = plans[tenantId] ?: ("starter" to 10_000)
        return TenantPlanResponse(
            tenantId = tenantId,
            planTier = planTier,
            status = "active",
            monthlyEventLimit = limit,
        )
    }

    override fun handleBillingWebhook(request: BillingWebhookRequest): BillingWebhookResponse {
        val limit = when (request.planTier.lowercase()) {
            "pro" -> 100_000
            "enterprise" -> 1_000_000
            else -> 10_000
        }
        plans[request.tenantId] = request.planTier to limit
        return BillingWebhookResponse(
            success = true,
            tenantId = request.tenantId,
            planTier = request.planTier,
            monthlyEventLimit = limit,
        )
    }
}

class PostgresQuotaVerifier(
    private val repository: PostgresQuotaRepository,
) : QuotaVerifier {
    override fun verify(tenantId: String, requestedEvents: Int): VerifyLimitResponse {
        val tenantUuid = runCatching { UUID.fromString(tenantId) }.getOrNull()
            ?: return VerifyLimitResponse(
                tenantId = tenantId,
                allowed = false,
                planTier = "invalid",
                remainingQuota = 0,
            )

        val sub = repository.getOrCreateStarter(tenantUuid)
        val isActive = sub.status == "active"
        val allowed = isActive && requestedEvents <= sub.monthlyEventLimit
        val remaining = (sub.monthlyEventLimit - requestedEvents).coerceAtLeast(0)

        return VerifyLimitResponse(
            tenantId = tenantId,
            allowed = allowed,
            planTier = sub.planTier,
            remainingQuota = remaining,
        )
    }

    override fun getPlan(tenantId: String): TenantPlanResponse {
        val tenantUuid = runCatching { UUID.fromString(tenantId) }.getOrNull()
            ?: return TenantPlanResponse(
                tenantId = tenantId,
                planTier = "invalid",
                status = "inactive",
                monthlyEventLimit = 0,
            )
        val sub = repository.getOrCreateStarter(tenantUuid)
        return TenantPlanResponse(
            tenantId = tenantId,
            planTier = sub.planTier,
            status = sub.status,
            monthlyEventLimit = sub.monthlyEventLimit,
        )
    }

    override fun handleBillingWebhook(request: BillingWebhookRequest): BillingWebhookResponse {
        val tenantUuid = runCatching { UUID.fromString(request.tenantId) }.getOrNull()
            ?: return BillingWebhookResponse(
                success = false,
                tenantId = request.tenantId,
                planTier = request.planTier,
                monthlyEventLimit = 0,
            )

        val updated = repository.updatePlan(tenantUuid, request.planTier, request.status)
        return BillingWebhookResponse(
            success = true,
            tenantId = request.tenantId,
            planTier = updated.planTier,
            monthlyEventLimit = updated.monthlyEventLimit,
        )
    }
}

fun Route.coreRoutes(quotaVerifier: QuotaVerifier) {
    get("/health") {
        call.respond(HttpStatusCode.OK, HealthResponse())
    }

    post("/v1/tenants/{id}/verify-limit") {
        val tenantId = call.parameters["id"]
        if (tenantId.isNullOrBlank()) {
            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing tenant id"))
            return@post
        }
        val body = call.receive<VerifyLimitRequest>()
        call.respond(HttpStatusCode.OK, quotaVerifier.verify(tenantId, body.requestedEvents))
    }

    get("/v1/tenants/{id}/plan") {
        val tenantId = call.parameters["id"]
        if (tenantId.isNullOrBlank()) {
            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing tenant id"))
            return@get
        }
        call.respond(HttpStatusCode.OK, quotaVerifier.getPlan(tenantId))
    }

    post("/v1/billing/webhook") {
        val body = call.receive<BillingWebhookRequest>()
        val result = quotaVerifier.handleBillingWebhook(body)
        if (result.success) {
            call.respond(HttpStatusCode.OK, result)
        } else {
            call.respond(HttpStatusCode.BadRequest, result)
        }
    }
}
