package com.stockr.be.community.dto;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class CommentCreateRequestDto {
    
    @NotBlank(message = "댓글 내용은 필수입니다.")
    private String content;
} 