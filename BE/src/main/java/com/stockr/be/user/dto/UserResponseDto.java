package com.stockr.be.user.dto;

import com.stockr.be.user.domain.User;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponseDto {
    private String name;
    private String nickname;
    private String email;
    private String phone;
    private String birthDate;
    private String gender;
    private String investmentStyle;
    private LocalDateTime investmentStyleUpdatedAt;

    public static UserResponseDto fromEntity(User user) {
        return UserResponseDto.builder()
                .name(user.getName())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .phone(user.getPhone())
                .birthDate(user.getBirthDate())
                .gender(user.getGender())
                .investmentStyle(user.getInvestmentStyle())
                .investmentStyleUpdatedAt(user.getInvestmentStyleUpdatedAt())
                .build();
    }
}
