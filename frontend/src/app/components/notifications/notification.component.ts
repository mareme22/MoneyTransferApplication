import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService, Notification } from '../../services/notification.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,

  ],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeNotification(id: string): void {
    this.notificationService.remove(id);
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success': return 'bi bi-check-circle';
      case 'error': return 'bi bi-x-circle';
      case 'warning': return 'bi bi-exclamation-triangle';
      case 'info': return 'bi bi-info-circle';
      default: return 'bi bi-info-circle';
    }
  }
}
