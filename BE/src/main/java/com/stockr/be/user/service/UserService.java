package com.stockr.be.user.service;

import com.stockr.be.global.jwt.JwtUtil;
import com.stockr.be.user.domain.User;
import com.stockr.be.user.dto.LoginRequestDto;
import com.stockr.be.user.dto.SignupRequestDto;
import com.stockr.be.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;  // JWT 유틸리티 클래스 (토큰 생성)
    private final BCryptPasswordEncoder passwordEncoder;  // 비밀번호 암호화 도구

    /**
     * 회원가입 처리
     * @param requestDto 클라이언트로부터 전달받은 회원 정보
     */
    public void signup(SignupRequestDto requestDto) {
        String email = requestDto.getEmail();
        String password = requestDto.getPassword();

        // 이메일 중복 검사
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 이메일 형식 검사
        if (!isValidEmail(email)) {
            throw new IllegalArgumentException("유효하지 않은 이메일 형식입니다.");
        }

        // 비밀번호 형식 검사
        if (!isValidPassword(password)) {
            throw new IllegalArgumentException("비밀번호는 8~20자, 영문/숫자/특수문자를 포함해야 합니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(password);

        // 사용자 정보 엔티티 생성 및 저장
        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .name(requestDto.getName())
                .phone(requestDto.getPhone())
                .birthDate(requestDto.getBirthDate())
                .genderCode(requestDto.getGenderCode())
                .gender(requestDto.getGender())
                .investmentStyle(requestDto.getInvestmentStyle())
                .build();

        userRepository.save(user);
    }

    /**
     * 로그인 처리 및 JWT 토큰 반환
     * @param requestDto 로그인 요청 데이터
     * @return JWT 토큰 문자열
     */
    public String login(LoginRequestDto requestDto) {
        // 이메일로 사용자 조회 (없으면 예외)
        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다."));

        // 비밀번호 확인 (일치하지 않으면 예외)
        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        // 로그인 성공 → 토큰 발급
        return jwtUtil.createToken(user.getEmail());
    }

    /**
     * 이메일 형식 검증
     * @param email 입력된 이메일
     * @return 유효 여부
     */
    private boolean isValidEmail(String email) {
        return Pattern.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$", email);
    }

    /**
     * 비밀번호 형식 검증 (8~20자, 영문/숫자/특수문자 포함)
     * @param password 입력된 비밀번호
     * @return 유효 여부
     */
    private boolean isValidPassword(String password) {
        return Pattern.matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,20}$", password);
    }

    @Transactional
    public void updateInvestmentStyle(Long userId, String investmentStyle) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        user.setInvestmentStyle(investmentStyle);
        userRepository.save(user);
    }
}
