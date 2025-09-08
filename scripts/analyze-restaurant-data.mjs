// scripts/analyze-restaurant-data.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'

// Load environment variables
const envFile = readFileSync('.env.local', 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
    }
})

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function analyzeRestaurantData() {
    console.log('📊 Analyzing restaurant data structure...\n')

    try {
        // Get all restaurants with their current classifications
        const { data: restaurants, error } = await supabase
            .from('businesses')
            .select('*')
            .limit(10) // Just sample first 10 for analysis

        if (error) throw error

        console.log(`📋 Sample of restaurant data structure:`)
        console.log('='.repeat(60))

        restaurants.forEach((restaurant, index) => {
            console.log(`\n${index + 1}. ${restaurant.name}`)
            console.log(`   Price Range: ${restaurant.price_range || 'NULL'}`)
            console.log(`   Business Type: ${restaurant.business_type || 'NULL'}`)
            console.log(`   Address: ${restaurant.address || 'NULL'}`)
            console.log(`   Phone: ${restaurant.phone || 'NULL'}`)
            console.log(`   Description: ${restaurant.description ? restaurant.description.slice(0, 100) + '...' : 'NULL'}`)
        })

        // Get overall statistics
        const { data: allRestaurants, error: allError } = await supabase
            .from('businesses')
            .select('price_range, business_type')

        if (allError) throw allError

        // Analyze price_range distribution
        const priceRangeStats = {}
        const businessTypeStats = {}

        allRestaurants.forEach(restaurant => {
            const priceRange = restaurant.price_range || 'NULL'
            const businessType = restaurant.business_type || 'NULL'

            priceRangeStats[priceRange] = (priceRangeStats[priceRange] || 0) + 1
            businessTypeStats[businessType] = (businessTypeStats[businessType] || 0) + 1
        })

        console.log('\n\n📈 PRICE RANGE DISTRIBUTION:')
        console.log('='.repeat(40))
        Object.entries(priceRangeStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([range, count]) => {
                console.log(`${range}: ${count} restaurants`)
            })

        console.log('\n📈 BUSINESS TYPE DISTRIBUTION:')
        console.log('='.repeat(40))
        Object.entries(businessTypeStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`${type}: ${count} restaurants`)
            })

        console.log('\n🎯 RECOMMENDATIONS:')
        console.log('='.repeat(40))

        const nullPriceCount = priceRangeStats['NULL'] || 0
        const nullTypeCount = businessTypeStats['NULL'] || 0

        if (nullPriceCount > 0) {
            console.log(`• ${nullPriceCount} restaurants need price_range classification`)
        }

        if (nullTypeCount > 0) {
            console.log(`• ${nullTypeCount} restaurants need business_type classification`)
        }

        console.log('\nNext steps:')
        console.log('1. Create price classification script (analyze menu pricing)')
        console.log('2. Create business type classification script (analyze restaurant names/descriptions)')
        console.log('3. Update filtering logic to match actual data structure')

        // Save detailed analysis
        const analysis = {
            sampleData: restaurants,
            priceRangeStats,
            businessTypeStats,
            totalRestaurants: allRestaurants.length,
            nullPriceCount,
            nullTypeCount
        }

        writeFileSync('restaurant_data_analysis.json', JSON.stringify(analysis, null, 2))
        console.log('\n💾 Detailed analysis saved to restaurant_data_analysis.json')

    } catch (error) {
        console.error('❌ Analysis failed:', error.message)
    }
}

analyzeRestaurantData()