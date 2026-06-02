package com.example.lend.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.lend.dto.request.UserRegisterRequest;
import com.example.lend.dto.response.UserResponse;
import com.example.lend.entity.User;
import com.example.lend.mapper.UserMapper;
import com.example.lend.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService service;

    @Autowired
    private UserMapper userMapper;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        User userEntity = userMapper.toEntity(request);
        User registeredUser = service.register(userEntity);
        UserResponse response = userMapper.toResponse(registeredUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
