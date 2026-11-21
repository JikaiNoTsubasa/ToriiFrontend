import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClipboardService } from '../../core/clipboard/clipboard.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { TicketChannel, TicketListItem, UserRef } from '../../core/services/ticket.models';
import { PagedResult } from '../../core/http/paged-result';
import { TicketListQuery, TicketService } from '../../core/services/ticket.service';
import {
  OPEN_TICKET_STATUSES,
  TICKET_STATUS_META,
  TICKET_STATUSES,
  TicketStatus,
} from '../../core/services/ticket-status';
import { apiStatuses, parsePageParam, parseStatusParam, sameStatuses, statusParam } from './ticket-filters';
import { Topbar } from '../../layout/topbar/topbar';
import { InfoHint } from '../../shared/info-hint/info-hint';
import { Pagination } from '../../shared/pagination/pagination';
import { RadialMenuService } from '../../shared/radial-menu/radial-menu.service';
import { SidePanelService } from '../../shared/side-panel/side-panel.service';
import { TicketStatusPanel } from './ticket-status-panel/ticket-status-panel';

/** Displayed row: ticket + counterpart customers (across all channels, deduplicated). */
interface TicketRow {
  ticket: TicketListItem;
  number: string;
  title: string;
  createdBy: UserRef | null;
  createdAt: string;
  customers: string;
  /** The user's channels of the ticket, each with its own status. */
  channels: TicketChannel[];
}

/** Tickets per page (the API caps it at 100). */
const PAGE_SIZE = 25;
/** Delay (ms) between the last keystroke and the search request. */
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-tickets',
  imports: [Topbar, RouterLink, DatePipe, InfoHint, Pagination],
  templateUrl: './tickets.html',
  host: {
    '(document:click)': 'closeStatusMenuOnOutsideClick($event)',
    '(document:keydown.escape)': 'statusMenuOpen.set(false)',
  },
})
export class Tickets {
  private readonly clipboard = inject(ClipboardService);
  private readonly radial = inject(RadialMenuService);
  private readonly panel = inject(SidePanelService);
  private readonly notifications = inject(NotificationService);
  private readonly service = inject(TicketService);
  private readonly router = inject(Router);

  protected readonly statusMeta = TICKET_STATUS_META;
  protected readonly statuses = TICKET_STATUSES;
  protected readonly openStatuses = OPEN_TICKET_STATUSES;

  /** Customers the user may send from (+ allowed targets); empty = cannot create tickets. */
  protected readonly sendOptions = this.service.sendOptions();
  protected readonly canCreate = computed(() => this.sendOptions.value().length > 0);

  // --- Search, status filter & page (server-side; kept in the URL: ?q=…&status=…&page=…) ---
  // Read from the URL once; afterwards the signals are the source of truth and are written
  // back to it (two-way binding would let a late navigation overwrite fast typing).
  private readonly initialParams = inject(ActivatedRoute).snapshot.queryParamMap;
  /** Text typed in the search bar (sent to the API after a short pause). */
  protected readonly searchInput = signal(this.initialParams.get('q') ?? '');
  private readonly search = signal(this.searchInput().trim());
  protected readonly selectedStatuses = signal(parseStatusParam(this.initialParams.get('status')));
  protected readonly page = signal(parsePageParam(this.initialParams.get('page')));
  protected readonly pageSize = PAGE_SIZE;
  protected readonly statusMenuOpen = signal(false);
  private readonly statusFilter = viewChild<ElementRef<HTMLElement>>('statusFilter');

  /** API query; none when no status is selected (nothing can match). */
  private readonly query = computed<TicketListQuery | undefined>(() =>
    this.selectedStatuses().size === 0
      ? undefined
      : {
          search: this.search(),
          statuses: apiStatuses(this.selectedStatuses()),
          page: this.page(),
          pageSize: PAGE_SIZE,
        },
  );

  protected readonly tickets = this.service.visibleTickets(() => this.query());

  /** Last loaded page, kept on screen while the next one loads (no flicker). */
  private readonly result = linkedSignal<
    { value: PagedResult<TicketListItem> | undefined; idle: boolean },
    PagedResult<TicketListItem> | undefined
  >({
    source: () => ({ value: this.tickets.value(), idle: this.query() === undefined }),
    computation: (source, previous) => (source.idle ? undefined : (source.value ?? previous?.value)),
  });

  protected readonly rows = computed<TicketRow[]>(() => (this.result()?.items ?? []).map(toRow));
  protected readonly totalCount = computed(() => this.result()?.totalCount ?? 0);
  protected readonly noStatusSelected = computed(() => this.query() === undefined);

  /** Filters differ from the default (search empty, open statuses). */
  protected readonly isFiltered = computed(
    () => this.searchInput().trim() !== '' || !sameStatuses(this.selectedStatuses(), OPEN_TICKET_STATUSES),
  );

  /** Label of the status filter button. */
  protected readonly statusSummary = computed(() => {
    const selected = this.selectedStatuses();
    if (sameStatuses(selected, OPEN_TICKET_STATUSES)) return 'Open';
    if (selected.size === TICKET_STATUSES.length) return 'All statuses';
    if (selected.size === 0) return 'No status';
    if (selected.size === 1) return this.statusMeta[[...selected][0]!].label;
    return `${selected.size} statuses`;
  });

  constructor() {
    // Debounced search: the API is queried after a pause in typing (back to page 1).
    effect((onCleanup) => {
      const value = this.searchInput().trim();
      const timer = setTimeout(() => {
        if (value !== untracked(this.search)) {
          this.search.set(value);
          this.page.set(1);
        }
      }, SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });

    // Filters & page → URL (replaced, so Back leaves the list instead of undoing filters).
    effect(() => {
      const page = this.page();
      this.router.navigate([], {
        queryParams: { q: this.search() || null, status: statusParam(this.selectedStatuses()), page: page > 1 ? page : null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    // A page past the end (e.g. after tickets were closed elsewhere) falls back to the last one.
    effect(() => {
      const result = this.result();
      if (result && result.totalPages > 0 && result.page > result.totalPages) {
        this.page.set(result.totalPages);
      }
    });
  }

  protected toggleStatus(status: TicketStatus): void {
    this.selectedStatuses.update((selected) => {
      const next = new Set(selected);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
    this.page.set(1);
  }

  protected selectStatuses(statuses: readonly TicketStatus[]): void {
    this.selectedStatuses.set(new Set(statuses));
    this.page.set(1);
  }

  protected resetFilters(): void {
    this.searchInput.set('');
    this.search.set('');
    this.selectStatuses(OPEN_TICKET_STATUSES);
  }

  protected goToPage(page: number): void {
    this.page.set(page);
  }

  protected closeStatusMenuOnOutsideClick(event: MouseEvent): void {
    const container = this.statusFilter()?.nativeElement;
    if (this.statusMenuOpen() && container && !container.contains(event.target as Node)) {
      this.statusMenuOpen.set(false);
    }
  }

  /** Opens the status side panel, preselecting `channel` when given. */
  protected changeStatus(row: TicketRow, channel?: TicketChannel): void {
    this.panel
      .open<TicketListItem>(TicketStatusPanel, {
        title: 'Change status',
        subtitle: `${row.number} — ${row.title}`,
        inputs: { ticket: row.ticket, channelId: channel?.id ?? null },
      })
      .closed.then((updated) => {
        if (updated) {
          this.notifications.success('Status updated', updated.number);
          this.tickets.reload();
        }
      });
  }

  /** Radial action menu on right-click on a row. */
  protected onContextMenu(event: MouseEvent, row: TicketRow): void {
    this.radial.open(event, [
      {
        label: 'Open',
        icon: 'fas fa-arrow-right',
        run: () => this.router.navigate(['/tickets', row.number]),
      },
      {
        label: 'Change status',
        icon: 'fas fa-flag',
        disabled: row.channels.length === 0,
        run: () => this.changeStatus(row),
      },
      {
        label: 'Copy number',
        icon: 'fas fa-copy',
        run: () => this.clipboard.copy(row.number, { successTitle: 'Number copied', successDetail: row.number }),
      },
      {
        label: 'Copy number + title',
        icon: 'fas fa-copy',
        run: () => this.clipboard.copy(row.number + " - " + row.title, { successTitle: 'Number copied', successDetail: row.number + " - " + row.title}),
      },
      {
        label: 'Refresh',
        icon: 'fas fa-rotate',
        run: () => this.tickets.reload(),
      },
    ]);
  }
}

function toRow(ticket: TicketListItem): TicketRow {
  // Counterpart = the other customer(s) of the channels, not the user's own one. When the
  // user belongs to every participant, show them all rather than an empty cell.
  const participants = ticket.channels.flatMap((ch) => ch.participants);
  const others = participants.filter((p) => !p.isOwn);
  const names = new Set((others.length ? others : participants).map((p) => p.customerName));
  return {
    ticket,
    number: ticket.number,
    title: ticket.title,
    createdBy: ticket.createdBy,
    createdAt: ticket.createdAt,
    customers: [...names].sort((a, b) => a.localeCompare(b)).join(', '),
    channels: ticket.channels,
  };
}
