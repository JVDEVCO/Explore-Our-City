// yelp-entertainment-import.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// API Configuration
const APIS = {
  YELP: 'https://api.yelp.com/v3'
};

const MIAMI_COORDS = { lat: 25.7617, lng: -80.1918 }; // South Beach center

// Miami geographic boundaries (following your proven pattern)
const MIAMI_BOUNDS = {
  north: 25.95,
  south: 25.40,
  east: -80.05,
  west: -80.45
};

// Entertainment Categories (following your CATEGORIES pattern)
const ENTERTAINMENT_CATEGORIES = {
  MUSIC: ['musicvenues', 'jazzandblues', 'piano_bars', 'karaoke'],
  NIGHTLIFE: ['nightlife', 'danceclubs', 'bars', 'cocktailbars', 'sportsbars', 'divebars'],
  THEATER: ['theaters', 'comedyclubs', 'movietheaters'],
  RECREATION: ['poolbilliards', 'bowling', 'arcades', 'adultentertainment'],
  ARTS: ['arts', 'galleries', 'museums', 'performing_arts']
};

function categorizeByTouristIntent(name, description = '', category = '') {
  const text = `${name} ${description} ${category}`.toLowerCase();
  
  // Music & Live Entertainment
  if (ENTERTAINMENT_CATEGORIES.MUSIC.some(keyword => text.includes(keyword))) {
    return 'music';
  }
  
  // Nightlife & Clubs  
  if (ENTERTAINMENT_CATEGORIES.NIGHTLIFE.some(keyword => text.includes(keyword))) {
    return 'nightlife';
  }
  
  // Theater & Comedy
  if (ENTERTAINMENT_CATEGORIES.THEATER.some(keyword => text.includes(keyword))) {
    return 'theater';
  }
  
  // Recreation & Games
  if (ENTERTAINMENT_CATEGORIES.RECREATION.some(keyword => text.includes(keyword))) {
    return 'recreation';
  }
  
  // Arts & Culture
  if (ENTERTAINMENT_CATEGORIES.ARTS.some(keyword => text.includes(keyword))) {
    return 'arts';
  }
  
  return 'entertainment';
}

function determineEntertainmentPrice(name, category, price) {
  const text = `${name} ${category}`.toLowerCase();
  
  // Ultra-premium ($100+)
  if (text.includes('vip') || text.includes('exclusive') || text.includes('rooftop') || 
      text.includes('luxury') || text.includes('miami beach') || text.includes('fontainebleau')) {
    return '$$$$$';
  }
  
  // Premium ($60-100)
  if (text.includes('club') || text.includes('lounge') || text.includes('theater') ||
      text.includes('live music') || text.includes('cocktail') || text.includes('south beach')) {
    return '$$$$';
  }
  
  // Mid-range ($30-60)  
  if (text.includes('bar') || text.includes('comedy') || text.includes('bowling') ||
      text.includes('pool') || text.includes('karaoke') || text.includes('sports bar')) {
    return '$$$';
  }
  
  // Budget ($15-30)
  if (text.includes('dive') || text.includes('local') || text.includes('neighborhood') ||
      text.includes('happy hour') || text.includes('arcade')) {
    return '$$';
  }
  
  // Free/Very cheap (Under $15)
  if (text.includes('free') || text.includes('no cover') || text.includes('gallery') ||
      text.includes('museum') || text.includes('art show')) {
    return '$';
  }
  
  // Use Yelp price level if available
  if (price) {
    const priceMap = { '$': '$', '$$': '$$', '$$$': '$$$', '$$$$': '$$$$' };
    return priceMap[price] || '$$$';
  }
  
  return '$$$'; // Default mid-range
}

function determineNeighborhood(lat, lng) {
  if (!lat || !lng) return 'Miami';
  
  // Following your proven neighborhood mapping pattern
  if (lat >= 25.76 && lat <= 25.80 && lng >= -80.15 && lng <= -80.11) return 'South Beach';
  if (lat >= 25.80 && lat <= 25.85 && lng >= -80.15 && lng <= -80.11) return 'Mid-Beach';
  if (lat >= 25.85 && lat <= 25.90 && lng >= -80.15 && lng <= -80.11) return 'North Beach';
  if (lat >= 25.72 && lat <= 25.78 && lng >= -80.30 && lng <= -80.25) return 'Coral Gables';
  if (lat >= 25.70 && lat <= 25.76 && lng >= -80.25 && lng <= -80.20) return 'Coconut Grove';
  if (lat >= 25.76 && lat <= 25.82 && lng >= -80.20 && lng <= -80.15) return 'Downtown Miami';
  if (lat >= 25.76 && lat <= 25.80 && lng >= -80.20 && lng <= -80.18) return 'Brickell';
  
  return 'Greater Miami';
}

function assignTouristCategory(name, category, price, rating) {
  const text = `${name} ${category}`.toLowerCase();
  
  // Must-see major venues
  const majorVenues = ['fontainebleau', 'liv', 'story', 'e11even', 'nikki beach', 'joe\'s stone crab'];
  if (majorVenues.some(venue => text.includes(venue))) {
    return 'must_see';
  }
  
  // High-rated popular spots
  if (rating >= 4.5 && (price === '$$$$' || price === '$$$$$')) {
    return 'must_see';
  }
  
  // Seasonal/special venues
  if (text.includes('rooftop') || text.includes('beach club') || text.includes('pool party')) {
    return 'seasonal';
  }
  
  // Local favorites - good ratings, reasonable prices
  if (rating >= 4.0 && (price === '$$' || price === '$$$')) {
    return 'local_favorite';
  }
  
  // Hidden gems - great ratings, lower prices or unique venues
  if (rating >= 4.0 && price === '$') {
    return 'hidden_gem';
  }
  
  return 'local_favorite'; // Default
}

async function fetchYelpEntertainment() {
  console.log('Fetching Yelp Entertainment Data...\n');
  
  const headers = {
    'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
    'Accept': 'application/json'
  };
  
  try {
    // Entertainment categories for Miami
    const entertainmentCategories = [
      'musicvenues', 'nightlife', 'danceclubs', 'bars', 'cocktailbars', 
      'sportsbars', 'theaters', 'comedyclubs', 'karaoke', 'poolbilliards', 
      'bowling', 'arcades', 'arts', 'galleries'
    ];
    
    const venues = [];
    
    for (const category of entertainmentCategories) {
      console.log(`Fetching ${category} venues...`);
      
      const response = await fetch(
        `${APIS.YELP}/businesses/search?categories=${category}&location=Miami Beach,FL&radius=25000&limit=50`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        venues.push(...data.businesses.map(business => ({
          ...business,
          entertainment_category: category
        })));
        
        console.log(`Found ${data.businesses.length} ${category} venues`);
        
        // Rate limiting (following your pattern)
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.error(`Error fetching ${category}:`, response.status, response.statusText);
      }
    }
    
    return { venues };
  } catch (error) {
    console.error('Yelp API Error:', error);
    return null;
  }
}

function filterMiamiBounds(venues) {
  return venues.filter(venue => {
    const lat = venue.coordinates?.latitude;
    const lng = venue.coordinates?.longitude;
    
    if (!lat || !lng) return false;
    
    return lat >= MIAMI_BOUNDS.south && lat <= MIAMI_BOUNDS.north &&
           lng >= MIAMI_BOUNDS.west && lng <= MIAMI_BOUNDS.east;
  });
}

async function processAndInsertEntertainment(rawData) {
  console.log('Processing and categorizing entertainment venues...\n');
  
  let allVenues = [];
  
  // Process Yelp venues
  if (rawData.yelp?.venues) {
    allVenues = rawData.yelp.venues;
  }
  
  // Filter to Miami bounds
  const miamiVenues = filterMiamiBounds(allVenues);
  console.log(`Filtered to ${miamiVenues.length} venues within Miami bounds`);
  
  // Remove duplicates by Yelp ID
  const uniqueVenues = [];
  const seenIds = new Set();
  
  miamiVenues.forEach(venue => {
    if (!seenIds.has(venue.id)) {
      seenIds.add(venue.id);
      uniqueVenues.push(venue);
    }
  });
  
  console.log(`Removed duplicates: ${uniqueVenues.length} unique venues`);
  
  const processedVenues = [];
  
  uniqueVenues.forEach(venue => {
    const lat = venue.coordinates?.latitude;
    const lng = venue.coordinates?.longitude;
    
    if (!lat || !lng) return;
    
    const entertainmentType = categorizeByTouristIntent(venue.name, '', venue.entertainment_category);
    const priceRange = determineEntertainmentPrice(venue.name, venue.entertainment_category, venue.price);
    
    processedVenues.push({
      // Core fields
      name: venue.name,
      description: venue.categories?.map(c => c.title).join(', ') || '',
      
      // Unified activities table fields
      primary_category: 'entertainment',
      activity_type: entertainmentType,
      
      // Location
      address: venue.location?.display_address?.join(', ') || '',
      neighborhood: determineNeighborhood(lat, lng),
      city: 'Miami',
      state: 'FL',
      latitude: lat,
      longitude: lng,
      
      // Pricing
      price_tier: getPriceTier(priceRange),
      price_range: priceRange,
      
      // Categories
      tourist_category: assignTouristCategory(venue.name, venue.entertainment_category, priceRange, venue.rating),
      target_audience: 'adults',
      
      // API fields
      api_source: 'yelp',
      external_id: venue.id,
      external_url: venue.url,
      
      // Contact & web
      phone: venue.phone,
      website: venue.url,
      image_url: venue.image_url,
      
      // Status
      status: venue.is_closed ? 'inactive' : 'active',
      
      // Tags for cross-category functionality
      tags: [
        'entertainment',
        entertainmentType,
        venue.entertainment_category,
        'yelp',
        'miami'
      ],
      
      // Yelp-specific fields
      yelp_rating: venue.rating,
      yelp_review_count: venue.review_count,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });
  
  console.log(`Processed ${processedVenues.length} entertainment venues`);
  
  // Insert into unified activities table
  if (processedVenues.length > 0) {
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < processedVenues.length; i += batchSize) {
      const batch = processedVenues.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('activities')  // FIXED: Changed from 'entertainment' to 'activities'
        .upsert(batch, { 
          onConflict: 'external_id',  // FIXED: Only external_id since that's our unique constraint
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
  
  return processedVenues;
}

function getPriceTier(priceRange) {
  const tierMap = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4, '$$$$$': 5 };
  return tierMap[priceRange] || 3;
}

async function main() {
  console.log('Starting Miami Entertainment Import...\n');
  
  // Check API key
  if (!process.env.YELP_API_KEY) {
    console.error('Missing YELP_API_KEY in .env.local');
    return;
  }
  
  // Fetch from Yelp API
  const yelp = await fetchYelpEntertainment();
  
  console.log('\nData Collection Results:');
  console.log('Yelp Entertainment Venues:', yelp?.venues?.length || 0);
  
  // Process and insert (following your pattern)
  const rawData = { yelp };
  const venues = await processAndInsertEntertainment(rawData);
  
  // Show categorization results (following your stats pattern)
  const categoryStats = {};
  venues.forEach(venue => {
    const category = venue.tags.find(tag => 
      ['musicvenues', 'nightlife', 'danceclubs', 'bars', 'cocktailbars', 
       'sportsbars', 'theaters', 'comedyclubs', 'karaoke', 'poolbilliards', 
       'bowling', 'arcades', 'arts', 'galleries'].includes(tag)
    ) || 'other';
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  });
  
  console.log('\nEntertainment Categories:');
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} venues`);
  });
  
  // Tourist category breakdown
  const touristStats = {};
  venues.forEach(venue => {
    touristStats[venue.tourist_category] = (touristStats[venue.tourist_category] || 0) + 1;
  });
  
  console.log('\nTourist Categories:');
  Object.entries(touristStats).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} venues`);
  });
  
  console.log('\nMiami Entertainment Import Complete!');
}

// Run the import (following your pattern)
main().catch(console.error);
