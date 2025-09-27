package com.moneytransfer.MoneyTransferApplication.service;

import com.moneytransfer.MoneyTransferApplication.dto.TransferRequest;
import com.moneytransfer.MoneyTransferApplication.entity.Account;
import com.moneytransfer.MoneyTransferApplication.entity.Transfer;
import com.moneytransfer.MoneyTransferApplication.repository.TransferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class TransferService {

    @Autowired
    private TransferRepository transferRepository;

    @Autowired
    private AccountService accountService;

    @Transactional
    public Transfer createTransfer(TransferRequest transferRequest) {
        Account fromAccount = accountService.getAccountByNumber(transferRequest.getFromAccountNumber())
                .orElseThrow(() -> new RuntimeException("Compte source introuvable"));

        Account toAccount = accountService.getAccountByNumber(transferRequest.getToAccountNumber())
                .orElseThrow(() -> new RuntimeException("Compte destinataire introuvable"));

        if (fromAccount.getBalance().compareTo(transferRequest.getAmount()) < 0) {
            throw new RuntimeException("Solde insuffisant");
        }

        // Débiter le compte source
        fromAccount.setBalance(fromAccount.getBalance().subtract(transferRequest.getAmount()));
        accountService.updateAccount(fromAccount);

        // Créditer le compte destinataire
        toAccount.setBalance(toAccount.getBalance().add(transferRequest.getAmount()));
        accountService.updateAccount(toAccount);

        // Enregistrer le transfert
        Transfer transfer = new Transfer(fromAccount, toAccount, transferRequest.getAmount(), transferRequest.getDescription());
        return transferRepository.save(transfer);
    }

    public List<Transfer> getTransfersByUserId(Long userId) {
        return transferRepository.findByUserId(userId);
    }

    public List<Transfer> getTransfersByAccountId(Long accountId) {
        return transferRepository.findByFromAccountIdOrToAccountIdOrderByCreatedAtDesc(accountId, accountId);
    }
}
