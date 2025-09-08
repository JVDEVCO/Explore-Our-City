// diagnostic-miami-api.js
async function debugMiamiAPI() {
    const baseUrl = 'https://www.miamiandbeaches.com/api/search';

    console.log('=== TESTING DIFFERENT SEARCH APPROACHES ===\n');

    // Test 1: Current approach
    console.log('1. Current "restaurant" search:');
    try {
        const response1 = await fetch(`${baseUrl}?q=restaurant&limit=5`);
        const data1 = await response1.json();
        console.log(`Found ${data1.results?.length || 0} results`);
        if (data1.results?.length > 0) {
            console.log('Sample result structure:');
            console.log(JSON.stringify(data1.results[0], null, 2));
            console.log('\nAll business types found:');
            data1.results.forEach((item, i) => {
                console.log(`${i + 1}. ${item.name} - Type: ${item.type || item.category || 'unknown'}`);
            });
        }
    } catch (error) {
        console.log('Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Try "dining"
    console.log('2. Testing "dining" search:');
    try {
        const response2 = await fetch(`${baseUrl}?q=dining&limit=5`);
        const data2 = await response2.json();
        console.log(`Found ${data2.results?.length || 0} results`);
        if (data2.results?.length > 0) {
            data2.results.forEach((item, i) => {
                console.log(`${i + 1}. ${item.name} - Type: ${item.type || item.category || 'unknown'}`);
            });
        }
    } catch (error) {
        console.log('Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Try "food"
    console.log('3. Testing "food" search:');
    try {
        const response3 = await fetch(`${baseUrl}?q=food&limit=5`);
        const data3 = await response3.json();
        console.log(`Found ${data3.results?.length || 0} results`);
        if (data3.results?.length > 0) {
            data3.results.forEach((item, i) => {
                console.log(`${i + 1}. ${item.name} - Type: ${item.type || item.category || 'unknown'}`);
            });
        }
    } catch (error) {
        console.log('Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Check if there are category parameters
    console.log('4. Testing category-based search:');
    const categoryTests = ['restaurants', 'dining', 'food-drink', 'eat', 'cuisine'];

    for (const category of categoryTests) {
        try {
            const response = await fetch(`${baseUrl}?category=${category}&limit=3`);
            const data = await response.json();
            console.log(`Category "${category}": ${data.results?.length || 0} results`);
            if (data.results?.length > 0) {
                console.log(`  Sample: ${data.results[0].name}`);
            }
        } catch (error) {
            console.log(`Category "${category}": Error - ${error.message}`);
        }
    }
}

debugMiamiAPI();