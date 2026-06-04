const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config(); // Dùng để load file .env (cần cài: npm install dotenv)

const app = express();

app.use(express.json());

// 1. Phục vụ file tĩnh (CSS, JS, HTML)
// Đảm bảo tất cả file giao diện nằm cùng thư mục hoặc trong cùng một folder
app.use(express.static(__dirname));

// 2. Route FIX lỗi 404 cho cart.html
app.get('/cart.html', (req, res) => {
    const filePath = path.join(__dirname, 'cart.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("File cart.html không tồn tại!");
    }
});

// Các route khác
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/product-detail.html', (req, res) => res.sendFile(path.join(__dirname, 'product-detail.html')));

// 3. API Chat
app.post('/api/chat', async (req, res) => {
    const { query, inputs } = req.body;
    // Dùng process.env để lấy key, nếu không có thì lấy chuỗi mặc định (để test)
    const apiKey = process.env.DIFY_API_KEY || 'app-O9OfHClfqKd9sgzCfIiPOHV4'; 
    const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';

    try {
        const response = await axios.post(DIFY_API_URL, {
            query: query,
            inputs: inputs || {},
            response_mode: "blocking",
            user: "web-user-" + Date.now()
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        res.json({ answer: response.data.answer || response.data.text });
    } catch (err) {
        console.error("Lỗi Dify:", err.response?.data || err.message);
        res.status(500).json({ answer: "Lỗi kết nối AI. Vui lòng thử lại sau." });
    }
});

// 4. Cổng chạy ứng dụng
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});