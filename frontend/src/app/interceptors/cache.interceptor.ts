import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

// Service de cache simple
interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
}

class HttpCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  get(url: string): HttpResponse<any> | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(url);
      return null;
    }

    return entry.response;
  }

  set(url: string, response: HttpResponse<any>): void {
    this.cache.set(url, {
      response: response.clone(),
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Instance singleton du cache
const cacheService = new HttpCacheService();

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Ne cache que les requêtes GET
  if (req.method !== 'GET') {
    return next(req);
  }

  // Ne pas mettre en cache certaines URLs
  const skipCache = req.headers.get('X-Skip-Cache') === 'true' ||
    req.url.includes('/auth/') ||
    req.url.includes('/transfers');

  if (skipCache) {
    return next(req);
  }

  // Vérifier le cache
  const cachedResponse = cacheService.get(req.url);
  if (cachedResponse) {
    console.log('Cache HIT:', req.url);
    return of(cachedResponse);
  }

  // Pas en cache, faire la requête et mettre en cache
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        console.log('Cache SET:', req.url);
        cacheService.set(req.url, event);
      }
    })
  );
};
