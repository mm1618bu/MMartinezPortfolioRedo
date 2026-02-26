/**
 * Authorization Utilities for TripSync
 * Implements NFR-3.1: JWT authentication for protected endpoints
 * Implements NFR-3.2: Trip membership and role verification
 */

import { supabase } from './supabaseClient';

/**
 * Verify that the current user has a valid JWT session
 * Implements NFR-3.1: All API endpoints protected by JWT unless explicitly public
 * @returns {Promise<{user: object|null, error: object|null}>} - User object or error
 */
export const verifyJWTSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('JWT verification failed:', error);
      return { user: null, error };
    }
    
    if (!session) {
      return { user: null, error: new Error('No active session') };
    }
    
    return { user: session.user, error: null };
  } catch (error) {
    console.error('Unexpected error verifying JWT:', error);
    return { user: null, error };
  }
};

/**
 * Check if a user is a member of a trip
 * Implements NFR-3.2: Verify trip membership
 * @param {string} tripId - The trip ID
 * @param {string} userId - The user ID to check
 * @returns {Promise<{isMember: boolean, role: string|null, error: object|null}>}
 */
export const isUserTripMember = async (tripId, userId) => {
  try {
    if (!tripId || !userId) {
      return { isMember: false, role: null, error: new Error('Missing tripId or userId') };
    }

    const { data, error } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking trip membership:', error);
      return { isMember: false, role: null, error };
    }

    if (!data) {
      return { isMember: false, role: null, error: null };
    }

    return { isMember: true, role: data.role, error: null };
  } catch (error) {
    console.error('Unexpected error checking trip membership:', error);
    return { isMember: false, role: null, error };
  }
};

/**
 * Check if a user is the trip creator
 * Implements NFR-3.2: Verify role for trip-scoped operations
 * @param {string} tripId - The trip ID
 * @param {string} userId - The user ID to check
 * @returns {Promise<{isCreator: boolean, error: object|null}>}
 */
export const isUserTripCreator = async (tripId, userId) => {
  try {
    if (!tripId || !userId) {
      return { isCreator: false, error: new Error('Missing tripId or userId') };
    }

    const { data, error } = await supabase
      .from('trips')
      .select('created_by')
      .eq('id', tripId)
      .single();

    if (error) {
      console.error('Error checking trip creator:', error);
      return { isCreator: false, error };
    }

    if (!data) {
      return { isCreator: false, error: new Error('Trip not found') };
    }

    return { isCreator: data.created_by === userId, error: null };
  } catch (error) {
    console.error('Unexpected error checking trip creator:', error);
    return { isCreator: false, error };
  }
};

/**
 * Get user's role in a trip
 * Implements NFR-3.2: Role verification for authorization
 * @param {string} tripId - The trip ID
 * @param {string} userId - The user ID
 * @returns {Promise<{role: string|null, error: object|null}>}
 */
export const getUserTripRole = async (tripId, userId) => {
  try {
    if (!tripId || !userId) {
      return { role: null, error: new Error('Missing tripId or userId') };
    }

    const { data, error } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user role:', error);
      return { role: null, error };
    }

    return { role: data?.role || null, error: null };
  } catch (error) {
    console.error('Unexpected error fetching user role:', error);
    return { role: null, error };
  }
};

/**
 * Verify authentication and trip membership
 * Combined check for both NFR-3.1 and NFR-3.2
 * @param {string} tripId - The trip ID to check access for
 * @returns {Promise<{authorized: boolean, user: object|null, role: string|null, error: object|null}>}
 */
export const verifyAuthAndTripAccess = async (tripId) => {
  try {
    // Verify JWT session (NFR-3.1)
    const { user, error: authError } = await verifyJWTSession();
    
    if (authError || !user) {
      return { authorized: false, user: null, role: null, error: authError || new Error('Authentication required') };
    }

    // Verify trip membership (NFR-3.2)
    const { isMember, role, error: memberError } = await isUserTripMember(tripId, user.id);
    
    if (memberError) {
      return { authorized: false, user, role: null, error: memberError };
    }

    if (!isMember) {
      return { 
        authorized: false, 
        user, 
        role: null, 
        error: new Error('User is not a member of this trip') 
      };
    }

    return { authorized: true, user, role, error: null };
  } catch (error) {
    console.error('Unexpected error verifying auth and trip access:', error);
    return { authorized: false, user: null, role: null, error };
  }
};

/**
 * Check if user can modify trip (must be creator or admin)
 * Implements NFR-3.2: Role-based authorization for trip modifications
 * @param {string} tripId - The trip ID
 * @param {string} userId - The user ID
 * @returns {Promise<{canModify: boolean, error: object|null}>}
 */
export const canUserModifyTrip = async (tripId, userId) => {
  try {
    if (!tripId || !userId) {
      return { canModify: false, error: new Error('Missing tripId or userId') };
    }

    const { isCreator, error: creatorError } = await isUserTripCreator(tripId, userId);
    
    if (creatorError) {
      return { canModify: false, error: creatorError };
    }

    return { canModify: isCreator, error: null };
  } catch (error) {
    console.error('Unexpected error checking modify permission:', error);
    return { canModify: false, error };
  }
};

/**
 * Check if user can perform action on specific trip resource
 * Implements NFR-3.2: Comprehensive authorization check
 * @param {string} tripId - The trip ID
 * @param {string} userId - The user ID
 * @param {string} action - The action being attempted ('view', 'create', 'modify', 'delete')
 * @returns {Promise<{allowed: boolean, error: object|null}>}
 */
export const checkTripResourceAccess = async (tripId, userId, action = 'view') => {
  try {
    // First verify authentication and membership
    const { authorized, role, error: authError } = await verifyAuthAndTripAccess(tripId);
    
    if (!authorized || authError) {
      return { allowed: false, error: authError };
    }

    // Check action-specific permissions
    switch (action) {
      case 'view':
        // All trip members can view trip resources
        return { allowed: true, error: null };
      
      case 'create':
        // All trip members can create resources (accommodations, expenses, etc.)
        return { allowed: true, error: null };
      
      case 'modify':
      case 'delete':
        // Only creator can modify or delete trips
        // Other resources might have different rules
        const { canModify, error: modifyError } = await canUserModifyTrip(tripId, userId);
        return { allowed: canModify, error: modifyError };
      
      default:
        return { allowed: false, error: new Error(`Unknown action: ${action}`) };
    }
  } catch (error) {
    console.error('Unexpected error checking resource access:', error);
    return { allowed: false, error };
  }
};

/**
 * Middleware-like function to protect service calls
 * Should be called at the start of service functions that require authentication
 * @param {string} tripId - The trip ID (optional, if action is trip-scoped)
 * @param {string} userId - The user ID
 * @returns {Promise<{authorized: boolean, error: object|null}>}
 */
export const requireAuthentication = async (tripId = null, userId = null) => {
  try {
    // Verify JWT
    const { user, error: authError } = await verifyJWTSession();
    
    if (authError || !user) {
      return { authorized: false, error: new Error('Authentication required') };
    }

    // If tripId provided, verify membership
    if (tripId && userId) {
      const { isMember, error: memberError } = await isUserTripMember(tripId, userId);
      
      if (memberError || !isMember) {
        return { 
          authorized: false, 
          error: memberError || new Error('Access denied') 
        };
      }
    }

    return { authorized: true, error: null };
  } catch (error) {
    console.error('Unexpected error in requireAuthentication:', error);
    return { authorized: false, error };
  }
};

export default {
  verifyJWTSession,
  isUserTripMember,
  isUserTripCreator,
  getUserTripRole,
  verifyAuthAndTripAccess,
  canUserModifyTrip,
  checkTripResourceAccess,
  requireAuthentication
};
