// api-testing-script.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Test both Miami Beach API and Foursquare API capabilities

const MIAMI_BEACH_CENTER = { lat: 25.7617, lng: -80.1918 };

async function testMiamiBeachAPI() {
  console.log('=== Testing Miami Beach API ===\n');
  
  try {
    // Test 1: Get Event Categories
    console.log('1. Fetching event categories...');
    const categoriesResponse = await fetch(
      'http://www.miamibeachapi.com/rest/a.pi/event-categories/list'
    );
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log(`Found ${categoriesData.event_categories?.length || 0} event categories`);
      
      // Show first 5 categories
      if (categoriesData.event_categories) {
        categoriesData.event_categories.slice(0, 5).forEach(cat => {
          console.log(`  - ${cat.name} (ID: ${cat.datatable_category_id})`);
        });
      }
    } else {
      console.log(`❌ Event categories failed: ${categoriesResponse.status}`);
    }
    
    console.log('');
    
    // Test 2: Get Business Categories
    console.log('2. Fetching business categories...');
    const bizCategoriesResponse = await fetch(
      'http://www.miamibeachapi.com/rest/a.pi/business-categories/list'
    );
    
    if (bizCategoriesResponse.ok) {
      const bizCategoriesData = await bizCategoriesResponse.json();
      console.log(`Found ${bizCategoriesData.business_categories?.length || 0} business categories`);
      
      // Show first 5 business categories
      if (bizCategoriesData.business_categories) {
        bizCategoriesData.business_categories.slice(0, 5).forEach(cat => {
          console.log(`  - ${cat.name} (ID: ${cat.datatable_category_id})`);
        });
      }
    } else {
      console.log(`❌ Business categories failed: ${bizCategoriesResponse.status}`);
    }
    
    console.log('');
    
    // Test 3: Search Events by Location
    console.log('3. Searching events by location (Miami Beach area)...');
    const eventsResponse = await fetch(
      `http://www.miamibeachapi.com/rest/a.pi/events/search?lat=${MIAMI_BEACH_CENTER.lat}&lng=${MIAMI_BEACH_CENTER.lng}&radius=10`
    );
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log(`Found ${eventsData.page_items?.length || 0} events`);
      
      // Show first 3 events with details
      if (eventsData.page_items) {
        eventsData.page_items.slice(0, 3).forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.event_name}`);
          console.log(`     Venue: ${event.venue_name || 'N/A'}`);
          console.log(`     Start: ${event.event_start_time ? new Date(event.event_start_time * 1000).toLocaleDateString() : 'N/A'}`);
          console.log(`     Address: ${event.venue_street_address || 'N/A'}`);
        });
      }
    } else {
      console.log(`❌ Events search failed: ${eventsResponse.status}`);
    }
    
    console.log('');
    
    // Test 4: Search Events by Keyword
    console.log('4. Searching events by keyword "music"...');
    const musicEventsResponse = await fetch(
      'http://www.miamibeachapi.com/rest/a.pi/events/search?keyword=music'
    );
    
    if (musicEventsResponse.ok) {
      const musicEventsData = await musicEventsResponse.json();
      console.log(`Found ${musicEventsData.page_items?.length || 0} music events`);
      
      if (musicEventsData.page_items) {
        musicEventsData.page_items.slice(0, 2).forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.event_name}`);
          console.log(`     Description: ${event.event_description?.substring(0, 100) || 'N/A'}...`);
        });
      }
    } else {
      console.log(`❌ Music events search failed: ${musicEventsResponse.status}`);
    }
    
  } catch (error) {
    console.error('Miami Beach API Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

async function testFoursquareAPI() {
  console.log('=== Testing Foursquare API ===\n');
  
  if (!process.env.FOURSQUARE_API_KEY) {
    console.log('❌ Missing FOURSQUARE_API_KEY in .env.local');
    return;
  }
  
  const headers = {
    'Authorization': process.env.FOURSQUARE_API_KEY,
    'Accept': 'application/json'
  };
  
  try {
    // Test 1: Search places near Miami Beach
    console.log('1. Searching places near Miami Beach...');
    const placesResponse = await fetch(
      `https://api.foursquare.com/v3/places/search?ll=${MIAMI_BEACH_CENTER.lat},${MIAMI_BEACH_CENTER.lng}&radius=5000&limit=20`,
      { headers }
    );
    
    if (placesResponse.ok) {
      const placesData = await placesResponse.json();
      console.log(`Found ${placesData.results?.length || 0} places`);
      
      // Show first 5 places with categories
      if (placesData.results) {
        placesData.results.slice(0, 5).forEach((place, index) => {
          const categories = place.categories?.map(cat => cat.name).join(', ') || 'N/A';
          console.log(`  ${index + 1}. ${place.name}`);
          console.log(`     Categories: ${categories}`);
          console.log(`     Address: ${place.location?.formatted_address || 'N/A'}`);
        });
      }
    } else {
      console.log(`❌ Foursquare places search failed: ${placesResponse.status}`);
      const errorText = await placesResponse.text();
      console.log(`   Error: ${errorText.substring(0, 200)}`);
    }
    
    console.log('');
    
    // Test 2: Search for specific categories
    console.log('2. Searching for arts & entertainment venues...');
    const artsResponse = await fetch(
      `https://api.foursquare.com/v3/places/search?ll=${MIAMI_BEACH_CENTER.lat},${MIAMI_BEACH_CENTER.lng}&categories=10000&radius=8000&limit=15`,
      { headers }
    );
    
    if (artsResponse.ok) {
      const artsData = await artsResponse.json();
      console.log(`Found ${artsData.results?.length || 0} arts & entertainment venues`);
      
      if (artsData.results) {
        artsData.results.slice(0, 3).forEach((venue, index) => {
          console.log(`  ${index + 1}. ${venue.name}`);
          console.log(`     Categories: ${venue.categories?.map(cat => cat.name).join(', ') || 'N/A'}`);
          console.log(`     Distance: ${venue.distance}m`);
        });
      }
    } else {
      console.log(`❌ Arts venues search failed: ${artsResponse.status}`);
    }
    
    console.log('');
    
    // Test 3: Search for outdoor recreation
    console.log('3. Searching for outdoor recreation...');
    const outdoorResponse = await fetch(
      `https://api.foursquare.com/v3/places/search?ll=${MIAMI_BEACH_CENTER.lat},${MIAMI_BEACH_CENTER.lng}&categories=16000&radius=15000&limit=10`,
      { headers }
    );
    
    if (outdoorResponse.ok) {
      const outdoorData = await outdoorResponse.json();
      console.log(`Found ${outdoorData.results?.length || 0} outdoor recreation venues`);
      
      if (outdoorData.results) {
        outdoorData.results.slice(0, 3).forEach((venue, index) => {
          console.log(`  ${index + 1}. ${venue.name}`);
          console.log(`     Categories: ${venue.categories?.map(cat => cat.name).join(', ') || 'N/A'}`);
          console.log(`     Neighborhood: ${venue.location?.neighborhood?.[0] || 'N/A'}`);
        });
      }
    } else {
      console.log(`❌ Outdoor recreation search failed: ${outdoorResponse.status}`);
    }
    
    console.log('');
    
    // Test 4: Get place details for first result
    if (placesResponse.ok) {
      const placesData = await placesResponse.json();
      if (placesData.results && placesData.results.length > 0) {
        const firstPlace = placesData.results[0];
        console.log(`4. Getting detailed info for: ${firstPlace.name}...`);
        
        const detailsResponse = await fetch(
          `https://api.foursquare.com/v3/places/${firstPlace.fsq_id}?fields=name,categories,location,website,tel,rating,price,hours,photos`,
          { headers }
        );
        
        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          console.log('   Detailed information:');
          console.log(`     Website: ${details.website || 'N/A'}`);
          console.log(`     Phone: ${details.tel || 'N/A'}`);
          console.log(`     Rating: ${details.rating || 'N/A'}`);
          console.log(`     Price: ${details.price || 'N/A'}`);
          console.log(`     Photos: ${details.photos?.length || 0} available`);
        }
      }
    }
    
  } catch (error) {
    console.error('Foursquare API Error:', error.message);
  }
}

async function generateAPIComparisonReport() {
  console.log('=== API Comparison Summary ===\n');
  
  console.log('Miami Beach API Strengths:');
  console.log('• Official Miami Beach tourism data');
  console.log('• Real-time events with start/end times');
  console.log('• Geographic search with radius filtering');
  console.log('• Category-based filtering for events and businesses');
  console.log('• Perfect for live entertainment updates');
  console.log('• Free to use (no API key required)');
  
  console.log('\nFoursquare API Strengths:');
  console.log('• Comprehensive venue database');
  console.log('• Rich place details (ratings, photos, hours)');
  console.log('• Strong category system for discovery');
  console.log('• User check-in data for popularity insights');
  console.log('• Good for permanent venues and attractions');
  
  console.log('\nRecommended Integration Strategy:');
  console.log('• Miami Beach API: Live events, shows, festivals');
  console.log('• Foursquare API: Permanent venues, attractions, detailed info');
  console.log('• Your current Yelp data: Comprehensive base coverage');
  console.log('• Combined: Creates complete Miami activities ecosystem');
  
  console.log('\nNext Steps:');
  console.log('1. Implement Miami Beach API for real-time event updates');
  console.log('2. Use Foursquare selectively for missing venue details');
  console.log('3. Set up automated daily imports from Miami Beach API');
  console.log('4. Focus on tag enhancement for cross-discovery functionality');
}

async function main() {
  console.log('🧪 Testing Miami Beach API and Foursquare API\n');
  console.log('This will help determine the best additional data sources for your unified Activities database.\n');
  console.log('='.repeat(70) + '\n');
  
  // Test both APIs
  await testMiamiBeachAPI();
  await testFoursquareAPI();
  
  // Generate comparison report
  await generateAPIComparisonReport();
  
  console.log('\n🎯 Testing complete! Review results to determine integration strategy.');
}

// Run the tests
main().catch(console.error);
