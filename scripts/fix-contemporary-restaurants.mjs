// scripts/fix-contemporary-restaurants.mjs
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

async function fixContemporary() {
    console.log('🔍 Finding Contemporary restaurants that need fixing...\n');

    // Get all Contemporary restaurants
    const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name, price_range')
        .eq('primary_cuisine', 'Contemporary')
        .order('name');

    if (!restaurants) {
        console.error('Failed to fetch restaurants');
        return;
    }

    console.log(`Found ${restaurants.length} Contemporary restaurants to analyze\n`);

    const updates = [];

    for (const restaurant of restaurants) {
        const name = restaurant.name.toLowerCase();
        let newCuisine = null;

        // Detect cuisine based on name patterns
        if (name.includes('sushi') || name.includes('japanese') || name.includes('ramen') || name.includes('izakaya')) {
            newCuisine = 'Japanese';
        } else if (name.includes('pizza')) {
            newCuisine = 'Pizza';
        } else if (name.includes('taco') || name.includes('taqueria')) {
            newCuisine = 'Mexican';
        } else if (name.includes('burger')) {
            newCuisine = 'Burgers';
        } else if (name.includes('bbq') || name.includes('barbecue')) {
            newCuisine = 'BBQ';
        } else if (name.includes('chinese') || name.includes('szechuan') || name.includes('cantonese')) {
            newCuisine = 'Chinese';
        } else if (name.includes('thai')) {
            newCuisine = 'Thai';
        } else if (name.includes('italian') || name.includes('pasta')) {
            newCuisine = 'Italian';
        } else if (name.includes('steakhouse') || name.includes('steak house')) {
            newCuisine = 'Steakhouse';
        } else if (name.includes('seafood') || name.includes('fish') || name.includes('oyster') || name.includes('crab')) {
            newCuisine = 'Seafood';
        } else if (name.includes('cafe') || name.includes('café') || name.includes('coffee')) {
            newCuisine = 'Cafe';
        } else if (name.includes('bakery') || name.includes('bagel')) {
            newCuisine = 'Bakery';
        } else if (name.includes('diner')) {
            newCuisine = 'American';
        } else if (name.includes('bar & grill') || name.includes('bar and grill')) {
            newCuisine = 'American';
        } else if (name.includes('asia') || name.includes('asian')) {
            newCuisine = 'Asian';
        } else if (name.includes('vegan') || name.includes('vegetarian')) {
            newCuisine = 'Vegan';
        } else if (name.includes('mediterranean')) {
            newCuisine = 'Mediterranean';
        } else if (name.includes('greek')) {
            newCuisine = 'Greek';
        } else if (name.includes('cuban')) {
            newCuisine = 'Cuban';
        } else if (name.includes('peruvian')) {
            newCuisine = 'Peruvian';
        } else if (name.includes('brazilian')) {
            newCuisine = 'Brazilian';
        } else if (name.includes('mexican')) {
            newCuisine = 'Mexican';
        } else if (name.includes('french')) {
            newCuisine = 'French';
        } else if (name.includes('spanish')) {
            newCuisine = 'Spanish';
        } else if (name.includes('korean')) {
            newCuisine = 'Korean';
        } else if (name.includes('vietnamese') || name.includes('pho')) {
            newCuisine = 'Vietnamese';
        } else if (name.includes('indian')) {
            newCuisine = 'Indian';
        }

        // Special cases
        if (name === '11th street diner') newCuisine = 'American';
        if (name.includes('beauty & the butcher')) newCuisine = 'Steakhouse';
        if (name.includes('area 31')) newCuisine = 'Seafood';

        if (newCuisine) {
            updates.push({
                id: restaurant.id,
                name: restaurant.name,
                newCuisine: newCuisine
            });
        }
    }

    // Show what will be updated
    console.log(`Found ${updates.length} restaurants to fix:\n`);

    const cuisineCounts = {};
    updates.forEach(u => {
        cuisineCounts[u.newCuisine] = (cuisineCounts[u.newCuisine] || 0) + 1;
    });

    console.log('Cuisine assignments:');
    Object.entries(cuisineCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cuisine, count]) => {
            console.log(`  ${cuisine}: ${count}`);
        });

    console.log('\nSample changes:');
    updates.slice(0, 10).forEach(u => {
        console.log(`  ${u.name} → ${u.newCuisine}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('To apply these changes, run:');
    console.log('node scripts/fix-contemporary-restaurants.mjs --apply');

    if (process.argv.includes('--apply')) {
        console.log('\n🚀 APPLYING CHANGES...\n');

        let success = 0;
        let errors = 0;

        for (const update of updates) {
            const { error } = await supabase
                .from('restaurants')
                .update({
                    primary_cuisine: update.newCuisine,
                    last_updated: new Date().toISOString()
                })
                .eq('id', update.id);

            if (error) {
                console.error(`❌ Failed: ${update.name}`);
                errors++;
            } else {
                success++;
            }
        }

        console.log(`\n✅ Fixed: ${success}`);
        console.log(`❌ Errors: ${errors}`);
    }
}

fixContemporary()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
