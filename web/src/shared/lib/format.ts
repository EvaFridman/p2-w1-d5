// Dates are shown and entered in Moscow time on both server and browser: without an explicit
// zone the server (UTC in Docker) and the browser format differently and hydration fails.
export const APP_TIME_ZONE = "Europe/Moscow";
// Moscow has no daylight saving time, so the offset is constant.
export const APP_UTC_OFFSET = "+03:00";

export function formatPrice(price: number | string, isRent = false): string {
  const value = Number(price);
  if (!Number.isFinite(value)) return "—";

  const formattedPrice = Math.round(value).toLocaleString("ru-RU", {
    useGrouping: true,
    maximumFractionDigits: 0,
  });

  return `${formattedPrice} ₽${isRent ? " / мес." : ""}`;
}

export function formatPricePerMeter(price: string, area: string): string {
  const priceValue = Number(price);
  const areaValue = Number(area);

  if (!Number.isFinite(priceValue) || !Number.isFinite(areaValue) || areaValue === 0) return "—";

  const pricePerMeter = priceValue / areaValue;

  return `${Math.round(pricePerMeter).toLocaleString("ru-RU")} ₽/м²`;
}

export function formatArea(area: number | string): string {
  const value = Number(area);
  if (!Number.isFinite(value)) return "—";

  return `${value.toFixed(1).replace(".", ",")} м²`;
}

export function formatDate(date: string | Date, withYear = true): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("ru-RU", {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function formatDateFull(date: string | Date): string {
  return formatDate(date, true);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, false);
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= 4) return few;

  return many;
}

export function formatListingsCount(count: number): string {
  return `${count} ${pluralize(count, "объявление", "объявления", "объявлений")}`;
}

export function formatListingFeatures(
  rooms?: number | null,
  floor?: number | null,
  totalFloors?: number | null,
): string[] {
  const features: string[] = [];

  if (rooms != null) features.push(`${rooms} ${pluralize(rooms, "комната", "комнаты", "комнат")}`);

  if (floor != null && totalFloors != null) {
    features.push(`${floor}/${totalFloors} этаж`);
  } else if (floor != null) {
    features.push(`${floor} этаж`);
  } else if (totalFloors != null) {
    features.push(`${totalFloors} этажей`);
  }

  return features;
}
