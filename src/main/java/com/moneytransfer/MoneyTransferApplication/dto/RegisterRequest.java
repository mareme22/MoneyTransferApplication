package com.moneytransfer.MoneyTransferApplication.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class RegisterRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 6, max = 20)
    private String password;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    private String phoneNumber;

    @NotBlank
    private String country;

    @NotBlank
    private String profilePhoto;

    @NotBlank
    private String idNumber;

    @NotBlank
    private String idPhoto;

    // Constructeurs, getters et setters
    public RegisterRequest() {}

}

