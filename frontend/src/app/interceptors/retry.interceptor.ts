import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { retry, retryWhen, delay, take, concatMap } from 'rxjs/operators';
import { throwError, timer } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // Ne retry que certains types de requêtes
  const shouldRetry = req.method === 'GET' ||
    req.url.includes('/accounts') ||
    req.url.includes('/transfers');

  if (!shouldRetry) {
    return next(req);
  }

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        concatMap((error, count) => {
          // Retry seulement pour certaines erreurs et max 3 fois
          if (count >= 2 || error.status < 500) {
            return throwError(() => error);
          }

          console.log(`Retry attempt ${count + 1} for ${req.url}`);
          return timer(1000 * (count + 1)); // Délai exponentiel
        })
      )
    )
  );
};
