// Khởi tạo bộ nhớ giỏ hàng từ Trình duyệt
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('web_cart')) || [];
let orderHistory = JSON.parse(localStorage.getItem('web_history')) || [];
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;

// ==========================================
// 1. LẤY DỮ LIỆU TỪ GOOGLE SHEET ĐỔ VÀO WEB
// ==========================================
async function fetchProductsFromSheet() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsv-mDZrO7LBtQbjl-D7yIzNuKcX-pkn9pGCpUKYiIWntJt6irLmciv2tYk5kZ0tclH-jIEhZpdydX/pub?output=csv';
    
    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        const lines = data.split(/\r?\n/).filter(line => line.trim() !== "");
        
        allProducts = lines.slice(1).map((line, index) => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
            if (values.length < 2) return null;

            return {
                id: index + 1,
                name: values[0] || "Sản phẩm không tên",
                price: parseInt(values[1]?.replace(/\D/g, '')) || 0,
                brand: values[2] || "Khác",
                specs: values[3] || "Chưa có thông số",
                image: values[4] || "https://via.placeholder.com/200"
            };
        }).filter(p => p !== null);
        
        console.log("Hệ thống nạp thành công:", allProducts.length, "sản phẩm!");
        loadProducts();
    } catch (error) {
        console.error("Lỗi kết nối tới dữ liệu Google Sheet:", error);
    }
}

// ==========================================
// 2. HIỂN THỊ DANH SÁCH SẢN PHẨM
// ==========================================
function loadProducts(productsToRender = allProducts) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('.html') === false;
    // Trang chủ lấy chính xác 5 cái đầu tiên để dàn ngang trên hàng
    const productsToShow = (isHomePage && productsToRender === allProducts) ? allProducts.slice(0, 5) : productsToRender;
    
    renderProducts(productsToShow, grid);
}

function renderProducts(products, container) {
    if (products.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:#666;">Không tìm thấy sản phẩm phù hợp...</p>`;
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div>
                <img src="${p.image}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p style="color:#e53e3e; font-weight:bold; font-size:15px; margin: 5px 0;">${p.price.toLocaleString()}đ</p>
                <p style="margin: 5px 0;"><span style="background:#f3f4f6; padding:2px 8px; border-radius:12px; font-size:12px; color: #4b5563;">${p.brand}</span></p>
            </div>
            
            <div style="margin-top:10px; display:flex; gap:5px; justify-content:center;">
                <button onclick="window.addToCart(${p.id})" style="background:#10b981; color:white; border:none; padding:8px 5px; cursor:pointer; border-radius:5px; flex:1; font-weight:bold; font-size:12px;">Thêm giỏ</button>
                <button onclick="window.openDetail(${p.id})" style="background:#6366f1; color:white; border:none; padding:8px 5px; cursor:pointer; border-radius:5px; flex:1; font-weight:bold; font-size:12px;">Chi tiết</button>
            </div>
        </div>
    `).join('');
}

window.filterProducts = function() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query));
    loadProducts(filtered);
};

// ==========================================
// 3. ĐIỀU HƯỚNG CHI TIẾT VÀ GIỎ HÀNG
// ==========================================
window.openDetail = function(id) {
    window.location.href = `product-detail.html?id=${id}`;
};

window.addToCart = function(id) {
    const product = allProducts.find(p => p.id === id);
    if(product) {
        cart.push(product);
        localStorage.setItem('web_cart', JSON.stringify(cart));
        updateCartCount();
        alert(`🛒 Đã thêm thành công:\n${product.name}\nvào giỏ hàng!`);
    }
};

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if(cartCount) cartCount.innerText = cart.length;
}

window.openCart = function() {
    const cartModal = document.getElementById('cart-modal');
    const cartItemsDiv = document.getElementById('cart-items');
    if (!cartModal || !cartItemsDiv) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = "<p>Giỏ hàng đang trống.</p>";
        document.getElementById('checkout-form').style.display = 'none';
    } else {
        cartItemsDiv.innerHTML = cart.map((item, index) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <span style="font-size:14px; text-align:left; flex:2;">${item.name}</span>
                <span style="color:red; font-weight:bold; flex:1; text-align:right;">${item.price.toLocaleString()}đ</span>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:gray; cursor:pointer; margin-left:10px;">❌</button>
            </div>
        `).join('');
        document.getElementById('checkout-form').style.display = 'block';
    }
    cartModal.style.display = 'block';
};

window.closeCart = function() {
    const cartModal = document.getElementById('cart-modal');
    if(cartModal) cartModal.style.display = 'none';
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('web_cart', JSON.stringify(cart));
    updateCartCount();
    openCart();
};

window.openAIChat = function() {
    const chatBox = document.getElementById('chat-box');
    if(chatBox) {
        chatBox.style.display = chatBox.style.display === 'flex' ? 'none' : 'flex';
    }
};

window.checkout = function() {
    const name = document.getElementById('customer-name').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    if(!name || !address) {
        alert("Vui lòng điền thông tin giao hàng!");
        return;
    }
    alert(`🎉 Đặt hàng thành công!\nCảm ơn anh/chị ${name} đã mua sắm.`);
    orderHistory.push({ date: new Date().toLocaleString(), items: [...cart], name, address });
    localStorage.setItem('web_history', JSON.stringify(orderHistory));
    cart = [];
    localStorage.removeItem('web_cart');
    updateCartCount();
    closeCart();
};

window.openHistory = function() {
    if(orderHistory.length === 0) {
        alert("Bạn chưa có lịch sử mua hàng nào.");
        return;
    }
    let historyText = "📜 LỊCH SỬ MUA HÀNG:\n";
    orderHistory.forEach((h, i) => {
        historyText += `\nĐơn ${i+1} (${h.date}): ${h.items.length} sản phẩm - Giao tới: ${h.address}`;
    });
    alert(historyText);
};

// ==========================================
// 4. HỆ THỐNG GỢI Ý VÀ KẾT NỐI API CHATBOT MODERN
// ==========================================
function initChat() {
    const chatDiv = document.getElementById('chat-messages');
    if (!chatDiv) return;
    
    chatDiv.innerHTML = `
        <div style="background:#ffffff; padding:14px 18px; border-radius:20px 20px 20px 4px; box-shadow:0 2px 12px rgba(0,0,0,0.03); max-width:85%; color:#1e293b; line-height:1.6; align-self:flex-start; border: 1px solid #f1f5f9;">
            Dạ em chào anh/chị! 👋 Em là Bot Phạm Nhật Vượng, trợ lý ảo tư vấn của TTGShop. Em có thể hỗ trợ anh/chị xem máy, tư vấn trả góp hay tìm thông tin khuyến mãi gì hôm nay ạ? 🥰
            <span style="color:#6366f1; cursor:pointer; margin-left:4px; font-size:15px;">🔊</span>
        </div>
    `;
    
    const suggestions = [
        { text: "Máy nào đang bán chạy?", icon: "🔥" },
        { text: "Có khuyến mãi gì không?", icon: "🎁" },
        { text: "Tư vấn laptop văn phòng", icon: "💻" }
    ];
    
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = "display:flex; flex-direction:column; gap:8px; margin-top:10px; align-items:flex-start; width:100%;";
    
    suggestions.forEach(item => {
        const btn = document.createElement('button');
        btn.innerHTML = `<span style="margin-right:6px;">${item.icon}</span> ${item.text}`;
        btn.style.cssText = "padding:10px 20px; background:#e0e7ff; border:1px solid #c7d2fe; color:#4338ca; border-radius:24px; cursor:pointer; font-size:14px; font-weight:600; transition:all 0.2s; box-shadow:0 2px 6px rgba(99,102,241,0.06); text-align:left; width:fit-content; display:inline-flex; align-items:center;";
        
        btn.onmouseover = () => { btn.style.background = "#c7d2fe"; };
        btn.onmouseout = () => { btn.style.background = "#e0e7ff"; };
        
        btn.onclick = () => {
            const input = document.getElementById('chat-input');
            if(input) input.value = item.text;
            window.sendMessage();
        };
        btnContainer.appendChild(btn);
    });
    chatDiv.appendChild(btnContainer);
}

window.sendMessage = async function() {
    const input = document.getElementById('chat-input');
    const chatDiv = document.getElementById('chat-messages');
    
    if (!input || !chatDiv || input.value.trim() === "") return;

    const userText = input.value.trim();
    
    chatDiv.innerHTML += `
        <div style="background:#6366f1; color:white; padding:12px 18px; border-radius:20px 20px 4px 20px; max-width:85%; line-height:1.5; font-size:14px; align-self:flex-end; box-shadow:0 4px 12px rgba(99,102,241,0.2); font-weight:500; margin-left:auto;">
            ${userText}
        </div>
    `;
    input.value = ""; 
    chatDiv.scrollTop = chatDiv.scrollHeight; 
    
    const loadingId = "ai-loading-" + Date.now();
    chatDiv.innerHTML += `
        <div id="${loadingId}" style="background:#ffffff; padding:12px 16px; border-radius:20px 20px 20px 4px; box-shadow:0 2px 12px rgba(0,0,0,0.03); max-width:85%; color:#64748b; font-style:italic; align-self:flex-start; border:1px solid #f1f5f9;">
            Đang suy nghĩ...
        </div>
    `;
    chatDiv.scrollTop = chatDiv.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })
        });
        const data = await response.json();
        
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        
        chatDiv.innerHTML += `
            <div style="background:#ffffff; padding:14px 18px; border-radius:20px 20px 20px 4px; box-shadow:0 2px 12px rgba(0,0,0,0.03); max-width:85%; color:#1e293b; line-height:1.6; align-self:flex-start; border:1px solid #f1f5f9;">
                <b>Bot PMV:</b> ${data.answer}
            </div>
        `;
        chatDiv.scrollTop = chatDiv.scrollHeight; 
    } catch (error) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        
        let aiReply = `Hệ thống AI đang phân tích yêu cầu "${userText}". Bạn vui lòng kiểm tra lại kết nối nhé!`;
        if (userText.includes("văn phòng")) {
            aiReply = "Dựa trên danh sách từ Google Sheet, các dòng máy làm văn phòng đang cực mượt mà, bấm 'Chi tiết' ngoài màn hình để xem sâu thông số RAM và SSD nhé!";
        } else if (userText.includes("bán chạy") || userText.includes("khuyến mãi")) {
            aiReply = "Các dòng laptop ngay tại trang chủ đang có ưu đãi giảm giá sâu và tặng kèm bộ quà chuột không dây đó ạ!";
        }
        
        chatDiv.innerHTML += `
            <div style="background:#ffffff; padding:14px 18px; border-radius:20px 20px 20px 4px; box-shadow:0 2px 12px rgba(0,0,0,0.03); max-width:85%; color:#1e293b; line-height:1.6; align-self:flex-start; border:1px solid #f1f5f9;">
                ${aiReply}
            </div>
        `;
        chatDiv.scrollTop = chatDiv.scrollHeight;
    }
};

window.checkAuth = function() {
    const loginBtn = document.getElementById('login-btn');
    const btnRegister = document.querySelector('.btn-register');
    const userInfo = document.getElementById('user-info');
    const userDisplay = document.getElementById('user-display');
    
    if(currentUser && userInfo && loginBtn && btnRegister && userDisplay) {
        loginBtn.style.display = 'none';
        btnRegister.style.display = 'none';
        userDisplay.innerText = "Xin chào, " + currentUser.name;
        userInfo.style.display = 'block';
    }
};

window.logout = function() {
    localStorage.removeItem('current_user');
    window.location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    fetchProductsFromSheet(); 
    checkAuth();
    initChat();
    updateCartCount();
});