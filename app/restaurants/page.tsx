'use client';

import { useSearchParams } from 'next/navigation';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Restaurant {
    id: number;
    name: string;
    primary_cuisine: string;
    price_range: string;
    neighborhood: string;
    rating?: number;
}

export default function RestaurantsPage() {
    const searchParams = useSearchParams();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    const neighborhood = searchParams.get('neighborhood');
    const budget = searchParams.get('budget');
    const cuisine = searchParams.get('cuisine');

    useEffect(() => {
        async function fetchRestaurants() {
            let query = supabase.from('restaurants').select('*');

            // Neighborhood filter
            if (neighborhood && neighborhood !== 'all') {
                const dbNeighborhood = neighborhood
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                query = query.eq('neighborhood', dbNeighborhood);
            }

            // Budget filter - EXACT matches per your point
            if (budget === 'quick') query = query.eq('price_range', '$');
            if (budget === 'casual') query = query.eq('price_range', '$$');
            if (budget === 'upscale') query = query.eq('price_range', '$$$');
            if (budget === 'fine') query = query.eq('price_range', '$$$$');
            if (budget === 'luxury') query = query.eq('price_range', '$$$$$');

            // Cuisine filter
            if (cuisine && cuisine !== 'all') {
                query = query.eq('primary_cuisine', cuisine);
            }

            const { data } = await query.limit(50);
            setRestaurants(data || []);
            setLoading(false);
        }

        fetchRestaurants();
    }, [neighborhood, budget, cuisine]);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl mb-4">
                {restaurants.length} Restaurants in {neighborhood?.replace('-', ' ')}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {restaurants.map((r: Restaurant) => (
                    <div key={r.id} className="border p-4 rounded">
                        <h2 className="font-bold">{r.name}</h2>
                        <p>{r.primary_cuisine} • {r.price_range}</p>
                        <p className="text-gray-600">{r.neighborhood}</p>
                        <p className="text-yellow-500">★ {r.rating || 'N/A'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}