import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebaseConfig';

const sanitizeFirebaseKey = (key: string): string => {
    if (!key) return "";
    return key
        .replace(/\./g, '_dot_')
        .replace(/#/g, '_hash_')
        .replace(/\$/g, '_dollar_')
        .replace(/\[/g, '_bracket_open_')
        .replace(/\]/g, '_bracket_close_')
        .replace(/@/g, '_at_');
};

export function useUserAvatar(
    name: string | null | undefined,
    type: 'room' | 'people' | 'auto' = 'auto'
) {
    const [avatar, setAvatar] = useState<string>("https://i.imgur.com/HeIi0wU.png");

    useEffect(() => {
        if (!name) return;
        const safeName = sanitizeFirebaseKey(name);
        let dbPath = `users/${safeName}/avatar`;

        if (type === 'room') {
            dbPath = `groups/${safeName}/avatar`;
        } else if (type === 'people') {
            dbPath = `users/${safeName}/avatar`;
        }


        const avatarRef = ref(database, dbPath);

        const unsubscribe = onValue(avatarRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setAvatar(data);
            } else {
                setAvatar("https://i.imgur.com/HeIi0wU.png");
            }
        });

        return () => unsubscribe();
    }, [name, type]);

    return avatar;
}