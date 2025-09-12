// fix-american-restaurants.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Known restaurants with correct cuisine
const SPECIFIC_FIXES = {
  // Italian
  'Spris Artisan Pizza': { cuisine: 'Italian' },
  'Villa Azur': { cuisine: 'French' },
  'Juvia': { cuisine: 'Fusion' },
  'Call Me Gaby': { cuisine: 'Mexican' },
  'Tanuki': { cuisine: 'Japanese' },
  
  // Fast Food to Delete
  'McDonald\'s': { cuisine: 'Delete' },
  'Burger King': { cuisine: 'Delete' },
  'KFC': { cuisine: 'Delete' },
  'Taco Bell': { cuisine: 'Delete' },
  'Subway': { cuisine: 'Delete' },
  'Dunkin\'': { cuisine: 'Delete' },
  'Starbucks': { cuisine: 'Delete' },
  'Pizza Hut': { cuisine: 'Delete' },
  'Domino\'s': { cuisine: 'Delete' },
  'Papa John\'s': { cuisine: 'Delete' },
  
  // Bars/Nightlife (should be in different table)
  'LIV Miami': { cuisine: 'Delete' },
  'Story Miami': { cuisine: 'Delete' },
  'Sweet Liberty': { cuisine: 'Delete' },
  'Wet Willie\'s': { cuisine: 'Delete' },
  'Twist': { cuisine: 'Delete' },
  'Voodoo Lounge': { cuisine: 'Delete' },
  
  // Keep as American
  'The Yard House': { cuisine: 'American' },
  'Houston\'s': { cuisine: 'American' },
  'TGI Friday\'s': { cuisine: 'American' },
  'Denny\'s': { cuisine: 'American' },
  'IHOP': { cuisine: 'Pancakes' }
};

// Cuisine detection patterns
const CUISINE_PATTERNS = {
  'Italian': [
    /pizza/i, /italian/i, /pasta/i, /risotto/i, /gelato/i, /trattoria/i, 
    /osteria/i, /ristorante/i, /spris/i, /villa/i, /romano/i
  ],
  'Japanese': [
    /sushi/i, /japanese/i, /ramen/i, /yakitori/i, /tempura/i, /sake/i,
    /tanuki/i, /nobu/i, /katana/i, /tokyo/i, /kyoto/i, /osaka/i
  ],
  'Chinese': [
    /chinese/i, /dim\s*sum/i, /wok/i, /beijing/i, /shanghai/i, /szechuan/i,
    /kung\s*pao/i, /lo\s*mein/i, /chow\s*mein/i, /fried\s*rice/i
  ],
  'Mexican': [
    /mexican/i, /taco/i, /burrito/i, /quesadilla/i, /enchilada/i, /salsa/i,
    /guacamole/i, /cerveza/i, /cantina/i, /casa/i, /el\s+/i, /la\s+/i
  ],
  'French': [
    /french/i, /bistro/i, /brasserie/i, /café/i, /château/i, /chez/i,
    /le\s+/i, /la\s+/i, /du\s+/i, /villa\s*azur/i, /provence/i
  ],
  'Indian': [
    /indian/i, /curry/i, /tandoor/i, /naan/i, /biryani/i, /tikka/i,
    /masala/i, /bombay/i, /delhi/i, /mumbai/i, /punjab/i
  ],
  'Thai': [
    /thai/i, /pad\s*thai/i, /tom\s*yum/i, /green\s*curry/i, /red\s*curry/i,
    /bangkok/i, /siam/i, /lemongrass/i, /coconut/i
  ],
  'Mediterranean': [
    /mediterranean/i, /greek/i, /hummus/i, /falafel/i, /gyro/i, /olive/i,
    /tzatziki/i, /baklava/i, /moussaka/i, /souvlaki/i
  ],
  'Cuban': [
    /cuban/i, /cuba/i, /havana/i, /mojito/i, /ropa\s*vieja/i, /plantain/i,
    /croqueta/i, /sandwich\s*cubano/i, /cafe\s*con\s*leche/i
  ],
  'Steakhouse': [
    /steak/i, /steakhouse/i, /prime\s*rib/i, /filet/i, /ribeye/i, /wagyu/i,
    /bone\s*in/i, /dry\s*aged/i, /prime\s*cuts/i, /beef/i
  ],
  'Seafood': [
    /seafood/i, /fish/i, /crab/i, /lobster/i, /shrimp/i, /oyster/i,
    /clam/i, /scallop/i, /catch/i, /fresh\s*fish/i, /ocean/i
  ],
  'Burgers': [
    /burger/i, /hamburger/i, /cheeseburger/i, /shake\s*shack/i, /five\s*guys/i,
    /in\s*n\s*out/i, /whataburger/i, /fatburger/i
  ],
  'BBQ': [
    /bbq/i, /barbecue/i, /ribs/i, /brisket/i, /pulled\s*pork/i, /smoke/i,
    /pit\s*master/i, /southern/i, /memphis/i, /kansas\s*city/i
  ],
  'Pizza': [
    /pizza/i, /pizzeria/i, /pie/i, /slice/i, /coal\s*oven/i, /wood\s*fired/i,
    /neapolitan/i, /chicago\s*style/i, /new\s*york\s*style/i
  ],
  'Korean': [
    /korean/i, /kimchi/i, /bulgogi/i, /bibimbap/i, /korean\s*bbq/i,
    /seoul/i, /gangnam/i, /k\s*town/i, /gochujang/i
  ],
  'Vietnamese': [
    /vietnamese/i, /pho/i, /banh\s*mi/i, /spring\s*roll/i, /vietnam/i,
    /saigon/i, /ho\s*chi\s*minh/i, /mekong/i, /lemongrass/i
  ],
  'Fusion': [
    /fusion/i, /asian\s*fusion/i, /latin\s*fusion/i, /contemporary/i,
    /modern/i, /eclectic/i, /international/i, /global/i
  ],
  'Spanish': [
    /spanish/i, /tapas/i, /paella/i, /sangria/i, /flamenco/i, /barcelona/i,
    /madrid/i, /seville/i, /andalusia/i, /iberico/i
  ],
  'Lebanese': [
    /lebanese/i, /lebanese\s*cuisine/i, /middle\s*eastern/i, /shawarma/i,
    /tabbouleh/i, /kibbeh/i, /fattoush/i, /mezze/i, /beirut/i
  ],
  'Peruvian': [
    /peruvian/i, /ceviche/i, /pisco/i, /lima/i, /inca/i, /machu\s*picchu/i,
    /quinoa/i, /anticucho/i, /causa/i
  ],
  'Brazilian': [
    /brazilian/i, /churrasco/i, /caipirinha/i, /feijoada/i, /acai/i,
    /rio/i, /sao\s*paulo/i, /brasil/i, /gaucho/i
  ],
  'Vegan': [
    /vegan/i, /plant\s*based/i, /raw\s*food/i, /green\s*kitchen/i,
    /veggie/i, /herbivore/i, /conscious/i
  ],
  'Vegetarian': [
    /vegetarian/i, /veggie/i, /garden/i, /fresh/i, /organic/i,
    /farm\s*to\s*table/i, /local/i, /seasonal/i
  ]
};

// Fast food chains to delete
const FAST_FOOD_CHAINS = [
  'McDonald\'s', 'Burger King', 'KFC', 'Taco Bell', 'Subway', 'Dunkin\'',
  'Starbucks', 'Pizza Hut', 'Domino\'s', 'Papa John\'s', 'Wendy\'s',
  'Chick-fil-A', 'Popeyes', 'Chipotle', 'Panda Express', 'Little Caesars'
];

// Bars/nightlife that should be moved to different tables
const NIGHTLIFE_VENUES = [
  'LIV Miami', 'Story Miami', 'Sweet Liberty', 'Wet Willie\'s', 'Twist',
  'Voodoo Lounge', 'Basement Miami', 'Club Space', 'Nikki Beach'
];

// Restaurants to keep as American
const KEEP_AMERICAN = [
  'The Yard House', 'Houston\'s', 'Cheesecake Factory', 'Hard Rock Cafe',
  'Planet Hollywood', 'Hooters', 'TGI Friday\'s', 'Applebee\'s'
];

function detectCuisine(name) {
  const searchText = name.toLowerCase();
  
  // Check specific fixes first
  if (SPECIFIC_FIXES[name]) {
    return SPECIFIC_FIXES[name].cuisine;
  }
  
  // Check if it's fast food to delete
  if (FAST_FOOD_CHAINS.some(chain => name.includes(chain))) {
    return 'Delete';
  }
  
  // Check if it's nightlife to delete from restaurants
  if (NIGHTLIFE_VENUES.some(venue => name.includes(venue))) {
    return 'Delete';
  }
  
  // Check if it should stay American
  if (KEEP_AMERICAN.some(keep => name.includes(keep))) {
    return 'American';
  }
  
  // Pattern matching for cuisine detection
  for (const [cuisine, patterns] of Object.entries(CUISINE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(searchText)) {
        return cuisine;
      }
    }
  }
  
  // Default to keeping as American if no pattern matches
  return 'American';
}

async function processAmericanRestaurants() {
  console.log('🔧 Starting American restaurant recategorization...\n');
  
  // Get all American restaurants
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, primary_cuisine')
    .eq('primary_cuisine', 'American');
  
  if (error) {
    console.error('Error fetching restaurants:', error);
    return;
  }
  
  console.log(`Found ${restaurants.length} restaurants categorized as American\n`);
  
  let updated = 0;
  let deleted = 0;
  let keptAmerican = 0;
  const cuisineChanges = {};
  
  // Process in smaller batches to avoid timeouts
  const batchSize = 10;
  const totalBatches = Math.ceil(restaurants.length / batchSize);
  
  console.log(`⚡ Processing in ${totalBatches} batches of ${batchSize}`);
  console.log(`   Estimated time: ${Math.ceil(totalBatches * 2)} seconds\n`);
  
  for (let i = 0; i < restaurants.length; i += batchSize) {
    const batch = restaurants.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, restaurants.length)})`);
    console.log('   ' + '─'.repeat(40));
    
    for (const restaurant of batch) {
      try {
        const newCuisine = detectCuisine(restaurant.name);
        
        if (newCuisine === 'Delete') {
          // Delete restaurant
          const { error: deleteError } = await supabase
            .from('restaurants')
            .delete()
            .eq('id', restaurant.id);
          
          if (!deleteError) {
            console.log(`   🗑️  Deleted: ${restaurant.name}`);
            deleted++;
          } else {
            console.log(`   ❌ Error deleting ${restaurant.name}: ${deleteError.message}`);
          }
        } else if (newCuisine !== 'American') {
          // Update cuisine
          const { error: updateError } = await supabase
            .from('restaurants')
            .update({ 
              primary_cuisine: newCuisine,
              last_updated: new Date().toISOString()
            })
            .eq('id', restaurant.id);
          
          if (!updateError) {
            console.log(`   🍽️  ${restaurant.name}: American → ${newCuisine}`);
            cuisineChanges[newCuisine] = (cuisineChanges[newCuisine] || 0) + 1;
            updated++;
          } else {
            console.log(`   ❌ Error updating ${restaurant.name}: ${updateError.message}`);
          }
        } else {
          // Keep as American
          console.log(`   ✅ Keeping as American: ${restaurant.name}`);
          keptAmerican++;
        }
        
        // Small delay between individual updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.log(`   ❌ Error processing ${restaurant.name}: ${error.message}`);
      }
    }
    
    // Progress indicator
    const progress = ((batchNum / totalBatches) * 100).toFixed(1);
    console.log(`   📊 Progress: ${progress}% (${updated} updated, ${deleted} deleted, ${keptAmerican} kept American)`);
    
    // Longer delay between batches
    if (batchNum < totalBatches) {
      console.log(`   ⏳ Waiting 2 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 RECATEGORIZATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   • Updated to new cuisine: ${updated}`);
  console.log(`   • Deleted (fast food/bars): ${deleted}`);
  console.log(`   • Kept as American: ${keptAmerican}`);
  console.log(`   • Total processed: ${restaurants.length}`);
  
  if (Object.keys(cuisineChanges).length > 0) {
    console.log(`\n🔄 Cuisine Changes:`);
    Object.entries(cuisineChanges)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cuisine, count]) => {
        console.log(`   • ${cuisine}: ${count} restaurants`);
      });
  }
  
  console.log(`\n✨ Next steps:`);
  console.log(`   1. Run neighborhood cleanup: node scripts/fix-neighborhoods.mjs`);
  console.log(`   2. Run budget categorization: node scripts/fix-budget-categories.mjs`);
  console.log(`   3. Build Google Places deduplication script`);
}

// Run the script
processAmericanRestaurants().catch(console.error);