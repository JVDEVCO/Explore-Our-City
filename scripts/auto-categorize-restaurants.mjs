// Auto-categorize restaurants using Google Places API
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local')
config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Cuisine mapping from Google Places types to your categories
const GOOGLE_TO_CUISINE_MAP = {
    'american_restaurant': 'American',
    'italian_restaurant': 'Italian',
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'mexican_restaurant': 'Mexican',
    'indian_restaurant': 'Indian',
    'french_restaurant': 'French',
    'thai_restaurant': 'Thai',
    'korean_restaurant': 'Korean',
    'greek_restaurant': 'Greek',
    'spanish_restaurant': 'Spanish',
    'turkish_restaurant': 'Turkish',
    'vietnamese_restaurant': 'Vietnamese',
    'lebanese_restaurant': 'Lebanese',
    'brazilian_restaurant': 'Brazilian',
    'argentinian_restaurant': 'Argentinian',
    'ethiopian_restaurant': 'Ethiopian',
    'german_restaurant': 'German',
    'british_restaurant': 'British',
    'pizza_restaurant': 'Pizza',
    'seafood_restaurant': 'Seafood',
    'steakhouse': 'Steakhouse',
    'barbecue_restaurant': 'BBQ',
    'hamburger_restaurant': 'Burgers',
    'sushi_restaurant': 'Sushi',
    'vegetarian_restaurant': 'Vegetarian',
    'vegan_restaurant': 'Vegan'
}

// Keywords for name-based categorization
const NAME_KEYWORDS = {
    'Pizza': ['pizza', 'pizzeria', 'pizzaiolo'],
    'Italian': ['italian', 'trattoria', 'osteria', 'ristorante'],
    'Chinese': ['chinese', 'dim sum', 'szechuan', 'hunan'],
    'Japanese': ['japanese', 'sushi', 'ramen', 'izakaya', 'hibachi'],
    'Mexican': ['mexican', 'taco', 'burrito', 'cantina', 'taqueria'],
    'Indian': ['indian', 'curry', 'tandoor', 'biryani'],
    'French': ['french', 'bistro', 'brasserie', 'café'],
    'Thai': ['thai', 'pad thai', 'tom yum'],
    'Greek': ['greek', 'gyro', 'souvlaki', 'taverna'],
    'Cuban': ['cuban', 'havana', 'cubano'],
    'Seafood': ['seafood', 'fish', 'oyster', 'crab', 'lobster', 'shrimp'],
    'Steakhouse': ['stk', 'steak', 'steakhouse', 'chophouse', 'grill'],
    'BBQ': ['bbq', 'barbecue', 'smokehouse', 'ribs'],
    'Burgers': ['burger', 'burgers'],
    'American': ['tavern', 'diner', 'grill', 'american']
}

// Special seafood keywords for steakhouse dual-categorization
const SEAFOOD_INDICATORS = ['seafood', 'fish', 'oyster', 'crab', 'lobster', 'shrimp', 'salmon', 'tuna', 'bass', 'snapper']

async function searchGooglePlaces(restaurant) {
    const query = `${restaurant.name} ${restaurant.address || ''} Miami`
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`

    try {
        const response = await fetch(url)
        const data = await response.json()

        if (data.results && data.results.length > 0) {
            return data.results[0] // Return the first (best) match
        }
        return null
    } catch (error) {
        console.error(`Error searching for ${restaurant.name}:`, error.message)
        return null
    }
}

function mapGoogleTypesToCuisine(googleTypes, restaurantName) {
    const cuisines = new Set()

    // Check Google Places types first
    for (const type of googleTypes) {
        if (GOOGLE_TO_CUISINE_MAP[type]) {
            cuisines.add(GOOGLE_TO_CUISINE_MAP[type])
        }
    }

    // Name-based analysis as fallback
    const lowerName = restaurantName.toLowerCase()
    console.log(`   Analyzing name: "${lowerName}"`)

    for (const [cuisine, keywords] of Object.entries(NAME_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerName.includes(keyword)) {
                console.log(`   Found keyword "${keyword}" → ${cuisine}`)
                cuisines.add(cuisine)
                break
            }
        }
    }

    // Special logic: If it's a steakhouse and has seafood indicators, add both
    if (cuisines.has('Steakhouse')) {
        for (const indicator of SEAFOOD_INDICATORS) {
            if (lowerName.includes(indicator)) {
                console.log(`   Adding Seafood to Steakhouse`)
                cuisines.add('Seafood')
                break
            }
        }
    }

    // Convert to array and return primary cuisine (or dual for steakhouse+seafood)
    const cuisineArray = Array.from(cuisines)
    console.log(`   Final cuisines found: ${cuisineArray.join(', ') || 'none'}`)

    if (cuisineArray.length === 0) {
        return ['Other']
    }

    // Return both cuisines only for steakhouse+seafood combination
    if (cuisineArray.includes('Steakhouse') && cuisineArray.includes('Seafood')) {
        return ['Steakhouse', 'Seafood']
    }

    // For all others, return primary cuisine
    return [cuisineArray[0]]
}

async function categorizeRestaurants() {
    try {
        console.log('🔍 Fetching restaurants from database...')

        const { data: restaurants, error } = await supabase
            .from('businesses')
            .select('*')
            .limit(10) // Start with 10 for testing

        if (error) throw error

        console.log(`📊 Processing ${restaurants.length} restaurants`)
        console.log(`🔑 Google API Key found: ${googleApiKey ? '✅' : '❌'}`)

        const results = {
            processed: 0,
            updated: 0,
            errors: 0,
            mappings: {}
        }

        for (const restaurant of restaurants) {
            try {
                console.log(`\n🔍 Processing: ${restaurant.name}`)

                // Search Google Places
                const googleData = await searchGooglePlaces(restaurant)

                let cuisines = ['Other']
                let googleTypes = []

                if (googleData) {
                    googleTypes = googleData.types || []
                    console.log(`   Google types: ${googleTypes.join(', ')}`)
                    cuisines = mapGoogleTypesToCuisine(googleTypes, restaurant.name)
                } else {
                    console.log('   No Google data found, using name analysis')
                    cuisines = mapGoogleTypesToCuisine([], restaurant.name)
                }

                console.log(`   Mapped to: ${cuisines.join(' + ')}`)

                // Update database with primary cuisine
                const primaryCuisine = cuisines[0]
                const secondaryCuisine = cuisines[1] || null

                const { error: updateError } = await supabase
                    .from('businesses')
                    .update({
                        cuisine_type: primaryCuisine,
                        secondary_cuisine: secondaryCuisine,
                        google_types: googleTypes,
                        last_categorized: new Date().toISOString()
                    })
                    .eq('id', restaurant.id)

                if (updateError) {
                    console.log(`   ❌ Update failed: ${updateError.message}`)
                    results.errors++
                } else {
                    console.log(`   ✅ Updated in database`)
                    results.updated++

                    // Track mappings for summary
                    for (const cuisine of cuisines) {
                        results.mappings[cuisine] = (results.mappings[cuisine] || 0) + 1
                    }
                }

                results.processed++

                // Rate limiting - wait 100ms between requests
                await new Promise(resolve => setTimeout(resolve, 100))

            } catch (err) {
                console.log(`   ❌ Error processing ${restaurant.name}: ${err.message}`)
                results.errors++
            }
        }

        // Summary
        console.log('\n🎯 CATEGORIZATION SUMMARY:')
        console.log('='.repeat(40))
        console.log(`Restaurants processed: ${results.processed}`)
        console.log(`Successfully updated: ${results.updated}`)
        console.log(`Errors: ${results.errors}`)

        console.log('\n📊 CUISINE DISTRIBUTION:')
        Object.entries(results.mappings)
            .sort(([, a], [, b]) => b - a)
            .forEach(([cuisine, count]) => {
                console.log(`${cuisine}: ${count} restaurants`)
            })

        // Save detailed results
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `categorization_results_${timestamp}.json`
        fs.writeFileSync(filename, JSON.stringify(results, null, 2))
        console.log(`\n💾 Detailed results saved to: ${filename}`)

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

// Add columns to database if they don't exist
async function addColumnsToDatabase() {
    console.log('🔧 Adding cuisine columns to database...')

    const alterQueries = [
        'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cuisine_type TEXT',
        'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS secondary_cuisine TEXT',
        'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_types JSONB',
        'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_categorized TIMESTAMP'
    ]

    for (const query of alterQueries) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: query })
            if (error) console.log(`Warning: ${error.message}`)
        } catch (err) {
            console.log(`Note: Column may already exist`)
        }
    }
}

// Run the categorization
console.log('🚀 Starting restaurant categorization...')
await addColumnsToDatabase()
await categorizeRestaurants()