"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Category = { id: string; name: string; slug: string };

// Builds the shop address from the current search text and category.
// Example: /shop?q=speaker&category=speakers
function buildUrl(query: string, category: string) {
  const params = new URLSearchParams();
  const term = query.trim();
  if (term) params.set("q", term);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export default function ShopFilters({
  categories,
  initialQuery,
  activeCategory,
}: {
  categories: Category[];
  initialQuery: string;
  activeCategory: string; // the chosen category's slug, or "" for all
}) {
  const router = useRouter();

  // The text in the box lives here, so typing is instant and never lags.
  const [query, setQuery] = useState(initialQuery);

  // isPending is true while the server is fetching the new product list.
  const [isPending, startTransition] = useTransition();

  // Holds the "wait until the user stops typing" timer.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any waiting timer if the visitor leaves the page.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Asks the server for a new product list by changing the address.
  // replace (not push) so each keystroke does not fill the Back button history.
  function go(nextQuery: string, nextCategory: string) {
    startTransition(() => {
      router.replace(buildUrl(nextQuery, nextCategory), { scroll: false });
    });
  }

  // Runs on every keystroke: wait 300ms after the last key, then search.
  function onSearchChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(value, activeCategory), 300);
  }

  // Runs when a category button is clicked: switch immediately,
  // keeping whatever is typed in the search box.
  function onCategoryClick(slug: string) {
    if (timer.current) clearTimeout(timer.current);
    go(query, slug);
  }

  // Shared look for the category buttons; the chosen one is filled gold.
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "border-gold bg-gold text-background"
        : "border-line bg-surface hover:border-gold hover:text-gold-light"
    }`;

  return (
    <div className="mb-8 space-y-4">
      {/* Search box. The label is hidden visually but read by screen readers. */}
      <div>
        <label htmlFor="shop-search" className="sr-only">
          Search products
        </label>
        <input
          id="shop-search"
          type="search"
          value={query}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, brand, code or specification"
          autoComplete="off"
          className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-lg"
        />
        <p className="mt-1 h-5 text-xs text-muted" aria-live="polite">
          {isPending ? "Searching..." : ""}
        </p>
      </div>

      {/* One row of category buttons. On small screens the row scrolls sideways. */}
      <nav aria-label="Product categories">
        <ul className="flex gap-2 overflow-x-auto pb-2">
          <li>
            <button
              type="button"
              aria-pressed={activeCategory === ""}
              onClick={() => onCategoryClick("")}
              className={chip(activeCategory === "")}
            >
              All
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={activeCategory === c.slug}
                onClick={() => onCategoryClick(c.slug)}
                className={chip(activeCategory === c.slug)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}