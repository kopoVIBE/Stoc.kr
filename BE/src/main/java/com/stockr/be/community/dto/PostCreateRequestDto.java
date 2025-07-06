package com.stockr.be.community.dto;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Getter
@Setter
public class PostCreateRequestDto {
    
    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 200, message = "제목은 200자 이하로 작성해주세요.")
    private String title;
    
    @NotBlank(message = "내용은 필수입니다.")
    private String content;
    
    private String stockCode;  // 선택한 종목 코드
    private String stockName;  // 선택한 종목명
} 