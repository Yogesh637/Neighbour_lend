package com.example.lend.service;

import com.example.lend.entity.Item;

import java.util.List;

public interface ItemService {
	Item add(Item item);

	List<Item> getAllItems();

	Item getItemById(Long id);

	Item updateItem(Long id, Item item);

	void deleteItem(Long id);

	void deleteAllItems();
}
