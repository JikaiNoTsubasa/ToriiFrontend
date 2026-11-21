import { inject, Injectable } from '@angular/core';
import { NotificationService } from '../notifications/notification.service';

/** Options de copie. */
interface CopyOptions {
  /** Affiche un toast de confirmation (succès / échec). Défaut : true. */
  notify?: boolean;
  /** Titre du toast de succès. Défaut : « Copié ». */
  successTitle?: string;
  /** Détail optionnel affiché sous le titre du toast de succès. */
  successDetail?: string;
}

/**
 * Copie de texte dans le presse-papiers, utilisable partout dans l'app.
 *
 * S'appuie sur l'API Clipboard moderne (`navigator.clipboard`) avec un repli
 * `document.execCommand('copy')` pour les contextes non sécurisés (http) ou
 * les navigateurs anciens. Émet par défaut un toast de confirmation.
 *
 * Usage :
 *   private readonly clipboard = inject(ClipboardService);
 *   this.clipboard.copy(task.id.toString());
 *   this.clipboard.copy(url, { successTitle: 'Lien copié', notify: true });
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly notifications = inject(NotificationService);

  /**
   * Copie `text` dans le presse-papiers. Renvoie `true` en cas de succès.
   * L'appel est asynchrone : `await` possible mais non requis.
   */
  async copy(text: string, options?: CopyOptions): Promise<boolean> {
    const notify = options?.notify ?? true;
    const ok = await this.write(text);

    if (notify) {
      if (ok) {
        this.notifications.success(
          options?.successTitle ?? 'Copié',
          options?.successDetail,
        );
      } else {
        this.notifications.error('Copie impossible', 'Le presse-papiers est inaccessible.');
      }
    }

    return ok;
  }

  /** Écriture bas niveau avec repli execCommand. */
  private async write(text: string): Promise<boolean> {
    // Chemin standard : disponible en contexte sécurisé (https / localhost).
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // On tente le repli ci-dessous plutôt que d'échouer directement.
      }
    }

    return this.writeFallback(text);
  }

  /** Repli historique via un <textarea> hors écran et execCommand('copy'). */
  private writeFallback(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Hors flux et invisible, mais focusable pour que la sélection fonctionne.
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
