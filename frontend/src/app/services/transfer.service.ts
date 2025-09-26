import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Transfer, TransferRequest, TransferSummary } from '../models/transfer.model';
import { ApiResponse } from '../models/api-response.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createTransfer(transferData: TransferRequest): Observable<Transfer> {
    return this.http.post<ApiResponse<Transfer>>(`${this.apiUrl}/transfers`, transferData)
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Erreur lors du transfert');
          }
          return response.data;
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Erreur lors du transfert'));
        })
      );
  }

  getUserTransfers(): Observable<Transfer[]> {
    return this.http.get<ApiResponse<Transfer[]>>(`${this.apiUrl}/transfers`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la récupération de l\'historique');
          }
          return response.data || [];
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Erreur lors de la récupération de l\'historique'));
        })
      );
  }

  getTransferById(id: number): Observable<Transfer> {
    return this.http.get<ApiResponse<Transfer>>(`${this.apiUrl}/transfers/${id}`)
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Transfert introuvable');
          }
          return response.data;
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Erreur lors de la récupération du transfert'));
        })
      );
  }

  // Transformer les transferts pour l'affichage
  getTransferSummaries(): Observable<TransferSummary[]> {
    return this.getUserTransfers().pipe(
      map(transfers => transfers.map(transfer => this.mapToTransferSummary(transfer)))
    );
  }

  private mapToTransferSummary(transfer: Transfer): TransferSummary {
    const currentUser = this.authService.getCurrentUser();
    const isOutgoing = transfer.fromAccount.user.id === currentUser?.id;

    return {
      id: transfer.id,
      amount: transfer.amount,
      description: transfer.description || 'Aucune description',
      date: transfer.createdAt,
      type: isOutgoing ? 'outgoing' : 'incoming',
      accountNumber: isOutgoing ? transfer.toAccount.accountNumber : transfer.fromAccount.accountNumber,
      status: transfer.status,
      displayAmount: this.formatAmount(transfer.amount, isOutgoing),
      displayDate: this.formatDate(transfer.createdAt)
    };
  }

  private formatAmount(amount: number, isOutgoing: boolean): string {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);

    return isOutgoing ? `-${formatted}` : `+${formatted}`;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Valider un transfert avant envoi
  validateTransfer(transferData: TransferRequest, userAccounts: any[]): string[] {
    const errors: string[] = [];

    // Vérifier que les comptes sont différents
    if (transferData.fromAccountNumber === transferData.toAccountNumber) {
      errors.push('Impossible de transférer vers le même compte');
    }

    // Vérifier le montant
    if (transferData.amount <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }

    // Vérifier le solde
    const sourceAccount = userAccounts.find(acc => acc.accountNumber === transferData.fromAccountNumber);
    if (sourceAccount && sourceAccount.balance < transferData.amount) {
      errors.push('Solde insuffisant');
    }

    return errors;
  }
}
