// scripts/scrape-timeout-miami.mjs
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

async function scrapeTimeOutMiami() {
    console.log('🏢 Scraping Time Out Market Miami vendors...\n')

    try {
        // First, let's fetch the Time Out Market Miami page
        const response = await fetch('https://www.timeoutmarket.com/miami/')
        const html = await response.text()

        console.log('✅ Successfully fetched Time Out Market Miami page')
        console.log(`Page size: ${html.length} characters`)

        // Save HTML for inspection (helpful for debugging)
        writeFileSync('timeout_miami_page.html', html)
        console.log('💾 Saved HTML to timeout_miami_page.html for inspection')

        // Extract vendor information using regex patterns
        // This will need to be adjusted based on the actual HTML structure
        const vendors = []

        // Look for common patterns in food hall websites
        const vendorPatterns = [
            // Pattern 1: Look for vendor names in specific HTML structures
            /<h[2-6][^>]*class="[^"]*vendor[^"]*"[^>]*>([^<]+)<\/h[2-6]>/gi,
            /<div[^>]*class="[^"]*restaurant[^"]*"[^>]*>.*?<h[2-6][^>]*>([^<]+)<\/h[2-6]>/gi,
            /<a[^>]*href="[^"]*\/vendors?\/[^"]*"[^>]*>([^<]+)<\/a>/gi,
            // Pattern 2: Look for JSON-LD data
            /"name"\s*:\s*"([^"]+)"/gi,
            // Pattern 3: Look for list items with vendor info
            /<li[^>]*class="[^"]*vendor[^"]*"[^>]*>.*?<.*?>([^<]+)<\//gi
        ]

        console.log('\n🔍 Searching for vendor patterns...')

        vendorPatterns.forEach((pattern, index) => {
            let match
            while ((match = pattern.exec(html)) !== null) {
                const vendorName = match[1].trim()
                if (vendorName && vendorName.length > 2 && vendorName.length < 100) {
                    vendors.push({
                        name: vendorName,
                        pattern: `Pattern ${index + 1}`,
                        address: '1601 Drexel Avenue, Miami Beach, FL',
                        parent_location: 'Time Out Market Miami'
                    })
                }
            }
        })

        // Remove duplicates
        const uniqueVendors = vendors.filter((vendor, index, self) =>
            index === self.findIndex(v => v.name.toLowerCase() === vendor.name.toLowerCase())
        )

        console.log(`\n📊 Found ${uniqueVendors.length} unique vendors:`)
        uniqueVendors.forEach((vendor, index) => {
            console.log(`${index + 1}. ${vendor.name} (${vendor.pattern})`)
        })

        // If we didn't find many vendors, let's try a different approach
        if (uniqueVendors.length < 10) {
            console.log('\n⚠️  Limited vendors found via HTML parsing.')
            console.log('Trying alternative approach: searching for common food terms...')

            // Look for food-related terms that might indicate vendors
            const foodTerms = ['pizza', 'burger', 'taco', 'sushi', 'coffee', 'ice cream', 'chicken', 'seafood', 'pasta', 'salad', 'sandwich', 'bakery', 'bar', 'grill']
            const textBlocks = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || []
            const headings = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || []

            const allBlocks = [...textBlocks, ...headings]
            allBlocks.forEach(block => {
                foodTerms.forEach(term => {
                    if (block.toLowerCase().includes(term)) {
                        const text = block.replace(/<[^>]*>/g, '').trim()
                        if (text.length > 5 && text.length < 80) {
                            vendors.push({
                                name: text,
                                pattern: 'Food term search',
                                address: '1601 Drexel Avenue, Miami Beach, FL',
                                parent_location: 'Time Out Market Miami'
                            })
                        }
                    }
                })
            })
        }

        // Save results to JSON for review
        const finalResults = {
            scraped_at: new Date().toISOString(),
            source_url: 'https://www.timeoutmarket.com/miami/',
            total_vendors_found: uniqueVendors.length,
            vendors: uniqueVendors,
            current_database_entries: 5,
            expected_vendors: 21
        }

        writeFileSync('timeout_miami_vendors.json', JSON.stringify(finalResults, null, 2))
        console.log('\n💾 Saved results to timeout_miami_vendors.json')

        // Compare with current database entries
        const { data: currentEntries, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('address', '1601 drexel avenue')

        if (error) throw error

        console.log('\n📋 Current database entries at Time Out Market:')
        currentEntries.forEach(entry => {
            console.log(`• ${entry.name}`)
        })

        console.log('\n📈 Summary:')
        console.log(`• Expected vendors: 21+`)
        console.log(`• Current in database: ${currentEntries.length}`)
        console.log(`• Found via scraping: ${uniqueVendors.length}`)
        console.log(`• Gap to fill: ${21 - currentEntries.length}`)

        if (uniqueVendors.length > 10) {
            console.log('\n✅ Scraping successful! Ready to update database.')
            console.log('Next step: Review timeout_miami_vendors.json and create update script.')
        } else {
            console.log('\n⚠️  Limited scraping results. Consider:')
            console.log('1. Manual inspection of timeout_miami_page.html')
            console.log('2. Using Google Places API as backup')
            console.log('3. Checking Time Out Market\'s vendor directory page')
        }

    } catch (error) {
        console.error('❌ Scraping failed:', error.message)
        console.log('\nTrying fallback approach with Google Places API...')

        // Fallback: Search Google Places for "Time Out Market Miami"
        // Note: This would require Google Places API key
        console.log('Fallback approach would require Google Places API integration')
    }
}

scrapeTimeOutMiami()