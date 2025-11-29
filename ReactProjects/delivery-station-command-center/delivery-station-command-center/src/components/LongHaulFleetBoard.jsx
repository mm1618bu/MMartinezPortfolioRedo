import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

/**
 * LongHaulFleetBoard v4 (optimized)
 * - Single-file, inline styles, JSON-only data (no external libs)
 * - useReducer for all truck mutations (predictable updates)
 * - Debounced search, memoized derivations, stable sorting
 * - Keyboard shortcuts: 'a'(+1h), 't'(theme), '/'(focus search)
 * - "Select All (filtered)" + page select + clear
 * - Saved Views persisted; theme & pageSize persisted
 * - Safer CSV import/export; resilient localStorage (debounced)
 */

export default function LongHaulFleetBoard() {
  // ---------- Utils ----------
  const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const now = () => new Date();
  const toISO = (d) => new Date(d).toISOString();
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString(undefined, {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
  const fmtDateShort = (d) =>
    d
      ? new Date(d).toLocaleString(undefined, {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
        })
      : "-";
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const cycle = (arr, val) => arr[(arr.indexOf(val) + 1) % arr.length];
  const isDateLike = (v) => typeof v === "string" && !Number.isNaN(Date.parse(v));

  // Haversine distance (mi)
  const distMi = (a, b) => {
    const R = 3958.8;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  // ---------- Constants / Master Data ----------
  const [warehouses] = useState([
    { id: "Seattle, WA", name: "Seattle, WA", lat: 47.6062, lon: -122.3321 },
    { id: "Portland, OR", name: "Portland, OR", lat: 45.5152, lon: -122.6784 },
    { id: "Boise, ID", name: "Boise, ID", lat: 43.615, lon: -116.2023 },
    { id: "San Francisco, CA", name: "San Francisco, CA", lat: 37.7749, lon: -122.4194 },
    { id: "Los Angeles, CA", name: "Los Angeles, CA", lat: 34.0522, lon: -118.2437 },
    { id: "San Diego, CA", name: "San Diego, CA", lat: 32.7157, lon: -117.1611 },
    { id: "Phoenix, AZ", name: "Phoenix, AZ", lat: 33.4484, lon: -112.074 },
    { id: "Las Vegas, NV", name: "Las Vegas, NV", lat: 36.1699, lon: -115.1398 },
    { id: "Salt Lake City, UT", name: "Salt Lake City, UT", lat: 40.7608, lon: -111.891 },
    { id: "Denver, CO", name: "Denver, CO", lat: 39.7392, lon: -104.9903 },
    { id: "Albuquerque, NM", name: "Albuquerque, NM", lat: 35.0844, lon: -106.6504 },
    { id: "Dallas, TX", name: "Dallas, TX", lat: 32.7767, lon: -96.797 },
    { id: "Houston, TX", name: "Houston, TX", lat: 29.7604, lon: -95.3698 },
    { id: "Austin, TX", name: "Austin, TX", lat: 30.2672, lon: -97.7431 },
    { id: "San Antonio, TX", name: "San Antonio, TX", lat: 29.4241, lon: -98.4936 },
    { id: "Kansas City, MO", name: "Kansas City, MO", lat: 39.0997, lon: -94.5786 },
    { id: "Omaha, NE", name: "Omaha, NE", lat: 41.2565, lon: -95.9345 },
    { id: "Minneapolis, MN", name: "Minneapolis, MN", lat: 44.9778, lon: -93.265 },
    { id: "Chicago, IL", name: "Chicago, IL", lat: 41.8781, lon: -87.6298 },
    { id: "St. Louis, MO", name: "St. Louis, MO", lat: 38.627, lon: -90.1994 },
    { id: "Memphis, TN", name: "Memphis, TN", lat: 35.1495, lon: -90.049 },
    { id: "Nashville, TN", name: "Nashville, TN", lat: 36.1627, lon: -86.7816 },
    { id: "Atlanta, GA", name: "Atlanta, GA", lat: 33.749, lon: -84.388 },
    { id: "Miami, FL", name: "Miami, FL", lat: 25.7617, lon: -80.1918 },
    { id: "Orlando, FL", name: "Orlando, FL", lat: 28.5383, lon: -81.3792 },
    { id: "Charlotte, NC", name: "Charlotte, NC", lat: 35.2271, lon: -80.8431 },
    { id: "Raleigh, NC", name: "Raleigh, NC", lat: 35.7796, lon: -78.6382 },
    { id: "Washington, DC", name: "Washington, DC", lat: 38.9072, lon: -77.0369 },
    { id: "Philadelphia, PA", name: "Philadelphia, PA", lat: 39.9526, lon: -75.1652 },
    { id: "New York, NY", name: "New York, NY", lat: 40.7128, lon: -74.006 },
  ]);

  const priorities = ["Normal", "High", "Critical"];
  const statuses = ["In Yard", "Loading", "En Route", "Unloading", "Maintenance"];
  const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---------- Persistence Keys ----------
  const LS_TRUCKS = "FLEET_STATE_V4";
  const LS_FILTERS = "FLEET_SAVED_VIEWS_V4";
  const LS_THEME = "FLEET_THEME_V4";
  const LS_PAGESIZE = "FLEET_PAGE_SIZE_V4";

  // ---------- Debounce helper ----------
  function useDebouncedValue(value, delay = 250) {
    const [v, setV] = useState(value);
    useEffect(() => {
      const id = setTimeout(() => setV(value), delay);
      return () => clearTimeout(id);
    }, [value, delay]);
    return v;
  }

  // ---------- Build initial fleet ----------
  const buildInitialTrucks = useCallback(() => {
    const list = [];
    for (let i = 1; i <= 120; i++) {
      const origin = randomFrom(warehouses);
      let dest = randomFrom(warehouses);
      while (dest.id === origin.id) dest = randomFrom(warehouses);

      const distance = Math.round(distMi(origin, dest));
      const speed = 55 + Math.floor(Math.random() * 16); // 55–70 mph
      const driveHrs = Math.max(2, Math.round(distance / speed));
      const depart = new Date();
      depart.setHours(depart.getHours() - Math.floor(Math.random() * 8));
      const eta = new Date(depart);
      eta.setHours(eta.getHours() + driveHrs);

      const status = randomFrom(statuses);
      const capacity = 1400 + Math.floor(Math.random() * 401); // 1400–1800
      const load = Math.max(0, Math.min(capacity, Math.floor(Math.random() * capacity)));

      // Optional appointment
      const apptChance = Math.random();
      let apptAt = "";
      if (status === "En Route" && apptChance > 0.6) {
        const a = new Date(depart);
        a.setHours(a.getHours() + driveHrs + (Math.random() > 0.5 ? -1 : +1));
        apptAt = toISO(a);
      }

      const base = {
        id: `T${String(i).padStart(3, "0")}`,
        trailerId: `TRL-${1000 + i}`,
        status,
        origin: origin.id,
        destination: dest.id,
        distanceMi: distance,
        speedMph: speed,
        departAt: toISO(depart),
        eta: toISO(eta),
        lastUpdate: toISO(now()),
        priority: randomFrom(priorities),
        driver: `Driver ${i}`,
        notes: "",
        pkgCount: load,
        pkgCapacity: capacity,
        apptAt,
      };

      if (status === "In Yard" || status === "Maintenance") {
        base.departAt = "";
        base.eta = "";
        base.destination = origin.id;
      } else if (status === "Loading") {
        const d = new Date();
        const e = new Date(d);
        e.setHours(e.getHours() + driveHrs);
        base.departAt = toISO(d);
        base.eta = toISO(e);
      }

      list.push(base);
    }
    return list;
  }, [warehouses]);

  // ---------- LocalStorage helpers ----------
  const safeRead = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const safeWrite = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  };
  const readTheme = () => {
    try {
      const t = localStorage.getItem(LS_THEME);
      return t === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  };

  // ---------- Trucks reducer ----------
  const ACTIONS = {
    SET_ALL: "SET_ALL",
    PATCH_ONE: "PATCH_ONE",
    MAP: "MAP",
  };

  function trucksReducer(state, action) {
    switch (action.type) {
      case ACTIONS.SET_ALL:
        return action.trucks;
      case ACTIONS.PATCH_ONE:
        return state.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t));
      case ACTIONS.MAP:
        return state.map(action.mapper);
      default:
        return state;
    }
  }

  const [theme, setTheme] = useState(readTheme());
  const [trucks, dispatch] = useReducer(trucksReducer, [], () => {
    const ls = safeRead(LS_TRUCKS, null);
    return Array.isArray(ls) ? ls : buildInitialTrucks();
  });

  const [savedViews, setSavedViews] = useState(() => safeRead(LS_FILTERS, []));
  const [pageSize, setPageSize] = useState(() => {
    const ps = Number(localStorage.getItem(LS_PAGESIZE));
    return [10, 20, 30, 50, 100].includes(ps) ? ps : 20;
  });

  const [rawFilter, setRawFilter] = useState({
    status: "All",
    origin: "All",
    destination: "All",
    priority: "All",
    search: "",
  });
  const debouncedSearch = useDebouncedValue(rawFilter.search, 300);
  const filter = { ...rawFilter, search: debouncedSearch };

  // selection
  const [selected, setSelected] = useState(() => new Set());

  // file refs
  const importJsonRef = useRef(null);
  const importCsvRef = useRef(null);
  const searchRef = useRef(null);

  // periodic tick (progress refresh)
  useEffect(() => {
    const id = setInterval(() => {
      // small nudge to recompute derived values
      dispatch({ type: ACTIONS.MAP, mapper: (t) => ({ ...t }) });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // persist trucks/theme/pageSize (debounced for trucks)
  useEffect(() => {
    const id = setTimeout(() => safeWrite(LS_TRUCKS, trucks), 300);
    return () => clearTimeout(id);
  }, [trucks]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_THEME, theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_PAGESIZE, String(pageSize));
    } catch {}
  }, [pageSize]);

  // ---------- Derived ----------
  const enriched = useMemo(() => {
    const ts = now().getTime();
    return trucks.map((t) => {
      const utilPct = t.pkgCapacity ? Math.min(100, Math.round((t.pkgCount / t.pkgCapacity) * 100)) : 0;
      let progressPct = 0;
      let isDelayed = false;
      if (t.departAt && t.eta) {
        const dep = new Date(t.departAt).getTime();
        const eta = new Date(t.eta).getTime();
        const pct = ((ts - dep) / (eta - dep)) * 100;
        progressPct = Number.isFinite(pct) ? clamp(Math.round(pct), 0, 100) : 0;
        isDelayed = t.status === "En Route" && ts > eta;
      }
      const slaBreach = t.apptAt && t.eta
        ? new Date(t.eta).getTime() > new Date(t.apptAt).getTime()
        : false;
      const riskLowUtil = (t.status === "En Route" || t.status === "Loading") && utilPct < 20;
      const riskHighUtil = utilPct > 95;
      return { ...t, utilPct, progressPct, isDelayed, slaBreach, riskLowUtil, riskHighUtil };
    });
  }, [trucks]);

  const filtered = useMemo(() => {
    const s = filter.search.trim().toLowerCase();
    return enriched.filter((t) => {
      if (filter.status !== "All" && t.status !== filter.status) return false;
      if (filter.origin !== "All" && t.origin !== filter.origin) return false;
      if (filter.destination !== "All" && t.destination !== filter.destination) return false;
      if (filter.priority !== "All" && t.priority !== filter.priority) return false;
      if (
        s &&
        ![t.id, t.trailerId, t.driver, t.origin, t.destination, t.notes]
          .join(" ")
          .toLowerCase()
          .includes(s)
      )
        return false;
      return true;
    });
  }, [enriched, filter]);

  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const vA = a[sortKey];
      const vB = b[sortKey];

      const coerce = (v) => {
        if (typeof v === "number") return { t: 0, v };
        if (isDateLike(v)) return { t: 1, v: Date.parse(v) };
        return { t: 2, v: String(v || "").toLowerCase() };
      };

      const A = coerce(vA);
      const B = coerce(vB);
      if (A.t !== B.t) return A.t - B.t;
      if (A.v < B.v) return sortDir === "asc" ? -1 : 1;
      if (A.v > B.v) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  // clamp page when filters/sort/pageSize change
  useEffect(() => {
    setPage((p) => clamp(p, 1, Math.max(1, Math.ceil(sorted.length / pageSize))));
  }, [sorted.length, pageSize]);

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const kpis = useMemo(() => {
    const total = enriched.length;
    const enRoute = enriched.filter((t) => t.status === "En Route").length;
    const yard = enriched.filter((t) => t.status === "In Yard").length;
    const loading = enriched.filter((t) => t.status === "Loading").length;
    const maintenance = enriched.filter((t) => t.status === "Maintenance").length;
    const delayed = enriched.filter((t) => t.isDelayed).length;
    const onTimePct = enRoute ? Math.round(((enRoute - delayed) / enRoute) * 100) : 100;
    const totalPkgs = enriched.reduce((a, b) => a + (b.pkgCount || 0), 0);
    const totalCap = enriched.reduce((a, b) => a + (b.pkgCapacity || 0), 0);
    const fleetUtil = totalCap ? Math.round((totalPkgs / totalCap) * 100) : 0;
    const slaRisk = enriched.filter((t) => t.slaBreach).length;
    return { total, enRoute, yard, loading, maintenance, delayed, onTimePct, fleetUtil, slaRisk };
  }, [enriched]);

  const alerts = useMemo(() => {
    const delayed = enriched.filter((t) => t.isDelayed);
    const sla = enriched.filter((t) => t.slaBreach);
    const highUtil = enriched.filter((t) => t.riskHighUtil);
    const lowUtil = enriched.filter((t) => t.riskLowUtil);
    return { delayed, sla, highUtil, lowUtil };
  }, [enriched]);

  // ---------- JSON Export/Import ----------
  const exportJSON = useCallback(() => {
    const data = JSON.stringify(
      { warehouses, trucks, meta: { exportedAt: toISO(now()) } },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [trucks, warehouses]);

  const handleImportJSON = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed.trucks)) {
          dispatch({ type: ACTIONS.SET_ALL, trucks: parsed.trucks });
          setPage(1);
          setSelected(new Set());
        } else {
          alert("Invalid JSON: trucks[] missing.");
        }
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    // reset input so same file can be re-imported
    e.target.value = "";
  }, []);

  // ---------- CSV Export/Import ----------
  const CSV_HEADERS = [
    "id",
    "trailerId",
    "status",
    "origin",
    "destination",
    "distanceMi",
    "speedMph",
    "departAt",
    "eta",
    "priority",
    "driver",
    "pkgCount",
    "pkgCapacity",
    "apptAt",
    "notes",
  ];

  const toCsv = useCallback((rows) => {
    const escape = (v) => {
      const s = (v ?? "").toString().replace(/"/g, '""');
      return `"${s}"`;
    };
    const body = rows
      .map((t) => CSV_HEADERS.map((h) => escape(t[h])).join(","))
      .join("\n");
    return `${CSV_HEADERS.join(",")}\n${body}`;
  }, []);

  const exportCSV = useCallback(() => {
    const csv = toCsv(sorted);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [sorted, toCsv]);

  const parseCsv = (text) => {
    // robust quoted CSV parse (no regex; handles CRLF and quotes)
    const lines = text.split(/\r?\n/);
    if (!lines.length) return [];
    const readRow = (line) => {
      const cells = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQ = !inQ;
          }
        } else if (ch === "," && !inQ) {
          cells.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      cells.push(cur);
      return cells.map((c) => c.replace(/^"|"$/g, ""));
    };

    const headerCells = readRow(lines[0]).map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const vals = readRow(line);
      const obj = {};
      headerCells.forEach((h, idx) => (obj[h] = vals[idx]));
      ["distanceMi", "speedMph", "pkgCount", "pkgCapacity"].forEach((k) => {
        if (obj[k] !== undefined) obj[k] = Number(obj[k]) || 0;
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleImportCSV = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rawRows = parseCsv(reader.result);
        if (!rawRows.length) return alert("Empty CSV.");
        const merged = rawRows.map((r) => ({
          id: r.id || `T-${uid()}`,
          trailerId: r.trailerId || `TRL-${uid()}`,
          status: statuses.includes(r.status) ? r.status : "In Yard",
          origin: r.origin || "Seattle, WA",
          destination: r.destination || r.origin || "Seattle, WA",
          distanceMi: Number(r.distanceMi) || 0,
          speedMph: Number(r.speedMph) || 60,
          departAt: r.departAt || "",
          eta: r.eta || "",
          lastUpdate: toISO(now()),
          priority: priorities.includes(r.priority) ? r.priority : "Normal",
          driver: r.driver || `Driver ${uid()}`,
          notes: r.notes || "",
          pkgCount: Number(r.pkgCount) || 0,
          pkgCapacity: Number(r.pkgCapacity) || 1600,
          apptAt: r.apptAt || "",
        }));
        dispatch({ type: ACTIONS.SET_ALL, trucks: merged });
        setPage(1);
        setSelected(new Set());
      } catch {
        alert("Invalid CSV.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // ---------- Actions ----------
  const setStatus = useCallback((id, status) => {
    dispatch({ type: ACTIONS.PATCH_ONE, id, patch: { status, lastUpdate: toISO(now()) } });
  }, []);

  const delayMinutes = useCallback((id, minutes) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id && t.eta
          ? {
              ...t,
              eta: toISO(new Date(new Date(t.eta).getTime() + minutes * 60000)),
              notes: `${t.notes || ""}${t.notes ? " " : ""}[Auto] Delay +${minutes}m`,
              lastUpdate: toISO(now()),
            }
          : t,
    });
  }, []);

  const arrive = useCallback((id) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? {
              ...t,
              status: "In Yard",
              origin: t.destination,
              destination: t.destination,
              departAt: "",
              eta: "",
              lastUpdate: toISO(now()),
              notes: `${t.notes || ""}${t.notes ? " " : ""}[Auto] Arrived`,
            }
          : t,
    });
  }, []);

  const toggleMaintenance = useCallback((id) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "Maintenance" ? "In Yard" : "Maintenance",
              departAt: t.status === "Maintenance" ? t.departAt : "",
              eta: t.status === "Maintenance" ? t.eta : "",
              lastUpdate: toISO(now()),
            }
          : t,
    });
  }, []);

  const dispatchTrip = useCallback(
    (id, origin, destination, departAtISO, speed = 60) => {
      const o = warehouses.find((w) => w.id === origin);
      const d = warehouses.find((w) => w.id === destination);
      if (!o || !d || o.id === d.id) return;
      const mi = Math.round(distMi(o, d));
      const depart = new Date(departAtISO || now());
      const hours = Math.max(2, Math.round(mi / speed));
      const eta = new Date(depart);
      eta.setHours(eta.getHours() + hours);
      dispatch({
        type: ACTIONS.MAP,
        mapper: (t) =>
          t.id === id
            ? {
                ...t,
                status: "En Route",
                origin: o.id,
                destination: d.id,
                distanceMi: mi,
                speedMph: speed,
                departAt: toISO(depart),
                eta: toISO(eta),
                lastUpdate: toISO(now()),
                notes: `${t.notes || ""}${t.notes ? " " : ""}[Auto] Dispatched ${o.id} → ${d.id}`,
              }
            : t,
      });
    },
    [warehouses]
  );

  const loadPkgs = useCallback((id, qty = 100) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? {
              ...t,
              pkgCount: Math.min(t.pkgCapacity, (t.pkgCount || 0) + qty),
              lastUpdate: toISO(now()),
            }
          : t,
    });
  }, []);

  const unloadPkgs = useCallback((id, qty = 100) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? { ...t, pkgCount: Math.max(0, (t.pkgCount || 0) - qty), lastUpdate: toISO(now()) }
          : t,
    });
  }, []);

  const fuelStop = useCallback((id) => delayMinutes(id, 30), [delayMinutes]);

  const breakdown = useCallback((id) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? {
              ...t,
              status: "Maintenance",
              lastUpdate: toISO(now()),
              notes: `${t.notes || ""}${t.notes ? " " : ""}[Auto] Roadside breakdown`,
            }
          : t,
    });
  }, []);

  const resumeFromMaintenance = useCallback((id) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? {
              ...t,
              status: "In Yard",
              departAt: "",
              eta: "",
              lastUpdate: toISO(now()),
              notes: `${t.notes || ""}${t.notes ? " " : ""}[Auto] Returned to service`,
            }
          : t,
    });
  }, []);

  const speedAdjust = useCallback((id, delta) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) => (t.id === id ? { ...t, speedMph: clamp((t.speedMph || 60) + delta, 35, 75) } : t),
    });
  }, []);

  const setPriorityOne = useCallback((id) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) => (t.id === id ? { ...t, priority: cycle(priorities, t.priority) } : t),
    });
  }, []);

  const addNote = useCallback((id, text) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? { ...t, notes: `${t.notes ? t.notes + " | " : ""}${text}`, lastUpdate: toISO(now()) }
          : t,
    });
  }, []);

  const cancelTrip = useCallback((id) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? {
              ...t,
              status: "In Yard",
              destination: t.origin,
              departAt: "",
              eta: "",
              lastUpdate: toISO(now()),
              notes: `${t.notes || ""}${t.notes ? " " : ""}[Auto] Trip canceled`,
            }
          : t,
    });
  }, []);

  const startLoading = useCallback((id) => setStatus(id, "Loading"), [setStatus]);
  const startUnloading = useCallback((id) => setStatus(id, "Unloading"), [setStatus]);

  const finishLoadingAndDispatch = useCallback(
    (id) => {
      const t = trucks.find((x) => x.id === id);
      if (!t) return;
      let destination = randomFrom(warehouses).id;
      while (destination === (t.origin || destination)) destination = randomFrom(warehouses).id;
      dispatchTrip(id, t.origin || destination, destination, now(), t.speedMph || 60);
    },
    [trucks, warehouses, dispatchTrip]
  );

  const trailerSwap = useCallback((id) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id ? { ...t, trailerId: `TRL-${1000 + Math.floor(Math.random() * 999)}` } : t,
    });
  }, []);

  const holdAtNextYard = useCallback((id) => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) =>
        t.id === id
          ? { ...t, priority: "Normal", notes: `${t.notes || ""}${t.notes ? " " : ""}[Auto] Hold at next yard` }
          : t,
    });
  }, []);

  const manualETA = useCallback((id) => {
    const input = prompt("Set ETA (ISO or yyyy-mm-dd hh:mm):", "");
    if (!input) return;
    const d = new Date(input);
    if (isNaN(d.getTime())) return alert("Invalid date.");
    dispatch({ type: ACTIONS.PATCH_ONE, id, patch: { eta: toISO(d), lastUpdate: toISO(now()) } });
  }, []);

  const setAppointment = useCallback((id) => {
    const input = prompt("Set Appointment (ISO or yyyy-mm-dd hh:mm):", "");
    if (!input) return;
    const d = new Date(input);
    if (isNaN(d.getTime())) return alert("Invalid date.");
    dispatch({ type: ACTIONS.PATCH_ONE, id, patch: { apptAt: toISO(d), lastUpdate: toISO(now()) } });
  }, []);

  const clearAppointment = useCallback((id) => {
    dispatch({ type: ACTIONS.PATCH_ONE, id, patch: { apptAt: "", lastUpdate: toISO(now()) } });
  }, []);

  const quickDispatchFromYard = useCallback(
    (id) => {
      const t = trucks.find((x) => x.id === id);
      if (!t) return;
      const origin = t.origin || randomFrom(warehouses).id;
      let destination = randomFrom(warehouses).id;
      while (destination === origin) destination = randomFrom(warehouses).id;
      dispatchTrip(id, origin, destination, now(), t.speedMph || 60);
    },
    [trucks, warehouses, dispatchTrip]
  );

  const advanceOneHour = useCallback(() => {
    dispatch({
      type: ACTIONS.MAP,
      mapper: (t) => {
        if (!t.eta) return t;
        const eta = new Date(t.eta).getTime() - 60 * 60 * 1000;
        return { ...t, eta: toISO(new Date(eta)) };
      },
    });
  }, []);

  // ---------- Bulk Actions ----------
  const withSelected = useCallback(
    (fn) => {
      if (selected.size === 0) return alert("No rows selected.");
      fn(Array.from(selected));
    },
    [selected]
  );

  const bulkDelay = useCallback((mins) => withSelected((ids) => ids.forEach((id) => delayMinutes(id, mins))), [withSelected, delayMinutes]);
  const bulkMaintenance = useCallback(() => withSelected((ids) => ids.forEach((id) => toggleMaintenance(id))), [withSelected, toggleMaintenance]);
  const bulkDispatch = useCallback(() => withSelected((ids) => {
    ids.forEach((id) => {
      const t = trucks.find((x) => x.id === id);
      if (!t) return;
      const origin = t.origin || randomFrom(warehouses).id;
      let destination = randomFrom(warehouses).id;
      while (destination === origin) destination = randomFrom(warehouses).id;
      dispatchTrip(id, origin, destination, now(), t.speedMph || 60);
    });
  }), [withSelected, trucks, warehouses, dispatchTrip]);

  const bulkPriority = useCallback(() => withSelected((ids) => ids.forEach((id) => setPriorityOne(id))), [withSelected, setPriorityOne]);
  const bulkLoad = useCallback((qty) => withSelected((ids) => ids.forEach((id) => loadPkgs(id, qty))), [withSelected, loadPkgs]);
  const bulkUnload = useCallback((qty) => withSelected((ids) => ids.forEach((id) => unloadPkgs(id, qty))), [withSelected, unloadPkgs]);

  // ---------- Saved Views ----------
  const saveViewsLS = (views) => safeWrite(LS_FILTERS, views);

  const saveCurrentView = useCallback(() => {
    const name = prompt("Name this view:");
    if (!name) return;
    const next = [...savedViews.filter((v) => v.name !== name), { name, filter: rawFilter }];
    setSavedViews(next);
    saveViewsLS(next);
  }, [savedViews, rawFilter]);

  const applyView = useCallback((name) => {
    const v = savedViews.find((x) => x.name === name);
    if (!v) return;
    setRawFilter(v.filter);
    setPage(1);
  }, [savedViews]);

  const deleteView = useCallback((name) => {
    const next = savedViews.filter((v) => v.name !== name);
    setSavedViews(next);
    saveViewsLS(next);
  }, [savedViews]);

  // ---------- Selection helpers ----------
  const toggleRow = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAllPage = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      pageData.forEach((t) => next.add(t.id));
      return next;
    });
  }, [pageData]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectAllFiltered = useCallback(() => {
    setSelected(new Set(filtered.map((t) => t.id)));
  }, [filtered]);

  // ---------- Sorting ----------
  const clickSort = useCallback((key) => {
    setSortKey((cur) => {
      if (cur === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return cur;
      } else {
        setSortDir("asc");
        return key;
      }
    });
    setPage(1);
  }, []);

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "a") {
        e.preventDefault();
        advanceOneHour();
      } else if (e.key === "t") {
        e.preventDefault();
        setTheme((t) => (t === "dark" ? "light" : "dark"));
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advanceOneHour]);

  // ---------- Styles ----------
  const isLight = theme === "light";
  const styles = {
    page: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      background: isLight ? "#f6f7fb" : "#0b1220",
      color: isLight ? "#121621" : "#eaf1ff",
      minHeight: "100vh",
      padding: 16,
    },
    container: { maxWidth: 1320, margin: "0 auto", display: "grid", gap: 12 },
    headerRow: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
    },
    title: { fontSize: 22, fontWeight: 800 },
    controls: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    kpis: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10 },
    kpiCard: {
      background: isLight ? "white" : "rgba(255,255,255,0.04)",
      border: `1px solid ${isLight ? "#e9ecf3" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 12,
      padding: 12,
      textAlign: "center",
    },
    kpiLabel: { fontSize: 12, opacity: 0.8 },
    kpiValue: { fontSize: 20, fontWeight: 800 },
    filters: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 10,
      alignItems: "center",
    },
    input: {
      background: isLight ? "white" : "rgba(255,255,255,0.06)",
      color: isLight ? "#121621" : "#eaf1ff",
      border: `1px solid ${isLight ? "#e1e6f0" : "rgba(255,255,255,0.15)"}`,
      borderRadius: 10,
      padding: "10px 12px",
      outline: "none",
      width: "100%",
    },
    button: {
      borderRadius: 10,
      padding: "10px 14px",
      border: `1px solid ${isLight ? "#dfe6f2" : "rgba(255,255,255,0.18)"}`,
      background: isLight ? "#ffffff" : "rgba(255,255,255,0.06)",
      color: isLight ? "#121621" : "#eaf1ff",
      cursor: "pointer",
    },
    buttonPrimary: {
      borderRadius: 10,
      padding: "10px 14px",
      border: isLight ? "1px solid #7aa4ff" : "1px solid rgba(99,138,255,0.5)",
      background: isLight
        ? "linear-gradient(180deg, #a8c3ff, #87abff)"
        : "linear-gradient(180deg, rgba(108,142,255,0.55), rgba(108,142,255,0.35))",
      color: isLight ? "white" : "#0b1220",
      fontWeight: 700,
      cursor: "pointer",
    },
    card: {
      background: isLight ? "white" : "rgba(255,255,255,0.04)",
      border: `1px solid ${isLight ? "#e9ecf3" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 12,
    },
    tableCard: {
      background: isLight ? "white" : "rgba(255,255,255,0.04)",
      border: `1px solid ${isLight ? "#e9ecf3" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 14,
      overflow: "hidden",
    },
    tableHead: {
      display: "grid",
      gridTemplateColumns:
        "36px 92px 98px 108px 160px 160px 86px 110px 110px 120px 120px 180px",
      gap: 8,
      padding: "10px 12px",
      fontSize: 12,
      fontWeight: 700,
      background: isLight ? "#f2f5fb" : "rgba(255,255,255,0.04)",
      borderBottom: `1px solid ${isLight ? "#e6ebf5" : "rgba(255,255,255,0.08)"}`,
    },
    row: {
      display: "grid",
      gridTemplateColumns:
        "36px 92px 98px 108px 160px 160px 86px 110px 110px 120px 120px 180px",
      gap: 8,
      padding: "10px 12px",
      borderBottom: `1px solid ${isLight ? "#eef2fa" : "rgba(255,255,255,0.06)"}`,
      alignItems: "center",
    },
    small: { fontSize: 12, opacity: 0.85 },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 8px",
      fontSize: 11,
      borderRadius: 999,
      border: `1px solid ${isLight ? "#e2e8f3" : "rgba(255,255,255,0.14)"}`,
      background: isLight ? "#f6f9ff" : "rgba(255,255,255,0.06)",
    },
    badgeWarn: {
      padding: "4px 8px",
      fontSize: 11,
      borderRadius: 999,
      border: isLight ? "1px solid #ffd175" : "1px solid rgba(255,190,90,0.45)",
      background: isLight ? "#fff2d9" : "rgba(255,190,90,0.15)",
      color: isLight ? "#8a5b00" : "#ffdfae",
    },
    badgeDanger: {
      padding: "4px 8px",
      fontSize: 11,
      borderRadius: 999,
      border: isLight ? "1px solid #ff9b9b" : "1px solid rgba(255,120,120,0.55)",
      background: isLight ? "#ffe5e5" : "rgba(255,120,120,0.18)",
      color: isLight ? "#7c0000" : "#ffc7c7",
    },
    progressWrap: {
      width: "100%",
      height: 8,
      background: isLight ? "#edf2fb" : "rgba(255,255,255,0.08)",
      borderRadius: 999,
      overflow: "hidden",
      marginTop: 6,
    },
    progressBar: (pct) => ({
      width: `${pct}%`,
      height: "100%",
      background: isLight
        ? "linear-gradient(90deg, #8bb6ff, #b8d0ff)"
        : "linear-gradient(90deg, rgba(118,180,255,0.8), rgba(118,180,255,0.4))",
    }),
    pkgBarWrap: {
      width: "100%",
      height: 8,
      background: isLight ? "#edf7f3" : "rgba(255,255,255,0.08)",
      borderRadius: 999,
      overflow: "hidden",
      marginTop: 4,
    },
    pkgBar: (pct) => ({
      width: `${pct}%`,
      height: "100%",
      background: isLight
        ? "linear-gradient(90deg, #8ee1bf, #b9f1db)"
        : "linear-gradient(90deg, rgba(140,255,210,0.8), rgba(140,255,210,0.4))",
    }),
    actionsCol: { display: "flex", gap: 6, flexWrap: "wrap" },
    alertsWrap: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
    alertCard: {
      background: isLight ? "white" : "rgba(255,255,255,0.04)",
      border: `1px solid ${isLight ? "#ffe0e0" : "rgba(255,120,120,0.35)"}`,
      borderRadius: 12,
      padding: 10,
    },
    alertTitle: { fontWeight: 800, marginBottom: 6, display: "flex", gap: 8, alignItems: "center" },
    link: { textDecoration: "underline", cursor: "pointer", fontSize: 12 },
    pagination: { display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" },
    checkbox: { width: 16, height: 16 },
    fileInputHidden: { display: "none" },
    viewPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${isLight ? "#dfe6f2" : "rgba(255,255,255,0.18)"}`,
      background: isLight ? "#fff" : "rgba(255,255,255,0.06)",
      fontSize: 12,
      cursor: "pointer",
    },
  };

  // ---------- Quick filter used in Alerts ----------
  const showEnRouteToday = useCallback(() => {
    setRawFilter((f) => ({ ...f, status: "En Route" }));
    setPage(1);
  }, []);

  // ---------- Render ----------
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div style={styles.title}>Long-Haul Fleet Board</div>
          <div style={styles.controls}>
            <button style={styles.buttonPrimary} onClick={advanceOneHour} title="Keyboard: 'a'">
              Advance +1h (simulate)
            </button>
            <button
              style={styles.button}
              onClick={() => dispatch({ type: ACTIONS.SET_ALL, trucks: buildInitialTrucks() })}
              title="Re-seed with new random routes"
            >
              Re-seed Fleet
            </button>
            <button style={styles.button} onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} title="Keyboard: 't'">
              Toggle Theme
            </button>
            <button style={styles.button} onClick={exportJSON}>
              Export JSON
            </button>
            <button style={styles.button} onClick={exportCSV}>
              Export CSV
            </button>
            <button style={styles.button} onClick={() => importJsonRef.current?.click()}>
              Import JSON
            </button>
            <input
              ref={importJsonRef}
              type="file"
              accept="application/json"
              style={styles.fileInputHidden}
              onChange={handleImportJSON}
            />
            <button style={styles.button} onClick={() => importCsvRef.current?.click()}>
              Import CSV
            </button>
            <input
              ref={importCsvRef}
              type="file"
              accept=".csv,text/csv"
              style={styles.fileInputHidden}
              onChange={handleImportCSV}
            />
          </div>
        </div>

        {/* KPIs */}
        <div style={styles.kpis}>
          <div style={styles.kpiCard}><div style={styles.kpiLabel}>Total</div><div style={styles.kpiValue}>{kpis.total}</div></div>
          <div style={styles.kpiCard}><div style={styles.kpiLabel}>En Route</div><div style={styles.kpiValue}>{kpis.enRoute}</div></div>
          <div style={styles.kpiCard}><div style={styles.kpiLabel}>Delayed</div><div style={styles.kpiValue}>{kpis.delayed}</div></div>
          <div style={styles.kpiCard}><div style={styles.kpiLabel}>In Yard</div><div style={styles.kpiValue}>{kpis.yard}</div></div>
          <div style={styles.kpiCard}><div style={styles.kpiLabel}>Loading</div><div style={styles.kpiValue}>{kpis.loading}</div></div>
          <div style={styles.kpiCard}><div style={styles.kpiLabel}>On-Time %</div><div style={styles.kpiValue}>{kpis.onTimePct}%</div></div>
          <div style={styles.kpiCard}><div style={styles.kpiLabel}>Fleet Util%</div><div style={styles.kpiValue}>{kpis.fleetUtil}%</div></div>
          <div style={styles.kpiCard}><div style={styles.kpiLabel}>SLA Risk</div><div style={styles.kpiValue}>{kpis.slaRisk}</div></div>
        </div>

        {/* Alerts */}
        <div style={styles.alertsWrap}>
          <div style={styles.alertCard}>
            <div style={styles.alertTitle}>
              <span style={styles.badgeDanger}>Delayed</span><span>{alerts.delayed.length}</span>
            </div>
            <div style={styles.small}>
              Trucks past ETA.{" "}
              <span style={styles.link} onClick={showEnRouteToday}>
                Filter En Route
              </span>
            </div>
          </div>
          <div style={styles.alertCard}>
            <div style={styles.alertTitle}>
              <span style={styles.badgeWarn}>SLA Risk</span><span>{alerts.sla.length}</span>
            </div>
            <div style={styles.small}>ETA beyond Appointment window.</div>
          </div>
          <div style={styles.alertCard}>
            <div style={styles.alertTitle}>
              <span style={styles.badge}>High Util (&gt;95%)</span>
              <span>{alerts.highUtil.length}</span>
            </div>
            <div style={styles.small}>Consider unload/split at next yard.</div>
          </div>
          <div style={styles.alertCard}>
            <div style={styles.alertTitle}>
              <span style={styles.badge}>Low Util (&lt;20%)</span>
              <span>{alerts.lowUtil.length}</span>
            </div>
            <div style={styles.small}>Consider consolidation on route.</div>
          </div>
        </div>

        {/* Filters + Saved views */}
        <div style={styles.filters}>
          <select
            style={styles.input}
            value={rawFilter.status}
            onChange={(e) => {
              setRawFilter((f) => ({ ...f, status: e.target.value }));
              setPage(1);
            }}
            title="Status"
          >
            {["All", ...statuses].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            style={styles.input}
            value={rawFilter.origin}
            onChange={(e) => {
              setRawFilter((f) => ({ ...f, origin: e.target.value }));
              setPage(1);
            }}
            title="Origin"
          >
            <option>All</option>
            {warehouses.map((w) => (
              <option key={w.id}>{w.id}</option>
            ))}
          </select>

          <select
            style={styles.input}
            value={rawFilter.destination}
            onChange={(e) => {
              setRawFilter((f) => ({ ...f, destination: e.target.value }));
              setPage(1);
            }}
            title="Destination"
          >
            <option>All</option>
            {warehouses.map((w) => (
              <option key={w.id}>{w.id}</option>
            ))}
          </select>

          <select
            style={styles.input}
            value={rawFilter.priority}
            onChange={(e) => {
              setRawFilter((f) => ({ ...f, priority: e.target.value }));
              setPage(1);
            }}
            title="Priority"
          >
            {["All", ...priorities].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <input
            ref={searchRef}
            style={styles.input}
            placeholder="Search (truck, trailer, driver, notes, city)…"
            value={rawFilter.search}
            onChange={(e) => {
              setRawFilter((f) => ({ ...f, search: e.target.value }));
              setPage(1);
            }}
            title="Press '/' to focus"
          />

          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button style={styles.button} onClick={saveCurrentView}>Save View</button>
            <button
              style={styles.button}
              onClick={() => {
                setRawFilter({ status: "All", origin: "All", destination: "All", priority: "All", search: "" });
                setPage(1);
              }}
            >
              Clear Filters
            </button>
            {savedViews.map((v) => (
              <span key={v.name} style={styles.viewPill}>
                <span onClick={() => applyView(v.name)} title="Apply view">{v.name}</span>
                <span
                  onClick={() => deleteView(v.name)}
                  title="Delete view"
                  style={{ cursor: "pointer", paddingLeft: 6 }}
                >
                  ×
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Bulk actions bar */}
        <div style={{ ...styles.card, padding: 10, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <strong>Bulk Actions</strong>
          <button style={styles.button} onClick={() => bulkDelay(60)}>+1h Delay</button>
          <button style={styles.button} onClick={() => bulkDelay(15)}>+15m Delay</button>
          <button style={styles.button} onClick={bulkMaintenance}>Toggle Maintenance</button>
          <button style={styles.button} onClick={bulkDispatch}>Dispatch</button>
          <button style={styles.button} onClick={bulkPriority}>Cycle Priority</button>
          <button style={styles.button} onClick={() => bulkLoad(100)}>Load +100</button>
          <button style={styles.button} onClick={() => bulkUnload(100)}>Unload -100</button>
          <span style={styles.small}>Selected: {selected.size}</span>
          <button style={styles.button} onClick={clearSelection}>Clear</button>
          <button style={styles.button} onClick={selectAllPage}>Select Page</button>
          <button style={styles.button} onClick={selectAllFiltered}>Select All (filtered)</button>
        </div>

        {/* Table */}
        <div style={styles.tableCard}>
          <div style={styles.tableHead}>
            <div>
              <input
                style={styles.checkbox}
                type="checkbox"
                aria-label="Select all on page"
                checked={pageData.length > 0 && pageData.every((t) => selected.has(t.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    const next = new Set(selected);
                    pageData.forEach((t) => next.add(t.id));
                    setSelected(next);
                  } else {
                    const next = new Set(selected);
                    pageData.forEach((t) => next.delete(t.id));
                    setSelected(next);
                  }
                }}
              />
            </div>
            <HeaderCell label="Truck" onClick={() => clickSort("id")} sortKey={sortKey} colKey="id" sortDir={sortDir} />
            <HeaderCell label="Trailer" onClick={() => clickSort("trailerId")} sortKey={sortKey} colKey="trailerId" sortDir={sortDir} />
            <HeaderCell label="Status" onClick={() => clickSort("status")} sortKey={sortKey} colKey="status" sortDir={sortDir} />
            <HeaderCell label="Origin" onClick={() => clickSort("origin")} sortKey={sortKey} colKey="origin" sortDir={sortDir} />
            <HeaderCell label="Destination" onClick={() => clickSort("destination")} sortKey={sortKey} colKey="destination" sortDir={sortDir} />
            <HeaderCell label="Dist (mi)" onClick={() => clickSort("distanceMi")} sortKey={sortKey} colKey="distanceMi" sortDir={sortDir} />
            <HeaderCell label="Depart" onClick={() => clickSort("departAt")} sortKey={sortKey} colKey="departAt" sortDir={sortDir} />
            <HeaderCell label="ETA" onClick={() => clickSort("eta")} sortKey={sortKey} colKey="eta" sortDir={sortDir} />
            <HeaderCell label="Packages" onClick={() => clickSort("pkgCount")} sortKey={sortKey} colKey="pkgCount" sortDir={sortDir} />
            <HeaderCell label="Appt/SLA" onClick={() => clickSort("apptAt")} sortKey={sortKey} colKey="apptAt" sortDir={sortDir} />
            <div>Actions</div>
          </div>

          {pageData.map((t) => (
            <div key={t.id} style={styles.row}>
              {/* Select */}
              <div>
                <input
                  style={styles.checkbox}
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleRow(t.id)}
                />
              </div>

              {/* Truck */}
              <div>
                <div style={{ fontWeight: 800 }}>{t.id}</div>
                <div style={styles.small}>{t.driver}</div>
                <div style={styles.small}>Priority: {t.priority}</div>
              </div>

              {/* Trailer */}
              <div>{t.trailerId}</div>

              {/* Status + progress */}
              <div>
                <div style={t.isDelayed ? styles.badgeWarn : styles.badge}>
                  {t.isDelayed ? "Delayed" : t.status}
                </div>
                {t.status === "En Route" && (
                  <>
                    <div style={styles.progressWrap}>
                      <div style={styles.progressBar(t.progressPct)} />
                    </div>
                    <div style={styles.small}>{t.progressPct}%</div>
                  </>
                )}
              </div>

              {/* O/D & details */}
              <div>{t.origin || "-"}</div>
              <div>{t.destination || "-"}</div>
              <div>{t.distanceMi || "-"}</div>
              <div>{fmt(t.departAt)}</div>
              <div>{fmt(t.eta)}</div>

              {/* Packages */}
              <div>
                <div style={{ fontWeight: 700 }}>
                  {t.pkgCount ?? 0} / {t.pkgCapacity ?? 0}
                </div>
                <div style={styles.pkgBarWrap}>
                  <div style={styles.pkgBar(t.utilPct || 0)} />
                </div>
                <div style={styles.small}>Util: {t.utilPct || 0}%</div>
              </div>

              {/* Appointment / SLA */}
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={t.slaBreach ? styles.badgeDanger : styles.badge}>
                    Appt: {fmtDateShort(t.apptAt)}
                  </span>
                  {t.slaBreach && <span style={styles.badgeDanger}>SLA Breach</span>}
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button style={styles.button} onClick={() => setAppointment(t.id)}>
                    Set Appt
                  </button>
                  {t.apptAt && (
                    <button style={styles.button} onClick={() => clearAppointment(t.id)}>
                      Clear Appt
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={styles.actionsCol}>
                {t.status === "In Yard" && (
                  <button style={styles.buttonPrimary} onClick={() => quickDispatchFromYard(t.id)}>
                    Dispatch
                  </button>
                )}

                {t.status === "En Route" && (
                  <>
                    <button style={styles.button} onClick={() => arrive(t.id)}>Arrive</button>
                    <button style={styles.button} onClick={() => delayMinutes(t.id, 60)}>+1h Delay</button>
                    <button style={styles.button} onClick={() => fuelStop(t.id)}>Fuel +30m</button>
                    <button style={styles.button} onClick={() => manualETA(t.id)}>Set ETA</button>
                    <button style={styles.button} onClick={() => holdAtNextYard(t.id)}>Hold @ Yard</button>
                  </>
                )}

                <button style={styles.button} onClick={() => toggleMaintenance(t.id)}>
                  {t.status === "Maintenance" ? "Return to Yard" : "Maintenance"}
                </button>
                {t.status === "Maintenance" && (
                  <button style={styles.button} onClick={() => resumeFromMaintenance(t.id)}>
                    Resume
                  </button>
                )}

                <button style={styles.button} onClick={() => loadPkgs(t.id, 100)}>Load +100</button>
                <button style={styles.button} onClick={() => unloadPkgs(t.id, 100)}>Unload -100</button>
                <button style={styles.button} onClick={() => finishLoadingAndDispatch(t.id)}>Finish Load & Go</button>
                <button style={styles.button} onClick={() => speedAdjust(t.id, +5)}>Speed +5</button>
                <button style={styles.button} onClick={() => speedAdjust(t.id, -5)}>Speed -5</button>
                <button style={styles.button} onClick={() => setPriorityOne(t.id)}>Cycle Priority</button>
                <button style={styles.button} onClick={() => trailerSwap(t.id)}>Trailer Swap</button>
                <button
                  style={styles.button}
                  onClick={() => {
                    const text = prompt("Add a note:");
                    if (text) addNote(t.id, text);
                  }}
                >
                  Add Note
                </button>
                <button style={styles.button} onClick={() => cancelTrip(t.id)}>Cancel Trip</button>
              </div>
            </div>
          ))}

          {pageData.length === 0 && (
            <div style={{ padding: 16, opacity: 0.8 }}>No trucks match filters.</div>
          )}
        </div>

        {/* Pagination */}
        <div style={styles.pagination}>
          <span style={styles.small}>
            Page {page} / {totalPages} • Rows: {sorted.length}
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              style={styles.input}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
            <button style={styles.button} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <button style={styles.button} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small header cell with sort indicator */
function HeaderCell({ label, onClick, sortKey, colKey, sortDir }) {
  const active = sortKey === colKey;
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
      title="Click to sort"
    >
      <span>{label}</span>
      {active && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
    </div>
  );
}
