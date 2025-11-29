import React, { useMemo, useState } from "react";

const sampleRestaurants = [
  {
    id: "r_001",
    name: "Saffron & Spice",
    cuisines: ["Indian", "Vegetarian"],
    rating: 4.7,
    reviews: 1280,
    priceTier: "$$",
    etaMinutes: [25],
    distanceKm: 2.1,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    isOpen: true,
  },
  {
    id: "r_002",
    name: "Umami Bowl",
    cuisines: ["Ramen", "Japanese"],
    rating: 4.5,
    reviews: 934,
    priceTier: "$$$",
    etaMinutes: [30],
    distanceKm: 3.7,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    isOpen: true,
  },
  {
    id: "r_003",
    name: "Green Garden",
    cuisines: ["Salads", "Healthy"],
    rating: 4.2,
    reviews: 402,
    priceTier: "$",
    etaMinutes: [15],
    distanceKm: 1.3,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    isOpen: true,
  },
  {
    id: "r_004",
    name: "La Piazza",
    cuisines: ["Pizza", "Italian"],
    rating: 4.8,
    reviews: 2210,
    priceTier: "$$",
    etaMinutes: [30],
    distanceKm: 0.9,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    isOpen: true,
  },
  {
    id: "r_005",
    name: "La Piazza",
    cuisines: ["Pizza", "Italian"],
    rating: 4.8,
    reviews: 2210,
    priceTier: "$$",
    etaMinutes: [30],
    distanceKm: 0.9,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    isOpen: true,
  },
  {
    id: "r_006",
    name: "La Piazza",
    cuisines: ["Pizza", "Italian"],
    rating: 4.8,
    reviews: 2210,
    priceTier: "$$",
    etaMinutes: [20],
    distanceKm: 0.9,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    isOpen: true,
  },
];

function StarRating({ rating }) {
  return <span>{rating.toFixed(1)}</span>;
}

const PRICE_TIER_ORDER = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };

export default function RestaurantGrid({
  restaurants = sampleRestaurants,
  onSelect,
}) {
  // ---------- Filters State ----------
  const [search, setSearch] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState(new Set());
  const [priceTier, setPriceTier] = useState("any"); // any | $ | $$ | $$$ | $$$$
  const [minRating, setMinRating] = useState(0); // 0..5
  const [maxEta, setMaxEta] = useState(""); // minutes, '' means no limit
  const [maxDistance, setMaxDistance] = useState(""); // km, '' means no limit
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState("top"); // top | eta | price | distance | name

  // ---------- Available Cuisines (from data) ----------
  const allCuisines = useMemo(() => {
    const set = new Set();
    restaurants.forEach((r) => r.cuisines.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [restaurants]);

  // ---------- Handlers ----------
  const toggleCuisine = (c) => {
    const next = new Set(selectedCuisines);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setSelectedCuisines(next);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCuisines(new Set());
    setPriceTier("any");
    setMinRating(0);
    setMaxEta("");
    setMaxDistance("");
    setOpenNow(false);
    setSortBy("top");
  };

  // ---------- Filter + Sort ----------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = restaurants.filter((r) => {
      // search on name + cuisines
      const inSearch =
        q.length === 0 ||
        r.name.toLowerCase().includes(q) ||
        r.cuisines.some((c) => c.toLowerCase().includes(q));

      // cuisines (if any selected, require intersection)
      const cuisineOk =
        selectedCuisines.size === 0 ||
        r.cuisines.some((c) => selectedCuisines.has(c));

      // price tier
      const priceOk = priceTier === "any" || r.priceTier === priceTier;

      // rating
      const ratingOk = r.rating >= Number(minRating || 0);

      // eta
      const etaVal = r.etaMinutes?.[0] ?? 0;
      const etaOk = !maxEta || etaVal <= Number(maxEta);

      // distance
      const distOk = !maxDistance || r.distanceKm <= Number(maxDistance);

      // open now
      const openOk = !openNow || r.isOpen;

      return inSearch && cuisineOk && priceOk && ratingOk && etaOk && distOk && openOk;
    });

    // sort
    list = [...list];
    switch (sortBy) {
      case "eta":
        list.sort((a, b) => (a.etaMinutes?.[0] ?? 0) - (b.etaMinutes?.[0] ?? 0));
        break;
      case "price":
        list.sort(
          (a, b) =>
            (PRICE_TIER_ORDER[a.priceTier] || 99) -
            (PRICE_TIER_ORDER[b.priceTier] || 99)
        );
        break;
      case "distance":
        list.sort((a, b) => a.distanceKm - b.distanceKm);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "top":
      default:
        // Sort by rating desc, then reviews desc
        list.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return (b.reviews || 0) - (a.reviews || 0);
        });
        break;
    }
    return list;
  }, [
    restaurants,
    search,
    selectedCuisines,
    priceTier,
    minRating,
    maxEta,
    maxDistance,
    openNow,
    sortBy,
  ]);

  return (
    <div>
      {/* Header */}
      <div>
        <div>
          <h2 className="component-header">Nearby restaurants</h2>
          <p>Handpicked places you might love</p>
        </div>

        {/* Filters */}
        <div className="grid-filter">
          {/* Search */}
          <input
            placeholder="Search cuisine, dish, or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="top">The Best</option>
            <option value="eta">Current ETA</option>
            <option value="distance">Close to Far Away</option>
            <option value="name">A to Z</option>
          </select>

          {/* Price Tier */}
          <select
            value={priceTier}
            onChange={(e) => setPriceTier(e.target.value)}
            aria-label="Price tier"
          >
            <option value="any">Price: Any</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>

          {/* Min Rating */}
          <label>
            Min rating
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            />
          </label>

          {/* Max ETA */}
          <label>
            Max ETA (min)
            <input
              type="number"
              min="0"
              step="5"
              value={maxEta}
              onChange={(e) => setMaxEta(e.target.value)}
            />
          </label>

          {/* Max Distance */}
          <label>
            Max distance (km)
            <input
              type="number"
              min="0"
              step="0.1"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
            />
          </label>

          {/* Open Now */}
          <label>
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
            />
            Open now
          </label>

          {/* Clear */}
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        {/* Cuisine checkboxes */}
        {allCuisines.length > 0 && (
          <div className="grid-filter">
            {allCuisines.map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={selectedCuisines.has(c)}
                  onChange={() => toggleCuisine(c)}
                />
                {c}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid-display">
        {filtered.map((r) => (
          <div className="restaurant-card" key={r.id} onClick={() => onSelect?.(r)}>
            <div>
              <img src={r.image} alt={r.name} />
              {!r.isOpen && <span>Closed</span>}
            </div>

            <div className="store-card-info">
              <div className="store-logic">
                <h3>{r.name}</h3>
              </div>

              <div className="store-logic">
                <StarRating rating={r.rating} />
                <span>{r.etaMinutes?.[0]} min</span>
                <span>{r.distanceKm.toFixed(1)} km</span>
              </div>

              <div className="store-logic">
                <span>{r.reviews.toLocaleString()} reviews</span>
              </div>

              <div className="store-logic">
                <span>{r.cuisines.join(" · ")}</span>
                <span>{r.priceTier}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div>
          <p>No restaurants found</p>
          <p>Try changing filters or searching for a different cuisine.</p>
        </div>
      )}
    </div>
  );
}
