import { htmlToText, isBlankHtml } from './html-text';

describe('html-text', () => {
  it('extracts the visible text, decoding entities and collapsing whitespace', () => {
    expect(htmlToText('<p>Hello&nbsp;<strong>world</strong></p>\n<p>  again </p>')).toBe('Hello world again');
  });

  it('treats empty editor documents as blank', () => {
    expect(isBlankHtml('')).toBe(true);
    expect(isBlankHtml('<p></p>')).toBe(true);
    expect(isBlankHtml('<p>&nbsp;</p><p><br></p>')).toBe(true);
  });

  it('does not treat text content as blank', () => {
    expect(isBlankHtml('<ul><li><p>item</p></li></ul>')).toBe(false);
  });
});
