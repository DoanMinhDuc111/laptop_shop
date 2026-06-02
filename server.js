const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const app = express();

// CẤU HÌNH API DIFY
const DIFY_API_KEY = 'app-O9OfHClfqKd9sgzCfIiPOHV4'; 
const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';

app.use(express.json());

// Phục vụ các file tĩnh trong thư mục gốc
app.use(express.static(path.join(__dirname)));

// ĐỊNH TUYẾN BẮT BUỘC CHO CÁC TRANG CỐ ĐỊNH
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/product-detail.html', (req, res) => {
    const filePath = path.join(__dirname, 'product-detail.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("<h3>Lỗi: Không tìm thấy file 'product-detail.html' trong thư mục gốc dự án! Hãy tạo file này nhé.</h3>");
    }
});

// Route kết nối API tiếp nhận tin nhắn Dify Bot
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    try {
        const response = await axios.post(DIFY_API_URL, {
            inputs: {},
            query: message,
            response_mode: "blocking",
            user: "web-user-123"
        }, {
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ answer: response.data.answer });
    } catch (err) {
        console.error("Lỗi Dify API:", err.response ? err.response.data : err.message);
        res.status(500).json({ answer: "Xin lỗi, AI hiện đang gặp sự cố kết nối." });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`Server đang chạy cực ngon tại: http://localhost:${PORT}`);
    console.log(`==================================================`);
});