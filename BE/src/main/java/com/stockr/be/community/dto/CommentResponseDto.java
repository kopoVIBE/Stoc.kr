package com.stockr.be.community.dto;

import com.stockr.be.community.domain.Comment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentResponseDto {
    
    private Long id;
    private String content;
    private String authorNickname;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static CommentResponseDto from(Comment comment) {
        String nickname = comment.getAuthor().getNickname();
        if (nickname == null || nickname.trim().isEmpty()) {
            nickname = "익명사용자"; // 혹시나 하는 방어코드
        }
        
        return CommentResponseDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorNickname(nickname)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
} 