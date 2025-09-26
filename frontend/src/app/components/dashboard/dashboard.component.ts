import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { TransferService } from '../../services/transfer.service';
import { NotificationService } from '../../services/notification.service';
import { UserProfile } from '../../models/user.model';
import { Account } from '../../models/account.model';
import { TransferSummary, TransferStatus } from '../../models/transfer.model';
import { CommonModule } from '@angular/common';
import { formatDate } from '@angular/common';




interface DashboardStats {
  totalBalance: number;
  accountsCount: number;
  transfersThisMonth: number;
  lastTransactionDate?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit, OnDestroy {

  // User data
  userProfile: UserProfile | null = null;

  // Accounts data
  accounts: Account[] = [];

  // Transfers data
  recentTransfers: TransferSummary[] = [];
  allTransfers: TransferSummary[] = [];

  // Statistics
  stats: DashboardStats = {
    totalBalance: 0,
    accountsCount: 0,
    transfersThisMonth: 0
  };


  // UI state
  isLoading = true;
  isRefreshing = false;
  hasError = false;
  errorMessage = '';

  // Configuration
  readonly RECENT_TRANSFERS_LIMIT = 5;
  readonly REFRESH_INTERVAL = 30000; // 30 secondes

  private destroy$ = new Subject<void>();
  private refreshInterval?: number;

  constructor(
    private authService: AuthService,
    private accountService: AccountService,
    private transferService: TransferService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private initializeComponent(): void {
    // Récupérer le profil utilisateur
    this.userProfile = this.authService.getUserProfile();

    if (!this.userProfile) {
      this.router.navigate(['/login']);
      return;
    }

    // Charger les données initiales
    this.loadDashboardData();

    // Configurer l'actualisation automatique
    this.setupAutoRefresh();
  }

  private setupAutoRefresh(): void {
    this.refreshInterval = window.setInterval(() => {
      this.refreshData();
    }, this.REFRESH_INTERVAL);
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;

    // Charger les comptes et transferts en parallèle
    const accounts$ = this.accountService.getUserAccounts();
    const transfers$ = this.transferService.getTransferSummaries();

    forkJoin({
      accounts: accounts$,
      transfers: transfers$
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
        this.isRefreshing = false;
      })
    ).subscribe({
      next: ({ accounts, transfers }) => {
        this.accounts = accounts;
        this.allTransfers = transfers;
        this.processData();
        this.hasError = false;
      },
      error: (error) => {
        this.handleError('Impossible de charger les données du tableau de bord', error);
      }
    });
  }

  private processData(): void {
    this.calculateStats();
    this.prepareRecentTransfers();
  }

  private calculateStats(): void {
    // Calculer le solde total
    this.stats.totalBalance = this.accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    // Nombre de comptes
    this.stats.accountsCount = this.accounts.length;

    // Transferts de ce mois
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    this.stats.transfersThisMonth = this.allTransfers.filter(transfer => {
      const transferDate = new Date(transfer.date);
      return transferDate.getMonth() === currentMonth &&
        transferDate.getFullYear() === currentYear;
    }).length;

    // Date de dernière transaction
    if (this.allTransfers.length > 0) {
      const sortedTransfers = [...this.allTransfers].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.stats.lastTransactionDate = sortedTransfers[0].date;
    }
  }

  private prepareRecentTransfers(): void {
    // Trier les transferts par date décroissante et prendre les 5 premiers
    this.recentTransfers = [...this.allTransfers]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, this.RECENT_TRANSFERS_LIMIT);
  }

  // Méthodes publiques pour l'interface

  refreshData(): void {
    if (this.isLoading) return;

    this.isRefreshing = true;
    this.loadDashboardData();
  }

  navigateToTransfer(accountNumber?: string): void {
    const navigationExtras = accountNumber
      ? { queryParams: { from: accountNumber } }
      : {};

    this.router.navigate(['/transfer'], navigationExtras);
  }

  navigateToAccounts(): void {
    this.router.navigate(['/accounts']);
  }

  navigateToHistory(): void {
    this.router.navigate(['/history']);
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
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `Il y a ${minutes} min`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Il y a ${hours}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return new Intl.DateTimeFormat('fr-FR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 6) return 'Bonne nuit';
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    if (hour < 22) return 'Bonsoir';
    return 'Bonne nuit';
  }

  getBalanceChangePercentage(): number {
    // Simulation d'un calcul de variation (à remplacer par la vraie logique)
    // Ici, on pourrait comparer avec le solde d'il y a 30 jours
    return Math.random() * 20 - 10; // Entre -10% et +10%
  }

  getBalanceChangeText(): string {
    const change = this.getBalanceChangePercentage();
    const absChange = Math.abs(change);
    const direction = change >= 0 ? 'augmentation' : 'diminution';

    return `${direction} de ${absChange.toFixed(1)}% ce mois`;
  }

  isBalancePositive(): boolean {
    return this.stats.totalBalance > 0;
  }

  getTransferStatusColor(status: TransferStatus): string {
    switch (status) {
      case TransferStatus.COMPLETED:
        return 'success';
      case TransferStatus.PENDING:
        return 'warning';
      case TransferStatus.FAILED:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getTransferIcon(type: 'incoming' | 'outgoing'): string {
    return type === 'outgoing'
      ? 'bi bi-arrow-up-right'
      : 'bi bi-arrow-down-left';
  }

  hasRecentActivity(): boolean {
    return this.recentTransfers.length > 0;
  }

  getAccountsByBalance(): Account[] {
    return [...this.accounts].sort((a, b) => b.balance - a.balance);
  }

  getHighestBalanceAccount(): Account | null {
    if (this.accounts.length === 0) return null;
    return this.getAccountsByBalance()[0];
  }

  getTotalIncomingThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.allTransfers
      .filter(transfer => {
        const transferDate = new Date(transfer.date);
        return transfer.type === 'incoming' &&
          transferDate.getMonth() === currentMonth &&
          transferDate.getFullYear() === currentYear;
      })
      .reduce((sum, transfer) => sum + transfer.amount, 0);
  }

  getTotalOutgoingThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.allTransfers
      .filter(transfer => {
        const transferDate = new Date(transfer.date);
        return transfer.type === 'outgoing' &&
          transferDate.getMonth() === currentMonth &&
          transferDate.getFullYear() === currentYear;
      })
      .reduce((sum, transfer) => sum + transfer.amount, 0);
  }

  // Gestion d'erreurs
  private handleError(message: string, error: any): void {
    console.error('Dashboard error:', error);
    this.hasError = true;
    this.errorMessage = message;
    this.notificationService.error('Erreur', message);
  }

  retryLoadData(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.loadDashboardData();
  }
  today: string | undefined;

  // Méthodes pour les actions rapides

  quickTransferToFrequent(): void {
    // Logique pour transfert vers un destinataire fréquent
    if (this.recentTransfers.length > 0) {
      const mostFrequentAccount = this.getMostFrequentDestination();
      if (mostFrequentAccount) {
        this.router.navigate(['/transfer'], {
          queryParams: { to: mostFrequentAccount }
        });
      }
    } else {
      this.navigateToTransfer();
    }
  }

  private getMostFrequentDestination(): string | null {
    const outgoingTransfers = this.allTransfers.filter(t => t.type === 'outgoing');

    if (outgoingTransfers.length === 0) return null;

    // Compter les occurrences de chaque compte destinataire
    const accountCounts: { [key: string]: number } = {};

    outgoingTransfers.forEach(transfer => {
      accountCounts[transfer.accountNumber] =
        (accountCounts[transfer.accountNumber] || 0) + 1;
    });

    // Trouver le compte le plus fréquent
    let mostFrequent = '';
    let maxCount = 0;

    Object.entries(accountCounts).forEach(([account, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = account;
      }
    });



    return mostFrequent || null;
  }

  exportAccountData() {

  }
}
