package com.stockr.be.user.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;  // 사용자 고유 ID

    @Column(nullable = false, unique = true, length = 100)
    private String email;  // 이메일 (중복 불가)

    @Column(nullable = false)
    private String password;  // 암호화된 비밀번호

    @Column(length = 50)
    private String name;  // 사용자 이름

    @Column(length = 20, unique = true)
    private String nickname;  // 사용자 닉네임 (커뮤니티용, 중복 불가)

    @Column(length = 20)
    private String phone;  // 사용자 전화번호 (010-1234-5678 형식)

    @Column(length = 6)
    private String birthDate;  // 생년월일 (주민번호 앞자리 YYMMDD)

    @Column(length = 1)
    private String genderCode;  // 주민번호 뒷자리 1자리 (1~4)

    @Column(length = 10)
    private String gender;  // 성별 (남자 / 여자)

    @Column(length = 20)
    private String investmentStyle;  // 투자 성향

    @Column
    private LocalDateTime investmentStyleUpdatedAt;  // 투자 성향 설정/수정 날짜
}
