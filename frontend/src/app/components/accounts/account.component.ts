import { Component, OnInit, OnDestroy } from '@angular/core';
import {Router, RouterModule, RouterOutlet} from '@angular/router';
import { Subject, timer } from 'rxjs';
import { takeUntil, switchMap, finalize } from 'rxjs/operators';
import { AccountService } from '../../services/account.service';
import { TransferService } from '../../services/transfer.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Account } from '../../models/account.model';
import { UserProfile } from '../../models/user.model';
import {CommonModule} from '@angular/common';


interface AccountWithStats extends Account {
  transactionCount?: number;
  lastTransactionDate?: string;
  averageMonthlyBalance?: number;
  isMainAccount?: boolean;
}

interface AccountsSummary {
  totalBalance: number;
  activeAccountsCount: number;
  inactiveAccountsCount: number;
  highestBalance: number;
  lowestBalance: number;
  averageBalance: number;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  // User data
  userProfile: UserProfile | null = null;

  // Accounts data
  accounts: AccountWithStats[] = [];
  originalAccounts: Account[] = [];

  // Summary statistics
  summary: AccountsSummary = {
    totalBalance: 0,
    activeAccountsCount: 0,
    inactiveAccountsCount: 0,
    highestBalance: 0,
    lowestBalance: 0,
    averageBalance: 0
  };

  // UI state
  isLoading = true;
  isRefreshing = false;
  hasError = false;
  errorMessage = '';

  // View options
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'balance' | 'date' | 'name' = 'balance';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Animation states
  animateCards = false;

  private destroy$ = new Subject<void>();

  constructor(
    private accountService: AccountService,
    private transferService: TransferService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  createAccount() {
    // Redirige vers la page de création de compte
    this.router.navigate(['/create-account']);
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Récupérer le profil utilisateur
    this.userProfile = this.authService.getUserProfile();

    if (!this.userProfile) {
      this.router.navigate(['/login']);
      return;
    }

    // Charger les données
    this.loadAccounts();
  }

  private loadAccounts(): void {
    this.isLoading = true;
    this.hasError = false;

    this.accountService.getUserAccounts()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.isRefreshing = false;
        })
      )
      .subscribe({
        next: (accounts) => {
          this.originalAccounts = accounts;
          this.enrichAccountsWithStats(accounts);
          this.calculateSummary();
          this.sortAccounts();
          this.triggerCardAnimation();
          this.hasError = false;
        },
        error: (error) => {
          this.handleError('Impossible de charger vos comptes', error);
        }
      });
  }

  private enrichAccountsWithStats(accounts: Account[]): void {
    this.accounts = accounts.map((account, index) => ({
      ...account,
      isMainAccount: index === 0 || account.balance === Math.max(...accounts.map(a => a.balance)),
      transactionCount: Math.floor(Math.random() * 50) + 10, // Simulation
      lastTransactionDate: this.getRandomRecentDate(),
      averageMonthlyBalance: account.balance * (0.9 + Math.random() * 0.2)
    }));
  }

  private getRandomRecentDate(): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return date.toISOString();
  }

  private calculateSummary(): void {
    if (this.accounts.length === 0) {
      this.summary = {
        totalBalance: 0,
        activeAccountsCount: 0,
        inactiveAccountsCount: 0,
        highestBalance: 0,
        lowestBalance: 0,
        averageBalance: 0
      };
      return;
    }

    const balances = this.accounts.map(acc => acc.balance);

    this.summary = {
      totalBalance: balances.reduce((sum, balance) => sum + balance, 0),
      activeAccountsCount: this.accounts.filter(acc => acc.balance >= 0).length,
      inactiveAccountsCount: this.accounts.filter(acc => acc.balance < 0).length,
      highestBalance: Math.max(...balances),
      lowestBalance: Math.min(...balances),
      averageBalance: balances.reduce((sum, balance) => sum + balance, 0) / balances.length
    };
  }

  private triggerCardAnimation(): void {
    this.animateCards = false;
    // Petit délai pour relancer l'animation
    setTimeout(() => {
      this.animateCards = true;
    }, 100);
  }

  // Méthodes publiques pour l'interface

  refreshAccounts(): void {
    if (this.isLoading) return;

    this.isRefreshing = true;
    this.loadAccounts();
    this.notificationService.info('Actualisation', 'Comptes mis à jour');
  }

  copyAccountNumber(accountNumber: string, event: Event): void {
    const button = event.target as HTMLButtonElement;
    const originalContent = button.innerHTML;

    navigator.clipboard.writeText(accountNumber).then(() => {
      // Animation de succès
      button.classList.add('copied');
      button.innerHTML = '<i class="bi bi-check"></i>';

      this.notificationService.success(
        'Copié',
        `Numéro ${accountNumber} copié dans le presse-papiers`
      );

      // Restaurer l'état original après 2 secondes
      setTimeout(() => {
        button.classList.remove('copied');
        button.innerHTML = originalContent;
      }, 2000);
    }).catch((error) => {
      console.error('Copy failed:', error);
      this.notificationService.error(
        'Erreur',
        'Impossible de copier le numéro de compte'
      );
    });
  }

  navigateToTransfer(accountNumber: string): void {
    this.router.navigate(['/transfer'], {
      queryParams: { from: accountNumber }
    });
  }

  navigateToHistory(accountId?: number): void {
    const queryParams = accountId ? { accountId: accountId.toString() } : {};
    this.router.navigate(['/history'], { queryParams });
  }

  // Méthodes de tri et filtrage

  setSortBy(criteria: 'balance' | 'date' | 'name'): void {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'desc';
    }
    this.sortAccounts();
    this.triggerCardAnimation();
  }

  private sortAccounts(): void {
    this.accounts.sort((a, b) => {
      let compareValue = 0;

      switch (this.sortBy) {
        case 'balance':
          compareValue = a.balance - b.balance;
          break;
        case 'date':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          compareValue = a.accountNumber.localeCompare(b.accountNumber);
          break;
      }

      return this.sortDirection === 'asc' ? compareValue : -compareValue;
    });
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.triggerCardAnimation();
  }

  // Méthodes utilitaires

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  }

  formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Aujourd\'hui';
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} sem.`;

    return new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  getAccountStatusClass(account: AccountWithStats): string {
    if (account.balance < 0) return 'negative';
    if (account.balance < 100) return 'low';
    if (account.isMainAccount) return 'primary';
    return 'positive';
  }

  getAccountStatusText(account: AccountWithStats): string {
    if (account.balance < 0) return 'Solde négatif';
    if (account.balance < 100) return 'Solde faible';
    if (account.isMainAccount) return 'Compte principal';
    return 'Actif';
  }

  getBalancePercentage(balance: number): number {
    if (this.summary.totalBalance === 0) return 0;
    return (balance / this.summary.totalBalance) * 100;
  }

  isLowBalance(balance: number): boolean {
    return balance > 0 && balance < 100;
  }

  isNegativeBalance(balance: number): boolean {
    return balance < 0;
  }

  getAccountIcon(account: AccountWithStats): string {
    if (account.isMainAccount) return 'bi bi-star-fill';
    if (account.balance < 0) return 'bi bi-exclamation-triangle-fill';
    if (account.balance < 100) return 'bi bi-exclamation-circle-fill';
    return 'bi bi-credit-card-2-front';
  }

  // Actions sur les comptes

  viewAccountDetails(account: AccountWithStats): void {
    // Navigation vers une page de détails (à implémenter)
    console.log('View details for account:', account.accountNumber);
  }

  exportAccountData(): void {
    const csvData = this.generateCSV();
    this.downloadCSV(csvData, 'mes-comptes.csv');
    this.notificationService.success('Export réussi', 'Données exportées en CSV');
  }

  private generateCSV(): string {
    const headers = ['Numéro de compte', 'Solde', 'Devise', 'Date de création', 'Statut'];
    const rows = this.accounts.map(account => [
      account.accountNumber,
      account.balance.toString(),
      account.currency,
      this.formatDate(account.createdAt),
      this.getAccountStatusText(account)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadCSV(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Gestion d'erreurs
  private handleError(message: string, error: any): void {
    console.error('Accounts error:', error);
    this.hasError = true;
    this.errorMessage = message;
    this.notificationService.error('Erreur', message);
  }

  retryLoadAccounts(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.loadAccounts();
  }

  // Getters pour les templates
  get sortedAccounts(): AccountWithStats[] {
    return this.accounts;
  }

  get hasSummaryData(): boolean {
    return this.accounts.length > 0;
  }

  get summaryBalanceChange(): number {
    // Simulation d'un changement de solde (à remplacer par de vraies données)
    return Math.random() * 20 - 10; // Entre -10% et +10%
  }

  get isBalanceIncreasing(): boolean {
    return this.summaryBalanceChange > 0;
  }
}
