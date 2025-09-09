export function usdToGyd(amount: number, rate: number): number {
  return amount * rate;
}

export function formatCurrency(val: number, currency: string, exchangeRate: number): string {
  const rate = currency === 'USD' ? exchangeRate : 1;
  const displayValue = val / rate;

  if (currency === 'GYD') {
    // Manually format for GYD to get 'GY$' prefix, as toLocaleString defaults to 'GYD'
    return `GY$${displayValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Default behavior for other currencies like USD
  return displayValue.toLocaleString('en-US', {
    style: 'currency',
    currency,
  });
}
