// scripts/search-ice-cream-by-neighborhood.mjs
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Your established neighborhoods
const NEIGHBORHOODS = [
    { name: 'South Beach', lat: 25.7906, lng: -80.1300 },
    { name: 'Mid-Beach', lat: 25.8200, lng: -80.1250 },
    { name: 'North Beach', lat: 25.8450, lng: -80.1250 },
    { name: 'Brickell', lat: 25.7650, lng: -80.1950 },
    { name: 'Wynwood', lat: 25.8075, lng: -80.1900 },
    { name: 'Design District', lat: 25.8135, lng: -80.1885 },
    { name: 'Coconut Grove', lat: 25.7280, lng: -80.2600 },
    { name: 'Coral Gables', lat: 25.7505, lng: -80.2600 },
    { name: 'Little Havana', lat: 25.7650, lng: -80.2200 },
    { name: 'Downtown Miami', lat: 25.7750, lng: -80.1900 },
    { name: 'Midtown Miami', lat: 25.8100, lng: -80.1930 },
    { name: 'Upper East Side', lat: 25.8200, lng: -80.1700 },
    { name: 'Surfside', lat: 25.8780, lng: -80.1210 },
    { name: 'Bal Harbour', lat: 25.8920, lng: -80.1210 },
    { name: 'Key Biscayne', lat: 25.6940, lng: -80.1620 }
];

async function searchIceCreamByNeighborhood() {
    console.log('🍦 SEARCHING FOR ICE CREAM & GELATO SHOPS BY NEIGHBORHOOD\n');
    let totalFound = 0;

    for (const hood of NEIGHBORHOODS) {
        console.log(`\nSearching in ${hood.name}...`);

        // Search for ice cream and gelato separately
        const searchTerms = ['ice cream', 'gelato', 'frozen yogurt'];

        for (const term of searchTerms) {
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
                `location=${hood.lat},${hood.lng}&radius=2000&` +
                `keyword=${encodeURIComponent(term)}&type=restaurant&` +
                `key=${GOOGLE_API_KEY}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.results) {
                    for (const place of data.results.slice(0, 5)) { // Limit to top 5 per search
                        // Check if already exists
                        const { data: existing } = await supabase
                            .from('restaurants')
                            .select('id, primary_cuisine')
                            .eq('google_place_id', place.place_id)
                            .single();

                        if (!existing) {
                            // Add new ice cream shop
                            await supabase
                                .from('restaurants')
                                .insert({
                                    google_place_id: place.place_id,
                                    name: place.name,
                                    address: place.vicinity,
                                    latitude: place.geometry.location.lat,
                                    longitude: place.geometry.location.lng,
                                    rating: place.rating || null,
                                    price_range: place.price_level ?
                                        '$'.repeat(place.price_level) : '$$',
                                    primary_cuisine: 'Ice Cream',
                                    neighborhood: hood.name,
                                    google_types: place.types
                                });

                            console.log(`  ✅ Added: ${place.name}`);
                            totalFound++;
                        } else if (existing.primary_cuisine !== 'Ice Cream') {
                            // Update existing to Ice Cream if it's actually ice cream
                            if (place.name.toLowerCase().includes('ice cream') ||
                                place.name.toLowerCase().includes('gelato') ||
                                place.name.toLowerCase().includes('frozen')) {

                                await supabase
                                    .from('restaurants')
                                    .update({
                                        primary_cuisine: 'Ice Cream',
                                        neighborhood: hood.name
                                    })
                                    .eq('google_place_id', place.place_id);

                                console.log(`  📝 Updated to Ice Cream: ${place.name}`);
                            }
                        }
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error searching ${term} in ${hood.name}:`, error.message);
            }
        }
    }

    console.log(`\n✅ Total new ice cream shops found: ${totalFound}`);
    console.log(`💰 Estimated cost: $${(totalFound * 0.003).toFixed(2)}`);
}

searchIceCreamByNeighborhood()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });