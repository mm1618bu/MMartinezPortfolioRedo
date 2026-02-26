import {
  calculateSettlements,
  formatCents,
  splitByPercentages,
  splitEvenly,
  sumExpenseCents,
  toCents,
} from './expenseMath';

describe('expenseMath - toCents', () => {
  test('should convert string dollars to cents', () => {
    expect(toCents('12.34')).toBe(1234);
  });

  test('should handle invalid input', () => {
    expect(toCents('abc')).toBe(0);
  });
});

describe('expenseMath - formatCents', () => {
  test('should format cents to currency string', () => {
    expect(formatCents(2505)).toBe('25.05');
  });

  test('should handle negative values', () => {
    expect(formatCents(-199)).toBe('-1.99');
  });
});

describe('expenseMath - sumExpenseCents', () => {
  test('should sum cents from expenses', () => {
    const expenses = [{ amount_cents: 500 }, { amount_cents: 250 }];
    expect(sumExpenseCents(expenses)).toBe(750);
  });

  test('should handle amount fallback', () => {
    const expenses = [{ amount: 10.5 }];
    expect(sumExpenseCents(expenses)).toBe(1050);
  });
});

describe('expenseMath - splitEvenly', () => {
  test('should split cents evenly with remainder', () => {
    const result = splitEvenly(100, ['u1', 'u2', 'u3']);
    expect(result).toEqual([
      { user_id: 'u1', amount_cents: 34 },
      { user_id: 'u2', amount_cents: 33 },
      { user_id: 'u3', amount_cents: 33 },
    ]);
  });
});

describe('expenseMath - splitByPercentages', () => {
  test('should split by percentages', () => {
    const result = splitByPercentages(10000, { u1: 50, u2: 30, u3: 20 });
    expect(result).toEqual([
      { user_id: 'u1', amount_cents: 5000 },
      { user_id: 'u2', amount_cents: 3000 },
      { user_id: 'u3', amount_cents: 2000 },
    ]);
  });

  test('should handle zero total percentage', () => {
    const result = splitByPercentages(100, { u1: 0, u2: 0 });
    expect(result).toEqual([
      { user_id: 'u1', amount_cents: 0 },
      { user_id: 'u2', amount_cents: 0 },
    ]);
  });
});

describe('expenseMath - calculateSettlements', () => {
  test('should compute settlements for two participants', () => {
    const participants = [
      { userId: 'u1', username: 'Alex' },
      { userId: 'u2', username: 'Blake' },
    ];
    const expenses = [{ amount_cents: 10000, paidBy: 'u1' }];

    const result = calculateSettlements(participants, expenses);
    expect(result).toEqual([
      { from: 'Blake', to: 'Alex', amount_cents: 5000 },
    ]);
  });

  test('should return empty when no participants', () => {
    expect(calculateSettlements([], [{ amount_cents: 1000, paidBy: 'u1' }])).toEqual([]);
  });
});
