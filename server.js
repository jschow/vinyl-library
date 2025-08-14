const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/collection/:username/:folderId", async (req, res) => {
  const { username, folderId } = req.params;
  const { page = 1, per_page = 50 } = req.query;

  const url = `https://api.discogs.com/users/${encodeURIComponent(
    username
  )}/collection/folders/${folderId}/releases?page=${page}&per_page=${per_page}`;

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": process.env.USER_AGENT || "VinylLibrary/1.0 (+http://localhost:5173)",
        Authorization: `Discogs token=${process.env.DISCOGS_TOKEN || ""}`,
      },
    });
    const text = await r.text();
    res.status(r.status).type(r.headers.get("content-type") || "application/json").send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ message: "Proxy error", detail: String(err) });
  }
});

const port = Number(process.env.PORT) || 5175; // Changed default to 5175
app.listen(port, () => {
  console.log(`Proxy running on http://localhost:${port}`);
});
