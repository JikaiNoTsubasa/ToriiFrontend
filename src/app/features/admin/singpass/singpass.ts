import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ClipboardService } from '../../../core/clipboard/clipboard.service';
import { AppError } from '../../../core/http/problem-details';
import { NotificationService } from '../../../core/notifications/notification.service';
import {
  SINGPASS_ENVIRONMENTS,
  SingpassConfig,
  SingpassConfigUpdate,
  SingpassEnvironment,
  SingpassTestResult,
} from '../../../core/services/admin-singpass.models';
import { AdminSingpassService } from '../../../core/services/admin-singpass.service';
import { Topbar } from '../../../layout/topbar/topbar';

interface SettingsModel {
  enabled: boolean;
  environment: SingpassEnvironment;
  clientId: string;
  redirectUri: string;
  scopes: string;
}

const ENVIRONMENT_LABELS: Record<SingpassEnvironment, string> = {
  STAGING: 'Staging (test)',
  PRODUCTION: 'Production',
};

/**
 * Singpass settings: the switch enabling Singpass sign-in / sign-up, the application
 * registered in the Singpass Developer Portal, our keys (published as a JWKS) and a
 * connection test reading the Singpass discovery document.
 */
@Component({
  selector: 'app-admin-singpass',
  imports: [Topbar, FormField, DatePipe],
  templateUrl: './singpass.html',
})
export class AdminSingpass implements OnInit {
  private readonly service = inject(AdminSingpassService);
  private readonly notifications = inject(NotificationService);
  private readonly clipboard = inject(ClipboardService);

  protected readonly environments = SINGPASS_ENVIRONMENTS;
  protected readonly environmentLabels = ENVIRONMENT_LABELS;
  protected readonly jwksUrl = this.service.jwksUrl;
  /** Callback of this site, to register as the redirect URI. */
  protected readonly siteRedirectUri = `${globalThis.location?.origin}/auth/singpass/callback`;

  protected readonly config = signal<SingpassConfig | null>(null);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly generating = signal(false);
  protected readonly testing = signal(false);
  protected readonly testResult = signal<SingpassTestResult | null>(null);
  /** Per-field API validation errors (clientId, redirectUri, scopes, keys). */
  protected readonly apiErrors = signal<Record<string, string[]>>({});

  private readonly model = signal<SettingsModel>({
    enabled: false,
    environment: 'STAGING',
    clientId: '',
    redirectUri: '',
    scopes: '',
  });
  protected readonly form = form(this.model, (path) => {
    maxLength(path.clientId, 64, { message: '64 characters maximum.' });
    maxLength(path.redirectUri, 512, { message: '512 characters maximum.' });
    required(path.scopes, { message: 'Scopes are required (at least "openid").' });
  });

  /** Unsaved changes. */
  protected readonly dirty = computed(() => {
    const c = this.config();
    const m = this.model();
    return (
      !!c &&
      (m.enabled !== c.enabled ||
        m.environment !== c.environment ||
        m.clientId.trim() !== (c.clientId ?? '') ||
        m.redirectUri.trim() !== (c.redirectUri ?? '') ||
        m.scopes.trim() !== c.scopes)
    );
  });

  async ngOnInit(): Promise<void> {
    try {
      this.apply(await firstValueFrom(this.service.get()));
    } catch {
      this.loadError.set(true); // already notified by errorInterceptor
    }
  }

  protected useSiteRedirectUri(): void {
    this.model.update((m) => ({ ...m, redirectUri: this.siteRedirectUri }));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving() || this.form().invalid()) {
      return;
    }
    const m = this.model();
    const request: SingpassConfigUpdate = {
      enabled: m.enabled,
      environment: m.environment,
      clientId: m.clientId.trim() || null,
      redirectUri: m.redirectUri.trim() || null,
      scopes: m.scopes.trim(),
    };
    this.saving.set(true);
    this.apiErrors.set({});
    try {
      this.apply(await firstValueFrom(this.service.update(request)));
      this.notifications.success('Singpass settings saved', request.enabled ? 'Singpass is enabled.' : 'Singpass is disabled.');
    } catch (err) {
      this.apiErrors.set((err as AppError)?.errors ?? {});
    } finally {
      this.saving.set(false);
    }
  }

  protected async generateKeys(): Promise<void> {
    const c = this.config();
    if (
      c?.signingKeyId &&
      !confirm(
        'Generate new keys? The current ones stop working at once: Singpass sign-in fails until ' +
          'Singpass reloads the JWKS (up to an hour).',
      )
    ) {
      return;
    }
    this.generating.set(true);
    try {
      const updated = await firstValueFrom(this.service.generateKeys());
      this.config.set(updated);
      this.apiErrors.update(({ keys: _, ...rest }) => rest);
      this.notifications.success('Keys generated', 'Register the JWKS URL in the Singpass Developer Portal.');
    } catch {
      // Already notified by errorInterceptor.
    } finally {
      this.generating.set(false);
    }
  }

  protected async test(): Promise<void> {
    this.testing.set(true);
    this.testResult.set(null);
    try {
      this.testResult.set(await firstValueFrom(this.service.test()));
    } catch {
      // Already notified by errorInterceptor.
    } finally {
      this.testing.set(false);
    }
  }

  protected copy(text: string, what: string): void {
    this.clipboard.copy(text, { successTitle: `${what} copied` });
  }

  protected fieldError(field: string): string | null {
    return this.apiErrors()[field]?.[0] ?? null;
  }

  private apply(config: SingpassConfig): void {
    this.config.set(config);
    this.model.set({
      enabled: config.enabled,
      environment: config.environment,
      clientId: config.clientId ?? '',
      redirectUri: config.redirectUri ?? '',
      scopes: config.scopes,
    });
  }
}
