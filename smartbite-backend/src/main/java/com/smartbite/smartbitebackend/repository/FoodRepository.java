package com.smartbite.smartbitebackend.repository;

import com.smartbite.smartbitebackend.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodRepository extends JpaRepository<Food, Long> {
}