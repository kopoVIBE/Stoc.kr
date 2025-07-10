package com.stockr.be.community.dto;

import com.stockr.be.community.domain.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponseDto {
    private Long id;
    private String title;
    private String content;
    private String author;
    private LocalDateTime createdAt;
    private LocalDateTime lastCommentTime;
    private Integer likes;
    private Integer commentCount;
    private String stockCode;
    private String stockName;
    private boolean isLikedByUser;

    public static PostResponseDto from(Post post) {
        return PostResponseDto.builder()
            .id(post.getId())
            .title(post.getTitle())
            .content(post.getContent())
            .author(post.getAuthor().getNickname())
            .createdAt(post.getCreatedAt())
            .lastCommentTime(post.getLastCommentTime())
            .likes(post.getLikes())
            .commentCount(post.getCommentCount())
            .stockCode(post.getStockCode())
            .stockName(post.getStockName())
            .isLikedByUser(false)
            .build();
    }

    public static PostResponseDto from(Post post, boolean isLikedByUser) {
        return PostResponseDto.builder()
            .id(post.getId())
            .title(post.getTitle())
            .content(post.getContent())
            .author(post.getAuthor().getNickname())
            .createdAt(post.getCreatedAt())
            .lastCommentTime(post.getLastCommentTime())
            .likes(post.getLikes())
            .commentCount(post.getCommentCount())
            .stockCode(post.getStockCode())
            .stockName(post.getStockName())
            .isLikedByUser(isLikedByUser)
            .build();
    }
} 