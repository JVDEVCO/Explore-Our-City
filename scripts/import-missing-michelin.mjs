// scripts/import-missing-michelin.mjs
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

// Missing Michelin restaurants
const MISSING_MICHELIN = [
    // 1 Star missing
    { name: 'EntreNos', area: 'Miami Shores', stars: 1, green: true },
    { name: 'Itamae Ao', area: 'Midtown Miami', stars: 1 },
    { name: 'Los Félix', area: 'Coconut Grove', stars: 1, green: true },

    // Bib Gourmand missing
    { name: 'Hometown Barbecue Miami', area: 'Allapattah', bib: true },
    { name: 'La Natural', area: 'Little River', bib: true },
    { name: 'Sanguich de Miami', area: 'Little Havana', bib: true },
    { name: 'Tâm Tâm', area: 'Downtown Miami', bib: true },
    { name: 'Tinta y Cafe', area: 'Miami Shores', bib: true },

    // Selected missing
    { name: 'Brasserie Laurel', area: 'Coral Gables', selected: true },
    { name: 'Erba', area: 'Coral Gables', selected: true },
    { name: 'The Gibson Room', area: 'Miami', selected: true },
    { name: 'Hiyakawa', area: 'Wynwood', selected: true },
    { name: 'Kaori Miami', area: 'Miami Beach', selected: true },
    { name: 'Leku', area: 'Miami Beach', selected: true },
    { name: 'Lion & the Rambler', area: 'Coral Gables', selected: true },
    { name: 'Lung Yai Thai Tapas', area: 'Wynwood', selected: true },
    { name: "MaryGold's", area: 'Wynwood', selected: true },
    { name: "Maty's", area: 'Midtown', selected: true },
    { name: 'Naoe', area: 'Brickell Key', selected: true },
    { name: 'Pez', area: 'Miami Beach', selected: true },
    { name: "Rosie's", area: 'Miami', selected: true },
    { name: 'Sereia', area: 'Coconut Grove', selected: true },
    { name: 'Walrus Rodeo', area: 'Miami', selected: true },
    { name: 'Zak the Baker', area: 'Wynwood', selected: true }
];

async function importMissingMichelin() {
    console.log('⭐ IMPORTING MISSING MICHELIN RESTAURANTS\n');

    let imported = 0;
    let notFound = 0;

    for (const restaurant of MISSING_MICHELIN) {
        console.log(`Searching: ${restaurant.name} in ${restaurant.area}...`);

        const query = `${restaurant.name} restaurant ${restaurant.area} Miami`;
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

                if (existing) {
                    // Update existing
                    const updates = {
                        michelin_stars: restaurant.stars || null,
                        michelin_bib_gourmand: restaurant.bib || false,
                        michelin_selected: restaurant.selected || false,
                        michelin_green_star: restaurant.green || false,
                        last_updated: new Date().toISOString()
                    };

                    if (restaurant.stars) updates.price_range = '$$$$$';

                    await supabase
                        .from('restaurants')
                        .update(updates)
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
                                restaurant.bib ? '$$$' : '$$',
                            primary_cuisine: detectCuisine(restaurant.name),
                            michelin_stars: restaurant.stars || null,
                            michelin_bib_gourmand: restaurant.bib || false,
                            michelin_selected: restaurant.selected || false,
                            michelin_green_star: restaurant.green || false,
                            neighborhood: restaurant.area,
                            google_types: place.types
                        });

                    console.log(`✅ Added: ${restaurant.name}`);
                }
                imported++;
            } else {
                console.log(`❌ Not found: ${restaurant.name}`);
                notFound++;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`Error: ${error.message}`);
            notFound++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Imported/Updated: ${imported}`);
    console.log(`❌ Not found: ${notFound}`);
    console.log(`💰 Cost: $${(imported * 0.003).toFixed(2)}`);
}

function detectCuisine(name) {
    const n = name.toLowerCase();
    if (n.includes('barbecue') || n.includes('bbq')) return 'BBQ';
    if (n.includes('thai')) return 'Thai';
    if (n.includes('sanguich')) return 'Deli';
    if (n.includes('cafe') || n.includes('coffee')) return 'Cafe';
    if (n.includes('natural')) return 'Healthy';
    return 'Contemporary';
}

importMissingMichelin()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });