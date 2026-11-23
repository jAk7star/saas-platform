package com.saas.core

import com.saas.core.openapi.exportOpenApiToFile
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import java.nio.file.Files
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ApplicationTest {
    @Test
    fun `health endpoint returns ok`() = testApplication {
        application { module() }
        val response = client.get("/health")
        assertEquals(HttpStatusCode.OK, response.status)
        assertTrue(response.bodyAsText().contains("\"status\":\"ok\""))
    }

    @Test
    fun `verify-limit endpoint returns allowed quota`() = testApplication {
        application { module() }
        val response = client.post("/v1/tenants/tenant-123/verify-limit") {
            contentType(ContentType.Application.Json)
            setBody("""{"requestedEvents": 5}""")
        }
        assertEquals(HttpStatusCode.OK, response.status)
        val body = response.bodyAsText()
        assertTrue(body.contains("\"tenantId\":\"tenant-123\""))
        assertTrue(body.contains("\"allowed\":true"))
    }

    @Test
    fun `billing webhook upgrades tenant quota and plan endpoint reflects change`() = testApplication {
        application { module() }
        val webhookResponse = client.post("/v1/billing/webhook") {
            contentType(ContentType.Application.Json)
            setBody("""{"event":"checkout.session.completed","tenantId":"tenant-123","planTier":"pro","status":"active"}""")
        }
        assertEquals(HttpStatusCode.OK, webhookResponse.status)
        val webhookBody = webhookResponse.bodyAsText()
        assertTrue(webhookBody.contains("\"success\":true"))
        assertTrue(webhookBody.contains("\"planTier\":\"pro\""))
        assertTrue(webhookBody.contains("\"monthlyEventLimit\":100000"))

        val planResponse = client.get("/v1/tenants/tenant-123/plan")
        assertEquals(HttpStatusCode.OK, planResponse.status)
        val planBody = planResponse.bodyAsText()
        assertTrue(planBody.contains("\"planTier\":\"pro\""))
        assertTrue(planBody.contains("\"monthlyEventLimit\":100000"))
    }

    @Test
    fun `openapi exporter writes valid spec file`() {
        val tempDir = Files.createTempDirectory("core-openapi-test")
        val target = tempDir.resolve("openapi-core.json").toString()
        val exported = exportOpenApiToFile(target)
        val content = exported.readText()
        assertTrue(content.contains("/v1/tenants/{id}/verify-limit"))
        assertTrue(content.contains("/v1/billing/webhook"))
        assertTrue(content.contains("BillingWebhookResponse"))
    }
}
