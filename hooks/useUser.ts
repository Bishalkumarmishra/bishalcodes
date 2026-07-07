
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
// @ts-ignore
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';
// @ts-ignore
import { User } from 'firebase/auth';

const INITIAL_FREE_CREDITS = 3;

export const useUser = () => {
    const [user, loadingAuth, authError] = useAuthState(auth);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        if (loadingAuth) {
            setLoadingProfile(true);
            return;
        }
        if (!user) {
            setUserProfile(null);
            setLoadingProfile(false);
            return;
        }

        const userRef = doc(db, 'users', user.uid);
        
        // Use onSnapshot for real-time credit updates
        const unsubscribe = onSnapshot(userRef, async (docSnap) => {
            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
                setLoadingProfile(false);
            } else {
                // First login: Create user profile with free credits
                console.log("Creating new user profile...");
                const newUserProfile: UserProfile = {
                    uid: user.uid,
                    email: user.email!,
                    displayName: user.displayName || user.email!.split('@')[0],
                    credits: INITIAL_FREE_CREDITS,
                };
                try {
                    await setDoc(userRef, newUserProfile);
                    setUserProfile(newUserProfile);
                } catch (error) {
                    console.error("Failed to create user profile:", error);
                } finally {
                    setLoadingProfile(false);
                }
            }
        }, (error) => {
            console.error("Error listening to user profile:", error);
            setLoadingProfile(false);
        });

        // Cleanup listener on component unmount or user change
        return () => unsubscribe();

    }, [user, loadingAuth]);
    
    const consumeCredit = async (): Promise<boolean> => {
        if (!user || !userProfile || userProfile.credits < 1) {
            console.warn("Credit consumption failed: No user or insufficient credits.");
            return false;
        }

        const userRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userRef, {
                credits: increment(-1),
            });
            // The onSnapshot listener will handle the UI update automatically.
            return true;
        } catch (error) {
            console.error("Failed to consume credit in Firestore:", error);
            return false;
        }
    };

    return { user, userProfile, loading: loadingAuth || loadingProfile, consumeCredit, authError };
};
