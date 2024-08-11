import { MatPaginatorIntl } from '@angular/material/paginator';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  constructor(private translate: TranslateService) {
    super();
    this.getAndInitTranslations();
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });
  }

  getAndInitTranslations() {
    this.translate.get([
      'GLOBAL.items_per_page',
      'GLOBAL.next_page',
      'GLOBAL.previous_page',
      'GLOBAL.first_page',
      'GLOBAL.last_page',
      'GLOBAL.of'
    ]).subscribe(translations => {
      this.itemsPerPageLabel = translations['GLOBAL.items_per_page'];
      this.nextPageLabel = translations['GLOBAL.next_page'];
      this.previousPageLabel = translations['GLOBAL.previous_page'];
      this.firstPageLabel = translations['GLOBAL.first_page'];
      this.lastPageLabel = translations['GLOBAL.last_page'];
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 ${this.translate.instant('GLOBAL.of')} ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length
      ? Math.min(startIndex + pageSize, length)
      : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} ${this.translate.instant('GLOBAL.of')} ${length}`;
  }
}