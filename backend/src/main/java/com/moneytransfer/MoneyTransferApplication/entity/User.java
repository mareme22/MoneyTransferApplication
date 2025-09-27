package com.moneytransfer.MoneyTransferApplication.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "users")
public class User {
    // Getters et setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String country;

    private String profilePhoto;

    @Column(unique = true, nullable = false)
    private String idNumber;

    private String idPhoto;

    public enum Role {
        USER,      // Position 0
        ADMIN,     // Position 1
        MODERATOR  // Position 2
    }

    // Avec EnumType.STRING
    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Account> accounts;

    // Constructors, getters et setters
    public User() {}

    public User(String email, String password, String firstName, String lastName, String phoneNumber, String country, String profilePhoto, String idNumber, String idPhoto) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.country = country;
        this.phoneNumber = phoneNumber;
        this.profilePhoto = profilePhoto;
        this.idNumber = idNumber;
        this.idPhoto = idPhoto;

    }


}


