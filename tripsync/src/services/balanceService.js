import { supabase } from '../supabaseClient';
import {
    calculateSettlements,
    formatCents,
    sumExpenseCents,
} from './expenseMath';

/**
 * FR-5.1: Get balances for all participants in a trip
 * Returns: Map of userId -> { userId, name, paidCents, owedCents, balanceCents }
 */
export const getTripBalances = async (tripId, participants, expenses) => {
    try {
        if (!Array.isArray(participants) || participants.length === 0) {
            return { data: {}, error: null };
        }

        if (!Array.isArray(expenses)) {
            expenses = [];
        }

        // Calculate total amount paid by each participant
        const paidByUser = {};
        participants.forEach(p => {
            paidByUser[p.userId] = 0;
        });

        expenses.forEach(exp => {
            const paidBy = exp.paid_by || exp.paidBy;
            if (paidByUser.hasOwnProperty(paidBy)) {
                paidByUser[paidBy] += exp.amount_cents || 0;
            }
        });

        // Get expense splits to see what each person owes
        const { data: splits, error: splitsError } = await supabase
            .from('expense_splits')
            .select('user_id, amount_cents')
            .eq('trip_id', tripId);

        if (splitsError) throw splitsError;

        const owedByUser = {};
        participants.forEach(p => {
            owedByUser[p.userId] = 0;
        });

        (splits || []).forEach(split => {
            if (owedByUser.hasOwnProperty(split.user_id)) {
                owedByUser[split.user_id] += split.amount_cents || 0;
            }
        });

        // Build balance map
        const balances = {};
        participants.forEach(p => {
            const paidCents = paidByUser[p.userId] || 0;
            const owedCents = owedByUser[p.userId] || 0;
            const balanceCents = paidCents - owedCents; // Positive = owed money, Negative = owes money

            balances[p.userId] = {
                userId: p.userId,
                name: p.username || p.email || p.userId,
                email: p.email,
                paidCents,
                owedCents,
                balanceCents,
                paidFormatted: formatCents(paidCents),
                owedFormatted: formatCents(owedCents),
                balanceFormatted: formatCents(balanceCents),
            };
        });

        return { data: balances, error: null };
    } catch (error) {
        console.error('Error calculating trip balances:', error);
        return { data: {}, error };
    }
};

/**
 * FR-5.2: Get settlement plan (minimum transactions to balance all debts)
 * Returns: Array of settlement transactions { from, fromId, to, toId, amountCents, amountFormatted }
 */
export const getSettlementPlan = async (tripId, participants, expenses) => {
    try {
        if (!Array.isArray(participants) || participants.length === 0) {
            return { data: [], error: null };
        }

        // Get current balances
        const { data: balances, error: balanceError } = await getTripBalances(
            tripId,
            participants,
            expenses || []
        );

        if (balanceError) throw balanceError;

        // Separate debtors and creditors based on balance
        const debtors = []; // People who owe money (negative balance)
        const creditors = []; // People owed money (positive balance)

        Object.values(balances).forEach(balance => {
            if (balance.balanceCents < 0) {
                debtors.push({
                    userId: balance.userId,
                    name: balance.name,
                    amount_cents: Math.abs(balance.balanceCents),
                });
            } else if (balance.balanceCents > 0) {
                creditors.push({
                    userId: balance.userId,
                    name: balance.name,
                    amount_cents: balance.balanceCents,
                });
            }
        });

        // Greedy algorithm to minimize transactions
        const settlements = [];
        let debtorIndex = 0;
        let creditorIndex = 0;

        while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
            const debtor = debtors[debtorIndex];
            const creditor = creditors[creditorIndex];
            const amount = Math.min(debtor.amount_cents, creditor.amount_cents);

            if (amount > 0) {
                settlements.push({
                    fromId: debtor.userId,
                    from: debtor.name,
                    toId: creditor.userId,
                    to: creditor.name,
                    amount_cents: amount,
                    amountFormatted: formatCents(amount),
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

        return { data: settlements, error: null };
    } catch (error) {
        console.error('Error calculating settlement plan:', error);
        return { data: [], error };
    }
};

/**
 * FR-5.3: Record a payment/settlement between two users
 */
export const recordPayment = async (tripId, fromUserId, toUserId, amountCents, notes = '') => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .insert([{
                trip_id: tripId,
                from_user_id: fromUserId,
                to_user_id: toUserId,
                amount_cents: amountCents,
                status: 'pending',
                notes: notes || null,
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            data: {
                ...data,
                amountFormatted: formatCents(data.amount_cents),
            },
            error: null,
        };
    } catch (error) {
        console.error('Error recording payment:', error);
        return { data: null, error };
    }
};

/**
 * FR-5.3: Mark a payment as settled
 */
export const settlePayment = async (paymentId) => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .update({
                status: 'settled',
                settled_at: new Date().toISOString(),
            })
            .eq('id', paymentId)
            .select()
            .single();

        if (error) throw error;

        return {
            data: {
                ...data,
                amountFormatted: formatCents(data.amount_cents),
            },
            error: null,
        };
    } catch (error) {
        console.error('Error settling payment:', error);
        return { data: null, error };
    }
};

/**
 * Get all payments for a trip
 */
export const getTripPayments = async (tripId) => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map(payment => ({
            ...payment,
            amountFormatted: formatCents(payment.amount_cents),
        }));

        return { data: formatted, error: null };
    } catch (error) {
        console.error('Error fetching trip payments:', error);
        return { data: [], error };
    }
};

/**
 * Get unpaid settlements for a trip
 */
export const getUnpaidSettlements = async (tripId) => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('trip_id', tripId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map(payment => ({
            ...payment,
            amountFormatted: formatCents(payment.amount_cents),
        }));

        return { data: formatted, error: null };
    } catch (error) {
        console.error('Error fetching unpaid settlements:', error);
        return { data: [], error };
    }
};

export default {
    getTripBalances,
    getSettlementPlan,
    recordPayment,
    settlePayment,
    getTripPayments,
    getUnpaidSettlements,
};
