// Restaurant Database Export and Cuisine Categorization Script
// Run this with Node.js to export your current restaurant data

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local in the project root
const envPath = path.join(__dirname, '..', '.env.local')
console.log(`🔍 Looking for .env.local at: ${envPath}`)

// Check if .env.local exists
if (fs.existsSync(envPath)) {
    console.log('✅ Found .env.local file')
    config({ path: envPath })
} else {
    console.log('❌ .env.local file not found')
    console.log('Please make sure .env.local exists in your project root')
    process.exit(1)
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔐 Checking environment variables...')
console.log(`Supabase URL found: ${supabaseUrl ? '✅' : '❌'}`)
console.log(`Supabase Key found: ${supabaseKey ? '✅' : '❌'}`)

if (supabaseUrl) {
    console.log(`URL starts with: ${supabaseUrl.substring(0, 20)}...`)
}

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.log('Available env vars:')
    Object.keys(process.env).filter(key => key.includes('SUPABASE')).forEach(key => {
        console.log(`  ${key}=${process.env[key] ? 'SET' : 'NOT SET'}`)
    })
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Your curated cuisine list from the existing system
const CUISINE_TYPES = [
    'American', 'Argentinian', 'BBQ', 'Brazilian', 'British', 'Burgers',
    'Caribbean', 'Chinese', 'Cuban', 'Ethiopian', 'French', 'Fusion',
    'German', 'Greek', 'Indian', 'Italian', 'Japanese', 'Korean',
    'Lebanese', 'Maine Lobster', 'Mediterranean', 'Mexican', 'Peruvian',
    'Pizza', 'Seafood', 'Spanish', 'Steakhouse', 'Sushi', 'Thai',
    'Turkish', 'Vietnamese', 'Vegan', 'Vegetarian', 'Other'
]

async function exportRestaurantsByCuisine() {
    try {
        console.log('🔍 Fetching restaurants from database...')

        // Fetch all restaurants from your database
        const { data: restaurants, error } = await supabase
            .from('businesses') // Your actual table name
            .select('*')
            .order('name')

        if (error) {
            throw error
        }

        console.log(`📊 Found ${restaurants.length} restaurants`)

        // Group restaurants by cuisine
        const restaurantsByCuisine = {}
        const unmappedRestaurants = []

        // Initialize cuisine groups
        CUISINE_TYPES.forEach(cuisine => {
            restaurantsByCuisine[cuisine] = []
        })

        // Categorize restaurants
        restaurants.forEach(restaurant => {
            const cuisine = restaurant.cuisine_type || restaurant.mapped_cuisine || 'Other'

            if (restaurantsByCuisine[cuisine]) {
                restaurantsByCuisine[cuisine].push({
                    name: restaurant.cleaned_name || restaurant.name,
                    original_name: restaurant.original_name || restaurant.name,
                    address: restaurant.address,
                    neighborhood: restaurant.neighborhood,
                    phone: restaurant.phone,
                    cuisine: cuisine,
                    source: 'miamiandbeaches.com'
                })
            } else {
                unmappedRestaurants.push(restaurant)
            }
        })

        // Create comprehensive report
        const report = {
            summary: {
                total_restaurants: restaurants.length,
                cuisines_represented: Object.keys(restaurantsByCuisine).filter(
                    cuisine => restaurantsByCuisine[cuisine].length > 0
                ).length,
                unmapped_count: unmappedRestaurants.length
            },
            by_cuisine: {},
            unmapped: unmappedRestaurants,
            gaps_analysis: []
        }

        // Process each cuisine category
        console.log('\n📋 RESTAURANT BREAKDOWN BY CUISINE:')
        console.log('='.repeat(50))

        CUISINE_TYPES.forEach(cuisine => {
            const count = restaurantsByCuisine[cuisine].length
            if (count > 0) {
                console.log(`${cuisine}: ${count} restaurants`)
                report.by_cuisine[cuisine] = {
                    count: count,
                    restaurants: restaurantsByCuisine[cuisine]
                }
            } else {
                console.log(`${cuisine}: 0 restaurants ⚠️  POTENTIAL GAP`)
                report.gaps_analysis.push(cuisine)
            }
        })

        // Save detailed report
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `restaurant_analysis_${timestamp}.json`

        fs.writeFileSync(filename, JSON.stringify(report, null, 2))
        console.log(`\n💾 Detailed report saved to: ${filename}`)

        // Create CSV for easy review
        const csvData = []
        Object.entries(report.by_cuisine).forEach(([cuisine, data]) => {
            data.restaurants.forEach(restaurant => {
                csvData.push({
                    cuisine,
                    name: restaurant.name,
                    original_name: restaurant.original_name,
                    address: restaurant.address,
                    neighborhood: restaurant.neighborhood,
                    phone: restaurant.phone
                })
            })
        })

        // Convert to CSV
        const csvHeaders = Object.keys(csvData[0] || {}).join(',')
        const csvRows = csvData.map(row => Object.values(row).join(','))
        const csvContent = [csvHeaders, ...csvRows].join('\n')

        const csvFilename = `restaurants_by_cuisine_${timestamp}.csv`
        fs.writeFileSync(csvFilename, csvContent)
        console.log(`📊 CSV export saved to: ${csvFilename}`)

        // Print summary
        console.log('\n🎯 QUICK SUMMARY:')
        console.log('='.repeat(30))
        console.log(`Total Restaurants: ${report.summary.total_restaurants}`)
        console.log(`Cuisines Covered: ${report.summary.cuisines_represented}/${CUISINE_TYPES.length}`)
        console.log(`Potential Gaps: ${report.gaps_analysis.length}`)

        if (report.gaps_analysis.length > 0) {
            console.log('\n🔍 CUISINE GAPS TO FILL:')
            report.gaps_analysis.forEach(gap => console.log(`  - ${gap}`))
        }

        return report

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

// Alternative quick query if you want to run directly in your app
export const getRestaurantsByCuisineQuery = () => `
    SELECT 
        cuisine_type,
        COUNT(*) as restaurant_count,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'name', cleaned_name,
                'address', address,
                'neighborhood', neighborhood
            )
        ) as restaurants
    FROM restaurants 
    GROUP BY cuisine_type 
    ORDER BY restaurant_count DESC;
`

// Run the export
if (import.meta.url === `file://${process.argv[1]}`) {
    exportRestaurantsByCuisine()
}

export { exportRestaurantsByCuisine }