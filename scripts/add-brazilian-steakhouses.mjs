// scripts/add-brazilian-steakhouses.mjs
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

const BRAZILIAN_STEAKHOUSES = [
    { name: 'Texas de Brazil', area: 'Miami' },
    { name: 'Fogo de Chão Brazilian Steakhouse', area: 'Miami Beach' },
    { name: 'Bourbon Steak Miami', area: 'Aventura' }, // Also missing
    { name: 'Chima Brazilian Steakhouse', area: 'Fort Lauderdale' } // If in range
];

async function addBrazilianSteakhouses() {
    console.log('🥩 ADDING BRAZILIAN STEAKHOUSES\n');

    for (const restaurant of BRAZILIAN_STEAKHOUSES) {
        console.log(`Searching: ${restaurant.name} in ${restaurant.area}...`);

        const query = `${restaurant.name} ${restaurant.area} Florida`;
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
            `input=${encodeURIComponent(query)}&inputtype=textquery&` +
            `fields=place_id,name,formatted_address,geometry,price_level,rating,types&` +
            `key=${GOOGLE_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const place = data.candidates[0];

                // Check if already exists
                const { data: existing } = await supabase
                    .from('restaurants')
                    .select('id')
                    .eq('google_place_id', place.place_id)
                    .single();

                if (!existing) {
                    await supabase
                        .from('restaurants')
                        .insert({
                            google_place_id: place.place_id,
                            name: place.name,
                            address: place.formatted_address,
                            latitude: place.geometry.location.lat,
                            longitude: place.geometry.location.lng,
                            rating: place.rating || null,
                            price_range: '$$$$',  // Brazilian steakhouses are typically $$$$
                            primary_cuisine: 'Steakhouse',
                            neighborhood: restaurant.area,
                            google_types: place.types
                        });

                    console.log(`✅ Added: ${place.name}`);
                } else {
                    console.log(`Already exists: ${restaurant.name}`);
                }
            } else {
                console.log(`❌ Not found: ${restaurant.name}`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }

    console.log('\nDone adding Brazilian steakhouses!');
}

addBrazilianSteakhouses()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });