/* eslint-disable @typescript-eslint/no-explicit-any */
export function isEmpty(obj: any) {
  return Object.keys(obj).length === 0;
}

export function intersection(a: any, b: any) {
  const result: any = {};
  for (const key in a) {
    if (b[key] !== undefined) {
      result[key] = { left: a[key], right: b[key] };
    }
  }
  return result;
}

export function difference(a: any, b: any) {
  const result: any = {};
  for (const key in a) {
    if (b[key] === undefined) {
      result[key] = a[key];
    }
  }
  return result;
}
