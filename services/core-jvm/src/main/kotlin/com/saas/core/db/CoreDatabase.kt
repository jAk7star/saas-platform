@file:OptIn(ExperimentalUuidApi::class)

package com.saas.core.db

import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import java.util.UUID
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid
import kotlin.uuid.toJavaUuid
import kotlin.uuid.toKotlinUuid

object Subscriptions : Table("core.subscriptions") {
    val id = uuid("id")
    val tenantId = uuid("tenant_id")
    val planTier = varchar("plan_tier", 64)
    val status = varchar("status", 32)
    val monthlyEventLimit = integer("monthly_event_limit")

    override val primaryKey = PrimaryKey(id)
}

object CoreDatabase {
    fun init(): Database {
        val jdbcUrl = System.getenv("CORE_JDBC_URL")
            ?: "jdbc:postgresql://localhost:5432/saas_db"
        val user = System.getenv("POSTGRES_USER") ?: "postgres"
        val password = System.getenv("POSTGRES_PASSWORD") ?: "postgres"

        Flyway.configure()
            .dataSource(jdbcUrl, user, password)
            .schemas("core")
            .defaultSchema("core")
            .locations("classpath:db/migration")
            .load()
            .migrate()

        return Database.connect(
            url = jdbcUrl,
            driver = "org.postgresql.Driver",
            user = user,
            password = password,
        )
    }
}

data class TenantSubscription(
    val tenantId: UUID,
    val planTier: String,
    val status: String,
    val monthlyEventLimit: Int,
)

class PostgresQuotaRepository {
    fun getOrCreateStarter(tenantUuid: UUID): TenantSubscription = transaction {
        val kotlinTenantUuid = tenantUuid.toKotlinUuid()
        exec("SELECT set_config('app.current_tenant_id', '$tenantUuid', true)")
        val existing = Subscriptions
            .selectAll()
            .where { Subscriptions.tenantId eq kotlinTenantUuid }
            .firstOrNull()

        if (existing != null) {
            return@transaction TenantSubscription(
                tenantId = existing[Subscriptions.tenantId].toJavaUuid(),
                planTier = existing[Subscriptions.planTier],
                status = existing[Subscriptions.status],
                monthlyEventLimit = existing[Subscriptions.monthlyEventLimit],
            )
        }

        val defaultLimit = 10_000
        Subscriptions.insert {
            it[id] = Uuid.random()
            it[tenantId] = kotlinTenantUuid
            it[planTier] = "starter"
            it[status] = "active"
            it[monthlyEventLimit] = defaultLimit
        }

        TenantSubscription(
            tenantId = tenantUuid,
            planTier = "starter",
            status = "active",
            monthlyEventLimit = defaultLimit,
        )
    }

    fun updatePlan(tenantUuid: UUID, newPlanTier: String, newStatus: String): TenantSubscription = transaction {
        val kotlinTenantUuid = tenantUuid.toKotlinUuid()
        exec("SELECT set_config('app.current_tenant_id', '$tenantUuid', true)")
        val limit = when (newPlanTier.lowercase()) {
            "pro" -> 100_000
            "enterprise" -> 1_000_000
            else -> 10_000
        }

        val updated = Subscriptions.update({ Subscriptions.tenantId eq kotlinTenantUuid }) {
            it[planTier] = newPlanTier
            it[status] = newStatus
            it[monthlyEventLimit] = limit
        }

        if (updated == 0) {
            Subscriptions.insert {
                it[id] = Uuid.random()
                it[tenantId] = kotlinTenantUuid
                it[planTier] = newPlanTier
                it[status] = newStatus
                it[monthlyEventLimit] = limit
            }
        }

        TenantSubscription(
            tenantId = tenantUuid,
            planTier = newPlanTier,
            status = newStatus,
            monthlyEventLimit = limit,
        )
    }
}
