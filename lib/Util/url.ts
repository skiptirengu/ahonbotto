import { URL } from 'url';

export const isValidUrl = (url: string): boolean => {
  const uri = new URL(url);
  return !!uri.hostname && !!uri.protocol && uri.protocol.includes('http');
};
