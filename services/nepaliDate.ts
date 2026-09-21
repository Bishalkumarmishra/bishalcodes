import NepaliDateRaw from 'nepali-date-converter';

function getConstructor(): any {
  if (typeof NepaliDateRaw === 'function') {
    return NepaliDateRaw;
  }
  if (NepaliDateRaw && typeof (NepaliDateRaw as any).default === 'function') {
    return (NepaliDateRaw as any).default;
  }
  return null;
}

export function createNepaliDate(...args: any[]): any {
  try {
    const Ctor = getConstructor();
    if (Ctor) {
      if (args.length === 0) return new Ctor();
      if (args.length === 1) return new Ctor(args[0]);
      if (args.length === 2) return new Ctor(args[0], args[1]);
      if (args.length === 3) return new Ctor(args[0], args[1], args[2]);
      return new Ctor(...args);
    }
  } catch (e) {
    console.warn('[NepaliDate safe wrapper caught]', e);
  }

  // Safe fallback representation
  const today = new Date();
  const fallbackYear = typeof args[0] === 'number' && args[0] > 1900 && args[0] < 2200 ? args[0] : (today.getFullYear() + 57);
  const fallbackMonth = typeof args[1] === 'number' ? args[1] : (today.getMonth() + 8) % 12;
  const fallbackDate = typeof args[2] === 'number' ? args[2] : today.getDate();

  return {
    getYear: () => fallbackYear,
    getMonth: () => fallbackMonth,
    getDate: () => fallbackDate,
    getDay: () => today.getDay(),
    setDate: (d: number) => {},
    toJsDate: () => today,
    format: (f: string) => `${fallbackYear}/${fallbackMonth + 1}/${fallbackDate}`,
  };
}

export default createNepaliDate;
