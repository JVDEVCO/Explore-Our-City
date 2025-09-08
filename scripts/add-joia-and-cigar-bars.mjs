// scripts/add-joia-and-cigar-bars.mjs
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

const MISSING_VENUES = [
    // Beach Clubs
    { name: 'Joia Beach Restaurant & Beach Club', area: 'Watson Island', cuisine: 'Mediterranean' },

    // Major Cigar Bars/Lounges in Miami
    { name: 'Havana Cigar Lounge', area: 'Little Havana', cuisine: 'Cigar Bar' },
    { name: 'Prime Cigar & Wine Bar', area: 'Brickell', cuisine: 'Cigar Bar' },
    { name: 'The Big Smoke', area: 'South Beach', cuisine: 'Cigar Bar' },
    { name: 'Libertad Cigars', area: 'Little Havana', cuisine: 'Cigar Bar' },
    { name: 'Cuba Tobacco Cigar Company', area: 'Little Havana', cuisine: 'Cigar Bar' },
    { name: 'Cigar Inn', area: 'Coral Gables', cuisine: 'Cigar Bar' },
    { name: 'Padron Cigars', area: 'Little Havana', cuisine: 'Cigar Bar' },
    { name: 'La Gloria Cubana Cigar Lounge', area: 'Little Havana', cuisine: 'Cigar Bar' }
];

async function addMissingVenues() {
    console.log('🏖️ ADDING JOIA BEACH & CIGAR BARS\n');
    let imported = 0;

    for (const venue of MISSING_VENUES) {
        console.log(`Searching: ${venue.name} in ${venue.area}...`);

        const query = `${venue.name} ${venue.area} Miami Florida`;
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
            `input=${encodeURIComponent(query)}&inputtype=textquery&` +
            `fields=place_id,name,formatted_address,geometry,price_level,rating,types&` +
            `key=${GOOGLE_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const place = data.candidates[0];

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
                            price_range: venue.cuisine === 'Cigar Bar' ? '$$$' : '$$$$',
                            primary_cuisine: venue.cuisine,
                            neighborhood: venue.area === 'Watson Island' ? 'Watson Island' : venue.area,
                            google_types: place.types
                        });

                    console.log(`✅ Added: ${place.name}`);
                    imported++;
                } else {
                    console.log(`Already exists: ${venue.name}`);
                }
            } else {
                console.log(`❌ Not found: ${venue.name} - may need manual search`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }

    console.log(`\n✅ Imported: ${imported} venues`);
}

addMissingVenues()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });