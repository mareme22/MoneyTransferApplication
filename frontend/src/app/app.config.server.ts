import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/ssr';
import { provideRouter } from '@angular/router';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideRouter(serverRoutes) // ✅ au lieu de withRoutes
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
