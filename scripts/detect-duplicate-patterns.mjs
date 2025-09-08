// scripts/detect-duplicate-patterns.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables
const envFile = readFileSync('.env.local', 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
    }
})

// Debug: Check if env vars are loaded
console.log('Supabase URL found:', !!envVars.NEXT_PUBLIC_SUPABASE_URL)
console.log('Anon key found:', !!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY)

if (!envVars.NEXT_PUBLIC_SUPABASE_URL || !envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.log('Available env vars:', Object.keys(envVars))
    process.exit(1)
}

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function detectDuplicatePatterns() {
    console.log('🔍 Analyzing restaurant database for duplicate patterns...\n')

    try {
        // Get all restaurants
        const { data: restaurants, error } = await supabase
            .from('businesses')
            .select('id, name, address, phone, miami_api_id')
            .order('name')

        if (error) throw error

        console.log(`📊 Analyzing ${restaurants.length} restaurants...\n`)

        // Group 1: Find exact name duplicates
        const nameGroups = {}
        restaurants.forEach(restaurant => {
            const name = restaurant.name?.toLowerCase() || ''
            if (!nameGroups[name]) nameGroups[name] = []
            nameGroups[name].push(restaurant)
        })

        const exactDuplicates = Object.entries(nameGroups)
            .filter(([name, group]) => group.length > 1)
            .sort((a, b) => b[1].length - a[1].length)

        console.log('🚨 EXACT NAME DUPLICATES:')
        console.log('='.repeat(50))
        exactDuplicates.forEach(([name, group]) => {
            console.log(`\n"${name}" (${group.length} entries):`)
            group.forEach(r => {
                console.log(`  • ID: ${r.id} | Address: ${r.address || 'N/A'} | API ID: ${r.miami_api_id}`)
            })
        })

        // Group 2: Find LLC/Hotel/Resort patterns
        const suspiciousPatterns = [
            /llc/i,
            /hotel/i,
            /resort/i,
            /inc\./i,
            /corporation/i,
            /corp\./i,
            /company/i,
            /enterprises/i,
            /management/i
        ]

        const suspiciousNames = restaurants.filter(restaurant => {
            const name = restaurant.name || ''
            return suspiciousPatterns.some(pattern => pattern.test(name))
        })

        console.log('\n\n🏢 SUSPICIOUS BUSINESS ENTITY NAMES:')
        console.log('='.repeat(50))
        suspiciousNames.forEach(restaurant => {
            console.log(`• "${restaurant.name}"`)
            console.log(`  Address: ${restaurant.address || 'N/A'}`)
            console.log(`  API ID: ${restaurant.miami_api_id}`)
            console.log('')
        })

        // Group 3: Find similar names (potential hotel restaurants)
        const similarGroups = {}
        restaurants.forEach(restaurant => {
            const name = restaurant.name || ''
            // Extract base name (remove LLC, numbers, etc.)
            const baseName = name
                .replace(/\s*(llc|inc|corp|hotel|resort|management|enterprises)\.?\s*/gi, '')
                .replace(/\s*#?\d+\s*$/, '') // Remove trailing numbers
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase()

            if (baseName.length > 3) { // Ignore very short names
                if (!similarGroups[baseName]) similarGroups[baseName] = []
                similarGroups[baseName].push(restaurant)
            }
        })

        const potentialHotelRestaurants = Object.entries(similarGroups)
            .filter(([baseName, group]) => group.length > 1)
            .sort((a, b) => b[1].length - a[1].length)

        console.log('\n\n🏨 POTENTIAL HOTEL/PROPERTY RESTAURANT GROUPS:')
        console.log('='.repeat(50))
        potentialHotelRestaurants.forEach(([baseName, group]) => {
            console.log(`\nBase name: "${baseName}" (${group.length} variations):`)
            group.forEach(r => {
                console.log(`  • "${r.name}"`)
                console.log(`    Address: ${r.address || 'N/A'}`)
                console.log(`    API ID: ${r.miami_api_id}`)
            })
        })

        // Group 4: Find restaurants at same address
        const addressGroups = {}
        restaurants.forEach(restaurant => {
            const address = restaurant.address?.toLowerCase()?.trim() || 'no-address'
            if (address !== 'no-address') {
                if (!addressGroups[address]) addressGroups[address] = []
                addressGroups[address].push(restaurant)
            }
        })

        const sameAddressGroups = Object.entries(addressGroups)
            .filter(([address, group]) => group.length > 1)
            .sort((a, b) => b[1].length - a[1].length)

        console.log('\n\n📍 MULTIPLE RESTAURANTS AT SAME ADDRESS:')
        console.log('='.repeat(50))
        sameAddressGroups.forEach(([address, group]) => {
            console.log(`\nAddress: "${address}" (${group.length} restaurants):`)
            group.forEach(r => {
                console.log(`  • "${r.name}" (ID: ${r.id}, API: ${r.miami_api_id})`)
            })
        })

        // Summary statistics
        console.log('\n\n📈 SUMMARY STATISTICS:')
        console.log('='.repeat(50))
        console.log(`Total restaurants: ${restaurants.length}`)
        console.log(`Exact name duplicates: ${exactDuplicates.length} groups`)
        console.log(`Suspicious business names: ${suspiciousNames.length}`)
        console.log(`Potential hotel restaurant groups: ${potentialHotelRestaurants.length}`)
        console.log(`Same address groups: ${sameAddressGroups.length}`)

        // Export problematic IDs for cleanup
        const problematicIds = [
            ...exactDuplicates.flatMap(([name, group]) => group.map(r => r.id)),
            ...suspiciousNames.map(r => r.id),
            ...potentialHotelRestaurants.flatMap(([name, group]) => group.map(r => r.id))
        ]

        console.log(`\n🎯 Total restaurants needing review: ${new Set(problematicIds).size}`)
        console.log('\nNext steps:')
        console.log('1. Review Fontainebleau and other hotel groups')
        console.log('2. Create mapping for proper restaurant names')
        console.log('3. Run cross-reference with Google Places API')
        console.log('4. Update database with correct names')

    } catch (error) {
        console.error('❌ Analysis failed:', error.message)
    }
}

detectDuplicatePatterns()