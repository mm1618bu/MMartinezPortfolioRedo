import { supabase } from './supabaseClient';
import { 
  validateAndSanitizeTripData, 
  validateAndSanitizeAccommodationData,
  validateAndSanitizeExpenseData,
  sanitizeText,
  sanitizeURL,
  sanitizeNumber,
  sanitizeObject
} from './securityUtils';
import { 
  requireAuthentication, 
  isUserTripMember, 
  verifyAuthAndTripAccess,
  canUserModifyTrip 
} from './authorizationUtils';
import {
    canTransitionTripStatus,
    getTripStatusLabel,
    isValidTripStatus,
    normalizeTripStatus
} from './services/tripStatus';

/**
 * Create a new trip in the database
 * Implements NFR-3.1: Requires JWT authentication
 * Implements NFR-3.3: Sanitizes all user input
 */
export const createTrip = async (tripData, userId) => {
    try {
        // NFR-3.1: Verify authentication
        const { authorized, error: authError } = await requireAuthentication();
        if (!authorized) {
            return { data: null, error: authError || new Error('Authentication required') };
        }

        // NFR-3.3: Sanitize all input data
        const sanitizedData = validateAndSanitizeTripData(tripData);
        
        console.warn('Creating trip with data:', { sanitizedData, userId });
        
        // Use RPC function for atomic transaction (creates trip + adds creator as participant)
        const normalizedStatus = normalizeTripStatus(sanitizedData.tripStatus);
        const safeStatus = isValidTripStatus(normalizedStatus) ? normalizedStatus : 'planning';

        const { data: trip, error: tripError } = await supabase
            .rpc('create_trip_with_creator', {
                p_name: `${sanitizedData.startPoint} to ${sanitizedData.endPoint}`,
                p_start_point: sanitizedData.startPoint,
                p_end_point: sanitizedData.endPoint,
                p_departure_date: sanitizedData.departureDate,
                p_return_date: sanitizedData.returnDate,
                p_expected_travelers: sanitizedData.travelers,
                p_mode_of_travel: sanitizedData.modeOfTravel,
                p_accommodation_type: sanitizedData.accommodation,
                p_travel_details: sanitizedData.travelDetails
            });

        if (tripError) {
            console.error('Trip creation error:', {
                code: tripError.code,
                message: tripError.message,
                details: tripError.details
            });
            throw tripError;
        }

        console.warn('Trip created successfully:', trip);
        return { data: trip, error: null };
    } catch (error) {
        console.error('Error creating trip:', error);
        return { data: null, error };
    }
};

/**
 * Get all trips for a user (dashboard)
 */
export const getUserTrips = async (userId) => {
    try {
        console.log('Fetching trips for user:', userId);
        const { data, error } = await supabase
            .from('trip_participants')
            .select('trip_id, role, status, trips:trips(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching trip_participants:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            throw error;
        }

        console.log('Trip participants found:', data);

        const normalized = (data || [])
            .filter(item => item.trips)
            .map(item => ({
                ...item.trips,
                participant_role: item.role,
                participant_status: item.status,
                trip_status: item.trips.trip_status || 'planning',
                trip_status_label: getTripStatusLabel(item.trips.trip_status)
            }));

        return { data: normalized, error: null };
    } catch (error) {
        console.error('Error fetching user trips:', error);
        return { data: [], error };
    }
};

/**
 * Update trip status (creator only)
 */
export const updateTripStatus = async (tripId, userId, nextStatus) => {
    try {
        const { authorized, error: accessError } = await verifyAuthAndTripAccess(tripId);
        if (!authorized) {
            return { data: null, error: accessError || new Error('Access denied') };
        }

        const { canModify, error: roleError } = await canUserModifyTrip(tripId, userId);
        if (!canModify) {
            return { data: null, error: roleError || new Error('Only creators can update trip status') };
        }

        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .select('trip_status')
            .eq('id', tripId)
            .single();

        if (tripError) throw tripError;

        const normalizedNext = normalizeTripStatus(nextStatus);
        if (!canTransitionTripStatus(trip.trip_status || 'planning', normalizedNext)) {
            return { data: null, error: new Error('Invalid status transition') };
        }

        const { data, error } = await supabase
            .from('trips')
            .update({ trip_status: normalizedNext })
            .eq('id', tripId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating trip status:', error);
        return { data: null, error };
    }
};

/**
 * Duplicate a trip as a template (creator only)
 */
export const duplicateTripAsTemplate = async (tripId, userId) => {
    try {
        const { authorized, error: accessError } = await verifyAuthAndTripAccess(tripId);
        if (!authorized) {
            return { data: null, error: accessError || new Error('Access denied') };
        }

        const { canModify, error: roleError } = await canUserModifyTrip(tripId, userId);
        if (!canModify) {
            return { data: null, error: roleError || new Error('Only creators can duplicate trips') };
        }

        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single();

        if (tripError) throw tripError;

        const { data: newTrip, error: newTripError } = await supabase
            .from('trips')
            .insert([{
                created_by: userId,
                name: `${trip.name || 'Trip'} (Copy)`,
                start_point: trip.start_point,
                end_point: trip.end_point,
                departure_date: trip.departure_date,
                return_date: trip.return_date,
                expected_travelers: trip.expected_travelers,
                mode_of_travel: trip.mode_of_travel,
                accommodation_type: trip.accommodation_type,
                travel_details: trip.travel_details,
                trip_status: 'planning',
                is_active: true
            }])
            .select()
            .single();

        if (newTripError) throw newTripError;

        const { error: participantError } = await supabase
            .from('trip_participants')
            .insert([{
                trip_id: newTrip.id,
                user_id: userId,
                role: 'creator',
                status: 'accepted'
            }]);

        if (participantError) throw participantError;
        return { data: newTrip, error: null };
    } catch (error) {
        console.error('Error duplicating trip:', error);
        return { data: null, error };
    }
};

/**
 * Get trip by ID
 */
export const getTrip = async (tripId) => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching trip:', error);
        return { data: null, error };
    }
};

/**
 * Get trip by share token
 */
export const getTripByShareToken = async (shareToken) => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('share_token', shareToken)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching trip by token:', error);
        return { data: null, error };
    }
};

/**
 * Join a trip using share token
 */
export const joinTripByToken = async (shareToken, userId) => {
    try {
        // Get trip by token
        const { data: trip, error: tripError } = await getTripByShareToken(shareToken);
        if (tripError || !trip) throw tripError || new Error('Trip not found');

        // Check if already a participant
        const { data: existing } = await supabase
            .from('trip_participants')
            .select('*')
            .eq('trip_id', trip.id)
            .eq('user_id', userId)
            .single();

        if (existing) {
            // Update status to accepted if it was pending
            if (existing.status !== 'accepted') {
                await supabase
                    .from('trip_participants')
                    .update({ status: 'accepted' })
                    .eq('id', existing.id);
            }
            return { data: trip, error: null, message: 'Already a participant' };
        }

        // Add as participant
        const { error: participantError } = await supabase
            .from('trip_participants')
            .insert([{
                trip_id: trip.id,
                user_id: userId,
                role: 'participant',
                status: 'accepted'
            }]);

        if (participantError) throw participantError;

        return { data: trip, error: null, message: 'Successfully joined trip' };
    } catch (error) {
        console.error('Error joining trip:', error);
        return { data: null, error, message: error.message };
    }
};

/**
 * Get trip participants with user details
 */
export const getTripParticipants = async (tripId) => {
    try {
        console.log('Fetching trip participants for trip:', tripId);
        const { data, error } = await supabase
            .rpc('get_trip_participants', { p_trip_id: tripId });

        if (error) {
            console.error('RPC Error details:', { 
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('Participants fetched:', data);

        const formatted = (data || []).map(p => ({
            id: p.id,
            userId: p.user_id,
            email: p.email,
            username: p.username || p.email?.split('@')[0],
            role: p.role,
            status: p.status
        }));

        return { data: formatted, error: null };
    } catch (error) {
        console.error('Error fetching participants:', error);
        return { data: [], error };
    }
};

/**
 * Get accommodations for a trip
 */
export const getAccommodations = async (tripId) => {
    try {
        const { data, error } = await supabase
            .from('accommodations')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        const normalized = (data || []).map(acc => ({
            ...acc,
            price_cents: acc.price_cents ?? null
        }));

        return { data: normalized, error: null };
    } catch (error) {
        console.error('Error fetching accommodations:', error);
        return { data: [], error };
    }
};

/**
 * Add accommodation to a trip
 * Implements NFR-3.1: Requires JWT authentication
 * Implements NFR-3.2: Requires trip membership
 * Implements NFR-3.3: Sanitizes all user input
 */
export const addAccommodation = async (tripId, userId, payload) => {
    try {
        // NFR-3.1 & 3.2: Verify authentication and trip membership
        const { authorized, error: accessError } = await verifyAuthAndTripAccess(tripId);
        if (!authorized) {
            return { data: null, error: accessError || new Error('Access denied') };
        }

        // NFR-3.3: Sanitize accommodation data
        const sanitizedData = validateAndSanitizeAccommodationData(payload);

        const { data, error } = await supabase
            .from('accommodations')
            .insert([{
                trip_id: tripId,
                added_by: userId,
                name: sanitizedData.name,
                url: sanitizedData.url,
                price_cents: sanitizedData.price_cents,
                beds: sanitizedData.beds,
                is_booked: false
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error adding accommodation:', error);
        return { data: null, error };
    }
};

/**
 * Update accommodation booked status
 */
export const setAccommodationBooked = async (accommodationId, isBooked) => {
    try {
        const { data, error } = await supabase
            .from('accommodations')
            .update({ is_booked: isBooked })
            .eq('id', accommodationId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating accommodation:', error);
        return { data: null, error };
    }
};

/**
 * Get votes for accommodations
 */
export const getAccommodationVotes = async (accommodationIds) => {
    try {
        if (!accommodationIds || accommodationIds.length === 0) {
            return { data: [], error: null };
        }

        const { data, error } = await supabase
            .from('accommodation_votes')
            .select('*')
            .in('accommodation_id', accommodationIds);

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error('Error fetching votes:', error);
        return { data: [], error };
    }
};

/**
 * Toggle accommodation vote for a user
 */
export const toggleAccommodationVote = async (accommodationId, userId) => {
    try {
        const { data: existing, error: existingError } = await supabase
            .from('accommodation_votes')
            .select('id')
            .eq('accommodation_id', accommodationId)
            .eq('user_id', userId)
            .single();

        if (existingError && existingError.code !== 'PGRST116') {
            throw existingError;
        }

        if (existing?.id) {
            const { error } = await supabase
                .from('accommodation_votes')
                .delete()
                .eq('id', existing.id);

            if (error) throw error;
            return { voted: false, error: null };
        }

        const { error } = await supabase
            .from('accommodation_votes')
            .insert([{ accommodation_id: accommodationId, user_id: userId }]);

        if (error) throw error;
        return { voted: true, error: null };
    } catch (error) {
        console.error('Error toggling vote:', error);
        return { voted: null, error };
    }
};

/**
 * Get expenses for a trip
 */
export const getExpenses = async (tripId) => {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        const normalized = (data || []).map(exp => ({
            ...exp,
            amount_cents: exp.amount_cents
        }));

        return { data: normalized, error: null };
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return { data: [], error };
    }
};

/**
 * Add expense to a trip
 * Implements NFR-3.1: Requires JWT authentication
 * Implements NFR-3.2: Requires trip membership
 * Implements NFR-3.3: Sanitizes all user input
 */
export const addExpense = async (tripId, userId, payload) => {
    try {
        // NFR-3.1 & 3.2: Verify authentication and trip membership
        const { authorized, error: accessError } = await verifyAuthAndTripAccess(tripId);
        if (!authorized) {
            return { data: null, error: accessError || new Error('Access denied') };
        }

        // NFR-3.3: Sanitize expense data
        const sanitizedData = validateAndSanitizeExpenseData(payload);

        const { data, error } = await supabase
            .rpc('create_expense_with_splits', {
                p_trip_id: tripId,
                p_added_by: userId,
                p_description: sanitizedData.description,
                p_amount_cents: sanitizedData.amount_cents,
                p_paid_by: sanitizedData.paidBy,
                p_category: sanitizedData.category,
                p_expense_date: sanitizedData.date,
                p_splits: sanitizedData.splits
            });

        if (error) throw error;
        const createdExpense = Array.isArray(data) ? data[0] : data;
        return { data: createdExpense, error: null };
    } catch (error) {
        console.error('Error adding expense:', error);
        return { data: null, error };
    }
};

/**
 * Search users by email
 */
export const searchUsersByEmail = async (searchTerm) => {
    try {
        const { data, error } = await supabase
            .rpc('search_users_by_email', { search_term: searchTerm });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error('Error searching users:', error);
        return { data: [], error };
    }
};

/**
 * Add user to trip
 */
/**
 * Add user to trip
 */
export const addUserToTrip = async (tripId, userId) => {
    try {
        console.log('Adding user to trip:', { tripId, userId });
        
        // Use RPC function to avoid policy recursion
        const { data, error } = await supabase
            .rpc('add_participant_to_trip', {
                p_trip_id: tripId,
                p_user_id: userId,
                p_role: 'participant',
                p_status: 'pending'
            });

        if (error) {
            console.error('RPC error adding user:', error);
            throw error;
        }
        
        console.log('User added successfully:', data);
        return { data, error: null };
    } catch (error) {
        console.error('Error adding user to trip:', error);
        return { data: null, error };
    }
};

/**
 * Remove user from trip
 * Implements NFR-3.1: Requires JWT authentication
 * Implements NFR-3.2: Requires creator role for authorization
 */
export const removeUserFromTrip = async (tripId, userId, requestingUserId = null) => {
    try {
        // NFR-3.1: Verify authentication
        const { authorized, error: authError } = await requireAuthentication();
        if (!authorized) {
            return { error: authError || new Error('Authentication required') };
        }

        // NFR-3.2: Only trip creator can remove users
        if (requestingUserId) {
            const { canModify, error: permError } = await canUserModifyTrip(tripId, requestingUserId);
            if (!canModify) {
                return { error: permError || new Error('Only trip creator can remove members') };
            }
        }

        const { error } = await supabase
            .from('trip_participants')
            .delete()
            .eq('trip_id', tripId)
            .eq('user_id', userId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error removing user from trip:', error);
        return { error };
    }
};

/**
 * Update travel info (mode_of_travel + travel_details) for a trip
 * This uses an RPC to allow any participant to edit travel info only.
 */
export const updateTripTravelInfo = async (tripId, modeOfTravel, travelDetails) => {
    try {
        const { error } = await supabase
            .rpc('update_trip_travel_info', {
                p_trip_id: tripId,
                p_mode_of_travel: modeOfTravel || null,
                p_travel_details: travelDetails || null
            });

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error updating travel info:', error);
        return { error };
    }
};

/**
 * Accept trip invitation
 */
export const acceptTripInvitation = async (tripId, userId) => {
    try {
        const { error } = await supabase
            .from('trip_participants')
            .update({ status: 'accepted' })
            .eq('trip_id', tripId)
            .eq('user_id', userId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return { error };
    }
};
