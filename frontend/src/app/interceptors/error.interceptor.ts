import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur inattendue s\'est produite';

      // Gestion des différents types d'erreurs
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Session expirée. Reconnectez-vous.';
          break;
        case 403:
          errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 422:
          errorMessage = 'Données de validation incorrectes';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        case 503:
          errorMessage = 'Service temporairement indisponible';
          break;
        default:
          errorMessage = error.error?.message || errorMessage;
      }

      // Afficher la notification d'erreur (sauf pour les 401 qui sont gérés par authInterceptor)
      if (error.status !== 401) {
        notificationService.error('Erreur', errorMessage);
      }

      // Logger l'erreur pour le debug
      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: error.url,
        error: error.error
      });

      return throwError(() => error);
    })
  );
};
