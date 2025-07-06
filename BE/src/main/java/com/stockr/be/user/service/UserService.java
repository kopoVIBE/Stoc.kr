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

import java.time.LocalDateTime;
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
                .investmentStyleUpdatedAt(LocalDateTime.now())
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
        user.setInvestmentStyleUpdatedAt(LocalDateTime.now()); // 현재 시간으로 설정
        userRepository.save(user);
    }

    /**
     * 사용자 이름 수정
     * @param userId 사용자 ID
     * @param name 새로운 이름
     */
    @Transactional
    public void updateName(Long userId, String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("이름을 입력해주세요.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        user.setName(name.trim());
        userRepository.save(user);
    }

    /**
     * 사용자 전화번호 수정
     * @param userId 사용자 ID
     * @param phone 새로운 전화번호
     */
    @Transactional
    public void updatePhone(Long userId, String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호를 입력해주세요.");
        }

        // 전화번호 형식 검증
        if (!isValidPhone(phone)) {
            throw new IllegalArgumentException("전화번호 형식이 일치하지 않습니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        user.setPhone(phone);
        userRepository.save(user);
    }

    /**
     * 사용자 비밀번호 수정
     * @param userId 사용자 ID
     * @param currentPassword 현재 비밀번호
     * @param newPassword 새로운 비밀번호
     */
    @Transactional
    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("현재 비밀번호를 입력해주세요.");
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }

        // 새 비밀번호 형식 검증
        if (!isValidPassword(newPassword)) {
            throw new IllegalArgumentException("비밀번호는 8~20자, 영문/숫자/특수문자를 포함해야 합니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        // 새 비밀번호와 현재 비밀번호가 같은지 확인
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }

        // 새 비밀번호 암호화 및 저장
        String encodedNewPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedNewPassword);
        userRepository.save(user);
    }

    /**
     * 전화번호 형식 검증 (010-XXXX-XXXX)
     * @param phone 입력된 전화번호
     * @return 유효 여부
     */
    private boolean isValidPhone(String phone) {
        return Pattern.matches("^010-\\d{4}-\\d{4}$", phone);
    }

    /**
     * 닉네임 중복 확인
     * @param nickname 확인할 닉네임
     * @return 중복 여부 (true: 중복, false: 사용 가능)
     */
    public boolean isNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    /**
     * 사용자 닉네임 수정
     * @param userId 사용자 ID
     * @param nickname 새로운 닉네임
     */
    @Transactional
    public void updateNickname(Long userId, String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }

        // 닉네임 길이 검증
        if (nickname.trim().length() < 2 || nickname.trim().length() > 20) {
            throw new IllegalArgumentException("닉네임은 2-20자로 입력해주세요.");
        }

        // 닉네임 중복 확인
        if (userRepository.existsByNickname(nickname.trim())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        user.setNickname(nickname.trim());
        userRepository.save(user);
    }
}
