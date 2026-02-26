export const TRIP_STATUSES = [
  'planning',
  'confirmed',
  'in-progress',
  'completed',
  'archived',
];

export const TRIP_STATUS_LABELS = {
  planning: 'Planning',
  confirmed: 'Confirmed',
  'in-progress': 'In-Progress',
  completed: 'Completed',
  archived: 'Archived',
};

export const normalizeTripStatus = (status) => {
  if (!status) {
    return 'planning';
  }
  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-');
};

export const isValidTripStatus = (status) => {
  const normalized = normalizeTripStatus(status);
  return TRIP_STATUSES.includes(normalized);
};

export const canTransitionTripStatus = (currentStatus, nextStatus) => {
  const normalizedCurrent = normalizeTripStatus(currentStatus);
  const normalizedNext = normalizeTripStatus(nextStatus);

  if (!isValidTripStatus(normalizedCurrent) || !isValidTripStatus(normalizedNext)) {
    return false;
  }

  if (normalizedCurrent === normalizedNext) {
    return true;
  }

  const currentIndex = TRIP_STATUSES.indexOf(normalizedCurrent);
  const nextIndex = TRIP_STATUSES.indexOf(normalizedNext);

  return nextIndex === currentIndex + 1;
};

export const getTripStatusLabel = (status) => {
  const normalized = normalizeTripStatus(status);
  return TRIP_STATUS_LABELS[normalized] || 'Planning';
};
