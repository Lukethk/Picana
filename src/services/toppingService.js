import { supabase } from '../supabaseClient';

export const toppingService = {
    // GET /toppings
    getAll: async () => {
        const { data, error } = await supabase
            .from('toppings')
            .select('*')
            // .eq('is_active', true)
            .order('name');
        
        if (error) throw error;
        return data;
    },

    // POST /toppings
    create: async (toppingData) => {
        const { data, error } = await supabase
            .from('toppings')
            .insert(toppingData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // PUT /toppings/:id
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('toppings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // DELETE /toppings/:id (Hard delete)
    delete: async (id) => {
        const { data, error } = await supabase
            .from('toppings')
            .delete()
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }
};
