import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Ultra-luxury restaurants in Miami
const ULTRA_LUXURY_RESTAURANTS = [
    'carbone', 'zz\'s club', 'l\'atelier', 'joël robuchon', 'nobu',
    'the bazaar', 'prime 112', 'dirty french', 'cote miami', 'gekko',
    'sexy fish', 'casadonna', 'forte dei marmi', 'cipriani', 'zuma',
    'la petite maison', 'le jardinier', 'stubborn seed', 'ariete',
    'los fuegos', 'quattro gastronomia', 'makoto', 'azabu', 'hakkasan',
    'katsuya', 'komodo', 'papi steak', 'meat market', 'stk miami',
    'bourbon steak', 'maestro\'s', 'catch miami', 'swan', 'boia de',
    'elastika', 'klaw miami', 'lobster bar', 'seaspice', 'joia beach'
];

// Neighborhood search strategies
const SEARCH_AREAS = [
    // ALL RESTAURANTS
    { name: 'South Beach', lat: 25.7907, lng: -80.1300, radius: 2000, filter: 'all' },
    { name: 'Mid-Beach', lat: 25.8137, lng: -80.1229, radius: 2000, filter: 'all' },
    { name: 'North Beach', lat: 25.8880, lng: -80.1200, radius: 2000, filter: 'all' },
    { name: 'Downtown Miami', lat: 25.7751, lng: -80.1900, radius: 2000, filter: 'all' },
    { name: 'Brickell', lat: 25.7616, lng: -80.1918, radius: 1500, filter: 'all' },
    { name: 'Wynwood', lat: 25.8003, lng: -80.1994, radius: 1500, filter: 'all' },
    { name: 'Coconut Grove', lat: 25.7259, lng: -80.2364, radius: 1500, filter: 'all' },

    // UPSCALE ONLY
    { name: 'Design District', lat: 25.8128, lng: -80.1918, radius: 1000, filter: 'upscale' },
    { name: 'Coral Gables', lat: 25.7505, lng: -80.2593, radius: 2000, filter: 'upscale' },
    { name: 'Miracle Mile', lat: 25.7489, lng: -80.2577, radius: 800, filter: 'upscale' },

    // SPECIALTY SEARCHES (wider radius for specific types)
    { name: 'Steakhouses - Miami Area', lat: 25.7907, lng: -80.1300, radius: 16000, filter: 'steakhouse' },
    { name: 'Sushi - Miami Area', lat: 25.7907, lng: -80.1300, radius: 16000, filter: 'sushi' }
];

// Cuisine detection from types and name
function detectCuisine(place) {
    const name = place.name?.toLowerCase() || '';
    const types = place.types || [];

    // Steakhouse detection
    if (name.includes('steak') || name.includes('chop') || name.includes('grill')) return 'Steakhouse';

    // Sushi/Japanese
    if (name.includes('sushi') || name.includes('ramen') || name.includes('izakaya')) return 'Japanese';

    // Italian
    if (name.includes('pizza') || name.includes('pasta') || name.includes('italiano')) return 'Italian';
    if (name.includes('trattoria') || name.includes('osteria')) return 'Italian';

    // Latin/Cuban
    if (name.includes('cuban') || name.includes('havana') || name.includes('versailles')) return 'Cuban';
    if (name.includes('mexican') || name.includes('taco') || name.includes('cantina')) return 'Mexican';
    if (name.includes('peruvian') || name.includes('ceviche')) return 'Peruvian';

    // French
    if (name.includes('bistro') || name.includes('brasserie') || name.includes('french')) return 'French';

    // Asian
    if (name.includes('thai')) return 'Thai';
    if (name.includes('chinese') || name.includes('dim sum')) return 'Chinese';
    if (name.includes('vietnamese') || name.includes('pho')) return 'Vietnamese';
    if (name.includes('korean') || name.includes('kimchi')) return 'Korean';

    // Mediterranean
    if (name.includes('greek') || name.includes('mediterranean')) return 'Mediterranean';
    if (name.includes('lebanese') || name.includes('turkish')) return 'Mediterranean';

    // Seafood
    if (name.includes('seafood') || name.includes('fish') || name.includes('oyster')) return 'Seafood';
    if (name.includes('lobster') || name.includes('crab')) return 'Seafood';

    // Bars
    if (types.includes('bar') || types.includes('night_club')) return 'Bar';

    return 'Contemporary'; // Default for upscale places
}

// Price level mapping with ultra-luxury detection
function mapPriceLevel(priceLevel, name) {
    const nameLower = name?.toLowerCase() || '';

    // Check if it's ultra-luxury
    if (ULTRA_LUXURY_RESTAURANTS.some(lux => nameLower.includes(lux))) {
        return '$$$$$';
    }

    // Google's 4-tier mapping
    const mapping = {
        1: '$',
        2: '$$',
        3: '$$$',
        4: '$$$$'
    };

    // If Google says $$$$ and it has certain keywords, might be $$$$$
    if (priceLevel === 4) {
        if (nameLower.includes('private') || nameLower.includes('club') ||
            nameLower.includes('omakase') || nameLower.includes('tasting')) {
            return '$$$$$';
        }
    }

    return mapping[priceLevel] || '$$';
}

// Search restaurants in an area
async function searchArea(area) {
    const results = [];
    let nextPageToken = null;
    let pageCount = 0;
    const maxPages = 3; // Google returns max 60 results (20 per page x 3)

    console.log(`\n🔍 Searching ${area.name} (${area.filter})...`);

    do {
        // Build search URL based on filter type
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?`;
        url += `location=${area.lat},${area.lng}`;
        url += `&radius=${area.radius}`;
        url += `&key=${GOOGLE_API_KEY}`;

        // Apply filters
        if (area.filter === 'steakhouse') {
            url += `&type=restaurant&keyword=steakhouse`;
        } else if (area.filter === 'sushi') {
            url += `&type=restaurant&keyword=sushi`;
        } else if (area.filter === 'upscale') {
            url += `&type=restaurant&minprice=3`; // Only $$$ and $$$$
        } else {
            url += `&type=restaurant`;
        }

        if (nextPageToken) {
            url += `&pagetoken=${nextPageToken}`;
        }

        try {
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
                const places = data.results || [];

                for (const place of places) {
                    // Skip if no name or if it's a chain we don't want
                    if (!place.name) continue;

                    // For upscale filter, ensure high rating
                    if (area.filter === 'upscale' && place.rating < 4.0) continue;

                    results.push({
                        google_place_id: place.place_id,
                        name: place.name,
                        address: place.vicinity,
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        rating: place.rating || null,
                        price_range: mapPriceLevel(place.price_level, place.name),
                        primary_cuisine: detectCuisine(place),
                        neighborhood: area.name.replace(' - Miami Area', ''),
                        is_upscale: area.filter === 'upscale' || place.price_level >= 3,
                        is_ultra_luxury: mapPriceLevel(place.price_level, place.name) === '$$$$$'
                    });
                }

                console.log(`   Found ${places.length} restaurants (page ${pageCount + 1})`);
                nextPageToken = data.next_page_token;
                pageCount++;
            } else {
                console.error(`   Error: ${data.status}`);
                break;
            }
        } catch (error) {
            console.error(`   Error searching ${area.name}:`, error.message);
            break;
        }
    } while (nextPageToken && pageCount < maxPages);

    return results;
}

// Main import function
async function importNeighborhoodRestaurants() {
    console.log('🚀 Starting strategic neighborhood restaurant import...');
    console.log('📍 Base point: 500 Ocean Blvd, Miami Beach');
    console.log('📏 Coverage: 10-mile radius with neighborhood focus\n');

    const allRestaurants = [];
    const existingPlaceIds = new Set();

    // Get existing restaurants to avoid duplicates
    const { data: existing } = await supabase
        .from('restaurants')
        .select('google_place_id')
        .not('google_place_id', 'is', null);

    existing?.forEach(r => existingPlaceIds.add(r.google_place_id));
    console.log(`📊 Already have ${existingPlaceIds.size} restaurants in database\n`);

    // Search each area
    for (const area of SEARCH_AREAS) {
        const restaurants = await searchArea(area);

        // Filter out duplicates
        const newRestaurants = restaurants.filter(r => !existingPlaceIds.has(r.google_place_id));
        allRestaurants.push(...newRestaurants);

        // Add to existing set to avoid cross-area duplicates
        newRestaurants.forEach(r => existingPlaceIds.add(r.google_place_id));

        console.log(`   ✅ ${newRestaurants.length} new restaurants from ${area.name}`);
    }

    // Remove duplicates and prepare for insert
    const uniqueRestaurants = Array.from(
        new Map(allRestaurants.map(r => [r.google_place_id, r])).values()
    );

    console.log('\n' + '='.repeat(50));
    console.log(`📊 IMPORT SUMMARY:`);
    console.log('='.repeat(50));
    console.log(`Total new restaurants found: ${uniqueRestaurants.length}`);

    // Show breakdown by neighborhood
    const byNeighborhood = {};
    uniqueRestaurants.forEach(r => {
        byNeighborhood[r.neighborhood] = (byNeighborhood[r.neighborhood] || 0) + 1;
    });

    console.log('\n📍 By Neighborhood:');
    Object.entries(byNeighborhood)
        .sort((a, b) => b[1] - a[1])
        .forEach(([hood, count]) => {
            console.log(`   ${hood}: ${count}`);
        });

    // Show cuisine breakdown
    const byCuisine = {};
    uniqueRestaurants.forEach(r => {
        byCuisine[r.primary_cuisine] = (byCuisine[r.primary_cuisine] || 0) + 1;
    });

    console.log('\n🍽️  By Cuisine:');
    Object.entries(byCuisine)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([cuisine, count]) => {
            console.log(`   ${cuisine}: ${count}`);
        });

    // Show price breakdown
    const byPrice = {};
    uniqueRestaurants.forEach(r => {
        byPrice[r.price_level] = (byPrice[r.price_level] || 0) + 1;
    });

    console.log('\n💰 By Price Level:');
    const priceOrder = ['$', '$$', '$$$', '$$$$', '$$$$$'];
    priceOrder.forEach(price => {
        if (byPrice[price]) {
            let label = '';
            if (price === '$$$$$') label = ' (Ultra-luxury $150+/person)';
            else if (price === '$$$$') label = ' ($80-150/person)';
            else if (price === '$$$') label = ' ($40-80/person)';
            else if (price === '$$') label = ' ($20-40/person)';
            else if (price === '$') label = ' (Under $20/person)';
            console.log(`   ${price}: ${byPrice[price]}${label}`);
        }
    });

    // Insert into database in batches
    if (uniqueRestaurants.length > 0) {
        console.log(`\n📤 Inserting ${uniqueRestaurants.length} restaurants into database...`);

        const batchSize = 100;
        for (let i = 0; i < uniqueRestaurants.length; i += batchSize) {
            const batch = uniqueRestaurants.slice(i, i + batchSize);

            const { error } = await supabase
                .from('restaurants')
                .insert(batch);

            if (error) {
                console.error(`❌ Error inserting batch: ${error.message}`);
            } else {
                console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}`);
            }
        }
    }

    // Calculate API cost
    const apiCalls = SEARCH_AREAS.length * 3; // Approximate 3 pages per area
    const estimatedCost = (apiCalls * 0.032).toFixed(2);

    console.log(`\n💰 Estimated API cost: $${estimatedCost}`);
    console.log(`💳 Remaining credits: ~$${(299 - parseFloat(estimatedCost)).toFixed(2)}`);
}

// Run the import
importNeighborhoodRestaurants()
    .then(() => {
        console.log('\n✅ Neighborhood import complete!');
        console.log('🎯 Next: Run enrichment to get details (hours, photos, websites)');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });