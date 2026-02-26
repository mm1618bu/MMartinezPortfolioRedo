import {
  TRIP_STATUSES,
  canTransitionTripStatus,
  getTripStatusLabel,
  isValidTripStatus,
  normalizeTripStatus,
} from './tripStatus';

describe('tripStatus', () => {
  test('normalizes status strings', () => {
    expect(normalizeTripStatus('In Progress')).toBe('in-progress');
    expect(normalizeTripStatus('completed')).toBe('completed');
    expect(normalizeTripStatus('')).toBe('planning');
  });

  test('validates known statuses', () => {
    expect(isValidTripStatus('planning')).toBe(true);
    expect(isValidTripStatus('archived')).toBe(true);
    expect(isValidTripStatus('unknown')).toBe(false);
  });

  test('allows sequential transitions only', () => {
    expect(canTransitionTripStatus('planning', 'confirmed')).toBe(true);
    expect(canTransitionTripStatus('confirmed', 'completed')).toBe(false);
    expect(canTransitionTripStatus('completed', 'archived')).toBe(true);
  });

  test('supports same-status updates', () => {
    expect(canTransitionTripStatus('planning', 'planning')).toBe(true);
  });

  test('returns label for status', () => {
    TRIP_STATUSES.forEach((status) => {
      expect(getTripStatusLabel(status)).toBeDefined();
    });
  });
});
