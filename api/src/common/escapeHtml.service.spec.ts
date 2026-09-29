import { escapeHtml } from './escapeHtml.service.js';

describe('escapeHtml', () => {
  it('returns plain string unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes a tag into text', () => {
    expect(escapeHtml('<img src=x>')).toBe('&lt;img src=x&gt;');
  });

  it('escapes ampersand before other entities are formed', () => {
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('returns escaped value for mixed special characters', () => {
    expect(escapeHtml(`a&g<j>k"l'l`)).toBe(`a&amp;g&lt;j&gt;k&quot;l&#39;l`);
  });
});
