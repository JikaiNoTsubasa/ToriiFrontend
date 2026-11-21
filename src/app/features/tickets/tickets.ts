import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClipboardService } from '../../core/clipboard/clipboard.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { TicketChannel, TicketListItem, UserRef } from '../../core/services/ticket.models';
import { PagedResult } from '../../core/http/paged-result';
import { TicketListQuery, TicketService } from '../../core/services/ticket.service';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_META,
  TICKET_TYPE_META,
  TICKET_TYPES,
  TicketPriority,
  TicketType,
} from '../../core/services/ticket-classification';
import {
  OPEN_TICKET_STATUSES,
  TICKET_STATUS_META,
  TICKET_STATUSES,
  TicketStatus,
} from '../../core/services/ticket-status';
import {
  apiValues,
  parsePageParam,
  parseSetParam,
  PRIORITY_FILTER,
  sameValues,
  setParam,
  STATUS_FILTER,
  TYPE_FILTER,
} from './ticket-filters';
import { Topbar } from '../../layout/topbar/topbar';
import { FilterMenu, FilterOption, FilterPreset } from '../../shared/filter-menu/filter-menu';
import { InfoHint } from '../../shared/info-hint/info-hint';
import { Pagination } from '../../shared/pagination/pagination';
import { RadialMenuService } from '../../shared/radial-menu/radial-menu.service';
import { SidePanelService } from '../../shared/side-panel/side-panel.service';
import { TicketClassificationPanel } from './ticket-classification-panel/ticket-classification-panel';
import { TicketStatusPanel } from './ticket-status-panel/ticket-status-panel';

/** Displayed row: ticket + counterpart customers (across all channels, deduplicated). */
interface TicketRow {
  ticket: TicketListItem;
  number: string;
  title: string;
  type: TicketType;
  priority: TicketPriority;
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
  imports: [Topbar, RouterLink, DatePipe, InfoHint, Pagination, FilterMenu],
  templateUrl: './tickets.html',
})
export class Tickets {
  private readonly clipboard = inject(ClipboardService);
  private readonly radial = inject(RadialMenuService);
  private readonly panel = inject(SidePanelService);
  private readonly notifications = inject(NotificationService);
  private readonly service = inject(TicketService);
  private readonly router = inject(Router);

  protected readonly statusMeta = TICKET_STATUS_META;
  protected readonly typeMeta = TICKET_TYPE_META;
  protected readonly priorityMeta = TICKET_PRIORITY_META;
  protected readonly statuses = TICKET_STATUSES;

  /** Customers the user may send from (+ allowed targets); empty = cannot create tickets. */
  protected readonly sendOptions = this.service.sendOptions();
  protected readonly canCreate = computed(() => this.sendOptions.value().length > 0);

  // --- Search, filters & page (server-side; kept in the URL: ?q=…&status=…&type=…&priority=…&page=…) ---
  // Read from the URL once; afterwards the signals are the source of truth and are written
  // back to it (two-way binding would let a late navigation overwrite fast typing).
  private readonly initialParams = inject(ActivatedRoute).snapshot.queryParamMap;
  /** Text typed in the search bar (sent to the API after a short pause). */
  protected readonly searchInput = signal(this.initialParams.get('q') ?? '');
  private readonly search = signal(this.searchInput().trim());
  protected readonly selectedStatuses = signal(parseSetParam(STATUS_FILTER, this.initialParams.get('status')));
  protected readonly selectedTypes = signal(parseSetParam(TYPE_FILTER, this.initialParams.get('type')));
  protected readonly selectedPriorities = signal(parseSetParam(PRIORITY_FILTER, this.initialParams.get('priority')));
  protected readonly page = signal(parsePageParam(this.initialParams.get('page')));
  protected readonly pageSize = PAGE_SIZE;

  // Filter menu options & presets.
  protected readonly statusOptions: FilterOption[] = TICKET_STATUSES.map((value) => ({
    value,
    label: TICKET_STATUS_META[value].label,
    className: TICKET_STATUS_META[value].badge,
  }));
  protected readonly typeOptions: FilterOption[] = TICKET_TYPES.map((value) => ({
    value,
    label: TICKET_TYPE_META[value].label,
    icon: TICKET_TYPE_META[value].icon,
  }));
  protected readonly priorityOptions: FilterOption[] = TICKET_PRIORITIES.map((value) => ({
    value,
    label: TICKET_PRIORITY_META[value].label,
    icon: TICKET_PRIORITY_META[value].icon,
    className: TICKET_PRIORITY_META[value].className,
  }));
  protected readonly statusPresets: FilterPreset[] = [{ label: 'Open only', values: OPEN_TICKET_STATUSES }];
  protected readonly priorityPresets: FilterPreset[] = [{ label: 'Urgent', values: ['CRITICAL', 'HIGH'] }];
  protected readonly openStatuses = OPEN_TICKET_STATUSES;

  /** API query; none when a filter has nothing selected (nothing can match). */
  private readonly query = computed<TicketListQuery | undefined>(() =>
    this.selectedStatuses().size === 0 || this.selectedTypes().size === 0 || this.selectedPriorities().size === 0
      ? undefined
      : {
          search: this.search(),
          statuses: apiValues(STATUS_FILTER, this.selectedStatuses()),
          types: apiValues(TYPE_FILTER, this.selectedTypes()),
          priorities: apiValues(PRIORITY_FILTER, this.selectedPriorities()),
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
  /** A filter has nothing selected: no request is sent. */
  protected readonly emptySelection = computed(() => this.query() === undefined);

  /** Filters differ from the defaults (empty search, open statuses, every type & priority). */
  protected readonly isFiltered = computed(
    () =>
      this.searchInput().trim() !== '' ||
      !sameValues(this.selectedStatuses(), STATUS_FILTER.defaults) ||
      !sameValues(this.selectedTypes(), TYPE_FILTER.defaults) ||
      !sameValues(this.selectedPriorities(), PRIORITY_FILTER.defaults),
  );

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
        queryParams: {
          q: this.search() || null,
          status: setParam(STATUS_FILTER, this.selectedStatuses()),
          type: setParam(TYPE_FILTER, this.selectedTypes()),
          priority: setParam(PRIORITY_FILTER, this.selectedPriorities()),
          page: page > 1 ? page : null,
        },
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

  // Filter menus emit string sets; their values come from the matching enum options.
  protected setStatuses(selected: ReadonlySet<string>): void {
    this.selectedStatuses.set(selected as ReadonlySet<TicketStatus>);
    this.page.set(1);
  }

  protected setTypes(selected: ReadonlySet<string>): void {
    this.selectedTypes.set(selected as ReadonlySet<TicketType>);
    this.page.set(1);
  }

  protected setPriorities(selected: ReadonlySet<string>): void {
    this.selectedPriorities.set(selected as ReadonlySet<TicketPriority>);
    this.page.set(1);
  }

  protected resetFilters(): void {
    this.searchInput.set('');
    this.search.set('');
    this.selectedStatuses.set(new Set(STATUS_FILTER.defaults));
    this.selectedTypes.set(new Set(TYPE_FILTER.defaults));
    this.selectedPriorities.set(new Set(PRIORITY_FILTER.defaults));
    this.page.set(1);
  }

  protected goToPage(page: number): void {
    this.page.set(page);
  }

  /** Opens the type / priority side panel. */
  protected editClassification(row: TicketRow): void {
    this.panel
      .open<TicketListItem>(TicketClassificationPanel, {
        title: 'Type & priority',
        subtitle: `${row.number} — ${row.title}`,
        inputs: { ticket: row.ticket },
      })
      .closed.then((updated) => {
        if (updated) {
          this.notifications.success('Ticket updated', updated.number);
          this.tickets.reload();
        }
      });
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
        label: 'Type & priority',
        icon: 'fas fa-signal',
        run: () => this.editClassification(row),
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
    type: ticket.type,
    priority: ticket.priority,
    createdBy: ticket.createdBy,
    createdAt: ticket.createdAt,
    customers: [...names].sort((a, b) => a.localeCompare(b)).join(', '),
    channels: ticket.channels,
  };
}
