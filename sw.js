self.addEventListener('install', (e) => {
    console.log('App Installed Successfully');
});
self.addEventListener('fetch', (e) => {
    // Firebase apna data khud handle karta hai, isliye ise khali rakhenge
});