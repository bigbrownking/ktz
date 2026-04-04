package org.ktz.ktzgateway.service.impl;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzgateway.service.MinioService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioServiceImpl implements MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.url}")
    private String minioUrl;

    @Value("${minio.public.url:}")
    private String minioPublicUrl;

    @Value("${minio.presigned.expiry:600}")
    private int expiry;

    @Override
    public Mono<String> upload(FilePart file, String folder) {

        String filename = generateFileName(file.filename());
        String objectName = folder + "/" + filename;

        return Mono.fromCallable(() -> {

            ensureBucketExists();

            InputStream stream = file.content()
                    .reduce(DataBuffer::write)
                    .map(dataBuffer -> {
                        byte[] bytes = new byte[dataBuffer.readableByteCount()];
                        dataBuffer.read(bytes);
                        return bytes;
                    })
                    .map(java.io.ByteArrayInputStream::new)
                    .block();

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(stream, stream.available(), -1)
                            .contentType(file.headers().getContentType().toString())
                            .build()
            );

            String objectPath = bucket + "/" + objectName;

            log.info("Uploaded: {}", objectPath);

            return objectPath;

        }).subscribeOn(Schedulers.boundedElastic());
    }

    // ========================
    // PREVIEW (inline)
    // ========================
    @Override
    public Mono<String> getPreviewUrl(String objectPath) {

        return Mono.fromCallable(() -> {

            String objectName = extractObjectName(objectPath);

            Map<String, String> headers = new HashMap<>();
            headers.put("response-content-disposition", "inline");

            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(objectName)
                            .expiry(expiry, TimeUnit.SECONDS)
                            .extraQueryParams(headers)
                            .build()
            );

            return toPublicUrl(url);

        }).subscribeOn(Schedulers.boundedElastic());
    }

    // ========================
    // DOWNLOAD
    // ========================
    @Override
    public Mono<String> getDownloadUrl(String objectPath, String fileName) {

        return Mono.fromCallable(() -> {

            String objectName = extractObjectName(objectPath);

            Map<String, String> headers = new HashMap<>();
            headers.put("response-content-disposition",
                    "attachment; filename=\"" + fileName + "\"");

            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(objectName)
                            .expiry(expiry, TimeUnit.SECONDS)
                            .extraQueryParams(headers)
                            .build()
            );

            return toPublicUrl(url);

        }).subscribeOn(Schedulers.boundedElastic());
    }

    // ========================
    // DELETE
    // ========================
    @Override
    public Mono<Void> delete(String objectPath) {

        return Mono.fromRunnable(() -> {
            try {
                String objectName = extractObjectName(objectPath);

                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(bucket)
                                .object(objectName)
                                .build()
                );

                log.info("Deleted: {}", objectPath);

            } catch (Exception e) {
                log.error("Delete error", e);
                throw new RuntimeException(e);
            }
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }

    // ========================
    // HELPERS
    // ========================
    private void ensureBucketExists() throws Exception {

        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build()
        );

        if (!exists) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder().bucket(bucket).build()
            );
        }
    }

    private String generateFileName(String original) {
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf("."));
        }
        return UUID.randomUUID() + ext;
    }

    private String extractObjectName(String path) {

        if (path.startsWith(bucket + "/")) {
            return path.substring(bucket.length() + 1);
        }

        if (path.contains("/" + bucket + "/")) {
            return path.substring(path.indexOf(bucket) + bucket.length() + 1);
        }

        return path;
    }

    private String toPublicUrl(String url) {
        if (minioPublicUrl != null && !minioPublicUrl.isBlank()) {
            return url.replace(minioUrl, minioPublicUrl);
        }
        return url;
    }
}