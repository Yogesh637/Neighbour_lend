package com.example.lend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.lend.entity.Review;
import com.example.lend.service.ReviewService;

@RestController
@RequestMapping("/reviews")
public class ReviewController {
	@Autowired
	private ReviewService service;

	@PostMapping
	public Review save(@RequestBody Review review) {
		return service.save(review);
	}
}
