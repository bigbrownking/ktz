package org.ktz.ktzgateway.service;

import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

public interface MinioService {

    Mono<String> upload(FilePart file, String folder);

    Mono<String> getPreviewUrl(String objectPath);

    Mono<String> getDownloadUrl(String objectPath, String fileName);

    Mono<Void> delete(String objectPath);
}