export const getZoneOffset = (zone: string): { label: string; zone: string; offset: number } => {
  const now = new Date();
  const utcString = now.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzString = now.toLocaleString('en-US', { timeZone: zone });

  const offsetMinutes = (new Date(tzString).getTime() - new Date(utcString).getTime()) / 60000;
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const formattedOffset = `(GMT${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')})`;
  return {
    label: `${formattedOffset} ${zone.replace(/_/g, ' ')}`,
    zone,
    offset: offsetMinutes,
  };
};
