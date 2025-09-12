// app/restaurant/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

export default function RestaurantDetail() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const restaurantId = params.id
  
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showWebsite, setShowWebsite] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [websiteError, setWebsiteError] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Get the back navigation URL from search params or construct it
  const getBackUrl = () => {
    // Check if we have search parameters that indicate where we came from
    const city = searchParams.get('city')
    const area = searchParams.get('area') 
    const neighborhood = searchParams.get('neighborhood')
    const category = searchParams.get('category')
    const budget = searchParams.get('budget')
    const cuisine = searchParams.get('cuisine')

    // If we have search parameters, construct the main page URL with filters
    if (city && category && budget && cuisine) {
      return `/?city=${city}&area=${area || 'explore-all'}&neighborhood=${neighborhood || ''}&category=${category}&budget=${budget}&cuisine=${cuisine}&showResults=true`
    }
    
    // Fallback: return to main page
    return '/'
  }

  const handleBackNavigation = () => {
    const backUrl = getBackUrl()
    
    if (backUrl !== '/') {
      // Navigate to the specific filtered results
      router.push(backUrl)
    } else {
      // Fallback: try browser back navigation
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back()
      } else {
        // Last resort: go to main page
        router.push('/')
      }
    }
  }

  useEffect(() => {
    fetchRestaurantDetails()
  }, [restaurantId])

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true)
      
      // Mock restaurant data - replace with your Supabase call
      const mockRestaurants = {
        '1': {
          id: '1',
          name: "GoGo Fresh SOBE",
          cuisine: "American",
          price_level: "$",
          neighborhood: "South Beach", 
          rating: 4.5,
          review_count: 666,
          phone: "+13056733137",
          address: "926 Alton Rd Miami Beach FL",
          website: "https://www.gogofreshsobe.com",
          hours: "Hours vary - please call for current hours",
          description: "Fresh, healthy American cuisine in the heart of South Beach. Known for our organic ingredients and creative menu that caters to health-conscious diners.",
          yelp_id: "ZS7UaARDcvqu9TUqJjmuQ",
          images: [
            "/api/placeholder/400/300",
            "/api/placeholder/400/300", 
            "/api/placeholder/400/300"
          ],
          specialties: ["Organic Salads", "Fresh Smoothies", "Healthy Wraps", "Protein Bowls"],
          amenities: ["Outdoor Seating", "Takeout", "Delivery", "Vegan Options", "Gluten-Free"],
          parking: "Street parking available",
          dress_code: "Casual",
          reservation_policy: "Walk-ins welcome, reservations recommended",
          payment_methods: ["Cash", "Credit Cards", "Apple Pay", "Google Pay"]
        },
        '2': {
          id: '2',
          name: "Ocean Drive Bistro",
          cuisine: "Mediterranean",
          price_level: "$",
          neighborhood: "South Beach",
          rating: 4.3,
          review_count: 423,
          phone: "+13055551234",
          address: "1234 Ocean Drive Miami Beach FL",
          website: "https://www.oceandrivebistromiami.com",
          hours: "Daily 11:00 AM - 11:00 PM",
          description: "Authentic Mediterranean flavors with a Miami twist. Featuring fresh seafood, traditional dishes, and an extensive wine selection.",
          specialties: ["Fresh Seafood", "Hummus Platters", "Grilled Lamb", "Baklava"],
          amenities: ["Ocean View", "Full Bar", "Wine List", "Private Dining"],
          parking: "Valet available",
          dress_code: "Smart Casual",
          reservation_policy: "Reservations required for dinner",
          payment_methods: ["Credit Cards", "Apple Pay"]
        },
        '3': {
          id: '3',
          name: "Alton Road Cafe",
          cuisine: "American",
          price_level: "$",
          neighborhood: "South Beach",
          rating: 4.1,
          review_count: 234,
          phone: "+13055555678",
          address: "567 Alton Road Miami Beach FL",
          website: "https://www.altonroadcafe.com",
          hours: "Mon-Fri 7:00 AM - 10:00 PM, Sat-Sun 8:00 AM - 11:00 PM",
          description: "Cozy neighborhood cafe serving classic American comfort food with a modern twist. Perfect for breakfast, lunch, or dinner.",
          specialties: ["All-Day Breakfast", "Gourmet Burgers", "Fresh Pastries", "Artisan Coffee"],
          amenities: ["WiFi", "Pet-Friendly Patio", "Takeout", "Catering"],
          parking: "Free parking lot",
          dress_code: "Casual",
          reservation_policy: "No reservations needed",
          payment_methods: ["Cash", "Credit Cards", "Venmo"]
        }
      }
      
      const restaurantData = mockRestaurants[restaurantId]
      if (restaurantData) {
        setRestaurant(restaurantData)
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCall = () => {
    if (restaurant?.phone) {
      window.open(`tel:${restaurant.phone}`, '_self')
    }
  }

  const handleReservation = () => {
    // Add your reservation logic here - integrate with OpenTable, Resy, etc.
    if (restaurant?.website) {
      window.open(restaurant.website, '_blank')
    } else {
      alert('Reservation functionality - call restaurant directly')
    }
  }

  const handleUber = () => {
    const address = encodeURIComponent(restaurant?.address || '')
    window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff=${address}`, '_blank')
  }

  const handleLyft = () => {
    const address = encodeURIComponent(restaurant?.address || '')
    window.open(`https://lyft.com/ride?destination=${address}`, '_blank')
  }

  const handleDirections = () => {
    const address = encodeURIComponent(restaurant?.address || '')
    window.open(`https://maps.google.com?q=${address}`, '_blank')
  }

  const handleYelp = () => {
    if (restaurant?.yelp_id) {
      window.open(`https://www.yelp.com/biz/${restaurant.yelp_id}`, '_blank')
    }
  }

  const handleWebsiteError = () => {
    setWebsiteError(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading restaurant details...</div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Restaurant not found</div>
          <button 
            onClick={() => router.push('/')}
            className="bg-yellow-500 text-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Return to Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header with Navigation */}
      <div className="sticky top-0 bg-purple-900 bg-opacity-95 backdrop-blur-sm border-b border-purple-700 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={handleBackNavigation}
              className="text-white flex items-center space-x-2 hover:text-yellow-400 transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="hidden sm:inline">Back to Results</span>
              <span className="sm:hidden">Back</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-yellow-400 truncate max-w-xs sm:max-w-none">
                {restaurant.name}
              </h1>
            </div>
            
            <button 
              onClick={handleBackNavigation}
              className="bg-yellow-500 text-black px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-sm sm:text-base"
            >
              Back to Other Options
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Restaurant Header Info */}
        <div className="text-center mb-8">
          <div className="flex flex-wrap justify-center items-center gap-4 text-white mb-4">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm sm:text-base">
              {restaurant.cuisine}
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm sm:text-base">
              {restaurant.price_level}
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm sm:text-base">
              {restaurant.neighborhood}
            </span>
          </div>
          <div className="flex justify-center items-center space-x-2">
            <span className="text-yellow-400 text-lg">★ {restaurant.rating}</span>
            <span className="text-white">({restaurant.review_count} reviews)</span>
          </div>
        </div>

        {/* Mobile Quick Actions Bar */}
        {isMobile && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={handleCall}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>📞</span>
              <span className="text-sm">Call</span>
            </button>
            <button
              onClick={handleDirections}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>🗺️</span>
              <span className="text-sm">Directions</span>
            </button>
          </div>
        )}

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-8`}>
          {/* Main Content Area */}
          <div className={isMobile ? 'order-1' : 'lg:col-span-2'}>
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-white bg-opacity-10 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3 px-4 rounded-md transition-colors text-sm sm:text-base ${
                  activeTab === 'overview'
                    ? 'bg-yellow-500 text-black font-semibold' 
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('website')}
                className={`flex-1 py-3 px-4 rounded-md transition-colors text-sm sm:text-base ${
                  activeTab === 'website'
                    ? 'bg-yellow-500 text-black font-semibold' 
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Visit Website
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 px-4 rounded-md transition-colors text-sm sm:text-base ${
                  activeTab === 'details'
                    ? 'bg-yellow-500 text-black font-semibold' 
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Details
              </button>
            </div>

            {/* Content Area */}
            <div className="bg-white bg-opacity-10 rounded-lg p-6 min-h-96">
              {activeTab === 'overview' && (
                <div className="space-y-6 text-white">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-400 mb-3">About {restaurant.name}</h3>
                    <p className="text-gray-200 leading-relaxed">{restaurant.description}</p>
                  </div>
                  
                  {restaurant.specialties && (
                    <div>
                      <h3 className="text-xl font-semibold text-yellow-400 mb-3">Specialties</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {restaurant.specialties.map((specialty, index) => (
                          <div key={index} className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
                            {specialty}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {restaurant.amenities && (
                    <div>
                      <h3 className="text-xl font-semibold text-yellow-400 mb-3">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.amenities.map((amenity, index) => (
                          <span key={index} className="bg-purple-600 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-2">Contact Info</h4>
                      <p><strong>Phone:</strong> {restaurant.phone}</p>
                      <p><strong>Address:</strong> {restaurant.address}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-2">Hours</h4>
                      <p>{restaurant.hours}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'website' && (
                <div className="space-y-4">
                  {restaurant.website && !websiteError ? (
                    <>
                      <iframe 
                        src={restaurant.website}
                        className="w-full h-96 rounded-lg border border-gray-300"
                        title={`${restaurant.name} Website`}
                        onError={handleWebsiteError}
                      />
                      <div className="text-center">
                        <a 
                          href={restaurant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-yellow-500 text-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors inline-block"
                        >
                          Open in New Tab
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🌐</div>
                      <p className="text-white mb-4">
                        {websiteError ? 'Website temporarily unavailable' : 'Website not available'}
                      </p>
                      {restaurant.website && (
                        <a 
                          href={restaurant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-yellow-500 text-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors inline-block"
                        >
                          Visit Website Directly
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-6 text-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-3">Restaurant Details</h4>
                      <div className="space-y-2">
                        <p><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                        <p><strong>Price Level:</strong> {restaurant.price_level}</p>
                        <p><strong>Neighborhood:</strong> {restaurant.neighborhood}</p>
                        <p><strong>Rating:</strong> ★ {restaurant.rating} ({restaurant.review_count} reviews)</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-3">Practical Info</h4>
                      <div className="space-y-2">
                        {restaurant.parking && <p><strong>Parking:</strong> {restaurant.parking}</p>}
                        {restaurant.dress_code && <p><strong>Dress Code:</strong> {restaurant.dress_code}</p>}
                        {restaurant.reservation_policy && <p><strong>Reservations:</strong> {restaurant.reservation_policy}</p>}
                      </div>
                    </div>
                  </div>

                  {restaurant.payment_methods && (
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-3">Payment Methods</h4>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.payment_methods.map((method, index) => (
                          <span key={index} className="bg-green-600 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-yellow-400 mb-3">External Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.website && (
                        <a 
                          href={restaurant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white text-sm"
                        >
                          Official Website
                        </a>
                      )}
                      {restaurant.yelp_id && (
                        <button
                          onClick={handleYelp}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white text-sm"
                        >
                          View on Yelp
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Quick Actions Sidebar */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <div className="bg-white bg-opacity-10 rounded-lg p-6 sticky top-32">
                <h3 className="text-xl font-semibold text-yellow-400 mb-6 text-center">Quick Actions</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Call Restaurant */}
                  <button
                    onClick={handleCall}
                    className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>📞</span>
                    <span>Call Restaurant</span>
                  </button>

                  {/* Make Reservation */}
                  <button
                    onClick={handleReservation}
                    className="bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>🍽️</span>
                    <span>Make Reservation</span>
                  </button>

                  {/* Transportation */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleUber}
                      className="bg-black hover:bg-gray-800 text-white py-4 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>🚗</span>
                      <span>Uber</span>
                    </button>
                    <button
                      onClick={handleLyft}
                      className="bg-pink-600 hover:bg-pink-700 text-white py-4 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>🚙</span>
                      <span>Lyft</span>
                    </button>
                  </div>

                  {/* Get Directions */}
                  <button
                    onClick={handleDirections}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>🗺️</span>
                    <span>Get Directions</span>
                  </button>

                  {/* Additional Actions */}
                  {restaurant.yelp_id && (
                    <button
                      onClick={handleYelp}
                      className="bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>⭐</span>
                      <span>View on Yelp</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mobile Additional Actions */}
          {isMobile && (
            <div className="order-3 grid grid-cols-2 gap-4">
              <button
                onClick={handleReservation}
                className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🍽️</span>
                <span className="text-sm">Reserve</span>
              </button>
              <button
                onClick={handleUber}
                className="bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🚗</span>
                <span className="text-sm">Uber</span>
              </button>
              <button
                onClick={handleLyft}
                className="bg-pink-600 hover:bg-pink-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🚙</span>
                <span className="text-sm">Lyft</span>
              </button>
              {restaurant.yelp_id && (
                <button
                  onClick={handleYelp}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>⭐</span>
                  <span className="text-sm">Yelp</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}