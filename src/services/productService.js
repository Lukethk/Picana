
import { supabase } from '../supabaseClient';

export const productService = {
    // GET /products
    getAll: async (categoryId = null) => {
        let query = supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('name');
        
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // GET /categories
    getCategories: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        return data;
    },

    // POST /products
    create: async (productData) => {
        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // PUT /products/:id
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // DELETE /products/:id (Logical delete)
    delete: async (id) => {
        const { data, error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    // Upload Image
    uploadImage: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Try to upload to 'products' bucket
        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
