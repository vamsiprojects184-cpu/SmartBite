package com.smartbite.smartbitebackend.controller;

import com.smartbite.smartbitebackend.service.FlaskService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/flask")
public class FlaskController {

    private final FlaskService flaskService;

    public FlaskController(FlaskService flaskService) {
        this.flaskService = flaskService;
    }

    @GetMapping("/test")
    public String testFlask() {
        return flaskService.testFlaskConnection();
    }
}