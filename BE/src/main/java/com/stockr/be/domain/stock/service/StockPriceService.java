package com.stockr.be.domain.stock.service;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.stockr.be.domain.stock.dto.StockPriceDto;
import com.stockr.be.domain.stock.dto.StockPriceResponse;
import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import com.stockr.be.domain.stock.dto.StockFinancialRatioDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.json.JSONObject;
import org.json.JSONArray;
import lombok.extern.slf4j.Slf4j;
import java.time.Duration;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockPriceService {
    private final MongoClient mongoClient;
    private final RestTemplate restTemplate;
    private final RedisTemplate<String, String> redisTemplate;
    private static final String KOREA_INVESTMENT_API_URL = "https://openapi.koreainvestment.com:9443";
    private static final String KIS_TOKEN_KEY = "kis_token";
    private final ObjectMapper objectMapper = new ObjectMapper();

    private MongoCollection<Document> getCollection() {
        return mongoClient.getDatabase("stockr").getCollection("stock_prices");
    }

    public StockPriceResponse getPrices(String ticker, String interval, LocalDate startDate, LocalDate endDate,
            Integer limit) {
        var collection = getCollection();
        var query = new Document("ticker", ticker).append("interval", interval.toLowerCase());

        if (startDate != null || endDate != null) {
            var dateQuery = new Document();
            if (startDate != null) {
                dateQuery.append("$gte", startDate.atStartOfDay());
            }
            if (endDate != null) {
                dateQuery.append("$lte", endDate.plusDays(1).atStartOfDay());
            }
            query.append("date", dateQuery);
        }

        var prices = new ArrayList<StockPriceDto>();
        var cursor = collection.find(query).sort(Sorts.ascending("date"));

        if (limit != null) {
            cursor.limit(limit);
        }

        cursor.forEach(doc -> prices.add(documentToDto(doc)));

        if (prices.isEmpty()) {
            return StockPriceResponse.builder().ticker(ticker).interval(interval).prices(List.of())
                    .meta(StockPriceResponse.MetaData.builder().totalCount(0).build()).build();
        }

        var meta = StockPriceResponse.MetaData.builder().totalCount(prices.size())
                .startDate(prices.get(0).getDate().toString())
                .endDate(prices.get(prices.size() - 1).getDate().toString()).build();

        return StockPriceResponse.builder().ticker(ticker).interval(interval).prices(prices).meta(meta).build();
    }

    public StockPriceResponse getPriceByDate(String ticker, String interval, LocalDate date) {
        var collection = getCollection();
        var query = new Document("ticker", ticker).append("interval", interval.toLowerCase()).append("date",
                new Document("$gte", date.atStartOfDay()).append("$lt", date.plusDays(1).atStartOfDay()));

        var doc = collection.find(query).first();
        var prices = new ArrayList<StockPriceDto>();
        if (doc != null) {
            prices.add(documentToDto(doc));
        }

        var meta = StockPriceResponse.MetaData.builder().totalCount(prices.size()).startDate(date.toString())
                .endDate(date.toString()).build();

        return StockPriceResponse.builder().ticker(ticker).interval(interval).prices(prices).meta(meta).build();
    }

    public List<StockPriceResponse> getLatestPrices(List<String> tickers) {
        var collection = getCollection();
        var responses = new ArrayList<StockPriceResponse>();

        for (String ticker : tickers) {
            var query = new Document("ticker", ticker).append("interval", "daily");

            var doc = collection.find(query).sort(Sorts.descending("date")).first();

            if (doc != null) {
                var prices = List.of(documentToDto(doc));
                var meta = StockPriceResponse.MetaData.builder().totalCount(1).startDate(doc.getDate("date").toString())
                        .endDate(doc.getDate("date").toString()).build();

                responses.add(StockPriceResponse.builder().ticker(ticker).interval("daily").prices(prices).meta(meta)
                        .build());
            }
        }

        return responses;
    }

    public RealtimeStockPriceDto handleRealtimePrice(RealtimeStockPriceDto priceData) {
        try {
            // Redis에 데이터 저장
            String key = "stock:realtime:" + priceData.getStockCode();
            String jsonData = objectMapper.writeValueAsString(priceData);

            // Redis에 저장 (TTL: 1시간)
            redisTemplate.opsForValue().set(key, jsonData, Duration.ofHours(1));

            // 최근 N개의 가격 데이터를 리스트로 저장
            String listKey = "stock:history:" + priceData.getStockCode();
            redisTemplate.opsForList().leftPush(listKey, jsonData);
            redisTemplate.opsForList().trim(listKey, 0, 99); // 최근 100개만 유지

            return priceData;
        } catch (Exception e) {
            log.error("실시간 주가 데이터 저장 중 오류 발생: ", e);
            return priceData;
        }
    }

    public StockFinancialRatioDto getFinancialRatio(String ticker, String appKey, String appSecret) {
        String accessToken = getValidAccessToken();

        // 1. 재무비율 API 호출
        String url = KOREA_INVESTMENT_API_URL + "/uapi/domestic-stock/v1/finance/financial-ratio";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("authorization", "Bearer " + accessToken);
        headers.set("appkey", appKey);
        headers.set("appsecret", appSecret);
        headers.set("tr_id", "FHKST66430300");
        headers.set("custtype", "P");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        String fullUrl = url + "?FID_DIV_CLS_CODE=0&fid_cond_mrkt_div_code=J&fid_input_iscd=" + ticker;

        ResponseEntity<String> response = restTemplate.exchange(fullUrl, HttpMethod.GET, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            JSONObject jsonResponse = new JSONObject(response.getBody());
            JSONArray output = jsonResponse.optJSONArray("output");

            if (output != null && !output.isEmpty()) {
                JSONObject data = output.getJSONObject(0);

                double eps = parseDoubleSafe(data, "eps");
                double bps = parseDoubleSafe(data, "bps");
                double sps = parseDoubleSafe(data, "sps");
                double roe = parseDoubleSafe(data, "roe_val");

                // 2. 현재가 API 호출
                double price = getCurrentPrice(ticker, accessToken, appKey, appSecret);

                // 3. 직접 계산
                Double per = (eps != 0) ? price / eps : null;
                Double pbr = (bps != 0) ? price / bps : null;
                Double psr = (sps != 0) ? price / sps : null;

                return StockFinancialRatioDto.builder()
                        .ticker(ticker)
                        .date(LocalDate.now().toString())
                        .per(per)
                        .pbr(pbr)
                        .psr(psr)
                        .eps(eps)
                        .bps(bps)
                        .roe(roe)
                        .price(price)
                        .build();
            }
        }

        return null;
    }

    private String getValidAccessToken() {
        String tokenJson = redisTemplate.opsForValue().get(KIS_TOKEN_KEY);
        if (tokenJson == null) {
            throw new RuntimeException("KIS API 토큰이 없습니다.");
        }

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode tokenData = objectMapper.readTree(tokenJson);

            String accessToken = tokenData.get("access_token").asText();
            LocalDateTime expiresAt = LocalDateTime.parse(tokenData.get("expires_at").asText());

            if (LocalDateTime.now().isAfter(expiresAt)) {
                throw new RuntimeException("KIS API 토큰이 만료되었습니다.");
            }

            return accessToken;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("토큰 데이터 파싱 중 오류가 발생했습니다.", e);
        }
    }

    private double getCurrentPrice(String ticker, String accessToken, String appKey, String appSecret) {
        String url = KOREA_INVESTMENT_API_URL + "/uapi/domestic-stock/v1/quotations/inquire-price";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("authorization", "Bearer " + accessToken);
        headers.set("appkey", appKey);
        headers.set("appsecret", appSecret);
        headers.set("tr_id", "FHKST01010100");
        headers.set("custtype", "P");

        HttpEntity<String> entity = new HttpEntity<>(headers);
        String fullUrl = url + "?fid_cond_mrkt_div_code=J&fid_input_iscd=" + ticker;

        ResponseEntity<String> response = restTemplate.exchange(fullUrl, HttpMethod.GET, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            JSONObject json = new JSONObject(response.getBody());
            JSONObject output = json.optJSONObject("output");
            return output != null ? output.optDouble("stck_prpr", 0.0) : 0.0;
        }

        return 0.0;
    }

    private double parseDoubleSafe(JSONObject json, String key) {
        try {
            return Double.parseDouble(json.optString(key, "0").replaceAll(",", ""));
        } catch (Exception e) {
            return 0.0;
        }
    }

    private StockPriceDto documentToDto(Document doc) {
        return StockPriceDto.builder().ticker(doc.getString("ticker"))
                .date(doc.getDate("date").toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                .interval(doc.getString("interval")).open(doc.getDouble("open")).high(doc.getDouble("high"))
                .low(doc.getDouble("low")).close(doc.getDouble("close")).volume(doc.getDouble("volume")).build();
    }

    // 최신 가격 조회
    public RealtimeStockPriceDto getLatestPrice(String stockCode) {
        try {
            String key = "stock:realtime:" + stockCode;
            String jsonData = redisTemplate.opsForValue().get(key);
            log.debug("Redis key: {}, value: {}", key, jsonData);
            if (jsonData != null) {
                // 앞뒤 큰따옴표 제거
                if (jsonData.startsWith("\"") && jsonData.endsWith("\"")) {
                    jsonData = jsonData.substring(1, jsonData.length() - 1);
                }
                RealtimeStockPriceDto dto = objectMapper.readValue(jsonData, RealtimeStockPriceDto.class);
                log.debug("Parsed DTO: {}", dto);
                return dto;
            }
            return null;
        } catch (Exception e) {
            log.error("실시간 주가 데이터 조회 중 오류 발생: ", e);
            return null;
        }
    }

    // 최근 이력 조회
    public List<RealtimeStockPriceDto> getPriceHistory(String stockCode) {
        try {
            String listKey = "stock:history:" + stockCode;
            List<String> jsonList = redisTemplate.opsForList().range(listKey, 0, -1);
            if (jsonList != null) {
                return jsonList.stream()
                        .map(json -> {
                            try {
                                return objectMapper.readValue(json, RealtimeStockPriceDto.class);
                            } catch (Exception e) {
                                log.error("JSON 파싱 중 오류 발생: ", e);
                                return null;
                            }
                        })
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
            }
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("주가 이력 데이터 조회 중 오류 발생: ", e);
            return new ArrayList<>();
        }
    }
}
