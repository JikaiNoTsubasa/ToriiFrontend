import { fileIcon, formatFileSize } from './files';

describe('files', () => {
  it('formats sizes with a readable unit', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(240 * 1024)).toBe('240 KB');
    expect(formatFileSize(3.4 * 1024 * 1024)).toBe('3.4 MB');
  });

  it('picks an icon from the content type or the extension', () => {
    expect(fileIcon('image/png', 'shot.png')).toBe('fas fa-file-image');
    expect(fileIcon('application/octet-stream', 'Report.PDF')).toBe('fas fa-file-pdf');
    expect(fileIcon('application/octet-stream', 'data.xlsx')).toBe('fas fa-file-excel');
    expect(fileIcon('application/octet-stream', 'blob.bin')).toBe('fas fa-file');
  });
});
