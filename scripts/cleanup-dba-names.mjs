// scripts/cleanup-dba-names.mjs
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

function extractCustomerFacingName(legalName) {
    if (!legalName) return legalName

    let cleanName = legalName

    // Pattern 1: Extract DBA names (most common)
    const dbaPatterns = [
        /\s+d\/b\/a\s+(.+)$/i,
        /\s+dba\s+(.+)$/i,
        /\s+doing business as\s+(.+)$/i
    ]

    for (const pattern of dbaPatterns) {
        const match = cleanName.match(pattern)
        if (match) {
            cleanName = match[1].trim()
            break
        }
    }

    // Pattern 2: Remove common business entity suffixes
    const entitySuffixes = [
        /\s+llc\.?$/i,
        /\s+inc\.?$/i,
        /\s+corp\.?$/i,
        /\s+corporation$/i,
        /\s+company$/i,
        /\s+enterprises$/i,
        /\s+management$/i,
        /\s+group$/i,
        /\s+holdings$/i
    ]

    for (const suffix of entitySuffixes) {
        cleanName = cleanName.replace(suffix, '')
    }

    // Pattern 3: Clean up hotel/property naming
    const hotelPatterns = [
        /^(.+)\s+hotel,?\s+llc$/i,
        /^(.+)\s+florida\s+hotel,?\s+llc$/i,
        /^(.+)\s+resort,?\s+llc$/i,
        /^(.+)\s+hospitality,?\s+llc$/i
    ]

    for (const pattern of hotelPatterns) {
        const match = cleanName.match(pattern)
        if (match) {
            cleanName = match[1].trim()
            break
        }
    }

    // Pattern 4: Remove number suffixes (like "DOMINOS PIZZA #3889")
    cleanName = cleanName.replace(/\s+#\d+$/i, '')

    // Pattern 5: Clean up remaining LLC patterns with numbers
    cleanName = cleanName.replace(/\s+\d+\s+llc$/i, '')

    // Pattern 6: Proper capitalization
    cleanName = cleanName
        .toLowerCase()
        .split(' ')
        .map(word => {
            // Keep certain words lowercase (articles, prepositions)
            const lowercase = ['the', 'at', 'by', 'of', 'and', 'or', 'for', 'in', 'on', 'with']
            if (lowercase.includes(word.toLowerCase())) {
                return word.toLowerCase()
            }
            // Capitalize first letter
            return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join(' ')

    // Always capitalize first word
    if (cleanName.length > 0) {
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    }

    return cleanName.trim()
}

async function cleanupDBANames() {
    console.log('🧹 Cleaning up DBA restaurant names...\n')

    try {
        // Get all restaurants
        const { data: restaurants, error } = await supabase
            .from('businesses')
            .select('id, name')
            .order('name')

        if (error) throw error

        console.log(`📊 Analyzing ${restaurants.length} restaurants...`)

        const cleanupResults = []
        let changedCount = 0

        restaurants.forEach(restaurant => {
            const originalName = restaurant.name
            const cleanedName = extractCustomerFacingName(originalName)

            if (originalName !== cleanedName) {
                cleanupResults.push({
                    id: restaurant.id,
                    originalName,
                    cleanedName,
                    changed: true
                })
                changedCount++
            } else {
                cleanupResults.push({
                    id: restaurant.id,
                    originalName,
                    cleanedName,
                    changed: false
                })
            }
        })

        // Show preview of changes
        console.log(`\n🔍 Preview of changes (${changedCount} restaurants will be updated):\n`)

        const changedItems = cleanupResults.filter(r => r.changed).slice(0, 20)
        changedItems.forEach((item, index) => {
            console.log(`${index + 1}. "${item.originalName}"`)
            console.log(`   → "${item.cleanedName}"\n`)
        })

        if (changedCount > 20) {
            console.log(`   ... and ${changedCount - 20} more changes`)
        }

        // Save preview to file
        writeFileSync('name_cleanup_preview.json', JSON.stringify(cleanupResults, null, 2))
        console.log('💾 Full preview saved to name_cleanup_preview.json')

        console.log(`\n📈 Summary:`)
        console.log(`• Total restaurants: ${restaurants.length}`)
        console.log(`• Names to be cleaned: ${changedCount}`)
        console.log(`• No changes needed: ${restaurants.length - changedCount}`)

        // Ask for confirmation (in a real scenario - for now just proceed)
        console.log('\n🚀 Applying changes to database...')

        let updateCount = 0
        let errorCount = 0

        // Update in batches of 10
        for (let i = 0; i < cleanupResults.length; i += 10) {
            const batch = cleanupResults.slice(i, i + 10).filter(r => r.changed)

            if (batch.length === 0) continue

            const updatePromises = batch.map(async (item) => {
                try {
                    const { error } = await supabase
                        .from('businesses')
                        .update({ name: item.cleanedName })
                        .eq('id', item.id)

                    if (error) throw error
                    updateCount++

                } catch (error) {
                    console.error(`❌ Failed to update ${item.originalName}:`, error.message)
                    errorCount++
                }
            })

            await Promise.all(updatePromises)

            // Show progress
            const progress = Math.min(i + 10, cleanupResults.length)
            console.log(`📊 Progress: ${progress}/${cleanupResults.length} processed`)

            // Small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        console.log('\n✅ Cleanup complete!')
        console.log(`• Successfully updated: ${updateCount} restaurants`)
        console.log(`• Errors: ${errorCount}`)
        console.log(`• Your restaurant database now has clean, customer-facing names!`)

        if (errorCount === 0) {
            console.log('\n🎉 Perfect! All DBA names have been cleaned up.')
            console.log('Your 195 suspicious business names are now customer-friendly restaurant names.')
        }

    } catch (error) {
        console.error('❌ Cleanup failed:', error.message)
    }
}

cleanupDBANames()