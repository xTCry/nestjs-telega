import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ReverseTextPipe implements PipeTransform {
  transform(value: string): string {
    // Array.from сохраняет surrogate pairs, поэтому одиночные emoji не ломаются.
    return Array.from(value).reverse().join('');
  }
}
