package com.stockr.be.domain.trade.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockr.be.global.config.KISConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KISTestService {
    
    private final WebClient kisWebClient;
    private final KISConfig kisConfig;
    private final ObjectMapper objectMapper;
    
    public String testTokenGeneration() {
        try {
            // 1. 요청 바디 생성
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("grant_type", "client_credentials");
            requestBody.put("appkey", kisConfig.getVirtual().getKey());
            requestBody.put("appsecret", kisConfig.getVirtual().getSecret());
            
            // 2. 토큰 발급 요청
            String response = kisWebClient.post()
                    .uri("/oauth2/tokenP")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromValue(requestBody))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            // JSON 파싱하여 예쁘게 출력
            JsonNode jsonResponse = objectMapper.readTree(response);
            log.info("Token Response: {}", objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonResponse));
            
            return "Token generation test completed. Check logs for details.";
            
        } catch (Exception e) {
            log.error("Token generation test failed", e);
            return "Token generation test failed: " + e.getMessage();
        }
    }
    
    public String testBalanceInquiry() {
        try {
            // 1. 토큰 발급
            Map<String, String> tokenRequest = new HashMap<>();
            tokenRequest.put("grant_type", "client_credentials");
            tokenRequest.put("appkey", kisConfig.getVirtual().getKey());
            tokenRequest.put("appsecret", kisConfig.getVirtual().getSecret());
            
            String tokenResponse = kisWebClient.post()
                    .uri("/oauth2/tokenP")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromValue(tokenRequest))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            // JSON 파싱하여 access_token 추출
            JsonNode tokenJson = objectMapper.readTree(tokenResponse);
            String accessToken = tokenJson.get("access_token").asText();
            
            // 2. 잔고조회 요청
            String response = kisWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/uapi/domestic-stock/v1/trading/inquire-balance")
                            .queryParam("CANO", kisConfig.getVirtual().getAccount())
                            .queryParam("ACNT_PRDT_CD", kisConfig.getVirtual().getProductCode())
                            .queryParam("AFHR_FLPR_YN", "N")
                            .queryParam("OFL_YN", "")
                            .queryParam("INQR_DVSN", "01")
                            .queryParam("UNPR_DVSN", "01")
                            .queryParam("FUND_STTL_ICLD_YN", "N")
                            .queryParam("FNCG_AMT_AUTO_RDPT_YN", "N")
                            .queryParam("PRCS_DVSN", "01")
                            .queryParam("CTX_AREA_FK100", "")
                            .queryParam("CTX_AREA_NK100", "")
                            .build())
                    .header("authorization", "Bearer " + accessToken)
                    .header("appkey", kisConfig.getVirtual().getKey())
                    .header("appsecret", kisConfig.getVirtual().getSecret())
                    .header("tr_id", "VTTC8434R") // 모의투자 잔고조회 TR ID
                    .header("tr_cont", "") // 연속 조회 여부
                    .header("custtype", "P") // 고객타입 (개인)
                    .header("seq_no", "01") // 일련번호
                    .header("mac_address", "") // MAC 주소
                    .header("phone_number", "01012341234") // 핸드폰 번호
                    .header("ip_addr", "127.0.0.1") // IP 주소
                    .header("hashkey", "") // 해시키
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            // 원본 응답 로깅
            log.info("Raw Balance Response: {}", response);
            
            // JSON 파싱하여 예쁘게 출력
            JsonNode jsonResponse = objectMapper.readTree(response);
            log.info("Parsed Balance Response: \n{}", 
                    objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonResponse));
            
            // 응답 분석
            StringBuilder result = new StringBuilder();
            result.append("===== 계좌 잔고 조회 결과 =====\n");
            
            // 응답 상태 확인
            if (jsonResponse.has("rt_cd")) {
                String rtCd = jsonResponse.get("rt_cd").asText();
                String msg = jsonResponse.has("msg_cd") ? 
                           jsonResponse.get("msg_cd").asText() + ": " + 
                           jsonResponse.get("msg1").asText() : 
                           "메시지 없음";
                
                result.append(String.format("응답 코드: %s\n", rtCd));
                result.append(String.format("응답 메시지: %s\n\n", msg));
                
                if (!"0".equals(rtCd)) {
                    return result.toString(); // 에러인 경우 여기서 종료
                }
            }
            
            // output1 (계좌 요약정보) 처리
            if (jsonResponse.has("output1") && !jsonResponse.get("output1").isNull()) {
                JsonNode output1 = jsonResponse.get("output1");
                result.append("## 계좌 요약 ##\n");
                result.append(String.format("계좌번호: %s\n", kisConfig.getVirtual().getAccount()));
                
                // null 체크를 하면서 안전하게 값을 가져옴
                String totEvluAmt = getNodeTextSafely(output1, "tot_evlu_amt", "0");
                String pchsAmtSmtl = getNodeTextSafely(output1, "pchs_amt_smtl", "0");
                String evluPflsSmtl = getNodeTextSafely(output1, "evlu_pfls_smtl", "0");
                
                result.append(String.format("총평가금액: %s원\n", totEvluAmt));
                result.append(String.format("매입금액: %s원\n", pchsAmtSmtl));
                result.append(String.format("평가손익금액: %s원\n", evluPflsSmtl));
            }
            
            // output2 (보유종목 상세) 처리
            if (jsonResponse.has("output2") && !jsonResponse.get("output2").isNull() && jsonResponse.get("output2").isArray()) {
                JsonNode output2 = jsonResponse.get("output2");
                if (output2.size() > 0) {
                    result.append("\n## 보유종목 상세 ##\n");
                    for (JsonNode stock : output2) {
                        String prdtName = getNodeTextSafely(stock, "prdt_name", "알 수 없음");
                        String hldgQty = getNodeTextSafely(stock, "hldg_qty", "0");
                        String prpr = getNodeTextSafely(stock, "prpr", "0");
                        String evluAmt = getNodeTextSafely(stock, "evlu_amt", "0");
                        
                        result.append(String.format("- %s (%s주): 현재가 %s원, 평가금액 %s원\n",
                                prdtName, hldgQty, prpr, evluAmt));
                    }
                } else {
                    result.append("\n보유종목 없음\n");
                }
            }
            
            return result.toString();
            
        } catch (Exception e) {
            log.error("Balance inquiry test failed", e);
            return "Balance inquiry test failed: " + e.getMessage();
        }
    }
    
    private String getNodeTextSafely(JsonNode node, String fieldName, String defaultValue) {
        JsonNode fieldNode = node.get(fieldName);
        return (fieldNode != null && !fieldNode.isNull()) ? fieldNode.asText() : defaultValue;
    }
} 