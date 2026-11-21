/** Visible text of editor HTML (tags removed, entities decoded, whitespace collapsed). */
export function htmlToText(html: string): string {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim();
}

/** True when the editor HTML holds no visible text (e.g. "<p></p>"). */
export function isBlankHtml(html: string): boolean {
  return htmlToText(html).length === 0;
}
