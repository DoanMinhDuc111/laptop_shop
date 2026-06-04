// Khởi tạo bộ nhớ giỏ hàng từ Trình duyệt
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('web_cart')) || [];
let orderHistory = JSON.parse(localStorage.getItem('web_history')) || [];

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
// 3. ĐIỀU HƯỚNG VÀ XỬ LÝ GIỎ HÀNG ĐỘC LẬP
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

window.buyNow = function(id) {
    const product = allProducts.find(p => p.id === id);
    if(product) {
        cart.push(product);
        localStorage.setItem('web_cart', JSON.stringify(cart));
        updateCartCount();
        window.location.href = 'cart.html';
    }
};

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if(cartCount) cartCount.innerText = cart.length;
}

window.openCart = function() {
    window.location.href = 'cart.html'; 
};

window.renderCartPage = function() {
    const cartItemsDiv = document.getElementById('cart-page-items');
    const checkoutSection = document.getElementById('checkout-form-section');
    const totalDiv = document.getElementById('cart-total');
    
    if (!cartItemsDiv) return; 

    // Lấy giỏ hàng mới nhất từ LocalStorage
    cart = JSON.parse(localStorage.getItem('web_cart')) || [];

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = `<p style="text-align:center; color:#666; padding: 20px 0;">Giỏ hàng của bạn đang trống trơn. <a href="index.html" style="color:#6366f1; text-decoration:none; font-weight:bold;">Quay lại sắm ngay!</a></p>`;
        if (checkoutSection) checkoutSection.style.display = 'none';
        if (totalDiv) totalDiv.innerHTML = '';
    } else {
        cartItemsDiv.innerHTML = cart.map((item, index) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #f3f4f6; padding-bottom:15px;">
                <img src="${item.image}" alt="${item.name}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; margin-right:15px;">
                <span style="font-size:14px; text-align:left; flex:2; font-weight:600; color:#1f2937;">${item.name}</span>
                <span style="color:#e53e3e; font-weight:bold; flex:1; text-align:right; font-size:15px;">${item.price.toLocaleString()}đ</span>
                <button onclick="window.removeFromCartPage(${index})" style="background:none; border:none; color:#9ca3af; cursor:pointer; margin-left:15px; font-size:16px;">❌</button>
            </div>
        `).join('');
        
        if (checkoutSection) checkoutSection.style.display = 'block';
        
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        if (totalDiv) totalDiv.innerHTML = `Tổng tiền: <span style="color:#e53e3e; font-size:18px; font-weight:bold;">${total.toLocaleString()}đ</span>`;
    }
};

window.removeFromCartPage = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('web_cart', JSON.stringify(cart));
    updateCartCount();
    window.renderCartPage(); 
};

window.checkout = function() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();

    if (!name || !phone || !address) {
        alert('Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ để nhận hàng!');
        return;
    }

    // LƯU TẠM THÔNG TIN ĐỂ SANG TRANG SUCCESS BOT CÓ THỂ ĐỌC ĐƯỢC
    const customerInfo = { name: name, phone: phone, address: address };
    localStorage.setItem('latest_customer_info', JSON.stringify(customerInfo));

    // Thực hiện logic xóa giỏ hàng hiện tại
    localStorage.removeItem('web_cart'); 

    // Chuyển thẳng sang trang thành công
    window.location.href = 'success.html';
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
// 4. HỆ THỐNG CHATBOT 
// ==========================================
window.openAIChat = function() {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
        chatBox.style.display = chatBox.style.display === 'flex' ? 'none' : 'flex';
    }
};

function initChat() {
    const chatDiv = document.getElementById('chat-messages');
    if (!chatDiv) return;

    chatDiv.innerHTML = `
        <div style="background:#ffffff; padding:14px 18px; border-radius:20px 20px 20px 4px; box-shadow:0 2px 12px rgba(0,0,0,0.03); max-width:85%; color:#1e293b; line-height:1.6; align-self:flex-start; border: 1px solid #f1f5f9;">
            Dạ em chào anh/chị! 👋 Em là Bot Phạm Nhật Vượng. Em có thể hỗ trợ anh/chị hôm nay không ạ? 🥰
        </div>
    `;

    const isDetailPage = window.location.pathname.includes('product-detail.html');
    
    if (isDetailPage) {
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = "display:flex; flex-direction:column; gap:8px; margin-top:10px; align-items:flex-start; width:100%;";
        
        const btn = document.createElement('button');
        btn.innerHTML = `<span style="margin-right:6px;">🤖</span> Hỏi AI về sản phẩm này`;
        btn.style.cssText = "padding:10px 20px; background:#e0e7ff; border:1px solid #c7d2fe; color:#4338ca; border-radius:24px; cursor:pointer; font-size:14px; font-weight:600; transition:all 0.2s;";
        
        btn.onclick = function() {
            const input = document.getElementById('chat-input');
            if (input) {
                input.value = "Hỏi AI về sản phẩm này";
                window.sendMessage();
            }
        };
        
        btnContainer.appendChild(btn);
        chatDiv.appendChild(btnContainer);
    }
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

    const currentProductUrl = window.location.href;
    const productNameElement = document.querySelector('.product-title') || document.querySelector('h2') || document.querySelector('h1');
    const currentProductName = productNameElement ? productNameElement.innerText.trim() : "Sản phẩm";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: userText,
                inputs: {
                    product_name: currentProductName,
                    current_product_url: currentProductUrl
                }
            })
        });

        const data = await response.json();
        
        document.getElementById(loadingId).remove();
        
        // HỆ THỐNG SỬ DỤNG TEMPLATE STRING VỚI innerHTML NÊN TỰ ĐỘNG CHẠY ĐƯỢC THẺ <a> TỪ AI TRẢ VỀ
        chatDiv.innerHTML += `
            <div style="background:#ffffff; padding:14px 18px; border-radius:20px 20px 20px 4px; box-shadow:0 2px 12px rgba(0,0,0,0.03); max-width:85%; color:#1e293b; line-height:1.6; align-self:flex-start; border: 1px solid #f1f5f9;">
                <b>Bot PMV:</b> ${data.answer || data.text || "Em đã nhận được câu hỏi ạ..."}
            </div>
        `;
    } catch (error) {
        console.error("Lỗi:", error);
        document.getElementById(loadingId).remove();
        
        chatDiv.innerHTML += `
            <div style="background:#ffffff; padding:14px 18px; border-radius:20px 20px 4px 20px; box-shadow:0 2px 12px rgba(0,0,0,0.03); max-width:85%; color:#1e293b; line-height:1.6; align-self:flex-start; border: 1px solid #f1f5f9;">
                <b>Bot PMV:</b> Xin lỗi, hiện tại hệ thống đang gặp sự cố. Anh/chị thử lại sau nhé!
            </div>
        `;
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
};

window.sendSuggestion = function(text) {
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = text;
        window.sendMessage();
    }
};

window.checkLoginStatus = function() {
    const currentUser = localStorage.getItem('currentUser'); 
    const registerBtn = document.querySelector('.btn-register');
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userDisplay = document.getElementById('user-display');

    if (currentUser) {
        if (registerBtn) registerBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex'; 
        if (userDisplay) userDisplay.textContent = `Xin chào, ${currentUser}`;
    } else {
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (userInfo) userInfo.style.display = 'none';
    }
};

window.logout = function() {
    localStorage.removeItem('currentUser'); 
    localStorage.removeItem('user_token');
    localStorage.removeItem('current_user'); 
    
    alert("Đăng xuất thành công!");
    window.location.href = 'index.html'; 
};

document.addEventListener('DOMContentLoaded', () => {
    fetchProductsFromSheet(); 
    window.checkLoginStatus(); 
    initChat();
    updateCartCount();
    
    if (window.location.pathname.includes('cart.html')) {
        window.renderCartPage();
    }
});