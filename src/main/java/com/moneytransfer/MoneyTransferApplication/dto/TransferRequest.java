package com.moneytransfer.MoneyTransferApplication.dto;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;


import java.math.BigDecimal;

@Setter
@Getter
public class TransferRequest {
    @NotBlank
    private String fromAccountNumber;

    @NotBlank
    private String toAccountNumber;

    @NotNull
    @DecimalMin(value = "0.01", message = "Le montant doit être supérieur à 0")
    private BigDecimal amount;

    private String description;

    // Constructeurs, getters et setters
    public TransferRequest() {}

}
