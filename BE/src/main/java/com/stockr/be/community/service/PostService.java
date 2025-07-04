package com.stockr.be.community.service;

import com.stockr.be.community.domain.Post;
import com.stockr.be.community.domain.PostLike;
import com.stockr.be.community.dto.FavoriteStockDto;
import com.stockr.be.community.dto.PostCreateRequestDto;
import com.stockr.be.community.dto.PostResponseDto;
import com.stockr.be.community.repository.PostLikeRepository;
import com.stockr.be.community.repository.PostRepository;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.service.FavoriteService;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import com.stockr.be.user.domain.User;
import com.stockr.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PostService {
    
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final FavoriteService favoriteService;
    
    public PostResponseDto createPost(PostCreateRequestDto requestDto, Long userId) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        
        // 닉네임이 설정되지 않은 경우 예외 발생
        if (author.getNickname() == null || author.getNickname().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.NICKNAME_NOT_SET);
        }
        
        // 관심 종목이 없으면 글 작성 불가
        List<Stock> favoriteStocks = favoriteService.getFavoriteStocks(userId);
        if (favoriteStocks.isEmpty()) {
            throw new BusinessException(ErrorCode.NO_FAVORITE_STOCKS);
        }
        
        Post post = Post.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .author(author)
                .stockCode(requestDto.getStockCode())
                .stockName(requestDto.getStockName())
                .likes(0)
                .commentCount(0)
                .build();
        
        Post savedPost = postRepository.save(post);
        return PostResponseDto.from(savedPost);
    }
    
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getAllPosts(Pageable pageable, Long userId) {
        Page<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        return posts.map(post -> {
            boolean isLiked = userId != null && postLikeRepository.existsByPostAndUser(post, 
                    userRepository.findById(userId).orElse(null));
            return PostResponseDto.from(post, isLiked);
        });
    }
    
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getPostsByStock(String stockCode, Pageable pageable, Long userId) {
        Page<Post> posts = postRepository.findByStockCodeOrderByCreatedAtDesc(stockCode, pageable);
        return posts.map(post -> {
            boolean isLiked = userId != null && postLikeRepository.existsByPostAndUser(post, 
                    userRepository.findById(userId).orElse(null));
            return PostResponseDto.from(post, isLiked);
        });
    }
    
    @Transactional(readOnly = true)
    public Page<PostResponseDto> searchPosts(String keyword, Pageable pageable, Long userId) {
        Page<Post> posts = postRepository.findByTitleOrContentContaining(keyword, pageable);
        return posts.map(post -> {
            boolean isLiked = userId != null && postLikeRepository.existsByPostAndUser(post, 
                    userRepository.findById(userId).orElse(null));
            return PostResponseDto.from(post, isLiked);
        });
    }
    
    @Transactional(readOnly = true)
    public List<FavoriteStockDto> getUserFavoriteStocks(Long userId) {
        List<Stock> favoriteStocks = favoriteService.getFavoriteStocks(userId);
        return favoriteStocks.stream()
                .map(FavoriteStockDto::from)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getPostsByUserFavoriteStocks(Pageable pageable, Long userId) {
        // 사용자의 관심 종목 코드 목록 조회
        List<Stock> favoriteStocks = favoriteService.getFavoriteStocks(userId);
        List<String> stockCodes = favoriteStocks.stream()
                .map(Stock::getTicker)
                .collect(Collectors.toList());
        
        // 관심 종목이 없으면 빈 페이지 반환
        if (stockCodes.isEmpty()) {
            return Page.empty(pageable);
        }
        
        // 관심 종목이 있는 글들만 조회 (종목 태그가 없는 글은 제외)
        Page<Post> posts = postRepository.findByStockCodeInOrderByCreatedAtDesc(stockCodes, pageable);
        
        User user = userRepository.findById(userId).orElse(null);
        return posts.map(post -> {
            boolean isLiked = user != null && postLikeRepository.existsByPostAndUser(post, user);
            log.debug("Post {} 좋아요 상태: {} (userId: {})", post.getId(), isLiked, userId);
            return PostResponseDto.from(post, isLiked);
        });
    }
    
    public PostResponseDto updatePost(Long postId, PostCreateRequestDto requestDto, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        
        // 작성자 확인
        if (!post.getAuthor().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        post.setTitle(requestDto.getTitle());
        post.setContent(requestDto.getContent());
        post.setStockCode(requestDto.getStockCode());
        post.setStockName(requestDto.getStockName());
        
        Post updatedPost = postRepository.save(post);
        boolean isLiked = postLikeRepository.existsByPostAndUser(post, post.getAuthor());
        return PostResponseDto.from(updatedPost, isLiked);
    }
    
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        
        // 작성자 확인
        if (!post.getAuthor().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        postRepository.delete(post);
    }
    
    public PostResponseDto togglePostLike(Long postId, Long userId) {
        log.info("좋아요 토글 - postId: {}, userId: {}", postId, userId);
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        
        boolean isLiked = postLikeRepository.existsByPostAndUser(post, user);
        log.info("현재 좋아요 상태: {}", isLiked);
        
        if (isLiked) {
            // 좋아요 취소
            postLikeRepository.deleteByPostAndUser(post, user);
            post.setLikes(post.getLikes() - 1);
            log.info("좋아요 취소 완료 - 새로운 좋아요 수: {}", post.getLikes());
        } else {
            // 좋아요 추가
            PostLike postLike = PostLike.builder()
                    .post(post)
                    .user(user)
                    .build();
            postLikeRepository.save(postLike);
            post.setLikes(post.getLikes() + 1);
            log.info("좋아요 추가 완료 - 새로운 좋아요 수: {}", post.getLikes());
        }
        
        Post updatedPost = postRepository.save(post);
        boolean newLikeStatus = !isLiked;
        log.info("응답 좋아요 상태: {}", newLikeStatus);
        
        return PostResponseDto.from(updatedPost, newLikeStatus);
    }
} 