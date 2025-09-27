package com.moneytransfer.MoneyTransferApplication.controller;

import com.moneytransfer.MoneyTransferApplication.dto.ApiResponse;
import com.moneytransfer.MoneyTransferApplication.entity.Account;
import com.moneytransfer.MoneyTransferApplication.entity.User;
import com.moneytransfer.MoneyTransferApplication.repository.UserRepository;
import com.moneytransfer.MoneyTransferApplication.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "http://localhost:4200")
public class AccountController {


    private AccountService accountService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse> getUserAccounts(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            List<Account> accounts = accountService.getAccountsByUserId(user.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Comptes récupérés", accounts));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/{accountNumber}")
    public ResponseEntity<ApiResponse> getAccountByNumber(@PathVariable String accountNumber) {
        try {
            Account account = accountService.getAccountByNumber(accountNumber)
                    .orElseThrow(() -> new RuntimeException("Compte introuvable"));
            return ResponseEntity.ok(new ApiResponse(true, "Compte trouvé", account));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
