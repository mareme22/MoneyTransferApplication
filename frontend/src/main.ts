import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Routes
import { routes } from './app/app.routes';

// Interceptors
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { errorInterceptor } from './app/interceptors/error.interceptor';
import { loadingInterceptor } from './app/interceptors/loading.interceptor';
import { cacheInterceptor } from './app/interceptors/cache.interceptor';

// Services
import { AuthService } from './app/services/auth.service';
import { NotificationService } from './app/services/notification.service';
import { LoadingService } from './app/services/loading.service';

// Enregistrer la locale française
registerLocaleData(localeFr);

bootstrapApplication(AppComponent, {
  providers: [
    // Router
    provideRouter(routes),

    // HTTP Client avec interceptors
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        cacheInterceptor,
        authInterceptor,
        errorInterceptor
      ])
    ),

    // Angular Modules
    importProvidersFrom(
      BrowserAnimationsModule,
      ReactiveFormsModule
    ),

    // Services
    AuthService,
    NotificationService,
    LoadingService,

    // Configuration
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
}).catch(err => console.error('❌ Erreur de démarrage:', err));
