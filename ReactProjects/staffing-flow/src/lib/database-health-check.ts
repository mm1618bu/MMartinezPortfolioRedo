/**
 * Database Connection Health Check
 * Tests Supabase database connectivity and schema verification
 */

import { supabase } from './supabase';

interface HealthCheckResult {
  connected: boolean;
  tables: string[];
  errors: string[];
  timestamp: string;
}

/**
 * Check database connection
 */
export async function checkDatabaseConnection(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    connected: false,
    tables: [],
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Test basic connection by querying table list
    const response = await supabase
      .from('sites')
      .select('id')
      .limit(1);

    if (response.error) {
      result.errors.push(`Connection test failed: ${response.error.message}`);
      return result;
    }

    result.connected = true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    result.errors.push(`Exception during connection test: ${errorMessage}`);
    return result;
  }

  return result;
}

/**
 * Verify required tables exist
 */
export async function verifyDatabaseSchema(): Promise<{
  valid: boolean;
  tables: { name: string; exists: boolean; error?: string }[];
}> {
  const requiredTables = [
    'organizations',
    'sites',
    'departments',
    'shift_templates',
    'employees',
    'labor_standards',
    'demands',
  ];

  const tableChecks = await Promise.all(
    requiredTables.map(async (tableName) => {
      try {
        const { error } = await supabase
          .from(tableName as any)
          .select('id')
          .limit(1);

        // Check for specific error types
        if (error?.message?.includes('does not exist')) {
          return {
            name: tableName,
            exists: false,
            error: 'Table does not exist',
          };
        } else if (error?.message?.includes('infinite recursion')) {
          return {
            name: tableName,
            exists: false,
            error: 'RLS policy infinite recursion - disable RLS policies',
          };
        } else if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          return {
            name: tableName,
            exists: false,
            error: 'Authentication error - check API key',
          };
        } else if (error?.message?.includes('CORS')) {
          return {
            name: tableName,
            exists: false,
            error: 'CORS error - add localhost:5173 to allowed origins',
          };
        } else {
          // Table exists if there's no error or only a generic error
          return {
            name: tableName,
            exists: !error?.message?.includes('does not exist'),
            error: error?.message,
          };
        }
      } catch (err) {
        return {
          name: tableName,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    })
  );

  const allExist = tableChecks.every((t) => t.exists);
  
  return {
    valid: allExist,
    tables: tableChecks,
  };
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  rowCounts: Record<string, number>;
  errors: string[];
}> {
  const tables = [
    'organizations',
    'sites',
    'departments',
    'employees',
    'shift_templates',
    'labor_standards',
    'demands',
  ];

  const rowCounts: Record<string, number> = {};
  const errors: string[] = [];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table as any)
        .select('*', { count: 'exact', head: true });

      if (error) {
        errors.push(`${table}: ${error.message}`);
        rowCounts[table] = 0;
      } else {
        rowCounts[table] = count || 0;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push(`${table}: ${errorMessage}`);
      rowCounts[table] = 0;
    }
  }

  return { rowCounts, errors };
}

/**
 * Run comprehensive health check
 */
export async function runFullHealthCheck(): Promise<{
  connection: HealthCheckResult;
  schema: Awaited<ReturnType<typeof verifyDatabaseSchema>>;
  stats: Awaited<ReturnType<typeof getDatabaseStats>>;
  healthy: boolean;
}> {
  const connection = await checkDatabaseConnection();
  const schema = await verifyDatabaseSchema();
  const stats = await getDatabaseStats();

  const healthy =
    connection.connected &&
    connection.errors.length === 0 &&
    schema.valid &&
    stats.errors.length === 0;

  return {
    connection,
    schema,
    stats,
    healthy,
  };
}

export default {
  checkDatabaseConnection,
  verifyDatabaseSchema,
  getDatabaseStats,
  runFullHealthCheck,
};
