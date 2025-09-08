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

// Step 1: Clean corporate names
function cleanCorporateName(name) {
    let cleaned = name;

    // Remove corporate suffixes and everything after them
    cleaned = cleaned.replace(/\s+(LLC|Inc|Corp|Corporation|Ltd|Limited|Co\.?|Company|Holdings|Enterprises|Partners|Group|Management|Hospitality|Opco)\b.*$/i, '');

    // Remove D/B/A, DBA and everything before it
    cleaned = cleaned.replace(/^.*\b(D\/B\/A|DBA|d\.b\.a\.)\s+/i, '');

    // Remove trailing commas and periods
    cleaned = cleaned.replace(/[,.\s]+$/, '');

    // Remove store numbers like #780, #13007
    cleaned = cleaned.replace(/[#\/]store[#\s]*\d+/i, '');
    cleaned = cleaned.replace(/\s*#\d+$/, '');

    // Remove parenthetical additions like (restaurant)
    cleaned = cleaned.replace(/\s*\([^)]*\)$/, '');

    // Clean up extra spaces
    cleaned = cleaned.trim();

    return cleaned;
}

// Step 2: Known Miami restaurants with correct cuisines
const KNOWN_RESTAURANTS = {
    // From your list
    '11th Street Diner': 'American',
    'COTE Miami': 'Korean',
    'Gordon Ramsay Hell\'s Kitchen': 'Contemporary',
    'Juvia': 'Fusion',
    'Big Pink': 'American',
    'Broken Shaker': 'Bar',
    'Call Me Gaby': 'Mexican',
    'Chicken Kitchen': 'American',
    'Denny\'s': 'American',
    'Houston\'s': 'American',
    'Hyde Beach': 'Beach Bar',
    'International House of Pancake': 'American',
    'Kings Dining & Entertainment': 'American',
    'Klaw Miami': 'Seafood',
    'Krispy Krunchy Chicken': 'Southern',
    'Michael\'s Genuine': 'Contemporary',
    'Red Rooster Overtown': 'Southern',
    'Rusty Pelican': 'Seafood',
    'Southern Operations': 'Southern',
    'Spris': 'Italian',
    'Story': 'Nightclub',
    'Sweet Liberty': 'Bar',
    'Tanuki': 'Japanese',
    'TGI Fridays': 'American',
    'The Alley': 'Bar',
    'The Local House': 'Seafood',
    'The Matador Room': 'Latin',
    'Timo Restaurant': 'Mediterranean',
    'True Food Kitchen': 'Healthy',
    'Twin Peaks': 'Sports Bar',
    'Under the Mango Tree': 'Caribbean',
    'Vida': 'Latin',
    'Voodoo Rooftop Lounge': 'Bar',
    'Watr at the 1 Rooftop': 'Bar',
    'Wet Willie\'s': 'Bar',
    'Yard House': 'American',
    'Ola': 'Latin',
    'Living Room at the W': 'Bar',
    'Twist': 'Bar',
    'Essensia': 'Contemporary',
    'Do Not Sit on the Furniture': 'Bar',
    'LIV': 'Nightclub',
    'Basement': 'Nightclub'
};

// Step 3: Cuisine detection patterns
const CUISINE_PATTERNS = {
    'Korean': [/korean/i, /korea/i, /kimchi/i, /bulgogi/i, /\bcote\b/i, /k-?bbq/i],
    'Southern': [/southern/i, /soul\s*food/i, /fried\s*chicken/i, /rooster/i],
    'Seafood': [/seafood/i, /fish/i, /pelican/i, /klaw/i, /ocean/i, /beach\s*house/i],
    'Latin': [/latin/i, /matador/i, /vida/i, /locura/i],
    'Caribbean': [/caribbean/i, /mango\s*tree/i, /tropical/i],
    'Asian': [/asian/i, /rin\s*asian/i],
    'Mediterranean': [/mediterranean/i, /levant/i],
    'Contemporary': [/genuine/i, /gordon\s*ramsay/i, /hell'?s\s*kitchen/i],
    'Healthy': [/healthy/i, /true\s*food/i, /lowha.*natural/i],
    'Bar': [/bar\b/i, /lounge/i, /rooftop/i, /wet\s*willie/i, /voodoo/i, /twist/i, /sweet\s*liberty/i],
    'Nightclub': [/\bliv\b/i, /story/i, /basement/i, /nightclub/i],
    'Italian': [/spris/i],
    'Japanese': [/tanuki/i],
    'Mexican': [/call\s*me\s*gaby/i],
    'Fusion': [/juvia/i],
    'Sports Bar': [/twin\s*peaks/i],
    'Creole': [/creole/i, /cajun/i],
    'Bagels': [/bagel/i, /einstein\s*bros/i],
    'Pancakes': [/pancake/i, /ihop/i],
    'Poke': [/poke/i]
};

// Function to detect cuisine
function detectCuisine(name, cleanedName) {
    // Check known restaurants first
    if (KNOWN_RESTAURANTS[cleanedName]) {
        return KNOWN_RESTAURANTS[cleanedName];
    }

    // Check patterns
    const nameToCheck = `${name} ${cleanedName}`.toLowerCase();

    for (const [cuisine, patterns] of Object.entries(CUISINE_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(nameToCheck)) {
                return cuisine;
            }
        }
    }

    // Default to American if it really seems American
    if (/diner|denny|friday|yard\s*house|houston/i.test(nameToCheck)) {
        return 'American';
    }

    return null; // Will stay American if no pattern matches
}

// Main function
async function cleanAndCategorize() {
    console.log('🔧 Starting name cleaning and cuisine categorization...\n');

    // Get all American restaurants
    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('id, name, primary_cuisine')
        .eq('primary_cuisine', 'American');

    if (error) {
        console.error('Error fetching restaurants:', error);
        return;
    }

    console.log(`Found ${restaurants.length} American restaurants\n`);
    console.log('STEP 1: Cleaning corporate names...\n');

    const updates = [];
    const cuisineChanges = {};

    for (const restaurant of restaurants) {
        const cleanedName = cleanCorporateName(restaurant.name);
        const detectedCuisine = detectCuisine(restaurant.name, cleanedName);

        const update = {
            id: restaurant.id,
            originalName: restaurant.name,
            cleanedName: cleanedName,
            newCuisine: detectedCuisine || 'American'
        };

        // Log if name changed
        if (cleanedName !== restaurant.name) {
            console.log(`📝 "${restaurant.name}" → "${cleanedName}"`);
        }

        // Track cuisine changes
        if (detectedCuisine && detectedCuisine !== 'American') {
            cuisineChanges[detectedCuisine] = (cuisineChanges[detectedCuisine] || 0) + 1;
            console.log(`   🍽️  Cuisine: American → ${detectedCuisine}`);
        }

        updates.push(update);
    }

    console.log('\n' + '='.repeat(50));
    console.log('STEP 2: Applying updates to database...');
    console.log('='.repeat(50) + '\n');

    // Apply updates
    let nameUpdates = 0;
    let cuisineUpdates = 0;
    let errors = 0;

    for (const update of updates) {
        const updateData = {};

        // Update name if it changed
        if (update.cleanedName !== update.originalName) {
            updateData.name = update.cleanedName;
            nameUpdates++;
        }

        // Update cuisine if detected
        if (update.newCuisine !== 'American') {
            updateData.primary_cuisine = update.newCuisine;
            cuisineUpdates++;
        }

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
            updateData.last_updated = new Date().toISOString();

            const { error: updateError } = await supabase
                .from('restaurants')
                .update(updateData)
                .eq('id', update.id);

            if (updateError) {
                console.error(`❌ Error updating ${update.originalName}: ${updateError.message}`);
                errors++;
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 COMPLETE SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Names cleaned: ${nameUpdates}`);
    console.log(`✅ Cuisines fixed: ${cuisineUpdates}`);
    console.log(`🔵 Still American: ${restaurants.length - cuisineUpdates}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`💰 Cost: $0.00 (FREE!)`);

    if (cuisineUpdates > 0) {
        console.log('\n🍽️  New cuisine distribution:');
        Object.entries(cuisineChanges)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cuisine, count]) => {
                console.log(`   ${cuisine}: ${count}`);
            });
    }

    // Show sample of remaining American restaurants
    const stillAmerican = updates
        .filter(u => u.newCuisine === 'American')
        .slice(0, 10);

    if (stillAmerican.length > 0) {
        console.log('\n📋 Sample still marked as American (likely correct):');
        stillAmerican.forEach(r => {
            console.log(`   - ${r.cleanedName}`);
        });
    }
}

// Run it
cleanAndCategorize()
    .then(() => {
        console.log('\n✅ Name cleaning and categorization complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });