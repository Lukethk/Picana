import { supabase } from '../supabaseClient';

export const cashService = {
    // Get active shift for current user
    getActiveShift: async () => {
        const { data, error } = await supabase
            .from('cash_shifts')
            .select('*')
            .is('closed_at', null)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // Open a new shift
    openShift: async (openingBalance) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('cash_shifts')
            .insert({
                user_id: user.id,
                opening_balance: openingBalance,
                status: 'open'
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Close current shift
    closeShift: async (shiftId, closingBalance, expectedBalance, totalSalesCash, totalSalesQr, totalSalesTransfer, totalExpenses) => {
        const { data, error } = await supabase
            .from('cash_shifts')
            .update({
                closed_at: new Date().toISOString(),
                closing_balance: closingBalance,
                expected_balance: expectedBalance,
                total_sales_cash: totalSalesCash,
                total_sales_qr: totalSalesQr,
                total_sales_transfer: totalSalesTransfer,
                total_expenses: totalExpenses,
                status: 'closed'
            })
            .eq('id', shiftId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Get shift totals (summary before closing)
    getShiftTotals: async (shiftId, startTime) => {
        // This would typically be a database function or multiple queries
        // For simplicity, we'll calculate based on sales and expenses since startTime
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('total, payment_method')
            .gte('created_at', startTime);
        
        const { data: expenses, error: expError } = await supabase
            .from('expenses')
            .select('amount')
            .gte('created_at', startTime);

        if (salesError) throw salesError;
        if (expError) throw expError;

        const totals = {
            cash: sales.filter(s => s.payment_method === 'efectivo').reduce((acc, s) => acc + s.total, 0),
            qr: sales.filter(s => s.payment_method === 'qr').reduce((acc, s) => acc + s.total, 0),
            transfer: sales.filter(s => s.payment_method === 'transferencia').reduce((acc, s) => acc + s.total, 0),
            expenses: expenses.reduce((acc, e) => acc + e.amount, 0)
        };

        return totals;
    }
};
