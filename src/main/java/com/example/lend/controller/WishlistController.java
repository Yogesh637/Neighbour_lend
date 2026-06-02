package com.example.lend.controller;

import com.example.lend.entity.Item;
import com.example.lend.entity.User;
import com.example.lend.exception.BusinessException;
import com.example.lend.repository.ItemRepository;
import com.example.lend.repository.UserRepository;
import com.example.lend.mapper.ItemMapper;
import com.example.lend.dto.response.ItemResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final ItemMapper itemMapper;

    public WishlistController(UserRepository userRepository,
                              ItemRepository itemRepository,
                              ItemMapper itemMapper) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.itemMapper = itemMapper;
    }

    @PostMapping("/toggle/{itemId}")
    @Transactional
    public ResponseEntity<Map<String, Boolean>> toggleWishlist(@PathVariable Long itemId, Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException("Item not found"));

        Set<Item> wishlist = user.getWishlistedItems();
        boolean exists = wishlist.contains(item);
        if (exists) {
            wishlist.remove(item);
        } else {
            wishlist.add(item);
        }
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("wishlisted", !exists));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<ItemResponse>> getWishlist(Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        List<ItemResponse> response = user.getWishlistedItems().stream()
                .map(itemMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
