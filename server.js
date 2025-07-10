// --- IMPORTS ---
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

// --- HELPERS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- APP ---
const app = express();
const PORT = process.env.PORT || 10000;

// --- MIDDLEWARE ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'config_masterr_secret_1234567890',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  })
);

// --- STATIC FILES (YOUR VITE BUILD) ---
app.use(express.static(path.join(__dirname, 'dist')));

// --- AUTH MIDDLEWARE ---
const requireAuth = (req, res, next) => {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }
  next();
};

// --- ROUTES ---

// Main protected app
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'login.html'));
});

// Handle login POST
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === 'config_mere_papa') {
    req.session.authenticated = true;
    return res.json({ success: true });
  } else {
    return res.json({ success: false, message: 'Invalid password' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// --- CREDIT CARD CHECKER LOGIC ---
app.post('/check-cards', requireAuth, async (req, res) => {
  const { cc_input } = req.body;

  if (!cc_input) {
    return res.json({
      error: true,
      message: 'No CC details entered',
      owner: '@config_masterr'
    });
  }

  const ccLines = cc_input.split('\n').filter(line => line.trim() !== '');

  if (ccLines.length === 0) {
    return res.json({
      error: true,
      message: 'No valid CC details found',
      owner: '@config_masterr'
    });
  }

  // Example proxies list (fake)
  const proxies = [
    '38.154.227.167:5868:fkcbkrrl:fkcbkrrl',
    '198.23.239.134:6540:fkcbkrrl:fkcbkrrl',
    '207.244.217.165:6712:fkcbkrrl:fkcbkrrl',
    '107.172.163.27:6543:fkcbkrrl:fkcbkrrl',
    '216.10.27.159:6837:fkcbkrrl:fkcbkrrl'
  ];

  // Stream response
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  for (const ccLine of ccLines) {
    const cc1 = ccLine.trim();
    if (!cc1) continue;

    const ccParts = cc1.split('|');
    if (ccParts.length < 4) continue;

    const [cc, month, year, cvv] = ccParts;

    let formattedYear = year.length <= 2 ? `20${year}` : year;
    let subMonth = month.replace(/^0+/, '') || month;

    let result = '';

    try {
      // --- Here you would use axios or fetch to call an external API via proxy ---
      // --- For now, simulate fake result ---
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const random = Math.random();
      if (random < 0.05) {
        result = '✅ Approved - Thank you for your purchase!';
      } else if (random < 0.15) {
        result = '3D Secure - Action Required';
      } else if (random < 0.25) {
        result = 'Insufficient Funds';
      } else {
        result = 'Declined';
      }

    } catch (err) {
      result = 'Error: ' + err.message;
    }

    const output = `CARD: ${cc}|${subMonth}|${formattedYear}|${cvv}\n` +
      `RESULT: ${result}\n` +
      `TIME: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n` +
      `OWNER: @config_masterr\n` +
      `─────────────────────────────\n`;

    res.write(output);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  res.end();
});

// --- FALLBACK (REACT ROUTER) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
