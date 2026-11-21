import { fileIcon, formatFileSize, lastImageIndex, namePastedImage } from './files';

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

  it('finds the highest image_N index among file names', () => {
    expect(lastImageIndex([])).toBe(0);
    expect(lastImageIndex(['report.pdf', 'image_2.png', 'image_10.jpg', 'my_image_99.png'])).toBe(10);
  });

  it('names a pasted image image_N with an extension from its type', () => {
    const png = namePastedImage(new File(['x'], 'image.png', { type: 'image/png' }), 3);
    expect(png.name).toBe('image_3.png');
    expect(png.type).toBe('image/png');

    expect(namePastedImage(new File(['x'], 'clipboard', { type: 'image/jpeg' }), 1).name).toBe('image_1.jpg');
    expect(namePastedImage(new File(['x'], 'blob', { type: '' }), 2).name).toBe('image_2.png');
  });
});
