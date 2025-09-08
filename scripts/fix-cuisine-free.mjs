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

// Comprehensive cuisine detection patterns
const CUISINE_PATTERNS = {
    'Cuban': [
        /cuban/i, /cuba/i, /havana/i, /cubano/i, /versailles/i,
        /\bcafe\s+\d+/i, // Cafe 305, Cafe 1959, etc.
        /yuca/i, /sergio['']?s/i, /islas canarias/i
    ],
    'Italian': [
        /italian/i, /italiano/i, /pasta/i, /pizza/i, /trattoria/i,
        /osteria/i, /ristorante/i, /tavola/i, /nonna/i, /tuscany/i,
        /sicilian/i, /napoli/i, /roma/i, /venetian/i, /luigi/i,
        /mario/i, /giuseppe/i, /tony['']?s/i, /gino['']?s/i
    ],
    'Mexican': [
        /mexican/i, /mexico/i, /taco/i, /taqueria/i, /cantina/i,
        /burrito/i, /quesadilla/i, /mariachi/i, /azteca/i, /maya/i,
        /tex[\s-]?mex/i, /mexi/i, /el\s+\w+/i, /la\s+\w+/i, /los\s+\w+/i
    ],
    'Latin': [
        /latin/i, /latino/i, /colombian/i, /venezuelan/i, /peruvian/i,
        /argentinian/i, /argentine/i, /brazilian/i, /empanada/i,
        /arepa/i, /churras/i, /rodizio/i, /ceviche/i, /pisco/i
    ],
    'Chinese': [
        /chinese/i, /china/i, /cantonese/i, /szechuan/i, /sichuan/i,
        /hunan/i, /dim\s*sum/i, /wok/i, /noodle/i, /dumpling/i,
        /shanghai/i, /beijing/i, /hong\s*kong/i, /dynasty/i, /dragon/i,
        /garden/i, /palace/i, /panda/i, /jade/i, /golden/i
    ],
    'Japanese': [
        /japanese/i, /japan/i, /sushi/i, /sashimi/i, /ramen/i,
        /izakaya/i, /tempura/i, /teriyaki/i, /yakitori/i, /teppanyaki/i,
        /hibachi/i, /bento/i, /sake/i, /tokyo/i, /osaka/i, /kyoto/i,
        /ninja/i, /samurai/i, /zen/i, /koi/i, /sakura/i
    ],
    'Thai': [
        /thai/i, /thailand/i, /bangkok/i, /siam/i, /pad\s*thai/i,
        /basil/i, /lemongrass/i, /coconut/i
    ],
    'Vietnamese': [
        /vietnamese/i, /vietnam/i, /pho/i, /banh\s*mi/i, /saigon/i,
        /hanoi/i, /mekong/i
    ],
    'Korean': [
        /korean/i, /korea/i, /kimchi/i, /bulgogi/i, /bibimbap/i,
        /k[\s-]?bbq/i, /seoul/i, /gangnam/i
    ],
    'Indian': [
        /indian/i, /india/i, /tandoori/i, /curry/i, /tikka/i,
        /masala/i, /biryani/i, /naan/i, /punjabi/i, /bengali/i,
        /mumbai/i, /delhi/i, /taj/i, /maharaja/i, /raja/i, /namaste/i
    ],
    'Mediterranean': [
        /mediterranean/i, /medi/i, /levantine/i, /turkish/i, /greek/i,
        /lebanese/i, /moroccan/i, /falafel/i, /shawarma/i, /kebab/i,
        /gyro/i, /hummus/i, /mezze/i, /istanbul/i, /athens/i, /beirut/i
    ],
    'Greek': [
        /greek/i, /greece/i, /hellenic/i, /athens/i, /olympus/i,
        /acropolis/i, /santorini/i, /mykonos/i, /apollo/i, /zeus/i
    ],
    'French': [
        /french/i, /france/i, /bistro/i, /brasserie/i, /cafe/i,
        /crepe/i, /champagne/i, /bordeaux/i, /lyon/i, /provence/i,
        /normandy/i, /jacques/i, /pierre/i, /michel/i, /antoine/i,
        /le\s+\w+/i, /la\s+\w+/i, /chez/i
    ],
    'Spanish': [
        /spanish/i, /spain/i, /tapas/i, /paella/i, /sangria/i,
        /barcelona/i, /madrid/i, /sevilla/i, /valencia/i, /iberian/i,
        /catalon/i, /basque/i, /galician/i
    ],
    'Seafood': [
        /seafood/i, /fish/i, /oyster/i, /lobster/i, /crab/i,
        /shrimp/i, /clam/i, /mussel/i, /catch/i, /ocean/i,
        /sea/i, /marine/i, /captain/i, /fisherman/i, /wharf/i,
        /pier/i, /harbor/i, /coast/i, /bay/i, /reef/i
    ],
    'Steakhouse': [
        /steakhouse/i, /steak/i, /grill/i, /prime/i, /wagyu/i,
        /angus/i, /ribeye/i, /sirloin/i, /filet/i, /chop/i,
        /butcher/i, /meat/i, /cattle/i, /ranch/i
    ],
    'BBQ': [
        /bbq/i, /barbecue/i, /smokehouse/i, /smoke/i, /pit/i,
        /rib/i, /brisket/i, /pulled\s*pork/i, /texas/i, /memphis/i,
        /carolina/i, /kansas/i
    ],
    'Pizza': [
        /pizza/i, /pizzeria/i, /slice/i, /pie/i, /coal/i,
        /brick\s*oven/i, /wood[\s-]?fired/i
    ],
    'Burgers': [
        /burger/i, /hamburger/i, /cheeseburger/i, /patty/i,
        /shake\s*shack/i, /five\s*guys/i, /smash/i
    ],
    'Caribbean': [
        /caribbean/i, /jamaican/i, /puerto\s*rican/i, /dominican/i,
        /haitian/i, /trinidad/i, /barbados/i, /bahama/i, /bermuda/i,
        /jerk/i, /plantain/i, /rasta/i, /island/i, /tropical/i
    ],
    'Vegan': [
        /vegan/i, /plant[\s-]?based/i, /herbivore/i
    ],
    'Vegetarian': [
        /vegetarian/i, /veggie/i, /green/i, /garden/i
    ]
};

// Special Miami Beach restaurant knowledge
const KNOWN_RESTAURANTS = {
    'Joe\'s Stone Crab': 'Seafood',
    'Versailles': 'Cuban',
    'Yardbird': 'Southern',
    'Prime 112': 'Steakhouse',
    'Carbone': 'Italian',
    'Nobu': 'Japanese',
    'Juvia': 'Fusion',
    'Stubborn Seed': 'Contemporary',
    'Macchialina': 'Italian',
    'Pura Vida': 'Healthy',
    'Dirt': 'Healthy',
    'La Sandwicherie': 'French',
    'Puerto Sagua': 'Cuban',
    'Havana 1957': 'Cuban',
    'Mandolin': 'Greek',
    'Milos': 'Greek',
    'Zuma': 'Japanese',
    'Katsuya': 'Japanese',
    'Makoto': 'Japanese',
    'Cecconi\'s': 'Italian',
    'Forte dei Marmi': 'Italian',
    'Boia De': 'Italian',
    'KYU': 'Asian',
    'Komodo': 'Asian',
    'Swan': 'Contemporary',
    'Papi Steak': 'Steakhouse',
    'STK': 'Steakhouse',
    'Smith & Wollensky': 'Steakhouse',
    'The Bazaar': 'Spanish',
    'Boulud Sud': 'Mediterranean',
    'Estiatorio Ornos': 'Greek',
    'Santorini by Georgios': 'Greek',
    'Lucali': 'Pizza',
    'Mister O1': 'Pizza',
    'Steve\'s Pizza': 'Pizza',
    'La Petite Maison': 'French',
    'Le Jardinier': 'French',
    'L\'Atelier de Joël Robuchon': 'French',
    'Ceviche 105': 'Peruvian',
    'Osaka': 'Peruvian',
    'Jaguar': 'Latin',
    'Dolores But You Can Call Me Lolita': 'Mexican',
    'Coyo Taco': 'Mexican',
    'Bodega': 'Mexican',
    'Time Out Market': 'Food Hall',
    'Lincoln Eatery': 'Food Hall',
    '1111 Peruvian Bistro': 'Peruvian'
};

// Function to detect cuisine from restaurant name
function detectCuisineFromName(name) {
    // First check if it's a known restaurant
    for (const [knownName, cuisine] of Object.entries(KNOWN_RESTAURANTS)) {
        if (name.toLowerCase().includes(knownName.toLowerCase())) {
            return cuisine;
        }
    }

    // Then check patterns
    for (const [cuisine, patterns] of Object.entries(CUISINE_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(name)) {
                return cuisine;
            }
        }
    }

    // Check for common chain indicators
    if (/subway|mcdonald|burger king|wendy|kfc|popeyes|chipotle|panera|starbucks|dunkin/i.test(name)) {
        return 'Fast Food';
    }

    // If name contains "Cafe" or "Coffee" but no other pattern
    if (/cafe|coffee|espresso|brew/i.test(name) && !/cuban/i.test(name)) {
        return 'Cafe';
    }

    // If name contains "Bar" or "Pub" but no other pattern
    if (/\bbar\b|\bpub\b|tavern|brewery|beer/i.test(name)) {
        return 'Bar';
    }

    // If name contains "Bakery" or bread-related terms
    if (/bakery|bread|pastry|patisserie|croissant|donut|doughnut/i.test(name)) {
        return 'Bakery';
    }

    // Default to American if no pattern matches
    return null;
}

// Main function
async function fixCuisinesFromNames() {
    console.log('🔍 Starting FREE cuisine detection from restaurant names...\n');

    // Get all restaurants marked as "American"
    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('id, name, primary_cuisine')
        .eq('primary_cuisine', 'American');

    if (error) {
        console.error('Error fetching restaurants:', error);
        return;
    }

    console.log(`Found ${restaurants.length} "American" restaurants to analyze\n`);

    const updates = {
        fixed: 0,
        stillAmerican: 0,
        errors: 0
    };

    const detectedCuisines = {};

    // Process each restaurant
    for (const restaurant of restaurants) {
        const detectedCuisine = detectCuisineFromName(restaurant.name);

        if (detectedCuisine && detectedCuisine !== 'American') {
            // Update the restaurant
            const { error: updateError } = await supabase
                .from('restaurants')
                .update({
                    primary_cuisine: detectedCuisine,
                    last_updated: new Date().toISOString()
                })
                .eq('id', restaurant.id);

            if (updateError) {
                console.error(`❌ Error updating ${restaurant.name}: ${updateError.message}`);
                updates.errors++;
            } else {
                console.log(`✅ ${restaurant.name} → ${detectedCuisine}`);
                updates.fixed++;
                detectedCuisines[detectedCuisine] = (detectedCuisines[detectedCuisine] || 0) + 1;
            }
        } else {
            updates.stillAmerican++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 CUISINE FIX COMPLETE - SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Fixed: ${updates.fixed} restaurants`);
    console.log(`🔵 Still American: ${updates.stillAmerican} restaurants`);
    console.log(`❌ Errors: ${updates.errors}`);
    console.log(`💰 Cost: $0.00 (FREE!)`);

    if (updates.fixed > 0) {
        console.log('\n🍽️  Cuisines detected:');
        Object.entries(detectedCuisines)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cuisine, count]) => {
                console.log(`   ${cuisine}: ${count}`);
            });
    }

    // Show remaining American restaurants for manual review
    if (updates.stillAmerican > 0) {
        console.log('\n⚠️  Sample of restaurants still marked as American (may need manual review):');
        const { data: stillAmerican } = await supabase
            .from('restaurants')
            .select('name')
            .eq('primary_cuisine', 'American')
            .limit(10);

        stillAmerican?.forEach(r => {
            console.log(`   - ${r.name}`);
        });
    }
}

// Run the fix
fixCuisinesFromNames()
    .then(() => {
        console.log('\n✅ FREE cuisine detection completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });