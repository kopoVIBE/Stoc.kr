package com.stockr.be.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequestDto {

    private String email;             // 사용자 이메일
    private String password;          // 사용자 비밀번호
    private String name;              // 사용자 이름
    private String phone;             // 전화번호 (010-1234-5678 형식)
    private String birthDate;         // 생년월일 (주민번호 앞자리 YYMMDD)
    private String genderCode;        // 주민번호 뒷자리 1자리 (1~4)
    private String gender;            // 성별 (남자 / 여자)
    private String investmentStyle;   // 투자 성향 (예: 안정형, 공격형 등)
}