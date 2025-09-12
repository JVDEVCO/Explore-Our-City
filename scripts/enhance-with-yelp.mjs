// enhance-with-yelp.mjs
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const YELP_API_KEY = process.env.YELP_API_KEY

// Yelp category mappings to our cuisine types
const YELP_CATEGORY_TO_CUISINE = {
  // Italian
  'italian': 'Italian',
  'pizza': 'Pizza',
  'gelato': 'Italian',
  
  // Asian
  'japanese': 'Japanese',
  'sushi': 'Japanese', 
  'ramen': 'Japanese',
  'chinese': 'Chinese',
  'dimsum': 'Chinese',
  'korean': 'Korean',
  'thai': 'Thai',
  'vietnamese': 'Vietnamese',
  'asian': 'Asian',
  'indpak': 'Indian',
  'indian': 'Indian',
  
  // Latin American
  'mexican': 'Mexican',
  'tex-mex': 'Mexican',
  'tacos': 'Mexican',
  'latin': 'Latin',
  'cuban': 'Cuban',
  'peruvian': 'Peruvian',
  'brazilian': 'Brazilian',
  'argentine': 'Argentinian',
  'colombian': 'Colombian',
  'venezuelan': 'Venezuelan',
  'caribbean': 'Caribbean',
  'haitian': 'Haitian',
  'dominican': 'Dominican',
  
  // European
  'french': 'French',
  'mediterranean': 'Mediterranean',
  'greek': 'Greek',
  'spanish': 'Spanish',
  'portuguese': 'Portuguese',
  'german': 'German',
  'british': 'British',
  
  // Middle Eastern
  'mideastern': 'Middle Eastern',
  'lebanese': 'Lebanese',
  'turkish': 'Turkish',
  
  // American & Others
  'steak': 'Steakhouse',
  'steakhouses': 'Steakhouse',
  'seafood': 'Seafood',
  'bbq': 'BBQ',
  'burgers': 'Burgers',
  'hotdogs': 'American',
  'sandwiches': 'Deli',
  'delis': 'Deli',
  'southern': 'Southern',
  'cajun': 'Creole',
  'soulfood': 'Soul Food',
  
  // Healthy & Special Diets
  'vegan': 'Vegan',
  'vegetarian': 'Vegetarian',
  'raw_food': 'Healthy',
  'juicebars': 'Juice Bar',
  'acaibowls': 'Healthy',
  
  // Breakfast & Cafe
  'breakfast_brunch': 'Cafe',
  'cafes': 'Cafe',
  'coffee': 'Cafe',
  'bakeries': 'Bakery',
  'donuts': 'Bakery',
  'bagels': 'Bagels',
  'icecream': 'Ice Cream',
  'desserts': 'Desserts',
  
  // Bars & Nightlife  
  'bars': 'Bar',
  'wine_bars': 'Wine Bar',
  'cocktailbars': 'Bar',
  'sports_bars': 'Sports Bar',
  'irish_pubs': 'Bar',
  'lounges': 'Bar',
  'nightclubs': 'Nightclub',
  
  // Fast Food & Takeout
  'hotdog': 'Fast Food',
  'fastfood': 'Fast Food',
  'food_court': 'Fast Food',
  'foodtrucks': 'Takeout'
};

// Miami neighborhoods for address parsing
const MIAMI_NEIGHBORHOODS = {
  'South Beach': [/south beach/i, /sobe/i, /ocean dr/i, /washington ave.*1[0-9]/i],
  'Mid-Beach': [/mid beach/i, /41st/i, /46th/i],
  'North Beach': [/north beach/i, /79th/i, /harding ave/i],
  'Downtown Miami': [/downtown/i, /biscayne blvd/i, /flagler st/i],
  'Brickell': [/brickell/i],
  'Wynwood': [/wynwood/i, /nw.*ave/i],
  'Little Havana': [/little havana/i, /calle ocho/i, /sw 8th/i],
  'Coral Gables': [/coral gables/i, /miracle mile/i],
  'Coconut Grove': [/coconut grove/i, /main hwy/i],
  'Key Biscayne': [/key biscayne/i, /crandon/i],
  'Virginia Key': [/virginia key/i],
  'Design District': [/design district/i, /nw.*st.*design/i],
  'Edgewater': [/edgewater/i],
  'Bal Harbour': [/bal harbour/i, /bal harbor/i],
  'Surfside': [/surfside/i]
};

async function searchYelp(restaurantName, location = "Miami, FL") {
  const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(restaurantName)}&location=${encodeURIComponent(location)}&categories=restaurants&limit=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.businesses && data.businesses.length > 0) {
      return data.businesses[0]; // Return the best match
    }
    return null;
  } catch (error) {
    console.log(`   ❌ Error searching Yelp for ${restaurantName}: ${error.message}`);
    return null;
  }
}

function detectCuisineFromYelpCategories(categories) {
  if (!categories || categories.length === 0) return null;
  
  // Check each category for a match
  for (const category of categories) {
    const alias = category.alias;
    if (YELP_CATEGORY_TO_CUISINE[alias]) {
      return YELP_CATEGORY_TO_CUISINE[alias];
    }
  }
  
  // If no specific match, check for general restaurant types
  const categoryAliases = categories.map(c => c.alias);
  
  if (categoryAliases.includes('restaurants')) {
    // Generic restaurant - return null to keep as American
    return null;
  }
  
  return null;
}

function detectNeighborhoodFromYelpAddress(address) {
  if (!address) return null;
  
  const fullAddress = `${address.address1 || ''} ${address.city || ''} ${address.state || ''}`.toLowerCase();
  
  for (const [neighborhood, patterns] of Object.entries(MIAMI_NEIGHBORHOODS)) {
    if (patterns.some(pattern => pattern.test(fullAddress))) {
      return neighborhood;
    }
  }
  
  // Default based on city
  if (fullAddress.includes('miami beach')) return 'South Beach';
  if (fullAddress.includes('miami')) return 'Downtown Miami';
  
  return null;
}

function mapYelpPriceToOurs(yelpPrice) {
  // Yelp uses $ to $$$$ scale, we use $ to $$$$$
  const mapping = {
    '$': '$',
    '$$': '$$', 
    '$$$': '$$$',
    '$$$$': '$$$$'
  };
  
  return mapping[yelpPrice] || null;
}

async function enhanceAmericanRestaurantsWithYelp() {
  console.log('🔍 Starting Yelp-based enhancement for American restaurants...\n');
  
  // Get only restaurants marked as "American" - these are our problem cases
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, primary_cuisine, budget_category, neighborhood')
    .eq('primary_cuisine', 'American');
  
  if (error) {
    console.error('Error fetching American restaurants:', error);
    return;
  }
  
  console.log(`Found ${restaurants.length} restaurants categorized as American\n`);
  console.log('🎯 Goal: Only fix restaurants with clear, confident cuisine matches\n');
  
  let enhanced = 0;
  let notFound = 0;
  let keptAmerican = 0;
  let errors = 0;
  const cuisineChanges = {};
  
  // Process in small batches to respect API limits (5,000/day is generous but let's be careful)
  const batchSize = 10;
  const totalBatches = Math.ceil(restaurants.length / batchSize);
  
  console.log(`⚡ Processing in ${totalBatches} batches of ${batchSize}`);
  console.log(`   API delay: 1 second between requests, 5 seconds between batches\n`);
  
  for (let i = 0; i < restaurants.length; i += batchSize) {
    const batch = restaurants.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, restaurants.length)})`);
    console.log('   ' + '─'.repeat(50));
    
    for (const restaurant of batch) {
      try {
        console.log(`   🔍 Looking up: ${restaurant.name}`);
        
        const yelpData = await searchYelp(restaurant.name);
        
        if (!yelpData) {
          console.log(`   ❓ No Yelp data found for: ${restaurant.name}`);
          notFound++;
          continue;
        }
        
        // Extract potential updates
        const detectedCuisine = detectCuisineFromYelpCategories(yelpData.categories);
        const detectedNeighborhood = detectNeighborhoodFromYelpAddress(yelpData.location);
        const detectedBudget = mapYelpPriceToOurs(yelpData.price);
        
        const updates = {};
        let hasUpdates = false;
        
        // Only update cuisine if we have a confident, specific match (not generic "American")
        if (detectedCuisine && detectedCuisine !== 'American') {
          updates.primary_cuisine = detectedCuisine;
          hasUpdates = true;
          console.log(`   🍽️  Cuisine: American → ${detectedCuisine}`);
          cuisineChanges[detectedCuisine] = (cuisineChanges[detectedCuisine] || 0) + 1;
        }
        
        // Update budget if detected and currently null
        if (detectedBudget && !restaurant.budget_category) {
          updates.budget_category = detectedBudget;
          hasUpdates = true;
          console.log(`   💰 Budget: null → ${detectedBudget}`);
        }
        
        // Update neighborhood if detected and currently null
        if (detectedNeighborhood && !restaurant.neighborhood) {
          updates.neighborhood = detectedNeighborhood;
          hasUpdates = true;
          console.log(`   🗺️  Neighborhood: null → ${detectedNeighborhood}`);
        }
        
        if (hasUpdates) {
          // Apply updates to database
          const { error: updateError } = await supabase
            .from('restaurants')
            .update({
              ...updates,
              last_updated: new Date().toISOString()
            })
            .eq('id', restaurant.id);
          
          if (!updateError) {
            enhanced++;
          } else {
            console.log(`   ❌ Database error for ${restaurant.name}: ${updateError.message}`);
            errors++;
          }
        } else {
          console.log(`   ✅ ${restaurant.name}: Staying as American (no clear alternative)`);
          keptAmerican++;
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Error processing ${restaurant.name}: ${error.message}`);
        errors++;
      }
    }
    
    // Progress indicator
    const progress = ((batchNum / totalBatches) * 100).toFixed(1);
    console.log(`   📊 Progress: ${progress}% (${enhanced} enhanced, ${keptAmerican} kept American, ${notFound} not found)`);
    
    // Longer delay between batches
    if (batchNum < totalBatches) {
      console.log(`   ⏳ Waiting 5 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 YELP ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   • Restaurants enhanced: ${enhanced}`);
  console.log(`   • Kept as American: ${keptAmerican}`);
  console.log(`   • Not found in Yelp: ${notFound}`);
  console.log(`   • Errors: ${errors}`);
  console.log(`   • Total processed: ${restaurants.length}`);
  
  if (Object.keys(cuisineChanges).length > 0) {
    console.log(`\n🔄 Cuisine Changes:`);
    Object.entries(cuisineChanges)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cuisine, count]) => {
        console.log(`   • American → ${cuisine}: ${count} restaurants`);
      });
  }
  
  console.log(`\n✨ Conservative enhancement complete!`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Review cuisine changes to verify accuracy`);
  console.log(`   2. Consider Foursquare API for restaurants Yelp didn't find`);
  console.log(`   3. Manual review of remaining American restaurants`);
}

// Run the enhancement
enhanceAmericanRestaurantsWithYelp().catch(console.error);