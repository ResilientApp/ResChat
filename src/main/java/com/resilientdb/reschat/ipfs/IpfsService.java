package com.resilientdb.reschat.ipfs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class IpfsService {

    private final IpfsClusterConfig config;

    @Autowired
    public IpfsService(IpfsClusterConfig config) {
        this.config = config;
    }

    public String uploadFile(File file) throws IOException, InterruptedException {
        String boundary = UUID.randomUUID().toString();
        String lineSeparator = "\r\n";

        var bodyBuilder = new StringBuilder();
        bodyBuilder.append("--").append(boundary).append(lineSeparator);
        bodyBuilder.append("Content-Disposition: form-data; name=\"file\"; filename=\"")
                .append(file.getName()).append("\"").append(lineSeparator);
        bodyBuilder.append("Content-Type: application/octet-stream").append(lineSeparator).append(lineSeparator);

        byte[] fileBytes = java.nio.file.Files.readAllBytes(file.toPath());
        byte[] headerBytes = bodyBuilder.toString().getBytes();
        byte[] footerBytes = (lineSeparator + "--" + boundary + "--" + lineSeparator).getBytes();

        byte[] requestBody = new byte[headerBytes.length + fileBytes.length + footerBytes.length];
        System.arraycopy(headerBytes, 0, requestBody, 0, headerBytes.length);
        System.arraycopy(fileBytes, 0, requestBody, headerBytes.length, fileBytes.length);
        System.arraycopy(footerBytes, 0, requestBody, headerBytes.length + fileBytes.length, footerBytes.length);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getProtocol() + "://" + config.getHost() + ":" + config.getClusterPort() + "/add"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        String responseBody = response.body();
        System.out.println("Upload Response: " + responseBody);

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode root = objectMapper.readTree(responseBody);
        String cid = root.path("cid").path("/").asText();
        System.out.println("Uploaded CID = " + cid);
        return cid;
    }

    public void downloadFile(String cid, String outputPath) throws IOException, InterruptedException {
        String url = config.getProtocol() + "://" + config.getHost() + ":" + config.getGatewayPort() + "/ipfs/" + cid;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());

        try (InputStream in = response.body();
             OutputStream out = new FileOutputStream(outputPath)) {

            byte[] buffer = new byte[8192];
            int length;
            while ((length = in.read(buffer)) != -1) {
                out.write(buffer, 0, length);
            }
        }

        System.out.println("File downloaded to: " + outputPath);
    }
}
