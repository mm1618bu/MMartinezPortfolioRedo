import React from "react";
import '../design/main.css';
import TripParticipants from './TripParticipants';
import BalancesView from './BalancesView';
import SettlementPlanView from './SettlementPlanView';
import PaymentHistory from './PaymentHistory';
import { supabase } from '../supabaseClient';
import {
    calculateSettlements,
    formatCents,
    sumExpenseCents,
    toCents
} from '../services/expenseMath';
import { getTripStatusLabel } from '../services/tripStatus';
import {
    getAccommodations,
    addAccommodation,
    setAccommodationBooked,
    getAccommodationVotes,
    toggleAccommodationVote,
    getExpenses,
    addExpense
} from '../tripService';

export default function TripChoices({ tripInfo, tripId, currentUser }) {
    const [participants, setParticipants] = React.useState([]);
    const [newAccommodation, setNewAccommodation] = React.useState('');
    const [newPrice, setNewPrice] = React.useState('');
    const [newBeds, setNewBeds] = React.useState('');
    const [accommodations, setAccommodations] = React.useState([]);
    const [selectedParticipantId, setSelectedParticipantId] = React.useState('');
    const accommodationIdsRef = React.useRef(new Set());
    
    // Expense tracking state
    const [expenses, setExpenses] = React.useState([]);
    const [newExpenseDescription, setNewExpenseDescription] = React.useState('');
    const [newExpenseAmount, setNewExpenseAmount] = React.useState('');
    const [newExpensePaidBy, setNewExpensePaidBy] = React.useState('');
    const [newExpenseCategory, setNewExpenseCategory] = React.useState('accommodation');
    
    // Finances view state
    const [financesTab, setFinancesTab] = React.useState('balances'); // 'balances', 'settlements', 'payments'

    // Handle participant list updates
    const handleParticipantsChange = (newParticipants) => {
        setParticipants(newParticipants);
        if (!selectedParticipantId && currentUser) {
            const currentUserParticipant = newParticipants.find(p => p.userId === currentUser.id);
            if (currentUserParticipant) {
                setSelectedParticipantId(currentUserParticipant.userId);
            }
        }
    };

    const handleAddAccommodation = (e) => {
        e.preventDefault();
        if (!tripId) return;
        if (newAccommodation.trim()) {
            let url = null;
            let name = newAccommodation.trim();

            try {
                const urlObj = new URL(newAccommodation.trim());
                url = newAccommodation.trim();
                name = urlObj.hostname.replace('www.', '');

                const urlExists = accommodations.some(acc => acc.url === url);
                if (urlExists) {
                    alert('This accommodation URL has already been added!');
                    return;
                }
            } catch (error) {
                name = newAccommodation.trim();
            }

            addAccommodation(tripId, currentUser?.id, {
                name,
                url,
                price: newPrice ? parseFloat(newPrice) : null,
                beds: newBeds ? parseInt(newBeds) : null
            }).then(({ error }) => {
                if (error) {
                    alert('Failed to add accommodation');
                    return;
                }
                setNewAccommodation('');
                setNewPrice('');
                setNewBeds('');
                loadAccommodationsAndVotes();
            });
        }
    };

    const handleVote = (accommodationId) => {
        if (!selectedParticipantId || selectedParticipantId !== currentUser?.id) {
            alert('You can only vote as yourself.');
            return;
        }

        toggleAccommodationVote(accommodationId, currentUser.id).then(({ error }) => {
            if (error) {
                alert('Failed to record vote');
                return;
            }
            loadAccommodationsAndVotes();
        });
    };

    const handleToggleBooked = (accommodationId) => {
        const target = accommodations.find(acc => acc.id === accommodationId);
        if (!target) return;
        setAccommodationBooked(accommodationId, !target.booked).then(({ error }) => {
            if (error) {
                alert('Failed to update booking status');
                return;
            }
            loadAccommodationsAndVotes();
        });
    };

    const getWinner = () => {
        if (accommodations.length === 0) return null;
        
        let winner = accommodations[0];
        accommodations.forEach((acc) => {
            if (acc.voters.length > winner.voters.length) {
                winner = acc;
            }
        });
        
        // Return winner only if they have at least 1 vote
        return winner.voters.length > 0 ? winner : null;
    };

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (newExpenseDescription.trim() && newExpenseAmount && newExpensePaidBy) {
            if (!tripId) return;
            addExpense(tripId, currentUser?.id, {
                description: newExpenseDescription.trim(),
                amount_cents: toCents(newExpenseAmount),
                paidBy: newExpensePaidBy,
                category: newExpenseCategory,
                date: new Date().toISOString().slice(0, 10)
            }).then(({ error }) => {
                if (error) {
                    alert('Failed to add expense');
                    return;
                }
                setNewExpenseDescription('');
                setNewExpenseAmount('');
                setNewExpensePaidBy('');
                setNewExpenseCategory('accommodation');
                loadExpenses();
            });
        }
    };

    const loadAccommodationsAndVotes = React.useCallback(async () => {
        if (!tripId) return;
        const { data: accData } = await getAccommodations(tripId);
        const accommodationIds = accData.map(acc => acc.id);
        accommodationIdsRef.current = new Set(accommodationIds);

        const { data: voteData } = await getAccommodationVotes(accommodationIds);
        const votesByAccommodation = voteData.reduce((acc, vote) => {
            if (!acc[vote.accommodation_id]) acc[vote.accommodation_id] = [];
            acc[vote.accommodation_id].push(vote.user_id);
            return acc;
        }, {});

        const normalized = accData.map(acc => ({
            id: acc.id,
            name: acc.name,
            url: acc.url,
            price: acc.price,
            beds: acc.beds,
            voters: votesByAccommodation[acc.id] || [],
            booked: acc.is_booked
        }));

        setAccommodations(normalized);
        localStorage.setItem(`trip_${tripId}_accommodations`, JSON.stringify(normalized));
    }, [tripId]);

    const loadExpenses = React.useCallback(async () => {
        if (!tripId) return;
        const { data: expData } = await getExpenses(tripId);
        const normalized = expData.map(exp => ({
            id: exp.id,
            description: exp.description,
            amount_cents: Number(exp.amount_cents ?? exp.amount ?? 0),
            paidBy: exp.paid_by,
            category: exp.category,
            date: exp.expense_date
        }));
        setExpenses(normalized);
        localStorage.setItem(`trip_${tripId}_expenses`, JSON.stringify(normalized));
    }, [tripId]);

    React.useEffect(() => {
        if (!tripId) return;
        const cachedAccommodations = localStorage.getItem(`trip_${tripId}_accommodations`);
        if (cachedAccommodations) {
            try {
                const parsed = JSON.parse(cachedAccommodations);
                setAccommodations(parsed);
            } catch (error) {
                localStorage.removeItem(`trip_${tripId}_accommodations`);
            }
        }

        const cachedExpenses = localStorage.getItem(`trip_${tripId}_expenses`);
        if (cachedExpenses) {
            try {
                const parsed = JSON.parse(cachedExpenses);
                setExpenses(parsed);
            } catch (error) {
                localStorage.removeItem(`trip_${tripId}_expenses`);
            }
        }

        loadAccommodationsAndVotes();
        loadExpenses();
    }, [tripId, loadAccommodationsAndVotes, loadExpenses]);

    React.useEffect(() => {
        if (!tripId) return;
        const channel = supabase.channel(`trip-${tripId}-realtime`);

        channel
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'accommodations',
                filter: `trip_id=eq.${tripId}`
            }, () => {
                loadAccommodationsAndVotes();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'accommodation_votes'
            }, (payload) => {
                const voteAccId = payload?.new?.accommodation_id || payload?.old?.accommodation_id;
                if (voteAccId && accommodationIdsRef.current.has(voteAccId)) {
                    loadAccommodationsAndVotes();
                }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expenses',
                filter: `trip_id=eq.${tripId}`
            }, () => {
                loadExpenses();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tripId, loadAccommodationsAndVotes, loadExpenses]);

    const winner = getWinner();
    const settlements = calculateSettlements(participants, expenses);
    const totalExpenses = sumExpenseCents(expenses);

    return (
        <div className="tripChoicesBox">
            <div className="trip-choices-header">
                <h2>Trip Planning Dashboard</h2>
                <span className="status-pill">
                    {getTripStatusLabel(tripInfo.tripStatus)}
                </span>
            </div>
            
            {/* Trip Information Summary */}
            {tripInfo && (tripInfo.startPoint || tripInfo.endPoint || tripInfo.departureDate || tripInfo.returnDate) && (
                <div className="trip-summary-section">
                    <div className="trip-summary-grid">
                        {tripInfo.startPoint && (
                            <div className="trip-info-item">
                                <span className="trip-label">From</span>
                                <span className="trip-value">{tripInfo.startPoint}</span>
                            </div>
                        )}
                        {tripInfo.endPoint && (
                            <div className="trip-info-item">
                                <span className="trip-label">To</span>
                                <span className="trip-value">{tripInfo.endPoint}</span>
                            </div>
                        )}
                        {tripInfo.departureDate && (
                            <div className="trip-info-item">
                                <span className="trip-label">Departure</span>
                                <span className="trip-value">{new Date(tripInfo.departureDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        {tripInfo.returnDate && (
                            <div className="trip-info-item">
                                <span className="trip-label">Return</span>
                                <span className="trip-value">{new Date(tripInfo.returnDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        {tripInfo.travelers && (
                            <div className="trip-info-item">
                                <span className="trip-label">Expected Travelers</span>
                                <span className="trip-value">{tripInfo.travelers}</span>
                            </div>
                        )}
                        {tripInfo.modeOfTravel && (
                            <div className="trip-info-item">
                                <span className="trip-label">Mode of Travel</span>
                                <span className="trip-value">{tripInfo.modeOfTravel}</span>
                            </div>
                        )}
                    </div>

                    {/* Travel Details */}
                    {tripInfo.modeOfTravel && tripInfo.travelDetails && (
                        <div className="travel-details-summary">
                            {/* OUTBOUND JOURNEY */}
                            <div className="journey-details">
                                <h4 className="journey-heading">➜ Outbound Journey (To Destination)</h4>
                                {tripInfo.modeOfTravel === 'Plane' && (tripInfo.travelDetails.outbound.plane.airline || tripInfo.travelDetails.outbound.plane.flightNumber) && (
                                    <div className="travel-detail">
                                        <h5>✈️ Flight Details</h5>
                                        {tripInfo.travelDetails.outbound.plane.airline && <p><strong>Airline:</strong> {tripInfo.travelDetails.outbound.plane.airline}</p>}
                                        {tripInfo.travelDetails.outbound.plane.flightNumber && <p><strong>Flight:</strong> {tripInfo.travelDetails.outbound.plane.flightNumber}</p>}
                                        {tripInfo.travelDetails.outbound.plane.departureTime && <p><strong>Departs:</strong> {tripInfo.travelDetails.outbound.plane.departureTime}</p>}
                                        {tripInfo.travelDetails.outbound.plane.arrivalTime && <p><strong>Arrives:</strong> {tripInfo.travelDetails.outbound.plane.arrivalTime}</p>}
                                    </div>
                                )}
                                {tripInfo.modeOfTravel === 'Train' && (tripInfo.travelDetails.outbound.train.trainNumber || tripInfo.travelDetails.outbound.train.station) && (
                                    <div className="travel-detail">
                                        <h5>🚂 Train Details</h5>
                                        {tripInfo.travelDetails.outbound.train.trainNumber && <p><strong>Train:</strong> {tripInfo.travelDetails.outbound.train.trainNumber}</p>}
                                        {tripInfo.travelDetails.outbound.train.station && <p><strong>Station:</strong> {tripInfo.travelDetails.outbound.train.station}</p>}
                                        {tripInfo.travelDetails.outbound.train.departureTime && <p><strong>Departs:</strong> {tripInfo.travelDetails.outbound.train.departureTime}</p>}
                                        {tripInfo.travelDetails.outbound.train.arrivalTime && <p><strong>Arrives:</strong> {tripInfo.travelDetails.outbound.train.arrivalTime}</p>}
                                    </div>
                                )}
                                {tripInfo.modeOfTravel === 'Bus' && (tripInfo.travelDetails.outbound.bus.company || tripInfo.travelDetails.outbound.bus.station) && (
                                    <div className="travel-detail">
                                        <h5>🚌 Bus Details</h5>
                                        {tripInfo.travelDetails.outbound.bus.company && <p><strong>Company:</strong> {tripInfo.travelDetails.outbound.bus.company}</p>}
                                        {tripInfo.travelDetails.outbound.bus.station && <p><strong>Station:</strong> {tripInfo.travelDetails.outbound.bus.station}</p>}
                                        {tripInfo.travelDetails.outbound.bus.departureTime && <p><strong>Departs:</strong> {tripInfo.travelDetails.outbound.bus.departureTime}</p>}
                                        {tripInfo.travelDetails.outbound.bus.arrivalTime && <p><strong>Arrives:</strong> {tripInfo.travelDetails.outbound.bus.arrivalTime}</p>}
                                    </div>
                                )}
                                {tripInfo.modeOfTravel === 'Car' && (tripInfo.travelDetails.outbound.car.rentalCompany || tripInfo.travelDetails.outbound.car.vehicleType) && (
                                    <div className="travel-detail">
                                        <h5>🚗 Car Details</h5>
                                        {tripInfo.travelDetails.outbound.car.rentalCompany && <p><strong>Company:</strong> {tripInfo.travelDetails.outbound.car.rentalCompany}</p>}
                                        {tripInfo.travelDetails.outbound.car.vehicleType && <p><strong>Vehicle:</strong> {tripInfo.travelDetails.outbound.car.vehicleType}</p>}
                                        {tripInfo.travelDetails.outbound.car.pickupLocation && <p><strong>Pickup:</strong> {tripInfo.travelDetails.outbound.car.pickupLocation}</p>}
                                        {tripInfo.travelDetails.outbound.car.dropoffLocation && <p><strong>Dropoff:</strong> {tripInfo.travelDetails.outbound.car.dropoffLocation}</p>}
                                    </div>
                                )}
                            </div>

                            {/* RETURN JOURNEY */}
                            <div className="journey-details">
                                <h4 className="journey-heading">↩️ Return Journey (Heading Home)</h4>
                                {tripInfo.modeOfTravel === 'Plane' && (tripInfo.travelDetails.return.plane.airline || tripInfo.travelDetails.return.plane.flightNumber) && (
                                    <div className="travel-detail">
                                        <h5>✈️ Flight Details</h5>
                                        {tripInfo.travelDetails.return.plane.airline && <p><strong>Airline:</strong> {tripInfo.travelDetails.return.plane.airline}</p>}
                                        {tripInfo.travelDetails.return.plane.flightNumber && <p><strong>Flight:</strong> {tripInfo.travelDetails.return.plane.flightNumber}</p>}
                                        {tripInfo.travelDetails.return.plane.departureTime && <p><strong>Departs:</strong> {tripInfo.travelDetails.return.plane.departureTime}</p>}
                                        {tripInfo.travelDetails.return.plane.arrivalTime && <p><strong>Arrives:</strong> {tripInfo.travelDetails.return.plane.arrivalTime}</p>}
                                    </div>
                                )}
                                {tripInfo.modeOfTravel === 'Train' && (tripInfo.travelDetails.return.train.trainNumber || tripInfo.travelDetails.return.train.station) && (
                                    <div className="travel-detail">
                                        <h5>🚂 Train Details</h5>
                                        {tripInfo.travelDetails.return.train.trainNumber && <p><strong>Train:</strong> {tripInfo.travelDetails.return.train.trainNumber}</p>}
                                        {tripInfo.travelDetails.return.train.station && <p><strong>Station:</strong> {tripInfo.travelDetails.return.train.station}</p>}
                                        {tripInfo.travelDetails.return.train.departureTime && <p><strong>Departs:</strong> {tripInfo.travelDetails.return.train.departureTime}</p>}
                                        {tripInfo.travelDetails.return.train.arrivalTime && <p><strong>Arrives:</strong> {tripInfo.travelDetails.return.train.arrivalTime}</p>}
                                    </div>
                                )}
                                {tripInfo.modeOfTravel === 'Bus' && (tripInfo.travelDetails.return.bus.company || tripInfo.travelDetails.return.bus.station) && (
                                    <div className="travel-detail">
                                        <h5>🚌 Bus Details</h5>
                                        {tripInfo.travelDetails.return.bus.company && <p><strong>Company:</strong> {tripInfo.travelDetails.return.bus.company}</p>}
                                        {tripInfo.travelDetails.return.bus.station && <p><strong>Station:</strong> {tripInfo.travelDetails.return.bus.station}</p>}
                                        {tripInfo.travelDetails.return.bus.departureTime && <p><strong>Departs:</strong> {tripInfo.travelDetails.return.bus.departureTime}</p>}
                                        {tripInfo.travelDetails.return.bus.arrivalTime && <p><strong>Arrives:</strong> {tripInfo.travelDetails.return.bus.arrivalTime}</p>}
                                    </div>
                                )}
                                {tripInfo.modeOfTravel === 'Car' && (tripInfo.travelDetails.return.car.rentalCompany || tripInfo.travelDetails.return.car.vehicleType) && (
                                    <div className="travel-detail">
                                        <h5>🚗 Car Details</h5>
                                        {tripInfo.travelDetails.return.car.rentalCompany && <p><strong>Company:</strong> {tripInfo.travelDetails.return.car.rentalCompany}</p>}
                                        {tripInfo.travelDetails.return.car.vehicleType && <p><strong>Vehicle:</strong> {tripInfo.travelDetails.return.car.vehicleType}</p>}
                                        {tripInfo.travelDetails.return.car.pickupLocation && <p><strong>Pickup:</strong> {tripInfo.travelDetails.return.car.pickupLocation}</p>}
                                        {tripInfo.travelDetails.return.car.dropoffLocation && <p><strong>Dropoff:</strong> {tripInfo.travelDetails.return.car.dropoffLocation}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Main Content Grid - Side by Side Layout */}
            <div className="main-content-grid">
                {/* LEFT COLUMN - Participants and Voting */}
                <div className="left-column">
            
            {/* Trip Participants Section - NEW! */}
            <TripParticipants 
                tripId={tripId}
                currentUser={currentUser}
                onParticipantsChange={handleParticipantsChange}
            />

            {/* Result Section - Show Winner */}
            {accommodations.length > 0 && winner && (
                <div className="section results-section">
                    <h3>🏆 The Winner Is!</h3>
                    <div className="winner-card">
                        {winner.url ? (
                            <a 
                                href={winner.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="accommodation-link"
                            >
                                <h4>{winner.name}</h4>
                                <span className="link-icon">🔗</span>
                            </a>
                        ) : (
                            <h4>{winner.name}</h4>
                        )}
                        <div className="winner-stats">
                            <span className="winner-votes">{winner.voters.length} votes</span>
                            <button 
                                className={`book-btn ${winner.booked ? 'booked' : ''}`}
                                onClick={() => handleToggleBooked(winner.id)}
                            >
                                {winner.booked ? '✓ Booked' : 'Mark as Booked'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Accommodation Options Section */}
            <div className="section">
                <h3>Add Accommodation Options</h3>
                <p className="section-hint">Paste a URL (e.g., https://airbnb.com/...) or enter a name</p>
                <form onSubmit={handleAddAccommodation}>
                    <div className="accommodation-form-grid">
                        <div className="form-field">
                            <input 
                                type="text" 
                                placeholder="e.g., Specific Hotel Name or paste a URL"
                                value={newAccommodation}
                                onChange={(e) => setNewAccommodation(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <input 
                                type="number" 
                                placeholder="Price per night ($)"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div className="form-field">
                            <input 
                                type="number" 
                                placeholder="Beds/Bedrooms"
                                value={newBeds}
                                onChange={(e) => setNewBeds(e.target.value)}
                                min="0"
                            />
                        </div>
                        <div className="form-field">
                            <button type="submit">Add Option</button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Voting Section */}
            {participants.length > 0 && (
                <div className="section">
                    <h3>Vote for Accommodations</h3>
                    <div className="voter-selector">
                        <label>Voting as: </label>
                        <select 
                            value={selectedParticipantId} 
                            onChange={(e) => setSelectedParticipantId(e.target.value)}
                            className="traveler-select"
                        >
                            <option value="">Select a participant</option>
                            {participants.filter(p => p.status === 'accepted').map((participant) => (
                                <option key={participant.userId} value={participant.userId}>
                                    {participant.username} {participant.userId === currentUser?.id ? '(You)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="accommodation-voting">
                        {accommodations.map(acc => {
                            // Get voter names for display
                            const voterNames = acc.voters.map(voterId => {
                                const participant = participants.find(p => p.userId === voterId);
                                return participant?.username || 'Unknown';
                            });
                            
                            return (
                            <div key={acc.id} className={`accommodation-card ${acc.id === winner?.id ? 'winner' : ''}`}>
                                <div className="accommodation-header">
                                    {acc.id === winner?.id && <span className="winner-badge">🏆 Winner</span>}
                                    {acc.url ? (
                                        <a 
                                            href={acc.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="accommodation-link"
                                            title={acc.url}
                                        >
                                            <h4>{acc.name}</h4>
                                            <span className="link-icon">🔗</span>
                                        </a>
                                    ) : (
                                        <h4>{acc.name}</h4>
                                    )}
                                    <button 
                                        className={`vote-btn ${acc.voters.includes(selectedParticipantId) ? 'voted' : ''}`}
                                        onClick={() => handleVote(acc.id)}
                                        disabled={!selectedParticipantId}
                                    >
                                        {acc.voters.includes(selectedParticipantId) ? '✓ Voted' : 'Vote'}
                                    </button>
                                </div>
                                <div className="accommodation-details">
                                    {acc.price_cents !== null && (
                                        <span className="detail-item">💰 ${formatCents(acc.price_cents)}/night</span>
                                    )}
                                    {acc.beds && <span className="detail-item">🛏️ {acc.beds} beds</span>}
                                    <span className="detail-item votes-count">
                                        👥 {acc.voters.length} vote{acc.voters.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {voterNames.length > 0 && (
                                    <div className="voters-list">
                                        <small>Voted by: {voterNames.join(', ')}</small>
                                    </div>
                                )}
                                <div className="booking-section">
                                    <button 
                                        className={`book-btn ${acc.booked ? 'booked' : ''}`}
                                        onClick={() => handleToggleBooked(acc.id)}
                                    >
                                        {acc.booked ? '✓ Booked' : 'Not Booked'}
                                    </button>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                </div>
            )}
                </div>

                {/* RIGHT COLUMN - Accommodations and Expenses */}
                <div className="right-column">

            {/* Expense Tracking Section */}
            {participants.length > 0 && (
                <div className="section">
                    <h3>💰 Expense Tracking</h3>
                    <form onSubmit={handleAddExpense}>
                        <div className="expense-form-grid">
                            <div className="form-field">
                                <input 
                                    type="text" 
                                    placeholder="Description (e.g., Hotel bill)"
                                    value={newExpenseDescription}
                                    onChange={(e) => setNewExpenseDescription(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <input 
                                    type="number" 
                                    placeholder="Amount ($)"
                                    value={newExpenseAmount}
                                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <select 
                                    value={newExpensePaidBy} 
                                    onChange={(e) => setNewExpensePaidBy(e.target.value)}
                                    required
                                >
                                    <option value="">Who paid?</option>
                                    {participants.filter(p => p.status === 'accepted').map((participant) => (
                                        <option key={participant.userId} value={participant.userId}>
                                            {participant.username} {participant.userId === currentUser?.id ? '(You)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <select 
                                    value={newExpenseCategory} 
                                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                                >
                                    <option value="accommodation">🏨 Accommodation</option>
                                    <option value="travel">✈️ Travel</option>
                                    <option value="food">🍽️ Food</option>
                                    <option value="activity">🎉 Activity</option>
                                    <option value="other">📝 Other</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <button type="submit">Add Expense</button>
                            </div>
                        </div>
                    </form>

                    {/* Expenses List */}
                    {expenses.length > 0 && (
                        <div className="expenses-list">
                            <h4>Expenses ({expenses.length})</h4>
                            {expenses.map((expense, index) => {
                                const paidByParticipant = participants.find(p => p.userId === expense.paidBy);
                                const paidByName = paidByParticipant?.username || 'Unknown';
                                
                                return (
                                <div key={index} className="expense-item">
                                    <span className="expense-category">{expense.category === 'accommodation' && '🏨'}{expense.category === 'travel' && '✈️'}{expense.category === 'food' && '🍽️'}{expense.category === 'activity' && '🎉'}{expense.category === 'other' && '📝'}</span>
                                    <span className="expense-description">{expense.description}</span>
                                    <span className="expense-amount">${formatCents(expense.amount_cents)}</span>
                                    <span className="expense-paid">Paid by {paidByName}</span>
                                </div>
                            )})}
                            <div className="total-expenses">
                                <strong>Total Expenses: ${formatCents(totalExpenses)}</strong>
                                <span className="per-person">
                                    Per person: ${participants.length > 0 ? formatCents(Math.round(totalExpenses / participants.length)) : '0.00'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Settlement Instructions */}
                    {/* New Finances Section with Tabs */}
                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        {/* Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '20px',
                            borderBottom: '2px solid #e0e0e0',
                            paddingBottom: '10px'
                        }}>
                            {[
                                { id: 'balances', label: '💰 Balances', icon: '💰' },
                                { id: 'settlements', label: '📋 Settlement Plan', icon: '📋' },
                                { id: 'payments', label: '📜 Payment History', icon: '📜' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFinancesTab(tab.id)}
                                    style={{
                                        padding: '10px 16px',
                                        background: financesTab === tab.id ? '#3498db' : 'transparent',
                                        color: financesTab === tab.id ? 'white' : '#666',
                                        border: 'none',
                                        borderBottom: financesTab === tab.id ? '3px solid #3498db' : 'none',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: financesTab === tab.id ? 600 : 400,
                                        marginBottom: '-10px',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        {financesTab === 'balances' && (
                            <BalancesView
                                tripId={tripId}
                                participants={participants}
                            />
                        )}

                        {financesTab === 'settlements' && (
                            <SettlementPlanView
                                tripId={tripId}
                                participants={participants}
                                currentUser={currentUser}
                            />
                        )}

                        {financesTab === 'payments' && (
                            <PaymentHistory
                                tripId={tripId}
                                participants={participants}
                                currentUser={currentUser}
                            />
                        )}
                    </div>
                </div>
            )}
                </div>
            </div>

            {participants.length === 0 && (
                <div className="empty-state">
                    <p>Add participants to start voting on accommodations!</p>
                </div>
            )}
        </div>
    );
}