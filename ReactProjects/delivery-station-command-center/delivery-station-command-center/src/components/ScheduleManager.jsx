import React, { useState } from "react";

export default function ScheduleManager() {
  const [shifts, setShifts] = useState([
    {
      id: 1,
      name: "Main Sort",
      start: "01:20",
      end: "11:50",
      required: 30,
      scheduled: 30,
      vet: 0,
      vto: 0,
    },
  ]);

  const [form, setForm] = useState({
    name: "",
    start: "",
    end: "",
    required: "",
    scheduled: "",
  });

  // --- Volume-based forecast state ---
  const departmentDefaults = {
    Stow: 800, // packages per worker per shift
    Pick: 900,
    "Pack Singles": 1100,
    "Pack AFE1": 2000,
    "Pack AFE2": 2000,
    "Vendor Returns": 350,
    "Ship Dock": 1200,
  };

  const departmentNames = Object.keys(departmentDefaults);

  const [departments, setDepartments] = useState(
    departmentNames.map((name) => ({
      name,
      volume: "",
      rate: departmentDefaults[name],
      scheduled: "", // staff actually on schedule for this shift
      adjustment: 0, // net labor share (+ borrowed, - lent out)
    }))
  );

  // Labor-share control state
  const [share, setShare] = useState({
    from: departmentNames[0],
    to: departmentNames[1] || departmentNames[0],
    count: 1,
  });

  const handleDeptChange = (index, field, value) => {
    setDepartments((prev) =>
      prev.map((d, i) => {
        if (i !== index) return d;
        if (field === "volume") {
          return { ...d, volume: value };
        }
        if (field === "rate") {
          const num = parseFloat(value);
          return {
            ...d,
            rate: isNaN(num) ? "" : num,
          };
        }
        if (field === "scheduled") {
          const num = parseInt(value || "0", 10);
          return {
            ...d,
            scheduled: isNaN(num) ? "" : num,
          };
        }
        return d;
      })
    );
  };

  const deptForecast = departments.map((d) => {
    const volumeNum = parseFloat(d.volume || "0");
    const rateNum = parseFloat(d.rate || "0");
    const required =
      volumeNum > 0 && rateNum > 0 ? Math.ceil(volumeNum / rateNum) : 0;

    const scheduledNum = parseInt(d.scheduled || "0", 10) || 0;
    const adjustment = d.adjustment || 0;
    const netScheduled = Math.max(0, scheduledNum + adjustment);

    let status = "Balanced";
    if (netScheduled < required) status = "Understaffed";
    else if (netScheduled > required) status = "Overstaffed";

    const diff = netScheduled - required;
    let actionType = "Balanced";
    let actionLabel = "Balanced";
    let actionCount = 0;

    if (diff > 0) {
      actionType = "VTO";
      actionCount = diff;
      actionLabel = `Offer VTO to ${diff}`;
    } else if (diff < 0) {
      actionType = "VET";
      actionCount = Math.abs(diff);
      actionLabel = `Offer VET to ${Math.abs(diff)}`;
    }

    return {
      ...d,
      required,
      scheduledNum,
      adjustment,
      netScheduled,
      status,
      diff,
      actionType,
      actionCount,
      actionLabel,
    };
  });

  const deptTotals = deptForecast.reduce(
    (acc, d) => {
      acc.volume += parseFloat(d.volume || "0") || 0;
      acc.required += d.required;
      acc.scheduled += d.scheduledNum;
      acc.shared += d.adjustment || 0;
      acc.netScheduled += d.netScheduled;

      if (d.actionType === "VTO") acc.totalVTO += d.actionCount;
      if (d.actionType === "VET") acc.totalVET += d.actionCount;

      return acc;
    },
    {
      volume: 0,
      required: 0,
      scheduled: 0,
      shared: 0,
      netScheduled: 0,
      totalVTO: 0,
      totalVET: 0,
    }
  );

  const handleShareChange = (e) => {
    const { name, value } = e.target;
    setShare((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyShare = (e) => {
    e.preventDefault();
    const count = Math.max(0, parseInt(share.count || "0", 10));
    if (!count) return;
    if (share.from === share.to) return;

    setDepartments((prev) =>
      prev.map((d) => {
        if (d.name === share.from) {
          return { ...d, adjustment: (d.adjustment || 0) - count };
        }
        if (d.name === share.to) {
          return { ...d, adjustment: (d.adjustment || 0) + count };
        }
        return d;
      })
    );
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddShift = (e) => {
    e.preventDefault();
    if (!form.name || !form.start || !form.end) return;

    const required = parseInt(form.required || "0", 10);
    const scheduled = parseInt(form.scheduled || "0", 10);

    const newShift = {
      id: Date.now(),
      name: form.name,
      start: form.start,
      end: form.end,
      required: isNaN(required) ? 0 : required,
      scheduled: isNaN(scheduled) ? 0 : scheduled,
      vet: 0,
      vto: 0,
    };

    setShifts((prev) => [...prev, newShift]);
    setForm({
      name: "",
      start: "",
      end: "",
      required: "",
      scheduled: "",
    });
  };

  const handleRemoveShift = (id) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  const adjustSlots = (id, field, delta) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;

        const updated = { ...s, [field]: Math.max(0, s[field] + delta) };
        const effective = updated.scheduled + updated.vet - updated.vto;

        if (effective < 0) {
          return s;
        }
        return updated;
      })
    );
  };

  const totals = shifts.reduce(
    (acc, s) => {
      const effective = s.scheduled + s.vet - s.vto;
      acc.required += s.required;
      acc.scheduled += s.scheduled;
      acc.effective += effective;
      return acc;
    },
    { required: 0, scheduled: 0, effective: 0 }
  );

  return (
    <>
      <style>{`
        .sched-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 1.5rem;
          border-radius: 14px;
          border: 1px solid #e0e0e0;
          background: #ffffff;
          box-shadow: 0 10px 25px rgba(0,0,0,0.04);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .sched-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: baseline;
          margin-bottom: 1.25rem;
        }

        .sched-title {
          font-size: 1.35rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .sched-subtitle {
          font-size: 0.85rem;
          color: #666;
        }

        .sched-summary {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .sched-chip {
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          font-size: 0.8rem;
          background: #f5f5f5;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .sched-chip strong {
          font-weight: 600;
        }

        .sched-chip.effective {
          background: #eef7ff;
        }

        .sched-chip.effective.over {
          background: #fff4e6;
        }

        .sched-chip.effective.under {
          background: #ffecec;
        }

        /* Forecast card */
        .forecast-card {
          margin-bottom: 1.5rem;
          padding: 1rem 1.1rem;
          border-radius: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .forecast-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .forecast-title {
          font-size: 0.95rem;
          font-weight: 600;
        }

        .forecast-subtitle {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .forecast-chip {
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          background: #e0f2fe;
          color: #075985;
        }

        .forecast-table-wrapper {
          overflow-x: auto;
        }

        .forecast-table {
          width: 88%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }

        .forecast-table th,
        .forecast-table td {
          padding: 0.35rem 0.45rem;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          white-space: nowrap;
        }

        .forecast-table th {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          background: #f3f4f6;
        }

        .forecast-input {
          width: 50%;
          padding: 0.3rem 0.45rem;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          font-size: 0.8rem;
        }

        .forecast-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 1px rgba(37,99,235,0.25);
        }

        .forecast-total-row td {
          font-weight: 600;
          background: #f9fafb;
        }

        .forecast-note {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Labor share controls */
        .share-form {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          margin: 0.6rem 0 0.4rem;
          font-size: 0.8rem;
        }

        .share-label {
          font-weight: 500;
          color: #374151;
        }

        .share-select,
        .share-input {
          padding: 0.25rem 0.45rem;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          font-size: 0.8rem;
        }

        .share-select:focus,
        .share-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 1px rgba(37,99,235,0.25);
        }

        .share-btn {
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          background: #2563eb;
          color: #ffffff;
          cursor: pointer;
          white-space: nowrap;
        }

        .share-btn:hover {
          background: #1d4ed8;
        }

        .share-caption {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .share-positive {
          color: #166534;
        }

        .share-negative {
          color: #b91c1c;
        }

        .status-badge {
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .status-balance {
          background: #e8f7ee;
          color: #166534;
        }

        .status-under {
          background: #fee2e2;
          color: #b91c1c;
        }

        .status-over {
          background: #fef3c7;
          color: #92400e;
        }

        .action-chip {
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
        }

        .action-vto {
          background: #fef2f2;
          color: #b91c1c;
        }

        .action-vet {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .action-balanced {
          background: #e5e7eb;
          color: #374151;
        }

        .sched-form {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr)) auto;
          gap: 0.5rem;
          align-items: end;
          margin-bottom: 1.5rem;
        }

        .sched-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .sched-form label {
          font-size: 0.75rem;
          color: #555;
        }

        .sched-input {
          padding: 0.45rem 0.6rem;
          border-radius: 8px;
          border: 1px solid #d3d3d3;
          font-size: 0.85rem;
        }

        .sched-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 1px rgba(37,99,235,0.25);
        }

        .sched-btn {
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          border: none;
          font-size: 0.85rem;
          font-weight: 500;
          background: #2563eb;
          color: #ffffff;
          cursor: pointer;
          white-space: nowrap;
        }

        .sched-btn:hover {
          background: #1d4ed8;
        }

        .sched-table-wrapper {
          overflow-x: auto;
        }

        .sched-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .sched-table th,
        .sched-table td {
          padding: 0.5rem 0.6rem;
          border-bottom: 1px solid #f0f0f0;
          text-align: left;
          white-space: nowrap;
        }

        .sched-table th {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #777;
          background: #fafafa;
        }

        .sched-table tr:nth-child(even) td {
          background: #fcfcfc;
        }

        .sched-time {
          font-family: "SF Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.8rem;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-balanced {
          background: #e8f7ee;
          color: #166534;
        }

        .status-under {
          background: #fee2e2;
          color: #b91c1c;
        }

        .status-over {
          background: #fef3c7;
          color: #92400e;
        }

        .vet-vto-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .vet-vto-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .vet-vto-label {
          font-size: 0.7rem;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .vet-vto-value {
          min-width: 1.5rem;
          text-align: center;
          font-weight: 600;
        }

        .btn-icon {
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 999px;
          border: 1px solid #d4d4d4;
          background: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .btn-icon:hover {
          background: #f5f5f5;
        }

        .sched-remove-btn {
          border-radius: 999px;
          border: 1px solid #fca5a5;
          background: #fef2f2;
          color: #b91c1c;
          padding: 0.3rem 0.6rem;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .sched-remove-btn:hover {
          background: #fee2e2;
        }

        @media (max-width: 900px) {
          .sched-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 720px) {
          .sched-container {
            margin: 1rem;
            padding: 1rem;
          }
          .sched-form {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: auto;
          }
        }
      `}</style>

      <div className="sched-container">
        <div className="sched-header">
          <div>
            <div className="sched-title">Employee Schedule Manager</div>
            <div className="sched-subtitle">
              Plan shifts, forecast headcount by department, see scheduled staff,
              manage labor sharing, and auto-suggest VET/VTO.
            </div>
          </div>
          <div>
            <div className="sched-summary">
              <span className="sched-chip">
                Required (shifts): <strong>{totals.required}</strong>
              </span>
              <span className="sched-chip">
                Scheduled (base): <strong>{totals.scheduled}</strong>
              </span>
              <span
                className={
                  "sched-chip effective " +
                  (totals.effective > totals.required
                    ? "over"
                    : totals.effective < totals.required
                    ? "under"
                    : "")
                }
              >
                Effective: <strong>{totals.effective}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Volume-based forecast + labor share */}
        <div className="forecast-card">
          <div className="forecast-header">
            <div>
              <div className="forecast-title">
                Volume-based headcount forecast (by department)
              </div>
              <div className="forecast-subtitle">
                Enter volume, throughput, and scheduled staff for this shift.
                Use labor share to move people between departments. VET/VTO
                recommendations are calculated automatically.
              </div>
            </div>
            <div className="forecast-chip">
              Req: {deptTotals.required} | Sched: {deptTotals.scheduled} | Net:{" "}
              {deptTotals.netScheduled} | VTO: {deptTotals.totalVTO} | VET:{" "}
              {deptTotals.totalVET}
            </div>
          </div>

          {/* Labor share controls */}
          <form className="share-form" onSubmit={handleApplyShare}>
            <span className="share-label">Labor share:</span>
            <span>Move</span>
            <input
              className="share-input"
              type="number"
              min="1"
              name="count"
              value={share.count}
              onChange={handleShareChange}
              style={{ width: "4rem" }}
            />
            <span>people from</span>
            <select
              className="share-select"
              name="from"
              value={share.from}
              onChange={handleShareChange}
            >
              {departmentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <span>to</span>
            <select
              className="share-select"
              name="to"
              value={share.to}
              onChange={handleShareChange}
            >
              {departmentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button type="submit" className="share-btn">
              Apply
            </button>
          </form>
          <div className="share-caption">
            “Scheduled” is the staff you actually have on the shift. “Shared +/-” is labor
            moved in/out. Net scheduled vs required drives where you send VTO or request VET.
          </div>

          <div className="forecast-table-wrapper">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Volume (pkgs)</th>
                  <th>Units / worker / shift</th>
                  <th>Req. headcount</th>
                  <th>Scheduled</th>
                  <th>Shared +/-</th>
                  <th>Net scheduled</th>
                  <th>Status</th>
                  <th>Auto action (VTO/VET)</th>
                </tr>
              </thead>
              <tbody>
                {deptForecast.map((d, idx) => (
                  <tr key={d.name}>
                    <td>{d.name}</td>
                    <td>
                      <input
                        className="forecast-input"
                        type="number"
                        min="0"
                        value={d.volume}
                        onChange={(e) =>
                          handleDeptChange(idx, "volume", e.target.value)
                        }
                        placeholder="e.g. 24000"
                      />
                    </td>
                    <td>
                      <input
                        className="forecast-input"
                        type="number"
                        min="1"
                        value={d.rate}
                        onChange={(e) =>
                          handleDeptChange(idx, "rate", e.target.value)
                        }
                      />
                    </td>
                    <td>{d.required}</td>
                    <td>
                      <input
                        className="forecast-input"
                        type="number"
                        min="0"
                        value={d.scheduled}
                        onChange={(e) =>
                          handleDeptChange(idx, "scheduled", e.target.value)
                        }
                        placeholder="staff on shift"
                      />
                    </td>
                    <td
                      className={
                        d.adjustment > 0
                          ? "share-positive"
                          : d.adjustment < 0
                          ? "share-negative"
                          : ""
                      }
                    >
                      {d.adjustment > 0 ? `+${d.adjustment}` : d.adjustment}
                    </td>
                    <td>{d.netScheduled}</td>
                    <td>
                      <span
                        className={
                          "status-badge " +
                          (d.status === "Understaffed"
                            ? "status-under"
                            : d.status === "Overstaffed"
                            ? "status-over"
                            : "status-balance")
                        }
                      >
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          "action-chip " +
                          (d.actionType === "VTO"
                            ? "action-vto"
                            : d.actionType === "VET"
                            ? "action-vet"
                            : "action-balanced")
                        }
                      >
                        {d.actionLabel}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="forecast-total-row">
                  <td>Total</td>
                  <td>{deptTotals.volume}</td>
                  <td>—</td>
                  <td>{deptTotals.required}</td>
                  <td>{deptTotals.scheduled}</td>
                  <td>{deptTotals.shared}</td>
                  <td>{deptTotals.netScheduled}</td>
                  <td>—</td>
                  <td>
                    {deptTotals.totalVTO > 0 && (
                      <span className="action-chip action-vto" style={{ marginRight: 6 }}>
                        VTO total: {deptTotals.totalVTO}
                      </span>
                    )}
                    {deptTotals.totalVET > 0 && (
                      <span className="action-chip action-vet">
                        VET total: {deptTotals.totalVET}
                      </span>
                    )}
                    {deptTotals.totalVTO === 0 && deptTotals.totalVET === 0 && (
                      <span className="action-chip action-balanced">Balanced</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="forecast-note">
            Use this to quickly see where you’re heavy (VTO candidates) or light (VET /
            labor-share pull) before you publish offers in A to Z.
          </div>
        </div>

        {/* Add Shift Form */}
        <form className="sched-form" onSubmit={handleAddShift}>
          <div className="sched-form-group">
            <label>Shift name</label>
            <input
              className="sched-input"
              name="name"
              placeholder="Sort / Pick / Pack"
              value={form.name}
              onChange={handleFormChange}
            />
          </div>
          <div className="sched-form-group">
            <label>Start time</label>
            <input
              className="sched-input"
              name="start"
              type="time"
              value={form.start}
              onChange={handleFormChange}
            />
          </div>
          <div className="sched-form-group">
            <label>End time</label>
            <input
              className="sched-input"
              name="end"
              type="time"
              value={form.end}
              onChange={handleFormChange}
            />
          </div>
          <div className="sched-form-group">
            <label>Staff needed (total)</label>
            <input
              className="sched-input"
              name="required"
              type="number"
              min="0"
              value={form.required}
              onChange={handleFormChange}
              placeholder="e.g. 40"
            />
          </div>
          <div className="sched-form-group">
            <label>Currently scheduled (total)</label>
            <input
              className="sched-input"
              name="scheduled"
              type="number"
              min="0"
              value={form.scheduled}
              onChange={handleFormChange}
              placeholder="e.g. 35"
            />
          </div>
          <button type="submit" className="sched-btn">
            Add shift
          </button>
        </form>

        {/* Shifts Table */}
        <div className="sched-table-wrapper">
          <table className="sched-table">
            <thead>
              <tr>
                <th>Shift</th>
                <th>Time</th>
                <th>Needed</th>
                <th>Base staff</th>
                <th>Effective staff</th>
                <th>Status</th>
                <th>VET (extra)</th>
                <th>VTO (off)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => {
                const effective = s.scheduled + s.vet - s.vto;
                let statusLabel = "Balanced";
                let statusClass = "status-balanced";

                if (effective < s.required) {
                  statusLabel = "Understaffed";
                  statusClass = "status-under";
                } else if (effective > s.required) {
                  statusLabel = "Overstaffed";
                  statusClass = "status-over";
                }

                return (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td className="sched-time">
                      {s.start} – {s.end}
                    </td>
                    <td>{s.required}</td>
                    <td>{s.scheduled}</td>
                    <td>{effective}</td>
                    <td>
                      <span className={`status-pill ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <div className="vet-vto-group">
                        <div className="vet-vto-row">
                          <span className="vet-vto-label">VET</span>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => adjustSlots(s.id, "vet", -1)}
                          >
                            −
                          </button>
                          <span className="vet-vto-value">{s.vet}</span>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => adjustSlots(s.id, "vet", 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="vet-vto-group">
                        <div className="vet-vto-row">
                          <span className="vet-vto-label">VTO</span>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => adjustSlots(s.id, "vto", -1)}
                          >
                            −
                          </button>
                          <span className="vet-vto-value">{s.vto}</span>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => adjustSlots(s.id, "vto", 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="sched-remove-btn"
                        onClick={() => handleRemoveShift(s.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={9}>No shifts yet. Add one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
