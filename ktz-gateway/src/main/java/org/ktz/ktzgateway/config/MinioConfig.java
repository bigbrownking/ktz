package org.ktz.ktzgateway.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    @Bean
    public MinioClient minioClient(
            @Value("${minio.url:http://minio:9000}") String url,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key:minioadmin}") String secretKey
    ) {
        return MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
    }
}