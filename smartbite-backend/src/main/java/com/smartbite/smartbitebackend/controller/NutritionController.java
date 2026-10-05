package com.smartbite.smartbitebackend.controller;

import com.smartbite.smartbitebackend.entity.Food;
import com.smartbite.smartbitebackend.repository.FoodRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/nutrition")
public class NutritionController {

    private final FoodRepository foodRepository;

    public NutritionController(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    @GetMapping("/{id}")
    public Food getNutrition(@PathVariable Long id) {

        return foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found"));
    }
}