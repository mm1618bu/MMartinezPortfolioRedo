import React from 'react';
import '../design/main.css';
import { TRIP_STATUSES, TRIP_STATUS_LABELS } from '../services/tripStatus';

export default function TripDashboard({
  trips,
  onCreateTrip,
  onSelectTrip,
  onDuplicateTrip,
  onStatusChange,
}) {
  return (
    <div className="trip-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Your Trips</h1>
          <p>Manage your trips and keep track of their status.</p>
        </div>
        <button type="button" className="submit-btn" onClick={onCreateTrip}>
          + Create New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <p>No trips yet. Create your first trip to get started!</p>
        </div>
      ) : (
        <div className="trip-cards">
          {trips.map((trip) => (
            <div key={trip.id} className="trip-card">
              <div className="trip-card-header">
                <div>
                  <h3>{trip.name || `${trip.start_point} to ${trip.end_point}`}</h3>
                  <p className="trip-card-subtitle">
                    {trip.start_point} → {trip.end_point}
                  </p>
                </div>
                <span className="status-pill">{TRIP_STATUS_LABELS[trip.trip_status] || 'Planning'}</span>
              </div>

              <div className="trip-card-details">
                <div>
                  <span className="trip-card-label">Dates</span>
                  <div>{trip.departure_date || 'TBD'} - {trip.return_date || 'TBD'}</div>
                </div>
                <div>
                  <span className="trip-card-label">Role</span>
                  <div>{trip.participant_role || 'participant'}</div>
                </div>
              </div>

              <div className="trip-card-actions">
                <button type="button" className="primary-btn" onClick={() => onSelectTrip(trip)}>
                  Open
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => onDuplicateTrip(trip)}
                  disabled={trip.participant_role !== 'creator'}
                >
                  Duplicate
                </button>

                <div className="status-select">
                  <label htmlFor={`status-${trip.id}`} className="sr-only">Trip status</label>
                  <select
                    id={`status-${trip.id}`}
                    value={trip.trip_status || 'planning'}
                    onChange={(event) => onStatusChange(trip, event.target.value)}
                    disabled={trip.participant_role !== 'creator'}
                  >
                    {TRIP_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {TRIP_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
