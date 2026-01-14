import { ref, set, get, update, remove, onValue } from "firebase/database";
import { database, sanitizeFirebaseKey } from "./firebaseConfig";

// Giới hạn whitelist như bạn yêu cầu
const MAX_WHITELIST_SIZE = 4;

/**
 * Hàm kiểm tra xem user hiện tại có thể add thêm bạn/nhóm không
 * Trả về true nếu CÒN CHỖ, false nếu ĐÃ FULL
 */
export const checkCanAddMore = async (myUsername: string): Promise<boolean> => {
    const safeMe = sanitizeFirebaseKey(myUsername);

    // Lấy list bạn bè
    const friendsSnapshot = await get(ref(database, `users/${safeMe}/friends`));
    const friendsCount = friendsSnapshot.exists() ? Object.keys(friendsSnapshot.val()).length : 0;

    // Lấy list nhóm
    const groupsSnapshot = await get(ref(database, `users/${safeMe}/groups`));
    const groupsCount = groupsSnapshot.exists() ? Object.keys(groupsSnapshot.val()).length : 0;

    const total = friendsCount + groupsCount;
    console.log(`Current whitelist size: ${total}/${MAX_WHITELIST_SIZE}`);

    return total < MAX_WHITELIST_SIZE;
};

// ==========================================
// 1. GỬI YÊU CẦU KẾT BẠN
// ==========================================
export const sendFriendRequest = async (myUsername: string, targetUsername: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeTarget = sanitizeFirebaseKey(targetUsername);

    // Lưu yêu cầu vào node 'friendRequests' của người nhận
    // users -> target -> friendRequests -> me : true
    const requestRef = ref(database, `users/${safeTarget}/friendRequests/${safeMe}`);

    try {
        await set(requestRef, true);
        console.log("Đã gửi lời mời kết bạn tới Firebase");
        // LƯU Ý: Ở UI, sau khi gọi hàm này, bạn phải gọi socketService.sendMessage()
        // 1 lần tới user kia theo logic của server thầy Long.
    } catch (error) {
        console.error("Lỗi gửi kết bạn:", error);
        throw error;
    }
};

// ==========================================
// 2. CHẤP NHẬN KẾT BẠN (QUAN TRỌNG: CHECK LIMIT)
// ==========================================
export const acceptFriendRequest = async (myUsername: string, requesterUsername: string) => {
    const canAdd = await checkCanAddMore(myUsername);
    if (!canAdd) {
        throw new Error(`Danh sách của bạn đã đầy (${MAX_WHITELIST_SIZE} người/nhóm). Hãy xóa bớt trước khi chấp nhận.`);
    }

    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeRequester = sanitizeFirebaseKey(requesterUsername);

    // Update nguyên tử (Atomic update) để đảm bảo dữ liệu nhất quán
    const updates: any = {};

    // 1. Thêm requester vào list friends của mình
    updates[`users/${safeMe}/friends/${safeRequester}`] = true;
    // 2. Thêm mình vào list friends của requester (kết bạn 2 chiều)
    updates[`users/${safeRequester}/friends/${safeMe}`] = true;
    // 3. Xóa lời mời trong friendRequests
    updates[`users/${safeMe}/friendRequests/${safeRequester}`] = null;

    try {
        await update(ref(database), updates);
        console.log("Đã chấp nhận kết bạn!");
        // LƯU Ý: Ở UI, bạn cũng nên bắn 1 tin nhắn "Hello" tự động để server socket nhận diện user.
    } catch (error) {
        console.error("Lỗi chấp nhận kết bạn:", error);
        throw error;
    }
};

// ==========================================
// 3. TỪ CHỐI / HỦY KẾT BẠN / XÓA BẠN
// ==========================================
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
    // Xóa cả 2 chiều
    updates[`users/${safeMe}/friends/${safeFriend}`] = null;
    updates[`users/${safeFriend}/friends/${safeMe}`] = null;

    await update(ref(database), updates);
};

// ==========================================
// 4. CHẶN (BLOCK)
// ==========================================
export const blockUser = async (myUsername: string, targetUsername: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeTarget = sanitizeFirebaseKey(targetUsername);

    const updates: any = {};
    // Thêm vào danh sách block
    updates[`users/${safeMe}/blocks/${safeTarget}`] = true;
    // Nếu đang là bạn bè thì xóa luôn
    updates[`users/${safeMe}/friends/${safeTarget}`] = null;
    // Không xóa bên kia để bên kia vẫn thấy mình (nhưng mình ko nhận tin) - hoặc tùy logic bạn

    await update(ref(database), updates);
};

export const unblockUser = async (myUsername: string, targetUsername: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const safeTarget = sanitizeFirebaseKey(targetUsername);
    await remove(ref(database, `users/${safeMe}/blocks/${safeTarget}`));
};

export const inviteUserToGroup = async (targetUsername: string, groupName: string, inviterName: string) => {
    const safeTarget = sanitizeFirebaseKey(targetUsername);
    const inviteRef = ref(database, `users/${safeTarget}/groupInvites/${groupName}`);
    await set(inviteRef, inviterName); // Lưu tên người mời để hiển thị "A đã mời bạn vào nhóm B"
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

// Rời nhóm
export const leaveGroup = async (myUsername: string, groupName: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    await remove(ref(database, `users/${safeMe}/groups/${groupName}`));
};
export const addGroupToFirebase = async (myUsername: string, groupName: string) => {
    const safeMe = sanitizeFirebaseKey(myUsername);
    const updates: any = {};

    // Thêm vào node groups: { "TenNhom": true }
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

    // Xóa khỏi danh sách chính
    updates[`users/${safeMe}/groups/${groupName}`] = null;
    // Thêm vào danh sách ẩn
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