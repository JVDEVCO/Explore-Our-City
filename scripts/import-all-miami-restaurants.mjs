import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables
const envFile = readFileSync('.env.local', 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) envVars[key] = value
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function importAllMiamiRestaurants() {
    console.log('=== IMPORTING ALL MIAMI BEACH RESTAURANTS ===\n')
    
    const baseUrl = 'https://www.miamibeachapi.com/rest/a.pi/businesses/search'
    let totalImported = 0
    let totalSkipped = 0
    let page = 1
    
    while (true) {
        try {
            console.log(`\nFetching page ${page}...`)
            const response = await fetch(`${baseUrl}?category_filter=361&limit=25&page=${page}`)
            const data = await response.json()
            
            if (!data.businesses || data.businesses.length === 0) {
                console.log('No more restaurants found. Import complete.')
                break
            }
            
            console.log(`Found ${data.businesses.length} businesses on page ${page}`)
            
            for (const business of data.businesses) {
                // Skip grocery stores
                const businessName = business.bus_name?.toLowerCase() || ''
                if (businessName.includes('market') || 
                    businessName.includes('grocery') || 
                    businessName.includes('publix') ||
                    businessName.includes('whole foods') ||
                    businessName.includes('food store')) {
                    console.log(`Skipped grocery store: ${business.bus_name}`)
                    totalSkipped++
                    continue
                }
                
                // Map data same as before
                let priceRange = '$$'
                if (business.datatables?.['restaurant-bars']?.price_range_restaurant) {
                    const apiPrice = business.datatables['restaurant-bars'].price_range_restaurant.toLowerCase()
                    if (apiPrice.includes('inexpensive')) priceRange = '$'
                    else if (apiPrice.includes('moderate')) priceRange = '$$'
                    else if (apiPrice.includes('expensive')) priceRange = '$$$'
                    else if (apiPrice.includes('very expensive')) priceRange = '$$$$'
                }
                
                let businessType = 'restaurant'
                if (business.datatable_category_name?.includes('bar')) businessType = 'bar'
                if (priceRange === '$') businessType = 'cheap_eats'
                
                const phone = business.datatables?.['restaurant-bars']?.telephone || null
                
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
                
                const { error } = await supabase
                    .from('businesses')
                    .insert(restaurantData)
                
                if (error) {
                    if (error.code === '23505') {
                        console.log(`Skipped: ${business.bus_name} (already exists)`)
                        totalSkipped++
                    } else {
                        console.log(`Error inserting ${business.bus_name}:`, error.message)
                    }
                } else {
                    console.log(`✓ Imported: ${business.bus_name} (${priceRange}) - ${businessType}`)
                    totalImported++
                }
                
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            page++
            await new Promise(resolve => setTimeout(resolve, 500)) // Pause between pages
            
        } catch (error) {
            console.log(`Error on page ${page}:`, error.message)
            break
        }
    }
    
    console.log(`\n=== FINAL RESULTS ===`)
    console.log(`Successfully imported: ${totalImported} restaurants`)
    console.log(`Skipped: ${totalSkipped}`)
    console.log(`Total processed: ${totalImported + totalSkipped}`)
}

importAllMiamiRestaurants()
