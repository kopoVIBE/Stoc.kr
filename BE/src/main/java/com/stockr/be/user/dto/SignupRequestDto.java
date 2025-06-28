package com.stockr.be.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequestDto {
    private String email;       // 사용자 이메일
    private String password;    // 사용자 비밀번호
    private String name;        // 사용자 이름
    private String investmentStyle;  // 투자 성향
}
