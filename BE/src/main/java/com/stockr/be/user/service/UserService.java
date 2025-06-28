package com.stockr.be.user.service;

import com.stockr.be.common.jwt.JwtUtil;
import com.stockr.be.user.domain.User;
import com.stockr.be.user.dto.LoginRequestDto;
import com.stockr.be.user.dto.SignupRequestDto;
import com.stockr.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;  //
    private final BCryptPasswordEncoder passwordEncoder;  //

    // 회원가입
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

        // 사용자 저장
        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .name(requestDto.getName())
                .investmentStyle(requestDto.getInvestmentStyle())
                .build();

        userRepository.save(user);
    }

    // 로그인
    public String login(LoginRequestDto requestDto) {
        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        // 로그인 성공 → 토큰 발급
        return jwtUtil.createToken(user.getEmail());
    }

    // 이메일 형식 검증
    private boolean isValidEmail(String email) {
        return Pattern.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$", email);
    }

    // 비밀번호 형식 검증 (8~20자, 영문/숫자/특수문자 포함)
    private boolean isValidPassword(String password) {
        return Pattern.matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,20}$", password);
    }
}
