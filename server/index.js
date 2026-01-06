const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const {
  MONGODB_URI,
  DB_NAME,
  COLLECTION_NAME,
  PORT = "3000"
} = process.env;

if (!MONGODB_URI || !DB_NAME || !COLLECTION_NAME) {
  console.error("Missing env vars: MONGODB_URI, DB_NAME, COLLECTION_NAME");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

let client;

async function getCollection() {
  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10
    });
    await client.connect();
  }
  return client.db(DB_NAME).collection(COLLECTION_NAME);
}

app.get("/ping", (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.post("/score", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const score = Number(req.body.score);
    if (!username) {
      return res.status(400).json({ ok: false, error: "username_required" });
    }
    if (!Number.isFinite(score)) {
      return res.status(400).json({ ok: false, error: "score_invalid" });
    }

    const col = await getCollection();
    await col.updateOne(
      { username },
      {
        $set: {
          username,
          score,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /score failed", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit || 50);
    const limit = Math.max(1, Math.min(200, Math.floor(limitRaw)));
    const col = await getCollection();
    const items = await col
      .find({}, { projection: { _id: 0 } })
      .sort({ score: -1, updated_at: 1 })
      .limit(limit)
      .toArray();
    return res.json({ ok: true, items });
  } catch (err) {
    console.error("GET /leaderboard failed", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.get("/rank", async (req, res) => {
  try {
    const username = String(req.query.username || "").trim();
    if (!username) {
      return res.status(400).json({ ok: false, error: "username_required" });
    }
    const col = await getCollection();
    const user = await col.findOne(
      { username },
      { projection: { _id: 0 } }
    );
    if (!user) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }
    const aheadCount = await col.countDocuments({ score: { $gt: user.score } });
    return res.json({
      ok: true,
      username: user.username,
      score: user.score,
      rank: aheadCount + 1
    });
  } catch (err) {
    console.error("GET /rank failed", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.listen(Number(PORT), () => {
  console.log(`Leaderboard API listening on port ${PORT}`);
});
