package com.moneytransfer.MoneyTransferApplication.service;

import com.moneytransfer.MoneyTransferApplication.entity.Account;
import com.moneytransfer.MoneyTransferApplication.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public void createAccount(Account account) {
        accountRepository.save(account);
    }

    public List<Account> getAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    public Optional<Account> getAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber);
    }

    public void updateAccount(Account account) {
        accountRepository.save(account);
    }
}
