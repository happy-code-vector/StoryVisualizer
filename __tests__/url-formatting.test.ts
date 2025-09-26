import { describe, it, expect } from '@jest/globals';

// Mock the addModel function logic for testing URL formatting
function formatLink(link: string): string {
  // Ensure the link starts with https://fal.run/ or add it as prefix
  let formattedLink = link;
  if (!link.startsWith('https://fal.run/')) {
    // If the link doesn't start with https://fal.run/, add it as prefix
    if (link.startsWith('/')) {
      formattedLink = `https://fal.run${link}`;
    } else {
      formattedLink = `https://fal.run/${link}`;
    }
  }
  return formattedLink;
}

describe('URL formatting logic', () => {
  it('should not modify links that already start with https://fal.run/', () => {
    const link = 'https://fal.run/fal-ai/model-name';
    expect(formatLink(link)).toBe(link);
  });

  it('should add prefix with slash for links starting with slash', () => {
    const link = '/fal-ai/model-name';
    expect(formatLink(link)).toBe('https://fal.run/fal-ai/model-name');
  });

  it('should add prefix with slash for links not starting with slash', () => {
    const link = 'fal-ai/model-name';
    expect(formatLink(link)).toBe('https://fal.run/fal-ai/model-name');
  });

  it('should handle links with query parameters', () => {
    const link = 'fal-ai/model-name?param=value';
    expect(formatLink(link)).toBe('https://fal.run/fal-ai/model-name?param=value');
  });
});