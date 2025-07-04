package com.stockr.be.community.repository;

import com.stockr.be.community.domain.Post;
import com.stockr.be.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    
    // 모든 게시글을 최신순으로 조회
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // 특정 종목 태그로 게시글 조회
    Page<Post> findByStockCodeOrderByCreatedAtDesc(String stockCode, Pageable pageable);
    
    // 제목 또는 내용에 키워드가 포함된 게시글 검색
    @Query("SELECT p FROM Post p WHERE p.title LIKE %:keyword% OR p.content LIKE %:keyword% ORDER BY p.createdAt DESC")
    Page<Post> findByTitleOrContentContaining(@Param("keyword") String keyword, Pageable pageable);
    
    // 특정 사용자가 작성한 게시글 조회
    Page<Post> findByAuthorOrderByCreatedAtDesc(User author, Pageable pageable);
    
    // 특정 종목들의 게시글 조회 (사용자 관심 종목 기반)
    Page<Post> findByStockCodeInOrderByCreatedAtDesc(List<String> stockCodes, Pageable pageable);
    
    // 관심 종목의 게시글 + 종목 태그가 없는 게시글 조회
    Page<Post> findByStockCodeInOrStockCodeIsNullOrderByCreatedAtDesc(List<String> stockCodes, Pageable pageable);
} 