export interface Debt {
  from: string;
  to: string;
  amount: number;
}

/**
 * Given raw debts (from expense splits), compute the minimum set of
 * transactions that settles all balances.
 *
 * Steps:
 *  1. Sum net balance per person across all raw debts.
 *  2. Partition into creditors (net > 0) and debtors (net < 0).
 *  3. Greedily match the largest creditor to the largest debtor,
 *     creating one transaction per match, until everyone is settled.
 */
export function simplifyDebts(debts: Debt[]): Debt[] {
  const net: Record<string, number> = {};
  for (const { from, to, amount } of debts) {
    net[from] = (net[from] ?? 0) - amount;
    net[to] = (net[to] ?? 0) + amount;
  }
  return balancesToTransactions(
    Object.entries(net).map(([userId, amount]) => ({ userId, amount })),
  );
}

/**
 * Convert pre-computed net balances (positive = owed money, negative = owes money)
 * into the minimum set of settling transactions.
 */
export function balancesToTransactions(
  balances: { userId: string; amount: number }[],
): Debt[] {
  const creditors = balances
    .filter(b => b.amount > 0.005)
    .map(b => ({ ...b }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter(b => b.amount < -0.005)
    .map(b => ({ ...b }))
    .sort((a, b) => a.amount - b.amount); // most-negative first

  const result: Debt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.amount, Math.abs(debt.amount));
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0) {
      result.push({ from: debt.userId, to: credit.userId, amount: rounded });
    }

    credit.amount -= amount;
    debt.amount += amount;

    if (credit.amount < 0.005) ci++;
    if (Math.abs(debt.amount) < 0.005) di++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Inline tests — run once at module load in dev; silent in prod.
// ---------------------------------------------------------------------------
if (import.meta.env.DEV) {
  const assert = (label: string, cond: boolean) => {
    if (!cond) console.error(`[debtSimplify] FAIL: ${label}`);
    else console.info(`[debtSimplify] PASS: ${label}`);
  };

  // Test 1: three-way split reduces to 2 transactions instead of 3
  // A paid 90, B paid 0, C paid 0, each owes 30 → B→A 30, C→A 30
  const t1 = simplifyDebts([
    { from: 'B', to: 'A', amount: 30 },
    { from: 'C', to: 'A', amount: 30 },
  ]);
  assert('T1: 2 transactions', t1.length === 2);
  assert('T1: B→A 30', t1.some(d => d.from === 'B' && d.to === 'A' && d.amount === 30));
  assert('T1: C→A 30', t1.some(d => d.from === 'C' && d.to === 'A' && d.amount === 30));

  // Test 2: triangle of raw debts simplifies
  // A→B 10, B→C 10, C→A 10 → all cancel out, net 0
  const t2 = simplifyDebts([
    { from: 'A', to: 'B', amount: 10 },
    { from: 'B', to: 'C', amount: 10 },
    { from: 'C', to: 'A', amount: 10 },
  ]);
  assert('T2: triangle cancels to 0', t2.length === 0);

  // Test 3: chain A→B 50, B→C 30 → A→C 30, A→B 20
  // Net: A=-50, B=+50-30=+20, C=+30 → A pays B 20, A pays C 30
  const t3 = simplifyDebts([
    { from: 'A', to: 'B', amount: 50 },
    { from: 'B', to: 'C', amount: 30 },
  ]);
  assert('T3: chain reduces to 2', t3.length === 2);
  assert('T3: all from A', t3.every(d => d.from === 'A'));
  assert('T3: total equals 50', t3.reduce((s, d) => s + d.amount, 0) === 50);

  // Test 4: already settled
  const t4 = simplifyDebts([]);
  assert('T4: empty input = empty output', t4.length === 0);

  // Test 5: balancesToTransactions directly
  const t5 = balancesToTransactions([
    { userId: 'X', amount: 100 },
    { userId: 'Y', amount: -60 },
    { userId: 'Z', amount: -40 },
  ]);
  assert('T5: 2 transactions', t5.length === 2);
  assert('T5: Y→X 60', t5.some(d => d.from === 'Y' && d.to === 'X' && d.amount === 60));
  assert('T5: Z→X 40', t5.some(d => d.from === 'Z' && d.to === 'X' && d.amount === 40));
}
