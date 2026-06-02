package com.example.lend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simple in-memory rate limiter using a fixed window approach.
 * Protects login, signup, and booking creation endpoints.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    // Rate limit configurations: path prefix -> (maxRequests, windowMs)
    private static final Map<String, int[]> RATE_LIMITS = Map.of(
        "/auth/login", new int[]{10, 60000},       // 10 req/min
        "/auth/google", new int[]{10, 60000},       // 10 req/min
        "/users/register", new int[]{5, 60000},     // 5 req/min
        "/auth/resend-otp", new int[]{3, 60000}     // 3 req/min
    );

    // Booking rate limit applied only for POST
    private static final int BOOKING_MAX = 20;
    private static final int BOOKING_WINDOW = 60000;

    // key: "IP:path" -> bucket
    private final ConcurrentHashMap<String, RateBucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = getClientIp(request);

        // Check rate limits for specific endpoints
        int[] limit = null;
        String bucketKey = null;

        for (Map.Entry<String, int[]> entry : RATE_LIMITS.entrySet()) {
            if (path.equals(entry.getKey()) && "POST".equalsIgnoreCase(method)) {
                limit = entry.getValue();
                bucketKey = clientIp + ":" + entry.getKey();
                break;
            }
        }

        // Check booking creation rate limit
        if (limit == null && "/bookings".equals(path) && "POST".equalsIgnoreCase(method)) {
            limit = new int[]{BOOKING_MAX, BOOKING_WINDOW};
            bucketKey = clientIp + ":/bookings";
        }

        if (limit != null && bucketKey != null) {
            final int[] finalLimit = limit;
            RateBucket bucket = buckets.computeIfAbsent(bucketKey,
                    k -> new RateBucket(finalLimit[0], finalLimit[1]));

            if (!bucket.tryConsume()) {
                logger.warn("Rate limit exceeded for IP {} on path {}", clientIp, path);
                response.setStatus(429);
                response.setContentType("application/json");
                response.setHeader("Retry-After", String.valueOf(bucket.getRetryAfterSeconds()));
                response.setHeader("X-RateLimit-Remaining", "0");
                response.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }

            response.setHeader("X-RateLimit-Remaining", String.valueOf(bucket.getRemaining()));
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    /**
     * Simple fixed-window rate bucket.
     */
    private static class RateBucket {
        private final int maxRequests;
        private final long windowMs;
        private final AtomicInteger count = new AtomicInteger(0);
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());

        RateBucket(int maxRequests, long windowMs) {
            this.maxRequests = maxRequests;
            this.windowMs = windowMs;
        }

        synchronized boolean tryConsume() {
            long now = System.currentTimeMillis();
            if (now - windowStart.get() > windowMs) {
                // Reset window
                windowStart.set(now);
                count.set(1);
                return true;
            }
            return count.incrementAndGet() <= maxRequests;
        }

        int getRemaining() {
            return Math.max(0, maxRequests - count.get());
        }

        int getRetryAfterSeconds() {
            long elapsed = System.currentTimeMillis() - windowStart.get();
            return (int) Math.max(1, (windowMs - elapsed) / 1000);
        }
    }
}
