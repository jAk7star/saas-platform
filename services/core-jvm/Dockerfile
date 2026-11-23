# syntax=docker/dockerfile:1.4
FROM eclipse-temurin:25-jdk-noble AS builder

WORKDIR /app

COPY gradle/ ./gradle/
COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./

# Cache Gradle dependencies
RUN chmod +x ./gradlew && ./gradlew --no-daemon dependencies || true

COPY src/ ./src/
RUN ./gradlew --no-daemon installDist -x test

# Production Runner Stage
FROM eclipse-temurin:25-jre-noble AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Non-root user
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/bash -m appuser

COPY --from=builder /app/build/install/core-jvm/ ./

RUN chown -R appuser:appgroup /app

USER appuser

ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./bin/core-jvm"]
