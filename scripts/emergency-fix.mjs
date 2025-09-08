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

// Known bad classifications to revert
const REVERT_TO_NORMAL = [
    'I Heart Fries',
    'Miami Beach Chocolates',
    'The Fresh Carrot',
    'The Licking',
    'The Licking Food Court',
    'The Licking South Beach',
    'Miami Beach Pizza',
    'Miami Beach Resort & Spa',
    'The Last Carrot',
    'The Daily Creative Food Co',
    'Miami River Mexican Cuisine',
    'Miami to Brazil Rodizio',
    'The Piefather',
    'Mi Colombia Restaurant',
    'Mi Ranchito Bar',
    'Mia Market Food Hall',
    'MIAM CAFE-WYNWOOD'
];

// All "El" restaurants that got marked as French (should be Latin/Spanish/Mexican)
const EL_RESTAURANTS_FIX = {
    'El Atlakat Restaurant': 'Middle Eastern',
    'El Bajareque': 'Latin',
    'El Bandejazo Restaurant': 'Latin',
    'El Bori Food Truck': 'Puerto Rican',
    'El Gran Bamboo Restaurant': 'Cuban',
    'El Novillo Restaurant': 'Argentinian',
    'El Pimiento Restaurant': 'Latin',
    'El Sole Miami': 'Mexican',
    'El Tayta': 'Peruvian',
    'El Toro Loco Steakhouse': 'Steakhouse',
    'El Tropico Cuban Cuisine': 'Cuban',
    'El Turco Upper Buena Vista': 'Turkish'
};

// "La" restaurants wrongly marked as Contemporary or Steakhouse
const LA_RESTAURANTS_FIX = {
    'La Casita Cuban Cuisine': 'Cuban',
    'La Cerveceria Lincoln': 'Spanish',
    'La Cerveceria Ocean': 'Spanish',
    'La Côte': 'French',
    'La Crema Food and Grill': 'Latin',
    'La Famosa Cafeteria': 'Cuban',
    'La Fogata BBQ': 'BBQ',
    'La Fontana Italian Restaurant': 'Italian',
    'LA JATO RESTAURANT': 'Latin',
    'La Locanda': 'Italian',
    'La Parrilla Liberty': 'Argentinian',
    'La Patagonia Argentina Restaurant': 'Argentinian',
    'La Perla Peruvian Restaurant': 'Peruvian',
    'La Piscine': 'French',
    'La Placita Taco Grill': 'Mexican',
    'La Rosa Fine Cuban Cuisine': 'Cuban',
    'La Sandwicherie': 'French',
    'La Ventana Miami Beach': 'Latin',
    'La Vita e Bella': 'Italian',
    'Las Olas Cafe': 'Cuban',
    'Las Vegas Cuban Cuisine': 'Cuban'
};

// "Los" restaurants wrongly marked as Greek
const LOS_RESTAURANTS_FIX = {
    'Los Fuegos by Francis Mallmann': { price: '$$$$$', cuisine: 'Argentinian' },
    'Los Gauchitos': { price: '$$', cuisine: 'Argentinian' },
    'Los Ranchos Steakhouse': { price: '$$$', cuisine: 'Steakhouse' },
    'Los Verdes Country walk': { price: '$$', cuisine: 'Latin' }
};

// The actual ultra-luxury restaurants (keep these at $$$$$)
const REAL_ULTRA_LUXURY = [
    'Nobu Miami',
    'Zuma Miami',
    'Hakkasan Miami',
    'COTE Miami',
    'Carbone',
    'CARBONE VINO',
    'Prime 112',
    'Papi Steak',
    'Dirty French Steakhouse',
    'Sexy Fish Miami',
    'Makoto',
    'Azabu Miami Beach',
    'Uchi Miami',
    'Il Gabbiano',
    'Casa Tua',
    'Cipriani',
    'Stubborn Seed',
    'Ariete',
    'The Bazaar',
    'STK',
    'Smith & Wollensky',
    'The Palm - Miami',
    'Mr Chow',
    'Komodo Miami',
    'Mastro\'s Ocean Club',
    'Prime 54',
    'Los Fuegos by Francis Mallmann',
    'Estiatorio Milos',
    'Forte Dei Marmi',
    'Katsuya'
];

async function emergencyFix() {
    console.log('🚨 EMERGENCY FIX - Reverting bad classifications...\n');

    let reverted = 0;
    let fixed = 0;

    // First, get ALL restaurants marked as $$$$$
    const { data: ultraLuxury } = await supabase
        .from('restaurants')
        .select('id, name, price_range')
        .eq('price_range', '$$$$$');

    console.log(`Found ${ultraLuxury?.length || 0} restaurants marked as $$$$$\n`);

    // Revert any $$$$$ that shouldn't be ultra-luxury
    for (const restaurant of ultraLuxury || []) {
        const shouldKeep = REAL_ULTRA_LUXURY.some(name =>
            restaurant.name.toLowerCase().includes(name.toLowerCase())
        );

        if (!shouldKeep) {
            // Revert to $$ (moderate) as safe default
            const { error } = await supabase
                .from('restaurants')
                .update({
                    price_range: '$$',
                    last_updated: new Date().toISOString()
                })
                .eq('id', restaurant.id);

            if (!error) {
                console.log(`↩️  Reverted: ${restaurant.name} from $$$$$ to $$`);
                reverted++;
            }
        }
    }

    // Fix all the "El" restaurants
    for (const [name, cuisine] of Object.entries(EL_RESTAURANTS_FIX)) {
        const { error } = await supabase
            .from('restaurants')
            .update({
                primary_cuisine: cuisine,
                price_range: '$$', // Most are moderate price
                last_updated: new Date().toISOString()
            })
            .ilike('name', `%${name}%`);

        if (!error) {
            console.log(`🌮 Fixed: ${name} → ${cuisine}`);
            fixed++;
        }
    }

    // Fix all the "La/Las" restaurants
    for (const [name, cuisine] of Object.entries(LA_RESTAURANTS_FIX)) {
        const { error } = await supabase
            .from('restaurants')
            .update({
                primary_cuisine: cuisine,
                price_range: '$$',
                last_updated: new Date().toISOString()
            })
            .ilike('name', `%${name}%`);

        if (!error) {
            console.log(`🍽️  Fixed: ${name} → ${cuisine}`);
            fixed++;
        }
    }

    // Fix "Los" restaurants
    for (const [name, data] of Object.entries(LOS_RESTAURANTS_FIX)) {
        const { error } = await supabase
            .from('restaurants')
            .update({
                primary_cuisine: data.cuisine,
                price_range: data.price,
                last_updated: new Date().toISOString()
            })
            .ilike('name', `%${name}%`);

        if (!error) {
            console.log(`🥩 Fixed: ${name} → ${data.cuisine} (${data.price})`);
            fixed++;
        }
    }

    // Fix obvious wrong ones
    for (const name of REVERT_TO_NORMAL) {
        const { error } = await supabase
            .from('restaurants')
            .update({
                price_range: '$$',
                primary_cuisine: 'Contemporary',
                last_updated: new Date().toISOString()
            })
            .ilike('name', `%${name}%`);

        if (!error) {
            console.log(`✅ Reverted: ${name} to normal pricing`);
            fixed++;
        }
    }

    // Get final stats
    const { data: finalStats } = await supabase
        .from('restaurants')
        .select('price_range');

    const priceCount = {};
    finalStats?.forEach(r => {
        priceCount[r.price_range] = (priceCount[r.price_range] || 0) + 1;
    });

    console.log('\n' + '='.repeat(50));
    console.log('🔧 EMERGENCY FIX COMPLETE:');
    console.log('='.repeat(50));
    console.log(`↩️  Reverted from $$$$$: ${reverted}`);
    console.log(`🔧 Fixed cuisines: ${fixed}`);

    console.log('\n💵 Corrected price distribution:');
    ['$', '$$', '$$$', '$$$$', '$$$$$'].forEach(price => {
        if (priceCount[price]) {
            console.log(`   ${price}: ${priceCount[price]}`);
        }
    });

    console.log(`\n✨ Ultra-luxury restaurants: ${priceCount['$$$$$'] || 0} (realistic for Miami)`);
}

// Run it
emergencyFix()
    .then(() => {
        console.log('\n✅ Emergency fix complete - database restored to reasonable state');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });