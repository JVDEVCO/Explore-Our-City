// scripts/import-ice-cream-shops.mjs
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

const ICE_CREAM_SHOPS = [
    { name: 'I Scream Gelato', area: 'Miami Beach' },
    { name: 'CIAO AMORE Italian Gelato', area: 'Miami' },
    { name: 'MAMMAMIA BRICKELL', area: 'Brickell' },
    { name: 'Van Leeuwen Ice Cream', area: 'Miami Beach' },
    { name: 'Danielle Gelato', area: 'Miami' },
    { name: 'RivaReno Gelato', area: 'Brickell' },
    { name: 'Naranja Piña Gelato', area: 'Miami' },
    { name: 'Quore Gelato', area: 'Miami' },
    { name: 'Tri Gelato', area: 'Miami Beach' },
    { name: 'V Gelato & Cafe', area: 'Miami' },
    { name: 'Paradice Gelato', area: 'Miami Beach' },
    { name: 'The Baked Bear', area: 'South Beach' },
    { name: 'Mammamia Gelato Italiano', area: 'Miami Beach' },
    { name: 'Midtown Creamery', area: 'Midtown Miami' },
    { name: 'Dasher & Crank', area: 'Wynwood' },
    { name: 'Bianco Gelato', area: 'Coconut Grove' },
    { name: 'Azucar Ice Cream Company', area: 'Little Havana' },
    { name: 'Salt & Straw', area: 'Wynwood' },
    { name: 'Whip N Dip', area: 'South Beach' },
    { name: 'Mr. Kream', area: 'Wynwood' }
];

async function importIceCreamShops() {
    console.log('🍦 IMPORTING ICE CREAM & GELATO SHOPS\n');
    let imported = 0;

    for (const shop of ICE_CREAM_SHOPS) {
        console.log(`Searching: ${shop.name} in ${shop.area}...`);

        const query = `${shop.name} ${shop.area} Miami Florida`;
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
                            price_range: '$$',
                            primary_cuisine: 'Ice Cream',
                            neighborhood: shop.area,
                            google_types: place.types
                        });

                    console.log(`✅ Added: ${place.name}`);
                    imported++;
                } else {
                    // Update existing to Ice Cream category
                    await supabase
                        .from('restaurants')
                        .update({
                            primary_cuisine: 'Ice Cream',
                            neighborhood: shop.area
                        })
                        .eq('google_place_id', place.place_id);

                    console.log(`✅ Updated: ${shop.name}`);
                }
            } else {
                console.log(`❌ Not found: ${shop.name}`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }

    console.log(`\n✅ Imported/Updated: ${imported} ice cream shops`);
}

importIceCreamShops()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });