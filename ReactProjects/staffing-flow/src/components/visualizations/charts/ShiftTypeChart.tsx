import React, { useMemo, useEffect, useRef } from 'react';
import { Demand } from '../../../services/demandService';

interface ShiftTypeChartProps {
  demands: Demand[];
}

export const ShiftTypeChart: React.FC<ShiftTypeChartProps> = ({ demands }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const data = useMemo(() => {
    const counts = {
      all_day: 0,
      morning: 0,
      evening: 0,
      night: 0,
    };

    demands.forEach((demand) => {
      if (demand.shift_type in counts) {
        counts[demand.shift_type]++;
      }
    });

    return counts;
  }, [demands]);

  const colors = {
    all_day: '#1976d2',
    morning: '#fbc02d',
    evening: '#f57c00',
    night: '#283593',
  };

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!canvasRef.current || total === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    let currentAngle = -Math.PI / 2;
    const entries = Object.entries(data);

    // Draw pie slices
    entries.forEach(([shift, count]) => {
      const sliceAngle = (count / total) * 2 * Math.PI;

      ctx.fillStyle = colors[shift as keyof typeof colors];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw text labels
      if (count > 0) {
        const textAngle = currentAngle + sliceAngle / 2;
        const textX = centerX + Math.cos(textAngle) * (radius * 0.65);
        const textY = centerY + Math.sin(textAngle) * (radius * 0.65);
        const percentage = Math.round((count / total) * 100);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, textX, textY);
      }

      currentAngle += sliceAngle;
    });
  }, [data, total]);

  return (
    <div className="chart-shift-type">
      <canvas ref={canvasRef} width={200} height={200} />

      <div className="chart-legend">
        {Object.entries(data).map(([shift, count]) => {
          return (
            <div key={shift} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: colors[shift as keyof typeof colors] }}
              ></div>
              <span>
                {shift.charAt(0).toUpperCase() + shift.slice(1).replace('_', ' ')} ({count})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
