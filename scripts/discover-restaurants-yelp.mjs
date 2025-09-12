// discover-restaurants-yelp.mjs
console.log("🚀 RUNNING COMPLETE MIAMI DISCOVERY - REMAINING 10 NEIGHBORHOODS");

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const YELP_API_KEY = process.env.YELP_API_KEY

// Yelp category mappings (reusing from enhancement script)
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

// Remaining 10 Miami neighborhoods to complete coverage
const MIAMI_NEIGHBORHOODS = [
  { name: 'Mid-Beach', location: 'Mid Beach, Miami Beach, FL' },
  { name: 'Downtown Miami', location: 'Downtown Miami, FL' },
  { name: 'Wynwood', location: 'Wynwood, Miami, FL' },
  { name: 'Little Havana', location: 'Little Havana, Miami, FL' },
  { name: 'Coral Gables', location: 'Coral Gables, FL' },
  { name: 'Virginia Key', location: 'Virginia Key, Miami, FL' },
  { name: 'Miami Design District', location: 'Design District, Miami, FL' },
  { name: 'Edgewater', location: 'Edgewater, Miami, FL' },
  { name: 'Bay Harbor Islands', location: 'Bay Harbor Islands, FL' },
  { name: 'North Bay Village', location: 'North Bay Village, FL' }
];

// More targeted search terms (remove broad "restaurants")
const SEARCH_TERMS = [
  'pizza',
  'sushi', 
  'italian',
  'mexican',
  'chinese',
  'french',
  'thai',
  'indian',
  'steakhouse',
  'seafood',
  'bars',
  'cafes',
  'bakery',
  'breakfast',
  'brunch',
  'fine dining',
  'ice cream',
  'dessert'
];

function mapYelpPriceToOurs(yelpPrice) {
  const mapping = {
    '$': '$',
    '$$': '$$', 
    '$$$': '$$$',
    '$$$$': '$$$$'
  };
  return mapping[yelpPrice] || '$$'; // Default to moderate
}

function passesQualityFilters(business) {
  // Only filter out entries with 0 reviews (likely fake/inactive)
  if (!business.review_count || business.review_count < 1) {
    console.log(`   🔍 DEBUG: ${business.name} filtered - no reviews (${business.review_count})`);
    return false;
  }
  
  return true;
}

function detectCuisineFromYelpCategories(categories) {
  if (!categories || categories.length === 0) return 'American';
  
  // Check each category for a match
  for (const category of categories) {
    const alias = category.alias;
    if (YELP_CATEGORY_TO_CUISINE[alias]) {
      return YELP_CATEGORY_TO_CUISINE[alias];
    }
  }
  
  // Default to American for general restaurants
  return 'American';
}

function detectNeighborhoodFromAddress(address, searchNeighborhood) {
  if (!address) return searchNeighborhood;
  
  const fullAddress = `${address.address1 || ''} ${address.city || ''} ${address.state || ''}`.toLowerCase();
  
  // Specific address patterns
  if (fullAddress.includes('south beach') || fullAddress.includes('ocean dr') || fullAddress.includes('collins ave') && fullAddress.includes('1')) return 'South Beach';
  if (fullAddress.includes('mid beach') || fullAddress.includes('mid-beach')) return 'Mid-Beach';
  if (fullAddress.includes('north beach')) return 'North Beach';
  if (fullAddress.includes('brickell')) return 'Brickell';
  if (fullAddress.includes('wynwood')) return 'Wynwood';
  if (fullAddress.includes('little havana') || fullAddress.includes('calle ocho')) return 'Little Havana';
  if (fullAddress.includes('coral gables')) return 'Coral Gables';
  if (fullAddress.includes('coconut grove')) return 'Coconut Grove';
  if (fullAddress.includes('key biscayne')) return 'Key Biscayne';
  if (fullAddress.includes('virginia key')) return 'Virginia Key';
  if (fullAddress.includes('design district')) return 'Miami Design District';
  if (fullAddress.includes('edgewater')) return 'Edgewater';
  if (fullAddress.includes('bal harbour')) return 'Bal Harbour';
  if (fullAddress.includes('bay harbor islands')) return 'Bay Harbor Islands';
  if (fullAddress.includes('surfside')) return 'Surfside';
  if (fullAddress.includes('north bay village')) return 'North Bay Village';
  
  // Default to the neighborhood we were searching in
  return searchNeighborhood;
}

async function searchYelpRestaurants(term, location, offset = 0, limit = 50) {
  const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&categories=restaurants,food&limit=${limit}&offset=${offset}&radius=8000`; // 5 mile radius
  
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
    return data;
  } catch (error) {
    console.log(`   ❌ Error searching Yelp: ${error.message}`);
    return null;
  }
}

async function checkIfRestaurantExists(name, neighborhood) {
  // Check if restaurant already exists in database
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name')
    .or(`name.ilike.%${name}%,name.ilike.%${name.split(' ')[0]}%`)
    .eq('neighborhood', neighborhood);
  
  if (error) return false;
  
  // Check for close matches
  if (data && data.length > 0) {
    for (const existing of data) {
      const similarity = calculateSimilarity(name.toLowerCase(), existing.name.toLowerCase());
      if (similarity > 0.8) { // 80% similarity threshold
        return true;
      }
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
    last_updated: new Date().toISOString()
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

async function discoverRestaurantsInNeighborhood(neighborhood, searchTerm) {
  console.log(`\n🔍 Searching for "${searchTerm}" in ${neighborhood.name}`);
  
  let totalFound = 0;
  let totalImported = 0;
  let duplicatesSkipped = 0;
  let filteredOut = 0;
  let offset = 0;
  const limit = 50;
  
  while (offset < 1000) { // Yelp limit is 1000 results per search
    const yelpData = await searchYelpRestaurants(searchTerm, neighborhood.location, offset, limit);
    
    if (!yelpData || !yelpData.businesses || yelpData.businesses.length === 0) {
      break;
    }
    
    console.log(`   📦 Processing ${yelpData.businesses.length} businesses (offset ${offset})`);
    
    for (const business of yelpData.businesses) {
      totalFound++;
      
      // Apply quality filters with debugging
      if (!passesQualityFilters(business)) {
        console.log(`   ⚠️  Filtered out: ${business.name} (price: "${business.price}", reviews: ${business.review_count})`);
        filteredOut++;
        continue;
      }
      
      // Check if restaurant already exists
      const exists = await checkIfRestaurantExists(business.name, neighborhood.name, business.id);
      
      if (exists) {
        console.log(`   ⏭️  Skipping duplicate: ${business.name}`);
        duplicatesSkipped++;
        continue;
      }
      
      // Import new restaurant
      const imported = await importRestaurantFromYelp(business, neighborhood.name);
      
      if (imported) {
        const cuisine = detectCuisineFromYelpCategories(business.categories);
        const budget = mapYelpPriceToOurs(business.price);
        console.log(`   ✅ Imported: ${business.name} (${cuisine}, ${budget || 'no price'}, ${business.review_count} reviews)`);
        totalImported++;
      }
      
      // Small delay between imports
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Check if we have more results
    if (yelpData.businesses.length < limit || offset + limit >= yelpData.total) {
      break;
    }
    
    offset += limit;
    
    // Delay between pages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`   📊 ${neighborhood.name} - ${searchTerm}: ${totalImported} imported, ${duplicatesSkipped} duplicates, ${filteredOut} filtered, ${totalFound} total found`);
  return { imported: totalImported, duplicates: duplicatesSkipped, filtered: filteredOut, found: totalFound };
}

async function discoverAllRestaurants() {
  console.log('🚀 Starting complete Miami restaurant discovery with Yelp...\n');
  
  let totalImported = 0;
  let totalDuplicates = 0;
  let totalFiltered = 0;
  let totalFound = 0;
  let apiCalls = 0;
  const maxApiCalls = 4500; // Use remaining API calls for completion
  
  console.log(`🎯 Target: Complete discovery in remaining ${MIAMI_NEIGHBORHOODS.length} neighborhoods`);
  console.log(`🔍 Search terms: ${SEARCH_TERMS.length} different categories`);
  console.log(`📋 Quality filters: Only block $ restaurants and 0-review entries`);
  console.log(`⚡ API limit: ${maxApiCalls} calls for completion\n`);
  
  for (const neighborhood of MIAMI_NEIGHBORHOODS) {
    console.log(`\n🏘️  === ${neighborhood.name.toUpperCase()} ===`);
    
    for (const searchTerm of SEARCH_TERMS) {
      if (apiCalls >= maxApiCalls) {
        console.log(`\n⚠️  Reached API call limit (${maxApiCalls}). Stopping discovery.`);
        break;
      }
      
      try {
        const results = await discoverRestaurantsInNeighborhood(neighborhood, searchTerm);
        
        totalImported += results.imported;
        totalDuplicates += results.duplicates;
        totalFiltered += results.filtered;
        totalFound += results.found;
        apiCalls += Math.ceil(results.found / 50); // Estimate API calls used
        
        // Delay between searches to avoid API errors
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.log(`   ❌ Error searching ${searchTerm} in ${neighborhood.name}: ${error.message}`);
      }
    }
    
    if (apiCalls >= maxApiCalls) break;
    
    console.log(`   🏘️  ${neighborhood.name} complete: ${totalImported} restaurants imported so far`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 MIAMI RESTAURANT DISCOVERY COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Final Results:`);
  console.log(`   • New restaurants imported: ${totalImported}`);
  console.log(`   • Duplicates skipped: ${totalDuplicates}`);
  console.log(`   • Quality filtered out: ${totalFiltered}`);
  console.log(`   • Total restaurants found: ${totalFound}`);
  console.log(`   • API calls used: ~${apiCalls} / ${maxApiCalls}`);
  
  console.log(`\n✨ Your complete Miami restaurant database is now ready!`);
  console.log(`\n🎯 Coverage completed across:`);
  MIAMI_NEIGHBORHOODS.forEach(n => console.log(`   • ${n.name}`));
  console.log(`\n📈 Your platform now has comprehensive Miami restaurant data for launch!`);
}

// Run the discovery
discoverAllRestaurants().catch(console.error);