import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {

    if (this.authService.isAuthenticated() && !this.authService.isTokenExpired()) {
      return true;
    }

    // Token expiré ou non connecté
    this.notificationService.warning(
      'Session expirée',
      'Veuillez vous reconnecter pour continuer'
    );

    this.authService.logout();
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
