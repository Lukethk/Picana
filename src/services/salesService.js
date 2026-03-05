
import { supabase } from '../supabaseClient';

export const salesService = {
    // POST /sales
    createSale: async (saleData) => {
        // saleData: { total, payment_method, items: [{ product_id, quantity, unit_price }] }
        
        // 1. Create Sale Header
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert({
                total: saleData.total,
                payment_method: saleData.payment_method,
                status: 'completed'
            })
            .select()
            .single();

        if (saleError) throw saleError;

        // 2. Create Sale Items
        const itemsToInsert = saleData.items.map(item => ({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            options: item.options || {} // Include options (toppings/flavors)
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        return { ...sale, items: itemsToInsert };
    },

    // GET /sales
    getHistory: async (filters = {}) => {
        let query = supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('created_at', { ascending: false });

        if (filters.date) {
            // Filter by date range (start of day to end of day)
            const start = new Date(filters.date);
            start.setHours(0,0,0,0);
            const end = new Date(filters.date);
            end.setHours(23,59,59,999);
            
            query = query.gte('created_at', start.toISOString())
                         .lte('created_at', end.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // GET /sales/:id/items
    getSaleDetails: async (saleId) => {
        const { data, error } = await supabase
            .from('sale_items')
            .select('*, products(name)')
            .eq('sale_id', saleId);
            
        if (error) throw error;
        return data;
    }
};
