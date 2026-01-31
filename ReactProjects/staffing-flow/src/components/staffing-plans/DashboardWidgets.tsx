import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  purple: 'bg-purple-50 border-purple-200',
  orange: 'bg-orange-50 border-orange-200',
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
};

const textColorMap = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  purple: 'text-purple-700',
  orange: 'text-orange-700',
  red: 'text-red-700',
  yellow: 'text-yellow-700',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
}) => {
  return (
    <div className={`rounded-lg border p-6 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={`text-sm mt-2 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && <span className="text-4xl">{icon}</span>}
      </div>
    </div>
  );
};

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  showPercentage?: boolean;
}

const progressColorMap = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-600',
  red: 'bg-red-600',
  yellow: 'bg-yellow-600',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  max,
  color = 'blue',
  showPercentage = true,
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && <span className="text-sm font-bold text-gray-900">{percentage}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${progressColorMap[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const variantMap = {
  primary: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-purple-100 text-purple-800',
};

const sizeMap = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
}) => {
  return (
    <span className={`inline-block rounded-full font-medium ${variantMap[variant]} ${sizeMap[size]}`}>
      {label}
    </span>
  );
};

interface ChartProps {
  title: string;
  children: React.ReactNode;
  footer?: string;
}

export const Chart: React.FC<ChartProps> = ({ title, children, footer }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      {children}
      {footer && <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">{footer}</p>}
    </div>
  );
};

interface MetricsGridProps {
  children: React.ReactNode;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ children }) => {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>;
};
