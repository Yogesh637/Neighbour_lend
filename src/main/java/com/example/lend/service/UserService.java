package com.example.lend.service;

import com.example.lend.entity.User;

public interface UserService {
	User register(User user);

	User getUserByUsername(String username);
}
