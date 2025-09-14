// miami-entertainment-import.mjs - FIXED VERSION
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testAPIs() {
  console.log('Testing API connections...\n');
  
  // Test Ticketmaster
  console.log('Testing Ticketmaster API...');
  try {
    const tmResponse = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&city=Miami&size=5`
    );
    
    if (tmResponse.ok) {
      const tmData = await tmResponse.json();
      console.log(`✅ Ticketmaster: Found ${tmData._embedded?.events?.length || 0} events`);
    } else {
      console.log(`❌ Ticketmaster: ${tmResponse.status} ${tmResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Ticketmaster Error: ${error.message}`);
  }
  
  // Test Eventbrite user events (what's actually available)
  console.log('\nTesting Eventbrite API...');
  try {
    const ebResponse = await fetch(
      `https://www.eventbriteapi.com/v3/users/me/events/`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (ebResponse.ok) {
      const ebData = await ebResponse.json();
      console.log(`✅ Eventbrite: Found ${ebData.events?.length || 0} user events`);
    } else {
      console.log(`❌ Eventbrite: ${ebResponse.status} ${ebResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Eventbrite Error: ${error.message}`);
  }
}

async function main() {
  console.log('Miami Entertainment API Test\n');
  
  // Check environment variables
  if (!process.env.EVENTBRITE_API_KEY) {
    console.log('❌ Missing EVENTBRITE_API_KEY');
  } else {
    console.log('✅ Eventbrite API key found');
  }
  
  if (!process.env.TICKETMASTER_API_KEY) {
    console.log('❌ Missing TICKETMASTER_API_KEY');
  } else {
    console.log('✅ Ticketmaster API key found');
  }
  
  console.log('');
  await testAPIs();
}

main().catch(console.error);
