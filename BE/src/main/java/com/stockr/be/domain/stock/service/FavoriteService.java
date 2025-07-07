package com.stockr.be.domain.stock.service;

import com.stockr.be.domain.stock.entity.Favorite;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.repository.FavoriteRepository;
import com.stockr.be.domain.stock.repository.StockRepository;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import com.stockr.be.user.domain.User;
import com.stockr.be.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final StockRepository stockRepository;
    private final UserRepository userRepository;

    public List<Stock> getFavoriteStocks(Long userId) {
        log.info("Getting favorites for user {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        return favoriteRepository.findAllByUser(user)
                .stream()
                .map(Favorite::getStock)
                .collect(Collectors.toList());
    }

    public boolean isFavorite(Long userId, String ticker) {
        log.info("Checking if stock {} is favorite for user {}", ticker, userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        Stock stock = stockRepository.findByTicker(ticker)
                .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_NOT_FOUND));

        return favoriteRepository.existsByUserAndStock(user, stock);
    }

    public void addFavorite(Long userId, String ticker) {
        log.info("Adding stock {} to favorites for user {}", ticker, userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        Stock stock = stockRepository.findByTicker(ticker)
                .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_NOT_FOUND));
        
        if (favoriteRepository.existsByUserAndStock(user, stock)) {
            throw new BusinessException(ErrorCode.DUPLICATE_FAVORITE);
        }

        Favorite favorite = Favorite.builder()
                .user(user)
                .stock(stock)
                .build();
        favoriteRepository.save(favorite);
        log.info("Successfully added stock {} to favorites for user {}", ticker, userId);
    }

    public void removeFavorite(Long userId, String ticker) {
        log.info("Removing stock {} from favorites for user {}", ticker, userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        Stock stock = stockRepository.findByTicker(ticker)
                .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_NOT_FOUND));

        Favorite favorite = favoriteRepository.findByUserAndStock(user, stock)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAVORITE_NOT_FOUND));
        
        favoriteRepository.delete(favorite);
        log.info("Successfully removed stock {} from favorites for user {}", ticker, userId);
    }
} 