async function getMiamiRestaurants() {
    console.log('=== GETTING REAL MIAMI BEACH RESTAURANTS ===\n');

    const baseUrl = 'http://www.miamibeachapi.com/rest/a.pi/businesses/search';

    // Test with restaurant category ID 361
    console.log('1. Searching for restaurants (Category ID: 361):');
    try {
        const response = await fetch(`${baseUrl}?category_filter=361&limit=10`);
        const data = await response.json();

        console.log(`Found ${data.businesses?.length || 0} restaurants`);
        console.log(`Total available: ${data.total}`);

        if (data.businesses && data.businesses.length > 0) {
            console.log('\n🍽️  ACTUAL RESTAURANTS:');
            data.businesses.forEach((business, i) => {
                console.log(`${i + 1}. ${business.name}`);
                console.log(`   Address: ${business.street_address || 'No address'}`);
                console.log(`   Phone: ${business.phone || 'No phone'}`);
                console.log(`   Description: ${business.description?.substring(0, 100) || 'No description'}...`);
                console.log('');
            });

            console.log('\n📊 SAMPLE DATA STRUCTURE:');
            console.log(JSON.stringify(data.businesses[0], null, 2));
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

getMiamiRestaurants();
