// fix-budget-categories.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Budget category mappings based on restaurant types and names
const BUDGET_MAPPINGS = {
  // $ - Very Budget Friendly ($10-15 average)
  '$': {
    patterns: [
      /fast\s*food/i, /quick\s*service/i, /takeout/i, /food\s*truck/i,
      /taco\s*bell/i, /mcdonald/i, /burger\s*king/i, /subway/i, /chipotle/i,
      /panda\s*express/i, /pizza\s*hut/i, /domino/i, /little\s*caesars/i,
      /dunkin/i, /starbucks/i, /bagel/i, /deli/i, /sandwich/i,
      /food\s*court/i, /counter\s*service/i
    ],
    cuisines: ['Fast Food', 'Bagels', 'Sandwiches'],
    names: [
      'McDonald\'s', 'Burger King', 'KFC', 'Taco Bell', 'Subway', 'Chipotle',
      'Panda Express', 'Dunkin\'', 'Starbucks', 'Pizza Hut', 'Domino\'s',
      'Little Caesars', 'Wendy\'s', 'Chick-fil-A', 'Popeyes'
    ]
  },

  // $$ - Casual Dining ($16-30 average)
  '$$': {
    patterns: [
      /casual/i, /family/i, /neighborhood/i, /bistro/i, /cafe/i, /grill/i,
      /pizza/i, /trattoria/i, /cantina/i, /pub/i, /sports\s*bar/i,
      /diner/i, /breakfast/i, /brunch/i, /lunch/i, /local/i
    ],
    cuisines: ['Pizza', 'Burgers', 'BBQ', 'Mexican', 'Chinese', 'Thai', 'Indian'],
    names: [
      'Applebee\'s', 'TGI Friday\'s', 'Chili\'s', 'Olive Garden', 'Red Lobster',
      'Outback Steakhouse', 'Texas Roadhouse', 'Denny\'s', 'IHOP',
      'Cheesecake Factory', 'Hard Rock Cafe', 'Planet Hollywood'
    ]
  },

  // $$$ - Mid-Range Dining ($31-60 average)
  '$$$': {
    patterns: [
      /contemporary/i, /modern/i, /upscale\s*casual/i, /wine\s*bar/i,
      /gastropub/i, /craft/i, /artisan/i, /farm\s*to\s*table/i,
      /organic/i, /fresh/i, /seasonal/i, /chef/i, /kitchen/i,
      /house/i, /fusion/i, /international/i
    ],
    cuisines: ['Italian', 'Japanese', 'French', 'Steakhouse', 'Seafood', 'Fusion'],
    names: [
      'The Yard House', 'Houston\'s', 'Seasons 52', 'Capital Grille',
      'Ruth\'s Chris', 'Morton\'s', 'P.F. Chang\'s', 'Benihana'
    ]
  },

  // $$$$ - Fine Dining ($61-100 average)
  '$$$$': {
    patterns: [
      /fine\s*dining/i, /upscale/i, /elegant/i, /sophisticated/i,
      /award\s*winning/i, /michelin/i, /james\s*beard/i, /celebrity\s*chef/i,
      /tasting\s*menu/i, /prix\s*fixe/i, /wine\s*pairing/i, /sommelier/i,
      /reservation\s*required/i, /dress\s*code/i, /intimate/i
    ],
    cuisines: ['French', 'Japanese', 'Contemporary', 'Steakhouse'],
    names: [
      'Nobu', 'Le Bernardin', 'Jean-Georges', 'Daniel', 'Eleven Madison Park',
      'The French Laundry', 'Per Se', 'Alinea', 'Cut', 'Mastro\'s'
    ]
  },

  // $$$$$ - Ultra Luxury ($100+ average)
  '$$$$$': {
    patterns: [
      /ultra\s*luxury/i, /exclusive/i, /private\s*dining/i, /ultra\s*fine/i,
      /world\s*renowned/i, /legendary/i, /iconic/i, /prestigious/i,
      /three\s*michelin/i, /two\s*michelin/i, /james\s*beard\s*winner/i,
      /celebrity\s*owned/i, /invitation\s*only/i, /member/i
    ],
    cuisines: ['French', 'Japanese', 'Contemporary'],
    names: [
      'Joel Robuchon', 'Guy Savoy', 'Le Bernardin', 'Masa', 'Chef\'s Table',
      'Urasawa', 'Providence', 'Saison', 'Atelier Crenn', 'Benu'
    ]
  }
};

// Miami-specific restaurant budget assignments
const MIAMI_SPECIFIC = {
  '$': [
    'La Sandwicherie', 'Puerto Sagua', 'David\'s Cafe', 'Havana Harry\'s',
    'Ball & Chain', 'Coyo Taco', 'KYU', 'Yardbird', 'Sweet Liberty'
  ],
  '$$': [
    'Pubbelly', 'The Broken Shaker', 'Lure Fishbar', 'Stubborn Seed',
    'Zuma', 'Komodo', 'Swan', 'The Bazaar', 'Katsuya'
  ],
  '$$$': [
    'Joe\'s Stone Crab', 'Prime 112', 'Scarpetta', 'Makoto', 'Carbone',
    'The Setai', 'Nobu', 'Casa Tua', 'Il Mulino', 'Hakkasan'
  ],
  '$$$$': [
    'L\'Atelier de Joel Robuchon', 'Azabu', 'Sexy Fish', 'Catch Miami',
    'STK', 'CVI.CHE 105', 'Fontainebleau', 'The St. Regis'
  ],
  '$$$$$': [
    'The Forge', 'Osiris', 'Barton G', 'Villa Azur', 'Le Labo',
    'Blue Door Fish', 'Cipriani', 'Four Seasons'
  ]
};

function detectBudgetCategory(restaurant) {
  const { name, primary_cuisine, description = '', neighborhood = '' } = restaurant;
  const searchText = `${name} ${description} ${neighborhood}`.toLowerCase();
  
  // Check Miami-specific assignments first
  for (const [budget, restaurants] of Object.entries(MIAMI_SPECIFIC)) {
    if (restaurants.some(r => name.toLowerCase().includes(r.toLowerCase()))) {
      return budget;
    }
  }
  
  // Check patterns and mappings
  for (const [budget, mapping] of Object.entries(BUDGET_MAPPINGS)) {
    // Check exact name matches
    if (mapping.names && mapping.names.some(n => name.toLowerCase().includes(n.toLowerCase()))) {
      return budget;
    }
    
    // Check cuisine matches
    if (mapping.cuisines && mapping.cuisines.includes(primary_cuisine)) {
      return budget;
    }
    
    // Check pattern matches
    if (mapping.patterns && mapping.patterns.some(pattern => pattern.test(searchText))) {
      return budget;
    }
  }
  
  // Default assignments based on cuisine type
  const cuisineDefaults = {
    'Fast Food': '$',
    'Bagels': '$',
    'Sandwiches': '$',
    'Pizza': '$$',
    'Burgers': '$$',
    'BBQ': '$$',
    'Mexican': '$$',
    'Chinese': '$$',
    'Thai': '$$',
    'Indian': '$$',
    'Italian': '$$$',
    'Japanese': '$$$',
    'French': '$$$$',
    'Steakhouse': '$$$',
    'Seafood': '$$$',
    'Fusion': '$$$',
    'Contemporary': '$$$$',
    'American': '$$'
  };
  
  return cuisineDefaults[primary_cuisine] || '$$';
}

async function cleanBudgetCategories() {
  console.log('💰 Starting budget category cleanup...\n');
  
  // First, let's see what budget categories currently exist
  const { data: currentBudgets } = await supabase
    .from('restaurants')
    .select('budget_category')
    .not('budget_category', 'is', null);
  
  if (currentBudgets) {
    const uniqueBudgets = [...new Set(currentBudgets.map(r => r.budget_category))];
    console.log('🔍 Current budget categories found:');
    uniqueBudgets.forEach(budget => {
      const count = currentBudgets.filter(r => r.budget_category === budget).length;
      console.log(`   • "${budget}": ${count} restaurants`);
    });
    console.log('');
  }
  
  // Get all restaurants
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, primary_cuisine, description, neighborhood, budget_category');
  
  if (error) {
    console.error('Error fetching restaurants:', error);
    return;
  }
  
  console.log(`Found ${restaurants.length} restaurants to process\n`);
  
  let updated = 0;
  const budgetChanges = {};
  const finalCounts = { '$': 0, '$$': 0, '$$$': 0, '$$$$': 0, '$$$$$': 0 };
  
  // Process in batches of 50
  const batchSize = 50;
  for (let i = 0; i < restaurants.length; i += batchSize) {
    const batch = restaurants.slice(i, i + batchSize);
    console.log(`\n💳 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(restaurants.length/batchSize)}`);
    console.log(`   Restaurants ${i + 1} - ${Math.min(i + batchSize, restaurants.length)}`);
    console.log('   ' + '─'.repeat(50));
    
    for (const restaurant of batch) {
      const currentBudget = restaurant.budget_category;
      const newBudget = detectBudgetCategory(restaurant);
      
      finalCounts[newBudget]++;
      
      if (currentBudget !== newBudget) {
        // Update budget category
        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ 
            budget_category: newBudget,
            last_updated: new Date().toISOString()
          })
          .eq('id', restaurant.id);
        
        if (!updateError) {
          console.log(`   💰 ${restaurant.name}: "${currentBudget || 'null'}" → ${newBudget}`);
          const changeKey = `${currentBudget || 'null'} → ${newBudget}`;
          budgetChanges[changeKey] = (budgetChanges[changeKey] || 0) + 1;
          updated++;
        }
      } else {
        console.log(`   ✅ ${restaurant.name}: ${newBudget} (no change)`);
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💰 BUDGET CLEANUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   • Restaurants updated: ${updated}`);
  console.log(`   • Total processed: ${restaurants.length}`);
  
  console.log(`\n💳 Final Budget Distribution:`);
  Object.entries(finalCounts).forEach(([budget, count]) => {
    const percentage = ((count / restaurants.length) * 100).toFixed(1);
    console.log(`   • ${budget}: ${count} restaurants (${percentage}%)`);
  });
  
  if (Object.keys(budgetChanges).length > 0) {
    console.log(`\n🔄 Changes Made:`);
    Object.entries(budgetChanges)
      .sort(([,a], [,b]) => b - a)
      .forEach(([change, count]) => {
        console.log(`   • ${change}: ${count} restaurants`);
      });
  }
  
  console.log(`\n✨ Budget categories are now standardized to: $, $$, $$$, $$$$, $$$$$`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Review and verify budget assignments`);
  console.log(`   2. Clean up neighborhood assignments`);
  console.log(`   3. Build Google Places deduplication script`);
}

// Run the script
cleanBudgetCategories().catch(console.error);