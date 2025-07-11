package com.stockr.be.domain.stock.controller;

import com.stockr.be.global.common.ApiResponse;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/predictions")
public class StockPredictionController {

    @GetMapping
    public ApiResponse<?> getPredictionResults() {
        try {
            // prediction_results.json 파일 경로
            Path filePath = Paths.get("predict/prediction_results.json");
            
            // 파일 내용 읽기
            String content = Files.readString(filePath);
            
            return ApiResponse.success(content);
        } catch (IOException e) {
            return ApiResponse.error("예측 결과를 불러오는데 실패했습니다.");
        }
    }
} 