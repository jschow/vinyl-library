import { useEffect, useState } from "react";

const USERNAME = "jschow";
const START_FOLDER_ID = 0;
const PER_PAGE = 100;

export default function App() {
  const [byRelease, setByRelease] = useState(new Map());
  const [page] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [totalItems, setTotalItems] = useState(null);
  const [folderId] = useState(START_FOLDER_ID);

  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");
  const [noMore, setNoMore] = useState(false);

  const items = Array.from(byRelease.values());

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/^(the|a|an)\s+/, "");

  const sorted = [...items].sort((a, b) =>
    norm(a.artists).localeCompare(norm(b.artists))
  );

  function addBatch(batch) {
    setByRelease((prev) => {
      const next = new Map(prev);
      for (const it of batch) {
        if (!next.has(it.id)) next.set(it.id, it);
      }
      return next;
    });
  }

  async function fetchPage(p) {
    const url = `/api/collection/${encodeURIComponent(
      USERNAME
    )}/${folderId}?per_page=${PER_PAGE}&page=${p}`;

    const res = await fetch(url);
    if (res.status === 404) {
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
      id: entry.id,
      title: entry.basic_information?.title ?? "Unknown",
      year: entry.basic_information?.year ?? "",
      artists:
        entry.basic_information?.artists?.map((a) => a.name).join(", ") ??
        "Unknown",
      cover: entry.basic_information?.cover_image ?? "",
    }));

    addBatch(batch);

    if (typeof pages === "number" && p >= pages) setNoMore(true);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await fetchPage(1);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId, USERNAME]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 12, textAlign: "center" }}>My Vinyl Library</h1>

      {error && <p style={{ color: "crimson", textAlign: "center" }}>Error: {error}</p>}
      {!loading && sorted.length === 0 && (
        <p style={{ textAlign: "center" }}>No items.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {sorted.map((x) => (
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
    </main>
  );
}
