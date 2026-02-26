import React from 'react';
import '../design/main.css';
import {
    getTripParticipants,
    searchUsersByEmail,
    addUserToTrip,
    removeUserFromTrip
} from '../tripService';
import { supabase } from '../supabaseClient';

export default function TripParticipants({ tripId, currentUser, onParticipantsChange }) {
    const [participants, setParticipants] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [shareLink, setShareLink] = React.useState('');
    const [showShareModal, setShowShareModal] = React.useState(false);

    // Load participants on mount
    React.useEffect(() => {
        if (tripId) {
            loadParticipants();
        }
    }, [tripId]);

    React.useEffect(() => {
        if (!tripId) return;
        const channel = supabase.channel(`trip-participants-${tripId}`);
        channel
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'trip_participants',
                filter: `trip_id=eq.${tripId}`
            }, () => {
                loadParticipants();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tripId]);

    // Generate share link when trip ID is available
    React.useEffect(() => {
        const loadShareLink = async () => {
            if (tripId) {
                // Get trip details to get share token
                const { supabase } = await import('../supabaseClient');
                const { data } = await supabase
                    .from('trips')
                    .select('share_token')
                    .eq('id', tripId)
                    .single();
                
                if (data?.share_token) {
                    const link = `${window.location.origin}${window.location.pathname}?join=${data.share_token}`;
                    setShareLink(link);
                }
            }
        };
        loadShareLink();
    }, [tripId]);

    const loadParticipants = async () => {
        const { data } = await getTripParticipants(tripId);
        setParticipants(data || []);
        if (onParticipantsChange) {
            onParticipantsChange(data || []);
        }
    };

    const handleSearch = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (term.length >= 2) {
            setLoading(true);
            const { data } = await searchUsersByEmail(term);
            // Filter out already added participants
            const filtered = (data || []).filter(
                user => !participants.some(p => p.userId === user.id) && user.id !== currentUser.id
            );
            setSearchResults(filtered);
            setLoading(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleAddUser = async (userId) => {
        const { error } = await addUserToTrip(tripId, userId);
        if (error) {
            alert(error.message || 'Failed to add user');
        } else {
            setSearchTerm('');
            setSearchResults([]);
            loadParticipants();
        }
    };

    const handleRemoveUser = async (userId) => {
        if (window.confirm('Remove this person from the trip?')) {
            const { error } = await removeUserFromTrip(tripId, userId);
            if (error) {
                alert('Failed to remove user');
            } else {
                loadParticipants();
            }
        }
    };

    const copyShareLink = () => {
        navigator.clipboard.writeText(shareLink);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="trip-participants-section">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
            }}>
                <h3>Who is coming on this trip?</h3>
                <button
                    onClick={() => setShowShareModal(!showShareModal)}
                    style={{
                        padding: '8px 16px',
                        background: '#1abc9c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    📤 Share Trip
                </button>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div style={{
                    background: '#f8f9fa',
                    border: '2px solid #1abc9c',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px'
                }}>
                    <h4 style={{ marginTop: 0 }}>Share this trip</h4>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Anyone with this link can join the trip:
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        marginTop: '10px'
                    }}>
                        <input
                            type="text"
                            value={shareLink}
                            readOnly
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px'
                            }}
                        />
                        <button
                            onClick={copyShareLink}
                            style={{
                                padding: '10px 20px',
                                background: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            📋 Copy
                        </button>
                    </div>
                </div>
            )}

            {/* Search Users */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 600,
                    fontSize: '14px'
                }}>
                    Add people by email:
                </label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search by email..."
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '16px'
                    }}
                />
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div style={{
                        marginTop: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        background: 'white',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        {searchResults.map(user => (
                            <div
                                key={user.id}
                                style={{
                                    padding: '12px',
                                    borderBottom: '1px solid #f0f0f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{user.username}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                                </div>
                                <button
                                    onClick={() => handleAddUser(user.id)}
                                    style={{
                                        padding: '6px 12px',
                                        background: '#1abc9c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    + Add
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {loading && (
                    <div style={{
                        marginTop: '8px',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        Searching...
                    </div>
                )}
            </div>

            {/* Participants List */}
            <div>
                <h4 style={{ marginBottom: '10px' }}>Trip Members ({participants.length})</h4>
                {participants.length === 0 ? (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#999',
                        border: '2px dashed #ddd',
                        borderRadius: '8px'
                    }}>
                        No participants yet. Add people or share the trip link!
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {participants.map(participant => (
                            <div
                                key={participant.id}
                                style={{
                                    padding: '12px',
                                    background: 'white',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {participant.username}
                                        {participant.role === 'creator' && (
                                            <span style={{
                                                fontSize: '11px',
                                                background: '#1abc9c',
                                                color: 'white',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                CREATOR
                                            </span>
                                        )}
                                        {participant.userId === currentUser.id && (
                                            <span style={{
                                                fontSize: '11px',
                                                background: '#3498db',
                                                color: 'white',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                YOU
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#666',
                                        marginTop: '2px'
                                    }}>
                                        {participant.email}
                                    </div>
                                    {participant.status === 'pending' && (
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#f39c12',
                                            marginTop: '4px'
                                        }}>
                                            ⏳ Invitation pending
                                        </div>
                                    )}
                                </div>
                                {participant.role !== 'creator' && participant.userId !== currentUser.id && (
                                    <button
                                        onClick={() => handleRemoveUser(participant.userId)}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#e74c3c',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
