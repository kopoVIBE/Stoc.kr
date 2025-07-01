package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.service.FavoriteService;
import com.stockr.be.global.common.ApiResponse;
import com.stockr.be.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {
    private final FavoriteService favoriteService;

    @GetMapping(produces = "application/json")
    public ResponseEntity<ApiResponse<List<Stock>>> getFavorites(@AuthenticationPrincipal User user) {
        log.info("Getting favorites for user: {}", user.getUserId());
        List<Stock> favorites = favoriteService.getFavoriteStocks(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(favorites));
    }

    @GetMapping(value = "/{ticker}", produces = "application/json")
    public ResponseEntity<ApiResponse<Boolean>> isFavorite(
            @AuthenticationPrincipal User user,
            @PathVariable String ticker) {
        log.info("Checking if ticker '{}' is favorite for user: {}", ticker, user.getUserId());
        boolean isFavorite = favoriteService.isFavorite(user.getUserId(), ticker);
        return ResponseEntity.ok(ApiResponse.success(isFavorite));
    }

    @PostMapping(value = "/{ticker}", produces = "application/json")
    public ResponseEntity<ApiResponse<Void>> addFavorite(
            @AuthenticationPrincipal User user,
            @PathVariable String ticker) {
        log.info("Adding ticker '{}' to favorites for user: {}", ticker, user.getUserId());
        favoriteService.addFavorite(user.getUserId(), ticker);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping(value = "/{ticker}", produces = "application/json")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @AuthenticationPrincipal User user,
            @PathVariable String ticker) {
        log.info("Removing ticker '{}' from favorites for user: {}", ticker, user.getUserId());
        favoriteService.removeFavorite(user.getUserId(), ticker);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
} 