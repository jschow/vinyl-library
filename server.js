const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());

app.get("/api/collection/:username/:folderId", async (req, res) => {
  const { username, folderId } = req.params;
  const { page = 1, per_page = 100 } = req.query;

  const url = `https://api.discogs.com/users/${encodeURIComponent(
    username
  )}/collection/folders/${folderId}/releases?page=${page}&per_page=${per_page}`;

  const r = await fetch(url, {
    headers: {
      "User-Agent":
        process.env.USER_AGENT || "VinylLibrary/1.0 (+http://localhost)",
      Authorization: `Discogs token=${process.env.DISCOGS_TOKEN || ""}`,
    },
  });

  const body = await r.text();
  res
    .status(r.status)
    .type(r.headers.get("content-type") || "application/json")
    .send(body);
});

const port = Number(process.env.PORT) || 5175;
app.listen(port, () => {
  console.log(`Proxy running on http://localhost:${port}`);
});
