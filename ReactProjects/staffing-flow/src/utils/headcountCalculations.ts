/**
 * Headcount Calculation Utility
 * Provides comprehensive staffing level calculations for demand planning
 */

import type { Demand } from '../services/demandService';

/**
 * Headcount breakdown by department
 */
export interface DepartmentHeadcount {
  departmentId: string;
  departmentName?: string;
  totalHeadcount: number;
  demandCount: number;
  averagePerDemand: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  byShiftType: {
    all_day: number;
    morning: number;
    evening: number;
    night: number;
  };
}

/**
 * Headcount breakdown by shift type
 */
export interface ShiftTypeHeadcount {
  shiftType: 'all_day' | 'morning' | 'evening' | 'night';
  totalHeadcount: number;
  demandCount: number;
  averagePerDemand: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Headcount breakdown by skill
 */
export interface SkillHeadcount {
  skill: string;
  totalHeadcount: number;
  demandCount: number;
  averagePerDemand: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Headcount breakdown by priority
 */
export interface PriorityHeadcount {
  priority: 'low' | 'medium' | 'high';
  totalHeadcount: number;
  demandCount: number;
  averagePerDemand: number;
  percentage: number;
}

/**
 * Daily headcount forecast
 */
export interface DailyHeadcount {
  date: string;
  totalHeadcount: number;
  demandCount: number;
  byShiftType: {
    all_day: number;
    morning: number;
    evening: number;
    night: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Comprehensive headcount summary
 */
export interface HeadcountSummary {
  totalHeadcount: number;
  totalDemands: number;
  averageHeadcountPerDemand: number;
  medianHeadcountPerDemand: number;
  minHeadcountPerDemand: number;
  maxHeadcountPerDemand: number;
  byPriority: PriorityHeadcount[];
  byShiftType: ShiftTypeHeadcount[];
  byDepartment: DepartmentHeadcount[];
  bySkill: SkillHeadcount[];
  byDate: DailyHeadcount[];
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Calculate total headcount across all demands
 */
export function calculateTotalHeadcount(demands: Demand[]): number {
  return demands.reduce((total, demand) => total + demand.required_employees, 0);
}

/**
 * Calculate average headcount per demand
 */
export function calculateAverageHeadcount(demands: Demand[]): number {
  if (demands.length === 0) return 0;
  return calculateTotalHeadcount(demands) / demands.length;
}

/**
 * Calculate median headcount per demand
 */
export function calculateMedianHeadcount(demands: Demand[]): number {
  if (demands.length === 0) return 0;
  const sorted = [...demands]
    .sort((a, b) => a.required_employees - b.required_employees)
    .map(d => d.required_employees);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate min/max headcount per demand
 */
export function calculateHeadcountRange(demands: Demand[]): { min: number; max: number } {
  if (demands.length === 0) return { min: 0, max: 0 };
  const headcounts = demands.map(d => d.required_employees);
  return {
    min: Math.min(...headcounts),
    max: Math.max(...headcounts),
  };
}

/**
 * Calculate headcount by priority
 */
export function calculateHeadcountByPriority(demands: Demand[]): PriorityHeadcount[] {
  const byPriority = { low: 0, medium: 0, high: 0 };
  const countByPriority = { low: 0, medium: 0, high: 0 };

  demands.forEach(demand => {
    byPriority[demand.priority] += demand.required_employees;
    countByPriority[demand.priority]++;
  });

  const total = calculateTotalHeadcount(demands);

  return [
    {
      priority: 'low',
      totalHeadcount: byPriority.low,
      demandCount: countByPriority.low,
      averagePerDemand: countByPriority.low > 0 ? byPriority.low / countByPriority.low : 0,
      percentage: total > 0 ? (byPriority.low / total) * 100 : 0,
    },
    {
      priority: 'medium',
      totalHeadcount: byPriority.medium,
      demandCount: countByPriority.medium,
      averagePerDemand: countByPriority.medium > 0 ? byPriority.medium / countByPriority.medium : 0,
      percentage: total > 0 ? (byPriority.medium / total) * 100 : 0,
    },
    {
      priority: 'high',
      totalHeadcount: byPriority.high,
      demandCount: countByPriority.high,
      averagePerDemand: countByPriority.high > 0 ? byPriority.high / countByPriority.high : 0,
      percentage: total > 0 ? (byPriority.high / total) * 100 : 0,
    },
  ];
}

/**
 * Calculate headcount by shift type
 */
export function calculateHeadcountByShiftType(demands: Demand[]): ShiftTypeHeadcount[] {
  const shiftTypes = ['all_day', 'morning', 'evening', 'night'] as const;
  const result: ShiftTypeHeadcount[] = [];

  for (const shiftType of shiftTypes) {
    const shiftDemands = demands.filter(d => d.shift_type === shiftType);
    const totalHeadcount = calculateTotalHeadcount(shiftDemands);

    result.push({
      shiftType,
      totalHeadcount,
      demandCount: shiftDemands.length,
      averagePerDemand: shiftDemands.length > 0 ? totalHeadcount / shiftDemands.length : 0,
      byPriority: {
        low: shiftDemands.filter(d => d.priority === 'low').reduce((sum, d) => sum + d.required_employees, 0),
        medium: shiftDemands.filter(d => d.priority === 'medium').reduce((sum, d) => sum + d.required_employees, 0),
        high: shiftDemands.filter(d => d.priority === 'high').reduce((sum, d) => sum + d.required_employees, 0),
      },
    });
  }

  return result;
}

/**
 * Calculate headcount by department
 */
export function calculateHeadcountByDepartment(
  demands: Demand[],
  departments?: Array<{ id: string; name: string }>
): DepartmentHeadcount[] {
  const deptMap = new Map<string, Demand[]>();

  demands.forEach(demand => {
    const deptId = demand.department_id || 'unassigned';
    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, []);
    }
    deptMap.get(deptId)!.push(demand);
  });

  const deptNameMap = new Map<string, string>();
  departments?.forEach(dept => {
    deptNameMap.set(dept.id, dept.name);
  });

  const result: DepartmentHeadcount[] = [];

  deptMap.forEach((deptDemands, deptId) => {
    const totalHeadcount = calculateTotalHeadcount(deptDemands);

    result.push({
      departmentId: deptId,
      departmentName: deptNameMap.get(deptId),
      totalHeadcount,
      demandCount: deptDemands.length,
      averagePerDemand: deptDemands.length > 0 ? totalHeadcount / deptDemands.length : 0,
      byPriority: {
        low: deptDemands.filter(d => d.priority === 'low').reduce((sum, d) => sum + d.required_employees, 0),
        medium: deptDemands.filter(d => d.priority === 'medium').reduce((sum, d) => sum + d.required_employees, 0),
        high: deptDemands.filter(d => d.priority === 'high').reduce((sum, d) => sum + d.required_employees, 0),
      },
      byShiftType: {
        all_day: deptDemands.filter(d => d.shift_type === 'all_day').reduce((sum, d) => sum + d.required_employees, 0),
        morning: deptDemands.filter(d => d.shift_type === 'morning').reduce((sum, d) => sum + d.required_employees, 0),
        evening: deptDemands.filter(d => d.shift_type === 'evening').reduce((sum, d) => sum + d.required_employees, 0),
        night: deptDemands.filter(d => d.shift_type === 'night').reduce((sum, d) => sum + d.required_employees, 0),
      },
    });
  });

  return result.sort((a, b) => b.totalHeadcount - a.totalHeadcount);
}

/**
 * Calculate headcount by skill
 */
export function calculateHeadcountBySkill(demands: Demand[]): SkillHeadcount[] {
  const skillMap = new Map<string, Demand[]>();

  demands.forEach(demand => {
    if (demand.required_skills && demand.required_skills.length > 0) {
      demand.required_skills.forEach(skill => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, []);
        }
        skillMap.get(skill)!.push(demand);
      });
    }
  });

  const result: SkillHeadcount[] = [];

  skillMap.forEach((skillDemands, skill) => {
    const totalHeadcount = calculateTotalHeadcount(skillDemands);

    result.push({
      skill,
      totalHeadcount,
      demandCount: skillDemands.length,
      averagePerDemand: skillDemands.length > 0 ? totalHeadcount / skillDemands.length : 0,
      byPriority: {
        low: skillDemands.filter(d => d.priority === 'low').reduce((sum, d) => sum + d.required_employees, 0),
        medium: skillDemands.filter(d => d.priority === 'medium').reduce((sum, d) => sum + d.required_employees, 0),
        high: skillDemands.filter(d => d.priority === 'high').reduce((sum, d) => sum + d.required_employees, 0),
      },
    });
  });

  return result.sort((a, b) => b.totalHeadcount - a.totalHeadcount);
}

/**
 * Calculate headcount by date
 */
export function calculateHeadcountByDate(demands: Demand[]): DailyHeadcount[] {
  const dateMap = new Map<string, Demand[]>();

  demands.forEach(demand => {
    const date = demand.date;
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    dateMap.get(date)!.push(demand);
  });

  const result: DailyHeadcount[] = [];

  dateMap.forEach((dateDemands, date) => {
    const totalHeadcount = calculateTotalHeadcount(dateDemands);

    result.push({
      date,
      totalHeadcount,
      demandCount: dateDemands.length,
      byShiftType: {
        all_day: dateDemands.filter(d => d.shift_type === 'all_day').reduce((sum, d) => sum + d.required_employees, 0),
        morning: dateDemands.filter(d => d.shift_type === 'morning').reduce((sum, d) => sum + d.required_employees, 0),
        evening: dateDemands.filter(d => d.shift_type === 'evening').reduce((sum, d) => sum + d.required_employees, 0),
        night: dateDemands.filter(d => d.shift_type === 'night').reduce((sum, d) => sum + d.required_employees, 0),
      },
      byPriority: {
        low: dateDemands.filter(d => d.priority === 'low').reduce((sum, d) => sum + d.required_employees, 0),
        medium: dateDemands.filter(d => d.priority === 'medium').reduce((sum, d) => sum + d.required_employees, 0),
        high: dateDemands.filter(d => d.priority === 'high').reduce((sum, d) => sum + d.required_employees, 0),
      },
    });
  });

  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate comprehensive headcount summary
 */
export function calculateHeadcountSummary(
  demands: Demand[],
  departments?: Array<{ id: string; name: string }>
): HeadcountSummary {
  const datesByDate = calculateHeadcountByDate(demands);
  const dates = datesByDate.map(d => d.date);

  return {
    totalHeadcount: calculateTotalHeadcount(demands),
    totalDemands: demands.length,
    averageHeadcountPerDemand: calculateAverageHeadcount(demands),
    medianHeadcountPerDemand: calculateMedianHeadcount(demands),
    minHeadcountPerDemand: calculateHeadcountRange(demands).min,
    maxHeadcountPerDemand: calculateHeadcountRange(demands).max,
    byPriority: calculateHeadcountByPriority(demands),
    byShiftType: calculateHeadcountByShiftType(demands),
    byDepartment: calculateHeadcountByDepartment(demands, departments),
    bySkill: calculateHeadcountBySkill(demands),
    byDate: datesByDate,
    dateRange: {
      start: dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0],
      end: dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().split('T')[0],
    },
  };
}

/**
 * Calculate projected headcount with confidence level
 * Uses historical data to project future needs
 */
export function calculateProjectedHeadcount(
  historicalDemands: Demand[],
  projectionDays: number = 30
): DailyHeadcount[] {
  if (historicalDemands.length === 0) return [];

  const dailyHeadcounts = calculateHeadcountByDate(historicalDemands);
  const averageHeadcount = calculateAverageHeadcount(historicalDemands);

  const lastDate = new Date(dailyHeadcounts[dailyHeadcounts.length - 1].date);
  const projections: DailyHeadcount[] = [];

  for (let i = 1; i <= projectionDays; i++) {
    const projectionDate = new Date(lastDate);
    projectionDate.setDate(projectionDate.getDate() + i);

    projections.push({
      date: projectionDate.toISOString().split('T')[0],
      totalHeadcount: Math.round(averageHeadcount),
      demandCount: 0,
      byShiftType: {
        all_day: 0,
        morning: 0,
        evening: 0,
        night: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
      },
    });
  }

  return projections;
}

export default {
  calculateTotalHeadcount,
  calculateAverageHeadcount,
  calculateMedianHeadcount,
  calculateHeadcountRange,
  calculateHeadcountByPriority,
  calculateHeadcountByShiftType,
  calculateHeadcountByDepartment,
  calculateHeadcountBySkill,
  calculateHeadcountByDate,
  calculateHeadcountSummary,
  calculateProjectedHeadcount,
};
