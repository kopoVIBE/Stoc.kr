package com.stockr.be.user.dto;

import com.stockr.be.user.domain.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponseDto {
    private String name;
    private String email;
    private String phone;
    private String birthDate;
    private String gender;
    private String investmentStyle;

    public static UserResponseDto fromEntity(User user) {
        return UserResponseDto.builder()
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .birthDate(user.getBirthDate())
                .gender(user.getGender())
                .investmentStyle(user.getInvestmentStyle())
                .build();
    }
}
