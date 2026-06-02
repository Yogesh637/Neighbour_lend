package com.example.lend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.lend.service.ReviewService;
import com.example.lend.entity.Review;
import com.example.lend.repository.ReviewRepository;

@Service
public class ReviewServiceImpl implements ReviewService {

    @Autowired
    private ReviewRepository repo;

    @Override
    public Review save(Review review) {
        return repo.save(review);
    }
}
