
import { supabase } from '../supabaseClient';

export const reportService = {
    // GET /reports/daily-summary
    getDailySummary: async () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const { data: sales, error } = await supabase
            .from('sales')
            .select('total, payment_method')
            .gte('created_at', today.toISOString());

        if (error) throw error;

        const summary = {
            totalSales: sales.reduce((sum, s) => sum + Number(s.total), 0),
            transactionCount: sales.length,
            averageTicket: sales.length ? (sales.reduce((sum, s) => sum + Number(s.total), 0) / sales.length) : 0,
            paymentMethods: sales.reduce((acc, s) => {
                acc[s.payment_method] = (acc[s.payment_method] || 0) + 1;
                return acc;
            }, {})
        };

        return summary;
    },

    // GET /reports/hourly-sales (Simulated with JS aggregation)
    getHourlySales: async (date = new Date()) => {
        const start = new Date(date);
        start.setHours(0,0,0,0);
        const end = new Date(date);
        end.setHours(23,59,59,999);

        const { data: sales, error } = await supabase
            .from('sales')
            .select('created_at, total')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        if (error) throw error;

        // Aggregate by hour
        const hourly = new Array(24).fill(0);
        sales.forEach(s => {
            const hour = new Date(s.created_at).getHours();
            hourly[hour] += Number(s.total);
        });

        return hourly.map((total, hour) => ({ hour, total }));
    },

    // GET /reports/top-products
    getTopProducts: async () => {
        // Requires join or view for efficiency. 
        // For prototype: fetch items and aggregate in JS
        const { data: items, error } = await supabase
            .from('sale_items')
            .select('product_id, quantity, products(name)')
            .limit(1000); // Limit for safety

        if (error) throw error;

        const productMap = {};
        items.forEach(item => {
            const pid = item.product_id;
            const pname = item.products?.name || 'Unknown';
            if (!productMap[pid]) productMap[pid] = { name: pname, qty: 0 };
            productMap[pid].qty += item.quantity;
        });

        return Object.values(productMap)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
    }
};
