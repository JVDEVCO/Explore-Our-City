// scripts/import-miami-restaurants.mjs
import dotenv from 'dotenv'
import https from 'https'
import axios from 'axios'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('=== Miami Restaurant Import Script ===')

// Function to insert data directly via HTTP instead of Supabase client
function insertRestaurant(restaurant) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(restaurant)
        const url = new URL(supabaseUrl + '/rest/v1/businesses')

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': 'Bearer ' + supabaseKey,
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Prefer': 'return=minimal'
            }
        }

        const req = https.request(options, (res) => {
            let responseData = ''
            res.on('data', chunk => responseData += chunk)
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, status: res.statusCode })
                } else {
                    resolve({ success: false, status: res.statusCode, error: responseData })
                }
            })
        })

        req.on('error', (err) => {
            reject(err)
        })

        req.write(data)
        req.end()
    })
}

// Get restaurants from Miami Beach API
async function getMiamiRestaurants() {
    try {
        console.log('Fetching from Miami Beach API...')

        const response = await axios.get('http://www.miamibeachapi.com/rest/a.pi/businesses/search', {
            params: { keyword: 'restaurant' },
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RestaurantImporter/1.0)'
            }
        })

        console.log('API Response Status:', response.status)
        const businesses = response.data?.businesses || []
        console.log(`Found ${businesses.length} businesses from API`)

        // Transform API data to our database format
        return businesses.slice(0, 10).map(business => ({
            name: business.name || 'Unknown Restaurant',
            description: business.description || '',
            address: business.address || '',
            phone: business.phone || '',
            cuisine_type: business.category || 'General',
            budget_tier: 'casual',
            is_active: true
        }))

    } catch (error) {
        console.log('API failed, using sample data:', error.message)

        // Fallback to sample restaurants
        return [
            {
                name: "Joe's Stone Crab",
                description: "Iconic Miami Beach seafood restaurant since 1913",
                address: "11 Washington Ave, Miami Beach, FL 33139",
                phone: "(305) 673-0365",
                cuisine_type: "Seafood",
                budget_tier: "premium",
                is_active: true
            },
            {
                name: "Versailles Restaurant",
                description: "The world's most famous Cuban restaurant",
                address: "3555 SW 8th St, Miami, FL 33135",
                phone: "(305) 444-0240",
                cuisine_type: "Cuban",
                budget_tier: "casual",
                is_active: true
            },
            {
                name: "Prime 112",
                description: "Upscale steakhouse in South Beach",
                address: "112 Ocean Dr, Miami Beach, FL 33139",
                phone: "(305) 532-8112",
                cuisine_type: "Steakhouse",
                budget_tier: "luxury",
                is_active: true
            }
        ]
    }
}

// Main execution
async function main() {
    try {
        // Get restaurants
        const restaurants = await getMiamiRestaurants()
        console.log(`\nInserting ${restaurants.length} restaurants...`)

        // Insert each restaurant
        for (const restaurant of restaurants) {
            try {
                const result = await insertRestaurant(restaurant)
                if (result.success) {
                    console.log(`✓ Inserted: ${restaurant.name}`)
                } else {
                    console.log(`✗ Failed: ${restaurant.name} - Status: ${result.status}`)
                    console.log('  Error:', result.error)
                }
            } catch (err) {
                console.log(`✗ Error inserting ${restaurant.name}:`, err.message)
            }
        }

        console.log('\n=== Import Complete ===')
        console.log('Check localhost:3000 to see your restaurants!')

    } catch (error) {
        console.error('Main error:', error.message)
    }
}

main()