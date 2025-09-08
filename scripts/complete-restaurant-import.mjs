// scripts/comprehensive-miami-restaurants.mjs
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

// Miami's 2024 Michelin restaurants
const MICHELIN_RESTAURANTS = {
    // 1 Star
    'Ariete': 1,
    'Boia De': 1,
    'The Den at Sushi Azabu': 1,
    'Tambourine Room': 1,

    // Bib Gourmand
    'Chug\'s': 'bib',
    'Coyo Taco': 'bib',
    'Itamae': 'bib',
    'Krüs Kitchen': 'bib',
    'La Santa Taqueria': 'bib',
    'Maty\'s': 'bib',
    'Phuc Yea': 'bib'
};

async function comprehensiveImport() {
    console.log('🚀 COMPREHENSIVE MIAMI RESTAURANT IMPORT\n');

    // Get existing restaurants
    const { data: existing } = await supabase
        .from('restaurants')
        .select('google_place_id, name')
        .not('google_place_id', 'is', null);

    const existingIds = new Set(existing?.map(r => r.google_place_id) || []);
    const allNewRestaurants = [];

    // Strategy 1: Grid search across the 10-mile radius
    console.log('📍 Grid searching the area...\n');

    const gridPoints = generateGrid(CENTER_POINT, 10, 1.5); // 1.5 mile spacing

    for (let i = 0; i < gridPoints.length; i++) {
        const point = gridPoints[i];
        console.log(`Searching grid point ${i + 1}/${gridPoints.length}...`);

        // Search for ALL restaurants at this point
        const restaurants = await searchWithPagination(point, 2414, null, existingIds); // 1.5 miles in meters
        allNewRestaurants.push(...restaurants);

        // Also search specifically for expensive restaurants
        const fineRestaurants = await searchWithPagination(point, 2414, 'expensive', existingIds);
        allNewRestaurants.push(...fineRestaurants);

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Strategy 2: Target known fine dining areas
    console.log('\n🎯 Targeting fine dining areas...\n');

    const fineDiningAreas = [
        { name: 'Design District', lat: 25.8134, lng: -80.1889 },
        { name: 'Coral Gables Downtown', lat: 25.7505, lng: -80.2519 },
        { name: 'Coconut Grove Center', lat: 25.7244, lng: -80.2433 },
        { name: 'Brickell City Centre', lat: 25.7671, lng: -80.1927 },
        { name: 'South of Fifth', lat: 25.7738, lng: -80.1328 }
    ];

    for (const area of fineDiningAreas) {
        console.log(`Searching ${area.name} for fine dining...`);

        const expensive = await searchWithPagination(
            { lat: area.lat, lng: area.lng },
            1000,
            'expensive',
            existingIds
        );

        allNewRestaurants.push(...expensive);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Remove duplicates
    const uniqueRestaurants = [];
    const seenIds = new Set();

    for (const restaurant of allNewRestaurants) {
        if (!seenIds.has(restaurant.google_place_id)) {
            seenIds.add(restaurant.google_place_id);

            // Check for Michelin status
            const michelin = MICHELIN_RESTAURANTS[restaurant.name];
            if (michelin) {
                if (michelin === 'bib') {
                    restaurant.michelin_bib_gourmand = true;
                } else {
                    restaurant.michelin_stars = michelin;
                }
                restaurant.price_range = restaurant.price_range === '$$$$' ? '$$$$$' : restaurant.price_range;
            }

            uniqueRestaurants.push(restaurant);
        }
    }

    // Insert in batches
    if (uniqueRestaurants.length > 0) {
        console.log(`\n📤 Inserting ${uniqueRestaurants.length} restaurants...`);

        const batchSize = 100;
        for (let i = 0; i < uniqueRestaurants.length; i += batchSize) {
            const batch = uniqueRestaurants.slice(i, i + batchSize);
            const { error } = await supabase.from('restaurants').insert(batch);

            if (error) {
                console.error(`Error: ${error.message}`);
            } else {
                console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}`);
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS:');
    console.log(`✅ Found ${uniqueRestaurants.length} new restaurants`);
    console.log(`💰 Estimated cost: $${(uniqueRestaurants.length * 0.002).toFixed(2)}`);

    const priceDist = {};
    uniqueRestaurants.forEach(r => {
        priceDist[r.price_range] = (priceDist[r.price_range] || 0) + 1;
    });

    console.log('\nPrice distribution:');
    Object.entries(priceDist).forEach(([price, count]) => {
        console.log(`   ${price}: ${count}`);
    });

    const michelinCount = uniqueRestaurants.filter(r => r.michelin_stars || r.michelin_bib_gourmand).length;
    console.log(`\n⭐ Michelin restaurants found: ${michelinCount}`);
}

async function searchWithPagination(location, radius, priceLevel, existingIds) {
    const results = [];
    let nextPageToken = null;

    do {
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
            `location=${location.lat},${location.lng}&radius=${radius}&type=restaurant`;

        if (priceLevel === 'expensive') {
            url += '&minprice=3&maxprice=4';
        }

        if (nextPageToken) {
            url += `&pagetoken=${nextPageToken}`;
        }

        url += `&key=${GOOGLE_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        for (const place of data.results || []) {
            if (!existingIds.has(place.place_id) &&
                place.business_status === 'OPERATIONAL' &&
                isWithinRadius(CENTER_POINT, place.geometry.location, 10)) {

                results.push({
                    google_place_id: place.place_id,
                    name: place.name,
                    address: place.vicinity,
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                    rating: place.rating || null,
                    price_range: mapPriceLevel(place.price_level),
                    primary_cuisine: 'Contemporary',
                    google_types: place.types
                });
            }
        }

        nextPageToken = data.next_page_token;
        if (nextPageToken) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for token to be valid
        }

    } while (nextPageToken);

    return results;
}

function generateGrid(center, radiusMiles, spacingMiles) {
    const points = [];
    const steps = Math.ceil(radiusMiles / spacingMiles);

    for (let i = -steps; i <= steps; i++) {
        for (let j = -steps; j <= steps; j++) {
            const lat = center.lat + (i * spacingMiles / 69); // ~69 miles per degree latitude
            const lng = center.lng + (j * spacingMiles / (69 * Math.cos(center.lat * Math.PI / 180)));

            if (isWithinRadius(center, { lat, lng }, radiusMiles)) {
                points.push({ lat, lng });
            }
        }
    }

    return points;
}

function isWithinRadius(center, point, radiusMiles) {
    const R = 3959;
    const dLat = (point.lat - center.lat) * Math.PI / 180;
    const dLon = (point.lng - center.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(center.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) <= radiusMiles;
}

function mapPriceLevel(level) {
    if (!level) return '$$';
    switch (level) {
        case 1: return '$';
        case 2: return '$$';
        case 3: return '$$$';
        case 4: return '$$$$';
        default: return '$$';
    }
}

comprehensiveImport()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });