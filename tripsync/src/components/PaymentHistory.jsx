import React from 'react';
import { getTripPayments, settlePayment } from '../services/balanceService';
import { supabase } from '../supabaseClient';
import '../design/main.css';

/**
 * FR-5.3: Payment History View
 * Shows recorded payments and allows marking them as settled
 */
export default function PaymentHistory({ tripId, participants, currentUser }) {
    const [payments, setPayments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [settlingPayment, setSettlingPayment] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('all'); // 'all' | 'pending' | 'settled'

    // Load payments
    const loadPayments = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: paymentsData, error: payError } = await getTripPayments(tripId);
            if (payError) throw payError;

            setPayments(paymentsData || []);
        } catch (err) {
            console.error('Error loading payments:', err);
            setError(err.message || 'Failed to load payments');
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    // Initial load
    React.useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    // Subscribe to real-time updates
    React.useEffect(() => {
        if (!tripId) return;

        const channel = supabase.channel(`trip-payments-${tripId}`);
        channel
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'payments',
                filter: `trip_id=eq.${tripId}`,
            }, () => {
                loadPayments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tripId, loadPayments]);

    // Get participant name by ID
    const getParticipantName = (userId) => {
        const participant = participants.find(p => p.userId === userId);
        return participant?.username || participant?.email || userId;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleMarkSettled = async (paymentId) => {
        try {
            setSettlingPayment(paymentId);
            const { data, error } = await settlePayment(paymentId);

            if (error) throw error;

            // Refresh payments
            await loadPayments();
        } catch (err) {
            console.error('Error marking payment as settled:', err);
            alert('Failed to mark payment as settled: ' + err.message);
        } finally {
            setSettlingPayment(null);
        }
    };

    // Filter payments based on active tab
    const filteredPayments = payments.filter(p => {
        if (activeTab === 'pending') return p.status === 'pending';
        if (activeTab === 'settled') return p.status === 'settled';
        return true; // 'all'
    });

    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const settledCount = payments.filter(p => p.status === 'settled').length;

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Loading payment history...
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

    return (
        <div className="payment-history">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
            }}>
                <h3 style={{ margin: 0 }}>📜 Payment History</h3>
                <button
                    onClick={loadPayments}
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

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '15px',
                borderBottom: '2px solid #e0e0e0',
            }}>
                {[
                    { id: 'all', label: `All (${payments.length})` },
                    { id: 'pending', label: `Pending (${pendingCount})` },
                    { id: 'settled', label: `Settled (${settledCount})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 15px',
                            background: activeTab === tab.id ? '#3498db' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#666',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '3px solid #3498db' : 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            marginBottom: '-2px',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filteredPayments.length === 0 ? (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#999',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                }}>
                    {activeTab === 'all' && 'No payments recorded yet'}
                    {activeTab === 'pending' && 'No pending payments'}
                    {activeTab === 'settled' && 'No settled payments'}
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}>
                    {filteredPayments.map(payment => {
                        const isUserInvolved = payment.from_user_id === currentUser?.id
                            || payment.to_user_id === currentUser?.id;
                        const fromName = getParticipantName(payment.from_user_id);
                        const toName = getParticipantName(payment.to_user_id);
                        const isPending = payment.status === 'pending';

                        return (
                            <div
                                key={payment.id}
                                style={{
                                    padding: '12px',
                                    background: isUserInvolved ? '#e8f4f8' : 'white',
                                    border: isUserInvolved ? '2px solid #3498db' : '1px solid #e0e0e0',
                                    borderRadius: '6px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr 100px',
                                    gap: '12px',
                                    alignItems: 'center',
                                }}
                            >
                                {/* From → To */}
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                                        Payment Flow
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>
                                        {fromName} → {toName}
                                    </div>
                                    {isUserInvolved && (
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#3498db',
                                            fontWeight: 600,
                                            marginTop: '2px',
                                        }}>
                                            {payment.from_user_id === currentUser?.id ? 'You pay' : 'You receive'}
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                                        Amount
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#2c3e50' }}>
                                        {payment.amountFormatted}
                                    </div>
                                </div>

                                {/* Date */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                                        {isPending ? 'Recorded' : 'Settled'}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                        {formatDate(isPending ? payment.created_at : payment.settled_at)}
                                    </div>
                                </div>

                                {/* Status / Action */}
                                <div style={{ textAlign: 'right' }}>
                                    {isPending ? (
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 8px',
                                            background: '#fff3cd',
                                            color: '#856404',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                        }}>
                                            ⏳ Pending
                                        </span>
                                    ) : (
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 8px',
                                            background: '#d4edda',
                                            color: '#155724',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                        }}>
                                            ✅ Settled
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {pendingCount > 0 && (
                <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    background: '#fff3cd',
                    borderLeft: '4px solid #ffc107',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#856404',
                }}>
                    <strong>⚠️ {pendingCount} pending payment{pendingCount !== 1 ? 's' : ''}:</strong> These payments
                    have been recorded but not yet marked as settled. Once payments are confirmed, they'll move to settled status.
                </div>
            )}
        </div>
    );
}
