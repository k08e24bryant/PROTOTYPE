const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const productRepository = require('../data/productRepository');
const userRepository = require('../data/userRepository');
const receiptRepository = require('../data/receiptRepository');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../presentation')));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 60000 }
}));

app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    userRepository.findByUsername(username, (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                req.session.admin = true;
                res.json({ message: 'Login successful' });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    });
});

app.get('/admin', (req, res) => {
    req.session.admin ? res.sendFile(path.join(__dirname, '../presentation/admin.html')) : res.status(401).send('Unauthorized');
});

app.post('/api/products', (req, res) => {
    productRepository.add(req.body, err => {
        err ? res.status(500).json({ error: err.message }) : res.json({ message: 'Product added successfully' });
    });
});

app.get('/api/products', (req, res) => {
    productRepository.getAll((err, rows) => {
        err ? res.status(500).json({ error: err.message }) : res.json(rows);
    });
});

app.delete('/api/products/:id', (req, res) => {
    productRepository.delete(req.params.id, err => {
        err ? res.status(500).json({ error: err.message }) : res.json({ message: 'Product deleted successfully' });
    });
});

app.get('/api/receipt-id', (req, res) => {
    receiptRepository.getNextReceiptId((err, receiptId) => {
        err ? res.status(500).json({ error: err.message }) : res.json({ receiptId });
    });
});

app.post('/api/receipts', (req, res) => {
    receiptRepository.save(req.body, err => {
        err ? res.status(500).json({ error: err.message }) : res.json({ message: 'Receipt saved successfully' });
    });
});

app.get('/api/receipts/:id', (req, res) => {
    receiptRepository.getById(req.params.id, (err, receipt) => {
        err ? res.status(500).json({ error: err.message }) : res.json(receipt);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../presentation/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
