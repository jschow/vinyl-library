import { useEffect, useState } from "react";

const USERNAME = "jschow";            // change if needed
const START_FOLDER_ID = 0;            // 0 = "All"
const PER_PAGE = 100;                 // bigger pages => fewer requests (Discogs max is 100)

export default function App() {
  // We store items in a Map keyed by release id so duplicates don't appear when loading multiple pages
  const [byRelease, setByRelease] = useState(new Map());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);     // from Discogs pagination.pages
  const [totalItems, setTotalItems] = useState(null);     // from Discogs pagination.items
  const [folderId] = useState(START_FOLDER_ID);

  const [loading, setLoading] = useState(false);          // page fetch
  const [loadingAll, setLoadingAll] = useState(false);    // background “load all” fetch
  const [error, setError] = useState("");
  const [q, setQ] = useState("");                         // search query
  const [noMore, setNoMore] = useState(false);            // at or beyond last page

  // Convert Map -> array for rendering
  const items = Array.from(byRelease.values());

  // Normalize (ignore "The ", "A ", "An ")
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/^(the|a|an)\s+/, "");

  // Filter by artist or title, then sort by artist
  const filteredSorted = items
    .filter((x) =>
      (String(x.artists || "") + " " + String(x.title || ""))
        .toLowerCase()
        .includes(q.toLowerCase())
    )
    .sort((a, b) => norm(a.artists).localeCompare(norm(b.artists)));

  function addBatch(batch) {
    // Deduplicate by release id
    setByRelease((prev) => {
      const next = new Map(prev);
      for (const it of batch) {
        if (!next.has(it.id)) next.set(it.id, it);
      }
      return next;
    });
  }

  async function fetchPage(p) {
    const url = `http://localhost:5174/api/collection/${encodeURIComponent(
      USERNAME
    )}/${folderId}?per_page=${PER_PAGE}&page=${p}`;

    const res = await fetch(url);
    if (res.status === 404) {
      // Out of range => stop
      setNoMore(true);
      if (totalPages === null) setTotalPages(p - 1);
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    const pages = json?.pagination?.pages;
    const itemsCount = json?.pagination?.items;
    if (typeof pages === "number") setTotalPages(pages);
    if (typeof itemsCount === "number") setTotalItems(itemsCount);

    const batch = (json.releases || []).map((entry) => ({
      // Use Discogs release id to dedupe albums (if you own multiple copies,
      // switch this to `${entry.id}-${entry.instance_id}` to show each copy separately)
      id: entry.id,
      title: entry.basic_information?.title ?? "Unknown",
      year: entry.basic_information?.year ?? "",
      artists:
        entry.basic_information?.artists?.map((a) => a.name).join(", ") ??
        "Unknown",
      cover: entry.basic_information?.cover_image ?? "",
    }));

    addBatch(batch);

    // If this was the last page, mark noMore
    if (typeof pages === "number" && p >= pages) setNoMore(true);
  }

  // Load current page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await fetchPage(page);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, folderId, USERNAME]);

  // Load all remaining pages (used by button and auto-trigger on first search)
  async function loadAllRemaining() {
    if (loadingAll) return;
    if (totalPages && page >= totalPages) {
      setNoMore(true);
      return;
    }
    setLoadingAll(true);
    setError("");
    try {
      const last = totalPages ?? page; // if totalPages unknown, we'll discover it as we go
      // Start from next page; don't change `page` state to avoid double-fetch via useEffect
      let p = page + 1;
      // We loop conservatively; if totalPages is null at first, we'll stop when fetchPage marks noMore
      while (!noMore && (!totalPages || p <= totalPages)) {
        try {
          await fetchPage(p);
        } catch (e) {
          // If any page errors out (like network hiccup), break gracefully
          break;
        }
        // If we learned totalPages during the loop, clamp
        if (totalPages && p >= totalPages) break;
        p += 1;
      }
      setNoMore(true);
    } finally {
      setLoadingAll(false);
    }
  }

  // Auto-load all on first non-empty search so search covers entire library
  useEffect(() => {
    if (q && !loadingAll && !(totalPages && page >= totalPages)) {
      loadAllRemaining();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const atEnd =
    noMore || (typeof totalPages === "number" && page >= totalPages);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 12 }}>My Vinyl Library</h1>

      {/* Top controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <input
          type="text"
          placeholder="Search by artist or title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            padding: "8px",
            width: 320,
            maxWidth: "100%",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Loaded {items.length}
          {totalItems ? ` / ${totalItems}` : ""} •{" "}
          {totalPages ? `Page ${Math.min(page, totalPages)}/${totalPages}` : "Loading…"}
          {loadingAll ? " • loading all…" : ""}
        </div>
        {!atEnd && (
          <button
            onClick={loadAllRemaining}
            disabled={loadingAll}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
              cursor: loadingAll ? "not-allowed" : "pointer",
            }}
            title="Fetch the rest so search hits everything"
          >
            {loadingAll ? "Loading all…" : "Load all"}
          </button>
        )}
      </div>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
      {loading && page === 1 && <p>Loading…</p>}
      {!loading && filteredSorted.length === 0 && (
        <p>
          No results{q ? ` for “${q}”` : ""}.
          {!atEnd && " Try “Load all” to search your entire collection."}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {filteredSorted.map((x) => (
          <figure
            key={x.id}
            style={{
              margin: 0,
              padding: 10,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {x.cover ? (
              <img
                src={x.cover}
                alt={x.title}
                width={140}
                height={140}
                style={{ objectFit: "cover", borderRadius: 8 }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 8,
                  background: "#eee",
                }}
              />
            )}
            <figcaption
              style={{ marginTop: 8, fontSize: 12, textAlign: "center" }}
            >
              <strong>{x.artists}</strong>
              <br />
              {x.title} {x.year ? `(${x.year})` : ""}
            </figcaption>
          </figure>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || atEnd}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: loading || atEnd ? "not-allowed" : "pointer",
            opacity: loading || atEnd ? 0.6 : 1,
          }}
        >
          {atEnd ? "All loaded" : loading && page > 1 ? "Loading..." : "Load more"}
        </button>
      </div>
    </main>
  );
}
