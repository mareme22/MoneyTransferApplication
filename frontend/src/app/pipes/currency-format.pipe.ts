import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat'
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number, currency: string = 'EUR'): string {
    if (value === null || value === undefined) return '';

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
}
