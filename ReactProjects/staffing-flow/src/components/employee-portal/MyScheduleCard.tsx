import { useState, useEffect } from 'react';
import { getMySchedule, ShiftAssignment } from '../../services/laborActionsService';
import type { EmployeeInfo } from './EmployeePortal';

interface MyScheduleCardProps {
  employee: EmployeeInfo;
  compact?: boolean;
}

export function MyScheduleCard({ employee, compact = false }: MyScheduleCardProps) {
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadSchedule();
  }, [employee.employee_id, selectedDate, viewMode]);

  async function loadSchedule() {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = getDateRange(selectedDate, viewMode);
      const shiftsData = await getMySchedule(
        employee.organization_id,
        employee.employee_id,
        startDate,
        endDate
      );
      setShifts(shiftsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }

  function getDateRange(date: Date, mode: 'week' | 'month'): { startDate: string; endDate: string } {
    if (mode === 'week') {
      // Get start of week (Sunday)
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      
      // Get end of week (Saturday)
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    } else {
      // Get start of month
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      
      // Get end of month
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
  }

  function navigatePrevious() {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() - 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  }

  function navigateNext() {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  }

  function navigateToday() {
    setSelectedDate(new Date());
  }

  if (loading) {
    return (
      <div className="card schedule-card">
        <div className="card-header">
          <h2>📅 My Schedule</h2>
        </div>
        <div className="card-body">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card schedule-card">
        <div className="card-header">
          <h2>📅 My Schedule</h2>
        </div>
        <div className="card-body">
          <div className="error-message">{error}</div>
          <button className="btn btn-secondary" onClick={loadSchedule}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const date = shift.shift_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, ShiftAssignment[]>);

  const { startDate, endDate } = getDateRange(selectedDate, viewMode);
  const dates = getDatesInRange(startDate, endDate);
  const totalHours = shifts.reduce((sum, shift) => sum + shift.duration_hours, 0);

  return (
    <div className="card schedule-card">
      <div className="card-header">
        <h2>📅 My Schedule</h2>
        {!compact && (
          <div className="schedule-controls">
            <div className="view-mode-toggle">
              <button
                className={`btn btn-sm ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                Week
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'month' ? 'active' : ''}`}
                onClick={() => setViewMode('month')}
              >
                Month
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card-body">
        {!compact && (
          <div className="schedule-navigation">
            <button className="btn btn-secondary" onClick={navigatePrevious}>
              ← Previous
            </button>
            <div className="schedule-period">
              <h3>
                {viewMode === 'week' ? (
                  <>
                    {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </>
                ) : (
                  <>
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </>
                )}
              </h3>
              <button className="btn btn-link" onClick={navigateToday}>
                Today
              </button>
            </div>
            <button className="btn btn-secondary" onClick={navigateNext}>
              Next →
            </button>
          </div>
        )}

        <div className="schedule-summary">
          <div className="summary-stat">
            <span className="stat-value">{shifts.length}</span>
            <span className="stat-label">Shifts</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{totalHours.toFixed(1)}</span>
            <span className="stat-label">Hours</span>
          </div>
        </div>

        {shifts.length === 0 ? (
          <div className="empty-state">
            <p>No shifts scheduled for this period.</p>
            <p className="text-muted">Your schedule will appear here once shifts are assigned.</p>
          </div>
        ) : (
          <div className="schedule-calendar">
            {dates.map((date) => {
              const dateShifts = shiftsByDate[date] || [];
              const isToday = date === new Date().toISOString().split('T')[0];
              const dayOfWeek = new Date(date).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <div
                  key={date}
                  className={`schedule-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${
                    dateShifts.length > 0 ? 'has-shifts' : ''
                  }`}
                >
                  <div className="day-header">
                    <div className="day-name">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="day-date">
                      {new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                    </div>
                  </div>

                  <div className="day-shifts">
                    {dateShifts.length === 0 ? (
                      <div className="no-shifts">Off</div>
                    ) : (
                      dateShifts.map((shift) => (
                        <div key={shift.shift_id} className={`shift-item status-${shift.status}`}>
                          <div className="shift-time">
                            {new Date(`2000-01-01T${shift.start_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}{' '}
                            -{' '}
                            {new Date(`2000-01-01T${shift.end_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                          <div className="shift-type">{shift.shift_type}</div>
                          {!compact && (
                            <>
                              <div className="shift-department">{shift.department_name}</div>
                              <div className="shift-duration">{shift.duration_hours} hrs</div>
                              {shift.notes && <div className="shift-notes">{shift.notes}</div>}
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {compact && shifts.length > 0 && (
          <div className="card-footer">
            <button className="btn btn-link">View full schedule →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
