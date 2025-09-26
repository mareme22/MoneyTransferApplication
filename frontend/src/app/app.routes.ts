import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AccountComponent } from './components/accounts/account.component';
import { TransferComponent } from './components/transfer/transfer.component';
import { TransferHistoryComponent } from './components/transfer-history/transfer-history.component';

export const routes: Routes = [
  // Redirection par défaut
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Routes publiques
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Routes protégées
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'accounts', component: AccountComponent, canActivate: [AuthGuard] },
  { path: 'transfer', component: TransferComponent, canActivate: [AuthGuard] },
  { path: 'history', component: TransferHistoryComponent, canActivate: [AuthGuard] },

  // Route de fallback
  { path: '**', redirectTo: '/dashboard' }
];
