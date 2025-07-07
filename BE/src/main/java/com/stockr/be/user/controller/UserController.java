package com.stockr.be.user.controller;

import com.stockr.be.user.domain.User;
import com.stockr.be.user.dto.LoginRequestDto;
import com.stockr.be.user.dto.SignupRequestDto;
import com.stockr.be.user.dto.UserResponseDto;
import com.stockr.be.user.service.UserService;
import jakarta.persistence.EntityNotFoundException;
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
    public ResponseEntity<?> signup(@RequestBody SignupRequestDto requestDto) {
        try {
            userService.signup(requestDto);
            return ResponseEntity.ok().body(Map.of("success", true, "message", "회원가입이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 로그인 엔드포인트
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto requestDto) {
        try {
            String token = userService.login(requestDto);
            return ResponseEntity.ok().body(Map.of("success", true, "token", "Bearer " + token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok().body(Map.of("success", false, "message", e.getMessage()));
        }
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

    /**
     * 사용자 이름 수정
     */
    @PutMapping("/me/name")
    public ResponseEntity<?> updateName(@RequestBody Map<String, String> request) {
        try {
            User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String name = request.get("name");
            userService.updateName(user.getUserId(), name);
            return ResponseEntity.ok().body(Map.of("success", true, "message", "이름이 수정되었습니다."));
        } catch (IllegalArgumentException | EntityNotFoundException e) {
            return ResponseEntity.ok().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * 사용자 전화번호 수정
     */
    @PutMapping("/me/phone")
    public ResponseEntity<?> updatePhone(@RequestBody Map<String, String> request) {
        try {
            User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String phone = request.get("phone");
            userService.updatePhone(user.getUserId(), phone);
            return ResponseEntity.ok().body(Map.of("success", true, "message", "전화번호가 수정되었습니다."));
        } catch (IllegalArgumentException | EntityNotFoundException e) {
            return ResponseEntity.ok().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * 사용자 비밀번호 수정
     */
    @PutMapping("/me/password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> request) {
        try {
            User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            userService.updatePassword(user.getUserId(), currentPassword, newPassword);
            return ResponseEntity.ok().body(Map.of("success", true, "message", "비밀번호가 수정되었습니다."));
        } catch (IllegalArgumentException | EntityNotFoundException e) {
            return ResponseEntity.ok().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * 닉네임 중복 확인
     */
    @GetMapping("/check-nickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        try {
            boolean isDuplicate = userService.isNicknameDuplicate(nickname);
            return ResponseEntity.ok().body(Map.of(
                "success", true, 
                "isDuplicate", isDuplicate,
                "message", isDuplicate ? "이미 사용 중인 닉네임입니다." : "사용 가능한 닉네임입니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.ok().body(Map.of("success", false, "message", "닉네임 확인 중 오류가 발생했습니다."));
        }
    }

    /**
     * 사용자 닉네임 수정
     */
    @PutMapping("/me/nickname")
    public ResponseEntity<?> updateNickname(@RequestBody Map<String, String> request) {
        try {
            User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String nickname = request.get("nickname");
            userService.updateNickname(user.getUserId(), nickname);
            return ResponseEntity.ok().body(Map.of("success", true, "message", "닉네임이 수정되었습니다."));
        } catch (IllegalArgumentException | EntityNotFoundException e) {
            return ResponseEntity.ok().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

}
