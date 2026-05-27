const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

// ✅ Customer ko Topic Subscribe karne ka Function
exports.subscribeToTopic = onCall(async (request) => {
    const token = request.data.token;
    await admin.messaging().subscribeToTopic(token, "all_customers");
    return { success: true };
});

// ✅ Jab naya product ADD ho
exports.notifyOnNewProduct = onDocumentCreated("stock_lots/{lotId}", async (event) => {
    const newProduct = event.data.data();
    const message = {
        notification: {
            title: "🆕 Naya Stock Aa Gaya!",
            body: `${newProduct.itemName} - Rate: ${newProduct.rate}`
        },
        topic: "all_customers"
    };
    await admin.messaging().send(message);
});

// ✅ Jab product UPDATE ho
exports.notifyOnUpdateProduct = onDocumentUpdated("stock_lots/{lotId}", async (event) => {
    const updatedProduct = event.data.after.data();
    const message = {
        notification: {
            title: "🔄 Stock Update Hua!",
            body: `${updatedProduct.itemName} - Naya Rate: ${updatedProduct.rate}`
        },
        topic: "all_customers"
    };
    await admin.messaging().send(message);
});