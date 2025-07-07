package com.stockr.be.account.dto;

import com.stockr.be.account.domain.Account;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 계좌 응답 DTO
 * 계좌 정보를 클라이언트에 전달할 때 사용
 */
@Getter
@Builder
public class AccountResponseDto {

    private Long accountId;          // 계좌 ID
    private String bankName;         // 은행 이름
    private String accountNumber;    // 계좌 번호
    private BigDecimal balance;      // 잔액
    private LocalDateTime createdAt; // 생성 시각

    /**
     * Account 엔티티를 DTO로 변환
     *
     * @param account Account 엔티티
     * @return 변환된 DTO
     */
    public static AccountResponseDto fromEntity(Account account) {
        return AccountResponseDto.builder()
                .accountId(account.getId())
                .bankName(account.getBankName())
                .accountNumber(account.getAccountNumber())
                .balance(account.getBalance())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
