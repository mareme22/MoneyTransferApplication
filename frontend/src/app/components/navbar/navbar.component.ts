import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Output() logout = new EventEmitter<void>();

  userProfile: UserProfile | null = null;
  isMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userProfile = this.authService.getUserProfile();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isMenuOpen = false;
  }

  onLogout(): void {
    this.logout.emit();
    this.isMenuOpen = false;
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}
