import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

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

      const { data } = await axios.get(url);

      const mapped =
        (data.releases || []).map((entry) => ({
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
    <main>
      <h1>Justin's Vinyl Collection</h1>

      <div className="grid">
        {items.map((x) => (
          <figure key={x.id} className="figure">
            {x.cover ? (
              <img
                src={x.cover}
                alt={x.title}
                width={140}
                height={140}
                className="cover"
                loading="lazy"
              />
            ) : (
              <div className="cover-placeholder" />
            )}
            <figcaption className="caption">
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
