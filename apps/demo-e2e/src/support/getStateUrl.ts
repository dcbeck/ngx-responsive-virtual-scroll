import { StateParams } from './types';

export function getStateUrl(state: StateParams) {
  const params = new URLSearchParams(window.location.search);
  Object.entries(state).forEach(([key, value]) => {
    if (value !== undefined) {
      if (typeof value === 'string') {
        params.set(key, value);
      } else if (typeof value === 'boolean') {
        params.set(key, value ? 'true' : 'false');
      } else {
        params.set(key, `${value}`);
      }
    } else {
      params.delete(key);
    }
  });

  return '/#/?' + params.toString();
}
