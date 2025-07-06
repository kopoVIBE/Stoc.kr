package com.stockr.be.user.repository;

import com.stockr.be.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // 이메일로 사용자 찾기
    Optional<User> findByEmail(String email);

    // 이메일 중복 확인
    boolean existsByEmail(String email);
    
    // 닉네임 중복 확인
    boolean existsByNickname(String nickname);
}
