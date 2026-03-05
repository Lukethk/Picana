
import { supabase } from '../supabaseClient';

export const settingsService = {
    // GET /business-settings
    getSettings: async () => {
        const { data, error } = await supabase
            .from('business_settings')
            .select('*')
            .maybeSingle(); // Use maybeSingle to avoid 406 on 0 rows
            
        if (error) throw error;
        return data;
    },

    // PUT /business-settings
    updateSettings: async (settings) => {
        // Upsert based on ID if exists, or create new
        const { data, error } = await supabase
            .from('business_settings')
            .upsert(settings)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }
};

export const userService = {
    // GET /profiles
    getAll: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
            
        if (error) throw error;
        return data;
    }
};
