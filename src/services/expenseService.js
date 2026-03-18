import { supabase } from '../supabaseClient';

export const expenseService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    create: async (expenseData) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('expenses')
            .insert({ ...expenseData, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
