package com.stockr.be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StockrBeApplication {

	public static void main(String[] args) {
		SpringApplication.run(StockrBeApplication.class, args);
	}

}
