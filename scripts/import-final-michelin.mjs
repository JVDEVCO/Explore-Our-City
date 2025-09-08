// scripts/import-final-michelin.mjs
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

// The EXACT missing restaurants
const FINAL_MISSING = [
    // Missing Bib Gourmand
    { name: 'Bachour', area: 'Coral Gables', bib: true },
    { name: 'Ghee Indian Kitchen', area: 'Design District', bib: true },
    { name: 'Zitz Sum', area: 'Coral Gables', bib: true },

    // Missing Selected
    { name: 'Fiola Miami', area: 'Coral Gables', selected: true },
    { name: 'Lion & the Rambler', area: 'Coral Gables', selected: true },
    { name: 'Ossobucco', area: 'Miami', selected: true },
    { name: 'Pez Miami', area: 'Miami Beach', selected: true }
];

async function importFinalMichelin() {
    console.log('⭐ IMPORTING FINAL MISSING MICHELIN RESTAURANTS\n');

    for (const restaurant of FINAL_MISSING) {
        console.log(`Searching: ${restaurant.name} in ${restaurant.area}...`);

        const query = `${restaurant.name} restaurant ${restaurant.area} Miami Florida`;
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
            `input=${encodeURIComponent(query)}&inputtype=textquery&` +
            `fields=place_id,name,formatted_address,geometry,price_level,rating,types&` +
            `key=${GOOGLE_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const place = data.candidates[0];

                await supabase
                    .from('restaurants')
                    .insert({
                        google_place_id: place.place_id,
                        name: place.name,
                        address: place.formatted_address,
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        rating: place.rating || null,
                        price_range: restaurant.bib ? '$$$' : '$$$$',
                        primary_cuisine: detectCuisine(restaurant.name),
                        michelin_bib_gourmand: restaurant.bib || false,
                        michelin_selected: restaurant.selected || false,
                        neighborhood: restaurant.area,
                        google_types: place.types
                    });

                console.log(`✅ Added: ${place.name}`);
            } else {
                console.log(`❌ Not found: ${restaurant.name} - MANUAL ENTRY NEEDED`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }

    console.log('\nDone! Now run the SQL fixes to complete.');
}

function detectCuisine(name) {
    if (name.includes('Bachour')) return 'Bakery';
    if (name.includes('Ghee')) return 'Indian';
    if (name.includes('Zitz')) return 'Chinese';
    if (name.includes('Fiola')) return 'Italian';
    if (name.includes('Ossobucco')) return 'Italian';
    return 'Contemporary';
}

importFinalMichelin()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });