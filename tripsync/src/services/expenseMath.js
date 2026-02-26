export const toCents = (amount) => {
  const numeric = typeof amount === 'string' ? Number.parseFloat(amount) : Number(amount);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100);
};

export const formatCents = (cents) => {
  const safeCents = Number.isFinite(cents) ? Math.round(cents) : 0;
  const sign = safeCents < 0 ? '-' : '';
  const absolute = Math.abs(safeCents);
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  return `${sign}${dollars}.${remainder.toString().padStart(2, '0')}`;
};

export const sumExpenseCents = (expenses) => {
  if (!Array.isArray(expenses)) {
    return 0;
  }
  return expenses.reduce((total, expense) => total + resolveExpenseCents(expense), 0);
};

export const splitEvenly = (totalCents, participantIds) => {
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return [];
  }
  const safeTotal = Number.isFinite(totalCents) ? Math.round(totalCents) : 0;
  const count = participantIds.length;
  const baseShare = Math.floor(safeTotal / count);
  const remainder = safeTotal % count;

  return participantIds.map((userId, index) => ({
    user_id: userId,
    amount_cents: baseShare + (index < remainder ? 1 : 0)
  }));
};

export const splitByPercentages = (totalCents, percentagesByUser) => {
  const entries = Object.entries(percentagesByUser || {});
  if (entries.length === 0) {
    return [];
  }
  const safeTotal = Number.isFinite(totalCents) ? Math.round(totalCents) : 0;
  const totalPercent = entries.reduce((sum, [, pct]) => sum + Number(pct || 0), 0);
  if (totalPercent <= 0) {
    return entries.map(([userId]) => ({ user_id: userId, amount_cents: 0 }));
  }

  const rawSplits = entries.map(([userId, pct]) => {
    const normalizedPct = Number(pct || 0) / totalPercent;
    const rawAmount = safeTotal * normalizedPct;
    return {
      user_id: userId,
      rawAmount,
      floorAmount: Math.floor(rawAmount)
    };
  });

  const floorTotal = rawSplits.reduce((sum, item) => sum + item.floorAmount, 0);
  let remainder = safeTotal - floorTotal;

  rawSplits.sort((a, b) => (b.rawAmount - b.floorAmount) - (a.rawAmount - a.floorAmount));

  const settled = rawSplits.map((item) => ({
    user_id: item.user_id,
    amount_cents: item.floorAmount
  }));

  for (let i = 0; i < settled.length && remainder > 0; i += 1) {
    settled[i].amount_cents += 1;
    remainder -= 1;
  }

  return settled;
};

export const calculateSettlements = (participants, expenses) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    return [];
  }

  const participantList = participants
    .filter((participant) => participant?.userId)
    .map((participant, index) => ({
      userId: participant.userId,
      name: participant.username || participant.email || participant.userId,
      index,
      paidCents: 0,
      shareCents: 0
    }));

  if (participantList.length === 0) {
    return [];
  }

  const totalCents = sumExpenseCents(expenses);
  const baseShare = Math.floor(totalCents / participantList.length);
  const remainder = totalCents % participantList.length;

  participantList.forEach((participant, index) => {
    participant.shareCents = baseShare + (index < remainder ? 1 : 0);
  });

  if (Array.isArray(expenses)) {
    expenses.forEach((expense) => {
      const paidBy = expense?.paidBy || expense?.paid_by;
      const amountCents = resolveExpenseCents(expense);
      const participant = participantList.find((entry) => entry.userId === paidBy);
      if (participant) {
        participant.paidCents += amountCents;
      }
    });
  }

  const debtors = [];
  const creditors = [];

  participantList.forEach((participant) => {
    const balanceCents = participant.shareCents - participant.paidCents;
    if (balanceCents > 0) {
      debtors.push({ name: participant.name, amount_cents: balanceCents });
    } else if (balanceCents < 0) {
      creditors.push({ name: participant.name, amount_cents: Math.abs(balanceCents) });
    }
  });

  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount_cents, creditor.amount_cents);

    if (amount > 0) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount_cents: amount
      });
    }

    debtor.amount_cents -= amount;
    creditor.amount_cents -= amount;

    if (debtor.amount_cents === 0) {
      debtorIndex += 1;
    }
    if (creditor.amount_cents === 0) {
      creditorIndex += 1;
    }
  }

  return settlements;
};

const resolveExpenseCents = (expense) => {
  if (!expense) {
    return 0;
  }
  if (Number.isFinite(expense.amount_cents)) {
    return Math.round(expense.amount_cents);
  }
  if (Number.isFinite(expense.amount)) {
    return toCents(expense.amount);
  }
  return 0;
};

export default {
  toCents,
  formatCents,
  sumExpenseCents,
  splitEvenly,
  splitByPercentages,
  calculateSettlements
};
