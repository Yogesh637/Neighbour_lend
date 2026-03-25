package com.example.lend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.lend.entity.Item;

public interface ItemRepository extends JpaRepository<Item, Long> {
}
