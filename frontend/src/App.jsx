import { useEffect, useState } from "react";

const USERNAME = "jschow";
const START_FOLDER_ID = 0;
const PER_PAGE = 100;

export default function App() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const url = `/api/collection/${encodeURIComponent(
        USERNAME
      )}/${START_FOLDER_ID}?per_page=${PER_PAGE}&page=1`;

      const res = await fetch(url);
      const json = await res.json();

      const mapped =
        (json.releases || []).map((entry) => ({
          id: entry.id,
          title: entry.basic_information?.title ?? "Unknown",
          year: entry.basic_information?.year ?? "",
          artists:
            entry.basic_information?.artists?.map((a) => a.name).join(", ") ??
            "Unknown",
          cover: entry.basic_information?.cover_image ?? "",
        })) || [];

      mapped.sort((a, b) => a.artists.localeCompare(b.artists));

      setItems(mapped);
    })();
  }, []);

  return (
    <main
      style={{ padding: "12px 24px 24px", fontFamily: "Roboto, sans-serif" }}
    >
      <h1
        style={{
          marginTop: 0,
          marginBottom: 20,
          textAlign: "center",
          color: "charcoal",
          paddingTop: 12,
        }}
      >
        Justin's Vinyl Collection
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((x) => (
          <figure
            key={x.id}
            style={{
              margin: 0,
              padding: 10,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
