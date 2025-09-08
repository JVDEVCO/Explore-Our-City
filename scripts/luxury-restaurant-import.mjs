// scripts/luxury-restaurant-import.mjs
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
const CENTER_POINT = { lat: 25.7617, lng: -80.1318 };

async function importLuxuryRestaurants() {
    console.log('💎 LUXURY RESTAURANT TARGETED IMPORT\n');

    // Get existing IDs
    const { data: existing } = await supabase
        .from('restaurants')
        .select('google_place_id')
        .not('google_place_id', 'is', null);

    const existingIds = new Set(existing?.map(r => r.google_place_id) || []);
    const luxuryRestaurants = [];

    // Luxury hotel zones and fine dining districts
    const luxuryZones = [
        { name: 'South Beach Luxury Hotels', lat: 25.7910, lng: -80.1300, radius: 1000 },
        { name: 'Mid-Beach Hotels', lat: 25.8090, lng: -80.1240, radius: 1000 },
        { name: 'Design District Core', lat: 25.8134, lng: -80.1889, radius: 800 },
        { name: 'Coral Gables Restaurant Row', lat: 25.7505, lng: -80.2519, radius: 1000 },
        { name: 'Brickell Financial District', lat: 25.7616, lng: -80.1950, radius: 800 },
        { name: 'Coconut Grove Marina', lat: 25.7267, lng: -80.2370, radius: 800 },
        { name: 'Bal Harbour Shops', lat: 25.8885, lng: -80.1249, radius: 600 },
        { name: 'Aventura Mall Area', lat: 25.9564, lng: -80.1392, radius: 1000 },
        { name: 'Downtown Four Seasons', lat: 25.7690, lng: -80.1890, radius: 500 },
        { name: 'Wynwood Luxury', lat: 25.8003, lng: -80.1996, radius: 800 }
    ];

    for (const zone of luxuryZones) {
        console.log(`Searching ${zone.name} for luxury restaurants...`);

        let nextPageToken = null;
        let pageCount = 0;

        do {
            // Search specifically for expensive restaurants ($$$ and $$$$)
            let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
                `location=${zone.lat},${zone.lng}&radius=${zone.radius}&` +
                `type=restaurant&minprice=3&maxprice=4`; // Only $$$ and $$$$

            if (nextPageToken) {
                url += `&pagetoken=${nextPageToken}`;
            } else {
                url += `&key=${GOOGLE_API_KEY}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            for (const place of data.results || []) {
                if (!existingIds.has(place.place_id) &&
                    place.business_status === 'OPERATIONAL') {

                    // Only include if within 10 miles of center
                    const distance = getDistance(
                        CENTER_POINT.lat,
                        CENTER_POINT.lng,
                        place.geometry.location.lat,
                        place.geometry.location.lng
                    );

                    if (distance <= 10) {
                        luxuryRestaurants.push({
                            google_place_id: place.place_id,
                            name: place.name,
                            address: place.vicinity,
                            latitude: place.geometry.location.lat,
                            longitude: place.geometry.location.lng,
                            rating: place.rating || null,
                            price_range: place.price_level === 4 ? '$$$$' : '$$$',
                            primary_cuisine: detectLuxuryCuisine(place.name, place.types),
                            neighborhood: zone.name.replace(' Luxury Hotels', '').replace(' Core', ''),
                            google_types: place.types
                        });
                        existingIds.add(place.place_id); // Prevent duplicates in this run
                    }
                }
            }

            nextPageToken = data.next_page_token;
            pageCount++;

            if (nextPageToken && pageCount < 3) { // Get up to 60 results per zone
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                nextPageToken = null;
            }

        } while (nextPageToken);

        console.log(`   Found ${luxuryRestaurants.length} total luxury restaurants so far`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Insert results
    if (luxuryRestaurants.length > 0) {
        console.log(`\n📤 Inserting ${luxuryRestaurants.length} luxury restaurants...`);

        const batchSize = 100;
        for (let i = 0; i < luxuryRestaurants.length; i += batchSize) {
            const batch = luxuryRestaurants.slice(i, i + batchSize);
            const { error } = await supabase.from('restaurants').insert(batch);

            if (error) {
                console.error(`Error: ${error.message}`);
            } else {
                console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}`);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 LUXURY IMPORT COMPLETE:');
    console.log(`✅ Found ${luxuryRestaurants.length} new luxury restaurants`);
    console.log(`💰 Estimated cost: $${(luxuryRestaurants.length * 0.003).toFixed(2)}`);

    const priceDist = {};
    luxuryRestaurants.forEach(r => {
        priceDist[r.price_range] = (priceDist[r.price_range] || 0) + 1;
    });

    console.log('\nPrice distribution:');
    Object.entries(priceDist).forEach(([price, count]) => {
        console.log(`   ${price}: ${count}`);
    });
}

function detectLuxuryCuisine(name, types) {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('sushi') || nameLower.includes('japanese')) return 'Japanese';
    if (nameLower.includes('italian') || nameLower.includes('osteria')) return 'Italian';
    if (nameLower.includes('steakhouse') || nameLower.includes('grill')) return 'Steakhouse';
    if (nameLower.includes('french') || nameLower.includes('bistro')) return 'French';
    if (nameLower.includes('seafood') || nameLower.includes('fish')) return 'Seafood';
    if (nameLower.includes('asian')) return 'Asian';
    if (nameLower.includes('spanish') || nameLower.includes('tapas')) return 'Spanish';

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

importLuxuryRestaurants()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });