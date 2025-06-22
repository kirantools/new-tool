
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));
app.use(express.json());

const checkUsername = async (username) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://www.instagram.com/${username}/`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return response.status === 200 ? 'active' : 'suspended';
  } catch {
    return 'suspended';
  }
};

app.post('/check', async (req, res) => {
  const { usernames } = req.body;
  const active = [], suspended = [];

  const concurrency = 10;
  const queue = [...usernames];

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const username = queue.shift();
      const status = await checkUsername(username);
      if (status === 'active') active.push(username);
      else suspended.push(username);
    }
  });

  await Promise.all(workers);
  res.json({ active, suspended });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
