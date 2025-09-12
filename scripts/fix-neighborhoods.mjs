// fix-neighborhoods.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Standardized neighborhood names for Miami Beach area (10-12 mile radius from 500 Ocean Dr)
const STANDARD_NEIGHBORHOODS = [
  // Miami Beach (within radius)
  'South Beach',
  'Mid-Beach', 
  'North Beach',
  'Bal Harbour',
  'Bay Harbor Islands',
  'Surfside',
  
  // Miami Proper (within radius)
  'Downtown Miami',
  'Brickell',
  'Wynwood',
  'Little Havana',
  'Little Haiti',
  'Overtown',
  'Edgewater',
  'Midtown Miami',
  'Miami Design District',
  'Arts & Entertainment District',
  
  // South Areas (within radius)
  'Coral Gables',
  'Coconut Grove',
  'Key Biscayne',
  'Virginia Key',
  
  // Other (within radius)
  'Port of Miami'
];

// Neighborhood standardization mappings
const NEIGHBORHOOD_MAPPINGS = {
  // South Beach variations
  'SoBe': 'South Beach',
  'South Beach Miami': 'South Beach', 
  'Miami South Beach': 'South Beach',
  'South Beach, Miami Beach': 'South Beach',
  'SouthBeach': 'South Beach',
  'So Beach': 'South Beach',
  'Miami Beach - South Beach': 'South Beach',
  
  // Mid-Beach variations
  'Mid Beach': 'Mid-Beach',
  'Middle Beach': 'Mid-Beach',
  'Central Miami Beach': 'Mid-Beach',
  'Miami Beach - Mid Beach': 'Mid-Beach',
  
  // North Beach variations
  'North Beach Miami': 'North Beach',
  'North Miami Beach': 'North Miami Beach', // Different area
  'Miami Beach - North Beach': 'North Beach',
  
  // Downtown variations
  'Downtown': 'Downtown Miami',
  'Miami Downtown': 'Downtown Miami',
  'DT Miami': 'Downtown Miami',
  'DTMIA': 'Downtown Miami',
  'City of Miami': 'Downtown Miami',
  
  // Brickell variations
  'Brickell Avenue': 'Brickell',
  'Brickell Key': 'Brickell',
  'Brickell Miami': 'Brickell',
  'Financial District': 'Brickell',
  
  // Wynwood variations
  'Wynwood Arts District': 'Wynwood',
  'Wynwood Walls': 'Wynwood',
  'Wynwood Miami': 'Wynwood',
  
  // Design District variations
  'Design District': 'Miami Design District',
  'Miami Design': 'Miami Design District',
  'MDD': 'Miami Design District',
  
  // Little Havana variations
  'Calle Ocho': 'Little Havana',
  'Little Havana Miami': 'Little Havana',
  'La Pequeña Habana': 'Little Havana',
  
  // Coral Gables variations
  'The Gables': 'Coral Gables',
  'Coral Gables Miami': 'Coral Gables',
  'Miracle Mile': 'Coral Gables',
  
  // Coconut Grove variations
  'The Grove': 'Coconut Grove',
  'CocoWalk': 'Coconut Grove',
  'Coconut Grove Miami': 'Coconut Grove',
  
  // Key Biscayne variations
  'Key Biscayne Miami': 'Key Biscayne',
  'The Key': 'Key Biscayne',
  'Crandon Park': 'Key Biscayne',
  
  // Virginia Key variations
  'Virginia Key Miami': 'Virginia Key',
  'Marine Stadium': 'Virginia Key',
  'Bear Cut': 'Virginia Key',
  
  // Bal Harbour variations
  'Bal Harbor': 'Bal Harbour',
  'Bal Harbour Miami': 'Bal Harbour',
  'Bal Harbour Shops': 'Bal Harbour',
  
  // General Miami variations
  'Miami': 'Downtown Miami', // Default generic Miami to Downtown
  'Miami, FL': 'Downtown Miami',
  'Miami Florida': 'Downtown Miami',
  'MIA': 'Downtown Miami',
  
  // Common misspellings
  'Miama': 'Downtown Miami',
  'Maimi': 'Downtown Miami',
  'Wynwod': 'Wynwood',
  'Brickel': 'Brickell'
};

// Address-based neighborhood detection patterns
const ADDRESS_PATTERNS = {
  'South Beach': [
    /south\s*beach/i, /sobe/i, /ocean\s*dr/i, /collins\s*ave.*13/i, 
    /washington\s*ave.*13/i, /5th\s*st/i, /lincoln\s*rd/i, /espanola\s*way/i
  ],
  'Mid-Beach': [
    /mid\s*beach/i, /collins\s*ave.*4[0-9]/i, /41st/i, /46th/i, /surfside/i
  ],
  'North Beach': [
    /north\s*beach/i, /harding\s*ave/i, /collins\s*ave.*7[0-9]/i, /79th/i
  ],
  'Downtown Miami': [
    /downtown/i, /biscayne\s*blvd/i, /flagler\s*st/i, /1st\s*st.*miami/i,
    /2nd\s*ave.*miami/i, /government\s*center/i
  ],
  'Brickell': [
    /brickell/i, /brickell\s*ave/i, /brickell\s*key/i, /se\s*\d+.*miami/i
  ],
  'Wynwood': [
    /wynwood/i, /nw\s*2nd\s*ave/i, /20th\s*st.*wynwood/i, /23rd\s*st.*wynwood/i
  ],
  'Little Havana': [
    /little\s*havana/i, /calle\s*ocho/i, /sw\s*8th\s*st/i, /8th\s*street/i
  ],
  'Coral Gables': [
    /coral\s*gables/i, /miracle\s*mile/i, /giralda/i, /ponce.*coral/i
  ],
  'Coconut Grove': [
    /coconut\s*grove/i, /main\s*hwy.*grove/i, /grand\s*ave.*grove/i, /cocowalk/i
  ],
  'Key Biscayne': [
    /key\s*biscayne/i, /crandon\s*blvd/i, /harbor\s*dr.*key/i
  ],
  'Virginia Key': [
    /virginia\s*key/i, /marine\s*stadium/i, /bear\s*cut/i, /gramps/i, /rusty\s*pelican/i
  ]
};

function standardizeNeighborhood(neighborhood, address = '', name = '') {
  if (!neighborhood) return null;
  
  // Clean the input
  const cleanNeighborhood = neighborhood.trim();
  
  // Check exact mapping first
  if (NEIGHBORHOOD_MAPPINGS[cleanNeighborhood]) {
    return NEIGHBORHOOD_MAPPINGS[cleanNeighborhood];
  }
  
  // Check case-insensitive mapping
  const mapping = Object.keys(NEIGHBORHOOD_MAPPINGS).find(
    key => key.toLowerCase() === cleanNeighborhood.toLowerCase()
  );
  if (mapping) {
    return NEIGHBORHOOD_MAPPINGS[mapping];
  }
  
  // Check if it's already a standard neighborhood
  const standardMatch = STANDARD_NEIGHBORHOODS.find(
    std => std.toLowerCase() === cleanNeighborhood.toLowerCase()
  );
  if (standardMatch) {
    return standardMatch;
  }
  
  // Try to detect from address patterns
  if (address) {
    const searchText = `${address} ${name}`.toLowerCase();
    for (const [neighborhood, patterns] of Object.entries(ADDRESS_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(searchText))) {
        return neighborhood;
      }
    }
  }
  
  // If no match found, return the original (will be flagged for manual review)
  return cleanNeighborhood;
}

async function cleanNeighborhoods() {
  console.log('🗺️  Starting neighborhood cleanup...\n');
  
  // First, get current neighborhood distribution
  const { data: currentNeighborhoods } = await supabase
    .from('restaurants')
    .select('neighborhood')
    .not('neighborhood', 'is', null);
  
  if (currentNeighborhoods) {
    const neighborhoodCounts = {};
    currentNeighborhoods.forEach(r => {
      const n = r.neighborhood;
      neighborhoodCounts[n] = (neighborhoodCounts[n] || 0) + 1;
    });
    
    console.log('🔍 Current neighborhoods in database:');
    Object.entries(neighborhoodCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([neighborhood, count]) => {
        console.log(`   • "${neighborhood}": ${count} restaurants`);
      });
    console.log('');
  }
  
  // Get all restaurants
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, neighborhood, address, latitude, longitude');
  
  if (error) {
    console.error('Error fetching restaurants:', error);
    return;
  }
  
  console.log(`Found ${restaurants.length} restaurants to process\n`);
  
  let updated = 0;
  let needsReview = 0;
  const changes = {};
  const unrecognized = new Set();
  const finalCounts = {};
  
  // Process in smaller batches with longer delays to avoid timeouts
  const batchSize = 10; // Reduced from 50 to 10
  const totalBatches = Math.ceil(restaurants.length / batchSize);
  
  console.log(`⚡ Processing ${restaurants.length} restaurants in ${totalBatches} batches of ${batchSize}`);
  console.log(`   Estimated time: ${Math.ceil(totalBatches * 2)} seconds\n`);
  
  for (let i = 0; i < restaurants.length; i += batchSize) {
    const batch = restaurants.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    
    console.log(`\n🗺️  Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, restaurants.length)})`);
    console.log('   ' + '─'.repeat(40));
    
    // Process each restaurant in the batch
    for (const restaurant of batch) {
      try {
        const currentNeighborhood = restaurant.neighborhood;
        const standardNeighborhood = standardizeNeighborhood(
          currentNeighborhood, 
          restaurant.address, 
          restaurant.name
        );
        
        // Count final distribution
        if (standardNeighborhood) {
          finalCounts[standardNeighborhood] = (finalCounts[standardNeighborhood] || 0) + 1;
        }
        
        // Check if this is a recognized neighborhood
        if (standardNeighborhood && !STANDARD_NEIGHBORHOODS.includes(standardNeighborhood)) {
          unrecognized.add(standardNeighborhood);
          needsReview++;
          console.log(`   ⚠️  ${restaurant.name} → "${standardNeighborhood}" (needs review)`);
          continue;
        }
        
        if (currentNeighborhood !== standardNeighborhood && standardNeighborhood) {
          // Update neighborhood with retry logic
          const { error: updateError } = await supabase
            .from('restaurants')
            .update({ 
              neighborhood: standardNeighborhood,
              last_updated: new Date().toISOString()
            })
            .eq('id', restaurant.id);
          
          if (updateError) {
            console.log(`   ❌ Error updating ${restaurant.name}: ${updateError.message}`);
          } else {
            console.log(`   🗺️  ${restaurant.name}: "${currentNeighborhood || 'null'}" → "${standardNeighborhood}"`);
            const changeKey = `${currentNeighborhood || 'null'} → ${standardNeighborhood}`;
            changes[changeKey] = (changes[changeKey] || 0) + 1;
            updated++;
          }
        } else if (!currentNeighborhood) {
          console.log(`   ❓ ${restaurant.name}: Missing neighborhood`);
          needsReview++;
        } else {
          console.log(`   ✅ ${restaurant.name}: "${standardNeighborhood}" (no change)`);
        }
        
        // Small delay between individual updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.log(`   ❌ Error processing ${restaurant.name}: ${error.message}`);
      }
    }
    
    // Progress indicator and longer delay between batches
    const progress = ((batchNum / totalBatches) * 100).toFixed(1);
    console.log(`   📊 Progress: ${progress}% (${updated} updated, ${needsReview} need review)`);
    
    // Longer delay between batches to prevent timeouts
    if (batchNum < totalBatches) {
      console.log(`   ⏳ Waiting 2 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🗺️  NEIGHBORHOOD CLEANUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   • Neighborhoods updated: ${updated}`);
  console.log(`   • Need manual review: ${needsReview}`);
  console.log(`   • Total processed: ${restaurants.length}`);
  
  console.log(`\n🏘️  Final Neighborhood Distribution:`);
  Object.entries(finalCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([neighborhood, count]) => {
      const percentage = ((count / restaurants.length) * 100).toFixed(1);
      console.log(`   • ${neighborhood}: ${count} restaurants (${percentage}%)`);
    });
  
  if (Object.keys(changes).length > 0) {
    console.log(`\n🔄 Changes Made:`);
    Object.entries(changes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([change, count]) => {
        console.log(`   • ${change}: ${count} restaurants`);
      });
  }
  
  if (unrecognized.size > 0) {
    console.log(`\n⚠️  Unrecognized Neighborhoods (need manual review):`);
    [...unrecognized].sort().forEach(neighborhood => {
      console.log(`   • "${neighborhood}"`);
    });
  }
  
  console.log(`\n✨ Neighborhoods are now standardized to Miami Beach area (10-12 mile radius) standards`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Review unrecognized neighborhoods and add to mappings if needed`);
  console.log(`   2. Consider using coordinates to auto-assign missing neighborhoods`);
  console.log(`   3. Build Google Places deduplication script`);
  console.log(`   4. Any restaurants outside 10-12 mile radius should be flagged for removal`);
}

// Add utility function to show standard neighborhoods
async function showStandardNeighborhoods() {
  console.log('🏘️  Standard Miami Beach Area Neighborhoods:\n');
  
  const grouped = {
    'Miami Beach': ['South Beach', 'Mid-Beach', 'North Beach', 'Bal Harbour', 'Bay Harbor Islands', 'Surfside'],
    'Miami Proper': ['Downtown Miami', 'Brickell', 'Wynwood', 'Little Havana', 'Little Haiti', 'Overtown', 'Edgewater', 'Midtown Miami', 'Miami Design District', 'Arts & Entertainment District'],
    'South Areas': ['Coral Gables', 'Coconut Grove', 'Key Biscayne', 'Virginia Key'],
    'Other': ['Port of Miami']
  };
  
  Object.entries(grouped).forEach(([group, neighborhoods]) => {
    console.log(`${group}:`);
    neighborhoods.forEach(n => console.log(`   • ${n}`));
    console.log('');
  });
}

// Main execution
if (process.argv.includes('--show-standard')) {
  showStandardNeighborhoods();
} else {
  cleanNeighborhoods().catch(console.error);
}