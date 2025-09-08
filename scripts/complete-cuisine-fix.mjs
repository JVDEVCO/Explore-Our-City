import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from .env.local file
const envPath = join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Based on your research
const SPECIFIC_FIXES = {
    'Boldva': { cuisine: 'Hungarian' },
    'Musigny': { cuisine: 'French' },
    'Rwsb': { name: 'RWSB (Restaurant at W South Beach)', cuisine: 'Italian' },
    "Winker's Diner": { cuisine: 'Deli' },
    'Lingenfelser': { name: 'The Lobster Shack', cuisine: 'Seafood' },
    'Koa Restaurants': { name: 'Koa Poke', cuisine: 'Hawaiian' },
    'Snow at the Beach': { cuisine: 'Dessert' },
    'Toothfairy': { cuisine: 'Delete' }, // Weird entry
    'The Licking South Beach': { cuisine: 'Southern' },
    'Sabor Playa Restaurant': { cuisine: 'Latin' },
    "D'vine": { cuisine: 'Wine Bar' },
    'Tb Purdy Restaurant': { cuisine: 'Bar' },
    'Burbowl 3': { cuisine: 'Burgers' },
    'Plnthouse': { name: 'Penthouse', cuisine: 'Bar' },
    'The Sandbox': { cuisine: 'Bar' },
    'Jules Kitchen': { cuisine: 'Contemporary' },
    'Miami Live': { cuisine: 'Bar' },
    'Paul': { cuisine: 'French' }, // Paul Bakery
    'Habitat': { cuisine: 'Contemporary' },
    'Secreto': { cuisine: 'Latin' },
    'Rosa Sky': { cuisine: 'Contemporary' },
    'Amara at Paraiso': { cuisine: 'Latin' },
    'Casa Xabi': { cuisine: 'Spanish' },
    'Elia': { cuisine: 'Mediterranean' },
    'Petralunga': { cuisine: 'Italian' },
    'Go Go Fresh Holding': { cuisine: 'Delete' }, // Corporate name
    'Grna Lc of Fl': { cuisine: 'Delete' }, // Corporate name
    'Hear Music #13007 the Prentice-hall': { cuisine: 'Delete' }, // Not a restaurant
    'M-3 of Miami Beach': { cuisine: 'Delete' }, // Corporate name
    'Llam': { cuisine: 'Delete' }, // Corporate name
    'Jnrl Resturant': { cuisine: 'Delete' }, // Typo/bad data
    'J.p Miami': { cuisine: 'Delete' }, // Corporate name
    'Pt': { cuisine: 'Delete' }, // Pollo Tropical - fast food
    'It Miami': { cuisine: 'Delete' }, // Unclear
    'Veterans of Foreign Wars': { cuisine: 'Delete' }, // Not a restaurant
    'Tropicana Food By the Pound': { cuisine: 'Latin' },
    'I Heart Fries': { cuisine: 'Fast Food' },
    'Chick N Jones': { cuisine: 'Southern' },
    'Holy Avocado': { cuisine: 'Healthy' },
    "Fi'lia South Beach": { cuisine: 'Italian' },
    'Guayacan Miami Restaurant': { cuisine: 'Latin' },
    'Broadwalk Restaurant on the Beach': { cuisine: 'Seafood' },
    'The Scape Goat': { cuisine: 'Bar' },
    'Mr Jones': { cuisine: 'Bar' },
    'Shepherd Triton': { cuisine: 'Cafe' },
    'Lm Sunset Harbour': { cuisine: 'Contemporary' },
    'Bros on the Beach': { cuisine: 'Bar' },
    'On the Rocks': { cuisine: 'Bar' },
    'Lost Weekend/feelgoods': { cuisine: 'Bar' },
    'Broken Shak': { name: 'Broken Shaker', cuisine: 'Bar' },
    'Vita,  Baoli Vita': { name: 'Baoli', cuisine: 'Asian' },
    'Blu Gin': { cuisine: 'Bar' },
    'Deck Sixteen': { cuisine: 'Bar' },
    'Exchange Miami': { cuisine: 'Bar' },
    'Wilde on the Porch': { cuisine: 'Contemporary' },
    'Thanks To Harrison': { cuisine: 'Contemporary' },
    'Orange Blossom': { cuisine: 'Mediterranean' },
    'Kings Dining & Entertainment': { cuisine: 'Sports Bar' },
    "Doc B's Restaurant": { cuisine: 'Contemporary' },
    "Balan's": { cuisine: 'British' },
    'Fonda Sabaneta': { cuisine: 'Latin' },
    'Lucio Cuisine': { cuisine: 'Italian' },
    'Mumis Cuisine': { cuisine: 'Latin' },
    "SYLOTTE'S CUISINE": { cuisine: 'Caribbean' },
    'Family Cuisine': { cuisine: 'Caribbean' },
    'TeeZee Tasty Cuisine': { cuisine: 'Caribbean' },
    'Lazeez Cuisine': { cuisine: 'Mediterranean' },
    "Lalou's Cuisine and Catering": { cuisine: 'Caribbean' },
    '1435 Alton Road': { cuisine: 'Delete' }, // Just an address
    "Eddy's 305 Food Truck": { cuisine: 'Food Truck' },
    '7 SIETE MARAVILLAS FOOD TRUCK Miami': { cuisine: 'Food Truck' },
    'Safron': { name: 'Saffron', cuisine: 'Indian' },
    'Treehouse': { cuisine: 'Bar' },
    'Diced- Kendall': { cuisine: 'Healthy' },
    'Pines Alley Cook': { cuisine: 'Contemporary' },
    'Pajeoly': { cuisine: 'Delete' }, // Unknown
    'Culinary Arts Catering': { cuisine: 'Delete' }, // Catering only
    '27': { cuisine: 'Contemporary' },
    '7ty One': { cuisine: 'Contemporary' },
    '6080 Collins Star': { cuisine: 'Delete' }, // Unclear
    'Albion Hotel': { name: 'Albion Hotel Restaurant', cuisine: 'Contemporary' }
};

// Fast food chains to delete
const FAST_FOOD_CHAINS = [
    'Chicken Kitchen',
    'International House of Pancake',
    "Denny's",
    'Tgi Fridays'
];

// Legitimate American restaurants that should stay American
const KEEP_AMERICAN = [
    '11th Street Diner',
    'Big Pink',
    'Yard House',
    "Houston's"
];

async function completeFix() {
    console.log('🎯 Final comprehensive cuisine fix...\n');

    let updated = 0;
    let deleted = 0;
    let keptAmerican = 0;

    // Get all American restaurants
    const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('primary_cuisine', 'American');

    console.log(`Processing ${restaurants.length} American restaurants...\n`);

    for (const restaurant of restaurants) {
        // Check if it should be kept as American
        if (KEEP_AMERICAN.some(keep => restaurant.name.includes(keep))) {
            console.log(`✅ Keeping as American: ${restaurant.name}`);
            keptAmerican++;
            continue;
        }

        // Check if it's fast food to delete
        if (FAST_FOOD_CHAINS.some(chain => restaurant.name.includes(chain))) {
            const { error } = await supabase
                .from('restaurants')
                .delete()
                .eq('id', restaurant.id);

            if (!error) {
                console.log(`🗑️  Deleted fast food: ${restaurant.name}`);
                deleted++;
            }
            continue;
        }

        // Check for specific fixes
        const fix = SPECIFIC_FIXES[restaurant.name];
        if (fix) {
            if (fix.cuisine === 'Delete') {
                const { error } = await supabase
                    .from('restaurants')
                    .delete()
                    .eq('id', restaurant.id);

                if (!error) {
                    console.log(`🗑️  Deleted: ${restaurant.name}`);
                    deleted++;
                }
            } else {
                const updateData = {
                    primary_cuisine: fix.cuisine,
                    last_updated: new Date().toISOString()
                };

                if (fix.name) {
                    updateData.name = fix.name;
                }

                const { error } = await supabase
                    .from('restaurants')
                    .update(updateData)
                    .eq('id', restaurant.id);

                if (!error) {
                    const nameChange = fix.name ? ` → ${fix.name}` : '';
                    console.log(`✅ Updated: ${restaurant.name}${nameChange} (${fix.cuisine})`);
                    updated++;
                }
            }
        }
    }

    // Get final stats
    const { data: finalRestaurants } = await supabase
        .from('restaurants')
        .select('primary_cuisine');

    const cuisineCounts = {};
    finalRestaurants?.forEach(r => {
        cuisineCounts[r.primary_cuisine] = (cuisineCounts[r.primary_cuisine] || 0) + 1;
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 FINAL COMPLETE SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updated} restaurants`);
    console.log(`🗑️  Deleted: ${deleted} entries`);
    console.log(`🔵 Kept as American: ${keptAmerican} restaurants`);
    console.log(`📊 Total restaurants: ${finalRestaurants.length}`);

    console.log('\n🍽️  Final cuisine distribution:');
    Object.entries(cuisineCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([cuisine, count]) => {
            const percentage = ((count / finalRestaurants.length) * 100).toFixed(1);
            console.log(`   ${cuisine}: ${count} (${percentage}%)`);
        });

    const americanCount = cuisineCounts['American'] || 0;
    const americanPercent = ((americanCount / finalRestaurants.length) * 100).toFixed(1);
    console.log(`\n✨ American restaurants now: ${americanCount} (${americanPercent}%) - Realistic for Miami Beach!`);
}

// Run it
completeFix()
    .then(() => {
        console.log('\n🎉 CUISINE CATEGORIZATION COMPLETE!');
        console.log('🚀 Ready for next phase of platform development!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });