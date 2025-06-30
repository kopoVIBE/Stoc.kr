package com.stockr.be.account.service;

import com.stockr.be.account.domain.Account;
import com.stockr.be.account.dto.AccountCreateRequestDto;
import com.stockr.be.account.dto.AccountResponseDto;
import com.stockr.be.account.repository.AccountRepository;
import com.stockr.be.user.domain.User;
import com.stockr.be.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 계좌 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    /**
     * 계좌 생성
     * - 이미 계좌가 존재하면 예외 발생
     * - 계좌 생성 후 응답 DTO 반환
     *
     * @param userId     사용자 ID
     * @param requestDto 계좌 생성 요청 데이터
     * @return 생성된 계좌 정보
     */
    @Transactional
    public AccountResponseDto createAccount(Long userId, AccountCreateRequestDto requestDto) {
        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        // 중복 계좌 체크 (1:1 관계)
        if (accountRepository.existsByUser_UserId(userId)) {
            throw new IllegalStateException("이미 계좌가 존재합니다.");
        }

        // 계좌 생성 및 저장
        Account account = Account.builder()
                .user(user)
                .bankName(requestDto.getBankName())
                .accountNumber(requestDto.getAccountNumber())
                .build();

        Account savedAccount = accountRepository.save(account);

        // 응답 DTO 반환
        return AccountResponseDto.fromEntity(savedAccount);
    }

    /**
     * 사용자 ID로 계좌 조회
     *
     * @param userId 사용자 ID
     * @return 계좌 응답 DTO
     */
    @Transactional(readOnly = true)
    public AccountResponseDto getAccountByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        return accountRepository.findByUser(user)
                .map(AccountResponseDto::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("계좌가 존재하지 않습니다."));
    }
}
