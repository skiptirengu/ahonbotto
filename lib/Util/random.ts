import crypto from 'crypto';

export const numberInRage = (start: number, end: number): number => {
  const rng = crypto.randomFillSync(new Uint32Array(1))[0];
  return start + ((end - start) * rng) / 2 ** 32;
};
