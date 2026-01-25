/**
 * Database Diagnostics Tool
 * Comprehensive debugging for Supabase connection issues
 */

export interface DiagnosticResult {
  timestamp: string;
  environmentVariables: {
    supabaseUrl: string | null;
    supabaseKey: string | null;
    bothPresent: boolean;
  };
  clientInitialization: {
    initialized: boolean;
    error?: string;
  };
  networkTest: {
    canReach: boolean;
    statusCode?: number;
    error?: string;
  };
  authStatus: {
    authenticated: boolean;
    user: any;
    error?: string;
  };
  connectionTest: {
    connected: boolean;
    error?: string;
    errorCode?: string;
  };
  summary: {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  };
}

/**
 * Run comprehensive diagnostics
 */
export async function runDiagnostics(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    environmentVariables: {
      supabaseUrl: null,
      supabaseKey: null,
      bothPresent: false,
    },
    clientInitialization: {
      initialized: false,
    },
    networkTest: {
      canReach: false,
    },
    authStatus: {
      authenticated: false,
      user: null,
    },
    connectionTest: {
      connected: false,
    },
    summary: {
      healthy: false,
      issues: [],
      recommendations: [],
    },
  };

  // Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  result.environmentVariables.supabaseUrl = supabaseUrl || null;
  result.environmentVariables.supabaseKey = supabaseKey ? supabaseKey.substring(0, 20) + '...' : null;
  result.environmentVariables.bothPresent = !!supabaseUrl && !!supabaseKey;

  if (!result.environmentVariables.bothPresent) {
    result.summary.issues.push('Missing Supabase environment variables');
    result.summary.recommendations.push('Check .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    result.summary.recommendations.push('Restart dev server after updating .env');
    return result;
  }

  // Test network connectivity to Supabase
  try {
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
    });

    result.networkTest.canReach = true;
    result.networkTest.statusCode = response.status;
    
    // Note: 401 is expected with publishable key for schema access
    if (response.status === 401) {
      result.networkTest.error = 'Expected 401 with publishable key (schema access restricted)';
    }
  } catch (err) {
    result.networkTest.canReach = false;
    result.networkTest.error = err instanceof Error ? err.message : String(err);
    result.summary.issues.push('Cannot reach Supabase server');
    result.summary.recommendations.push('Check your internet connection');
    result.summary.recommendations.push('Verify Supabase project URL is correct');
    result.summary.recommendations.push('Check if Supabase project is active');
  }

  // Try to initialize client and test connection
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const testClient = createClient(supabaseUrl, supabaseKey);

    result.clientInitialization.initialized = true;

    // Get current session/user
    try {
      const { data: sessionData, error: sessionError } = await testClient.auth.getSession();

      if (sessionError) {
        result.authStatus.error = sessionError.message;
      } else {
        result.authStatus.authenticated = !!sessionData.session;
        result.authStatus.user = sessionData.session?.user?.email || null;
      }
    } catch (err) {
      result.authStatus.error = err instanceof Error ? err.message : String(err);
    }

    // Test actual database connection - try multiple tables
    let tableConnected = false;
    let lastError: any = null;
    
    const tablesToTest = ['shift_templates', 'labor_standards', 'sites', 'employees'];
    
    for (const tableName of tablesToTest) {
      try {
        const { error } = await testClient
          .from(tableName as any)
          .select('id')
          .limit(1);

        if (!error) {
          result.connectionTest.connected = true;
          tableConnected = true;
          break;
        } else {
          lastError = error;
          // Continue trying other tables
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!tableConnected && lastError) {
      result.connectionTest.connected = false;
      result.connectionTest.error = lastError.message || String(lastError);
      result.connectionTest.errorCode = lastError.code || 'UNKNOWN';

      const errorMsg = (result.connectionTest.error || '').toLowerCase();

      if (errorMsg.includes('does not exist')) {
        result.summary.issues.push('Required tables do not exist in database');
        result.summary.recommendations.push('Run database migrations from Supabase dashboard');
        result.summary.recommendations.push('Check Supabase project has correct schema setup');
        result.summary.recommendations.push('Verify all required tables are created');
      } else if (errorMsg.includes('infinite recursion')) {
        result.summary.issues.push('Row Level Security (RLS) policies have infinite recursion');
        result.summary.recommendations.push('Fix RLS policies in Supabase dashboard');
        result.summary.recommendations.push('Disable RLS temporarily if testing locally');
        result.summary.recommendations.push('Check auth policies for circular dependencies');
      } else if (errorMsg.includes('cors')) {
        result.summary.issues.push('CORS policy blocked request');
        result.summary.recommendations.push('Check Supabase CORS settings');
        result.summary.recommendations.push('Ensure http://localhost:5173 is allowed');
      } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
        result.summary.issues.push('Authentication failed - invalid API key');
        result.summary.recommendations.push('Verify VITE_SUPABASE_ANON_KEY is correct');
        result.summary.recommendations.push('Get fresh key from Supabase dashboard');
      } else {
        result.summary.issues.push(`Database query failed: ${result.connectionTest.error}`);
      }
    }
  } catch (err) {
    result.clientInitialization.error = err instanceof Error ? err.message : String(err);
    result.summary.issues.push('Failed to initialize Supabase client');
  }

  // Determine overall health
  result.summary.healthy =
    result.environmentVariables.bothPresent &&
    result.networkTest.canReach &&
    result.clientInitialization.initialized &&
    result.connectionTest.connected;

  if (result.summary.healthy) {
    result.summary.recommendations.push('✅ Database connection is healthy!');
  } else {
    result.summary.recommendations.push('Review issues above and follow recommendations');
  }

  return result;
}

export default {
  runDiagnostics,
};
