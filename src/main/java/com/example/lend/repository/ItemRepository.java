package com.example.lend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.lend.entity.Item;

public interface ItemRepository extends JpaRepository<Item, Long> {

    Page<Item> findByCategory(String category, Pageable pageable);

    Page<Item> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:search IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Item> findByFilters(@Param("category") String category,
                             @Param("search") String search,
                             Pageable pageable);
}
