import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDxNeJCm4u-9u1mots-oM1l0t8_BeKeo_o",
    authDomain: "frontendproject-62f39.firebaseapp.com",
    databaseURL: "https://frontendproject-62f39-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "frontendproject-62f39",
    storageBucket: "frontendproject-62f39.firebasestorage.app",
    messagingSenderId: "48876159496",
    appId: "1:48876159496:web:3e2496bcc99509767bc7bd",
    measurementId: "G-01SVVT8DJ2"
};


const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

export const saveAvatarToFirebase = (username: string, avatarUrl: string) => {
    const userRef = ref(database, 'users/' + username);
    set(userRef, {
        avatar: avatarUrl
    }).catch(err => console.error("Lỗi lưu Firebase:", err));
};

export const getAvatarFromFirebase = async (username: string): Promise<string | null> => {
    const userRef = ref(database, 'users/' + username + '/avatar');
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
    } catch (error) {
        console.error(error);
    }
    return null;
};