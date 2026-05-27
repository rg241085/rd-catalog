const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

exports.subscribeToTopic = onCall(async (request) => {
    const token = request.data.token;
    await admin.messaging().subscribeToTopic(token, "all_customers");
    return { success: true };
});

exports.notifyOnNewProduct = onDocumentCreated("stock_lots/{lotId}", async (event) => {
    const newProduct = event.data.data();
    const message = {
        notification: {
            title: "🆕 Naya Stock Aa Gaya!",
            body: `${newProduct.itemName} - Rate: ${newProduct.rate}`
        },
        // ✅ NAYA - Click karne par yahan jaao
        webpush: {
            fcm_options: {
                link: "https://rg241085.github.io/rd-catalog/code.html"
            }
        },
        topic: "all_customers"
    };
    await admin.messaging().send(message);
});

exports.notifyOnUpdateProduct = onDocumentUpdated("stock_lots/{lotId}", async (event) => {
    const updatedProduct = event.data.after.data();
    const message = {
        notification: {
            title: "🔄 Stock Update Hua!",
            body: `${updatedProduct.itemName} - Naya Rate: ${updatedProduct.rate}`
        },
        // ✅ NAYA - Click karne par yahan jaao
        webpush: {
            fcm_options: {
                link: "https://rg241085.github.io/rd-catalog/code.html"
            }
        },
        topic: "all_customers"
    };
    await admin.messaging().send(message);
});