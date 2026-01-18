import { supabase } from '../lib/supabase';
import {
  generateTokenPair,
  getRefreshTokenExpiry,
  isExpired,
  TokenPayload,
} from '../utils/token.utils';
import { UnauthorizedError, NotFoundError } from '../errors';

interface SignupData {
  email: string;
  password: string;
  name: string;
  organizationId: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RefreshTokenData {
  userId: string;
  organizationId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authService = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const { email, password, name, organizationId } = data;

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create user record in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        organization_id: organizationId,
        role: 'staff', // Default role
      })
      .select()
      .single();

    if (userError) throw userError;

    // Generate token pair
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store refresh token
    await authService.storeRefreshToken({
      userId: user.id,
      organizationId: user.organization_id,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  },

  login: async (data: LoginData, ipAddress?: string, userAgent?: string): Promise<AuthResponse> => {
    const { email, password } = data;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new UnauthorizedError('Invalid email or password');
    if (!authData.user) throw new UnauthorizedError('Invalid email or password');

    // Fetch user details from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;
    if (!user) throw new NotFoundError('User', authData.user.id);

    // Generate token pair
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Store refresh token
    await authService.storeRefreshToken({
      userId: user.id,
      organizationId: user.organization_id,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      ipAddress,
      userAgent,
    });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  },

  refreshAccessToken: async (
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> => {
    // Validate refresh token exists and is not revoked
    const { data: tokenData, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .eq('is_revoked', false)
      .single();

    if (tokenError || !tokenData) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Check if token is expired
    if (isExpired(new Date(tokenData.expires_at))) {
      // Mark as revoked
      await supabase
        .from('refresh_tokens')
        .update({ is_revoked: true, revoked_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      throw new UnauthorizedError('Refresh token expired');
    }

    // Fetch user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', tokenData.user_id)
      .single();

    if (userError || !user) {
      throw new NotFoundError('User', tokenData.user_id);
    }

    // Generate new token pair
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role,
    };

    const tokens = generateTokenPair(tokenPayload);

    // Revoke old refresh token and store new one
    const { data: newTokenData } = await supabase
      .from('refresh_tokens')
      .insert({
        user_id: user.id,
        organization_id: user.organization_id,
        token: tokens.refreshToken,
        expires_at: getRefreshTokenExpiry().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    // Mark old token as replaced
    await supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        replaced_by: newTokenData?.id,
      })
      .eq('id', tokenData.id);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  },

  storeRefreshToken: async (data: RefreshTokenData): Promise<void> => {
    const { error } = await supabase.from('refresh_tokens').insert({
      user_id: data.userId,
      organization_id: data.organizationId,
      token: data.token,
      expires_at: data.expiresAt.toISOString(),
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    });

    if (error) throw error;
  },

  revokeRefreshToken: async (refreshToken: string): Promise<void> => {
    const { error } = await supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('token', refreshToken);

    if (error) throw error;
  },

  revokeAllUserTokens: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_revoked', false);

    if (error) throw error;
  },

  cleanupExpiredTokens: async (): Promise<number> => {
    const { data, error } = await supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .lt('expires_at', new Date().toISOString())
      .eq('is_revoked', false)
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    // Revoke refresh token if provided
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    // Sign out from Supabase (optional, depends on your auth strategy)
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) throw new UnauthorizedError('Not authenticated');

    // Fetch user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new NotFoundError('User', user.id);

    return userData;
  },
};
