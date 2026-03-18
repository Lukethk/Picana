import { supabase } from '../supabaseClient';

export const authService = {
    // Login with email and password
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    // Logout
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Get current user session
    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    // Subscribe to auth state changes
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange((_event, session) => {
            callback(session);
        });
    },

    // Update password
    updatePassword: async (newPassword) => {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return data;
    }
};
