/**
 * Improved Instagram Username Checker backend
 * - Adds User-Agent so Instagram doesn't block Render IP
 * - Detects 'Sorry, this page isn’t available.' in HTML
 * - Treats any non‑200, non‑OK response as suspended
 * - Manual redirect mode to avoid following redirects to login
 */

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));
app.use(express.json());

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
};

async function checkUsername(username) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000); // 7 s timeout

  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      method: 'GET',
      redirect: 'manual', // don’t auto‑follow
      headers: HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // 404 or >=400 → suspended
    if (res.status >= 400) return 'suspended';

    // read body only when status is 200
    const html = await res.text();

    // Phrase Instagram shows on non‑existent / suspended pages
    const unavailable =
      html.includes('Sorry, this page isn') ||
      html.includes('Page isn’t available') ||
      html.includes('content="404"');

    return unavailable ? 'suspended' : 'active';
  } catch (err) {
    // network, timeout, or anything else → treat as suspended
    return 'suspended';
  }
}

app.post('/check', async (req, res) => {
  const { usernames } = req.body;
  const active = [];
  const suspended = [];

  const CONCURRENCY = 8; // render free tier sweet spot
  const queue = [...usernames];

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const u = queue.shift();
      const status = await checkUsername(u);
      (status === 'active' ? active : suspended).push(u);
    }
  });

  await Promise.all(workers);
  res.json({ active, suspended });
});

app.listen(PORT, () =>
  console.log(`✅ Instagram checker running on http://localhost:${PORT}`)
);