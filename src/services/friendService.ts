import { ref, set, get, update, remove, onValue ,push, off} from "firebase/database";
import { database, sanitizeFirebaseKey } from "./firebaseConfig";

const MAX_WHITELIST_SIZE = 4;
export const checkCanAddMore = async (myUsername: string): Promise<boolean> => {
    const safeMe = sanitizeFirebaseKey(myUsername);

    const friendsSnapshot = await get(ref(database, `users/${safeMe}/friends`));
    const friendsCount = friendsSnapshot.exists() ? Object.keys(friendsSnapshot.val()).length : 0;

    const groupsSnapshot = await get(ref(database, `users/${safeMe}/groups`));
    const groupsCount = groupsSnapshot.exists() ? Object.keys(groupsSnapshot.val()).length : 0;

    const total = friendsCount + groupsCount;
    console.log(`Current whitelist size: ${total}/${MAX_WHITELIST_SIZE}`);

    return total < MAX_WHITELIST_SIZE;
};

export const sendFriendRequest = async (myUsername: string, targetUsername: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeTarget = sanitizeFirebaseKey(targetUsername);

    const requestRef = ref(database, `users/${safeTarget}/friendRequests/${safeMe}`);

    try {
        await set(requestRef, true);
        console.log("Đã gửi lời mời kết bạn tới Firebase");
    } catch (error) {
        console.error("Lỗi gửi kết bạn:", error);
        throw error;
    }
};

export const acceptFriendRequest = async (myUsername: string, requesterUsername: string) => {
    const canAdd = await checkCanAddMore(myUsername);
    if (!canAdd) {
        throw new Error(`Danh sách của bạn đã đầy (${MAX_WHITELIST_SIZE} người/nhóm). Hãy xóa bớt trước khi chấp nhận.`);
    }

    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeRequester = sanitizeFirebaseKey(requesterUsername);

    const updates: any = {};

    updates[`users/${safeMe}/friends/${safeRequester}`] = true;
    updates[`users/${safeRequester}/friends/${safeMe}`] = true;
    updates[`users/${safeMe}/friendRequests/${safeRequester}`] = null;

    try {
        await update(ref(database), updates);
        console.log("Đã chấp nhận kết bạn!");
    } catch (error) {
        console.error("Lỗi chấp nhận kết bạn:", error);
        throw error;
    }
};

export const rejectFriendRequest = async (myUsername: string, requesterUsername: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeRequester = sanitizeFirebaseKey(requesterUsername);

    // Chỉ cần xóa khỏi node requests
    const refToDelete = ref(database, `users/${safeMe}/friendRequests/${safeRequester}`);
    await remove(refToDelete);
};

export const unfriend = async (myUsername: string, friendUsername: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeFriend = sanitizeFirebaseKey(friendUsername);

    const updates: any = {};
    updates[`users/${safeMe}/friends/${safeFriend}`] = null;
    updates[`users/${safeFriend}/friends/${safeMe}`] = null;

    await update(ref(database), updates);
};

export const blockUser = async (myUsername: string, targetUsername: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeTarget = sanitizeFirebaseKey(targetUsername);

    const updates: any = {};
    updates[`users/${safeMe}/blocks/${safeTarget}`] = true;
    updates[`users/${safeMe}/friends/${safeTarget}`] = null;

    await update(ref(database), updates);
};

export const unblockUser = async (myUsername: string, targetUsername: string) => {
    const canAdd = await checkCanAddMore(myUsername);

    if (!canAdd) {
        throw new Error("Danh sách bạn bè đã đầy. Không thể bỏ chặn và thêm lại người này.");
    }

    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeTarget = sanitizeFirebaseKey(targetUsername);
    const updates: any = {};
    updates[`users/${safeMe}/blocks/${safeTarget}`] = null;
    updates[`users/${safeMe}/friends/${safeTarget}`] = true;
    await update(ref(database), updates);
    console.log(`Đã bỏ chặn và kết bạn lại với ${targetUsername}`);
};

export const inviteUserToGroup = async (targetUsername: string, groupName: string, inviterName: string) => {
    const safeTarget = sanitizeFirebaseKey(targetUsername);
    const inviteRef = ref(database, `users/${safeTarget}/groupInvites/${groupName}`);
    await set(inviteRef, inviterName);
};

export const acceptGroupInvite = async (myUsername: string, groupName: string) => {
    const canAdd = await checkCanAddMore(myUsername);
    if (!canAdd) {
        throw new Error(`Danh sách đã đầy. Không thể tham gia thêm nhóm.`);
    }
    const safeMe = sanitizeFirebaseKey(myUsername);
    const updates: any = {};
    updates[`users/${safeMe}/groups/${groupName}`] = true;
    updates[`users/${safeMe}/groupInvites/${groupName}`] = null;
    await update(ref(database), updates);
};

export const rejectGroupInvite = async (myUsername: string, groupName: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    await remove(ref(database, `users/${safeMe}/groupInvites/${groupName}`));
};

export const leaveGroup = async (myUsername: string, groupName: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    await remove(ref(database, `users/${safeMe}/groups/${groupName}`));
};
export const addGroupToFirebase = async (myUsername: string, groupName: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const updates: any = {};

    updates[`users/${safeMe}/groups/${groupName}`] = true;

    try {
        await update(ref(database), updates);
        console.log(`🔥 Đã lưu nhóm [${groupName}] vào Firebase`);
    } catch (error) {
        console.error("Lỗi lưu nhóm Firebase:", error);
    }

};
export const hideGroup = async (myUsername: string, groupName: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const updates: any = {};

    updates[`users/${safeMe}/groups/${groupName}`] = null;
    updates[`users/${safeMe}/hiddenGroups/${groupName}`] = true;

    await update(ref(database), updates);
};

export const unhideGroup = async (myUsername: string, groupName: string) => {
    const canAdd = await checkCanAddMore(myUsername);
    if (!canAdd) {
        throw new Error("Danh sách chính đã đầy (4/4). Hãy ẩn bớt nhóm hoặc xóa bạn bè trước.");
    }

    const safeMe = sanitizeFirebaseKey(myUsername);
    const updates: any = {};

    updates[`users/${safeMe}/hiddenGroups/${groupName}`] = null;
    updates[`users/${safeMe}/groups/${groupName}`] = true;

    await update(ref(database), updates);
};
export const getChatId = (name1: string, name2: string, type: 'people' | 'room') => {
    if (type === 'room') return sanitizeFirebaseKey(name1);
    const sorted = [name1, name2].sort();
    return sanitizeFirebaseKey(`${sorted[0]}_${sorted[1]}`);
};
export const saveChatImage = async (currentName: string, myUsername: string, type: 'people' | 'room', imageUrl: string) => {
    const chatId = getChatId(currentName, myUsername, type);
    const mediaRef = ref(database, `chat_media/${chatId}`);

    const newImageRef = push(mediaRef);

    await set(newImageRef, {
        url: imageUrl,
        sender: myUsername,
        timestamp: new Date().toISOString()
    });
    console.log("📸 Đã lưu ảnh vào Firebase Media");
};

export const subscribeToChatImages = (
    currentName: string,
    myUsername: string,
    type: 'people' | 'room',
    callback: (images: string[]) => void
) => {
    const chatId = getChatId(currentName, myUsername, type);
    const mediaRef = ref(database, `chat_media/${chatId}`);

    const unsubscribe = onValue(mediaRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const urls = Object.values(data).map((item: any) => item.url).reverse();
            callback(urls);
        } else {
            callback([]);
        }
    });

    return unsubscribe;
};