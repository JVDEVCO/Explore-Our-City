// miami-entertainment-import.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// API Configuration
const APIS = {
  EVENTBRITE: 'https://www.eventbriteapi.com/v3',
  TICKETMASTER: 'https://app.ticketmaster.com/discovery/v2',
  SEATGEEK: 'https://api.seatgeek.com/2'
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
const EVENT_CATEGORIES = {
  CONCERTS: ['concert', 'music', 'band', 'singer', 'festival', 'dj'],
  SPORTS: ['game', 'match', 'sport', 'football', 'basketball', 'baseball', 'soccer'],
  THEATER: ['theater', 'play', 'musical', 'show', 'comedy', 'stand up'],
  NIGHTLIFE: ['night', 'party', 'club', 'bar', 'dance', 'lounge'],
  FESTIVALS: ['festival', 'fair', 'expo', 'convention', 'art basel', 'ultra']
};

function categorizeEventType(name, description = '', category = '') {
  const text = `${name} ${description} ${category}`.toLowerCase();
  
  // Concerts & Music
  if (EVENT_CATEGORIES.CONCERTS.some(keyword => text.includes(keyword))) {
    return 'concert';
  }
  
  // Sports Events
  if (EVENT_CATEGORIES.SPORTS.some(keyword => text.includes(keyword))) {
    return 'sports';
  }
  
  // Theater & Shows
  if (EVENT_CATEGORIES.THEATER.some(keyword => text.includes(keyword))) {
    return 'theater';
  }
  
  // Nightlife & Parties
  if (EVENT_CATEGORIES.NIGHTLIFE.some(keyword => text.includes(keyword))) {
    return 'nightlife';
  }
  
  // Festivals & Events
  if (EVENT_CATEGORIES.FESTIVALS.some(keyword => text.includes(keyword))) {
    return 'festival';
  }
  
  return 'entertainment';
}

function determineEventPrice(name, category, cost) {
  const text = `${name} ${category}`.toLowerCase();
  
  // Ultra-premium ($200+)
  if (text.includes('vip') || text.includes('premium') || text.includes('suite') ||
      text.includes('ultra') || text.includes('art basel') || text.includes('private')) {
    return '$$$$$';
  }
  
  // High-end ($75-200)
  if (text.includes('arena') || text.includes('stadium') || text.includes('major') ||
      text.includes('miami heat') || text.includes('marlins') || text.includes('dolphins')) {
    return '$$$$';
  }
  
  // Mid-range ($25-75)
  if (text.includes('theater') || text.includes('concert') || text.includes('show') ||
      text.includes('comedy') || text.includes('musical')) {
    return '$$$';
  }
  
  // Budget ($5-25)
  if (text.includes('local') || text.includes('community') || text.includes('open mic') ||
      text.includes('happy hour') || text.includes('matinee')) {
    return '$$';
  }
  
  // Free events
  if (text.includes('free') || text.includes('complimentary') || text.includes('no cover')) {
    return '$';
  }
  
  // Default based on cost if provided
  if (cost) {
    const numCost = parseFloat(cost.toString().replace(/[$,]/g, ''));
    if (numCost >= 200) return '$$$$$';
    if (numCost >= 75) return '$$$$';
    if (numCost >= 25) return '$$$';
    if (numCost >= 5) return '$$';
    if (numCost === 0) return '$';
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

function assignTouristCategory(eventType, venueName, price) {
  const venue = venueName?.toLowerCase() || '';
  const type = eventType?.toLowerCase() || '';
  
  // Must-see major events (following your categorization logic)
  const majorVenues = ['american airlines arena', 'marlins park', 'hard rock stadium', 
                      'fillmore miami beach', 'fontainebleau', 'bayfront park'];
  if (majorVenues.some(v => venue.includes(v))) {
    return 'must_see';
  }
  
  // Seasonal/special events
  if (type.includes('festival') || venue.includes('art basel') || venue.includes('ultra')) {
    return 'seasonal';
  }
  
  // Local favorites
  if (venue.includes('local') || venue.includes('community') || price === '$' || price === '$$') {
    return 'local_favorite';
  }
  
  return 'hidden_gem';
}

async function fetchEventbriteEvents() {
  console.log('Fetching Eventbrite Events...\n');
  
  const headers = {
    'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
    'Accept': 'application/json'
  };
  
  try {
    const events = [];
    let page = 1;
    const maxPages = 5;
    
    while (page <= maxPages) {
      const response = await fetch(
        `${APIS.EVENTBRITE}/events/search/?location.address=Miami,FL&location.within=25mi&start_date.range_start=${new Date().toISOString()}&expand=venue,ticket_availability&page=${page}`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        const eventbriteEvents = data.events || [];
        
        eventbriteEvents.forEach(event => {
          const venue = event.venue;
          if (!venue?.latitude || !venue?.longitude) return;
          
          const lat = parseFloat(venue.latitude);
          const lng = parseFloat(venue.longitude);
          
          // Miami bounds check (following your pattern)
          if (lat < MIAMI_BOUNDS.south || lat > MIAMI_BOUNDS.north || 
              lng < MIAMI_BOUNDS.west || lng > MIAMI_BOUNDS.east) {
            return;
          }
          
          // Get ticket pricing
          let minPrice = 0;
          if (event.ticket_availability?.minimum_ticket_price) {
            minPrice = parseFloat(event.ticket_availability.minimum_ticket_price.major_value);
          }
          
          events.push({
            name: event.name?.text || 'Unnamed Event',
            event_type: categorizeEventType(event.name?.text, event.description?.text),
            venue_name: venue.name || 'TBA',
            address: venue.address ? `${venue.address.address_1}, ${venue.address.city}, ${venue.address.region}` : '',
            neighborhood: determineNeighborhood(lat, lng),
            description: event.description?.text || '',
            price_range: determineEventPrice(event.name?.text, event.category_id, minPrice),
            min_price: minPrice,
            latitude: lat,
            longitude: lng,
            event_date: event.start?.local ? event.start.local.split('T')[0] : null,
            event_datetime: event.start?.utc || null,
            tourist_category: assignTouristCategory(event.category_id, venue.name, determineEventPrice(event.name?.text, event.category_id, minPrice)),
            api_source: 'eventbrite',
            external_id: event.id,
            external_url: event.url,
            source: 'Eventbrite'
          });
        });
        
        console.log(`Processed Eventbrite page ${page}, found ${eventbriteEvents.length} events`);
        
        if (!data.pagination?.has_more_items) break;
        page++;
        
        // Rate limiting (following your pattern)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { events };
  } catch (error) {
    console.error('Eventbrite API Error:', error);
    return null;
  }
}

async function fetchTicketmasterEvents() {
  console.log('Fetching Ticketmaster Events...\n');
  
  try {
    const events = [];
    let page = 0;
    const maxPages = 5;
    
    while (page < maxPages) {
      const response = await fetch(
        `${APIS.TICKETMASTER}/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&city=Miami&stateCode=FL&radius=25&unit=miles&page=${page}&size=100&sort=date,asc&startDateTime=${new Date().toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const ticketmasterEvents = data._embedded?.events || [];
        
        ticketmasterEvents.forEach(event => {
          const venue = event._embedded?.venues?.[0];
          if (!venue?.location) return;
          
          const lat = parseFloat(venue.location.latitude);
          const lng = parseFloat(venue.location.longitude);
          
          // Miami bounds check
          if (lat < MIAMI_BOUNDS.south || lat > MIAMI_BOUNDS.north || 
              lng < MIAMI_BOUNDS.west || lng > MIAMI_BOUNDS.east) {
            return;
          }
          
          // Parse pricing
          let minPrice = 0;
          if (event.priceRanges && event.priceRanges.length > 0) {
            minPrice = event.priceRanges[0].min || 0;
          }
          
          events.push({
            name: event.name || 'Unnamed Event',
            event_type: categorizeEventType(event.name, event.info, event.classifications?.[0]?.segment?.name),
            venue_name: venue.name || 'TBA',
            address: `${venue.address?.line1 || ''}, ${venue.city?.name || 'Miami'}, ${venue.state?.stateCode || 'FL'}`,
            neighborhood: determineNeighborhood(lat, lng),
            description: event.info || '',
            price_range: determineEventPrice(event.name, event.classifications?.[0]?.segment?.name, minPrice),
            min_price: minPrice,
            latitude: lat,
            longitude: lng,
            event_date: event.dates?.start?.localDate || null,
            event_datetime: event.dates?.start?.dateTime || null,
            tourist_category: assignTouristCategory(event.classifications?.[0]?.segment?.name, venue.name, determineEventPrice(event.name, event.classifications?.[0]?.segment?.name, minPrice)),
            api_source: 'ticketmaster',
            external_id: event.id,
            external_url: event.url,
            source: 'Ticketmaster'
          });
        });
        
        console.log(`Processed Ticketmaster page ${page}, found ${ticketmasterEvents.length} events`);
        
        if (data.page?.totalPages && page >= data.page.totalPages - 1) break;
        page++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { events };
  } catch (error) {
    console.error('Ticketmaster API Error:', error);
    return null;
  }
}

async function fetchSeatGeekEvents() {
  console.log('Fetching SeatGeek Events...\n');
  
  try {
    const events = [];
    let page = 1;
    const maxPages = 5;
    
    while (page <= maxPages) {
      const response = await fetch(
        `${APIS.SEATGEEK}/events?client_id=${process.env.SEATGEEK_API_KEY}&geoip=${MIAMI_COORDS.lat},${MIAMI_COORDS.lng}&range=25mi&page=${page}&per_page=100&datetime_utc.gte=${new Date().toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const seatgeekEvents = data.events || [];
        
        seatgeekEvents.forEach(event => {
          const venue = event.venue;
          if (!venue?.location) return;
          
          const lat = venue.location.lat;
          const lng = venue.location.lon;
          
          // Miami bounds check
          if (lat < MIAMI_BOUNDS.south || lat > MIAMI_BOUNDS.north || 
              lng < MIAMI_BOUNDS.west || lng > MIAMI_BOUNDS.east) {
            return;
          }
          
          const minPrice = event.stats?.lowest_price || 0;
          
          events.push({
            name: event.title || 'Unnamed Event',
            event_type: categorizeEventType(event.title, event.description, event.type),
            venue_name: venue.name || 'TBA',
            address: `${venue.address || ''}, ${venue.display_location || 'Miami, FL'}`,
            neighborhood: determineNeighborhood(lat, lng),
            description: event.description || '',
            price_range: determineEventPrice(event.title, event.type, minPrice),
            min_price: minPrice,
            latitude: lat,
            longitude: lng,
            event_date: event.datetime_local ? event.datetime_local.split('T')[0] : null,
            event_datetime: event.datetime_utc || null,
            tourist_category: assignTouristCategory(event.type, venue.name, determineEventPrice(event.title, event.type, minPrice)),
            api_source: 'seatgeek',
            external_id: event.id.toString(),
            external_url: event.url,
            source: 'SeatGeek'
          });
        });
        
        console.log(`Processed SeatGeek page ${page}, found ${seatgeekEvents.length} events`);
        
        if (seatgeekEvents.length < 100) break;
        page++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { events };
  } catch (error) {
    console.error('SeatGeek API Error:', error);
    return null;
  }
}

async function processAndInsertEvents(rawData) {
  console.log('Processing and categorizing events...\n');
  
  const processedEvents = [];
  
  // Process Eventbrite events (following your processing pattern)
  if (rawData.eventbrite?.events) {
    rawData.eventbrite.events.forEach(event => {
      processedEvents.push({
        name: event.name,
        description: event.description,
        event_type: event.event_type,
        venue_name: event.venue_name,
        address: event.address,
        city: 'Miami',
        state: 'FL',
        latitude: event.latitude,
        longitude: event.longitude,
        event_date: event.event_date,
        event_datetime: event.event_datetime,
        price_tier: getPriceTier(event.price_range),
        min_price: event.min_price,
        price_range: event.price_range,
        tourist_category: event.tourist_category,
        target_audience: 'all_ages',
        api_source: event.api_source,
        external_id: event.external_id,
        external_url: event.external_url,
        status: 'active'
      });
    });
  }
  
  // Process Ticketmaster events
  if (rawData.ticketmaster?.events) {
    rawData.ticketmaster.events.forEach(event => {
      processedEvents.push({
        name: event.name,
        description: event.description,
        event_type: event.event_type,
        venue_name: event.venue_name,
        address: event.address,
        city: 'Miami',
        state: 'FL',
        latitude: event.latitude,
        longitude: event.longitude,
        event_date: event.event_date,
        event_datetime: event.event_datetime,
        price_tier: getPriceTier(event.price_range),
        min_price: event.min_price,
        price_range: event.price_range,
        tourist_category: event.tourist_category,
        target_audience: 'all_ages',
        api_source: event.api_source,
        external_id: event.external_id,
        external_url: event.external_url,
        status: 'active'
      });
    });
  }
  
  // Process SeatGeek events
  if (rawData.seatgeek?.events) {
    rawData.seatgeek.events.forEach(event => {
      processedEvents.push({
        name: event.name,
        description: event.description,
        event_type: event.event_type,
        venue_name: event.venue_name,
        address: event.address,
        city: 'Miami',
        state: 'FL',
        latitude: event.latitude,
        longitude: event.longitude,
        event_date: event.event_date,
        event_datetime: event.event_datetime,
        price_tier: getPriceTier(event.price_range),
        min_price: event.min_price,
        price_range: event.price_range,
        tourist_category: event.tourist_category,
        target_audience: 'all_ages',
        api_source: event.api_source,
        external_id: event.external_id,
        external_url: event.external_url,
        status: 'active'
      });
    });
  }
  
  console.log(`Processed ${processedEvents.length} events`);
  
  // Insert into database in batches (following your proven pattern)
  const batchSize = 100;
  for (let i = 0; i < processedEvents.length; i += batchSize) {
    const batch = processedEvents.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('entertainment')
      .insert(batch);
    
    if (error) {
      console.error('Database insert error:', error);
    } else {
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}`);
    }
  }
  
  return processedEvents;
}

function getPriceTier(priceRange) {
  const tierMap = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4, '$$$$$': 5 };
  return tierMap[priceRange] || 3;
}

async function main() {
  console.log('Starting Miami Entertainment Import...\n');
  
  // Fetch from APIs (following your proven Promise.all pattern)
  const [eventbrite, ticketmaster, seatgeek] = await Promise.all([
    fetchEventbriteEvents(),
    fetchTicketmasterEvents(),
    fetchSeatGeekEvents()
  ]);
  
  console.log('\nData Collection Results:');
  console.log('Eventbrite Events:', eventbrite?.events?.length || 0);
  console.log('Ticketmaster Events:', ticketmaster?.events?.length || 0);
  console.log('SeatGeek Events: PENDING APPROVAL - will add later');
  
  // Process and insert (following your pattern)
  const rawData = { eventbrite, ticketmaster, seatgeek };
  const events = await processAndInsertEvents(rawData);
  
  // Show categorization results (following your stats pattern)
  const categoryStats = {};
  events.forEach(event => {
    categoryStats[event.event_type] = (categoryStats[event.event_type] || 0) + 1;
  });
  
  console.log('\nEvent Type Categories:');
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} events`);
  });
  
  console.log('\nMiami Entertainment Import Complete!');
}

// Run the import (following your pattern)
main().catch(console.error);