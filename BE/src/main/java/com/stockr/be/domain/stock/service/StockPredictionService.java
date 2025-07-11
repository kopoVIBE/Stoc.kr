package com.stockr.be.domain.stock.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockr.be.domain.stock.dto.StockPredictionResponseDto;
import com.stockr.be.domain.stock.entity.StockPrediction;
import com.stockr.be.domain.stock.repository.StockPredictionRepository;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StockPredictionService {
    private final StockPredictionRepository predictionRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public StockPredictionResponseDto getPrediction(String stockCode) {
        StockPrediction prediction = predictionRepository.findLatestByStockCode(stockCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.PREDICTION_NOT_FOUND));
        return new StockPredictionResponseDto(prediction);
    }

    @Scheduled(cron = "0 */10 9-16 * * MON-FRI")  // 주중 9시-16시 사이 10분마다 실행
    @Transactional
    public void updatePredictions() {
        try {
            // prediction_results.json 파일 읽기
            File file = new File("BE/predict/prediction_results.json");
            if (!file.exists()) {
                return;
            }

            // JSON 파일 파싱
            List<Map<String, Object>> predictions = objectMapper.readValue(file, new TypeReference<>() {});

            // 각 예측 결과를 DB에 저장
            for (Map<String, Object> predictionData : predictions) {
                String stockCode = (String) predictionData.get("stock_code");
                Integer prediction = (Integer) predictionData.get("prediction");
                String predictedAtStr = (String) predictionData.get("predicted_at");
                
                LocalDateTime predictedAt = LocalDateTime.parse(predictedAtStr, 
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

                StockPrediction stockPrediction = new StockPrediction(stockCode, prediction, predictedAt);
                predictionRepository.save(stockPrediction);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
} 