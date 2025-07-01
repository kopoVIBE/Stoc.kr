package com.stockr.be.domain.stock.service;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.stockr.be.domain.stock.dto.StockPriceDto;
import com.stockr.be.domain.stock.dto.StockPriceResponse;
import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockPriceService {
    private final MongoClient mongoClient;

    private MongoCollection<Document> getCollection() {
        return mongoClient.getDatabase("stock_db").getCollection("stock_prices");
    }

    public StockPriceResponse getPrices(String ticker, String interval, LocalDate startDate, LocalDate endDate, Integer limit) {
        var collection = getCollection();
        var query = new Document("ticker", ticker)
                .append("interval", interval.toLowerCase());

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
        var cursor = collection.find(query)
                .sort(Sorts.ascending("date"));
        
        if (limit != null) {
            cursor.limit(limit);
        }

        cursor.forEach(doc -> prices.add(documentToDto(doc)));

        if (prices.isEmpty()) {
            return StockPriceResponse.builder()
                    .ticker(ticker)
                    .interval(interval)
                    .prices(List.of())
                    .meta(StockPriceResponse.MetaData.builder()
                            .totalCount(0)
                            .build())
                    .build();
        }

        var meta = StockPriceResponse.MetaData.builder()
                .totalCount(prices.size())
                .startDate(prices.get(0).getDate().toString())
                .endDate(prices.get(prices.size() - 1).getDate().toString())
                .build();

        return StockPriceResponse.builder()
                .ticker(ticker)
                .interval(interval)
                .prices(prices)
                .meta(meta)
                .build();
    }

    public StockPriceResponse getPriceByDate(String ticker, String interval, LocalDate date) {
        var collection = getCollection();
        var query = new Document("ticker", ticker)
                .append("interval", interval.toLowerCase())
                .append("date", new Document("$gte", date.atStartOfDay())
                        .append("$lt", date.plusDays(1).atStartOfDay()));

        var doc = collection.find(query).first();
        var prices = new ArrayList<StockPriceDto>();
        if (doc != null) {
            prices.add(documentToDto(doc));
        }

        var meta = StockPriceResponse.MetaData.builder()
                .totalCount(prices.size())
                .startDate(date.toString())
                .endDate(date.toString())
                .build();

        return StockPriceResponse.builder()
                .ticker(ticker)
                .interval(interval)
                .prices(prices)
                .meta(meta)
                .build();
    }

    public List<StockPriceResponse> getLatestPrices(List<String> tickers) {
        var collection = getCollection();
        var responses = new ArrayList<StockPriceResponse>();

        for (String ticker : tickers) {
            var query = new Document("ticker", ticker)
                    .append("interval", "daily");
            
            var doc = collection.find(query)
                    .sort(Sorts.descending("date"))
                    .first();

            if (doc != null) {
                var prices = List.of(documentToDto(doc));
                var meta = StockPriceResponse.MetaData.builder()
                        .totalCount(1)
                        .startDate(doc.getDate("date").toString())
                        .endDate(doc.getDate("date").toString())
                        .build();

                responses.add(StockPriceResponse.builder()
                        .ticker(ticker)
                        .interval("daily")
                        .prices(prices)
                        .meta(meta)
                        .build());
            }
        }

        return responses;
    }

    public RealtimeStockPriceDto handleRealtimePrice(RealtimeStockPriceDto priceData) {
        // 실시간 가격 데이터 처리 및 반환
        return priceData;
    }

    private StockPriceDto documentToDto(Document doc) {
        return StockPriceDto.builder()
                .ticker(doc.getString("ticker"))
                .date(doc.getDate("date").toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                .interval(doc.getString("interval"))
                .open(doc.getDouble("open"))
                .high(doc.getDouble("high"))
                .low(doc.getDouble("low"))
                .close(doc.getDouble("close"))
                .volume(doc.getDouble("volume"))
                .build();
    }
}