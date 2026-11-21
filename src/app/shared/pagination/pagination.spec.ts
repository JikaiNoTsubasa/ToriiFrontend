import { pageItems } from './pagination';

function render(page: number, total: number): string {
  return pageItems(page, total)
    .map((item) => (item.kind === 'page' ? String(item.page) : '…'))
    .join(' ');
}

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(render(1, 1)).toBe('1');
    expect(render(2, 3)).toBe('1 2 3');
  });

  it('keeps the first, last and neighbouring pages with gaps in between', () => {
    expect(render(1, 10)).toBe('1 2 … 10');
    expect(render(5, 10)).toBe('1 … 4 5 6 … 10');
    expect(render(10, 10)).toBe('1 … 9 10');
    expect(render(3, 10)).toBe('1 2 3 4 … 10');
  });
});
