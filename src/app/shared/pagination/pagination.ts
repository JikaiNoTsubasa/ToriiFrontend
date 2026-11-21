import { Component, computed, input, output } from '@angular/core';

/** A page link, or a gap between page links. */
type PageItem = { kind: 'page'; page: number } | { kind: 'gap'; key: string };

/**
 * Pagination bar: "Showing 26–50 of 132" + previous / numbered pages / next. Shows the first
 * and last pages and the pages around the current one, with gaps ("…") in between.
 *
 *   <app-pagination [page]="page()" [pageSize]="25" [totalCount]="total()" (pageChange)="goTo($event)" />
 */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
})
export class Pagination {
  /** Current page (1-based). */
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  /** Item name for the summary, e.g. "ticket" (pluralized with an "s"). */
  readonly itemLabel = input('item');

  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  protected readonly from = computed(() => (this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  protected readonly to = computed(() => Math.min(this.totalCount(), this.page() * this.pageSize()));
  protected readonly items = computed(() => pageItems(this.page(), this.totalPages()));

  protected go(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}

/** Page links to show: first, last, and `around` pages on each side of the current one. */
export function pageItems(page: number, totalPages: number, around = 1): PageItem[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - around; p <= page + around; p++) {
    if (p >= 1 && p <= totalPages) {
      pages.add(p);
    }
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) {
      items.push({ kind: 'gap', key: `gap-${p}` });
    }
    items.push({ kind: 'page', page: p });
  });
  return items;
}
