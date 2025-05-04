if (process.env.FIRESTORE_EMULATOR_HOST) {
    const { initializeApp } = require("firebase/app");
    const {
        getFirestore,
        connectFirestoreEmulator,
    } = require("firebase/firestore");
    const app = initializeApp({ projectId: "test" });
    const db = getFirestore(app);
    connectFirestoreEmulator(db, "localhost", 8080);
    module.exports = { db };
} else {
    // Cấu hình Firestore production
}
