package com.zappy.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    private final Path rootLocation = Paths.get("public/zappy-uploads");

    public FileStorageService() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            logger.error("Could not initialize storage directory", e);
        }
    }

    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Failed to store empty file.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.png");
        String extension = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx > 0) {
            extension = originalFilename.substring(dotIdx);
        }

        String filename = UUID.randomUUID() + extension;

        try (InputStream inputStream = file.getInputStream()) {
            Path destinationFile = this.rootLocation.resolve(filename).normalize().toAbsolutePath();
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return "/zappy-uploads/" + filename;
        } catch (IOException e) {
            logger.error("Failed to store file: {}", filename, e);
            throw new RuntimeException("Failed to store file: " + filename, e);
        }
    }
}

