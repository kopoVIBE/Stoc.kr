package com.stockr.be.community.repository;

import com.stockr.be.community.domain.Post;
import com.stockr.be.community.domain.PostLike;
import com.stockr.be.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    
    // 특정 사용자가 특정 게시글에 좋아요를 눌렀는지 확인
    Optional<PostLike> findByPostAndUser(Post post, User user);
    
    // 특정 사용자가 특정 게시글에 좋아요를 눌렀는지 존재 여부 확인
    boolean existsByPostAndUser(Post post, User user);
    
    // 특정 게시글의 좋아요 수 카운트
    long countByPost(Post post);
    
    // 특정 게시글의 좋아요 삭제
    void deleteByPostAndUser(Post post, User user);
} 