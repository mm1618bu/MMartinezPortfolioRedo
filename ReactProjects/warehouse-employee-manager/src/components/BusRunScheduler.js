import React, { useMemo, useState } from "react";

/**
 * Bus Run Auto-Scheduler (single component)
 *
 * What it does:
 * - Defines 4 routes with headways + one-way cycle time (out+back = 2 * oneWayMin)
 * - Generates all trips in service window (5:00 -> 24:00)
 * - Auto-builds 8-hour operator runs by greedily chaining trips with small “wait” time
 * - Inserts 35–90 min lunch once per run (default 60) near the middle of the run
 * - Lets you tune constraints (max wait, lunch, how many runs)
 *
 * Notes / Simplifications (easy to evolve later):
 * - “Trip” is modeled as a full out+back cycle (so operator stays with the bus cycle).
 *   If you want out-only / directional pieces, we can split each cycle into 2 legs.
 * - Greedy scheduling won’t be optimal (it’s a solid starting point for MVP).
 */

const ROUTES = [
  { id: "SL1", headwayMin: 10, oneWayMin: 30 },
  { id: "SL2", headwayMin: 10, oneWayMin: 25 },
  { id: "SL3", headwayMin: 10, oneWayMin: 20 }

];

const MIN = 60;
const DAY_START = 5 * MIN; // 5:00
const DAY_END = 24 * MIN; // 24:00 (midnight)

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function toHHMM(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

function minutesFromHHMM(hhmm) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function buildTrips(serviceStart, serviceEnd) {
  // Each "trip" = out+back cycle for that route
  const trips = [];
  for (const r of ROUTES) {
    const cycleMin = 2 * r.oneWayMin; // out then back
    for (let t = serviceStart; t + cycleMin <= serviceEnd; t += r.headwayMin) {
      trips.push({
        key: `${r.id}-${t}`,
        routeId: r.id,
        startMin: t,
        endMin: t + cycleMin,
        cycleMin,
      });
    }
  }
  trips.sort((a, b) => a.startMin - b.startMin || a.routeId.localeCompare(b.routeId));
  return trips;
}

/**
 * Greedy run builder:
 * - Pick earliest unassigned trip as seed
 * - Append next trip that starts after current end (or shortly after) and wait <= maxWait
 * - Insert lunch once, near mid-run, as a gap (if possible)
 */
function autoScheduleRuns({
  trips,
  numRuns,
  runLengthMin,
  maxWaitMin,
  lunchMin,
  lunchEarliestOffsetMin,
  lunchLatestOffsetMin,
}) {
  const unassigned = new Map(trips.map((t) => [t.key, t]));
  const runs = [];

  function findNextTrip(afterMin, latestStartMin) {
    // find earliest unassigned trip with start >= afterMin and start <= latestStartMin
    let best = null;
    for (const t of unassigned.values()) {
      if (t.startMin < afterMin) continue;
      if (t.startMin > latestStartMin) continue;
      if (!best || t.startMin < best.startMin) best = t;
    }
    return best;
  }

  for (let runIdx = 0; runIdx < numRuns; runIdx++) {
    if (unassigned.size === 0) break;

    // seed = earliest trip
    let seed = null;
    for (const t of unassigned.values()) {
      if (!seed || t.startMin < seed.startMin) seed = t;
    }
    if (!seed) break;

    const runStart = seed.startMin;
    const runEndTarget = runStart + runLengthMin;

    const pieces = [];
    let cursor = runStart;
    let currentEnd = runStart;
    let lunchInserted = false;

    // Take seed
    pieces.push({
      type: "trip",
      ...seed,
      label: `Route ${seed.routeId} (cycle ${seed.cycleMin}m)`,
    });
    unassigned.delete(seed.key);
    currentEnd = seed.endMin;

    // Try to grow run
    while (true) {
      const remaining = runEndTarget - currentEnd;
      if (remaining <= 0) break;

      // Decide whether to insert lunch now
      const offsetFromStart = currentEnd - runStart;

      const canInsertLunchWindow =
        !lunchInserted &&
        offsetFromStart >= lunchEarliestOffsetMin &&
        offsetFromStart <= lunchLatestOffsetMin &&
        currentEnd + lunchMin <= runEndTarget; // lunch must fit

      if (canInsertLunchWindow) {
        // insert lunch as a "break" piece
        pieces.push({
          type: "break",
          startMin: currentEnd,
          endMin: currentEnd + lunchMin,
          label: `Lunch (${lunchMin}m)`,
        });
        currentEnd += lunchMin;
        lunchInserted = true;
        continue; // after lunch, try find next trip
      }

      const next = findNextTrip(currentEnd, currentEnd + maxWaitMin);
      if (!next) break;

      // If taking next would exceed runEndTarget, stop
      if (next.endMin > runEndTarget) break;

      // If there is a wait gap, record it
      if (next.startMin > currentEnd) {
        pieces.push({
          type: "deadhead",
          startMin: currentEnd,
          endMin: next.startMin,
          label: `Wait (${next.startMin - currentEnd}m)`,
        });
      }

      pieces.push({
        type: "trip",
        ...next,
        label: `Route ${next.routeId} (cycle ${next.cycleMin}m)`,
      });
      unassigned.delete(next.key);
      currentEnd = next.endMin;
      cursor = currentEnd;

      if (currentEnd >= runEndTarget) break;
    }

    // If lunch never inserted, try to insert it as the biggest wait gap (or at end if fits)
    if (!lunchInserted) {
      // Find a deadhead gap big enough, closest to mid-run
      const mid = runStart + Math.floor(runLengthMin / 2);
      let bestIdx = -1;
      let bestScore = Infinity;

      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        if (p.type !== "deadhead") continue;
        const gap = p.endMin - p.startMin;
        if (gap < lunchMin) continue;
        const gapCenter = Math.floor((p.startMin + p.endMin) / 2);
        const score = Math.abs(gapCenter - mid);
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx !== -1) {
        const p = pieces[bestIdx];
        // replace part of wait with lunch
        const lunchStart = p.startMin;
        const lunchEnd = lunchStart + lunchMin;

        const newPieces = [];
        for (let i = 0; i < pieces.length; i++) {
          if (i !== bestIdx) {
            newPieces.push(pieces[i]);
            continue;
          }
          newPieces.push({
            type: "break",
            startMin: lunchStart,
            endMin: lunchEnd,
            label: `Lunch (${lunchMin}m)`,
          });
          if (lunchEnd < p.endMin) {
            newPieces.push({
              type: "deadhead",
              startMin: lunchEnd,
              endMin: p.endMin,
              label: `Wait (${p.endMin - lunchEnd}m)`,
            });
          }
        }
        pieces.length = 0;
        pieces.push(...newPieces);
        lunchInserted = true;
      } else {
        // Try adding lunch at the end if there is room (not ideal but keeps rule)
        const lastEnd = pieces[pieces.length - 1]?.endMin ?? runStart;
        if (lastEnd + lunchMin <= runEndTarget) {
          pieces.push({
            type: "break",
            startMin: lastEnd,
            endMin: lastEnd + lunchMin,
            label: `Lunch (${lunchMin}m)`,
          });
          lunchInserted = true;
        }
      }
    }

    const runEnd = pieces[pieces.length - 1]?.endMin ?? runStart;

    runs.push({
      id: `Run-${runIdx + 1}`,
      startMin: runStart,
      endMin: runEnd,
      targetEndMin: runEndTarget,
      lunchInserted,
      pieces,
    });
  }

  // Everything left in unassigned is unscheduled
  const unscheduled = Array.from(unassigned.values()).sort((a, b) => a.startMin - b.startMin);
  return { runs, unscheduled };
}

export default function BusRunScheduler() {
  const [serviceStart, setServiceStart] = useState("05:00");
  const [serviceEnd, setServiceEnd] = useState("24:00");

  const [numRuns, setNumRuns] = useState(18);
  const [runHours, setRunHours] = useState(8);

  const [maxWaitMin, setMaxWaitMin] = useState(20);

  const [lunchMin, setLunchMin] = useState(60); // 35–90 allowed
  const [lunchWindowStartMin, setLunchWindowStartMin] = useState(180); // earliest offset from run start (e.g., 3h)
  const [lunchWindowEndMin, setLunchWindowEndMin] = useState(360); // latest offset (e.g., 6h)

  const trips = useMemo(() => {
    const ss = minutesFromHHMM(serviceStart);
    const se = minutesFromHHMM(serviceEnd);
    const s = clamp(ss, 0, 24 * 60);
    const e = clamp(se, 0, 24 * 60);
    const start = Math.min(s, e);
    const end = Math.max(s, e);
    return buildTrips(start, end);
  }, [serviceStart, serviceEnd]);

  const { runs, unscheduled } = useMemo(() => {
    const lunch = clamp(lunchMin, 35, 90);
    const windowStart = clamp(lunchWindowStartMin, 0, runHours * 60);
    const windowEnd = clamp(lunchWindowEndMin, windowStart, runHours * 60);

    return autoScheduleRuns({
      trips,
      numRuns: Math.max(0, numRuns),
      runLengthMin: clamp(runHours * 60, 60, 16 * 60),
      maxWaitMin: clamp(maxWaitMin, 0, 180),
      lunchMin: lunch,
      lunchEarliestOffsetMin: windowStart,
      lunchLatestOffsetMin: windowEnd,
    });
  }, [trips, numRuns, runHours, maxWaitMin, lunchMin, lunchWindowStartMin, lunchWindowEndMin]);

  const stats = useMemo(() => {
    const total = trips.length;
    const scheduledTrips = runs
      .flatMap((r) => r.pieces)
      .filter((p) => p.type === "trip").length;
    const pct = total === 0 ? 0 : Math.round((scheduledTrips / total) * 100);
    return { total, scheduledTrips, pct, unscheduled: unscheduled.length };
  }, [trips.length, runs, unscheduled.length]);

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 10px" }}>Bus Run Auto-Scheduler (MVP)</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 12,
          alignItems: "end",
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Service start</label>
          <input value={serviceStart} onChange={(e) => setServiceStart(e.target.value)} style={inputStyle} />
          <div style={hintStyle}>Default 05:00</div>
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Service end</label>
          <input value={serviceEnd} onChange={(e) => setServiceEnd(e.target.value)} style={inputStyle} />
          <div style={hintStyle}>Default 24:00</div>
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}># Runs (operators)</label>
          <input
            type="number"
            value={numRuns}
            onChange={(e) => setNumRuns(parseInt(e.target.value || "0", 10))}
            style={inputStyle}
          />
          <div style={hintStyle}>How many workdays to build</div>
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Run length (hours)</label>
          <input
            type="number"
            value={runHours}
            onChange={(e) => setRunHours(parseInt(e.target.value || "8", 10))}
            style={inputStyle}
          />
          <div style={hintStyle}>Default 8</div>
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Max wait between trips (min)</label>
          <input
            type="number"
            value={maxWaitMin}
            onChange={(e) => setMaxWaitMin(parseInt(e.target.value || "0", 10))}
            style={inputStyle}
          />
          <div style={hintStyle}>Chain trips if gap ≤ this</div>
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Lunch (min)</label>
          <input
            type="number"
            value={lunchMin}
            onChange={(e) => setLunchMin(parseInt(e.target.value || "60", 10))}
            style={inputStyle}
          />
          <div style={hintStyle}>35–90 allowed</div>
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Lunch earliest offset (min)</label>
          <input
            type="number"
            value={lunchWindowStartMin}
            onChange={(e) => setLunchWindowStartMin(parseInt(e.target.value || "0", 10))}
            style={inputStyle}
          />
          <div style={hintStyle}>From run start (e.g., 180 = 3h)</div>
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Lunch latest offset (min)</label>
          <input
            type="number"
            value={lunchWindowEndMin}
            onChange={(e) => setLunchWindowEndMin(parseInt(e.target.value || "0", 10))}
            style={inputStyle}
          />
          <div style={hintStyle}>From run start (e.g., 360 = 6h)</div>
        </div>

        <div style={{ gridColumn: "span 6", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", background: "white" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Trips</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", background: "white" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Scheduled trips</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {stats.scheduledTrips} <span style={{ fontSize: 12, color: "#6b7280" }}>({stats.pct}%)</span>
            </div>
          </div>
          <div style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", background: "white" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Unscheduled trips</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{stats.unscheduled}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={cardStyle}>
          <h3 style={{ margin: 0 }}>Routes</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr>
                <th style={thStyle}>Route</th>
                <th style={thStyle}>Headway</th>
                <th style={thStyle}>One-way</th>
                <th style={thStyle}>Cycle (out+back)</th>
              </tr>
            </thead>
            <tbody>
              {ROUTES.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.id}</td>
                  <td style={tdStyle}>{r.headwayMin} min</td>
                  <td style={tdStyle}>{r.oneWayMin} min</td>
                  <td style={tdStyle}>{2 * r.oneWayMin} min</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
            Trips are generated per route from service start to end. Each trip represents an out+back cycle for that route.
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: 0 }}>Run Rules (current MVP)</h3>
          <ul style={{ marginTop: 8, color: "#111827", lineHeight: 1.6 }}>
            <li>Runs are built greedily: start at the earliest remaining trip.</li>
            <li>We chain the next trip if it starts within “max wait”.</li>
            <li>Lunch is inserted once, ideally between your lunch window offsets.</li>
            <li>Unscheduled trips show what still needs coverage.</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: 14, ...cardStyle }}>
        <h3 style={{ margin: 0 }}>Auto-Scheduled Runs</h3>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          {runs.length === 0 ? (
            <div style={{ color: "#6b7280" }}>No runs built. Increase # runs or adjust constraints.</div>
          ) : (
            runs.map((run) => (
              <div key={run.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700 }}>
                    {run.id}{" "}
                    <span style={{ fontWeight: 500, color: "#6b7280" }}>
                      {toHHMM(run.startMin)} → {toHHMM(run.targetEndMin)} (target 8h)
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: run.lunchInserted ? "#065f46" : "#b45309" }}>
                    {run.lunchInserted ? "Lunch scheduled" : "Lunch NOT guaranteed"}
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Start</th>
                      <th style={thStyle}>End</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.pieces.map((p, idx) => (
                      <tr key={`${run.id}-${idx}`}>
                        <td style={tdStyle}>{toHHMM(p.startMin)}</td>
                        <td style={tdStyle}>{toHHMM(p.endMin)}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "1px solid #e5e7eb",
                              background: p.type === "trip" ? "#eef2ff" : p.type === "break" ? "#ecfdf5" : "#f3f4f6",
                            }}
                          >
                            {p.type}
                          </span>
                        </td>
                        <td style={tdStyle}>{p.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, ...cardStyle }}>
        <h3 style={{ margin: 0 }}>Unscheduled Trips</h3>
        <div style={{ marginTop: 10 }}>
          {unscheduled.length === 0 ? (
            <div style={{ color: "#065f46" }}>All trips were assigned to runs under current constraints.</div>
          ) : (
            <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Route</th>
                    <th style={thStyle}>Start</th>
                    <th style={thStyle}>End</th>
                    <th style={thStyle}>Cycle</th>
                  </tr>
                </thead>
                <tbody>
                  {unscheduled.slice(0, 400).map((t) => (
                    <tr key={t.key}>
                      <td style={tdStyle}>{t.routeId}</td>
                      <td style={tdStyle}>{toHHMM(t.startMin)}</td>
                      <td style={tdStyle}>{toHHMM(t.endMin)}</td>
                      <td style={tdStyle}>{t.cycleMin} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {unscheduled.length > 400 && (
                <div style={{ padding: 10, fontSize: 12, color: "#6b7280" }}>
                  Showing first 400 of {unscheduled.length}.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  background: "white",
};

const hintStyle = { marginTop: 6, fontSize: 11, color: "#6b7280" };

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "white",
  padding: 12,
};

const thStyle = {
  textAlign: "left",
  fontSize: 12,
  color: "#6b7280",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 10px",
  position: "sticky",
  top: 0,
  background: "white",
};

const tdStyle = {
  padding: "8px 10px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 13,
};
