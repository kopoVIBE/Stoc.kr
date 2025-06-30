package com.stockr.be.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 계좌 생성 요청 DTO
 * 클라이언트로부터 계좌 개설에 필요한 정보를 전달받는다.
 */
@Getter
@NoArgsConstructor
public class AccountCreateRequestDto {

    /**
     * 은행 이름 (예: 하나은행, 카카오뱅크 등)
     */
    @NotBlank(message = "은행 이름은 필수입니다.")
    @Size(max = 50, message = "은행 이름은 50자 이내여야 합니다.")
    private String bankName;

    /**
     * 계좌 번호
     */
    @NotBlank(message = "계좌 번호는 필수입니다.")
    @Size(max = 30, message = "계좌 번호는 30자 이내여야 합니다.")
    private String accountNumber;
}
