package com.example.lend.serviceimplementation;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.lend.service.UserService;
import com.example.lend.repository.UserRepository;
import com.example.lend.entity.User;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserServiceImplement implements UserService {
	@Autowired
	UserRepository repo;
	@Autowired
	PasswordEncoder encoder;

	public User register(User user) {
		user.setPassword(encoder.encode(user.getPassword()));
		return repo.save(user);
	}

	public User getUserByUsername(String username) {
		return repo.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
	}
}
