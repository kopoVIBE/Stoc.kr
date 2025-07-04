package com.stockr.be.community.dto;

import com.stockr.be.community.domain.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostResponseDto {
    
    private Long id;
    private String title;
    private String content;
    private String authorNickname;
    private String stockCode;
    private String stockName;
    private Integer likes;
    private Integer commentCount;
    private boolean isLikedByUser;  // 현재 사용자가 좋아요 눌렀는지 여부
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static PostResponseDto from(Post post, boolean isLikedByUser) {
        String nickname = post.getAuthor().getNickname();
        if (nickname == null || nickname.trim().isEmpty()) {
            nickname = "익명사용자"; // 혹시나 하는 방어코드
        }
        
        return PostResponseDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .authorNickname(nickname)
                .stockCode(post.getStockCode())
                .stockName(post.getStockName())
                .likes(post.getLikes())
                .commentCount(post.getCommentCount())
                .isLikedByUser(isLikedByUser)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
    
    public static PostResponseDto from(Post post) {
        return from(post, false);
    }
} 