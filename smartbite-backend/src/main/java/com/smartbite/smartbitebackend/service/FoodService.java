package com.smartbite.smartbitebackend.service;

import com.smartbite.smartbitebackend.entity.Food;
import com.smartbite.smartbitebackend.repository.FoodRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodService {

    private final FoodRepository foodRepository;

    public FoodService(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    public Food getFoodById(Long id) {
        return foodRepository.findById(id).orElse(null);
    }

    public Food addFood(Food food) {
        return foodRepository.save(food);
    }

    public Food updateFood(Long id, Food food) {
        Food existingFood = foodRepository.findById(id).orElse(null);

        if (existingFood == null) {
            return null;
        }

        existingFood.setName(food.getName());
        existingFood.setCategory(food.getCategory());
        existingFood.setCalories(food.getCalories());
        existingFood.setProtein(food.getProtein());
        existingFood.setCarbohydrates(food.getCarbohydrates());
        existingFood.setFat(food.getFat());
        existingFood.setFiber(food.getFiber());
        existingFood.setHealthRating(food.getHealthRating());

        return foodRepository.save(existingFood);
    }

    public void deleteFood(Long id) {
        foodRepository.deleteById(id);
    }
}