import { Component, input, model } from '@angular/core';
import { TICKET_PRIORITIES, TICKET_PRIORITY_META, TicketPriority } from '../../../core/services/ticket-classification';

let nextId = 0;

/**
 * Priority choice as vertical radio cards (Critical first), each with a signal-strength
 * level indicator, its label and description; the selected card takes its priority color.
 *
 *   <app-priority-picker [(value)]="priority" [current]="ticket.priority" />
 */
@Component({
  selector: 'app-priority-picker',
  templateUrl: './priority-picker.html',
})
export class PriorityPicker {
  readonly value = model.required<TicketPriority>();
  /** Saved priority, flagged "(current)" when editing an existing ticket. */
  readonly current = input<TicketPriority | null>(null);
  readonly legend = input('Priority');

  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly meta = TICKET_PRIORITY_META;
  /** Bars of the level indicator (1 = lowest). */
  protected readonly bars = TICKET_PRIORITIES.map((_, i) => i + 1);
  /** Radio group name, unique per instance. */
  protected readonly name = `priority-${++nextId}`;
}
