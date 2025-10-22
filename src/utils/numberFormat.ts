const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return currencyFormatter.format(value);
};

export const formatCurrencyWithSign = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  if (value === 0) {
    return currencyFormatter.format(0);
  }

  const sign = value > 0 ? '+' : '-';
  return `${sign}${currencyFormatter.format(Math.abs(value))}`;
};
