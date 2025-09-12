// monthly-restaurant-discovery.mjs
console.log("🚀 RUNNING MONTHLY AUTOMATED RESTAURANT DISCOVERY");

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const YELP_API_KEY = process.env.YELP_API_KEY

// Yelp category mappings
const YELP_CATEGORY_TO_CUISINE = {
  'italian': 'Italian',
  'pizza': 'Pizza',
  'gelato': 'Italian',
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
  'french': 'French',
  'mediterranean': 'Mediterranean',
  'greek': 'Greek',
  'spanish': 'Spanish',
  'portuguese': 'Portuguese',
  'german': 'German',
  'british': 'British',
  'mideastern': 'Middle Eastern',
  'lebanese': 'Lebanese',
  'turkish': 'Turkish',
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
  'vegan': 'Vegan',
  'vegetarian': 'Vegetarian',
  'raw_food': 'Healthy',
  'juicebars': 'Juice Bar',
  'acaibowls': 'Healthy',
  'breakfast_brunch': 'Cafe',
  'cafes': 'Cafe',
  'coffee': 'Cafe',
  'bakeries': 'Bakery',
  'donuts': 'Bakery',
  'bagels': 'Bagels',
  'icecream': 'Ice Cream',
  'desserts': 'Desserts',
  'bars': 'Bar',
  'wine_bars': 'Wine Bar',
  'cocktailbars': 'Bar',
  'sports_bars': 'Sports Bar',
  'irish_pubs': 'Bar',
  'lounges': 'Bar',
  'nightclubs': 'Nightclub',
  'hotdog': 'Fast Food',
  'fastfood': 'Fast Food',
  'food_court': 'Fast Food',
  'foodtrucks': 'Takeout'
};

// All Miami neighborhoods
const MIAMI_NEIGHBORHOODS = [
  { name: 'South Beach', location: 'South Beach, Miami Beach, FL' },
  { name: 'Mid-Beach', location: 'Mid Beach, Miami Beach, FL' },
  { name: 'North Beach', location: 'North Beach, Miami Beach, FL' },
  { name: 'Downtown Miami', location: 'Downtown Miami, FL' },
  { name: 'Brickell', location: 'Brickell, Miami, FL' },
  { name: 'Wynwood', location: 'Wynwood, Miami, FL' },
  { name: 'Little Havana', location: 'Little Havana, Miami, FL' },
  { name: 'Coral Gables', location: 'Coral Gables, FL' },
  { name: 'Coconut Grove', location: 'Coconut Grove, Miami, FL' },
  { name: 'Key Biscayne', location: 'Key Biscayne, FL' },
  { name: 'Virginia Key', location: 'Virginia Key, Miami, FL' },
  { name: 'Miami Design District', location: 'Design District, Miami, FL' },
  { name: 'Edgewater', location: 'Edgewater, Miami, FL' },
  { name: 'Bal Harbour', location: 'Bal Harbour, FL' },
  { name: 'Bay Harbor Islands', location: 'Bay Harbor Islands, FL' },
  { name: 'Surfside', location: 'Surfside, FL' }
];

// Search terms focused on new and trending restaurants
const SEARCH_TERMS = [
  'new restaurants',
  'trending restaurants',
  'recently opened',
  'hot spots',
  'popular restaurants',
  'best new'
];

// Monthly automation config
const MONTHLY_CONFIG = {
  maxApiCalls: 1000,
  maxNewRestaurants: 200,
  apiCallsUsed: 0,
  newRestaurantsFound: 0,
  duplicatesSkipped: 0,
  startTime: new Date()
};

function mapYelpPriceToOurs(yelpPrice) {
  const mapping = {
    '$': '$',
    '$$': '$$', 
    '$$$': '$$$',
    '$$$$': '$$$$'
  };
  return mapping[yelpPrice] || '$$';
}

function detectCuisineFromYelpCategories(categories) {
  if (!categories || categories.length === 0) return 'American';
  
  for (const category of categories) {
    const alias = category.alias;
    if (YELP_CATEGORY_TO_CUISINE[alias]) {
      return YELP_CATEGORY_TO_CUISINE[alias];
    }
  }
  
  return 'American';
}

function detectNeighborhoodFromAddress(address, searchNeighborhood) {
  if (!address) return searchNeighborhood;
  
  const fullAddress = `${address.address1 || ''} ${address.city || ''} ${address.state || ''}`.toLowerCase();
  
  if (fullAddress.includes('south beach') || fullAddress.includes('ocean dr') || fullAddress.includes('collins ave') && fullAddress.includes('1')) return 'South Beach';
  if (fullAddress.includes('brickell')) return 'Brickell';
  if (fullAddress.includes('wynwood')) return 'Wynwood';
  if (fullAddress.includes('little havana') || fullAddress.includes('calle ocho')) return 'Little Havana';
  if (fullAddress.includes('coral gables')) return 'Coral Gables';
  if (fullAddress.includes('coconut grove')) return 'Coconut Grove';
  if (fullAddress.includes('key biscayne')) return 'Key Biscayne';
  if (fullAddress.includes('design district')) return 'Miami Design District';
  if (fullAddress.includes('bal harbour')) return 'Bal Harbour';
  if (fullAddress.includes('surfside')) return 'Surfside';
  
  return searchNeighborhood;
}

async function searchYelpRestaurants(term, location, offset = 0, limit = 50) {
  const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&categories=restaurants,food&limit=${limit}&offset=${offset}&radius=8000`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    MONTHLY_CONFIG.apiCallsUsed++;
    
    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`   ❌ Error searching Yelp: ${error.message}`);
    return null;
  }
}

async function checkIfRestaurantExists(name, neighborhood, yelpId) {
  // Primary check: exact yelp_id match
  if (yelpId) {
    const { data: yelpMatch } = await supabase
      .from('restaurants')
      .select('id')
      .eq('yelp_id', yelpId);
    
    if (yelpMatch && yelpMatch.length > 0) return true;
  }
  
  // Secondary check: name similarity within neighborhood
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name')
    .or(`name.ilike.%${name}%,name.ilike.%${name.split(' ')[0]}%`)
    .eq('neighborhood', neighborhood);
  
  if (error) return false;
  
  if (data && data.length > 0) {
    for (const existing of data) {
      const similarity = calculateSimilarity(name.toLowerCase(), existing.name.toLowerCase());
      if (similarity > 0.8) return true;
    }
  }
  
  return false;
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function importRestaurantFromYelp(business, neighborhood) {
  const cuisine = detectCuisineFromYelpCategories(business.categories);
  const budget = mapYelpPriceToOurs(business.price);
  const detectedNeighborhood = detectNeighborhoodFromAddress(business.location, neighborhood);
  
  const restaurantData = {
    name: business.name,
    primary_cuisine: cuisine,
    budget_category: budget,
    neighborhood: detectedNeighborhood,
    address: business.location ? `${business.location.address1 || ''} ${business.location.city || ''} ${business.location.state || ''}`.trim() : null,
    latitude: business.coordinates ? business.coordinates.latitude : null,
    longitude: business.coordinates ? business.coordinates.longitude : null,
    yelp_id: business.id,
    yelp_rating: business.rating,
    yelp_review_count: business.review_count,
    phone: business.phone,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    discovery_source: 'monthly_automation',
    discovery_date: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurantData)
    .select();
  
  if (error) {
    console.log(`   ❌ Error importing ${business.name}: ${error.message}`);
    return false;
  }
  
  return true;
}

async function discoverNewRestaurantsInNeighborhood(neighborhood, searchTerm) {
  console.log(`\n🔍 Searching for "${searchTerm}" in ${neighborhood.name}`);
  
  let imported = 0;
  let duplicates = 0;
  let processed = 0;
  
  // Safety check - stop if we've hit limits
  if (MONTHLY_CONFIG.apiCallsUsed >= MONTHLY_CONFIG.maxApiCalls || 
      MONTHLY_CONFIG.newRestaurantsFound >= MONTHLY_CONFIG.maxNewRestaurants) {
    console.log(`   ⚠️ Monthly limits reached, skipping further searches`);
    return { imported: 0, duplicates: 0, processed: 0 };
  }
  
  const yelpData = await searchYelpRestaurants(searchTerm, neighborhood.location, 0, 25); // Smaller batches
  
  if (!yelpData || !yelpData.businesses || yelpData.businesses.length === 0) {
    console.log(`   📦 No results found`);
    return { imported: 0, duplicates: 0, processed: 0 };
  }
  
  console.log(`   📦 Processing ${yelpData.businesses.length} businesses`);
  
  for (const business of yelpData.businesses) {
    processed++;
    
    // Check if restaurant already exists
    const exists = await checkIfRestaurantExists(business.name, neighborhood.name, business.id);
    
    if (exists) {
      console.log(`   ⏭️ Skipping duplicate: ${business.name}`);
      duplicates++;
      continue;
    }
    
    // Import new restaurant
    const success = await importRestaurantFromYelp(business, neighborhood.name);
    
    if (success) {
      const cuisine = detectCuisineFromYelpCategories(business.categories);
      const budget = mapYelpPriceToOurs(business.price);
      console.log(`   ✅ Imported: ${business.name} (${cuisine}, ${budget || 'no price'}, ${business.review_count || 0} reviews)`);
      imported++;
      MONTHLY_CONFIG.newRestaurantsFound++;
      
      // Safety check after each import
      if (MONTHLY_CONFIG.newRestaurantsFound >= MONTHLY_CONFIG.maxNewRestaurants) {
        console.log(`   🛑 Monthly restaurant limit reached (${MONTHLY_CONFIG.maxNewRestaurants})`);
        break;
      }
    }
    
    // Small delay between imports
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  MONTHLY_CONFIG.duplicatesSkipped += duplicates;
  
  console.log(`   📊 ${neighborhood.name} - ${searchTerm}: ${imported} imported, ${duplicates} duplicates, ${processed} processed`);
  return { imported, duplicates, processed };
}

async function createDiscoverySummary() {
  const endTime = new Date();
  const duration = Math.round((endTime - MONTHLY_CONFIG.startTime) / 1000 / 60); // minutes
  
  // Get total restaurant count
  const { data: totalCount } = await supabase
    .from('restaurants')
    .select('id', { count: 'exact' });
  
  // Get count of monthly discoveries
  const { data: monthlyCount } = await supabase
    .from('restaurants')
    .select('id', { count: 'exact' })
    .eq('discovery_source', 'monthly_automation')
    .gte('discovery_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  const summary = {
    timestamp: endTime.toISOString(),
    duration_minutes: duration,
    api_calls_used: MONTHLY_CONFIG.apiCallsUsed,
    api_calls_limit: MONTHLY_CONFIG.maxApiCalls,
    new_restaurants_found: MONTHLY_CONFIG.newRestaurantsFound,
    duplicates_skipped: MONTHLY_CONFIG.duplicatesSkipped,
    total_restaurants_in_db: totalCount?.length || 0,
    monthly_discoveries: monthlyCount?.length || 0,
    neighborhoods_searched: MIAMI_NEIGHBORHOODS.length,
    search_terms_used: SEARCH_TERMS.length
  };
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 MONTHLY RESTAURANT DISCOVERY SUMMARY');
  console.log('='.repeat(70));
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log(`🔍 API calls used: ${MONTHLY_CONFIG.apiCallsUsed} / ${MONTHLY_CONFIG.maxApiCalls}`);
  console.log(`✨ New restaurants found: ${MONTHLY_CONFIG.newRestaurantsFound}`);
  console.log(`⏭️ Duplicates skipped: ${MONTHLY_CONFIG.duplicatesSkipped}`);
  console.log(`🏢 Total restaurants in database: ${totalCount?.length || 0}`);
  console.log(`📅 This month's discoveries: ${monthlyCount?.length || 0}`);
  console.log(`🏘️ Neighborhoods searched: ${MIAMI_NEIGHBORHOODS.length}`);
  console.log(`🔍 Search terms used: ${SEARCH_TERMS.length}`);
  
  // Store summary for manual review
  await supabase
    .from('discovery_summaries')
    .insert(summary)
    .catch(err => console.log('Note: Could not store summary (table may not exist)'));
  
  console.log('\n🎯 MANUAL REVIEW RECOMMENDED:');
  console.log(`   Review the ${MONTHLY_CONFIG.newRestaurantsFound} newly discovered restaurants`);
  console.log(`   Check for any quality issues or miscategorized establishments`);
  console.log(`   Verify geographic accuracy and neighborhood assignments`);
  
  return summary;
}

async function runMonthlyDiscovery() {
  console.log('🚀 Starting Monthly Restaurant Discovery\n');
  
  console.log(`🎯 Configuration:`);
  console.log(`   • API call limit: ${MONTHLY_CONFIG.maxApiCalls}`);
  console.log(`   • Restaurant limit: ${MONTHLY_CONFIG.maxNewRestaurants}`);
  console.log(`   • Neighborhoods: ${MIAMI_NEIGHBORHOODS.length}`);
  console.log(`   • Search terms: ${SEARCH_TERMS.length}`);
  console.log(`   • Focus: New and trending restaurants only\n`);
  
  for (const neighborhood of MIAMI_NEIGHBORHOODS) {
    console.log(`\n🏘️ === ${neighborhood.name.toUpperCase()} ===`);
    
    for (const searchTerm of SEARCH_TERMS) {
      // Safety checks before each search
      if (MONTHLY_CONFIG.apiCallsUsed >= MONTHLY_CONFIG.maxApiCalls) {
        console.log(`\n🛑 API call limit reached (${MONTHLY_CONFIG.maxApiCalls}). Stopping discovery.`);
        break;
      }
      
      if (MONTHLY_CONFIG.newRestaurantsFound >= MONTHLY_CONFIG.maxNewRestaurants) {
        console.log(`\n🛑 Restaurant limit reached (${MONTHLY_CONFIG.maxNewRestaurants}). Stopping discovery.`);
        break;
      }
      
      try {
        await discoverNewRestaurantsInNeighborhood(neighborhood, searchTerm);
        
        // Delay between searches to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`   ❌ Error searching ${searchTerm} in ${neighborhood.name}: ${error.message}`);
      }
    }
    
    // Break outer loop if limits reached
    if (MONTHLY_CONFIG.apiCallsUsed >= MONTHLY_CONFIG.maxApiCalls || 
        MONTHLY_CONFIG.newRestaurantsFound >= MONTHLY_CONFIG.maxNewRestaurants) {
      break;
    }
    
    console.log(`   ✅ ${neighborhood.name} complete. Progress: ${MONTHLY_CONFIG.newRestaurantsFound} restaurants found`);
  }
  
  await createDiscoverySummary();
}

// Run the monthly discovery
runMonthlyDiscovery().catch(console.error);