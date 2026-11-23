package com.saas.core.openapi

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import java.io.File

private val prettyJson = Json { prettyPrint = true }

fun buildCoreOpenApiSpec(): JsonObject = buildJsonObject {
    put("openapi", "3.1.0")
    putJsonObject("info") {
        put("title", "SaaS Core JVM Service")
        put("version", "0.1.0")
        put("description", "Multitenant quotas, subscriptions and core domain API.")
    }
    putJsonObject("paths") {
        putJsonObject("/health") {
            putJsonObject("get") {
                put("operationId", "healthCheck")
                putJsonArray("tags") { add("system") }
                putJsonObject("responses") {
                    putJsonObject("200") {
                        put("description", "Service liveness status")
                        putJsonObject("content") {
                            putJsonObject("application/json") {
                                putJsonObject("schema") {
                                    put("\$ref", "#/components/schemas/HealthResponse")
                                }
                            }
                        }
                    }
                }
            }
        }
        putJsonObject("/v1/tenants/{id}/verify-limit") {
            putJsonObject("post") {
                put("operationId", "verifyTenantLimit")
                putJsonArray("tags") { add("tenants") }
                putJsonArray("parameters") {
                    add(
                        buildJsonObject {
                            put("name", "id")
                            put("in", "path")
                            put("required", true)
                            putJsonObject("schema") { put("type", "string") }
                        },
                    )
                }
                putJsonObject("requestBody") {
                    put("required", true)
                    putJsonObject("content") {
                        putJsonObject("application/json") {
                            putJsonObject("schema") {
                                put("\$ref", "#/components/schemas/VerifyLimitRequest")
                            }
                        }
                    }
                }
                putJsonObject("responses") {
                    putJsonObject("200") {
                        put("description", "Tenant quota verification result")
                        putJsonObject("content") {
                            putJsonObject("application/json") {
                                putJsonObject("schema") {
                                    put("\$ref", "#/components/schemas/VerifyLimitResponse")
                                }
                            }
                        }
                    }
                }
            }
        }
        putJsonObject("/v1/tenants/{id}/plan") {
            putJsonObject("get") {
                put("operationId", "getTenantPlan")
                putJsonArray("tags") { add("tenants") }
                putJsonArray("parameters") {
                    add(
                        buildJsonObject {
                            put("name", "id")
                            put("in", "path")
                            put("required", true)
                            putJsonObject("schema") { put("type", "string") }
                        },
                    )
                }
                putJsonObject("responses") {
                    putJsonObject("200") {
                        put("description", "Tenant plan and subscription status")
                        putJsonObject("content") {
                            putJsonObject("application/json") {
                                putJsonObject("schema") {
                                    put("\$ref", "#/components/schemas/TenantPlanResponse")
                                }
                            }
                        }
                    }
                }
            }
        }
        putJsonObject("/v1/billing/webhook") {
            putJsonObject("post") {
                put("operationId", "handleBillingWebhook")
                putJsonArray("tags") { add("billing") }
                putJsonObject("requestBody") {
                    put("required", true)
                    putJsonObject("content") {
                        putJsonObject("application/json") {
                            putJsonObject("schema") {
                                put("\$ref", "#/components/schemas/BillingWebhookRequest")
                            }
                        }
                    }
                }
                putJsonObject("responses") {
                    putJsonObject("200") {
                        put("description", "Billing webhook result")
                        putJsonObject("content") {
                            putJsonObject("application/json") {
                                putJsonObject("schema") {
                                    put("\$ref", "#/components/schemas/BillingWebhookResponse")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    putJsonObject("components") {
        putJsonObject("schemas") {
            putJsonObject("HealthResponse") {
                put("type", "object")
                putJsonArray("required") {
                    add("status")
                    add("service")
                }
                putJsonObject("properties") {
                    putJsonObject("status") { put("type", "string") }
                    putJsonObject("service") { put("type", "string") }
                }
            }
            putJsonObject("VerifyLimitRequest") {
                put("type", "object")
                putJsonArray("required") { add("requestedEvents") }
                putJsonObject("properties") {
                    putJsonObject("requestedEvents") { put("type", "integer") }
                }
            }
            putJsonObject("VerifyLimitResponse") {
                put("type", "object")
                putJsonArray("required") {
                    add("tenantId")
                    add("allowed")
                    add("planTier")
                    add("remainingQuota")
                }
                putJsonObject("properties") {
                    putJsonObject("tenantId") { put("type", "string") }
                    putJsonObject("allowed") { put("type", "boolean") }
                    putJsonObject("planTier") { put("type", "string") }
                    putJsonObject("remainingQuota") { put("type", "integer") }
                }
            }
            putJsonObject("TenantPlanResponse") {
                put("type", "object")
                putJsonArray("required") {
                    add("tenantId")
                    add("planTier")
                    add("status")
                    add("monthlyEventLimit")
                }
                putJsonObject("properties") {
                    putJsonObject("tenantId") { put("type", "string") }
                    putJsonObject("planTier") { put("type", "string") }
                    putJsonObject("status") { put("type", "string") }
                    putJsonObject("monthlyEventLimit") { put("type", "integer") }
                }
            }
            putJsonObject("BillingWebhookRequest") {
                put("type", "object")
                putJsonArray("required") {
                    add("event")
                    add("tenantId")
                    add("planTier")
                }
                putJsonObject("properties") {
                    putJsonObject("event") { put("type", "string") }
                    putJsonObject("tenantId") { put("type", "string") }
                    putJsonObject("planTier") { put("type", "string") }
                    putJsonObject("status") { put("type", "string") }
                }
            }
            putJsonObject("BillingWebhookResponse") {
                put("type", "object")
                putJsonArray("required") {
                    add("success")
                    add("tenantId")
                    add("planTier")
                    add("monthlyEventLimit")
                }
                putJsonObject("properties") {
                    putJsonObject("success") { put("type", "boolean") }
                    putJsonObject("tenantId") { put("type", "string") }
                    putJsonObject("planTier") { put("type", "string") }
                    putJsonObject("monthlyEventLimit") { put("type", "integer") }
                }
            }
        }
    }
}

fun exportOpenApiToFile(outputPath: String): File {
    val outFile = File(outputPath)
    outFile.parentFile?.mkdirs()
    outFile.writeText(prettyJson.encodeToString(JsonObject.serializer(), buildCoreOpenApiSpec()) + "\n")
    return outFile
}

fun main(args: Array<String>) {
    val target = args.firstOrNull() ?: "dist/openapi-core.json"
    val file = exportOpenApiToFile(target)
    println("Exported OpenAPI spec to ${file.absolutePath}")
}
