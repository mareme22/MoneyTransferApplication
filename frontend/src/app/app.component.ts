import { Component, OnInit, OnDestroy } from '@angular/core';
import {Router, NavigationEnd, RouterOutlet} from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import {NavbarComponent} from './components/navbar/navbar.component';
import {CommonModule} from '@angular/common';
import {NotificationComponent} from './components/notifications/notification.component';
import {FormsModule} from '@angular/forms';
import {ReactiveFormsModule} from '@angular/forms'




@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    CommonModule,
    NotificationComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Money Transfer';
  isAuthenticated = false;
  currentRoute = '';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Écouter les changements d'authentification
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAuthenticated = !!user;
      });

    // Écouter les changements de route
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    // Vérifier le token au démarrage
    if (this.authService.isTokenExpired()) {
      this.authService.logout();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogout(): void {
    this.notificationService.info('À bientôt', 'Vous avez été déconnecté avec succès');
    this.authService.logout();
  }
}
