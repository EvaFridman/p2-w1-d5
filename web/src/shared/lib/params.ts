type SearchParamValue = string | string[] | undefined;

export function getStringParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getArrayParam(value: SearchParamValue): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}
