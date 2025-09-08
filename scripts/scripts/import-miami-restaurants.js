// scripts/import-miami-restaurants.js
const { supabase } = require('../lib/supabase.js')

const MIAMI_BEACH_API_BASE = 'http://www.miamibeachapi.com/rest/a.pi'

// First, let's get the restaurant categories
async function getRestaurantCategories() {
    try {
        const response = await fetch(`${MIAMI_BEACH_API_BASE}/business-categories/list`)
        const data = await response.json()

        // Filter for restaurant/dining categories
        const restaurantCategories = data.business_categories?.filter(cat =>
            cat.name.toLowerCase().includes('restaurant') ||
            cat.name.toLowerCase().includes('dining') ||
            cat.name.toLowerCase().includes('food') ||
            cat.name.toLowerCase().includes('bar') ||
            cat.name.toLowerCase().includes('cafe')
        ) || []

        console.log('Found restaurant categories:', restaurantCategories)
        return restaurantCategories
    } catch (error) {
        console.error('Error fetching categories:', error)
        return []
    }
}

// Fetch restaurants from Miami Beach API
async function fetchMiamiRestaurants(categoryIds = []) {
    try {
        let allRestaurants = []

        // If no specific categories, search with restaurant keyword
        const searchParams = categoryIds.length > 0
            ? `category_filter=${categoryIds.join(',')}`
            : 'keyword=restaurant'

        console.log('Searching with params:', searchParams)

        const response = await fetch(`${MIAMI_BEACH_API_BASE}/businesses/search?${searchParams}`)
        const data = await response.json()

        console.log('API Response:', data)

        if (data.businesses && Array.isArray(data.businesses)) {
            allRestaurants = data.businesses
            console.log(`Found ${allRestaurants.length} restaurants`)
        }

        return allRestaurants
    } catch (error) {
        console.error('Error fetching restaurants:', error)
        return []
    }
}

// Map budget tier based on available data
function mapBudgetTier(restaurant) {
    // Since the API doesn't provide price info, we'll assign random tiers for now
    // In production, you'd use additional data sources or manual categorization
    const tiers = ['quick', 'casual', 'premium', 'luxury', 'ultra']
    const randomTier = tiers[Math.floor(Math.random() * tiers.length)]

    // Try to make some educated guesses based on name
    const name = restaurant.dba_name?.toLowerCase() || ''
    if (name.includes('fine') || name.includes('gourmet') || name.includes('steakhouse')) {
        return 'luxury'
    }
    if (name.includes('cafe') || name.includes('quick') || name.includes('fast')) {
        return 'quick'
    }
    if (name.includes('bistro') || name.includes('grill')) {
        return 'casual'
    }

    return randomTier
}

// Import restaurants into Supabase
async function importRestaurants() {
    console.log('Starting Miami Beach restaurant import...')

    // First, ensure we have a Miami city entry
    let { data: miamiCity, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .eq('name', 'Miami Beach')
        .single()

    if (!miamiCity) {
        console.log('Creating Miami Beach city entry...')
        const { data, error } = await supabase
            .from('cities')
            .insert([{
                name: 'Miami Beach',
                state: 'FL',
                country: 'USA'
            }])
            .select()
            .single()

        if (error) {
            console.error('Error creating city:', error)
            return
        }
        miamiCity = data
    }

    // Get or create restaurant category
    let { data: restaurantCategory, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('category_type', 'dining')
        .single()

    if (!restaurantCategory) {
        console.log('Creating dining category...')
        const { data, error } = await supabase
            .from('categories')
            .insert([{
                name: 'Dining',
                category_type: 'dining'
            }])
            .select()
            .single()

        if (error) {
            console.error('Error creating category:', error)
            return
        }
        restaurantCategory = data
    }

    // Get restaurant categories from Miami Beach API
    const categories = await getRestaurantCategories()
    const categoryIds = categories.map(cat => cat.datatable_category_id)

    // Fetch restaurants
    const restaurants = await fetchMiamiRestaurants(categoryIds)

    if (restaurants.length === 0) {
        console.log('No restaurants found from API')
        return
    }

    console.log(`Processing ${restaurants.length} restaurants...`)

    // Prepare restaurants for insertion
    const restaurantsToInsert = restaurants.map(restaurant => ({
        name: restaurant.name_override || restaurant.dba_name || 'Unknown Restaurant',
        address: restaurant.prem_full_address || '',
        city_id: miamiCity.id,
        category_id: restaurantCategory.id,
        latitude: restaurant.lat ? parseFloat(restaurant.lat) : null,
        longitude: restaurant.lng ? parseFloat(restaurant.lng) : null,
        website: restaurant.website || null,
        budget_tier: mapBudgetTier(restaurant),
        cuisine_type: 'Various', // API doesn't provide this, could be enhanced
        is_active: true,
        external_id: restaurant.datatable_entry_id?.toString() || null,
        facebook_url: restaurant.facebook_id || null,
        twitter_url: restaurant.twitter || null
    })).filter(restaurant => restaurant.name !== 'Unknown Restaurant') // Filter out unnamed entries

    console.log(`Inserting ${restaurantsToInsert.length} valid restaurants...`)

    // Insert in batches to avoid overwhelming the database
    const batchSize = 10
    let inserted = 0
    let errors = 0

    for (let i = 0; i < restaurantsToInsert.length; i += batchSize) {
        const batch = restaurantsToInsert.slice(i, i + batchSize)

        try {
            const { data, error } = await supabase
                .from('businesses')
                .insert(batch)
                .select()

            if (error) {
                console.error(`Batch ${i / batchSize + 1} error:`, error)
                errors += batch.length
            } else {
                inserted += data?.length || 0
                console.log(`Inserted batch ${i / batchSize + 1}: ${data?.length || 0} restaurants`)
            }
        } catch (batchError) {
            console.error(`Batch ${i / batchSize + 1} exception:`, batchError)
            errors += batch.length
        }

        // Add a small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Import complete! Inserted: ${inserted}, Errors: ${errors}`)

    // Display some sample data
    const { data: sampleData } = await supabase
        .from('businesses')
        .select('*')
        .limit(5)

    console.log('Sample imported restaurants:', sampleData)
}

// Run the import
if (require.main === module) {
    importRestaurants()
        .then(() => {
            console.log('Import script finished')
            process.exit(0)
        })
        .catch(error => {
            console.error('Import script failed:', error)
            process.exit(1)
        })
}

module.exports = { importRestaurants, fetchMiamiRestaurants }