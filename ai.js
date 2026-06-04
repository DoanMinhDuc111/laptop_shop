const API_KEY = 'app-O9OfHClfqKd9sgzCfIiPOHV4';
const API_URL = 'https://api.dify.ai/v1/chat-messages'; 

async function sendMessageToDify(userMessage, productName = "None", currentProductUrl = "", conversationId = "") {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            // Khai báo các biến khớp hoàn toàn với cấu hình Dify của bạn
            inputs: {
                product_name: productName,
                current_product_url: currentProductUrl
            },
            query: userMessage,
            response_mode: 'blocking',
            conversation_id: conversationId,
            user: 'user-123'
        })
    });
    
    const data = await response.json();
    return data; 
}