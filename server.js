require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const app = express();

const CONFIG_PATH = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(CONFIG_PATH));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// Helper to persist config
function saveConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Public main page
app.get('/', async (req, res) => {
  let svg = null;
  if (config.id) {
    const resp = await axios.get(
      `https://hovercode.com/api/v2/hovercode/${config.id}/`,
      { headers: { Authorization: `Token ${process.env.HOVERCODE_TOKEN}` } }
    );
    svg = resp.data.svg;  // inline SVG from API :contentReference[oaicite:9]{index=9}
  }
  res.render('index', { svg });
});

// Admin page
app.get('/admin', (req, res) => {
  res.render('admin', { link: config.link });
});

// Handle create/update
app.post('/admin', async (req, res) => {
  const { link } = req.body;
  const tokenHeader = { Authorization: `Token ${process.env.HOVERCODE_TOKEN}`,
    'Content-Type': 'application/json' };
  if (config.id) {
    // Update existing QR code :contentReference[oaicite:10]{index=10}
    await axios.put(
      `https://hovercode.com/api/v2/hovercode/${config.id}/update/`,
      { qr_data: link },
      { headers: tokenHeader }
    );
  } else {
    // Create new QR code :contentReference[oaicite:11]{index=11}
    const resp = await axios.post(
      'https://hovercode.com/api/v2/hovercode/create/',
      {
        workspace: process.env.HOVERCODE_WORKSPACE,
        qr_data: link,
        dynamic: true
      },
      { headers: tokenHeader }
    );
    config.id = resp.data.id;
  }
  config.link = link;
  saveConfig();
  res.redirect('/admin');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
