// Utility functions for handling cookies

export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined; // Server-side check
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export function setCookie(name: string, value: string, days?: number): void {
  if (typeof document === 'undefined') return; // Server-side check
  
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  
  // Set cookie with proper attributes for security and cross-browser compatibility
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax;`;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return; // Server-side check
  
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`;
}