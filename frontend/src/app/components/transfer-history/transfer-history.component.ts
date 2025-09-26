import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TransferService } from '../../services/transfer.service';
import { NotificationService } from '../../services/notification.service';
import { TransferSummary } from '../../models/transfer.model';
import {CommonModule, LowerCasePipe} from '@angular/common';


@Component({
  selector: 'app-transfer-history',
  standalone: true,
  imports: [
    CommonModule,
    LowerCasePipe,
  ],
  templateUrl: './transfer-history.component.html',
  styleUrls: ['./transfer-history.component.scss']
})
export class TransferHistoryComponent implements OnInit, OnDestroy {
  transfers: TransferSummary[] = [];
  filteredTransfers: TransferSummary[] = [];
  isLoading = true;
  selectedFilter = 'all';
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private transferService: TransferService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTransfers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransfers(): void {
    this.isLoading = true;

    this.transferService.getTransferSummaries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transfers) => {
          this.transfers = transfers;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.error('Erreur', 'Impossible de charger l\'historique');
          this.isLoading = false;
        }
      });
  }

  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.transfers];

    // Filtrer par type
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(t => t.type === this.selectedFilter);
    }

    // Filtrer par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(term) ||
        t.accountNumber.toLowerCase().includes(term)
      );
    }

    this.filteredTransfers = filtered;
  }

  refreshHistory(): void {
    this.loadTransfers();
    this.notificationService.info('Actualisation', 'Historique mis à jour');
  }

  getFilterCount(filter: string): number {
    if (filter === 'all') return this.transfers.length;
    return this.transfers.filter(t => t.type === filter).length;
  }

  onChange(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log(input.value);
  }

}
