const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'config_masterr_secret',
    resave: false,
    saveUninitialized: false
}));

// Serve static files
app.use(express.static('public'));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.authenticated) {
        return res.redirect('/login');
    }
    next();
};

// Routes
app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'interface.html'));
});

app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === 'config_mere_papa') {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Incorrect password' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Simulate user agent generation
const generateUserAgent = () => {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
};

// Helper function to find text between delimiters
const findBetween = (content, start, end) => {
    const startPos = content.indexOf(start);
    if (startPos === -1) return '';
    const startIndex = startPos + start.length;
    const endPos = content.indexOf(end, startIndex);
    if (endPos === -1) return '';
    return content.substring(startIndex, endPos);
};

// Proxy configuration
const proxyList = [
    '38.154.227.167:5868:fkcbkrrl:fkcbkrrl',
    '198.23.239.134:6540:fkcbkrrl:fkcbkrrl',
    '207.244.217.165:6712:fkcbkrrl:fkcbkrrl',
    '107.172.163.27:6543:fkcbkrrl:fkcbkrrl',
    '216.10.27.159:6837:fkcbkrrl:fkcbkrrl',
    '136.0.207.84:6661:fkcbkrrl:fkcbkrrl',
    '64.64.118.149:6732:fkcbkrrl:fkcbkrrl',
    '142.147.128.93:6593:fkcbkrrl:fkcbkrrl',
    '104.239.105.125:6655:fkcbkrrl:fkcbkrrl',
    '206.41.172.74:6634:fkcbkrrl:fkcbkrrl'
];

const parseProxies = () => {
    return proxyList.map(proxy => {
        const parts = proxy.split(':');
        return {
            ip: parts[0],
            port: parts[1],
            username: parts[2],
            password: parts[3]
        };
    });
};

// Credit card checking endpoint
app.post('/check-cards', requireAuth, async (req, res) => {
    const { cc_input } = req.body;
    
    if (!cc_input) {
        return res.json({
            error: true,
            message: 'No CC details entered',
            owner: '⚡⚡ @config_masterr ⚡⚡'
        });
    }

    const ccLines = cc_input.split('\n').filter(line => line.trim() !== '');
    
    if (ccLines.length === 0) {
        return res.json({
            error: true,
            message: 'No valid CC details found',
            owner: '⚡⚡ @config_masterr ⚡⚡'
        });
    }

    // Set response headers for streaming
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const proxies = parseProxies();
    const ua = generateUserAgent();

    for (const ccLine of ccLines) {
        const cc1 = ccLine.trim();
        
        if (!cc1) continue;

        const ccParts = cc1.split('|');
        if (ccParts.length < 4) continue;

        const [cc, month, year, cvv] = ccParts;
        
        // Format year
        let formattedYear = year;
        if (year.length <= 2) {
            formattedYear = `20${year}`;
        }
        
        // Format month
        let subMonth = month.replace(/^0+/, '') || month;

        let err = '';
        
        try {
            // Simulate the checking process
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            // Simulate different responses
            const random = Math.random();
            if (random < 0.05) {
                err = 'Thank you for your purchase! -> 19$';
            } else if (random < 0.15) {
                err = '3D Secure Card';
            } else if (random < 0.25) {
                err = 'Receipt id is empty';
            } else if (random < 0.35) {
                err = 'Card Token is empty';
            } else if (random < 0.45) {
                err = 'Session token is empty';
            } else if (random < 0.55) {
                err = 'Queue Token is empty';
            } else if (random < 0.65) {
                err = 'Payment Method Identifier Token is empty';
            } else if (random < 0.75) {
                err = 'Product is out of stock';
            } else {
                err = 'Card declined';
            }

        } catch (error) {
            err = error.message || 'Unknown error occurred';
        }

        // Format response message
        const fullMsg = `𝘾𝘼𝙍𝘿 ↯ ${cc}|${subMonth}|${formattedYear}|${cvv}\n` +
                       `𝙂𝘼𝙏𝙀𝙒𝘼𝙔 ↯ Stripe + Shopify 19$\n` +
                       `𝙍𝙀𝙎𝙋𝙊𝙉𝙎𝙀 ↯ ${err}\n` +
                       `𝙏𝙄𝙈𝙀 ↯ ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n` +
                       `𝙊𝙬𝙣𝙚𝙧 ↯ @config_masterr\n` +
                       `└─────────────────────┘\n\n`;

        // Send the result
        res.write(fullMsg);
        
        // Small delay between cards
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    res.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});