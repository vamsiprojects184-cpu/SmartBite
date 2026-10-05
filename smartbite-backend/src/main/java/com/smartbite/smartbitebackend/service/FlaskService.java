package com.smartbite.smartbitebackend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class FlaskService {

    private final RestClient restClient;

    public FlaskService() {
        this.restClient = RestClient.builder()
                .baseUrl("http://127.0.0.1:5000")
                .build();
    }

    public String testFlaskConnection() {
        return restClient.get()
                .uri("/test-db")
                .retrieve()
                .body(String.class);
    }
}