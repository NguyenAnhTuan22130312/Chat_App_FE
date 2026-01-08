import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebaseConfig';


export function useUserAvatar(username: string | null | undefined) {
    const [avatar, setAvatar] = useState<string>("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7imMwm5oKZ8t3qnhAptR3ZzpD-i2AuSiHoQ&s");

    useEffect(() => {
        if (!username) return;

        const avatarRef = ref(database, `users/${username}/avatar`);
        
        const unsubscribe = onValue(avatarRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setAvatar(data);
            } else {
                setAvatar(`https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7imMwm5oKZ8t3qnhAptR3ZzpD-i2AuSiHoQ&s`);
            }
        });

        return () => unsubscribe();
    }, [username]);

    return avatar;
}