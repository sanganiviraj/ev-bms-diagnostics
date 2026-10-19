export const formatVoltage = (volts: number): string => {
  return `${volts.toFixed(1)} V`;
};

export const formatTemperature = (celsius: number): string => {
  return `${celsius > 0 ? '+' : ''}${celsius.toFixed(0)}°C`;
};

export const formatPercent = (pct: number): string => {
  return `${Math.round(pct)}%`;
};

export const formatHex = (value: string | number): string => {
  if (typeof value === 'number') {
    return '0x' + value.toString(16).toUpperCase().padStart(2, '0');
  }
  const clean = value.replace(/0x|\s/gi, '').toUpperCase();
  return clean ? '0x' + clean : '0x00';
};

export const calculateEstimatedRange = (
  socPercent: number,
  maxRangeKm: number = 520
): { total: number; electric: number } => {
  const electric = Math.round((socPercent / 100) * maxRangeKm);
  return {
    total: electric,
    electric,
  };
};

export const getHealthIndicator = (soh: number): { label: string; color: string } => {
  if (soh >= 90) return { label: 'Optimal', color: '#10B981' };
  if (soh >= 80) return { label: 'Good', color: '#0284C7' };
  if (soh >= 70) return { label: 'Degraded', color: '#F59E0B' };
  return { label: 'Replace Required', color: '#EF4444' };
};

export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};
