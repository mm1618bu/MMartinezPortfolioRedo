import React from 'react';
import { getSettlementPlan, recordPayment } from '../services/balanceService';
import { getExpenses } from '../tripService';
import { supabase } from '../supabaseClient';
import '../design/main.css';

/**
 * FR-5.2: Settlement Plan View
 * Computes the minimum number of transactions needed to settle all debts
 */
export default function SettlementPlanView({ tripId, participants, currentUser, onPaymentRecorded }) {
    const [settlements, setSettlements] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [recordingPayment, setRecordingPayment] = React.useState(null);

    // Load settlement plan
    const loadSettlements = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: expenses, error: expError } = await getExpenses(tripId);
            if (expError) throw expError;

            const { data: settlementsData, error: settlError } = await getSettlementPlan(
                tripId,
                participants,
                expenses
            );
            if (settlError) throw settlError;

            setSettlements(settlementsData || []);
        } catch (err) {
            console.error('Error loading settlements:', err);
            setError(err.message || 'Failed to load settlement plan');
        } finally {
            setLoading(false);
        }
    }, [tripId, participants]);

    // Initial load
    React.useEffect(() => {
        loadSettlements();
    }, [loadSettlements]);

    // Subscribe to real-time updates
    React.useEffect(() => {
        if (!tripId) return;

        const channel = supabase.channel(`trip-expenses-${tripId}`);
        channel
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expenses',
                filter: `trip_id=eq.${tripId}`,
            }, () => {
                loadSettlements();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tripId, loadSettlements]);

    const handleRecordPayment = async (settlement) => {
        try {
            setRecordingPayment(settlement.fromId);
            const { data, error } = await recordPayment(
                tripId,
                settlement.fromId,
                settlement.toId,
                settlement.amount_cents,
                `Settlement: ${settlement.from} → ${settlement.to}`
            );

            if (error) throw error;

            // Refresh settlements
            await loadSettlements();

            // Notify parent
            if (onPaymentRecorded) {
                onPaymentRecorded(data);
            }
        } catch (err) {
            console.error('Error recording payment:', err);
            alert('Failed to record payment: ' + err.message);
        } finally {
            setRecordingPayment(null);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Computing settlement plan...
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

    if (settlements.length === 0) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#999',
                border: '2px dashed #ddd',
                borderRadius: '8px',
            }}>
                ✅ All balances are settled! No transactions needed.
            </div>
        );
    }

    return (
        <div className="settlement-plan-view">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
            }}>
                <div>
                    <h3 style={{ margin: 0, marginBottom: '4px' }}>📋 Settlement Plan</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                        Minimum {settlements.length} transaction{settlements.length !== 1 ? 's' : ''} needed
                    </p>
                </div>
                <button
                    onClick={loadSettlements}
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
                {settlements.map((settlement, index) => {
                    const isUserInvolved = settlement.fromId === currentUser?.id || settlement.toId === currentUser?.id;
                    const isUserPaying = settlement.fromId === currentUser?.id;

                    return (
                        <div
                            key={index}
                            style={{
                                padding: '12px',
                                background: isUserInvolved ? '#e8f4f8' : 'white',
                                border: isUserInvolved ? '2px solid #3498db' : '1px solid #e0e0e0',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                    marginBottom: '4px',
                                }}>
                                    <span style={{ fontWeight: 600 }}>
                                        {settlement.from}
                                    </span>
                                    <span style={{ color: '#95a5a6' }}>→</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {settlement.to}
                                    </span>
                                </div>
                                {isUserInvolved && (
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#3498db',
                                        fontWeight: 600,
                                    }}>
                                        {isUserPaying ? '💵 You need to pay' : '✅ You will receive'}
                                    </div>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    color: '#2c3e50',
                                    minWidth: '80px',
                                    textAlign: 'right',
                                }}>
                                    {settlement.amountFormatted}
                                </div>

                                {isUserPaying && (
                                    <button
                                        onClick={() => handleRecordPayment(settlement)}
                                        disabled={recordingPayment === settlement.fromId}
                                        style={{
                                            padding: '6px 12px',
                                            background: recordingPayment === settlement.fromId
                                                ? '#95a5a6'
                                                : '#27ae60',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: recordingPayment === settlement.fromId ? 'default' : 'pointer',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {recordingPayment === settlement.fromId ? 'Recording...' : '✓ Record'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                marginTop: '15px',
                padding: '12px',
                background: '#e8f5e9',
                borderLeft: '4px solid #27ae60',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#2e7d32',
            }}>
                <strong>How it works:</strong> This plan uses an algorithm to calculate the minimum number
                of payments needed to balance everyone's debts. Click "Record" to log payments as they're made.
            </div>
        </div>
    );
}
