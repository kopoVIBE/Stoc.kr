package com.stockr.be.domain.stock.repository;

import com.stockr.be.domain.stock.entity.Favorite;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    @Query("SELECT f FROM Favorite f JOIN FETCH f.stock WHERE f.user = :user")
    List<Favorite> findAllByUser(@Param("user") User user);
    
    Optional<Favorite> findByUserAndStock(User user, Stock stock);
    
    boolean existsByUserAndStock(User user, Stock stock);
} 