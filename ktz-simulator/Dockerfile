# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY ktz-simulator/pom.xml ktz-simulator/pom.xml
COPY ktz-telemetry/pom.xml ktz-telemetry/pom.xml
COPY ktz-history/pom.xml ktz-history/pom.xml
COPY ktz-gateway/pom.xml ktz-gateway/pom.xml
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:resolve -B -pl ktz-simulator -Dscope=compile -q
COPY ktz-simulator/src ktz-simulator/src
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests -B -pl ktz-simulator -q
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/ktz-simulator/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]