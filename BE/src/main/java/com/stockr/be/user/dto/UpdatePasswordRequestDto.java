package com.stockr.be.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePasswordRequestDto {
    private String currentPassword;
    private String newPassword;
} 