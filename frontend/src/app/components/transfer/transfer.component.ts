import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';
import { AccountService } from '../../services/account.service';
import { TransferService } from '../../services/transfer.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Account } from '../../models/account.model';
import { TransferRequest, Transfer } from '../../models/transfer.model';
import { UserProfile } from '../../models/user.model';
import { CommonModule } from '@angular/common';

interface DestinationAccountInfo {
  isValid: boolean;
  isValidating: boolean;
  message?: string;
  error?: string;
  accountData?: any;
}

interface TransferStep {
  number: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  hasError: boolean;
}

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit, OnDestroy {
  transferForm!: FormGroup;

  userProfile: UserProfile | null = null;
  userAccounts: Account[] = [];

  destinationAccountInfo: DestinationAccountInfo = {
    isValid: false,
    isValidating: false
  };

  steps: TransferStep[] = [
    { number: 1, title: 'Compte source', description: 'Sélectionnez le compte à débiter', isCompleted: false, isActive: true, hasError: false },
    { number: 2, title: 'Destinataire', description: 'Numéro du compte à créditer', isCompleted: false, isActive: false, hasError: false },
    { number: 3, title: 'Montant', description: 'Somme à transférer', isCompleted: false, isActive: false, hasError: false },
    { number: 4, title: 'Confirmation', description: 'Vérifiez les détails', isCompleted: false, isActive: false, hasError: false }
  ];

  isLoading = false;
  isSubmitting = false;
  showConfirmation = false;
  transferCompleted = false;
  completedTransfer: Transfer | null = null;

  readonly QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];
  readonly MIN_AMOUNT = 0.01;
  readonly MAX_AMOUNT = 999999;
  readonly ACCOUNT_NUMBER_MIN_LENGTH = 10;

  private destroy$ = new Subject<void>();
  private accountValidation$ = new BehaviorSubject<string>('');

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private transferService: TransferService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.userProfile = this.authService.getUserProfile();
    if (!this.userProfile) {
      this.router.navigate(['/login']);
      return;
    }
    this.initializeForm();
    this.loadUserAccounts();
    this.setupDestinationAccountValidation();
    this.handleRouteParams();
  }

  private initializeForm(): void {
    this.transferForm = this.formBuilder.group({
      fromAccountNumber: ['', [Validators.required]],
      toAccountNumber: ['', [
        Validators.required,
        Validators.minLength(this.ACCOUNT_NUMBER_MIN_LENGTH),
        this.accountNumberValidator.bind(this)
      ]],
      amount: ['', [
        Validators.required,
        Validators.min(this.MIN_AMOUNT),
        Validators.max(this.MAX_AMOUNT),
        this.amountValidator.bind(this)
      ]],
      description: ['', [Validators.maxLength(200)]]
    });

    this.transferForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateStepsStatus());
  }

  private loadUserAccounts(): void {
    this.isLoading = true;
    this.accountService.getUserAccounts()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (accounts) => {
          this.userAccounts = accounts.filter(acc => acc.balance > 0);
          if (this.userAccounts.length === 0) {
            this.notificationService.warning(
              'Aucun compte disponible',
              'Vous n’avez pas de compte avec un solde suffisant pour effectuer un transfert'
            );
            this.router.navigate(['/accounts']);
          }
        },
        error: (err) => {
          this.notificationService.error('Erreur de chargement', 'Impossible de charger vos comptes');
          console.error('Error loading accounts:', err);
        }
      });
  }

  private setupDestinationAccountValidation(): void {
    this.transferForm.get('toAccountNumber')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(800),
        distinctUntilChanged()
      )
      .subscribe(accNum => this.accountValidation$.next(accNum || ''));

    this.accountValidation$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(accountNumber => {
          if (!accountNumber || accountNumber.length < this.ACCOUNT_NUMBER_MIN_LENGTH) {
            this.resetDestinationValidation();
            return [];
          }
          return this.validateDestinationAccount(accountNumber);
        })
      )
      .subscribe();
  }

  private async validateDestinationAccount(accountNumber: string): Promise<void> {
    const isOwnAccount = this.userAccounts.some(acc => acc.accountNumber === accountNumber);
    if (isOwnAccount) {
      this.destinationAccountInfo = { isValid: false, isValidating: false, error: 'Impossible de transférer vers votre propre compte' };
      return;
    }

    this.destinationAccountInfo = { isValid: false, isValidating: true, message: 'Vérification en cours...' };
    try {
      const exists = await firstValueFrom(this.accountService.checkAccountExists(accountNumber));
      this.destinationAccountInfo = {
        isValid: !!exists,
        isValidating: false,
        message: exists ? 'Compte destinataire valide' : undefined,
        error: exists ? undefined : 'Compte destinataire introuvable'
      };
    } catch (err) {
      this.destinationAccountInfo = { isValid: false, isValidating: false, error: 'Erreur lors de la validation du compte' };
      console.error('Account validation error:', err);
    }
  }

  private resetDestinationValidation(): void {
    this.destinationAccountInfo = { isValid: false, isValidating: false };
  }

  private handleRouteParams(): void {
    const { from, to, amount } = this.route.snapshot.queryParams;
    if (from) this.transferForm.patchValue({ fromAccountNumber: from });
    if (to) this.transferForm.patchValue({ toAccountNumber: to });
    if (amount && !isNaN(+amount)) this.transferForm.patchValue({ amount: +amount });
  }

  onSubmit(): void {
    if (this.transferForm.invalid || !this.destinationAccountInfo.isValid) {
      this.markFormGroupTouched();
      this.validateAllSteps();
      return;
    }
    if (!this.showConfirmation) {
      this.showConfirmationStep();
    } else {
      this.executeTransfer();
    }
  }

  private showConfirmationStep(): void {
    this.showConfirmation = true;
    this.updateStepsStatus();
  }

  public executeTransfer(): void {   // ✅ public
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    const transferData: TransferRequest = this.transferForm.value;

    const validationErrors = this.performFinalValidation(transferData);
    if (validationErrors.length > 0) {
      validationErrors.forEach(err => this.notificationService.error('Erreur de validation', err));
      this.isSubmitting = false;
      return;
    }

    this.transferService.createTransfer(transferData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (transfer) => this.handleTransferSuccess(transfer),
        error: (err) => this.handleTransferError(err)
      });
  }

  private handleTransferSuccess(transfer: Transfer): void {
    this.completedTransfer = transfer;
    this.transferCompleted = true;
    this.notificationService.success('Transfert réussi', `${this.formatCurrency(transfer.amount)} transféré avec succès`);
    setTimeout(() => this.router.navigate(['/dashboard']), 3000);
  }

  private handleTransferError(error: any): void {
    const errorMessage = error.message || 'Une erreur est survenue lors du transfert';
    this.notificationService.error('Erreur de transfert', errorMessage);
    this.showConfirmation = false;
    console.error('Transfer error:', error);
  }

  cancelTransfer(): void {
    this.showConfirmation ? this.showConfirmation = false : this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    this.showConfirmation ? this.showConfirmation = false : this.router.navigate(['/dashboard']);
  }

  setQuickAmount(amount: number): void {
    this.transferForm.patchValue({ amount });
    this.transferForm.get('amount')?.markAsTouched();
  }

  setMaxAmount(): void {
    const sourceAccNum = this.transferForm.get('fromAccountNumber')?.value;
    const sourceAcc = this.userAccounts.find(acc => acc.accountNumber === sourceAccNum);
    if (sourceAcc) this.setQuickAmount(sourceAcc.balance);
  }

  get selectedSourceAccount(): Account | null {
    const accNum = this.transferForm.get('fromAccountNumber')?.value;
    return this.userAccounts.find(acc => acc.accountNumber === accNum) || null;
  }

  get sourceAccountBalance(): number {
    return this.selectedSourceAccount?.balance || 0;
  }

  get hasValidDestination(): boolean {
    return this.destinationAccountInfo.isValid;
  }

  get isDestinationValidating(): boolean {
    return this.destinationAccountInfo.isValidating;
  }

  get canProceed(): boolean {
    return this.transferForm.valid && this.destinationAccountInfo.isValid && !this.isSubmitting;
  }

  get transferSummary(): any {
    if (!this.canProceed) return null;
    const { fromAccountNumber, toAccountNumber, amount, description } = this.transferForm.value;
    return { fromAccount: fromAccountNumber, toAccount: toAccountNumber, amount, description: description || 'Aucune description', fees: 0, totalAmount: amount };
  }

  private accountNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const accountNumber = control.value.toString().toUpperCase();
    return /^[A-Z0-9]{10,20}$/.test(accountNumber) ? null : { invalidAccountNumber: true };
  }

  private amountValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const amount = +control.value;
    const sourceAcc = this.selectedSourceAccount;
    return (sourceAcc && amount > sourceAcc.balance) ? { insufficientFunds: true } : null;
  }

  private performFinalValidation(data: TransferRequest): string[] {
    const errors: string[] = [];
    if (data.fromAccountNumber === data.toAccountNumber) errors.push('Les comptes source et destinataire doivent être différents');
    const sourceAcc = this.userAccounts.find(acc => acc.accountNumber === data.fromAccountNumber);
    if (sourceAcc && sourceAcc.balance < data.amount) errors.push('Solde insuffisant dans le compte source');
    if (data.amount < this.MIN_AMOUNT) errors.push(`Le montant minimum est de ${this.formatCurrency(this.MIN_AMOUNT)}`);
    return errors;
  }

  private updateStepsStatus(): void {
    const formValue = this.transferForm.value;
    const fromCtrl = this.transferForm.get('fromAccountNumber');
    const toCtrl = this.transferForm.get('toAccountNumber');
    const amountCtrl = this.transferForm.get('amount');

    this.steps[0].isCompleted = !!formValue.fromAccountNumber;
    this.steps[0].hasError = !!(fromCtrl?.invalid && fromCtrl?.touched);

    this.steps[1].isCompleted = this.destinationAccountInfo.isValid;
    this.steps[1].hasError = !!((toCtrl?.invalid && toCtrl?.touched) || this.destinationAccountInfo.error);

    if (this.steps[2] && amountCtrl) {
      this.steps[2].isCompleted = Boolean(formValue?.amount && amountCtrl.valid);
      this.steps[2].hasError = Boolean(amountCtrl.invalid && amountCtrl.touched);
    }

    this.steps[3].isCompleted = this.transferCompleted;
    this.steps[3].isActive = this.showConfirmation;
  }

  private validateAllSteps(): void {
    ['fromAccountNumber', 'toAccountNumber', 'amount'].forEach(fieldName => {
      const field = this.transferForm.get(fieldName);
      field?.markAsTouched();
      field?.updateValueAndValidity();
    });
    this.updateStepsStatus();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  formatAccountNumber(accountNumber: string): string {
    return accountNumber.replace(/(.{4})/g, '$1 ').trim();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.transferForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.transferForm.get(fieldName);
    if (!field?.errors) return '';
    const errors = field.errors;
    if (errors['required']) return 'Ce champ est requis';
    if (errors['min']) return `Montant minimum: ${this.formatCurrency(errors['min'].min)}`;
    if (errors['max']) return `Montant maximum: ${this.formatCurrency(errors['max'].max)}`;
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères`;
    if (errors['invalidAccountNumber']) return 'Format de numéro de compte invalide';
    if (errors['insufficientFunds']) return 'Solde insuffisant';
    return 'Champ invalide';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.transferForm.controls).forEach(key => {
      const field = this.transferForm.get(key);
      field?.markAsTouched();
      field?.updateValueAndValidity();
    });
  }

  onAccountChange(): void { this.updateStepsStatus(); }
  onAmountChange(): void { this.updateStepsStatus(); }
  onDestinationChange(): void { this.resetDestinationValidation(); this.updateStepsStatus(); }

  getAmountHelperText(): string {
    return this.sourceAccountBalance > 0 ? `Solde disponible: ${this.formatCurrency(this.sourceAccountBalance)}` : '';
  }

  getTransferFees(): number { return 0; }
  showAmountHelper(): boolean { return !!this.selectedSourceAccount; }
}
