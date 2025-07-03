package com.stockr.be.account.repository;

import com.stockr.be.account.domain.Account;
import com.stockr.be.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Account 엔티티에 대한 데이터 접근 레이어
 * JPA를 통해 기본적인 CRUD 및 사용자 기반 계좌 조회 기능을 제공
 */
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByUser(User user);

    Optional<Account> findByUser_UserId(Long userId);

    // 수정된 부분
    boolean existsByUser_UserId(Long userId);
}
