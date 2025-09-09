export function usdToGyd(amount: number, rate: number): number {
  return amount * rate;
}

export function formatCurrency(val: number, currency: string, exchangeRate: number): string {
  const rate = currency === 'USD' ? exchangeRate : 1;
  const displayValue = val / rate;
  return displayValue.toLocaleString('en-US', {
    style: 'currency',
    currency
  });
}
