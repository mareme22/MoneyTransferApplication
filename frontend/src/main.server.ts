// src/main.server.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/ssr';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { serverRoutes } from './app/app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideRouter(serverRoutes)
  ]
};

const config = mergeApplicationConfig(appConfig, serverConfig);

// ✅ Correction : bootstrap prend un contexte
export default function bootstrap(context: unknown) {
  return bootstrapApplication(AppComponent, config, context);
}
