/**
 * Buffer and SLA Configuration Storage Service
 * Handles persistence of buffer and SLA configurations to localStorage
 */

import {
  BufferSlaConfiguration,
  createDefaultConfiguration,
} from '../utils/bufferSlaConfig';

const STORAGE_KEY_PREFIX = 'bufferSlaConfig_';

/**
 * Get storage key for organization
 */
export function getStorageKey(organizationId: string): string {
  return `${STORAGE_KEY_PREFIX}${organizationId}`;
}

/**
 * Load configuration from localStorage
 */
export function loadConfiguration(organizationId: string): BufferSlaConfiguration {
  try {
    const key = getStorageKey(organizationId);
    const stored = localStorage.getItem(key);

    if (stored) {
      const config = JSON.parse(stored) as BufferSlaConfiguration;
      // Validate that it has all required fields
      if (config.buffers && config.slaWindows && config.organizationId) {
        return config;
      }
    }
  } catch (error) {
    console.error('Error loading buffer/SLA configuration:', error);
  }

  // Return default if loading fails
  return createDefaultConfiguration(organizationId);
}

/**
 * Save configuration to localStorage
 */
export function saveConfiguration(config: BufferSlaConfiguration): boolean {
  try {
    const key = getStorageKey(config.organizationId);
    const json = JSON.stringify(config);
    localStorage.setItem(key, json);
    return true;
  } catch (error) {
    console.error('Error saving buffer/SLA configuration:', error);
    return false;
  }
}

/**
 * Delete configuration from localStorage
 */
export function deleteConfiguration(organizationId: string): boolean {
  try {
    const key = getStorageKey(organizationId);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error deleting buffer/SLA configuration:', error);
    return false;
  }
}

/**
 * Check if configuration exists for organization
 */
export function configurationExists(organizationId: string): boolean {
  try {
    const key = getStorageKey(organizationId);
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get all stored configurations
 */
export function getAllConfigurations(): BufferSlaConfiguration[] {
  try {
    const configs: BufferSlaConfiguration[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const config = JSON.parse(stored) as BufferSlaConfiguration;
            configs.push(config);
          } catch (parseError) {
            console.warn(`Failed to parse config from key ${key}:`, parseError);
          }
        }
      }
    }

    return configs;
  } catch (error) {
    console.error('Error getting all configurations:', error);
    return [];
  }
}

/**
 * Export configuration as JSON string
 */
export function exportConfigurationAsJson(config: BufferSlaConfiguration): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from JSON string
 */
export function importConfigurationFromJson(json: string): BufferSlaConfiguration | null {
  try {
    const config = JSON.parse(json) as BufferSlaConfiguration;

    // Validate required fields
    if (!config.organizationId || !config.buffers || !config.slaWindows) {
      console.error('Invalid configuration structure');
      return null;
    }

    return config;
  } catch (error) {
    console.error('Error importing configuration:', error);
    return null;
  }
}

/**
 * Merge configurations (for updates)
 */
export function mergeConfiguration(
  existing: BufferSlaConfiguration,
  updates: Partial<BufferSlaConfiguration>
): BufferSlaConfiguration {
  return {
    ...existing,
    ...updates,
    buffers: {
      ...existing.buffers,
      ...(updates.buffers || {}),
      byPriority: {
        ...existing.buffers.byPriority,
        ...(updates.buffers?.byPriority || {}),
      },
      byDepartment: {
        ...existing.buffers.byDepartment,
        ...(updates.buffers?.byDepartment || {}),
      },
    },
    slaWindows: updates.slaWindows || existing.slaWindows,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Clone configuration
 */
export function cloneConfiguration(config: BufferSlaConfiguration): BufferSlaConfiguration {
  return JSON.parse(JSON.stringify(config));
}

export default {
  loadConfiguration,
  saveConfiguration,
  deleteConfiguration,
  configurationExists,
  getAllConfigurations,
  exportConfigurationAsJson,
  importConfigurationFromJson,
  mergeConfiguration,
  cloneConfiguration,
};
