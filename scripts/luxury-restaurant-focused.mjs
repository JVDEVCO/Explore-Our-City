// scripts/luxury-restaurant-focused.mjs
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

async function searchLuxuryByKeywords() {
    console.log('🔍 SEARCHING FOR LUXURY RESTAURANTS BY NAME\n');

    // Known luxury restaurants including Bal Harbour and Surfside
    const luxuryNames = [
        // Bal Harbour specific
        'Carpaccio Bal Harbour',
        'Makoto Bal Harbour',
        'Le Zoo',
        'Atlantico at St. Regis Bal Harbour',

        // Surfside specific
        'The Surf Club Restaurant',
        'Lido Restaurant at The Surf Club',
        'Champagne Bar at Surfside',

        // Miami luxury classics
        "L'Atelier de Joël Robuchon",
        'Le Jardinier Miami',
        'COTE Miami',
        'Elcielo Miami',
        'Carbone Miami',
        'ZZ\'s Club',
        'Dirty French',
        'Cecconi Miami Beach',
        'Casa Tua',
        'Forte dei Marmi',
        'Il Gabbiano',
        'Quattro Gastronomia',
        'Milos Miami',
        'Estiatorio Ornos',
        'Mr Chow Miami',
        'Hakkasan Miami',
        'Zuma Miami',
        'Nobu Miami',
        'Matsuri Miami',
        'Makoto',
        'Katsuya',
        'NaiYaRa',
        'Prime 112',
        'Papi Steak',
        'STK Miami Beach',
        'Meat Market',
        'Red the Steakhouse',
        'The Capital Grille',
        'Fleming\'s Prime',
        'Morton\'s The Steakhouse',
        'Catch Miami',
        'Seaspice Miami',
        'Casablanca',
        'La Petite Maison Miami',
        'Boulud Sud',
        'DB Bistro Miami',
        'The Bazaar',
        'Boia De',
        'Stubborn Seed',
        'Hiden',
        'Ogawa',
        'Shingo',
        'The Den at Azabu',
        'Swan Miami',
        'Gekko',
        'Sexy Fish Miami',
        'Cipriani Miami',
        'Fiola Miami',
        'Macchialina',
        'MC Kitchen'
    ];

    const imported = [];
    const existing = [];
    const notFound = [];

    for (const restaurantName of luxuryNames) {
        console.log(`Searching: ${restaurantName}...`);

        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
            `input=${encodeURIComponent(restaurantName + ' restaurant Miami')}&` +
            `inputtype=textquery&` +
            `fields=place_id,name,formatted_address,geometry,price_level,rating,types&` +
            `key=${GOOGLE_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const place = data.candidates[0];

                // Check distance - allow up to 12 miles to include Bal Harbour/Surfside
                const distance = getDistance(
                    25.7617, -80.1318,
                    place.geometry.location.lat,
                    place.geometry.location.lng
                );

                // Special case for Bal Harbour and Surfside restaurants
                const isBalHarbour = place.formatted_address?.includes('Bal Harbour') ||
                    restaurantName.toLowerCase().includes('bal harbour');
                const isSurfside = place.formatted_address?.includes('Surfside') ||
                    restaurantName.toLowerCase().includes('surf club') ||
                    restaurantName.toLowerCase().includes('surfside');

                if (distance <= 10 || isBalHarbour || isSurfside) {
                    // Check if exists
                    const { data: existingRest } = await supabase
                        .from('restaurants')
                        .select('id, name')
                        .eq('google_place_id', place.place_id)
                        .single();

                    let neighborhood = null;
                    if (isBalHarbour) neighborhood = 'Bal Harbour';
                    else if (isSurfside) neighborhood = 'Surfside';

                    if (existingRest) {
                        // Update to luxury pricing
                        const updateData = {
                            price_range: '$$$$$',
                            last_updated: new Date().toISOString()
                        };
                        if (neighborhood) updateData.neighborhood = neighborhood;

                        await supabase
                            .from('restaurants')
                            .update(updateData)
                            .eq('google_place_id', place.place_id);

                        console.log(`✅ Updated to $$$$$: ${existingRest.name}`);
                        existing.push(restaurantName);
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
                                price_range: '$$$$$',
                                primary_cuisine: detectCuisine(place.name),
                                neighborhood: neighborhood,
                                google_types: place.types
                            });

                        console.log(`✅ Added: ${place.name}`);
                        imported.push(restaurantName);
                    }
                } else {
                    console.log(`❌ Outside range: ${restaurantName} (${distance.toFixed(1)} miles)`);
                    notFound.push(restaurantName);
                }
            } else {
                console.log(`❌ Not found: ${restaurantName}`);
                notFound.push(restaurantName);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('RESULTS:');
    console.log(`✅ New imports: ${imported.length}`);
    console.log(`✅ Updated to $$$$$: ${existing.length}`);
    console.log(`❌ Not found/outside range: ${notFound.length}`);

    if (notFound.length > 0) {
        console.log('\nNot found:');
        notFound.forEach(name => console.log(`  - ${name}`));
    }
}

function detectCuisine(name) {
    const n = name.toLowerCase();
    if (n.includes('sushi') || n.includes('japanese')) return 'Japanese';
    if (n.includes('italian') || n.includes('osteria') || n.includes('carpaccio')) return 'Italian';
    if (n.includes('steakhouse') || n.includes('steak')) return 'Steakhouse';
    if (n.includes('french')) return 'French';
    if (n.includes('seafood') || n.includes('fish')) return 'Seafood';
    return 'Contemporary';
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

searchLuxuryByKeywords()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });