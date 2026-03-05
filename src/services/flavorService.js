import { supabase } from '../supabaseClient';

export const flavorService = {
    // GET /flavors
    getAll: async () => {
        const { data, error } = await supabase
            .from('flavors')
            .select('*')
            // .eq('is_active', true) // Column might not exist in current schema on server
            .order('name');
        
        if (error) throw error;
        return data;
    },

    // POST /flavors
    create: async (flavorData) => {
        const { data, error } = await supabase
            .from('flavors')
            .insert(flavorData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // PUT /flavors/:id
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('flavors')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // DELETE /flavors/:id (Hard delete if no is_active)
    delete: async (id) => {
        const { data, error } = await supabase
            .from('flavors')
            .delete()
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }
};
