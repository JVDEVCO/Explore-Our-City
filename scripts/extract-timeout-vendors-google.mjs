// scripts/extract-timeout-vendors-google.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { writeFileSync } from 'fs'

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

const GOOGLE_API_KEY = envVars.GOOGLE_PLACES_API_KEY

async function extractTimeOutVendors() {
    console.log('🍽️  Extracting Time Out Market Miami vendors via Google Places API...\n')

    if (!GOOGLE_API_KEY) {
        console.error('❌ Google Places API key not found in .env.local')
        return
    }

    try {
        // Step 1: Find Time Out Market Miami
        console.log('📍 Searching for Time Out Market Miami...')
        const searchQuery = 'Time Out Market Miami'
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`

        if (!timeOutMarket) {
            console.log('\n📋 Search results from all queries:')
            if (searchData && searchData.results) {
                searchData.results.slice(0, 5).forEach((place, index) => {
                    console.log(`${index + 1}. ${place.name}`)
                    console.log(`   Address: ${place.formatted_address}`)
                    console.log(`   Types: ${place.types?.slice(0, 3).join(', ')}`)
                })
            }
            throw new Error('Could not find Time Out Market Miami in any search results')
        }

        console.log(`📍 Found: ${timeOutMarket.name}`)
        console.log(`📍 Address: ${timeOutMarket.formatted_address}`)
        console.log(`📍 Place ID: ${timeOutMarket.place_id}`)

        // Step 2: Get detailed information about Time Out Market
        console.log('\n🔍 Getting detailed place information...')
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${timeOutMarket.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,photos,reviews&key=${GOOGLE_API_KEY}`

        const detailsResponse = await fetch(detailsUrl)
        const detailsData = await detailsResponse.json()

        if (detailsData.status !== 'OK') {
            throw new Error(`Google Places details failed: ${detailsData.status}`)
        }

        const marketDetails = detailsData.result
        console.log(`✅ Market Rating: ${marketDetails.rating} (${marketDetails.user_ratings_total} reviews)`)
        console.log(`✅ Website: ${marketDetails.website || 'N/A'}`)

        // Step 3: Search for individual vendors/restaurants within Time Out Market
        console.log('\n🍴 Searching for individual vendors...')
        const vendorSearchQueries = [
            'restaurant Time Out Market Miami',
            'food vendor Time Out Market Miami',
            'cafe Time Out Market Miami',
            'bar Time Out Market Miami',
            'Bachour Time Out Market Miami',
            'PHO MO Time Out Market Miami',
            'pizza Time Out Market Miami',
            'sandwich Time Out Market Miami',
            'seafood Time Out Market Miami',
            'dessert Time Out Market Miami'
        ]

        const allVendors = new Map() // Use Map to avoid duplicates

        for (const query of vendorSearchQueries) {
            console.log(`🔍 Searching: "${query}"`)
            const vendorUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`

            const vendorResponse = await fetch(vendorUrl)
            const vendorData = await vendorResponse.json()

            if (vendorData.status === 'OK') {
                vendorData.results.forEach(vendor => {
                    // Filter for venues actually at Time Out Market
                    if (vendor.formatted_address &&
                        vendor.formatted_address.toLowerCase().includes('1601 drexel') ||
                        vendor.formatted_address.toLowerCase().includes('time out market')) {

                        allVendors.set(vendor.place_id, {
                            name: vendor.name,
                            place_id: vendor.place_id,
                            address: vendor.formatted_address,
                            rating: vendor.rating || null,
                            price_level: vendor.price_level || null,
                            types: vendor.types || [],
                            business_status: vendor.business_status
                        })
                    }
                })
                console.log(`  → Found ${vendorData.results.length} results`)
            }

            // Add small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        const uniqueVendors = Array.from(allVendors.values())
        console.log(`\n📊 Found ${uniqueVendors.length} unique vendors at Time Out Market`)

        // Step 4: Get current database entries
        const { data: currentEntries, error } = await supabase
            .from('businesses')
            .select('*')
            .ilike('address', '%1601 drexel%')

        if (error) throw error

        console.log(`\n📋 Current database entries: ${currentEntries.length}`)
        currentEntries.forEach(entry => {
            console.log(`• ${entry.name}`)
        })

        // Step 5: Compare and identify missing vendors
        console.log(`\n🔍 Comparing with Google Places data...`)
        const missingVendors = []
        const existingNames = currentEntries.map(e => e.name.toLowerCase())

        uniqueVendors.forEach(vendor => {
            const vendorNameLower = vendor.name.toLowerCase()
            const isAlreadyInDB = existingNames.some(existing =>
                existing.includes(vendorNameLower) ||
                vendorNameLower.includes(existing.replace(/\s*(at|bar|restaurant)\s*time out.*$/i, ''))
            )

            if (!isAlreadyInDB) {
                missingVendors.push(vendor)
            }
        })

        console.log(`\n🎯 Missing vendors (${missingVendors.length}):`)
        missingVendors.forEach((vendor, index) => {
            console.log(`${index + 1}. ${vendor.name}`)
            console.log(`   Rating: ${vendor.rating || 'N/A'} | Types: ${vendor.types.slice(0, 3).join(', ')}`)
        })

        // Step 6: Save results
        const results = {
            extracted_at: new Date().toISOString(),
            market_details: marketDetails,
            total_vendors_found: uniqueVendors.length,
            current_in_database: currentEntries.length,
            missing_vendors: missingVendors,
            all_vendors: uniqueVendors,
            search_queries_used: vendorSearchQueries
        }

        writeFileSync('timeout_vendors_google.json', JSON.stringify(results, null, 2))
        console.log('\n💾 Results saved to timeout_vendors_google.json')

        console.log('\n📈 Summary:')
        console.log(`• Expected vendors: 21+`)
        console.log(`• Found via Google Places: ${uniqueVendors.length}`)
        console.log(`• Currently in database: ${currentEntries.length}`)
        console.log(`• Missing from database: ${missingVendors.length}`)

        if (missingVendors.length > 0) {
            console.log('\n🚀 Next steps:')
            console.log('1. Review timeout_vendors_google.json')
            console.log('2. Verify missing vendors are legitimate')
            console.log('3. Create import script to add missing vendors')
            console.log('4. Apply same process to other food halls/hotels')
        } else {
            console.log('\n✅ Your database appears complete for Time Out Market!')
        }

    } catch (error) {
        console.error('❌ Extraction failed:', error.message)
        console.log('\nTroubleshooting:')
        console.log('1. Verify Google Places API key in .env.local')
        console.log('2. Check API key has Places API enabled')
        console.log('3. Ensure billing is set up (even for free tier)')
    }
}

extractTimeOutVendors()