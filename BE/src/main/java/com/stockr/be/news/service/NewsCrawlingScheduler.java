package com.stockr.be.news.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.File;

@Slf4j
@Component
public class NewsCrawlingScheduler {

    /**
     * 뉴스 크롤러 실행
     * cron: 초 분 시 일 월 요일
     * 현재 설정: 매 42분마다 실행
     */
    @Scheduled(cron = "0 9 * * * *")
    public void runCrawler() {
        try {
            log.info("🕒 뉴스 크롤러 실행 시작");

            // EC2 환경에 맞는 경로 설정
            String crawlerPath = "crawler/ec2-setup/ec2-news-crawler.py";
            
            ProcessBuilder pb = new ProcessBuilder("python3", crawlerPath);
            pb.redirectErrorStream(true);
            
            // 작업 디렉토리 설정 (Spring Boot 애플리케이션 루트)
            pb.directory(new File("."));
            
            Process process = pb.start();

            // 실행 결과 로그 출력
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("[크롤러] {}", line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                log.info("✅ 뉴스 크롤러 정상 종료");
            } else {
                log.warn("⚠️ 뉴스 크롤러 비정상 종료 (exit code: {})", exitCode);
            }

        } catch (Exception e) {
            log.error("❌ 뉴스 크롤러 실행 중 예외 발생", e);
        }
    }
}
