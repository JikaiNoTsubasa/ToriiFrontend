import { Component, computed, input } from '@angular/core';
import { AccountType } from '../../core/auth/singpass.models';

interface AccountTypeLook {
  label: string;
  icon: string;
  /** Extra badge modifier (colors). */
  modifier: string;
  title: string;
}

const LOOKS: Record<AccountType, AccountTypeLook> = {
  APPLICATION: { label: 'Email', icon: 'fas fa-envelope', modifier: '', title: 'Signs in with email and password' },
  SINGPASS: { label: 'Singpass', icon: 'fas fa-id-card', modifier: 'badge--singpass', title: 'Signs in with Singpass' },
  GOOGLE: { label: 'Google', icon: 'fab fa-google', modifier: 'badge--google', title: 'Signs in with Google' },
};

/** Chip telling how an account signs in (email + password, Singpass, Google). */
@Component({
  selector: 'app-account-type-chip',
  template: `
    <span class="badge" [class]="look().modifier" [title]="look().title">
      <i [class]="look().icon" aria-hidden="true"></i> {{ look().label }}
    </span>
  `,
})
export class AccountTypeChip {
  readonly type = input.required<AccountType>();

  protected readonly look = computed(() => LOOKS[this.type()] ?? LOOKS.APPLICATION);
}
