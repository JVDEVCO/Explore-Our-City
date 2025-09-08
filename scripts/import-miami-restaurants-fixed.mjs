import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
const envFile = readFileSync('.env.local', 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
        envVars[key] = value.replace(/[^\w\d\-:\/\.]/g, '') // Clean up any terminal artifacts
    }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function importMiamiRestaurants() {
    console.log('=== IMPORTING MIAMI BEACH RESTAURANTS (FIXED) ===\n')

    const baseUrl = 'https://www.miamibeachapi.com/rest/a.pi/businesses/search' // HTTPS!

    try {
        // Only use category 361 to avoid grocery stores
        const response = await fetch(`${baseUrl}?category_filter=361&limit=341`)
        const data = await response.json()

        console.log(`Found ${data.businesses?.length || 0} businesses`)
        console.log(`Total available: ${data.total}`)

        if (!data.businesses || data.businesses.length === 0) {
            console.log('No restaurants found to import')
            return
        }

        let imported = 0
        let skipped = 0

        for (const business of data.businesses) {
            try {
                // Skip grocery stores and food markets
                const businessName = business.bus_name?.toLowerCase() || ''
                if (businessName.includes('market') ||
                    businessName.includes('grocery') ||
                    businessName.includes('publix') ||
                    businessName.includes('whole foods') ||
                    businessName.includes('food store')) {
                    console.log(`Skipped grocery store: ${business.bus_name}`)
                    skipped++
                    continue
                }

                // Map price range
                let priceRange = '$$' // Default to casual
                if (business.datatables?.['restaurant-bars']?.price_range_restaurant) {
                    const apiPrice = business.datatables['restaurant-bars'].price_range_restaurant.toLowerCase()
                    if (apiPrice.includes('inexpensive')) priceRange = '$'
                    else if (apiPrice.includes('moderate')) priceRange = '$$'
                    else if (apiPrice.includes('expensive')) priceRange = '$$$'
                    else if (apiPrice.includes('very expensive')) priceRange = '$$$$'
                }

                // Determine business type
                let businessType = 'restaurant'
                if (business.datatable_category_name?.includes('bar')) businessType = 'bar'
                if (priceRange === '$') businessType = 'cheap_eats'

                // Get phone from nested data
                const phone = business.datatables?.['restaurant-bars']?.telephone || null

                // Clean description
                let description = business.description || ''
                description = description.replace(/<[^>]*>/g, '').trim()
                if (description.length > 500) {
                    description = description.substring(0, 497) + '...'
                }

                const restaurantData = {
                    name: business.bus_name || business.name,
                    slug: (business.bus_name || business.name).toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    address: business.prem_full_address || null,
                    phone: phone,
                    description: description,
                    latitude: business.lat || null,
                    longitude: business.lng || null,
                    price_range: priceRange,
                    is_active: true,
                    website: business.website || null,
                    business_type: businessType,
                    miami_api_id: business.datatable_entry_id,
                    image_url: business.image_url || null,
                    tax_warning: 'Includes 3% city taxes (2% tourism + 1% social services)',
                    gratuity_included: false,
                    accepts_reservations: true
                }

                // Insert into Supabase
                const { error } = await supabase
                    .from('businesses')
                    .insert(restaurantData)

                if (error) {
                    if (error.code === '23505') {
                        console.log(`Skipped: ${business.bus_name} (already exists)`)
                        skipped++
                    } else {
                        console.log(`Error inserting ${business.bus_name}:`, error.message)
                    }
                } else {
                    console.log(`✓ Imported: ${business.bus_name} (${priceRange}) - ${businessType}`)
                    imported++
                }

                // Small delay
                await new Promise(resolve => setTimeout(resolve, 200))

            } catch (err) {
                console.log(`Error processing ${business.bus_name}:`, err.message)
            }
        }

        console.log(`\n=== IMPORT COMPLETE ===`)
        console.log(`Successfully imported: ${imported} restaurants`)
        console.log(`Skipped: ${skipped}`)
        console.log(`Total processed: ${imported + skipped}`)

    } catch (error) {
        console.log('Import failed:', error.message)
    }
}

importMiamiRestaurants()