import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../client';

interface AuthState {
    session: Session | null;
    user: User | null;
    loading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        session: null,
        user: null,
        loading: true,
    });

    useEffect(() => {
        // Get initial session
        if (!supabase) {
            setAuthState(prev => ({ ...prev, loading: false }));
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setAuthState({
                session,
                user: session?.user ?? null,
                loading: false,
            });
        });

        // Listen for auth changes
        if (!supabase) return;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
            setAuthState({
                session,
                user: session?.user ?? null,
                loading: false,
            });
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signUp = async (email: string, password: string, username: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    display_name: username,
                },
            },
        });
        return { data, error };
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    return {
        ...authState,
        signIn,
        signUp,
        signOut,
    };
}
