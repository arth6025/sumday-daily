export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

/** Placeholder rate for the USD view. Replace with a live rate. */
export const FX = 88;
export const money = (n: number, cur: 'INR' | 'USD') => (cur === 'USD' ? '$' + Math.round(n / FX).toLocaleString('en-US') : inr(n));

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MON[m - 1]} ${y}`;
};

export const CAT_COLOUR: Record<string, string> = { Travel: '#F08148', Sports: '#B39DFF', Fitness: '#7FD1A8', Lifestyle: '#FFD9A6' };

/** "act:Scuba" → "Scuba", "cat:Travel" → "Travel". */
export const featureLabel = (f: string) => {
  const [kind, value] = f.split(':');
  const prefix: Record<string, string> = { act: '', cat: '', country: 'in ', price: '', when: '' };
  return `${prefix[kind] ?? ''}${value ?? f}`.replace('under-25k', 'under ₹25k').replace('window', '3–9 months away');
};

export const initials = (n: string) =>
  n
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
