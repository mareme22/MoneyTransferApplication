import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Account, AccountSummary } from '../models/account.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserAccounts(): Observable<Account[]> {
    return this.http.get<ApiResponse<Account[]>>(`${this.apiUrl}/accounts`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la récupération des comptes');
          }
          return response.data || [];
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Erreur lors de la récupération des comptes'));
        })
      );
  }

  getAccountByNumber(accountNumber: string): Observable<Account> {
    return this.http.get<ApiResponse<Account>>(`${this.apiUrl}/accounts/${accountNumber}`)
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Compte introuvable');
          }
          return response.data;
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Erreur lors de la récupération du compte'));
        })
      );
  }

  checkAccountExists(accountNumber: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/accounts/search`, {
      params: { accountNumber }
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la vérification');
        }
        return response.data || false;
      }),
      catchError(error => {
        return throwError(() => new Error(error.error?.message || 'Erreur lors de la vérification'));
      })
    );
  }

  // Transformer les comptes en résumés pour l'affichage
  getAccountSummaries(): Observable<AccountSummary[]> {
    return this.getUserAccounts().pipe(
      map(accounts => accounts.map(account => this.mapToAccountSummary(account)))
    );
  }

  private mapToAccountSummary(account: Account): AccountSummary {
    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
      displayBalance: this.formatCurrency(account.balance, account.currency),
      isActive: account.balance >= 0
    };
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}
