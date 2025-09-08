async function testCorrectAPI() {
    console.log('=== TESTING CORRECT MIAMI BEACH API ===\n');

    // First, let's get all business categories to see what's available
    console.log('1. Getting all business categories:');
    try {
        const response = await fetch('http://www.miamibeachapi.com/rest/a.pi/business-categories/list');
        const data = await response.json();
        console.log(`Found ${data.business_categories?.length || 0} categories`);

        if (data.business_categories) {
            console.log('\nAvailable categories:');
            data.business_categories.forEach(cat => {
                console.log(`  ID: ${cat.datatable_category_id} - ${cat.name} (${cat.title || 'no title'})`);
            });

            // Look for restaurant-related categories
            const restaurantCategories = data.business_categories.filter(cat =>
                cat.name.toLowerCase().includes('restaurant') ||
                cat.name.toLowerCase().includes('dining') ||
                cat.name.toLowerCase().includes('food') ||
                cat.title?.toLowerCase().includes('restaurant') ||
                cat.title?.toLowerCase().includes('dining')
            );

            if (restaurantCategories.length > 0) {
                console.log('\n🍽️  RESTAURANT-RELATED CATEGORIES:');
                restaurantCategories.forEach(cat => {
                    console.log(`  ✓ ID: ${cat.datatable_category_id} - ${cat.name} (${cat.title || 'no title'})`);
                });
            }
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Now test business search (we need to find the business search endpoint)
    console.log('2. Testing business search endpoint:');
    const businessEndpoints = [
        'http://www.miamibeachapi.com/rest/a.pi/businesses/search',
        'http://www.miamibeachapi.com/rest/a.pi/business/search',
        'http://www.miamibeachapi.com/rest/a.pi/businesses/list'
    ];

    for (const endpoint of businessEndpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            const response = await fetch(endpoint);
            console.log(`  Status: ${response.status}`);

            if (response.status === 200) {
                const text = await response.text();
                if (text.startsWith('{') || text.startsWith('[')) {
                    console.log('  ✓ Returns JSON data');
                    const data = JSON.parse(text);
                    console.log(`  Sample keys: ${Object.keys(data).join(', ')}`);
                }
            }
        } catch (error) {
            console.log(`  Error: ${error.message}`);
        }
        console.log('');
    }
}

testCorrectAPI();