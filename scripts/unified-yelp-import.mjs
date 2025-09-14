// unified-yelp-import.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// API Configuration
const APIS = {
  YELP: 'https://api.yelp.com/v3'
};

// Different geographic bounds for entertainment vs adventures
const ENTERTAINMENT_BOUNDS = {
  // Tight bounds around core Miami neighborhoods
  north: 25.95,   
  south: 25.40,   
  east: -80.05,   
  west: -80.45    
};

const ADVENTURE_BOUNDS = {
  // Expanded bounds for Miami-Dade + Monroe County
  north: 25.98,   // North Miami-Dade border
  south: 24.45,   // Key West (southernmost point)
  east: -80.05,   // Atlantic coast
  west: -81.00    // Western Everglades/Monroe County border
};

// Entertainment Categories
const ENTERTAINMENT_CATEGORIES = {
  MUSIC: ['musicvenues', 'jazzandblues', 'piano_bars', 'karaoke'],
  NIGHTLIFE: ['nightlife', 'danceclubs', 'bars', 'cocktailbars', 'sportsbars', 'divebars'],
  THEATER: ['theaters', 'comedyclubs', 'movietheaters'],
  RECREATION: ['poolbilliards', 'bowling', 'arcades', 'adultentertainment'],
  ARTS: ['arts', 'galleries', 'museums', 'performing_arts']
};

// Adventure Categories (Yelp Active Life categories)
const ADVENTURE_CATEGORIES = {
  WATER: ['boating', 'fishing', 'watersports', 'diving', 'beaches'],
  NATURE: ['parks', 'hiking', 'tours', 'zoos', 'aquariums'],
  ATTRACTIONS: ['amusementparks', 'museums', 'landmarks', 'tours'],
  ACTIVE: ['active', 'recreation', 'sportsgear', 'fitness']
};

function categorizeActivity(name, description = '', category = '', yelpCategories = []) {
  const text = `${name} ${description} ${category}`.toLowerCase();
  const categoryText = yelpCategories.map(c => c.alias).join(' ');
  
  // Check if it's an adventure/active life activity first
  const allAdventureKeywords = Object.values(ADVENTURE_CATEGORIES).flat();
  if (allAdventureKeywords.some(keyword => categoryText.includes(keyword) || text.includes(keyword))) {
    
    // Water activities
    if (ADVENTURE_CATEGORIES.WATER.some(keyword => categoryText.includes(keyword) || text.includes(keyword))) {
      return { primaryCategory: 'adventure', activityType: 'water_sports' };
    }
    
    // Nature & Wildlife
    if (ADVENTURE_CATEGORIES.NATURE.some(keyword => categoryText.includes(keyword) || text.includes(keyword))) {
      return { primaryCategory: 'adventure', activityType: 'nature' };
    }
    
    // Attractions & Theme Parks
    if (ADVENTURE_CATEGORIES.ATTRACTIONS.some(keyword => categoryText.includes(keyword) || text.includes(keyword))) {
      return { primaryCategory: 'adventure', activityType: 'attractions' };
    }
    
    // General Active Life
    if (ADVENTURE_CATEGORIES.ACTIVE.some(keyword => categoryText.includes(keyword) || text.includes(keyword))) {
      return { primaryCategory: 'adventure', activityType: 'active_life' };
    }
    
    return { primaryCategory: 'adventure', activityType: 'general' };
  }
  
  // Entertainment categorization
  if (ENTERTAINMENT_CATEGORIES.MUSIC.some(keyword => text.includes(keyword))) {
    return { primaryCategory: 'entertainment', activityType: 'music' };
  }
  
  if (ENTERTAINMENT_CATEGORIES.NIGHTLIFE.some(keyword => text.includes(keyword))) {
    return { primaryCategory: 'entertainment', activityType: 'nightlife' };
  }
  
  if (ENTERTAINMENT_CATEGORIES.THEATER.some(keyword => text.includes(keyword))) {
    return { primaryCategory: 'entertainment', activityType: 'theater' };
  }
  
  if (ENTERTAINMENT_CATEGORIES.RECREATION.some(keyword => text.includes(keyword))) {
    return { primaryCategory: 'entertainment', activityType: 'recreation' };
  }
  
  if (ENTERTAINMENT_CATEGORIES.ARTS.some(keyword => text.includes(keyword))) {
    return { primaryCategory: 'entertainment', activityType: 'arts' };
  }
  
  // Default to entertainment if no clear adventure indicators
  return { primaryCategory: 'entertainment', activityType: 'general' };
}

function determinePrice(name, category, price, primaryCategory) {
  const text = `${name} ${category}`.toLowerCase();
  
  if (primaryCategory === 'adventure') {
    // Adventure pricing logic
    if (text.includes('private') || text.includes('charter') || text.includes('helicopter') || 
        text.includes('luxury') || text.includes('vip')) {
      return '$$$$$';
    }
    
    if (text.includes('tour') || text.includes('cruise') || text.includes('diving') || 
        text.includes('fishing') || text.includes('zoo') || text.includes('aquarium')) {
      return '$$$$';
    }
    
    if (text.includes('park') || text.includes('museum') || text.includes('beach') || 
        text.includes('hiking') || text.includes('nature')) {
      return '$$$';
    }
    
    if (text.includes('free') || text.includes('public')) {
      return '$';
    }
    
    // Use Yelp price if available
    if (price) {
      const priceMap = { '$': '$', '$$': '$$', '$$$': '$$$', '$$$$': '$$$$' };
      return priceMap[price] || '$$$';
    }
    
    return '$$$';
  } else {
    // Entertainment pricing logic (existing)
    if (text.includes('vip') || text.includes('exclusive') || text.includes('rooftop') || 
        text.includes('luxury') || text.includes('miami beach') || text.includes('fontainebleau')) {
      return '$$$$$';
    }
    
    if (text.includes('club') || text.includes('lounge') || text.includes('theater') ||
        text.includes('live music') || text.includes('cocktail') || text.includes('south beach')) {
      return '$$$$';
    }
    
    if (text.includes('bar') || text.includes('comedy') || text.includes('bowling') ||
        text.includes('pool') || text.includes('karaoke') || text.includes('sports bar')) {
      return '$$$';
    }
    
    if (text.includes('dive') || text.includes('local') || text.includes('neighborhood') ||
        text.includes('happy hour') || text.includes('arcade')) {
      return '$$';
    }
    
    if (text.includes('free') || text.includes('no cover') || text.includes('gallery') ||
        text.includes('museum') || text.includes('art show')) {
      return '$';
    }
    
    if (price) {
      const priceMap = { '$': '$', '$$': '$$', '$$$': '$$$', '$$$$': '$$$$' };
      return priceMap[price] || '$$$';
    }
    
    return '$$$';
  }
}

function determineNeighborhoodExpanded(lat, lng) {
  if (!lat || !lng) return 'Miami';
  
  // Florida Keys (for adventures)
  if (lat < 25.0) {
    if (lat < 24.6) return 'Key West';
    if (lat < 24.9) return 'Lower Keys';
    return 'Key Largo';
  }
  
  // Core Miami neighborhoods (for both entertainment and adventures)
  if (lat >= 25.76 && lat <= 25.80 && lng >= -80.15 && lng <= -80.11) return 'South Beach';
  if (lat >= 25.80 && lat <= 25.85 && lng >= -80.15 && lng <= -80.11) return 'Mid-Beach';
  if (lat >= 25.85 && lat <= 25.90 && lng >= -80.15 && lng <= -80.11) return 'North Beach';
  if (lat >= 25.72 && lat <= 25.78 && lng >= -80.30 && lng <= -80.25) return 'Coral Gables';
  if (lat >= 25.70 && lat <= 25.76 && lng >= -80.25 && lng <= -80.20) return 'Coconut Grove';
  if (lat >= 25.76 && lat <= 25.82 && lng >= -80.20 && lng <= -80.15) return 'Downtown Miami';
  if (lat >= 25.76 && lat <= 25.80 && lng >= -80.20 && lng <= -80.18) return 'Brickell';
  if (lat >= 25.82 && lat <= 25.88 && lng >= -80.20 && lng <= -80.15) return 'Wynwood';
  if (lat >= 25.78 && lat <= 25.82 && lng >= -80.25 && lng <= -80.20) return 'Little Havana';
  
  // Extended Miami-Dade areas (primarily for adventures)
  if (lat >= 25.55 && lat <= 25.65 && lng >= -80.45 && lng <= -80.35) return 'Homestead';
  if (lat >= 25.88 && lat <= 25.95 && lng >= -80.20 && lng <= -80.15) return 'Aventura';
  if (lat >= 25.65 && lat <= 25.75 && lng >= -80.35 && lng <= -80.25) return 'Kendall';
  
  // Everglades area
  if (lng < -80.5) return 'Everglades';
  
  return 'Greater Miami';
}

function assignTouristCategory(name, category, price, rating, primaryCategory) {
  const text = `${name} ${category}`.toLowerCase();
  
  if (primaryCategory === 'adventure') {
    // Adventure tourist categories
    const majorAttractions = [
      'zoo miami', 'miami seaquarium', 'dezerland', 'vizcaya', 'frost science',
      'everglades national park', 'key west', 'dry tortugas', 'jungle island'
    ];
    
    if (majorAttractions.some(attraction => text.includes(attraction))) {
      return 'must_see';
    }
    
    if (price === '$$$$$' || text.includes('private') || text.includes('charter')) {
      return 'must_see';
    }
    
    if (text.includes('seasonal') || text.includes('migration') || text.includes('nesting')) {
      return 'seasonal';
    }
    
    if (rating >= 4.0 && (price === '$' || price === '$$')) {
      return 'hidden_gem';
    }
    
    return 'local_favorite';
  } else {
    // Entertainment tourist categories (existing logic)
    const majorVenues = ['fontainebleau', 'liv', 'story', 'e11even', 'nikki beach'];
    if (majorVenues.some(venue => text.includes(venue))) {
      return 'must_see';
    }
    
    if (rating >= 4.5 && (price === '$$$$' || price === '$$$$$')) {
      return 'must_see';
    }
    
    if (text.includes('rooftop') || text.includes('beach club') || text.includes('pool party')) {
      return 'seasonal';
    }
    
    if (rating >= 4.0 && (price === '$$' || price === '$$$')) {
      return 'local_favorite';
    }
    
    if (rating >= 4.0 && price === '$') {
      return 'hidden_gem';
    }
    
    return 'local_favorite';
  }
}

async function fetchYelpActivities() {
  console.log('Fetching Yelp Activities Data (Entertainment + Adventures)...\n');
  
  const headers = {
    'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
    'Accept': 'application/json'
  };
  
  try {
    // Combined categories - entertainment + adventure
    const allCategories = [
      // Entertainment categories
      'musicvenues', 'nightlife', 'danceclubs', 'bars', 'cocktailbars', 
      'sportsbars', 'theaters', 'comedyclubs', 'karaoke', 'poolbilliards', 
      'bowling', 'arcades', 'arts', 'galleries',
      // Adventure categories  
      'active', 'tours', 'boating', 'fishing', 'watersports', 'diving',
      'parks', 'hiking', 'zoos', 'aquariums', 'amusementparks', 'museums'
    ];
    
    const activities = [];
    
    for (const category of allCategories) {
      console.log(`Fetching ${category} activities...`);
      
      // Use wider search area for all categories initially
      const response = await fetch(
        `${APIS.YELP}/businesses/search?categories=${category}&location=Miami,FL&radius=40000&limit=50`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        activities.push(...data.businesses.map(business => ({
          ...business,
          search_category: category
        })));
        
        console.log(`Found ${data.businesses.length} ${category} activities`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.error(`Error fetching ${category}:`, response.status, response.statusText);
      }
    }
    
    return { activities };
  } catch (error) {
    console.error('Yelp API Error:', error);
    return null;
  }
}

function filterByCategory(activities) {
  const filtered = [];
  
  activities.forEach(activity => {
    const lat = activity.coordinates?.latitude;
    const lng = activity.coordinates?.longitude;
    
    if (!lat || !lng) return;
    
    // Determine if it's entertainment or adventure
    const { primaryCategory } = categorizeActivity(
      activity.name,
      '',
      activity.search_category,
      activity.categories || []
    );
    
    // Apply appropriate geographic bounds
    let withinBounds = false;
    
    if (primaryCategory === 'entertainment') {
      // Use tight entertainment bounds
      withinBounds = lat >= ENTERTAINMENT_BOUNDS.south && 
                    lat <= ENTERTAINMENT_BOUNDS.north &&
                    lng >= ENTERTAINMENT_BOUNDS.west && 
                    lng <= ENTERTAINMENT_BOUNDS.east;
    } else {
      // Use expanded adventure bounds
      withinBounds = lat >= ADVENTURE_BOUNDS.south && 
                    lat <= ADVENTURE_BOUNDS.north &&
                    lng >= ADVENTURE_BOUNDS.west && 
                    lng <= ADVENTURE_BOUNDS.east;
    }
    
    if (withinBounds) {
      filtered.push(activity);
    }
  });
  
  return filtered;
}

async function processAndInsertActivities(rawData) {
  console.log('Processing and categorizing all activities...\n');
  
  let allActivities = [];
  
  if (rawData.yelp?.activities) {
    allActivities = rawData.yelp.activities;
  }
  
  // Apply category-specific geographic filtering
  const filteredActivities = filterByCategory(allActivities);
  console.log(`Filtered to ${filteredActivities.length} activities within appropriate bounds`);
  
  // Remove duplicates by Yelp ID
  const uniqueActivities = [];
  const seenIds = new Set();
  
  filteredActivities.forEach(activity => {
    if (!seenIds.has(activity.id)) {
      seenIds.add(activity.id);
      uniqueActivities.push(activity);
    }
  });
  
  console.log(`Removed duplicates: ${uniqueActivities.length} unique activities`);
  
  const processedActivities = [];
  
  uniqueActivities.forEach(activity => {
    const lat = activity.coordinates?.latitude;
    const lng = activity.coordinates?.longitude;
    
    if (!lat || !lng) return;
    
    const { primaryCategory, activityType } = categorizeActivity(
      activity.name,
      '',
      activity.search_category,
      activity.categories || []
    );
    
    const priceRange = determinePrice(
      activity.name, 
      activity.search_category, 
      activity.price, 
      primaryCategory
    );
    
    processedActivities.push({
      // Core fields
      name: activity.name,
      description: activity.categories?.map(c => c.title).join(', ') || '',
      
      // Unified activities table fields
      primary_category: primaryCategory,
      activity_type: activityType,
      
      // Location
      address: activity.location?.display_address?.join(', ') || '',
      neighborhood: determineNeighborhoodExpanded(lat, lng),
      city: 'Miami',
      state: 'FL',
      latitude: lat,
      longitude: lng,
      
      // Pricing
      price_tier: getPriceTier(priceRange),
      price_range: priceRange,
      
      // Categories
      tourist_category: assignTouristCategory(
        activity.name, 
        activity.search_category, 
        priceRange, 
        activity.rating,
        primaryCategory
      ),
      target_audience: primaryCategory === 'entertainment' ? 'adults' : 'all_ages',
      
      // API fields
      api_source: 'yelp',
      external_id: activity.id,
      external_url: activity.url,
      
      // Contact & web
      phone: activity.phone,
      website: activity.url,
      image_url: activity.image_url,
      
      // Status
      status: activity.is_closed ? 'inactive' : 'active',
      
      // Tags for cross-category functionality
      tags: [
        primaryCategory,
        activityType,
        activity.search_category,
        'yelp',
        'miami'
      ],
      
      // Yelp-specific fields
      yelp_rating: activity.rating,
      yelp_review_count: activity.review_count,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });
  
  console.log(`Processed ${processedActivities.length} activities`);
  
  // Insert into unified activities table
  if (processedActivities.length > 0) {
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < processedActivities.length; i += batchSize) {
      const batch = processedActivities.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('activities')
        .upsert(batch, { 
          onConflict: 'external_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error('Database insert error:', error);
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}, total: ${inserted}`);
      }
      
      // Rate limiting for database
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return processedActivities;
}

function getPriceTier(priceRange) {
  const tierMap = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4, '$$$$$': 5 };
  return tierMap[priceRange] || 3;
}

async function main() {
  console.log('Starting Unified Miami Activities Import (Yelp Entertainment + Adventures)...\n');
  
  // Check API key
  if (!process.env.YELP_API_KEY) {
    console.error('Missing YELP_API_KEY in .env.local');
    return;
  }
  
  // Fetch from Yelp API
  const yelp = await fetchYelpActivities();
  
  console.log('\nData Collection Results:');
  console.log('Total Yelp Activities:', yelp?.activities?.length || 0);
  
  // Process and insert
  const rawData = { yelp };
  const activities = await processAndInsertActivities(rawData);
  
  // Show results by primary category
  const primaryCategoryStats = {};
  activities.forEach(activity => {
    primaryCategoryStats[activity.primary_category] = (primaryCategoryStats[activity.primary_category] || 0) + 1;
  });
  
  console.log('\nPrimary Categories:');
  Object.entries(primaryCategoryStats).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} activities`);
  });
  
  // Show activity type breakdown
  const activityTypeStats = {};
  activities.forEach(activity => {
    const key = `${activity.primary_category}/${activity.activity_type}`;
    activityTypeStats[key] = (activityTypeStats[key] || 0) + 1;
  });
  
  console.log('\nActivity Type Breakdown:');
  Object.entries(activityTypeStats).forEach(([type, count]) => {
    console.log(`${type}: ${count} activities`);
  });
  
  // Tourist category breakdown
  const touristStats = {};
  activities.forEach(activity => {
    touristStats[activity.tourist_category] = (touristStats[activity.tourist_category] || 0) + 1;
  });
  
  console.log('\nTourist Categories:');
  Object.entries(touristStats).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} activities`);
  });
  
  // Neighborhood distribution
  const neighborhoodStats = {};
  activities.forEach(activity => {
    neighborhoodStats[activity.neighborhood] = (neighborhoodStats[activity.neighborhood] || 0) + 1;
  });
  
  console.log('\nNeighborhood Distribution:');
  Object.entries(neighborhoodStats).forEach(([neighborhood, count]) => {
    console.log(`${neighborhood}: ${count} activities`);
  });
  
  console.log('\nUnified Miami Activities Import Complete!');
  console.log('This should now include both entertainment (tight bounds) and adventures (expanded bounds including Keys/Everglades)!');
}

// Run the import
main().catch(console.error);