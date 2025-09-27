package com.moneytransfer.MoneyTransferApplication.service;

import com.moneytransfer.MoneyTransferApplication.dto.LoginRequest;
import com.moneytransfer.MoneyTransferApplication.dto.RegisterRequest;
import com.moneytransfer.MoneyTransferApplication.entity.Account;
import com.moneytransfer.MoneyTransferApplication.entity.User;
import com.moneytransfer.MoneyTransferApplication.repository.UserRepository;
import com.moneytransfer.MoneyTransferApplication.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountService accountService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public Map<String, Object> login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("user", getUserInfo(user));

        return response;
    }

    public User register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setCountry(registerRequest.getCountry());
        user.setPhoneNumber(registerRequest.getPhoneNumber());
        user.setProfilePhoto(registerRequest.getProfilePhoto());
        user.setIdNumber(registerRequest.getIdNumber());
        user.setIdPhoto(registerRequest.getIdPhoto());


        User savedUser = userRepository.save(user);

        // Créer un compte par défaut avec 1000 EUR
        String accountNumber = generateAccountNumber();
        Account defaultAccount = new Account(accountNumber, new BigDecimal("1000.00"), savedUser);
        accountService.createAccount(defaultAccount);

        return savedUser;
    }

    private String generateAccountNumber() {
        return "ACC" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private Map<String, Object> getUserInfo(User user) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("email", user.getEmail());
        userInfo.put("firstName", user.getFirstName());
        userInfo.put("lastName", user.getLastName());
        userInfo.put("country", user.getCountry());
        userInfo.put("phoneNumber", user.getPhoneNumber());
        userInfo.put("profilePhoto", user.getProfilePhoto());
        userInfo.put("idNumber", user.getPhoneNumber());
        userInfo.put("idPhoto", user.getIdPhoto());
        return userInfo;
    }
}
