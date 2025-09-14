// miami-activities-comprehensive-import.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// API Configuration
const APIS = {
  MIAMI_BEACH: 'http://www.miamibeachapi.com/rest/a.pi',
  YELP: 'https://api.yelp.com/v3',
  FOURSQUARE: 'https://api.foursquare.com/v3',
  NPS: 'https://developer.nps.gov/api/v1'
};

const MIAMI_COORDS = { lat: 25.7617, lng: -80.1918 }; // South Beach center

// Tourist Intent Categories Mapping
const CATEGORIES = {
  WATER: ['boat', 'beach', 'fishing', 'sailing', 'jet ski', 'parasailing', 'diving'],
  INDOOR: ['museum', 'mall', 'bowling', 'theater', 'arcade', 'art gallery'],
  NATURE: ['park', 'garden', 'zoo', 'aquarium', 'botanical', 'wildlife'],
  THRILL: ['helicopter', 'skydiving', 'racing', 'paintball', 'go-kart', 'adventure']
};

function categorizeByTouristIntent(name, description = '', category = '') {
  const text = `${name} ${description} ${category}`.toLowerCase();
  
  // Water Adventures
  if (CATEGORIES.WATER.some(keyword => text.includes(keyword))) {
    return 'Water';
  }
  
  // Indoor Alternatives (Rain-proof)
  if (CATEGORIES.INDOOR.some(keyword => text.includes(keyword))) {
    return 'Indoor';
  }
  
  // Nature & Wildlife
  if (CATEGORIES.NATURE.some(keyword => text.includes(keyword))) {
    return 'Nature';
  }
  
  // Thrill Adventures
  if (CATEGORIES.THRILL.some(keyword => text.includes(keyword))) {
    return 'Thrill';
  }
  
  return 'General';
}

function determineActivityPrice(name, category, cost) {
  const text = `${name} ${category}`.toLowerCase();
  
  // Ultra-luxury ($300+)
  if (text.includes('yacht') || text.includes('private jet') || text.includes('helicopter charter') || 
      text.includes('vip') || text.includes('exclusive') || text.includes('luxury charter')) {
    return '$$$$$';
  }
  
  // Luxury ($120-300)
  if (text.includes('helicopter') || text.includes('private boat') || text.includes('charter') ||
      text.includes('premium tour') || text.includes('wine tasting') || text.includes('spa')) {
    return '$$$$';
  }
  
  // Upscale ($60-120)  
  if (text.includes('boat tour') || text.includes('fishing charter') || text.includes('guided tour') ||
      text.includes('adventure') || text.includes('zipline') || text.includes('parasail')) {
    return '$$$';
  }
  
  // Mid-range ($25-60)
  if (text.includes('museum') || text.includes('aquarium') || text.includes('zoo') || 
      text.includes('mini golf') || text.includes('bowling') || text.includes('theater')) {
    return '$$';
  }
  
  // Budget (Under $25) - Free or very low cost
  if (text.includes('beach') || text.includes('park') || text.includes('free') ||
      text.includes('public') || text.includes('walk') || text.includes('view')) {
    return '$';
  }
  
  // Default based on cost if provided
  if (cost) {
    const numCost = parseFloat(cost.toString().replace(/[$,]/g, ''));
    if (numCost >= 300) return '$$$$$';
    if (numCost >= 120) return '$$$$';
    if (numCost >= 60) return '$$$';
    if (numCost >= 25) return '$$';
  }
  
  return '$$'; // Default mid-range
}

function determineNeighborhood(lat, lng) {
  if (!lat || !lng) return 'Miami';
  
  // Basic neighborhood mapping by coordinates
  if (lat >= 25.76 && lat <= 25.80 && lng >= -80.15 && lng <= -80.11) return 'South Beach';
  if (lat >= 25.80 && lat <= 25.85 && lng >= -80.15 && lng <= -80.11) return 'Mid-Beach';
  if (lat >= 25.85 && lat <= 25.90 && lng >= -80.15 && lng <= -80.11) return 'North Beach';
  if (lat >= 25.72 && lat <= 25.78 && lng >= -80.30 && lng <= -80.25) return 'Coral Gables';
  if (lat >= 25.70 && lat <= 25.76 && lng >= -80.25 && lng <= -80.20) return 'Coconut Grove';
  if (lat >= 25.76 && lat <= 25.82 && lng >= -80.20 && lng <= -80.15) return 'Downtown Miami';
  if (lat >= 25.76 && lat <= 25.80 && lng >= -80.20 && lng <= -80.18) return 'Brickell';
  
  return 'Greater Miami';
}

async function fetchMiamiBeachData() {
  console.log('Fetching Miami Beach API Data...\n');
  
  try {
    // Get event categories
    const categoriesRes = await fetch(`${APIS.MIAMI_BEACH}/event-categories/list`);
    const categories = categoriesRes.ok ? await categoriesRes.json() : null;
    
    // Get business categories  
    const businessRes = await fetch(`${APIS.MIAMI_BEACH}/business-categories/list`);
    const businessCats = businessRes.ok ? await businessRes.json() : null;
    
    // Search events in Miami Beach area
    const eventsRes = await fetch(`${APIS.MIAMI_BEACH}/events/search?lat=${MIAMI_COORDS.lat}&lng=${MIAMI_COORDS.lng}&radius=15`);
    const events = eventsRes.ok ? await eventsRes.json() : null;
    
    return { categories, businessCats, events };
  } catch (error) {
    console.error('Miami Beach API Error:', error);
    return null;
  }
}

async function fetchYelpActivities() {
  console.log('Fetching Yelp Activities Data...\n');
  
  const headers = {
    'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
    'Accept': 'application/json'
  };
  
  try {
    // Activity categories for Miami
    const activityCategories = [
      'tours', 'amusementparks', 'museums', 'active', 'beaches', 'parks',
      'arts', 'paintball', 'mini_golf', 'lasertag', 'boating', 'fishing'
    ];
    
    const activities = [];
    
    for (const category of activityCategories) {
      const response = await fetch(
        `${APIS.YELP}/businesses/search?categories=${category}&location=Miami Beach,FL&radius=20000&limit=50`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        activities.push(...data.businesses.map(business => ({
          ...business,
          activity_category: category
        })));
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { activities };
  } catch (error) {
    console.error('Yelp API Error:', error);
    return null;
  }
}

async function processAndInsertActivities(rawData) {
  console.log('Processing and categorizing activities...\n');
  
  const processedActivities = [];
  
  // Process Miami Beach events
  if (rawData.miamiBeach?.events?.page_items) {
    rawData.miamiBeach.events.page_items.forEach(event => {
      processedActivities.push({
        name: event.name,
        category: categorizeByTouristIntent(event.name, event.description),
        subcategory: 'Event',
        address: `${event.venue_address}, ${event.venue_city}`,
        neighborhood: determineNeighborhood(event.venue_latitude, event.venue_longitude),
        description: event.description,
        price_range: determineActivityPrice(event.name, event.description, event.cost),
        duration_hours: null,
        indoor_outdoor: 'Both',
        weather_dependent: !event.venue_name?.toLowerCase().includes('indoor'),
        booking_required: true,
        source: 'Miami Beach API'
      });
    });
  }
  
  // Process Yelp activities
  if (rawData.yelp?.activities) {
    rawData.yelp.activities.forEach(business => {
      processedActivities.push({
        name: business.name,
        category: categorizeByTouristIntent(business.name, '', business.activity_category),
        subcategory: business.activity_category,
        address: business.location.display_address.join(', '),
        neighborhood: determineNeighborhood(business.coordinates.latitude, business.coordinates.longitude),
        description: business.categories.map(c => c.title).join(', '),
        price_range: business.price || determineActivityPrice(business.name, business.activity_category, null),
        phone: business.phone,
        website: business.url,
        yelp_rating: business.rating,
        yelp_review_count: business.review_count,
        source: 'Yelp'
      });
    });
  }
  
  console.log(`Processed ${processedActivities.length} activities`);
  
  // Insert into database in batches
  const batchSize = 100;
  for (let i = 0; i < processedActivities.length; i += batchSize) {
    const batch = processedActivities.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('activities')
      .insert(batch);
    
    if (error) {
      console.error('Database insert error:', error);
    } else {
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}`);
    }
  }
  
  return processedActivities;
}

async function main() {
  console.log('Starting Miami Activities Import...\n');
  
  // Fetch from APIs
  const [miamiBeach, yelp] = await Promise.all([
    fetchMiamiBeachData(),
    fetchYelpActivities()
  ]);
  
  console.log('\nData Collection Results:');
  console.log('Miami Beach Events:', miamiBeach?.events?.total || 0);
  console.log('Yelp Activities:', yelp?.activities?.length || 0);
  
  // Process and insert
  const rawData = { miamiBeach, yelp };
  const activities = await processAndInsertActivities(rawData);
  
  // Show categorization results
  const categoryStats = {};
  activities.forEach(activity => {
    categoryStats[activity.category] = (categoryStats[activity.category] || 0) + 1;
  });
  
  console.log('\nTourist Intent Categories:');
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} activities`);
  });
  
  console.log('\nMiami Activities Import Complete!');
}

// Run the import
main().catch(console.error);