FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

RUN apk add --no-cache maven

COPY pom.xml .
COPY ktz-gateway/pom.xml ktz-gateway/pom.xml
COPY ktz-simulator/pom.xml ktz-simulator/pom.xml
COPY ktz-telemetry/pom.xml ktz-telemetry/pom.xml
COPY ktz-history/pom.xml ktz-history/pom.xml

RUN mvn dependency:go-offline -B -pl ktz-simulator -am

COPY ktz-simulator/src ktz-simulator/src

RUN mvn clean package -DskipTests -pl ktz-simulator -am

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/ktz-simulator/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]