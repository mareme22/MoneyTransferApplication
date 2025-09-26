package com.moneytransfer.MoneyTransferApplication.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class LoginRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    // Constructors, getters et setters
    public LoginRequest() {}

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

}
