
import { supabase } from '../supabaseClient';

export const salesService = {
    // POST /sales
    createSale: async (saleData) => {
        // 1. Create Sale Header
        const saleInsert = {
            total: saleData.total,
            payment_method: saleData.payment_method,
            status: 'completed'
        };
        if (saleData.customer_name) saleInsert.customer_name = saleData.customer_name;
        if (saleData.customer_document) saleInsert.customer_document = saleData.customer_document;

        let sale, saleError;
        {
            const res = await supabase
                .from('sales')
                .insert(saleInsert)
                .select()
                .single();
            sale = res.data;
            saleError = res.error;
        }

        // If customer columns don't exist, retry without them
        if (saleError && String(saleError.message || '').toLowerCase().includes('customer_')) {
            const res2 = await supabase
                .from('sales')
                .insert({ total: saleData.total, payment_method: saleData.payment_method, status: 'completed' })
                .select()
                .single();
            sale = res2.data;
            saleError = res2.error;
        }

        if (saleError) throw saleError;

        // 2. Create Sale Items
        const itemsToInsert = saleData.items.map(item => ({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            options: item.options || {}
        }));

        let itemsError;
        {
            const res = await supabase
                .from('sale_items')
                .insert(itemsToInsert);
            itemsError = res.error;
        }

        if (itemsError && String(itemsError.message || '').toLowerCase().includes("could not find the 'options' column")) {
            const itemsWithoutOptions = saleData.items.map(item => ({
                sale_id: sale.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
            }));

            const retry = await supabase
                .from('sale_items')
                .insert(itemsWithoutOptions);

            if (retry.error) throw retry.error;
            return { ...sale, items: itemsWithoutOptions };
        }

        if (itemsError) throw itemsError;

        return { ...sale, items: itemsToInsert };
    },

    // GET /sales with pagination
    getHistory: async (filters = {}) => {
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;

        let query = supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

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
    },

    deleteSale: async (saleId) => {
        const { error: itemsError } = await supabase
            .from('sale_items')
            .delete()
            .eq('sale_id', saleId);

        if (itemsError) throw itemsError;

        const { data, error } = await supabase
            .from('sales')
            .delete()
            .eq('id', saleId)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('No se pudo eliminar la venta (no encontrada o sin permisos).');
        return data;
    }
};
