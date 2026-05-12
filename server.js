const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Increase payload limit for images
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// File paths
const SERVICES_FILE = path.join(__dirname, 'services.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');

// Initialize files
if (!fs.existsSync(SERVICES_FILE)) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([
        {
            id: '1',
            username: 'admin',
            email: 'admin@graphichouse.com.np',
            password: 'admin123',
            role: 'admin',
            createdAt: new Date().toISOString()
        }
    ], null, 2));
}

// Initialize default categories
if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify([
        { id: 'cat1', name: '🖨️ Printing', slug: 'printing', icon: 'fa-print' },
        { id: 'cat2', name: '👕 T-Shirt', slug: 't-shirt', icon: 'fa-tshirt' },
        { id: 'cat3', name: '🚩 Flags', slug: 'flags', icon: 'fa-flag' },
        { id: 'cat4', name: '💒 Wedding Cards', slug: 'wedding-cards', icon: 'fa-heart' },
        { id: 'cat5', name: '🔑 Keyrings', slug: 'keyrings', icon: 'fa-key' },
        { id: 'cat6', name: '🎒 School Vest', slug: 'school-vest', icon: 'fa-graduation-cap' },
        { id: 'cat7', name: '📸 Flex Photos', slug: 'flex-photos', icon: 'fa-camera' },
        { id: 'cat8', name: '🖥️ Digital Boards', slug: 'digital-boards', icon: 'fa-tv' },
        { id: 'cat9', name: '💡 Neon Boards', slug: 'neon-boards', icon: 'fa-lightbulb' }
    ], null, 2));
}

// Helper functions
function getServices() {
    try {
        const data = fs.readFileSync(SERVICES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function saveServices(services) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2));
}

function getUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getCategories() {
    try {
        const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function saveCategories(categories) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
}

// ============== CATEGORY ROUTES ==============
app.get('/api/categories', (req, res) => {
    res.json(getCategories());
});

app.post('/api/categories', (req, res) => {
    const categories = getCategories();
    const newCategory = {
        id: 'cat' + Date.now(),
        name: req.body.name,
        slug: req.body.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        icon: req.body.icon || 'fa-tag'
    };
    categories.push(newCategory);
    saveCategories(categories);
    res.status(201).json(newCategory);
});

app.put('/api/categories/:id', (req, res) => {
    let categories = getCategories();
    const index = categories.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        categories[index] = { ...categories[index], ...req.body };
        saveCategories(categories);
        res.json(categories[index]);
    } else {
        res.status(404).json({ error: 'Category not found' });
    }
});

app.delete('/api/categories/:id', (req, res) => {
    let categories = getCategories();
    categories = categories.filter(c => c.id !== req.params.id);
    saveCategories(categories);
    res.json({ message: 'Category deleted' });
});

// ============== SERVICE ROUTES ==============
app.get('/api/services', (req, res) => {
    try {
        const services = getServices();
        res.json(services);
    } catch (error) {
        res.json([]);
    }
});

app.post('/api/services', (req, res) => {
    try {
        const services = getServices();
        const newService = {
            _id: Date.now().toString(),
            name: req.body.name || 'Untitled',
            category: req.body.category || 'other',
            description: req.body.description || '',
            basePrice: req.body.basePrice || 0,
            images: req.body.images || [],
            bulkPrices: req.body.bulkPrices || [],
            priceOptions: req.body.priceOptions || [],
            createdAt: new Date().toISOString(),
            views: 0
        };
        services.push(newService);
        saveServices(services);
        res.status(201).json(newService);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add service' });
    }
});

app.delete('/api/services/:id', (req, res) => {
    try {
        let services = getServices();
        services = services.filter(s => s._id !== req.params.id);
        saveServices(services);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// ============== AUTH ROUTES ==============
app.post('/api/admin/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getUsers();
        const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
        
        if (user) {
            res.json({ 
                success: true, 
                token: 'simple-token',
                user: { id: user.id, username: user.username, email: user.email, role: user.role }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/admin/change-password', (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        let users = getUsers();
        const userIndex = users.findIndex(u => u.email === email && u.password === currentPassword);
        
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            saveUsers(users);
            res.json({ success: true, message: 'Password changed successfully' });
        } else {
            res.status(401).json({ error: 'Current password is incorrect' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ============== STATS ROUTES ==============
app.get('/api/admin/stats', (req, res) => {
    try {
        const services = getServices();
        res.json({
            totalServices: services.length,
            totalOrders: 0,
            recentOrders: []
        });
    } catch (error) {
        res.json({ totalServices: 0, totalOrders: 0, recentOrders: [] });
    }
});

app.get('/api/admin/orders', (req, res) => {
    res.json([]);
});

app.put('/api/admin/orders/:id', (req, res) => {
    res.json({ success: true });
});

app.get('/api/admin/settings', (req, res) => {
    res.json({
        siteName: "Graphic House",
        email: "info@graphichouse.com.np",
        whatsapp: "98XXXXXXXX",
        address: "Nepal"
    });
});

app.put('/api/admin/settings', (req, res) => {
    res.json({ success: true });
});

// Serve admin.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ SERVER RUNNING on port ${PORT}`);
    console.log(`📋 ADMIN PANEL: https://graphichousefinal.onrender.com`);
    console.log(`🔐 LOGIN: admin@graphichouse.com.np / admin123`);
});