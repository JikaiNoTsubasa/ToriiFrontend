/** Human-readable size (e.g. 240 KB, 3.4 MB). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/** Font Awesome icon matching a file type. */
export function fileIcon(contentType: string, fileName: string): string {
  const name = fileName.toLowerCase();
  if (contentType.startsWith('image/')) return 'fas fa-file-image';
  if (contentType === 'application/pdf' || name.endsWith('.pdf')) return 'fas fa-file-pdf';
  if (/\.(docx?|odt|rtf)$/.test(name)) return 'fas fa-file-word';
  if (/\.(xlsx?|ods|csv)$/.test(name)) return 'fas fa-file-excel';
  if (/\.(pptx?|odp)$/.test(name)) return 'fas fa-file-powerpoint';
  if (/\.(zip|rar|7z|tar|gz)$/.test(name)) return 'fas fa-file-zipper';
  if (contentType.startsWith('text/') || /\.(txt|log|md|json|xml)$/.test(name)) return 'fas fa-file-lines';
  return 'fas fa-file';
}

/** Triggers a browser download of `blob` under `fileName`. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Let the download start before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
