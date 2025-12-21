// src/front-end/utils/demographicsUtils.js

/**
 * Utilities for tracking and analyzing audience demographics
 */

/**
 * Get user's browser information
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  
  if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';
  else if (ua.indexOf('Edge') > -1) browser = 'Edge';
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
  
  return browser;
}

/**
 * Get user's device type
 */
export function getDeviceType() {
  const ua = navigator.userAgent;
  
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

/**
 * Get user's operating system
 */
export function getOperatingSystem() {
  const ua = navigator.userAgent;
  
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'MacOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1) return 'iOS';
  
  return 'Unknown';
}

/**
 * Get screen resolution category
 */
export function getScreenResolution() {
  const width = window.screen.width;
  const height = window.screen.height;
  
  if (width >= 3840) return '4K';
  if (width >= 2560) return '2K';
  if (width >= 1920) return 'Full HD';
  if (width >= 1280) return 'HD';
  return 'SD';
}

/**
 * Get user's timezone
 */
export function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get user's locale/language
 */
export function getLocale() {
  return navigator.language || navigator.userLanguage || 'en-US';
}

/**
 * Get estimated geographic region from timezone
 */
export function getEstimatedRegion() {
  const timezone = getTimezone();
  
  // Simple region estimation based on timezone
  if (timezone.includes('America')) return 'Americas';
  if (timezone.includes('Europe')) return 'Europe';
  if (timezone.includes('Asia')) return 'Asia';
  if (timezone.includes('Africa')) return 'Africa';
  if (timezone.includes('Pacific') || timezone.includes('Australia')) return 'Oceania';
  
  return 'Unknown';
}

/**
 * Get time of day category
 */
export function getTimeOfDay() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

/**
 * Get day of week
 */
export function getDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

/**
 * Collect comprehensive demographic data
 */
export function collectDemographicData() {
  return {
    browser: getBrowserInfo(),
    device: getDeviceType(),
    os: getOperatingSystem(),
    resolution: getScreenResolution(),
    timezone: getTimezone(),
    locale: getLocale(),
    region: getEstimatedRegion(),
    timeOfDay: getTimeOfDay(),
    dayOfWeek: getDayOfWeek(),
    timestamp: new Date().toISOString(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  };
}

/**
 * Aggregate demographic data by category
 */
export function aggregateDemographics(viewsData) {
  const aggregated = {
    byDevice: {},
    byBrowser: {},
    byOS: {},
    byRegion: {},
    byTimeOfDay: {},
    byDayOfWeek: {},
    byResolution: {},
    totalViews: 0
  };

  viewsData.forEach(view => {
    aggregated.totalViews++;
    
    // Aggregate by device
    const device = view.device || 'Unknown';
    aggregated.byDevice[device] = (aggregated.byDevice[device] || 0) + 1;
    
    // Aggregate by browser
    const browser = view.browser || 'Unknown';
    aggregated.byBrowser[browser] = (aggregated.byBrowser[browser] || 0) + 1;
    
    // Aggregate by OS
    const os = view.os || 'Unknown';
    aggregated.byOS[os] = (aggregated.byOS[os] || 0) + 1;
    
    // Aggregate by region
    const region = view.region || 'Unknown';
    aggregated.byRegion[region] = (aggregated.byRegion[region] || 0) + 1;
    
    // Aggregate by time of day
    const timeOfDay = view.time_of_day || 'Unknown';
    aggregated.byTimeOfDay[timeOfDay] = (aggregated.byTimeOfDay[timeOfDay] || 0) + 1;
    
    // Aggregate by day of week
    const dayOfWeek = view.day_of_week || 'Unknown';
    aggregated.byDayOfWeek[dayOfWeek] = (aggregated.byDayOfWeek[dayOfWeek] || 0) + 1;
    
    // Aggregate by resolution
    const resolution = view.resolution || 'Unknown';
    aggregated.byResolution[resolution] = (aggregated.byResolution[resolution] || 0) + 1;
  });

  return aggregated;
}

/**
 * Calculate percentages for demographic categories
 */
export function calculatePercentages(aggregated) {
  const total = aggregated.totalViews || 1; // Avoid division by zero
  
  const withPercentages = {
    totalViews: total,
    byDevice: {},
    byBrowser: {},
    byOS: {},
    byRegion: {},
    byTimeOfDay: {},
    byDayOfWeek: {},
    byResolution: {}
  };

  // Convert counts to percentages
  Object.keys(aggregated).forEach(category => {
    if (category === 'totalViews') return;
    
    withPercentages[category] = Object.entries(aggregated[category])
      .map(([key, count]) => ({
        label: key,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  });

  return withPercentages;
}

/**
 * Get top demographic segments
 */
export function getTopSegments(demographics, limit = 5) {
  return {
    topDevices: demographics.byDevice.slice(0, limit),
    topBrowsers: demographics.byBrowser.slice(0, limit),
    topOS: demographics.byOS.slice(0, limit),
    topRegions: demographics.byRegion.slice(0, limit),
    topTimeSlots: demographics.byTimeOfDay.slice(0, limit)
  };
}

/**
 * Generate demographic insights
 */
export function generateInsights(demographics) {
  const insights = [];
  
  // Device insights
  if (demographics.byDevice.length > 0) {
    const topDevice = demographics.byDevice[0];
    insights.push({
      category: 'Device',
      text: `${topDevice.percentage}% of viewers use ${topDevice.label}`,
      icon: '📱'
    });
  }
  
  // Regional insights
  if (demographics.byRegion.length > 0) {
    const topRegion = demographics.byRegion[0];
    insights.push({
      category: 'Geography',
      text: `${topRegion.label} accounts for ${topRegion.percentage}% of views`,
      icon: '🌍'
    });
  }
  
  // Time insights
  if (demographics.byTimeOfDay.length > 0) {
    const topTime = demographics.byTimeOfDay[0];
    insights.push({
      category: 'Viewing Time',
      text: `Most views happen in the ${topTime.label} (${topTime.percentage}%)`,
      icon: '⏰'
    });
  }
  
  // Day of week insights
  if (demographics.byDayOfWeek.length > 0) {
    const topDay = demographics.byDayOfWeek[0];
    insights.push({
      category: 'Day Pattern',
      text: `${topDay.label} is your most popular day (${topDay.percentage}%)`,
      icon: '📅'
    });
  }
  
  // Browser insights
  if (demographics.byBrowser.length > 0) {
    const topBrowser = demographics.byBrowser[0];
    insights.push({
      category: 'Browser',
      text: `${topBrowser.label} users make up ${topBrowser.percentage}% of viewers`,
      icon: '🌐'
    });
  }
  
  return insights;
}

/**
 * Compare demographics between two time periods
 */
export function compareDemographics(current, previous) {
  const comparison = {
    viewsChange: 0,
    deviceChanges: [],
    regionChanges: [],
    trendingUp: [],
    trendingDown: []
  };

  // Calculate views change
  const currentTotal = current.totalViews || 0;
  const previousTotal = previous.totalViews || 0;
  
  if (previousTotal > 0) {
    comparison.viewsChange = (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1);
  }

  // Compare device distribution
  current.byDevice.forEach(device => {
    const previousDevice = previous.byDevice.find(d => d.label === device.label);
    if (previousDevice) {
      const change = (device.percentage - previousDevice.percentage).toFixed(1);
      if (Math.abs(change) >= 5) {
        comparison.deviceChanges.push({
          label: device.label,
          change: parseFloat(change)
        });
      }
    }
  });

  return comparison;
}

/**
 * Export demographics data to CSV format
 */
export function exportToCSV(demographics) {
  const rows = [
    ['Category', 'Segment', 'Count', 'Percentage']
  ];

  Object.keys(demographics).forEach(category => {
    if (category === 'totalViews') return;
    
    demographics[category].forEach(item => {
      const categoryName = category.replace('by', '');
      rows.push([categoryName, item.label, item.count, item.percentage]);
    });
  });

  return rows.map(row => row.join(',')).join('\n');
}
