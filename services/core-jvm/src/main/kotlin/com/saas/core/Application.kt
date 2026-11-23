package com.saas.core

import com.saas.core.db.CoreDatabase
import com.saas.core.db.PostgresQuotaRepository
import com.saas.core.routes.DefaultQuotaVerifier
import com.saas.core.routes.PostgresQuotaVerifier
import com.saas.core.routes.QuotaVerifier
import com.saas.core.routes.coreRoutes
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.routing.routing
import kotlinx.serialization.json.Json
import org.koin.dsl.module
import org.koin.ktor.ext.inject
import org.koin.ktor.plugin.Koin

val coreModule = module {
    single<QuotaVerifier> { DefaultQuotaVerifier() }
}

val postgresModule = module {
    single { PostgresQuotaRepository() }
    single<QuotaVerifier> { PostgresQuotaVerifier(get()) }
}

fun Application.module(useDatabase: Boolean = false) {
    if (useDatabase) {
        CoreDatabase.init()
    }
    install(Koin) {
        modules(if (useDatabase) postgresModule else coreModule)
    }
    install(ContentNegotiation) {
        json(
            Json {
                ignoreUnknownKeys = true
                encodeDefaults = true
                prettyPrint = false
            },
        )
    }
    val quotaVerifier by inject<QuotaVerifier>()
    routing {
        coreRoutes(quotaVerifier)
    }
}

fun main() {
    embeddedServer(
        Netty,
        port = 8080,
        host = "0.0.0.0",
        module = { module(useDatabase = true) },
    ).start(wait = true)
}
