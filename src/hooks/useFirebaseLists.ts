import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database, sanitizeFirebaseKey } from "../services/firebaseConfig";

export function useFirebaseLists(myUsername: string | null | undefined) {
    const [friends, setFriends] = useState<string[]>([]);
    const [groups, setGroups] = useState<string[]>([]);
    const [friendRequests, setFriendRequests] = useState<string[]>([]);
    const [groupInvites, setGroupInvites] = useState<{group: string, inviter: string}[]>([]);
    const [blocks, setBlocks] = useState<string[]>([]);

    const [hiddenGroups, setHiddenGroups] = useState<string[]>([]);

    useEffect(() => {
        if (!myUsername) return;
        const safeMe = sanitizeFirebaseKey(myUsername);

        // 1. Lắng nghe Friend List
        const friendsRef = ref(database, `users/${safeMe}/friends`);
        const unsubFriends = onValue(friendsRef, (snapshot) => {
            if (snapshot.exists()) {
                setFriends(Object.keys(snapshot.val()));
            } else {
                setFriends([]);
            }
        });

        // 2. Lắng nghe Group List
        const groupsRef = ref(database, `users/${safeMe}/groups`);
        const unsubGroups = onValue(groupsRef, (snapshot) => {
            if (snapshot.exists()) {
                setGroups(Object.keys(snapshot.val()));
            } else {
                setGroups([]);
            }
        });

        // 3. Lắng nghe Friend Requests
        const reqRef = ref(database, `users/${safeMe}/friendRequests`);
        const unsubReq = onValue(reqRef, (snapshot) => {
            if (snapshot.exists()) {
                setFriendRequests(Object.keys(snapshot.val()));
            } else {
                setFriendRequests([]);
            }
        });

        // 4. Lắng nghe Group Invites (Value ở đây là tên người mời)
        const invitesRef = ref(database, `users/${safeMe}/groupInvites`);
        const unsubInvites = onValue(invitesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(groupName => ({
                    group: groupName,
                    inviter: data[groupName]
                }));
                setGroupInvites(list);
            } else {
                setGroupInvites([]);
            }
        });

        // 5. Lắng nghe Blocks
        const blockRef = ref(database, `users/${safeMe}/blocks`);
        const unsubBlock = onValue(blockRef, (snapshot) => {
            if (snapshot.exists()) {
                setBlocks(Object.keys(snapshot.val()));
            } else {
                setBlocks([]);
            }
        });

        const hiddenRef = ref(database, `users/${safeMe}/hiddenGroups`);
        const unsubHidden = onValue(hiddenRef, (snapshot) => {
            if (snapshot.exists()) {
                setHiddenGroups(Object.keys(snapshot.val()));
            } else {
                setHiddenGroups([]);
            }
        });

        return () => {
            unsubFriends();
            unsubGroups();
            unsubReq();
            unsubInvites();
            unsubBlock();
            unsubHidden();
        };
    }, [myUsername]);

    return { friends, groups, friendRequests, groupInvites, blocks,hiddenGroups };
}