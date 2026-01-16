import { initializeApp } from "firebase/app";

import { getDatabase, ref, set, onValue, get, remove } from "firebase/database";


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

export const sanitizeFirebaseKey = (key: any) => {
    if (key === null || key === undefined) return "";
    const strKey = String(key); 
    return strKey
        .replace(/\./g, '_dot_')
        .replace(/#/g, '_hash_')
        .replace(/\$/g, '_dollar_')
        .replace(/\[/g, '_bracket_open_')
        .replace(/\]/g, '_bracket_close_')
        .replace(/@/g, '_at_'); 
};

export const saveAvatarToFirebase = (username: string, avatarUrl: string) => {
    const safeUsername = sanitizeFirebaseKey(username);
    const userRef = ref(database, 'users/' + safeUsername + '/avatar');
    set(userRef, avatarUrl).catch(err => console.error("Lỗi lưu Firebase:", err));
};

const getChatKey = (user1: string, user2: string) => {
    return [user1, user2].sort().join('_'); 
};

export const savePinnedMessageToFirebase = (
    currentUser: string,
    targetUser: string,
    message: any,
    type: 'room' | 'people'
  ) => {   
    const chatKey = type === 'room' ? targetUser : getChatKey(currentUser, targetUser);
    const pinRef = ref(database, `pins/${chatKey}`);
  
    const safeMessage = {   
      messageId: message.messageId 
        || `${message.name}_${message.createAt}`,
      mes: message.mes,
      name: message.name,
      createAt: message.createAt,
      type: message.type,
      to: message.to,
      replyTo: message.replyTo ?? null
    };
  
    set(pinRef, safeMessage)
      .catch(err => console.error("Lỗi ghim:", err));
  };
  
  

export const removePinnedMessageFromFirebase = (currentUser: string, targetUser: string, type: 'room' | 'people') => {
    const chatKey = type === 'room' ? targetUser : getChatKey(currentUser, targetUser);
    const pinRef = ref(database, `pins/${chatKey}`);
    
    remove(pinRef).catch(err => console.error("Lỗi bỏ ghim:", err));
};

export const listenForPinnedMessages = (currentUser: string, targetUser: string, type: 'room' | 'people', callback: (msg: any) => void) => {
    const chatKey = type === 'room' ? targetUser : getChatKey(currentUser, targetUser);
    const pinRef = ref(database, `pins/${chatKey}`);

    const unsubscribe = onValue(pinRef, (snapshot) => {
        const data = snapshot.val();
        callback(data); 
    });

    return unsubscribe;
};

export const getAvatarFromFirebase = async (
    name: string,
    type: 'user' | 'group' | 'auto' = 'auto',
    currentUserName?: string // Tham số thứ 3: Tên người dùng hiện tại (Optional)
): Promise<string | null> => {
    const safeName = sanitizeFirebaseKey(name);
    let searchType = type;

    try {
        if (currentUserName && type === 'auto') {
            const safeCurrentUser = sanitizeFirebaseKey(currentUserName);
            const checkGroupRef = ref(database, `users/${safeCurrentUser}/groups/${safeName}`);
            const checkSnapshot = await get(checkGroupRef);

            if (checkSnapshot.exists()) {
                searchType = 'group';
                console.log(`[SmartCheck] ${name} là Group của ${currentUserName}`);
            } else {
                searchType = 'user';
                console.log(`[SmartCheck] ${name} là User/Friend của ${currentUserName}`);
            }
        }

        if (searchType === 'user') {
            const userSnapshot = await get(ref(database, 'users/' + safeName + '/avatar'));
            if (userSnapshot.exists()) return userSnapshot.val();
        }
        else if (searchType === 'group') {
            const groupSnapshot = await get(ref(database, 'groups/' + safeName + '/avatar'));
            if (groupSnapshot.exists()) return groupSnapshot.val();
        }
        else {
            const userSnapshot = await get(ref(database, 'users/' + safeName + '/avatar'));
            if (userSnapshot.exists()) return userSnapshot.val();


            const groupSnapshot = await get(ref(database, 'groups/' + safeName + '/avatar'));
            if (groupSnapshot.exists()) return groupSnapshot.val();
        }

    } catch (error) {
        console.error("Lỗi lấy avatar:", error);
    }

    return null;
};

export const toggleReactionToFirebase = async (
    currentUser: string,
    targetUser: string,
    type: 'room' | 'people',
    message: any,
    emoji: string
) => {
    const chatKey = type === 'room' ? targetUser : getChatKey(currentUser, targetUser);
    const rawMessageId = message.id || `${message.name}_${message.createAt}`;
    const safeMessageId = sanitizeFirebaseKey(rawMessageId);

    const reactionRef = ref(database, `reactions/${chatKey}/${safeMessageId}/${emoji}`);

    try {
        const snapshot = await get(reactionRef);
        let users: string[] = [];
        if (snapshot.exists()) {
            users = snapshot.val();
        }

        const userIndex = users.indexOf(currentUser);
        if (userIndex > -1) {
            users.splice(userIndex, 1); 
        } else {
            users.push(currentUser); 
        }

        if (users.length === 0) {
            await remove(reactionRef); 
        } else {
            await set(reactionRef, users);
        }
    } catch (error) {
        console.error("Lỗi toggle reaction:", error);
    }
};

export const listenForReactions = (
    currentUser: string,
    targetUser: string,
    type: 'room' | 'people',
    callback: (data: any) => void
) => {
    const chatKey = type === 'room' ? targetUser : getChatKey(currentUser, targetUser);
    const reactionsRef = ref(database, `reactions/${chatKey}`);

    const unsubscribe = onValue(reactionsRef, (snapshot) => {
        const data = snapshot.val(); 
        callback(data);
    });

    return unsubscribe;
};
export const saveGroupAvatarToFirebase = (groupName: string, avatarUrl: string) => {
    const safeGroupName = sanitizeFirebaseKey(groupName);
    const groupRef = ref(database, 'groups/' + safeGroupName + '/avatar');
    set(groupRef, avatarUrl).catch(err => console.error("Lỗi lưu Group Avatar:", err));
};
