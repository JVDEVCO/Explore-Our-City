// scripts/check-timeout-database.mjs
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

async function checkTimeOutEntries() {
    console.log('🔍 Checking Time Out Market entries in database...\n')

    try {
        // Check exact address match
        const { data: exactMatch, error: exactError } = await supabase
            .from('businesses')
            .select('*')
            .ilike('address', '%1601 drexel%')

        if (exactError) throw exactError

        console.log('📍 Entries at 1601 Drexel Avenue:')
        exactMatch.forEach(entry => {
            console.log(`• "${entry.name}" (ID: ${entry.id})`)
            console.log(`  Address: ${entry.address}`)
            console.log(`  Phone: ${entry.phone || 'N/A'}`)
            console.log(`  API ID: ${entry.miami_api_id}`)
            console.log('')
        })

        // Also check for "Time Out" in names
        const { data: nameMatch, error: nameError } = await supabase
            .from('businesses')
            .select('*')
            .ilike('name', '%time out%')

        if (nameError) throw nameError

        console.log('\n🏷️  Entries with "Time Out" in name:')
        nameMatch.forEach(entry => {
            console.log(`• "${entry.name}" (ID: ${entry.id})`)
            console.log(`  Address: ${entry.address}`)
            console.log(`  API ID: ${entry.miami_api_id}`)
            console.log('')
        })

        console.log(`\n📊 Summary:`)
        console.log(`• Exact address matches: ${exactMatch.length}`)
        console.log(`• Name matches: ${nameMatch.length}`)

    } catch (error) {
        console.error('❌ Database check failed:', error.message)
    }
}

checkTimeOutEntries()