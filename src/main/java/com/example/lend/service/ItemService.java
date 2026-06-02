package com.example.lend.service;

import com.example.lend.entity.Item;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ItemService {
    Item add(Item item);

    List<Item> getAllItems();

    Page<Item> getPagedItems(int page, int size, String category, String search);

    Item getItemById(Long id);

    Item updateItem(Long id, Item item);

    void deleteItem(Long id);

    void deleteAllItems();
}
