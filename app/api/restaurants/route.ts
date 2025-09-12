import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Define neighborhood proximity for "Show Nearby" functionality
const NEARBY_NEIGHBORHOODS: Record<string, string[]> = {
  'South Beach': ['Mid-Beach', 'North Beach', 'Downtown Miami', 'Brickell'],
  'Mid-Beach': ['South Beach', 'North Beach', 'North Bay Village', 'Bay Harbor Islands'],
  'North Beach': ['Mid-Beach', 'South Beach', 'Surfside', 'Bal Harbour'],
  'Downtown Miami': ['Brickell', 'South Beach', 'Edgewater', 'Wynwood'],
  'Brickell': ['Downtown Miami', 'South Beach', 'Key Biscayne', 'Coconut Grove'],
  'Wynwood': ['Downtown Miami', 'Edgewater', 'Little Havana', 'Miami Design District'],
  'Little Havana': ['Wynwood', 'Coral Gables', 'Coconut Grove', 'Downtown Miami'],
  'Coral Gables': ['Little Havana', 'Coconut Grove', 'South Beach', 'Brickell'],
  'Coconut Grove': ['Coral Gables', 'Brickell', 'Key Biscayne', 'Little Havana'],
  'Key Biscayne': ['Brickell', 'Coconut Grove', 'Virginia Key', 'South Beach'],
  'Virginia Key': ['Key Biscayne', 'Downtown Miami', 'Brickell'],
  'Miami Design District': ['Wynwood', 'Edgewater', 'Downtown Miami'],
  'Edgewater': ['Downtown Miami', 'Wynwood', 'Miami Design District'],
  'Bal Harbour': ['North Beach', 'Bay Harbor Islands', 'Surfside'],
  'Bay Harbor Islands': ['Bal Harbour', 'Surfside', 'North Bay Village', 'Mid-Beach'],
  'Surfside': ['North Beach', 'Bal Harbour', 'Bay Harbor Islands'],
  'North Bay Village': ['Mid-Beach', 'Bay Harbor Islands', 'North Beach']
}

// Calculate simple distance between two lat/lng points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Neighborhood center points (approximate)
const NEIGHBORHOOD_CENTERS: Record<string, {lat: number, lng: number}> = {
  'South Beach': {lat: 25.7907, lng: -80.1300},
  'Mid-Beach': {lat: 25.7954, lng: -80.1278},
  'North Beach': {lat: 25.8040, lng: -80.1230},
  'Downtown Miami': {lat: 25.7753, lng: -80.1937},
  'Brickell': {lat: 25.7663, lng: -80.1917},
  'Wynwood': {lat: 25.8010, lng: -80.1977},
  'Little Havana': {lat: 25.7668, lng: -80.2198},
  'Coral Gables': {lat: 25.7210, lng: -80.2683},
  'Coconut Grove': {lat: 25.7282, lng: -80.2368},
  'Key Biscayne': {lat: 25.6919, lng: -80.1624},
  'Virginia Key': {lat: 25.7358, lng: -80.1611},
  'Miami Design District': {lat: 25.8036, lng: -80.1958},
  'Edgewater': {lat: 25.7871, lng: -80.1962},
  'Bal Harbour': {lat: 25.8901, lng: -80.1260},
  'Bay Harbor Islands': {lat: 25.8873, lng: -80.1319},
  'Surfside': {lat: 25.8790, lng: -80.1260},
  'North Bay Village': {lat: 25.8468, lng: -80.1517}
}

// FIXED: Better neighborhood detection from coordinates
function detectActualNeighborhood(lat: number, lng: number): string {
  if (!lat || !lng) return 'Unknown'
  
  let closestNeighborhood = 'Unknown'
  let shortestDistance = Infinity
  
  for (const [neighborhood, center] of Object.entries(NEIGHBORHOOD_CENTERS)) {
    const distance = calculateDistance(lat, lng, center.lat, center.lng)
    if (distance < shortestDistance) {
      shortestDistance = distance
      closestNeighborhood = neighborhood
    }
  }
  
  // Only return detected neighborhood if it's within reasonable range (5 miles)
  return shortestDistance <= 5 ? closestNeighborhood : 'Unknown'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cuisine = searchParams.get('cuisine')
  const neighborhood = searchParams.get('neighborhood') 
  const budget = searchParams.get('budget')
  const city = searchParams.get('city')
  const limit = searchParams.get('limit') || '50'
  const offset = searchParams.get('offset') || '0'
  const searchType = searchParams.get('searchType') // 'primary' or 'nearby'
  const restaurantId = searchParams.get('restaurant_id') // For single restaurant lookup

  console.log('API called with:', { cuisine, neighborhood, budget, city, searchType, limit, offset, restaurantId })

  try {
    // FIXED: Select ALL available fields from database
    let query = supabase
      .from('restaurants')
      .select(`
        id,
        name,
        primary_cuisine,
        budget_category,
        neighborhood,
        address,
        phone,
        yelp_rating,
        yelp_review_count,
        latitude,
        longitude,
        yelp_id,
        created_at,
        last_updated
      `)

    // Handle single restaurant lookup by ID
    if (restaurantId) {
      query = query.eq('id', restaurantId)
      
      const { data, error } = await query.single()

      if (error) {
        console.error('Supabase error for restaurant ID:', error)
        throw error
      }

      if (data) {
        // FIXED: Include ALL data fields and correct neighborhood
        const actualNeighborhood = data.latitude && data.longitude 
          ? detectActualNeighborhood(data.latitude, data.longitude)
          : data.neighborhood

        const transformedRestaurant = {
          id: data.id,
          name: data.name,
          cuisine_type: data.primary_cuisine,
          budget_level: data.budget_category,
          neighborhood: actualNeighborhood,
          address: data.address || 'Address not available', // FIXED: Include address
          phone: data.phone,
          rating: data.yelp_rating,
          review_count: data.yelp_review_count,
          latitude: data.latitude,
          longitude: data.longitude,
          yelp_id: data.yelp_id,
          city: 'Miami Beach',
          image_url: '/api/placeholder/400/300',
          description: `${data.primary_cuisine} restaurant in ${actualNeighborhood}`,
          hours: 'Hours vary - please call for current hours', // FIXED: Include hours field
          website: `https://www.google.com/search?q=${encodeURIComponent(data.name + ' ' + actualNeighborhood)}`
        }

        return Response.json([transformedRestaurant])
      }

      return Response.json([])
    }

    // Apply cuisine filter
    if (cuisine && cuisine !== 'all' && cuisine !== '') {
      query = query.eq('primary_cuisine', cuisine)
    }

    // Handle neighborhood logic based on searchType
    if (neighborhood && neighborhood !== 'all' && neighborhood !== '') {
      if (searchType === 'nearby') {
        // Get restaurants from nearby neighborhoods
        const nearbyAreas = NEARBY_NEIGHBORHOODS[neighborhood] || []
        if (nearbyAreas.length > 0) {
          query = query.in('neighborhood', nearbyAreas)
        } else {
          return Response.json([])
        }
      } else {
        // Default: get restaurants from the specified neighborhood
        query = query.eq('neighborhood', neighborhood)
      }
    }

    // Map frontend budget values to database values
    if (budget && budget !== '') {
      const budgetMap: Record<string, string> = {
        'budget': '$',
        'mid-range': '$$', 
        'upscale': '$$$',
        'luxury': '$$$$',
        'ultra-luxury': '$$$$$'
      }
      
      const dbBudget = budgetMap[budget]
      if (dbBudget) {
        query = query.eq('budget_category', dbBudget)
      }
    }

    // Apply pagination with higher limits
    const limitNum = parseInt(limit)
    const offsetNum = parseInt(offset)
    
    // FIXED: Allow up to 100 results per search to show more restaurants
    const actualLimit = Math.min(limitNum, 100)
    
    // FIXED: Add duplicate filtering by using DISTINCT ON name and neighborhood
    // This helps reduce duplicates at the query level
    const { data, error } = await query
      .order('yelp_rating', { ascending: false, nullsLast: true })
      .order('yelp_review_count', { ascending: false, nullsLast: true })
      .order('name', { ascending: true }) // Secondary sort for consistency
      .range(offsetNum, offsetNum + actualLimit - 1)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log(`Found ${data?.length || 0} restaurants`)

    // FIXED: Client-side duplicate filtering and data transformation
    const seenRestaurants = new Set<string>()
    const transformedData = data?.filter(restaurant => {
      // Create a unique key for duplicate detection
      const uniqueKey = `${restaurant.name.toLowerCase().trim()}-${restaurant.neighborhood}`
      
      if (seenRestaurants.has(uniqueKey)) {
        console.log(`Filtering duplicate: ${restaurant.name} in ${restaurant.neighborhood}`)
        return false
      }
      
      seenRestaurants.add(uniqueKey)
      return true
    }).map(restaurant => {
      // FIXED: Correct neighborhood detection using coordinates
      const actualNeighborhood = restaurant.latitude && restaurant.longitude 
        ? detectActualNeighborhood(restaurant.latitude, restaurant.longitude)
        : restaurant.neighborhood

      const baseData = {
        id: restaurant.id,
        name: restaurant.name,
        cuisine_type: restaurant.primary_cuisine,
        budget_level: restaurant.budget_category,
        neighborhood: actualNeighborhood, // Use corrected neighborhood
        address: restaurant.address || 'Address not available', // FIXED: Include address
        phone: restaurant.phone,
        rating: restaurant.yelp_rating,
        review_count: restaurant.yelp_review_count,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        yelp_id: restaurant.yelp_id,
        city: 'Miami Beach',
        image_url: '/api/placeholder/400/300',
        description: `${restaurant.primary_cuisine} restaurant in ${actualNeighborhood}`,
        hours: 'Hours vary - please call for current hours', // FIXED: Include hours
        website: `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + actualNeighborhood)}`
      }

      // Add distance calculation for nearby searches
      if (searchType === 'nearby' && neighborhood && restaurant.latitude && restaurant.longitude) {
        const targetCenter = NEIGHBORHOOD_CENTERS[neighborhood]
        if (targetCenter) {
          const distance = calculateDistance(
            targetCenter.lat, 
            targetCenter.lng, 
            restaurant.latitude, 
            restaurant.longitude
          )
          return {
            ...baseData,
            distance_miles: Math.round(distance * 10) / 10,
            distance_from_target: neighborhood
          }
        }
      }

      return baseData
    }) || []

    // Sort nearby results by distance if applicable
    if (searchType === 'nearby') {
      transformedData.sort((a, b) => {
        if (a.distance_miles && b.distance_miles) {
          return a.distance_miles - b.distance_miles
        }
        return 0
      })
    }

    console.log(`Returning ${transformedData.length} restaurants after duplicate filtering`)

    return Response.json(transformedData)

  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Failed to fetch restaurants', details: error }, 
      { status: 500 }
    )
  }
}