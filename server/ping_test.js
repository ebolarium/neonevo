const url = process.env.LEADERBOARD_URL;

if (!url) {
  console.error("ERROR: LEADERBOARD_URL env var missing.");
  console.error("Example: LEADERBOARD_URL=https://neonevo.onrender.com");
  process.exit(1);
}

const base = url.replace(/\/+$/, "");
const pingUrl = `${base}/ping`;

async function main() {
  try {
    const res = await fetch(pingUrl, { method: "GET" });
    const data = await res.json();
    if (data && data.ok === true) {
      console.log(`OK: ${pingUrl}`);
      process.exit(0);
    }
    console.error("ERROR: Unexpected response");
    console.error(data);
    process.exit(2);
  } catch (err) {
    console.error("ERROR: Request failed");
    console.error(err && err.message ? err.message : err);
    process.exit(3);
  }
}

main();
