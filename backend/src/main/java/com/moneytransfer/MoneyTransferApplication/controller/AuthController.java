package com.moneytransfer.MoneyTransferApplication.controller;

import com.moneytransfer.MoneyTransferApplication.dto.ApiResponse;
import com.moneytransfer.MoneyTransferApplication.dto.LoginRequest;
import com.moneytransfer.MoneyTransferApplication.dto.RegisterRequest;
import com.moneytransfer.MoneyTransferApplication.entity.User;
import com.moneytransfer.MoneyTransferApplication.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {


    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Map<String, Object> loginData = authService.login(loginRequest);
            return ResponseEntity.ok(new ApiResponse(true, "Connexion réussie", loginData));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Email ou mot de passe incorrect"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = authService.register(registerRequest);
            return ResponseEntity.ok(new ApiResponse(true, "Inscription réussie", user.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
