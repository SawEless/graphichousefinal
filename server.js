const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// IMPORTANT: Increase payload limit for images
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// File paths
const SERVICES_FILE = path.join(__dirname, 'services.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize empty services array
if (!fs.existsSync(SERVICES_FILE)) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify([], null, 2));
}

// Create default admin user
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([
        {
            id: '1',
            username: 'admin',
            email: 'admin@graphichouse.com.np',
            password: 'admin123',
            role: 'admin'
        }
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

// GET all services
app.get('/api/services', (req, res) => {
    try {
        const services = getServices();
        res.json(services);
    } catch (error) {
        res.json([]);
    }
});

// POST - Add new service (with image support)
app.post('/api/services', (req, res) => {
    try {
        console.log('📦 Received service data');
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
        console.log(`✅ Service added: ${newService.name}`);
        res.status(201).json(newService);
    } catch (error) {
        console.error('Error adding service:', error);
        res.status(500).json({ error: 'Failed to add service: ' + error.message });
    }
});

// DELETE service
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

// Admin login
app.post('/api/admin/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getUsers();
        const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
        
        if (user) {
            res.json({ 
                success: true, 
                token: 'simple-token',
                user: { username: user.username, email: user.email }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get stats
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

// Get orders (placeholder)
app.get('/api/admin/orders', (req, res) => {
    res.json([]);
});

// Update order (placeholder)
app.put('/api/admin/orders/:id', (req, res) => {
    res.json({ success: true });
});

// Get settings
app.get('/api/admin/settings', (req, res) => {
    res.json({
        siteName: "Graphic House",
        email: "info@graphichouse.com.np",
        whatsapp: "98XXXXXXXX",
        address: "Nepal"
    });
});

// Update settings
app.put('/api/admin/settings', (req, res) => {
    res.json({ success: true });
});

// ========== FIX: Use the PORT from Render ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ SERVER RUNNING on port ${PORT}`);
    console.log(`📋 ADMIN PANEL: https://graphichouse-api.onrender.com/admin.html`);
    console.log(`🔐 LOGIN: admin@graphichouse.com.np / admin123`);
    console.log(`📸 Image upload: Enabled (50MB limit)`);
});