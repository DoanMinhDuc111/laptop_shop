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

app.post('/api/chat', async (req, res) => {
    const { query, inputs } = req.body; 

    console.log("=== Nhận request từ frontend ===");
    console.log("Query:", query);
    console.log("Inputs:", inputs);

    if (!query) {
        return res.status(400).json({ answer: "Không nhận được câu hỏi từ người dùng." });
    }

    try {
        const response = await axios.post(DIFY_API_URL, {
            query: query,
            inputs: inputs || {},           // Đảm bảo inputs luôn là object
            response_mode: "blocking",
            user: "web-user-" + Date.now()  // Tạo user ID động để tránh lỗi conversation
        }, {
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Dify trả về thành công");
        res.json({ 
            answer: response.data.answer || response.data.text 
        });

    } catch (err) {
        console.error("=== LỖI CHI TIẾT TỪ DIFY ===");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
            res.status(500).json({ 
                answer: `Lỗi Dify: ${err.response.data.message || JSON.stringify(err.response.data)}` 
            });
        } else {
            console.error("Lỗi khác:", err.message);
            res.status(500).json({ answer: "Không kết nối được với Dify. Kiểm tra API Key và mạng." });
        }
    }
});
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`Server đang chạy cực ngon tại: http://localhost:${PORT}`);
    console.log(`==================================================`);
});