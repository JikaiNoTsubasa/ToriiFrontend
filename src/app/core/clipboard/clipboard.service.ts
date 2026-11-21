import { inject, Injectable } from '@angular/core';
import { NotificationService } from '../notifications/notification.service';

/** Copy options. */
interface CopyOptions {
  /** Shows a confirmation toast (success / failure). Default: true. */
  notify?: boolean;
  /** Success toast title. Default: "Copied". */
  successTitle?: string;
  /** Optional detail shown under the success toast title. */
  successDetail?: string;
}

/**
 * Copies text to the clipboard, usable anywhere in the app.
 *
 * Relies on the modern Clipboard API (`navigator.clipboard`) with a
 * `document.execCommand('copy')` fallback for insecure contexts (http) or
 * old browsers. Shows a confirmation toast by default.
 *
 * Usage:
 *   private readonly clipboard = inject(ClipboardService);
 *   this.clipboard.copy(task.id.toString());
 *   this.clipboard.copy(url, { successTitle: 'Link copied', notify: true });
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly notifications = inject(NotificationService);

  /**
   * Copies `text` to the clipboard. Returns `true` on success.
   * The call is asynchronous: `await` is possible but not required.
   */
  async copy(text: string, options?: CopyOptions): Promise<boolean> {
    const notify = options?.notify ?? true;
    const ok = await this.write(text);

    if (notify) {
      if (ok) {
        this.notifications.success(
          options?.successTitle ?? 'Copied',
          options?.successDetail,
        );
      } else {
        this.notifications.error('Copy failed', 'The clipboard is not accessible.');
      }
    }

    return ok;
  }

  /** Low-level write with an execCommand fallback. */
  private async write(text: string): Promise<boolean> {
    // Standard path: available in secure contexts (https / localhost).
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Try the fallback below rather than failing right away.
      }
    }

    return this.writeFallback(text);
  }

  /** Legacy fallback through an off-screen <textarea> and execCommand('copy'). */
  private writeFallback(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Out of the flow and invisible, but focusable so that selection works.
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);

    try {
      textarea.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
