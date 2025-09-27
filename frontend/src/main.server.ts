// src/main.server.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/ssr';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { serverRoutes } from './app/app.routes.server';

// ✅ config spécifique au serveur
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideRouter(serverRoutes) // remplace withRoutes
  ]
};

// ✅ fusion des configs
const config = mergeApplicationConfig(appConfig, serverConfig);

// ✅ fonction de bootstrap à exporter par défaut
export default function bootstrap() {
  return bootstrapApplication(AppComponent, config);
}
