package com.stockr.be.community.repository;

import com.stockr.be.community.domain.Comment;
import com.stockr.be.community.domain.Post;
import com.stockr.be.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    // 특정 게시글의 댓글을 최신순으로 조회
    List<Comment> findByPostOrderByCreatedAtAsc(Post post);
    
    // 특정 게시글의 댓글을 페이징으로 조회
    Page<Comment> findByPostOrderByCreatedAtAsc(Post post, Pageable pageable);
    
    // 특정 사용자가 작성한 댓글 조회
    Page<Comment> findByAuthorOrderByCreatedAtDesc(User author, Pageable pageable);
    
    // 특정 게시글의 댓글 수 카운트
    long countByPost(Post post);
} 