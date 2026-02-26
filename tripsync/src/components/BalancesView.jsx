import React from 'react';
import { getTripBalances } from '../services/balanceService';
import { getExpenses } from '../tripService';
import { supabase } from '../supabaseClient';
import '../design/main.css';

/**
 * FR-5.1: Balances View
 * Shows each member's net balance (total paid minus total owed) in real time
 */
export default function BalancesView({ tripId, participants, onRefresh }) {
    const [balances, setBalances] = React.useState({});
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    // Load balances
    const loadBalances = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: expenses, error: expError } = await getExpenses(tripId);
            if (expError) throw expError;

            const { data: balancesData, error: balError } = await getTripBalances(
                tripId,
                participants,
                expenses
            );
            if (balError) throw balError;

            setBalances(balancesData || {});
        } catch (err) {
            console.error('Error loading balances:', err);
            setError(err.message || 'Failed to load balances');
        } finally {
            setLoading(false);
        }
    }, [tripId, participants]);

    // Initial load
    React.useEffect(() => {
        loadBalances();
    }, [loadBalances]);

    // Subscribe to real-time updates for expenses and expense_splits
    React.useEffect(() => {
        if (!tripId) return;

        const expenseChannel = supabase.channel(`trip-expenses-${tripId}`);
        expenseChannel
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expenses',
                filter: `trip_id=eq.${tripId}`,
            }, () => {
                loadBalances();
            })
            .subscribe();

        const splitsChannel = supabase.channel(`trip-splits-${tripId}`);
        splitsChannel
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expense_splits',
                filter: `trip_id=eq.${tripId}`,
            }, () => {
                loadBalances();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(expenseChannel);
            supabase.removeChannel(splitsChannel);
        };
    }, [tripId, loadBalances]);

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Loading balances...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '15px',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '6px',
                color: '#c33',
            }}>
                Error: {error}
            </div>
        );
    }

    const balanceList = Object.values(balances);

    if (balanceList.length === 0) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#999',
                border: '2px dashed #ddd',
                borderRadius: '8px',
            }}>
                No participants to show balances
            </div>
        );
    }

    // Determine balance color
    const getBalanceColor = (balanceCents) => {
        if (balanceCents > 0) return '#27ae60'; // Green - owed money
        if (balanceCents < 0) return '#e74c3c'; // Red - owes money
        return '#95a5a6'; // Gray - even
    };

    const getBalanceLabel = (balanceCents) => {
        if (balanceCents > 0) return 'Gets back';
        if (balanceCents < 0) return 'Owes';
        return 'Settled';
    };

    return (
        <div className="balances-view">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
            }}>
                <h3 style={{ margin: 0 }}>💰 Member Balances</h3>
                <button
                    onClick={loadBalances}
                    style={{
                        padding: '6px 12px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
            }}>
                {balanceList.map(balance => (
                    <div
                        key={balance.userId}
                        style={{
                            padding: '12px',
                            background: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                {balance.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                {balance.email}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                                Paid
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#27ae60' }}>
                                {balance.paidFormatted}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                                Owes
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#e74c3c' }}>
                                {balance.owedFormatted}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                                {getBalanceLabel(balance.balanceCents)}
                            </div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: '14px',
                                color: getBalanceColor(balance.balanceCents),
                                padding: '4px 8px',
                                background: `${getBalanceColor(balance.balanceCents)}20`,
                                borderRadius: '4px',
                                display: 'inline-block',
                            }}>
                                {balance.balanceFormatted}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                marginTop: '15px',
                padding: '12px',
                background: '#f0f0f0',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#666',
            }}>
                <strong>How to read:</strong> Positive balance = money owed back to them. Negative balance = they owe money.
            </div>
        </div>
    );
}
