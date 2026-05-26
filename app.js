import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDkW8QBHruMzQztReP3XmGU5sz8MwSlYEU",
    authDomain: "rd-catalog.firebaseapp.com",
    projectId: "rd-catalog",
    storageBucket: "rd-catalog.firebasestorage.app",
    messagingSenderId: "194426515298",
    appId: "1:194426515298:web:9d572c86a9c80b9fcc463b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ==========================================
// 1. FULL SCREEN SLIDER & SWIPE LOGIC
// ==========================================
window.allLotsMedia = {}; // Saare lots ki media yahan save hogi
window.currentModalDocId = null;
window.currentModalIndex = 0;

// Modal Kholne ka function
window.openModal = function (docId, index) {
    window.currentModalDocId = docId;
    window.currentModalIndex = index;
    renderModalMedia();
    document.getElementById("mediaModal").style.display = "flex";
}

// Modal Band Karne ka function
window.closeModal = function () {
    document.getElementById("mediaModal").style.display = "none";
    document.getElementById("modalBody").innerHTML = "";
}

// Media Screen par dikhane ka function
window.renderModalMedia = function () {
    const mediaArray = window.allLotsMedia[window.currentModalDocId];
    const item = mediaArray[window.currentModalIndex];
    const modalBody = document.getElementById("modalBody");

    if (item.type === 'video') {
        modalBody.innerHTML = `<video src="${item.url}" controls autoplay class="modal-content" style="width: 100%; max-height: 90vh; background: transparent;"></video>`;
    } else {
        modalBody.innerHTML = `<img src="${item.url}" class="modal-content" style="width: 100%; max-height: 90vh; object-fit: contain;">`;
    }

    // Left/Right buttons ko hide/show karna (Agar aage photo nahi hai toh button hide ho jayega)
    document.getElementById("prevBtn").style.display = (window.currentModalIndex === 0) ? "none" : "flex";
    document.getElementById("nextBtn").style.display = (window.currentModalIndex === mediaArray.length - 1) ? "none" : "flex";
}

// Button daba kar Next/Prev karne ka function
window.changeMedia = function (direction) {
    const mediaArray = window.allLotsMedia[window.currentModalDocId];
    window.currentModalIndex += direction;

    if (window.currentModalIndex < 0) window.currentModalIndex = 0;
    if (window.currentModalIndex >= mediaArray.length) window.currentModalIndex = mediaArray.length - 1;

    renderModalMedia();
}

// MOBILE TOUCH SWIPE LOGIC
let touchstartX = 0;
let touchendX = 0;

const modalElement = document.getElementById('mediaModal');
if (modalElement) {
    modalElement.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
    });

    modalElement.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

function handleSwipe() {
    if (document.getElementById("mediaModal").style.display !== "flex") return;
    const threshold = 50;
    const mediaArray = window.allLotsMedia[window.currentModalDocId];

    if (touchendX < touchstartX - threshold) {
        // Left Swipe -> Next Photo
        if (window.currentModalIndex < mediaArray.length - 1) changeMedia(1);
    }
    if (touchendX > touchstartX + threshold) {
        // Right Swipe -> Previous Photo
        if (window.currentModalIndex > 0) changeMedia(-1);
    }
}


// ==========================================
// 2. UPLOAD LOGIC (index.html)
// ==========================================
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById("submitBtn");
        const uploadStatus = document.getElementById("uploadStatus");
        const uploadText = document.getElementById("uploadText");
        const progressBar = document.getElementById("progressBar");

        submitBtn.disabled = true;
        submitBtn.innerText = "Files Uploading... Please wait";

        // Progress bar ko dikhana shuru karna
        if (uploadStatus) {
            uploadStatus.style.display = "block";
            progressBar.style.width = "0%";
        }

        const lotOrder = document.getElementById("lotOrder").value;
        const itemName = document.getElementById("itemName").value;
        const lotNumber = document.getElementById("lotNumber").value;
        const lotQuantity = document.getElementById("lotQuantity").value;
        const lotRate = document.getElementById("lotRate").value;

        const slot1 = document.getElementById("mediaSlot1").files[0];
        const slot2 = document.getElementById("mediaSlot2").files[0];
        const slot3 = document.getElementById("mediaSlot3").files[0];

        try {
            let uploadedMedia = [];
            const slotsArray = [slot1, slot2, slot3];

            // Kitni files select ki gayi hain wo check karna
            const validFiles = slotsArray.filter(f => f !== undefined);
            let currentFileIndex = 0;

            for (let i = 0; i < slotsArray.length; i++) {
                const file = slotsArray[i];
                if (file) {
                    currentFileIndex++;
                    const fileType = file.type.includes('video') ? 'video' : 'image';
                    const fileRef = ref(storage, 'lot_media/' + Date.now() + '_slot' + (i + 1) + '_' + file.name);

                    const uploadTask = uploadBytesResumable(fileRef, file);

                    // Percentage Calculate Karne ka Promise Logic
                    await new Promise((resolve, reject) => {
                        uploadTask.on('state_changed',
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                if (progressBar) progressBar.style.width = progress + "%";
                                if (uploadText) uploadText.innerText = `Uploading File ${currentFileIndex} of ${validFiles.length} (${Math.round(progress)}%)`;
                            },
                            (error) => { reject(error); },
                            async () => {
                                const fileURL = await getDownloadURL(uploadTask.snapshot.ref);
                                uploadedMedia.push({ url: fileURL, type: fileType });
                                resolve();
                            }
                        );
                    });
                }
            }

            if (uploadText) uploadText.innerText = "Saving to Database...";

            await addDoc(collection(db, "stock_lots"), {
                order: Number(lotOrder),
                itemName: itemName,
                lotNumber: lotNumber,
                quantity: Number(lotQuantity),
                rate: lotRate,
                media: uploadedMedia,
                timestamp: new Date()
            });

            alert("Product unke sahi media order ke sath upload ho gaya hai! 🎉");
            uploadForm.reset();
            if (typeof fetchStockData === "function") fetchStockData(document.getElementById("adminStockContainer"), true);

        } catch (error) {
            console.error(error);
            alert("Upload fail ho gaya.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Upload Product";
            if (uploadStatus) uploadStatus.style.display = "none"; // Upload ke baad hide kar dena
        }
    });
}


// ==========================================
// 3. RENDER LOGIC (Premium Design)
// ==========================================
function createCardHTML(lot, docId, isAdmin) {
    // Media ko global dictionary mein save karna taaki slider padh sake
    window.allLotsMedia[docId] = lot.media;

    let mediaHTML = `<div class="media-gallery">`;
    lot.media.forEach((item, index) => {
        if (item.type === 'video') {
            // Yahan openModal mein docId aur index dono bhej rahe hain
            mediaHTML += `<video src="${item.url}" class="media-item" onclick="openModal('${docId}', ${index})" autoplay loop muted playsinline></video>`;
        } else {
            mediaHTML += `<img src="${item.url}" class="media-item" onclick="openModal('${docId}', ${index})">`;
        }
    });
    mediaHTML += `</div>`;

    let cardHTML = `
        <div style="background: white; border: 1px solid #ebd9d9; padding: 18px; border-radius: 18px; box-shadow: 0 6px 20px rgba(0,0,0,0.06); margin-bottom: 25px; box-sizing: border-box; width: 100%; position: relative;">
            
            <div style="background: #f8f9fa; display: flex; justify-content: space-between; align-items: baseline; padding: 10px 14px; border-radius: 10px; margin-bottom: 12px; border: 1px solid #f1f3f5;">
                <h3 style="margin: 0; color: #202124; font-size: 19px; font-weight: bold;">${lot.itemName}</h3>
                <span style="color: #6c757d; font-size: 13px; font-weight: 500;">Lot: <strong style="color: #1a73e8; font-size: 14px;">${lot.lotNumber}</strong></span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #ebd9d9; padding: 12px 14px; border-radius: 10px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #6c757d; font-size: 18px;">📦</span>
                    <span style="font-size: 15px; color: #5f6368;">Qty: <strong style="color: #202124; font-size: 16px;">${lot.quantity} Boxes/Kg</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #d93025; font-size: 18px;">₹</span>
                    <span style="font-size: 15px; color: #5f6368;">Rate: <strong style="color: #d93025; font-size: 17px;">${lot.rate}</strong></span>
                </div>
            </div>
            
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #888; text-align: center;">(Bada dekhne ke liye photo/video par click karein)</p>
            ${mediaHTML}
    `;

    if (isAdmin) {
        cardHTML += `
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="edit-btn" data-id="${docId}" data-order="${lot.order}" data-item="${lot.itemName}" data-lot="${lot.lotNumber}" data-qty="${lot.quantity}" data-rate="${lot.rate}" style="flex: 1; background: #e8f0fe; color: #1a73e8; padding: 10px; border: 1px solid #1a73e8; border-radius: 8px; font-weight: bold; cursor: pointer;">✏️ Edit</button>
                <button class="delete-btn" data-id="${docId}" style="flex: 1; background: #fce8e6; color: #d93025; padding: 10px; border: 1px solid #d93025; border-radius: 8px; font-weight: bold; cursor: pointer;">🗑️ Delete</button>
            </div>
        `;
    } else {
        const waMessage = encodeURIComponent(`Hello! Mujhe aapka ye product order karna hai:\nItem: ${lot.itemName}\nLot Number: ${lot.lotNumber}\nRate: ${lot.rate}`);
        cardHTML += `
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <a href="tel:+919887938518" style="flex: 1; text-align: center; background: #1a73e8; color: white; padding: 12px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(26, 115, 232, 0.2);">📞 Call</a>
                <a href="https://wa.me/919887938518?text=${waMessage}" target="_blank" style="flex: 1; text-align: center; background: #25D366; color: white; padding: 12px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(37, 211, 102, 0.2);">💬 WhatsApp</a>
            </div>
        `;
    }
    cardHTML += `</div>`;
    return cardHTML;
}

// ==========================================
// 4. REAL-TIME DATA FETCH LOGIC (Auto-Refresh)
// ==========================================
const fetchStockData = (container, isAdmin) => {
    if (!container) return;
    container.innerHTML = "<p style='text-align:center;'>Loading Catalog...</p>";
    
    try {
        const q = query(collection(db, "stock_lots"), orderBy("order", "asc"));
        
        onSnapshot(q, (querySnapshot) => {
            container.innerHTML = "";
            window.allLotsMedia = {}; 

            // NAYA LOGIC: Total products ginn kar screen par dikhana
            const totalCount = querySnapshot.size;
            
            const adminCountElement = document.getElementById("totalAdminCount");
            if(adminCountElement) adminCountElement.innerText = `Total Products: ${totalCount}`;
            
            const customerCountElement = document.getElementById("totalCustomerCount");
            if(customerCountElement) customerCountElement.innerText = `Total Products: ${totalCount}`;

            if (querySnapshot.empty) {
                container.innerHTML = "<p style='text-align:center;'>Koi product available nahi hai.</p>";
                return;
            }

            querySnapshot.forEach((docSnap) => {
                container.innerHTML += createCardHTML(docSnap.data(), docSnap.id, isAdmin);
            });

            if (isAdmin) {
                document.querySelectorAll(".edit-btn").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        const id = e.target.getAttribute("data-id");
                        
                        const newOrder = prompt("Naya Display Order Number:", e.target.getAttribute("data-order"));
                        const newItem = prompt("Naya Item Name:", e.target.getAttribute("data-item"));
                        const newLot = prompt("Naya Lot Number:", e.target.getAttribute("data-lot"));
                        const newQty = prompt("Nayi Quantity:", e.target.getAttribute("data-qty"));
                        const newRate = prompt("Naya Rate:", e.target.getAttribute("data-rate"));

                        if (newOrder !== null && newItem !== null && newLot !== null && newQty !== null && newRate !== null) {
                            try {
                                const docRef = doc(db, "stock_lots", id);
                                const currentDoc = await getDoc(docRef);
                                let mediaArray = currentDoc.data().media || [];

                                if (mediaArray.length > 1) {
                                    const swapCheck = prompt("Kya aap is product ki photos/videos ka order aapas me badalna (swap) chahte hain? (Type 'yes' to swap, else press Enter):");
                                    if (swapCheck && swapCheck.toLowerCase() === 'yes') {
                                        mediaArray.reverse(); 
                                    }
                                }

                                await updateDoc(docRef, {
                                    order: Number(newOrder),
                                    itemName: newItem,
                                    lotNumber: newLot,
                                    quantity: Number(newQty),
                                    rate: newRate,
                                    media: mediaArray
                                });
                                alert("Sabhi jankariyan aur media order update ho gaya! 👍");
                            } catch (err) {
                                alert("Update karne mein error aayi.");
                            }
                        }
                    });
                });

                document.querySelectorAll(".delete-btn").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        if (confirm("Kya aap sach mein is product ko hatana chahte hain?")) {
                            await deleteDoc(doc(db, "stock_lots", e.target.getAttribute("data-id")));
                            alert("Product delete ho gaya! 🗑️");
                        }
                    });
                });
            }
        }, (error) => {
            console.error(error);
            container.innerHTML = "<p style='text-align:center;'>Data load nahi ho paya.</p>";
        });
        
    } catch (error) {
        console.error(error);
        container.innerHTML = "<p style='text-align:center;'>Setup error.</p>";
    }
};

if (document.getElementById("adminStockContainer")) fetchStockData(document.getElementById("adminStockContainer"), true);
if (document.getElementById("stockContainer")) fetchStockData(document.getElementById("stockContainer"), false);