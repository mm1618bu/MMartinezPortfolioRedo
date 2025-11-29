import React, { useMemo, useRef } from "react";

/**
 * RestaurantPage
 * - Mirrors marketplace layout: header, modes/metrics, sidebar, featured carousel, and Most Ordered list.
 * - Class names only (no inline styles). Pair with restaurant.css from earlier.
 */

const defaultStore = {
  name: "TD's Deli",
  openNow: true,
  dashPass: true,
  rating: 4.2,
  reviews: 200,
  distanceMi: 7.1,
  deliveryTimeMin: 59,
  priceTier: "$$",
  categories: ["Burgers", "Breakfast"],
  hours: { start: "10:00 am", end: "7:25 pm" },
};

const defaultFeatured = [
  {
    id: "i1",
    name: "Philly Cheesesteak",
    price: 10.99,
    image:
      "https://images.unsplash.com/photo-1601050690597-9f5aeeae0a43?q=80&w=1200&auto=format&fit=crop",
    likedBadge: "#1 Most liked",
    ratingText: "83% (18)",
  },
  {
    id: "i2",
    name: "Italian",
    price: 11.99,
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "i3",
    name: "Cheeseburger Sub",
    price: 10.99,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "i4",
    name: "Turkey",
    price: 11.99,
    image:
      "https://images.unsplash.com/photo-1568605115427-8d7cd88b5c5d?q=80&w=1200&auto=format&fit=crop",
  },
 
];

// New: Most Ordered list data
const defaultMostOrdered = [
  {
    id: "mo1",
    name: "Philly Cheesesteak",
    description:
      "Shredded Philly steak, onion, green pepper and cheese on a 12\" sub roll",
    price: 10.99,
    image:
      "https://images.unsplash.com/photo-1601050690597-9f5aeeae0a43?q=80&w=1200&auto=format&fit=crop",
    likedBadge: "#1 Most liked",
    ratingText: "83% (18)",
  },
  {
    id: "mo2",
    name: "Italian",
    description:
      "Boars Head Mortadella, Genoa Salami, Cappy Ham and Provolone cheese on a 12\" sub roll.",
    price: 11.99,
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "mo3",
    name: "Tuna",
    description: "Housemade tuna salad and cheese on a 12\" sub roll",
    price: 11.99,
    image:
      "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "mo4",
    name: "Cheeseburger Sub",
    description: "Cheeseburger and choice of cheese on a 12\" sub roll",
    price: 10.99,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "mo5",
    name: "Turkey",
    description:
      "Boar's Head ovengold turkey and choice of cheese on a 12\" sub roll",
    price: 11.99,
    image:
      "https://images.unsplash.com/photo-1568605115427-8d7cd88b5c5d?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "mo6",
    name: "Ham",
    description:
      "Boars Head deluxe ham and choice of cheese on a 12\" sub roll",
    price: 11.99,
    image:
      "https://images.unsplash.com/photo-1551445520-0d2d5b470b99?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "mo7",
    name: "Cowboy Burger",
    description:
      "6 oz beef burger, grilled onions, bacon, cheddar cheese and BBQ sauce on a bun",
    price: 8.99,
    image:
      "https://images.unsplash.com/photo-1551782450-17144c3a8f54?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "mo8",
    name: "Cole Slaw",
    description: "8 oz creamy cole slaw",
    price: 4.99,
    image:
      "https://images.unsplash.com/photo-1604900176126-67f2b3c2a78a?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "mo9",
    name: "Potato Salad",
    description: "8 oz classic potato salad",
    price: 4.99,
    image:
      "https://images.unsplash.com/photo-1505575972945-290b02123ef8?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "mo10",
    name: "Hangover Burger",
    description:
      "6 oz beef burger, fried egg, bacon and American cheese on a bun",
    price: 8.99,
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
  },
];

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

function ItemCard({ item, onAdd }) {
  return (
    <div className="item-card" role="group" aria-label={item.name}>
      <div className="item-media">
        <img src={item.image} alt={item.name} />
        <button className="item-add" aria-label={`Add ${item.name}`} onClick={() => onAdd?.(item)}>+</button>
      </div>
      <div className="item-body">
        <div className="item-name">{item.name}</div>
        <div className="item-price">${item.price.toFixed(2)}</div>
        {(item.ratingText || item.likedBadge) && (
          <div className="item-meta">
            {item.ratingText && <span className="item-rating">{item.ratingText}</span>}
            {item.likedBadge && <Badge>{item.likedBadge}</Badge>}
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedCarousel({ items, onAdd }) {
  const rowRef = useRef(null);
  const scrollBy = (dir) => {
    const node = rowRef.current;
    if (!node) return;
    const delta = Math.sign(dir) * (node.clientWidth * 0.9);
    node.scrollBy({ left: delta, behavior: "smooth" });
  };
  return (
    <section className="featured" aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="featured-header">Featured Items</h2>
      <div className="featured-row-wrap">
        <button className="carousel-btn prev" aria-label="Previous" onClick={() => scrollBy(-1)}>‹</button>
        <div className="featured-row" ref={rowRef}>
          {items.map((it) => (
            <ItemCard key={it.id} item={it} onAdd={onAdd} />
          ))}
        </div>
        <button className="carousel-btn next" aria-label="Next" onClick={() => scrollBy(1)}>›</button>
      </div>
    </section>
  );
}

// New: Most Ordered row-style card
function ItemRow({ item, onAdd }) {
  return (
    <div className="item-row" role="group" aria-label={item.name}>
      <div className="item-row-body">
        <div className="item-row-title">{item.name}</div>
        {item.description && <div className="item-row-desc">{item.description}</div>}
        <div className="item-row-price">${item.price.toFixed(2)}</div>
        {(item.ratingText || item.likedBadge) && (
          <div className="item-row-meta">
            {item.ratingText && <span className="item-rating">{item.ratingText}</span>}
            {item.likedBadge && <Badge>{item.likedBadge}</Badge>}
          </div>
        )}
      </div>
      <div className="item-row-media">
        <img src={item.image} alt={item.name} />
        <button className="item-add" aria-label={`Add ${item.name}`} onClick={() => onAdd?.(item)}>+</button>
      </div>
    </div>
  );
}

function MostOrdered({ items, onAdd }) {
  return (
    <section className="most-ordered" aria-labelledby="most-heading">
      <h2 id="most-heading" className="most-header">Most Ordered</h2>
      <p className="most-sub">The most commonly ordered items from this store</p>
      <div className="most-grid">
        {items.map((it) => (
          <ItemRow key={it.id} item={it} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}

export default function RestaurantPage({
  store = defaultStore,
  featured = defaultFeatured,
  mostOrdered = defaultMostOrdered,
}) {
  const categoryText = useMemo(() => store.categories?.join(", ") || "", [store.categories]);

  return (
    <div className="restaurant-page">
      {/* Top header bar */}
      <div className="rp-topbar">
        <h1 className="rp-title">{store.name}</h1>
        <div className="rp-search">
          <input type="text" placeholder={`Search ${store.name}`} aria-label="Search menu" />
        </div>
      </div>

      {/* Mode + metrics panel */}
      <div className="rp-mode-panel">
        <div className="rp-modes" role="tablist" aria-label="Order mode">
          <button role="tab" aria-selected="true" className="pill">Delivery</button>
          <button role="tab" aria-selected="false" className="pill">Pickup</button>
          <button role="tab" aria-selected="false" className="pill">Group Order</button>
        </div>
        <div className="rp-metrics">
          <Metric label="distance" value={`${store.distanceMi} mi away`} />
          <div className="metric-sep" />
          <Metric label="delivery time" value={`${store.deliveryTimeMin} min`} />
        </div>
      </div>

      <div className="rp-layout">
        {/* Sidebar */}
        <aside className="rp-sidebar">
          <div className="store-info">
            {store.dashPass && <div className="store-tag">DashPass</div>}
            <div className={"store-open " + (store.openNow ? "on" : "off")}>{store.openNow ? "Open now" : "Closed"}</div>
            <div className="store-rating">
              <span className="sr-val">{store.rating.toFixed(1)}</span>
              <span className="sr-rev">({store.reviews}+)</span>
              <span className="sr-dot">·</span>
              <span className="sr-dist">{store.distanceMi} mi</span>
            </div>
            <div className="store-cats">
              <span className="price-tier">{store.priceTier}</span>
              <span className="dot">·</span>
              <span>{categoryText}</span>
            </div>
            <button className="btn see-more" type="button">See More</button>
          </div>

          <nav className="menu-sections" aria-label="Menu sections">
            <div className="menu-time">Lunch / Dinner</div>
            <div className="menu-hours">{store.hours.start} – {store.hours.end}</div>
            <ul className="menu-links">
              <li className="active">Featured Items</li>
              <li>Reviews</li>
              <li>Most Ordered</li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="rp-main">
          <FeaturedCarousel items={featured} onAdd={(item) => console.log("add", item)} />
          <MostOrdered items={mostOrdered} onAdd={(item) => console.log("add", item)} />
        </main>
      </div>
    </div>
  );
}
