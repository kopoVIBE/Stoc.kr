package com.stockr.be.user.controller;

import com.stockr.be.user.domain.User;
import com.stockr.be.user.dto.LoginRequestDto;
import com.stockr.be.user.dto.SignupRequestDto;
import com.stockr.be.user.dto.UserResponseDto;
import com.stockr.be.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 회원가입 엔드포인트
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequestDto requestDto) {
        userService.signup(requestDto);
        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    // 로그인 엔드포인트
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequestDto requestDto) {
        String token = userService.login(requestDto);
        return ResponseEntity.ok("Bearer " + token);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getMyInfo() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(UserResponseDto.fromEntity(user));
    }

    @PutMapping("/me/investment-style")
    public ResponseEntity<String> updateInvestmentStyle(@RequestBody Map<String, String> request) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String investmentStyle = request.get("investmentStyle");
        userService.updateInvestmentStyle(user.getUserId(), investmentStyle);
        return ResponseEntity.ok("투자 성향이 업데이트되었습니다.");
    }

}
