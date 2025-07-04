package com.stockr.be.community.controller;

import com.stockr.be.community.dto.*;
import com.stockr.be.community.service.CommentService;
import com.stockr.be.community.service.PostService;
import com.stockr.be.global.common.ApiResponse;
import com.stockr.be.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {
    
    private final PostService postService;
    private final CommentService commentService;
    
    // ===== 게시글 관련 API =====
    
    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<PostResponseDto>> createPost(
            @Valid @RequestBody PostCreateRequestDto requestDto,
            @AuthenticationPrincipal User user) {
        log.info("Creating post by user: {}", user.getUserId());
        PostResponseDto response = postService.createPost(requestDto, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<PostResponseDto>>> getAllPosts(
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : null;
        Page<PostResponseDto> posts = postService.getAllPosts(pageable, userId);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }
    
    @GetMapping("/posts/my-interests")
    public ResponseEntity<ApiResponse<Page<PostResponseDto>>> getPostsByUserFavoriteStocks(
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal User user) {
        log.info("관심 종목 게시글 조회 - userId: {}, userNickname: {}", 
                user.getUserId(), user.getNickname());
        Page<PostResponseDto> posts = postService.getPostsByUserFavoriteStocks(pageable, user.getUserId());
        log.info("관심 종목 게시글 조회 완료 - 총 {}개 게시글", posts.getContent().size());
        
        // 첫 번째 게시글의 좋아요 상태 로그
        if (!posts.getContent().isEmpty()) {
            PostResponseDto firstPost = posts.getContent().get(0);
            log.info("첫 번째 게시글 좋아요 상태 - postId: {}, isLikedByUser: {}, likes: {}", 
                    firstPost.getId(), firstPost.isLikedByUser(), firstPost.getLikes());
        }
        
        return ResponseEntity.ok(ApiResponse.success(posts));
    }
    
    @GetMapping("/posts/stock/{stockCode}")
    public ResponseEntity<ApiResponse<Page<PostResponseDto>>> getPostsByStock(
            @PathVariable String stockCode,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : null;
        Page<PostResponseDto> posts = postService.getPostsByStock(stockCode, pageable, userId);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }
    
    @GetMapping("/posts/search")
    public ResponseEntity<ApiResponse<Page<PostResponseDto>>> searchPosts(
            @RequestParam String keyword,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : null;
        Page<PostResponseDto> posts = postService.searchPosts(keyword, pageable, userId);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }
    
    @GetMapping("/user/favorite-stocks")
    public ResponseEntity<ApiResponse<List<FavoriteStockDto>>> getUserFavoriteStocks(
            @AuthenticationPrincipal User user) {
        List<FavoriteStockDto> favoriteStocks = postService.getUserFavoriteStocks(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(favoriteStocks));
    }
    
    @PutMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<PostResponseDto>> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody PostCreateRequestDto requestDto,
            @AuthenticationPrincipal User user) {
        log.info("Updating post {} by user: {}", postId, user.getUserId());
        PostResponseDto response = postService.updatePost(postId, requestDto, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal User user) {
        log.info("Deleting post {} by user: {}", postId, user.getUserId());
        postService.deletePost(postId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<PostResponseDto>> togglePostLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal User user) {
        log.info("좋아요 토글 요청 - postId: {}, userId: {}, userNickname: {}", 
                postId, user.getUserId(), user.getNickname());
        PostResponseDto response = postService.togglePostLike(postId, user.getUserId());
        log.info("좋아요 토글 응답 - isLikedByUser: {}, likes: {}", 
                response.isLikedByUser(), response.getLikes());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    // ===== 댓글 관련 API =====
    
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponseDto>> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateRequestDto requestDto,
            @AuthenticationPrincipal User user) {
        log.info("Creating comment for post {} by user: {}", postId, user.getUserId());
        CommentResponseDto response = commentService.createComment(postId, requestDto, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponseDto>>> getCommentsByPost(
            @PathVariable Long postId) {
        List<CommentResponseDto> comments = commentService.getCommentsByPost(postId);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }
    
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponseDto>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentCreateRequestDto requestDto,
            @AuthenticationPrincipal User user) {
        log.info("Updating comment {} by user: {}", commentId, user.getUserId());
        CommentResponseDto response = commentService.updateComment(commentId, requestDto, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user) {
        log.info("Deleting comment {} by user: {}", commentId, user.getUserId());
        commentService.deleteComment(commentId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
} 