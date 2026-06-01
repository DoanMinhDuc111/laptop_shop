let allProducts = [];
let cart = [];
let orderHistory = [];
let currentUser = null;

// 1. Tải danh sách sản phẩm
async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
        renderProducts(allProducts);
    } catch (err) { console.error(err); }
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="card">
            <h3>${p.name}</h3>
            <p>Thương hiệu: ${p.brand}</p>
            <p>Giá: ${p.price.toLocaleString()} VNĐ</p>
            <button onclick="openDetail(${p.id})">Xem chi tiết</button>
            <button onclick="addToCart(${p.id})" style="background:#10b981; margin-top:5px;">Thêm vào giỏ</button>
        </div>
    `).join('');
}

// 2. Chức năng Tìm kiếm & Phân loại
function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const brandTerm = document.getElementById('category-filter').value;

    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        const matchesBrand = (brandTerm === 'all' || p.brand === brandTerm);
        return matchesSearch && matchesBrand;
    });

    renderProducts(filtered);
}

// 3. Khởi tạo Chat AI mặc định
function initChat() {
    const chatDiv = document.getElementById('chat-messages');
    chatDiv.innerHTML = `<p><b>AI:</b> Xin chào, em là Trợ lý AI! Em có thể hỗ trợ gì cho anh/chị ạ?</p>`;
    
    const suggestions = [
        "Máy nào bán chạy nhất?",
        "Có khuyến mãi gì không?",
        "Tư vấn laptop văn phòng"
    ];

    const btnContainer = document.createElement('div');
    btnContainer.style.marginTop = "10px";
    
    suggestions.forEach(text => {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.margin = "2px";
        btn.style.fontSize = "11px";
        btn.style.cursor = "pointer";
        btn.onclick = () => {
            document.getElementById('chat-input').value = text;
            sendMessage();
        };
        btnContainer.appendChild(btn);
    });
    chatDiv.appendChild(btnContainer);
}

// 4. Quản lý Đăng nhập/Đăng xuất
async function checkAuth() {
    const token = localStorage.getItem('user_token');
    const profileData = localStorage.getItem('user_profile');
    
    if (token && profileData) {
        currentUser = JSON.parse(profileData);
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-info').style.display = 'inline-block';
        document.getElementById('user-display').innerText = "Chào, " + currentUser.name;
    } else {
        document.getElementById('login-btn').style.display = 'inline-block';
        document.getElementById('user-info').style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_profile');
    currentUser = null;
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('login-btn').style.display = 'inline-block';
    alert("Bạn đã đăng xuất!");
}

// 5. Modal chi tiết & Chat logic
function openDetail(id) {
    console.log("Đang tìm sản phẩm có ID:", id); // Kiểm tra F12 -> Console
    const product = allProducts.find(p => p.id == id); // Dùng == để tránh lỗi so sánh string/number
    
    if (!product) {
        alert("Không tìm thấy sản phẩm!");
        return;
    }
    
    const modal = document.getElementById('product-modal');
    modal.dataset.currentId = id; 
    
    document.getElementById('modal-body').innerHTML = `
        <h2>${product.name}</h2>
        <p><strong>Thông số:</strong> ${product.specs || 'Chưa cập nhật'}</p>
        <p><strong>Giá:</strong> ${product.price.toLocaleString()} VNĐ</p>
    `;
    
    modal.style.display = 'block'; // Hiển thị modal
}

function closeModal() { 
    document.getElementById('product-modal').style.display = 'none'; 
}

function appendMessage(sender, text) {
    const chatDiv = document.getElementById('chat-messages');
    const formattedText = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#6366f1;">$1</a>');
    chatDiv.innerHTML += `<p><b>${sender}:</b> ${formattedText}</p>`;
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

async function askAIAboutProduct() {
    const id = document.getElementById('product-modal').dataset.currentId;
    const product = allProducts.find(p => p.id == id);
    if (!product) return;
    appendMessage("Bạn", `Tư vấn cho tôi về ${product.name}`);
    closeModal();
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Tư vấn về ${product.name}, thông số: ${product.specs}.` })
        });
        const data = await res.json();
        appendMessage("AI", data.answer);
    } catch (err) { appendMessage("Hệ thống", "Lỗi kết nối AI!"); }
}

function openAIChat() {
    const box = document.getElementById('chat-box');
    box.style.display = (box.style.display === 'none' || box.style.display === '') ? 'block' : 'none';
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value;
    if (!msg.trim()) return; 
    appendMessage("Bạn", msg);
    input.value = "";
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        appendMessage("AI", data.answer);
    } catch (err) { appendMessage("Hệ thống", "Lỗi kết nối!"); }
}

// 6. Quản lý Giỏ hàng & Thanh toán
function addToCart(id) {
    const product = allProducts.find(p => p.id === id);
    cart.push(product);
    document.getElementById('cart-count').innerText = cart.length;
    alert("Đã thêm " + product.name + " vào giỏ!");
}

function openCart() {
    const cartDiv = document.getElementById('cart-items');
    document.getElementById('checkout-form').style.display = 'none';
    cartDiv.innerHTML = cart.map((p, index) => `
        <p>${p.name} - ${p.price.toLocaleString()} VNĐ 
        <button onclick="removeFromCart(${index})">Xóa</button></p>
    `).join('');
    document.getElementById('cart-modal').style.display = 'block';
}

function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

function removeFromCart(index) {
    cart.splice(index, 1);
    document.getElementById('cart-count').innerText = cart.length;
    openCart();
}

function checkout() {
    const form = document.getElementById('checkout-form');
    const btn = document.getElementById('checkout-btn');

    if (form.style.display === 'none' || form.style.display === '') {
        if (cart.length === 0) { alert("Giỏ hàng trống!"); return; }
        if (currentUser) {
            document.getElementById('customer-name').value = currentUser.name || '';
            document.getElementById('customer-address').value = currentUser.address || '';
        }
        form.style.display = 'block';
        btn.innerText = "Xác nhận đặt hàng";
        return;
    }

    const name = document.getElementById('customer-name').value;
    const address = document.getElementById('customer-address').value;

    if (!name.trim() || !address.trim()) { alert("Vui lòng nhập đầy đủ thông tin!"); return; }

    const total = cart.reduce((sum, p) => sum + p.price, 0);
    orderHistory.push({ date: new Date().toLocaleString(), total, address, items: [...cart] });
    
    appendMessage("AI", `Chúc mừng bạn đã đặt hàng thành công! Đơn hàng ${total.toLocaleString()} VNĐ đã được ghi nhận.`);
    
    alert("Đặt hàng thành công!");
    cart = [];
    document.getElementById('cart-count').innerText = 0;
    form.style.display = 'none';
    btn.innerText = "Thanh toán";
    closeCart();
}

function openHistory() {
    const cartDiv = document.getElementById('cart-items');
    document.getElementById('checkout-form').style.display = 'none';
    cartDiv.innerHTML = orderHistory.length > 0 
        ? orderHistory.map(o => `<div style="border-bottom:1px solid #eee; padding:5px 0;">
            <p><b>${o.date}</b> - Tổng: <b>${o.total.toLocaleString()} VNĐ</b></p>
            <small>Giao tới: ${o.address}</small></div>`).join('')
        : "<p>Chưa có đơn hàng nào.</p>";
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    checkAuth();
    initChat();
});