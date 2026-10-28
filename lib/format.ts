/** Format an integer cents amount as USD (e.g. 1999 -> "$19.99"). */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
