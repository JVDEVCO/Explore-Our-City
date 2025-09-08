import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

// Comprehensive restaurant categorization
const RESTAURANT_FIXES = {
    // ULTRA-LUXURY $$$$$ (Currently marked as $$$$ or $$$)
    'Uchi Miami': { price: '$$$$$', cuisine: 'Japanese' },
    'The Palm - Miami': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Smith & Wollensky': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Il Gabbiano': { price: '$$$$$', cuisine: 'Italian' },
    'Casa Tua': { price: '$$$$$', cuisine: 'Italian' },
    'Mr Chow': { price: '$$$$$', cuisine: 'Chinese' },
    'Prime 54': { price: '$$$$$', cuisine: 'Steakhouse' },
    "L'Atelier": { price: '$$$$$', cuisine: 'French' },
    'Le Jardinier': { price: '$$$$$', cuisine: 'French' },
    'Forte dei Marmi': { price: '$$$$$', cuisine: 'Italian' },
    'STK Miami': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Papi Steak': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Bourbon Steak': { price: '$$$$$', cuisine: 'Steakhouse' },
    'Katsuya': { price: '$$$$$', cuisine: 'Japanese' },
    'Catch Miami': { price: '$$$$$', cuisine: 'Seafood' },
    'Swan': { price: '$$$$$', cuisine: 'Contemporary' },
    'Boia De': { price: '$$$$$', cuisine: 'Italian' },
    'Elastika': { price: '$$$$$', cuisine: 'Contemporary' },
    'COTE Miami': { price: '$$$$$', cuisine: 'Korean' },
    'CARBONE': { price: '$$$$$', cuisine: 'Italian' },
    'Gekko': { price: '$$$$$', cuisine: 'Japanese' },
    'Casadonna': { price: '$$$$$', cuisine: 'Italian' },
    'La Petite Maison': { price: '$$$$$', cuisine: 'French' },
    'Stubborn Seed': { price: '$$$$$', cuisine: 'Contemporary' },
    'Quattro': { price: '$$$$$', cuisine: 'Italian' },
    'Meat Market': { price: '$$$$$', cuisine: 'Steakhouse' },
    "Maestro's": { price: '$$$$$', cuisine: 'Steakhouse' },
    'Lobster Bar': { price: '$$$$$', cuisine: 'Seafood' },
    'Seaspice': { price: '$$$$$', cuisine: 'Seafood' },
    'Joia Beach': { price: '$$$$$', cuisine: 'Mediterranean' },
    'The Bazaar': { price: '$$$$$', cuisine: 'Spanish' },
    'Estiatorio Milos': { price: '$$$$$', cuisine: 'Greek' },

    // Already correct $$$$$ but wrong cuisine
    'Nobu Miami': { cuisine: 'Japanese' },
    'Hakkasan Miami': { cuisine: 'Chinese' },
    'Los Fuegos': { cuisine: 'Argentinian' },
    'Makoto': { cuisine: 'Japanese' },
    'Zuma Miami': { cuisine: 'Japanese' },
    'Cipriani': { cuisine: 'Italian' },
    'Komodo': { cuisine: 'Asian' },
    'Ariete': { cuisine: 'Contemporary' },
    'Prime 112': { cuisine: 'Steakhouse' },
    "Mastro's Ocean Club": { cuisine: 'Steakhouse' },
    'Azabu': { cuisine: 'Japanese' },

    // High-end $$$$ restaurants with wrong cuisine
    'Pao by Paul Qui': { cuisine: 'Asian' },
    'Villa Azur': { cuisine: 'French' },

    // $$$ restaurants with wrong cuisine
    "Graziano's": { cuisine: 'Argentinian' },
    'Yardbird': { cuisine: 'Southern' },
    'KYU': { cuisine: 'Asian' },
    'Le Bouchon Du Grove': { cuisine: 'French' },
    'Caffe Vialetto': { cuisine: 'Italian' },
    'Dolce Italian': { cuisine: 'Italian' },
    'Benihana': { cuisine: 'Japanese' },
    'Boulud Sud': { cuisine: 'Mediterranean' },
    'Da Tang Zhen Wei': { cuisine: 'Chinese' },
    'Christy': { cuisine: 'American' },
    'Hillstone': { cuisine: 'American' },
    'Artisan Beach House': { cuisine: 'American' },
    "Michael's Genuine": { cuisine: 'Contemporary' },

    // Other restaurants needing fixes
    'Joe\'s Stone Crab': { price: '$$$$', cuisine: 'Seafood' },
    'Versailles': { cuisine: 'Cuban' },
    'La Sandwicherie': { cuisine: 'French' },
    'Puerto Sagua': { cuisine: 'Cuban' },
    'Havana 1957': { cuisine: 'Cuban' },
    'Mandolin': { cuisine: 'Greek' },
    'Milos': { price: '$$$$$', cuisine: 'Greek' },
    'Cecconi': { price: '$$$$', cuisine: 'Italian' },
    'Lucali': { cuisine: 'Pizza' },
    'Steve\'s Pizza': { cuisine: 'Pizza' },
    'Ceviche 105': { cuisine: 'Peruvian' },
    'Osaka': { cuisine: 'Japanese' },
    'Jaguar': { cuisine: 'Latin' },
    'Coyo Taco': { cuisine: 'Mexican' },
    'Bodega': { cuisine: 'Mexican' },
    'Pubbelly Sushi': { cuisine: 'Japanese' },
    'Palat': { cuisine: 'Italian' },
    'Toscana Divino': { cuisine: 'Italian' },
    'Fiola Miami': { price: '$$$$', cuisine: 'Italian' },
    'Bazaar Mar': { price: '$$$$', cuisine: 'Seafood' },
    'NIU Kitchen': { cuisine: 'Spanish' },
    'Byblos': { cuisine: 'Mediterranean' },
    'MC Kitchen': { cuisine: 'Italian' },
    'Paperfish Sushi': { cuisine: 'Japanese' },
    'Sushi Sake': { cuisine: 'Japanese' },
    'Soya e Pomodoro': { cuisine: 'Italian' },
    'Sardinia': { cuisine: 'Italian' },
    'Red South Beach': { price: '$$$$', cuisine: 'Steakhouse' },
    'Stiltsville': { cuisine: 'Seafood' },
    'Garcia\'s Seafood': { cuisine: 'Seafood' },
    'Captain Jim': { cuisine: 'Seafood' },
    'Monty\'s': { cuisine: 'Seafood' },
    'Lure Fishbar': { cuisine: 'Seafood' },
    'Estiatorio Ornos': { price: '$$$$', cuisine: 'Greek' },
    'Santorini by Georgios': { cuisine: 'Greek' },
    'Mister O1': { cuisine: 'Pizza' },
    'Harry\'s Pizzeria': { cuisine: 'Pizza' },
    'Visa O1': { cuisine: 'Pizza' },
    'Andiamo': { cuisine: 'Pizza' },
    'Miami Slice': { cuisine: 'Pizza' },
    'Ironside Pizza': { cuisine: 'Pizza' },
    'Stanzione 87': { cuisine: 'Pizza' },
    'Lucali': { cuisine: 'Pizza' },
    'Reunion Ktchn Bar': { cuisine: 'American' },
    'The Wharf': { cuisine: 'Seafood' },
    'American Social': { cuisine: 'American' },
    'Tap 42': { cuisine: 'American' },
    'The Local House': { cuisine: 'American' },
    'Batch Gastropub': { cuisine: 'American' },
    'Kush': { cuisine: 'American' },
    'LoKal': { cuisine: 'American' },
    'Pinch Kitchen': { cuisine: 'American' },
    'Beaker & Gray': { cuisine: 'American' },
    'Mignonette': { cuisine: 'Seafood' },
    'River Oyster Bar': { cuisine: 'Seafood' },
    'Casablanca': { cuisine: 'Seafood' },
    'The River Seafood': { cuisine: 'Seafood' },
    'Truluck\'s': { price: '$$$$', cuisine: 'Seafood' },
    'Eddie V\'s': { price: '$$$$', cuisine: 'Seafood' },
    'Fleming\'s': { price: '$$$$', cuisine: 'Steakhouse' },
    'Morton\'s': { price: '$$$$', cuisine: 'Steakhouse' },
    'Ruth\'s Chris': { price: '$$$$', cuisine: 'Steakhouse' },
    'Texas de Brazil': { cuisine: 'Brazilian' },
    'Fogo de Chão': { cuisine: 'Brazilian' },
    'Porcao': { cuisine: 'Brazilian' },
    'Rodizio Grill': { cuisine: 'Brazilian' },
    'Sushi Maki': { cuisine: 'Japanese' },
    'Sushi Samba': { cuisine: 'Japanese' },
    'Sushi Katsuya': { price: '$$$$$', cuisine: 'Japanese' },
    'Toku': { cuisine: 'Japanese' },
    'Doraku': { cuisine: 'Japanese' },
    'Moshi Moshi': { cuisine: 'Japanese' },
    'Suviche': { cuisine: 'Peruvian' },
    'CVI.CHE 105': { cuisine: 'Peruvian' },
    'La Mar': { cuisine: 'Peruvian' },
    'Francesco': { cuisine: 'Peruvian' },
    'Pisco y Nazca': { cuisine: 'Peruvian' },
    'Chalan on the Beach': { cuisine: 'Peruvian' },
    'Pollos & Jarras': { cuisine: 'Peruvian' },
    'El Chalan': { cuisine: 'Peruvian' },
    'Divino Ceviche': { cuisine: 'Peruvian' },
    'Mofongo': { cuisine: 'Caribbean' },
    'Ortanique': { cuisine: 'Caribbean' },
    'Bahama Breeze': { cuisine: 'Caribbean' },
    'Miss Lily\'s': { cuisine: 'Caribbean' },
    'Sugarcane': { cuisine: 'Caribbean' }
};

async function fixRestaurants() {
    console.log('🔧 Fixing restaurant prices and cuisines...\n');

    let priceUpdates = 0;
    let cuisineUpdates = 0;
    let errors = 0;

    // Get all restaurants
    const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name, price_range, primary_cuisine');

    if (!restaurants) {
        console.error('Failed to fetch restaurants');
        return;
    }

    console.log(`📊 Checking ${restaurants.length} restaurants...\n`);

    for (const restaurant of restaurants) {
        // Check if this restaurant needs fixes
        let needsUpdate = false;
        const updates = {};

        // Try different name matching strategies
        const matchKey = Object.keys(RESTAURANT_FIXES).find(key => {
            const restaurantNameLower = restaurant.name.toLowerCase();
            const keyLower = key.toLowerCase();

            // Exact match
            if (restaurantNameLower === keyLower) return true;

            // Contains match
            if (restaurantNameLower.includes(keyLower)) return true;

            // Key contains restaurant name (for partial matches)
            if (keyLower.includes(restaurantNameLower.split(' ')[0].toLowerCase())) return true;

            return false;
        });

        if (matchKey) {
            const fix = RESTAURANT_FIXES[matchKey];

            // Check if price needs updating
            if (fix.price && fix.price !== restaurant.price_range) {
                updates.price_range = fix.price;
                needsUpdate = true;
                console.log(`💰 ${restaurant.name}: ${restaurant.price_range} → ${fix.price}`);
                priceUpdates++;
            }

            // Check if cuisine needs updating
            if (fix.cuisine && fix.cuisine !== restaurant.primary_cuisine) {
                updates.primary_cuisine = fix.cuisine;
                needsUpdate = true;
                console.log(`🍽️  ${restaurant.name}: ${restaurant.primary_cuisine} → ${fix.cuisine}`);
                cuisineUpdates++;
            }

            // Apply updates if needed
            if (needsUpdate) {
                updates.last_updated = new Date().toISOString();

                const { error } = await supabase
                    .from('restaurants')
                    .update(updates)
                    .eq('id', restaurant.id);

                if (error) {
                    console.error(`❌ Error updating ${restaurant.name}: ${error.message}`);
                    errors++;
                }
            }
        }
    }

    // Get final stats
    const { data: finalStats } = await supabase
        .from('restaurants')
        .select('price_range, primary_cuisine');

    const priceCount = {};
    const cuisineCount = {};

    finalStats?.forEach(r => {
        priceCount[r.price_range] = (priceCount[r.price_range] || 0) + 1;
        if (r.primary_cuisine === 'Contemporary') {
            cuisineCount['Contemporary'] = (cuisineCount['Contemporary'] || 0) + 1;
        }
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 FIX COMPLETE:');
    console.log('='.repeat(50));
    console.log(`💰 Price updates: ${priceUpdates}`);
    console.log(`🍽️  Cuisine updates: ${cuisineUpdates}`);
    console.log(`❌ Errors: ${errors}`);

    console.log('\n💵 Final price distribution:');
    ['$', '$$', '$$$', '$$$$', '$$$$$'].forEach(price => {
        if (priceCount[price]) {
            console.log(`   ${price}: ${priceCount[price]}`);
        }
    });

    console.log(`\n🍽️  Remaining "Contemporary": ${cuisineCount['Contemporary'] || 0}`);

    const ultraLuxury = priceCount['$$$$$'] || 0;
    console.log(`\n✨ Total ultra-luxury restaurants: ${ultraLuxury}`);
}

// Run it
fixRestaurants()
    .then(() => {
        console.log('\n✅ Restaurant fixes complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });