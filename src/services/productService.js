
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

    // POST /categories
    createCategory: async (categoryData) => {
        const { data, error } = await supabase
            .from('categories')
            .insert(categoryData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // PUT /categories/:id
    updateCategory: async (id, updates) => {
        const { data: existing, error: existingError } = await supabase
            .from('categories')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (existingError) throw existingError;

        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!data && existing) throw new Error('No se pudo actualizar la categoría (permisos/RLS bloqueando UPDATE).');
        if (!data) throw new Error('No se pudo actualizar la categoría (no encontrada).');
        return data;
    },

    // DELETE /categories/:id
    deleteCategory: async (id) => {
        const { data, error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('No se pudo eliminar la categoría (no encontrada o sin permisos).');
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
        const { data: existing, error: existingError } = await supabase
            .from('products')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (existingError) throw existingError;

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();
        
        if (error) throw error;
        if (!data && existing) throw new Error('No se pudo actualizar el producto (permisos/RLS bloqueando UPDATE).');
        if (!data) throw new Error('No se pudo actualizar el producto (no encontrado).');
        return data;
    },

    // DELETE /products/:id (Logical delete)
    delete: async (id) => {
        const { data, error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id)
            .select()
            .maybeSingle();
            
        if (error) throw error;
        if (!data) throw new Error('No se pudo eliminar el producto (no encontrado o sin permisos).');
        return data;
    },

    // Upload Image
    uploadImage: async (file) => {
        const bucket = 'products';
        if (!file) throw new Error('Archivo inválido.');
        if (typeof file.type === 'string' && !file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');
        if (Number(file.size) > 6 * 1024 * 1024) throw new Error('La imagen supera 6MB.');

        const extByMime = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/svg+xml': 'svg',
        };
        const nameExt = String(file.name || '').split('.').pop();
        const extFromName = nameExt && nameExt !== String(file.name || '') ? nameExt.toLowerCase() : '';
        const ext = extFromName || extByMime[file.type] || 'jpg';

        const rand = Math.random().toString(36).slice(2);
        const fileName = `${Date.now()}_${rand}.${ext}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                contentType: file.type || undefined,
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            const msg = String(uploadError.message || '');
            if (msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not')) {
                throw new Error(`No existe el bucket '${bucket}' en Storage. Crea el bucket y habilita policies.`);
            }
            throw uploadError;
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        if (!data?.publicUrl) throw new Error('No se pudo generar la URL pública de la imagen.');
        return data.publicUrl;
    }
};
