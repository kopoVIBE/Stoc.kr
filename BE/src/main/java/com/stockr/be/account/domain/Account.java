package com.stockr.be.account.domain;

import com.stockr.be.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Account 엔티티 클래스
 * 사용자의 계좌 정보를 나타내며, 각 사용자는 하나의 계좌만 가질 수 있다.
 */
@Entity
@Table(name = "accounts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Account {

    /**
     * 계좌 고유 ID (Primary Key)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Long id;

    /**
     * 계좌 소유 사용자
     * User 엔티티와 1:1 관계이며, 외래 키로 user_id를 참조
     * 각 사용자는 하나의 계좌만 가질 수 있으므로 unique 제약을 설정
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * 은행 이름 (예: 하나은행, 카카오뱅크 등)
     */
    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName;

    /**
     * 계좌 번호 (중복 허용 가능)
     */
    @Column(name = "account_number", nullable = false, length = 30)
    private String accountNumber;

    /**
     * 계좌 잔액 (소수점 둘째 자리까지, 기본값 0.00)
     */
    @Builder.Default
    @Column(name = "balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.valueOf(100_000_000L);

    /**
     * 계좌 생성 시각 (기본값: 생성 시점의 현재 시간)
     * updatable = false: 생성 후 변경 불가
     */
    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
