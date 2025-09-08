// scripts/comprehensive-restaurant-fix.mjs
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// COMPREHENSIVE FIXES - EXACT NAME MATCHES ONLY
const RESTAURANT_FIXES = {
    // CRITICAL PRICE FIXES - Famous steakhouses wrongly at $$
    'Prime 112': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Prime 112 Restaurant': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Prime Fish': { price: '$$$$', cuisine: 'Seafood' },
    'Prime Italian': { price: '$$$$', cuisine: 'Italian' },
    'STK Steakhouse': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Stk South Beach': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Smith & Wollensky Restaurant': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Smith & Wollensky - Miami Beach': { price: '$$$$$', cuisine: 'Steakhouse' },
    "Mastro's Ocean Club": { price: '$$$$$', cuisine: 'Steakhouse' },
    'The Capital Grille': { price: '$$$$', cuisine: 'Steakhouse' },
    'The Bazaar by José Andrés': { price: '$$$$', cuisine: 'Spanish' },
    "Fleming's Prime Steakhouse & Wine Bar": { price: '$$$$', cuisine: 'Steakhouse' },

    // Fix wrongly categorized as Steakhouse
    'The Licking': { cuisine: 'Southern' },
    'The Licking Food Court': { cuisine: 'Southern' },
    'The Licking South Beach': { cuisine: 'Southern' },
    'The Fresh Carrot of Surfside': { cuisine: 'Healthy' },
    'The Last Carrot - smoothies, fresh juices, healthy fare, vegetarian friendly': { cuisine: 'Healthy' },
    'The Daily Creative Food Co.': { cuisine: 'American' },
    'The Local House': { cuisine: 'American' },
    'The Betsy Hotel': { cuisine: 'American' },
    'The Bass': { cuisine: 'Contemporary' },
    'The Piefather': { cuisine: 'Pizza' },

    // Fix wrongly categorized as Japanese
    'I Heart Fries': { price: '$', cuisine: 'Fast Food' },
    'Miami Beach Chocolates': { price: '$', cuisine: 'Dessert' },

    // Fix wrongly categorized as Italian (should be Pizza)
    "Domino's Pizza": { cuisine: 'Pizza' },
    'Papa Johns Pizza': { cuisine: 'Pizza' },
    "Fialkoff's Kosher Pizza": { cuisine: 'Pizza' },
    'Moncheese Pizza': { cuisine: 'Pizza' },
    'Spris Artisan Pizza - Midtown': { cuisine: 'Pizza' },

    // Fix wrongly categorized as French
    'Sandwich Miami Brickell': { cuisine: 'Deli' },

    // Fix casual grills wrongly marked as Steakhouse
    'Barracuda Taphouse & Grill': { cuisine: 'American' },
    'Beaches Bar And Grill': { cuisine: 'American' },
    'Fresh Kitchen Miami Midtown': { cuisine: 'Healthy' },
    'Hibachi Grill & Noodle Bar': { cuisine: 'Asian' },
    'Sandbar Sports Grill': { cuisine: 'Sports Bar' },

    // Other steakhouse price corrections
    'BH Prime Steakhouse': { price: '$$$', cuisine: 'Steakhouse' },
    'Gaucho Ranch Grill and Wines': { price: '$$$$', cuisine: 'Steakhouse' },
    "Perry's Steakhouse & Grille": { price: '$$$$', cuisine: 'Steakhouse' },
    'LT Steak & Seafood': { price: '$$$$', cuisine: 'Steakhouse' },
    'Stripsteak': { price: '$$$$', cuisine: 'Steakhouse' },

    // Flanigan's corrections (it's a casual chain)
    "Flanigan's Seafood Bar and Grill": { cuisine: 'American' },

    // Fix "The" restaurants that aren't steakhouses
    'The Carlyle Cafe': { cuisine: 'American' },
    'The Bistro': { cuisine: 'American' },
    'THE BISTRO - EAT. DRINK. CONNECT.': { cuisine: 'American' },
    'The Harbour Grill': { cuisine: 'Seafood' },
    'The Tavern - American Restaurant in Miami Beach': { cuisine: 'American' },
    'The Savoy Hotel & Beach Club ~ Miami Beach': { cuisine: 'American' },
    'The Restaurant at Grand Beach Surfside': { cuisine: 'American' },
    'The Sandbox': { cuisine: 'American' },
    'The Lido Bayside Grill': { cuisine: 'Seafood' },
    'The Lobster Shack': { cuisine: 'Seafood' },
    'The Matador Room': { price: '$$$$', cuisine: 'Latin' },
    'The Mutiny Hotel by Provident Hotels & Resorts': { cuisine: 'American' },

    // Additional corrections for known restaurants
    'Outback Steakhouse': { cuisine: 'Steakhouse' }, // Keep at $$ - it's a chain
    'Texas de Brazil': { price: '$$$', cuisine: 'Brazilian' },
    'Fogo de Chão': { price: '$$$', cuisine: 'Brazilian' },
    "Garcia's Seafood Grille & Fish Market": { cuisine: 'Seafood' },
    'Le Bouchon Du Grove': { cuisine: 'French' },
    'Le Pain Quotidien': { cuisine: 'French' },
    'Arkadia Grill': { cuisine: 'Mediterranean' },
    'Europa Restaurant And Grille': { cuisine: 'European' },

    // Fix duplicate/variations
    'FL Cafe': { price: '$$', cuisine: 'American' },
    'Fl Cafe': { price: '$$', cuisine: 'American' }
};

async function previewAndFix() {
    console.log('🔍 ANALYZING RESTAURANT DATA...\n');

    const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name, price_range, primary_cuisine')
        .order('name');

    if (!restaurants) {
        console.error('Failed to fetch restaurants');
        return;
    }

    const changes = [];

    // Check each restaurant for EXACT name match
    for (const restaurant of restaurants) {
        const fix = RESTAURANT_FIXES[restaurant.name];

        if (fix) {
            const updates = {};
            let changeDesc = [];

            if (fix.price && fix.price !== restaurant.price_range) {
                updates.price_range = fix.price;
                changeDesc.push(`💰 ${restaurant.price_range} → ${fix.price}`);
            }

            if (fix.cuisine && fix.cuisine !== restaurant.primary_cuisine) {
                updates.primary_cuisine = fix.cuisine;
                changeDesc.push(`🍽️ ${restaurant.primary_cuisine} → ${fix.cuisine}`);
            }

            if (changeDesc.length > 0) {
                changes.push({
                    id: restaurant.id,
                    name: restaurant.name,
                    updates,
                    description: changeDesc.join(' | ')
                });
            }
        }
    }

    // Group changes by type for better visibility
    const priceChanges = changes.filter(c => c.updates.price_range);
    const cuisineChanges = changes.filter(c => c.updates.primary_cuisine && !c.updates.price_range);
    const bothChanges = changes.filter(c => c.updates.price_range && c.updates.primary_cuisine);

    console.log('=' + '='.repeat(60));
    console.log('📊 CHANGES NEEDED:');
    console.log('=' + '='.repeat(60));

    if (bothChanges.length > 0) {
        console.log('\n🔄 BOTH PRICE & CUISINE FIXES:');
        bothChanges.forEach(c => console.log(`   ${c.name}\n      ${c.description}`));
    }

    if (priceChanges.length > 0) {
        console.log('\n💰 PRICE FIXES ONLY:');
        priceChanges.forEach(c => console.log(`   ${c.name}: ${c.description}`));
    }

    if (cuisineChanges.length > 0) {
        console.log('\n🍽️ CUISINE FIXES ONLY:');
        cuisineChanges.forEach(c => console.log(`   ${c.name}: ${c.description}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`TOTAL CHANGES: ${changes.length}`);
    console.log('='.repeat(60));

    if (changes.length === 0) {
        console.log('✅ No changes needed.');
        return;
    }

    console.log('\n⚠️  PREVIEW MODE - No changes made yet');
    console.log('To apply these changes, run:');
    console.log('node scripts/comprehensive-restaurant-fix.mjs --apply\n');

    // If --apply flag present, make changes
    if (process.argv.includes('--apply')) {
        console.log('🚀 APPLYING CHANGES...\n');

        let success = 0;
        let errors = 0;

        for (const change of changes) {
            const { error } = await supabase
                .from('restaurants')
                .update({ ...change.updates, last_updated: new Date().toISOString() })
                .eq('id', change.id);

            if (error) {
                console.error(`❌ Failed: ${change.name} - ${error.message}`);
                errors++;
            } else {
                console.log(`✅ Fixed: ${change.name}`);
                success++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`RESULTS: ${success} fixed, ${errors} errors`);
        console.log('='.repeat(60));
    }
}

previewAndFix()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });