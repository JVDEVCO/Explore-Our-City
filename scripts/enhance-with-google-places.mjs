// enhance-with-google-places.mjs
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// Google Places types to cuisine mapping
const GOOGLE_TYPE_TO_CUISINE = {
  'italian_restaurant': 'Italian',
  'chinese_restaurant': 'Chinese', 
  'japanese_restaurant': 'Japanese',
  'mexican_restaurant': 'Mexican',
  'french_restaurant': 'French',
  'indian_restaurant': 'Indian',
  'thai_restaurant': 'Thai',
  'korean_restaurant': 'Korean',
  'vietnamese_restaurant': 'Vietnamese',
  'spanish_restaurant': 'Spanish',
  'greek_restaurant': 'Mediterranean',
  'mediterranean_restaurant': 'Mediterranean',
  'middle_eastern_restaurant': 'Lebanese',
  'brazilian_restaurant': 'Brazilian',
  'peruvian_restaurant': 'Peruvian',
  'pizza_restaurant': 'Pizza',
  'seafood_restaurant': 'Seafood',
  'steak_house': 'Steakhouse',
  'sushi_restaurant': 'Japanese',
  'barbecue_restaurant': 'BBQ',
  'hamburger_restaurant': 'Burgers',
  'sandwich_shop': 'Sandwiches',
  'american_restaurant': 'American',
  'breakfast_restaurant': 'Breakfast',
  'brunch_restaurant': 'Brunch',
  'fast_food_restaurant': 'Fast Food',
  'meal_takeaway': 'Takeout',
  'bakery': 'Bakery',
  'cafe': 'Cafe',
  'bar': 'Bar',
  'night_club': 'Nightclub'
};

// Google price level (1-4) to budget category mapping
const PRICE_LEVEL_TO_BUDGET = {
  1: '$',    // Inexpensive  
  2: '$$',   // Moderate
  3: '$$$',  // Expensive
  4: '$$$$'  // Very Expensive
  // $$$$$ will be handled separately for ultra-luxury places
};

// Miami neighborhood detection from addresses
const ADDRESS_TO_NEIGHBORHOOD = {
  'South Beach': [/south beach/i, /sobe/i, /ocean dr/i, /collins ave.*1[0-9]/i],
  'Mid-Beach': [/mid beach/i, /collins ave.*4[0-9]/i, /41st/i],
  'North Beach': [/north beach/i, /collins ave.*7[0-9]/i, /79th/i],
  'Downtown Miami': [/downtown/i, /biscayne blvd/i, /flagler st/i],
  'Brickell': [/brickell/i, /brickell ave/i],
  'Wynwood': [/wynwood/i, /nw 2nd ave/i],
  'Little Havana': [/little havana/i, /calle ocho/i, /sw 8th st/i],
  'Coral Gables': [/coral gables/i, /miracle mile/i],
  'Coconut Grove': [/coconut grove/i, /main hwy/i],
  'Key Biscayne': [/key biscayne/i, /crandon blvd/i],
  'Virginia Key': [/virginia key/i, /marine stadium/i],
  'Bal Harbour': [/bal harbour/i, /bal harbor/i],
  'Surfside': [/surfside/i]
};

// Ultra-luxury restaurants that should be $$$$$ (regardless of Google price level)
const ULTRA_LUXURY_RESTAURANTS = [
  'L\'Atelier de Joel Robuchon', 'Azabu', 'The Forge', 'Barton G',
  'Villa Azur', 'Cipriani', 'Four Seasons', 'Blue Door Fish'
];

async function searchGooglePlaces(restaurantName) {
  const query = `${restaurantName} Miami Florida restaurant`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0]; // Return the first (best) match
    }
    return null;
  } catch (error) {
    console.log(`   ❌ Error searching for ${restaurantName}: ${error.message}`);
    return null;
  }
}

function detectCuisineFromGoogleTypes(types) {
  // Check for specific restaurant types first
  for (const type of types) {
    if (GOOGLE_TYPE_TO_CUISINE[type]) {
      return GOOGLE_TYPE_TO_CUISINE[type];
    }
  }
  
  // Check for general categories
  if (types.includes('restaurant')) {
    return 'American'; // Default for general restaurants
  }
  
  if (types.includes('bar') || types.includes('liquor_store')) {
    return 'Bar';
  }
  
  if (types.includes('night_club')) {
    return 'Nightclub';
  }
  
  return null; // Couldn't determine
}

function detectNeighborhoodFromAddress(address) {
  if (!address) return null;
  
  const addressLower = address.toLowerCase();
  
  for (const [neighborhood, patterns] of Object.entries(ADDRESS_TO_NEIGHBORHOOD)) {
    if (patterns.some(pattern => pattern.test(addressLower))) {
      return neighborhood;
    }
  }
  
  // Default based on common Miami areas
  if (addressLower.includes('miami beach')) return 'South Beach';
  if (addressLower.includes('miami')) return 'Downtown Miami';
  
  return null;
}

function determineBudgetCategory(priceLevel, restaurantName) {
  // Check for ultra-luxury first
  if (ULTRA_LUXURY_RESTAURANTS.some(luxury => restaurantName.includes(luxury))) {
    return '$$$$$';
  }
  
  // Use Google price level if available
  if (priceLevel && PRICE_LEVEL_TO_BUDGET[priceLevel]) {
    return PRICE_LEVEL_TO_BUDGET[priceLevel];
  }
  
  // Default fallback
  return '$$'; // Most restaurants are casual dining
}

async function enhanceRestaurantWithGooglePlaces(restaurant) {
  console.log(`   🔍 Looking up: ${restaurant.name}`);
  
  const googleData = await searchGooglePlaces(restaurant.name);
  
  if (!googleData) {
    console.log(`   ❓ No Google data found for: ${restaurant.name}`);
    return null;
  }
  
  const updates = {};
  let hasUpdates = false;
  
  // Update cuisine if we can detect it
  const detectedCuisine = detectCuisineFromGoogleTypes(googleData.types || []);
  if (detectedCuisine && detectedCuisine !== restaurant.primary_cuisine) {
    updates.primary_cuisine = detectedCuisine;
    hasUpdates = true;
    console.log(`   🍽️  Cuisine: ${restaurant.primary_cuisine} → ${detectedCuisine}`);
  }
  
  // Update budget category
  const detectedBudget = determineBudgetCategory(googleData.price_level, restaurant.name);
  if (detectedBudget) {
    updates.budget_category = detectedBudget;
    hasUpdates = true;
    console.log(`   💰 Budget: null → ${detectedBudget}`);
  }
  
  // Update neighborhood
  const detectedNeighborhood = detectNeighborhoodFromAddress(googleData.formatted_address);
  if (detectedNeighborhood && detectedNeighborhood !== restaurant.neighborhood) {
    updates.neighborhood = detectedNeighborhood;
    hasUpdates = true;
    console.log(`   🗺️  Neighborhood: ${restaurant.neighborhood || 'null'} → ${detectedNeighborhood}`);
  }
  
  // Update address if missing
  if (googleData.formatted_address && !restaurant.address) {
    updates.address = googleData.formatted_address;
    hasUpdates = true;
    console.log(`   📍 Address: ${googleData.formatted_address}`);
  }
  
  // Update coordinates if missing
  if (googleData.geometry?.location) {
    if (!restaurant.latitude || !restaurant.longitude) {
      updates.latitude = googleData.geometry.location.lat;
      updates.longitude = googleData.geometry.location.lng;
      hasUpdates = true;
      console.log(`   📍 Coordinates: ${updates.latitude}, ${updates.longitude}`);
    }
  }
  
  // Update Google Place ID if missing
  if (googleData.place_id && !restaurant.google_place_id) {
    updates.google_place_id = googleData.place_id;
    hasUpdates = true;
  }
  
  // Mark business status
  if (googleData.business_status === 'CLOSED_PERMANENTLY') {
    console.log(`   ⚠️  ${restaurant.name} is permanently closed - consider removing`);
  }
  
  return hasUpdates ? updates : null;
}

async function enhanceAllRestaurants() {
  console.log('🚀 Starting Google Places enhancement...\n');
  
  // Get all restaurants that need enhancement
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, primary_cuisine, budget_category, neighborhood, address, latitude, longitude, google_place_id');
  
  if (error) {
    console.error('Error fetching restaurants:', error);
    return;
  }
  
  console.log(`Found ${restaurants.length} restaurants to enhance\n`);
  
  let enhanced = 0;
  let notFound = 0;
  let errors = 0;
  const enhancementSummary = {
    cuisine: 0,
    budget: 0,
    neighborhood: 0,
    address: 0,
    coordinates: 0
  };
  
  // Process in small batches to respect API limits (Google allows 100 requests/second)
  const batchSize = 5;
  const totalBatches = Math.ceil(restaurants.length / batchSize);
  
  console.log(`⚡ Processing in ${totalBatches} batches of ${batchSize}`);
  console.log(`   API delay: 1 second between requests, 3 seconds between batches\n`);
  
  for (let i = 0; i < restaurants.length; i += batchSize) {
    const batch = restaurants.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, restaurants.length)})`);
    console.log('   ' + '─'.repeat(50));
    
    for (const restaurant of batch) {
      try {
        const updates = await enhanceRestaurantWithGooglePlaces(restaurant);
        
        if (updates) {
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
            // Track what was updated
            if (updates.primary_cuisine) enhancementSummary.cuisine++;
            if (updates.budget_category) enhancementSummary.budget++;
            if (updates.neighborhood) enhancementSummary.neighborhood++;
            if (updates.address) enhancementSummary.address++;
            if (updates.latitude) enhancementSummary.coordinates++;
          } else {
            console.log(`   ❌ Database error for ${restaurant.name}: ${updateError.message}`);
            errors++;
          }
        } else {
          console.log(`   ✅ ${restaurant.name}: No updates needed`);
        }
        
        // API rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Error processing ${restaurant.name}: ${error.message}`);
        errors++;
      }
    }
    
    // Progress indicator
    const progress = ((batchNum / totalBatches) * 100).toFixed(1);
    console.log(`   📊 Progress: ${progress}% (${enhanced} enhanced, ${notFound} not found, ${errors} errors)`);
    
    // Longer delay between batches
    if (batchNum < totalBatches) {
      console.log(`   ⏳ Waiting 3 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 GOOGLE PLACES ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   • Restaurants enhanced: ${enhanced}`);
  console.log(`   • Restaurants not found in Google: ${notFound}`);
  console.log(`   • Errors: ${errors}`);
  console.log(`   • Total processed: ${restaurants.length}`);
  
  console.log(`\n🔄 Enhancement Breakdown:`);
  console.log(`   • Cuisine updates: ${enhancementSummary.cuisine}`);
  console.log(`   • Budget updates: ${enhancementSummary.budget}`);
  console.log(`   • Neighborhood updates: ${enhancementSummary.neighborhood}`);
  console.log(`   • Address updates: ${enhancementSummary.address}`);
  console.log(`   • Coordinate updates: ${enhancementSummary.coordinates}`);
  
  console.log(`\n✨ Your restaurant database is now enhanced with authoritative Google Places data!`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Review any restaurants marked as permanently closed`);
  console.log(`   2. Manually assign $$$$$ to any ultra-luxury venues Google missed`);
  console.log(`   3. Build Google Places deduplication script to avoid duplicate imports`);
}

// Run the enhancement
enhanceAllRestaurants().catch(console.error);