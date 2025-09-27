package com.moneytransfer.MoneyTransferApplication.controller;

import com.moneytransfer.MoneyTransferApplication.dto.ApiResponse;
import com.moneytransfer.MoneyTransferApplication.dto.TransferRequest;
import com.moneytransfer.MoneyTransferApplication.entity.Transfer;
import com.moneytransfer.MoneyTransferApplication.entity.User;
import com.moneytransfer.MoneyTransferApplication.repository.UserRepository;
import com.moneytransfer.MoneyTransferApplication.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/transfers")
@CrossOrigin(origins = "http://localhost:4200")
public class TransferController {

    @Autowired
    private TransferService transferService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse> createTransfer(
            @Valid @RequestBody TransferRequest transferRequest,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            Transfer transfer = transferService.createTransfer(transferRequest);
            return ResponseEntity.ok(new ApiResponse(true, "Transfert effectué avec succès", transfer));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getUserTransfers(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            List<Transfer> transfers = transferService.getTransfersByUserId(user.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Historique des transferts", transfers));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
