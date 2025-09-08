import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from .env.local file with absolute path
const envPath = join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Valid cuisines from your list
const VALID_CUISINES = [
    'American', 'Argentinian', 'BBQ', 'Brazilian', 'British', 'Burgers',
    'Caribbean', 'Chinese', 'Cuban', 'Ethiopian', 'French', 'Fusion',
    'German', 'Greek', 'Indian', 'Italian', 'Japanese', 'Korean',
    'Lebanese', 'Maine Lobster', 'Mediterranean', 'Mexican', 'Moroccan',
    'Peruvian', 'Pizza', 'Russian', 'Seafood', 'Spanish', 'Steakhouse',
    'Sushi', 'Thai', 'Turkish', 'Vegan', 'Vegetarian', 'Vietnamese', 'Latin'
];

// Cuisine keywords mapping
const CUISINE_KEYWORDS = {
    'Italian': ['italian', 'tuscan', 'sicilian', 'roman', 'neapolitan', 'venetian', 'milanese', 'florentine', 'pasta', 'pizza', 'risotto'],
    'Mediterranean': ['mediterranean', 'levantine', 'middle eastern'],
    'Mexican': ['mexican', 'tex-mex', 'taqueria', 'taco', 'burrito', 'cantina'],
    'Latin': ['colombian', 'venezuelan', 'nicaraguan', 'salvadoran', 'honduran', 'guatemalan', 'ecuadorian', 'south american', 'latin american', 'central american'],
    'Caribbean': ['caribbean', 'puerto rican', 'jamaican', 'haitian', 'trinidadian', 'cuban', 'dominican', 'west indian', 'island'],
    'Turkish': ['turkish', 'ottoman', 'anatolian', 'kebab', 'meze'],
    'Spanish': ['spanish', 'tapas', 'catalan', 'basque', 'andalusian', 'galician'],
    'French': ['french', 'bistro', 'brasserie', 'provençal', 'burgundian', 'alsatian'],
    'Japanese': ['japanese', 'sushi', 'ramen', 'izakaya', 'kaiseki', 'tempura', 'yakitori'],
    'Chinese': ['chinese', 'cantonese', 'szechuan', 'sichuan', 'hunan', 'shanghai', 'beijing', 'dim sum'],
    'Thai': ['thai', 'siamese', 'isaan'],
    'Vietnamese': ['vietnamese', 'pho', 'banh mi'],
    'Korean': ['korean', 'kimchi', 'bulgogi', 'bibimbap', 'k-bbq'],
    'Indian': ['indian', 'punjabi', 'bengali', 'gujarati', 'south indian', 'north indian', 'tandoori', 'curry', 'biryani'],
    'Greek': ['greek', 'hellenic', 'aegean', 'cretan'],
    'Lebanese': ['lebanese', 'levantine', 'beirut'],
    'Peruvian': ['peruvian', 'ceviche', 'pisco', 'nikkei'],
    'Brazilian': ['brazilian', 'churrasco', 'rodizio', 'feijoada'],
    'Argentinian': ['argentinian', 'argentine', 'asado', 'parrilla'],
    'Ethiopian': ['ethiopian', 'eritrean', 'habesha'],
    'Moroccan': ['moroccan', 'maghreb', 'tagine'],
    'Seafood': ['seafood', 'fish', 'sushi', 'oyster', 'lobster', 'crab', 'shrimp'],
    'Steakhouse': ['steakhouse', 'steak', 'prime rib', 'wagyu', 'angus'],
    'BBQ': ['barbecue', 'bbq', 'smokehouse', 'pulled pork', 'brisket', 'ribs'],
    'Pizza': ['pizza', 'pizzeria', 'neapolitan pizza', 'deep dish', 'wood-fired'],
    'Burgers': ['burger', 'hamburger', 'cheeseburger'],
    'Vegan': ['vegan', 'plant-based', 'plant based'],
    'Vegetarian': ['vegetarian', 'veggie', 'meatless'],
    'Fusion': ['fusion', 'eclectic', 'contemporary', 'modern', 'innovative']
};

// Fetch place details from Google
async function fetchPlaceDetails(placeId) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,editorial_summary,types,price_level,website,formatted_phone_number,opening_hours,reviews&key=${GOOGLE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
            return data.result;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching details for ${placeId}:`, error.message);
        return null;
    }
}

// Extract cuisine from place details
function extractCuisineFromDetails(details) {
    if (!details) return null;

    // Check editorial summary first (most reliable)
    const editorial = details.editorial_summary?.overview || '';
    const lowerEditorial = editorial.toLowerCase();

    // Check reviews for cuisine mentions
    const reviews = details.reviews || [];
    const reviewText = reviews.map(r => r.text).join(' ').toLowerCase();

    // Combine all text sources
    const allText = `${lowerEditorial} ${reviewText}`.toLowerCase();

    // Count mentions of each cuisine type
    const cuisineScores = {};

    for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
        let score = 0;
        for (const keyword of keywords) {
            // Count occurrences in editorial (worth more)
            const editorialMatches = (lowerEditorial.match(new RegExp(keyword, 'g')) || []).length;
            score += editorialMatches * 3;

            // Count occurrences in reviews
            const reviewMatches = (reviewText.match(new RegExp(keyword, 'g')) || []).length;
            score += reviewMatches;
        }

        if (score > 0) {
            cuisineScores[cuisine] = score;
        }
    }

    // Find the cuisine with the highest score
    if (Object.keys(cuisineScores).length > 0) {
        const topCuisine = Object.entries(cuisineScores)
            .sort((a, b) => b[1] - a[1])[0][0];

        console.log(`      📍 Detected from details: ${topCuisine} (confidence: ${cuisineScores[topCuisine]})`);

        // Log the editorial summary if it exists
        if (editorial) {
            console.log(`      📝 Summary: "${editorial.substring(0, 100)}..."`);
        }

        return topCuisine;
    }

    return null;
}

// Main function to fix cuisine types
async function fixCuisineTypes() {
    console.log('🔍 Starting Google Places Details cuisine fix...');
    console.log('📊 This will get detailed descriptions from Google to properly categorize restaurants\n');

    // Get all restaurants currently marked as "American"
    const { data: americanRestaurants, error } = await supabase
        .from('restaurants')
        .select('id, name, google_place_id, primary_cuisine')
        .eq('primary_cuisine', 'American')
        .not('google_place_id', 'is', null)
        .limit(50); // Start with 50 to test and control costs

    if (error) {
        console.error('Error fetching restaurants:', error);
        return;
    }

    console.log(`Found ${americanRestaurants.length} "American" restaurants to check\n`);
    console.log('⚠️  Note: Places Details API costs ~$0.017 per request\n');

    const updates = {
        fixed: 0,
        stillAmerican: 0,
        errors: 0
    };

    // Process each restaurant
    for (const restaurant of americanRestaurants) {
        console.log(`\n🍽️  Checking: ${restaurant.name}`);

        // Rate limiting - Google allows 10 QPS
        await new Promise(resolve => setTimeout(resolve, 150));

        const details = await fetchPlaceDetails(restaurant.google_place_id);

        if (details) {
            const detectedCuisine = extractCuisineFromDetails(details);

            if (detectedCuisine && detectedCuisine !== 'American') {
                // Update the restaurant with the correct cuisine
                const { error: updateError } = await supabase
                    .from('restaurants')
                    .update({
                        primary_cuisine: detectedCuisine,
                        website: details.website || null,
                        phone: details.formatted_phone_number || null,
                        hours: details.opening_hours || null,
                        last_updated: new Date().toISOString()
                    })
                    .eq('id', restaurant.id);

                if (updateError) {
                    console.error(`      ❌ Error updating: ${updateError.message}`);
                    updates.errors++;
                } else {
                    console.log(`      ✅ Updated cuisine: American → ${detectedCuisine}`);
                    updates.fixed++;
                }
            } else {
                console.log(`      ℹ️  Keeping as American (no specific cuisine detected)`);
                updates.stillAmerican++;
            }
        } else {
            console.log(`      ⚠️  Could not fetch details`);
            updates.errors++;
        }
    }

    // Final report
    console.log('\n' + '='.repeat(50));
    console.log('📈 CUISINE FIX COMPLETE - SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Fixed: ${updates.fixed} restaurants`);
    console.log(`🔵 Still American: ${updates.stillAmerican} restaurants`);
    console.log(`❌ Errors: ${updates.errors}`);

    // Show new cuisine distribution
    const { data: cuisineStats } = await supabase
        .from('restaurants')
        .select('primary_cuisine')
        .not('primary_cuisine', 'is', null);

    const cuisineCounts = {};
    cuisineStats?.forEach(r => {
        cuisineCounts[r.primary_cuisine] = (cuisineCounts[r.primary_cuisine] || 0) + 1;
    });

    console.log('\n🍽️  Updated Cuisine Distribution:');
    Object.entries(cuisineCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Show top 10
        .forEach(([cuisine, count]) => {
            console.log(`   ${cuisine}: ${count}`);
        });

    // Cost estimate
    const apiCalls = americanRestaurants.length;
    const estimatedCost = (apiCalls * 0.017).toFixed(2);
    console.log(`\n💰 Estimated API cost: $${estimatedCost}`);
}

// Run the fix
fixCuisineTypes()
    .then(() => {
        console.log('\n✅ Cuisine fix completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });