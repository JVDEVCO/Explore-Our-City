// scripts/remove-timeout-entries.mjs
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

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function removeTimeOutEntries() {
    console.log('🗑️  Removing defunct Time Out Market entries...\n')

    try {
        // Find all Time Out Market entries
        const { data: timeoutEntries, error: findError } = await supabase
            .from('businesses')
            .select('*')
            .ilike('address', '%1601 drexel%')

        if (findError) throw findError

        console.log(`📋 Found ${timeoutEntries.length} Time Out Market entries:`)
        timeoutEntries.forEach(entry => {
            console.log(`• "${entry.name}" (ID: ${entry.id})`)
        })

        if (timeoutEntries.length === 0) {
            console.log('✅ No Time Out Market entries found to remove.')
            return
        }

        console.log('\n🗑️  Removing entries (business closed June 30, 2023)...')

        // Delete the entries
        const { error: deleteError } = await supabase
            .from('businesses')
            .delete()
            .ilike('address', '%1601 drexel%')

        if (deleteError) throw deleteError

        console.log(`✅ Successfully removed ${timeoutEntries.length} defunct Time Out Market entries`)
        console.log('📊 Your database is now more current than Google Maps!')

        // Show updated stats
        const { data: remainingRestaurants, error: countError } = await supabase
            .from('businesses')
            .select('id')

        if (countError) throw countError

        console.log(`\n📈 Updated database stats:`)
        console.log(`• Total active restaurants: ${remainingRestaurants.length}`)
        console.log(`• Removed defunct entries: ${timeoutEntries.length}`)
        console.log(`• Ready for DBA cleanup of remaining entries`)

    } catch (error) {
        console.error('❌ Removal failed:', error.message)
    }
}

removeTimeOutEntries()