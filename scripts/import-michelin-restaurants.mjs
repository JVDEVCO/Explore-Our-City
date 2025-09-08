// scripts/import-michelin-restaurants.mjs
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

// 2024 Miami Michelin Guide
const MICHELIN_RESTAURANTS = [
    // One Star
    { name: 'Ariete', stars: 1, address: 'Coconut Grove' },
    { name: 'Boia De', stars: 1, address: 'Upper Buena Vista' },
    { name: 'The Den at Sushi Azabu', stars: 1, address: 'Miami Beach' },
    { name: 'Tambourine Room by Tristan Brandt', stars: 1, address: 'Coconut Grove' },

    // Bib Gourmand
    { name: "Chug's Diner", bib: true, address: 'Coconut Grove' },
    { name: 'Coyo Taco', bib: true, address: 'Wynwood' },
    { name: 'Itamae', bib: true, address: 'Design District' },
    { name: 'Krüs Kitchen', bib: true, address: 'Coconut Grove' },
    { name: 'La Santa Taqueria', bib: true, address: 'South Beach' },
    { name: "Maty's", bib: true, address: 'Midtown' },
    { name: 'Phuc Yea', bib: true, address: 'MiMo District' }
];

async function importMichelinRestaurants() {
    console.log('⭐ IMPORTING MICHELIN RESTAURANTS\n');

    const imported = [];
    const notFound = [];

    for (const restaurant of MICHELIN_RESTAURANTS) {
        console.log(`Searching for ${restaurant.name}...`);

        const query = `${restaurant.name} restaurant ${restaurant.address} Miami`;
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
            `input=${encodeURIComponent(query)}&inputtype=textquery&` +
            `locationbias=circle:16093@25.7617,-80.1318&` +
            `fields=place_id,name,formatted_address,geometry,price_level,rating,types,photos&` +
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

                if (existing) {
                    // Update existing
                    await supabase
                        .from('restaurants')
                        .update({
                            michelin_stars: restaurant.stars || null,
                            michelin_bib_gourmand: restaurant.bib || false,
                            price_range: restaurant.stars ? '$$$$$' :
                                (place.price_level === 4 ? '$$$$' :
                                    place.price_level === 3 ? '$$$' : '$$'),
                            last_updated: new Date().toISOString()
                        })
                        .eq('google_place_id', place.place_id);

                    console.log(`✅ Updated: ${restaurant.name}`);
                } else {
                    // Insert new
                    await supabase
                        .from('restaurants')
                        .insert({
                            google_place_id: place.place_id,
                            name: place.name,
                            address: place.formatted_address,
                            latitude: place.geometry.location.lat,
                            longitude: place.geometry.location.lng,
                            rating: place.rating || null,
                            price_range: restaurant.stars ? '$$$$$' :
                                (place.price_level === 4 ? '$$$$' :
                                    place.price_level === 3 ? '$$$' : '$$'),
                            primary_cuisine: detectCuisine(restaurant.name),
                            michelin_stars: restaurant.stars || null,
                            michelin_bib_gourmand: restaurant.bib || false,
                            google_types: place.types
                        });

                    console.log(`✅ Added: ${restaurant.name}`);
                }

                imported.push(restaurant.name);
            } else {
                console.log(`❌ Not found: ${restaurant.name}`);
                notFound.push(restaurant.name);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Error with ${restaurant.name}: ${error.message}`);
            notFound.push(restaurant.name);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('⭐ MICHELIN IMPORT COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${imported.length}`);
    console.log(`❌ Not found: ${notFound.length}`);

    if (notFound.length > 0) {
        console.log('\nRestaurants not found:');
        notFound.forEach(name => console.log(`  - ${name}`));
    }

    console.log(`\n💰 Estimated cost: $${(MICHELIN_RESTAURANTS.length * 0.003).toFixed(2)}`);
}

function detectCuisine(name) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('sushi') || nameLower.includes('azabu')) return 'Japanese';
    if (nameLower.includes('taco') || nameLower.includes('taqueria')) return 'Mexican';
    if (nameLower.includes('diner')) return 'American';
    return 'Contemporary';
}

importMichelinRestaurants()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });