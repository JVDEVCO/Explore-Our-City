// app/api/restaurants/route.ts (or wherever your API is)
import { supabase } from '@/lib/supabase.js';
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cuisine = searchParams.get('cuisine');
    const neighborhood = searchParams.get('neighborhood');
    const priceRange = searchParams.get('priceRange');

    let query = supabase
        .from('restaurants')
        .select('*');

    // Add filters based on params
    if (cuisine && cuisine !== 'all') {
        query = query.eq('primary_cuisine', cuisine);
    }

    if (neighborhood && neighborhood !== 'all') {
        query = query.eq('neighborhood', neighborhood);
    }

    if (priceRange) {
        // Handle price range logic
        // Quick Bite = $, Casual = $$, etc.
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
}