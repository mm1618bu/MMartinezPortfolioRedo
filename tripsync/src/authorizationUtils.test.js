import {
  verifyJWTSession,
  isUserTripMember,
  isUserTripCreator,
  getUserTripRole,
  verifyAuthAndTripAccess,
  canUserModifyTrip,
  checkTripResourceAccess,
  requireAuthentication,
} from '../authorizationUtils';
import { supabase } from '../supabaseClient';

jest.mock('../supabaseClient');

const buildSupabaseResponse = (response) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(response),
});

const mockSession = (session, error = null) => {
  supabase.auth.getSession.mockResolvedValue({ data: { session }, error });
};

describe('authorizationUtils - verifyJWTSession', () => {
  beforeEach(() => {
    supabase.auth = { getSession: jest.fn() };
    jest.clearAllMocks();
  });

  test('should return user when authenticated', async () => {
    const session = { user: { id: 'user1', email: 'user@example.com' } };
    mockSession(session);

    const result = await verifyJWTSession();
    expect(result).toEqual({ user: session.user, error: null });
  });

  test('should return error when no active session', async () => {
    mockSession(null);

    const result = await verifyJWTSession();
    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  test('should return error when getSession fails', async () => {
    const error = new Error('Session error');
    supabase.auth.getSession.mockRejectedValue(error);

    const result = await verifyJWTSession();
    expect(result.user).toBeNull();
    expect(result.error).toBe(error);
  });
});

describe('authorizationUtils - isUserTripMember', () => {
  beforeEach(() => {
    supabase.from = jest.fn();
    jest.clearAllMocks();
  });

  test('should return member role when user is accepted', async () => {
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { role: 'participant' }, error: null })
    );

    const result = await isUserTripMember('trip1', 'user1');
    expect(result).toEqual({ isMember: true, role: 'participant', error: null });
  });

  test('should return not member when row not found', async () => {
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: null, error: { code: 'PGRST116' } })
    );

    const result = await isUserTripMember('trip1', 'user1');
    expect(result).toEqual({ isMember: false, role: null, error: null });
  });

  test('should return error on database failure', async () => {
    const error = new Error('DB error');
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: null, error })
    );

    const result = await isUserTripMember('trip1', 'user1');
    expect(result.isMember).toBe(false);
    expect(result.error).toBe(error);
  });

  test('should return error for missing parameters', async () => {
    const result = await isUserTripMember(null, 'user1');
    expect(result.isMember).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});

describe('authorizationUtils - isUserTripCreator', () => {
  beforeEach(() => {
    supabase.from = jest.fn();
    jest.clearAllMocks();
  });

  test('should return creator status', async () => {
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { created_by: 'user1' }, error: null })
    );

    const result = await isUserTripCreator('trip1', 'user1');
    expect(result).toEqual({ isCreator: true, error: null });
  });

  test('should return false when user is not creator', async () => {
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { created_by: 'user2' }, error: null })
    );

    const result = await isUserTripCreator('trip1', 'user1');
    expect(result).toEqual({ isCreator: false, error: null });
  });

  test('should return error when trip lookup fails', async () => {
    const error = new Error('Trip error');
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: null, error })
    );

    const result = await isUserTripCreator('trip1', 'user1');
    expect(result.isCreator).toBe(false);
    expect(result.error).toBe(error);
  });
});

describe('authorizationUtils - getUserTripRole', () => {
  beforeEach(() => {
    supabase.from = jest.fn();
    jest.clearAllMocks();
  });

  test('should return role when available', async () => {
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { role: 'creator' }, error: null })
    );

    const result = await getUserTripRole('trip1', 'user1');
    expect(result).toEqual({ role: 'creator', error: null });
  });

  test('should return null role when no data', async () => {
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: null, error: { code: 'PGRST116' } })
    );

    const result = await getUserTripRole('trip1', 'user1');
    expect(result).toEqual({ role: null, error: null });
  });
});

describe('authorizationUtils - verifyAuthAndTripAccess', () => {
  beforeEach(() => {
    supabase.auth = { getSession: jest.fn() };
    supabase.from = jest.fn();
    jest.clearAllMocks();
  });

  test('should authorize authenticated trip member', async () => {
    const session = { user: { id: 'user1' } };
    mockSession(session);
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { role: 'participant' }, error: null })
    );

    const result = await verifyAuthAndTripAccess('trip1');
    expect(result.authorized).toBe(true);
    expect(result.user).toEqual(session.user);
    expect(result.role).toBe('participant');
  });

  test('should deny when not authenticated', async () => {
    mockSession(null);

    const result = await verifyAuthAndTripAccess('trip1');
    expect(result.authorized).toBe(false);
    expect(result.user).toBeNull();
  });

  test('should deny when not a member', async () => {
    const session = { user: { id: 'user1' } };
    mockSession(session);
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: null, error: { code: 'PGRST116' } })
    );

    const result = await verifyAuthAndTripAccess('trip1');
    expect(result.authorized).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});

describe('authorizationUtils - canUserModifyTrip', () => {
  beforeEach(() => {
    supabase.from = jest.fn();
    jest.clearAllMocks();
  });

  test('should allow creator to modify trip', async () => {
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { created_by: 'user1' }, error: null })
    );

    const result = await canUserModifyTrip('trip1', 'user1');
    expect(result).toEqual({ canModify: true, error: null });
  });

  test('should deny non-creator', async () => {
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { created_by: 'user2' }, error: null })
    );

    const result = await canUserModifyTrip('trip1', 'user1');
    expect(result).toEqual({ canModify: false, error: null });
  });
});

describe('authorizationUtils - checkTripResourceAccess', () => {
  beforeEach(() => {
    supabase.auth = { getSession: jest.fn() };
    supabase.from = jest.fn();
    jest.clearAllMocks();
  });

  test('should allow view access for trip member', async () => {
    const session = { user: { id: 'user1' } };
    mockSession(session);
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { role: 'participant' }, error: null })
    );

    const result = await checkTripResourceAccess('trip1', 'user1', 'view');
    expect(result).toEqual({ allowed: true, error: null });
  });

  test('should deny modify access for non-creator', async () => {
    const session = { user: { id: 'user1' } };
    mockSession(session);
    supabase.from
      .mockReturnValueOnce(buildSupabaseResponse({ data: { role: 'participant' }, error: null }))
      .mockReturnValueOnce(buildSupabaseResponse({ data: { created_by: 'user2' }, error: null }));

    const result = await checkTripResourceAccess('trip1', 'user1', 'modify');
    expect(result.allowed).toBe(false);
  });
});

describe('authorizationUtils - requireAuthentication', () => {
  beforeEach(() => {
    supabase.auth = { getSession: jest.fn() };
    supabase.from = jest.fn();
    jest.clearAllMocks();
  });

  test('should authorize when user is authenticated', async () => {
    const session = { user: { id: 'user1' } };
    mockSession(session);

    const result = await requireAuthentication();
    expect(result).toEqual({ authorized: true, error: null });
  });

  test('should deny when user is not authenticated', async () => {
    mockSession(null);

    const result = await requireAuthentication();
    expect(result.authorized).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });

  test('should enforce membership when tripId and userId provided', async () => {
    const session = { user: { id: 'user1' } };
    mockSession(session);
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: { role: 'participant' }, error: null })
    );

    const result = await requireAuthentication('trip1', 'user1');
    expect(result).toEqual({ authorized: true, error: null });
  });

  test('should deny when membership fails', async () => {
    const session = { user: { id: 'user1' } };
    mockSession(session);
    supabase.from.mockReturnValue(
      buildSupabaseResponse({ data: null, error: { code: 'PGRST116' } })
    );

    const result = await requireAuthentication('trip1', 'user1');
    expect(result.authorized).toBe(false);
  });
});
