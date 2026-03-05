
import { supabase } from '../supabaseClient';

export const inventoryService = {
    // GET /inventory
    getAll: async () => {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('name');
            
        if (error) throw error;
        return data;
    },

    // PATCH /inventory/:id
    adjustStock: async (id, quantity) => {
        const { data, error } = await supabase
            .from('inventory')
            .update({ quantity })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    // GET /inventory/alerts
    getAlerts: async () => {
        // This is tricky with simple queries, best to fetch all and filter in client
        // or use a stored procedure/view if performance is critical
        const { data, error } = await supabase
            .from('inventory')
            .select('*');
            
        if (error) throw error;
        return data.filter(item => item.quantity <= item.min_stock);
    }
};
