// miami-activities-import.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function exploreMiamiBeachAPI() {
  try {
    // Try the Miami Beach API endpoints
    const baseUrls = [
      'https://www.miamibeachapi.com/api',
      'https://api.miamibeachapi.com',
      'https://www.miamibeachapi.com/v1',
      'https://www.miamibeachapi.com/api/v1'
    ];
    
    const endpoints = [
      '',
      '/attractions',
      '/activities', 
      '/events',
      '/tours',
      '/things-to-do',
      '/categories',
      '/listings'
    ];
    
    for (const baseUrl of baseUrls) {
      for (const endpoint of endpoints) {
        const fullUrl = `${baseUrl}${endpoint}`;
        console.log(`\nTrying: ${fullUrl}`);
        
        try {
          const response = await fetch(fullUrl);
          if (response.ok) {
            const data = await response.json();
            console.log(`SUCCESS at ${fullUrl}:`);
            console.log(JSON.stringify(data, null, 2));
            return data;
          } else {
            console.log(`Status ${response.status} at ${fullUrl}`);
          }
        } catch (error) {
          console.log(`Error at ${fullUrl}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('API exploration error:', error);
  }
}

// Run the exploration
exploreMiamiBeachAPI();