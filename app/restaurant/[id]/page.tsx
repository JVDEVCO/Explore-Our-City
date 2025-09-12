'use client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  budget_level: string;
  neighborhood: string;
  city: string;
  phone?: string;
  address?: string;
  website?: string;
  image_url?: string;
  description?: string;
  hours?: string;
  rating?: number;
  review_count?: number;
  latitude?: number;
  longitude?: number;
  yelp_id?: string;
  premium_access_fee?: number;
}

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWebsite, setShowWebsite] = useState(true)
  const [showPremiumAccess, setShowPremiumAccess] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        console.log('Fetching restaurant with ID:', params.id)
        
        // Call API specifically for this restaurant ID
        const response = await fetch(`/api/restaurants?restaurant_id=${params.id}&limit=1`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Restaurant API response:', data)
        
        if (data && data.length > 0) {
          const foundRestaurant = data[0]
          
          // Enhanced restaurant with premium access pricing
          const enhancedRestaurant = {
            ...foundRestaurant,
            // Calculate premium access fee based on budget level
            premium_access_fee: foundRestaurant.budget_level === '$$$$' ? 200 : 
                               foundRestaurant.budget_level === '$$$$$' ? 250 : 
                               foundRestaurant.budget_level === '$$$' ? 150 : 0
          }
          
          setRestaurant(enhancedRestaurant)
          console.log('Found restaurant:', enhancedRestaurant)
        } else {
          console.error('Restaurant not found with ID:', params.id)
          setRestaurant(null)
        }

      } catch (error) {
        console.error('Error fetching restaurant:', error)
        setRestaurant(null)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchRestaurant()
    }
  }, [params.id])

  const handleCall = () => {
    if (restaurant?.phone) {
      window.open(`tel:${restaurant.phone}`, '_self')
    }
  }

  const handleDirections = () => {
    if (restaurant?.address) {
      const encodedAddress = encodeURIComponent(restaurant.address)
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank')
    }
  }

  const handleUber = () => {
    if (restaurant?.address) {
      const encodedAddress = encodeURIComponent(restaurant.address)
      window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`, '_blank')
    }
  }

  const handleLyft = () => {
    if (restaurant?.address) {
      const encodedAddress = encodeURIComponent(restaurant.address)
      window.open(`https://lyft.com/ride?id=lyft&pickup=my_location&destination[address]=${encodedAddress}`, '_blank')
    }
  }

  const handleReservation = () => {
    setShowPremiumAccess(true)
  }

  const handlePremiumAccess = () => {
    setShowPremiumModal(true)
  }

  const confirmPremiumAccess = () => {
    alert('Premium Access reservation confirmed! You will receive confirmation details shortly.')
    setShowPremiumModal(false)
    setShowPremiumAccess(false)
  }

  // FIXED: Proper back navigation that preserves ALL search context
  const handleBackToRestaurantTiles = () => {
    // Get all the search parameters that were passed to this detail page
    const urlParams = new URLSearchParams()
    
    // Copy all current search parameters to preserve exact search context
    searchParams.forEach((value, key) => {
      urlParams.set(key, value)
    })
    
    // Navigate back to the restaurants results page with all original filters preserved
    const restaurantsUrl = `/restaurants?${urlParams.toString()}`
    console.log('Navigating back to restaurant tiles:', restaurantsUrl)
    router.push(restaurantsUrl)
  }

  // Alternative back navigation for left arrow - try browser back first if safe
  const handleBack = () => {
    const referrer = document.referrer
    const currentDomain = window.location.origin
    
    if (referrer && referrer.startsWith(currentDomain) && referrer.includes('/restaurants')) {
      // We came from a restaurants page on our domain, safe to go back
      window.history.back()
    } else {
      // Otherwise use the same logic as handleBackToRestaurantTiles
      handleBackToRestaurantTiles()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FFA500] mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading restaurant...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl mb-4">Restaurant not found</h1>
          <p className="mb-4 text-gray-300">The restaurant you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#FFA500] text-black rounded-lg hover:bg-[#FFB520] transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF]">
      {/* FIXED: Header with proper navigation */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              ← Back to Results
            </button>
            <h1 className="text-2xl font-bold text-[#FFA500]">{restaurant.name}</h1>
            <div className="ml-auto">
              <button
                onClick={handleBackToRestaurantTiles}
                className="bg-[#FFA500] text-black px-3 py-1 rounded-full text-sm font-medium hover:bg-[#FFB520] transition-colors"
              >
                Back to Other Options
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-white text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {restaurant.cuisine_type}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {restaurant.budget_level}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {restaurant.neighborhood}
            </span>
            {restaurant.rating && (
              <span className="bg-white/20 px-3 py-1 rounded-full">
                ⭐ {restaurant.rating}
                {restaurant.review_count && ` (${restaurant.review_count})`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20">
              <div className="flex bg-white/20 border-b border-white/20">
                <button
                  onClick={() => setShowWebsite(true)}
                  className={`flex-1 py-3 px-4 transition-colors ${
                    showWebsite 
                      ? 'bg-[#FFA500] text-black' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Restaurant Info
                </button>
                <button
                  onClick={() => setShowWebsite(false)}
                  className={`flex-1 py-3 px-4 transition-colors ${
                    !showWebsite 
                      ? 'bg-[#FFA500] text-black' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Location & Details
                </button>
              </div>

              <div className="h-96 lg:h-[600px]">
                {showWebsite ? (
                  <div className="p-6 text-white overflow-y-auto h-full">
                    <div className="space-y-6">
                      {restaurant.image_url && (
                        <Image
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          width={800}
                          height={300}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                      
                      <div>
                        <h3 className="text-2xl font-semibold mb-3 text-[#FFA500]">About {restaurant.name}</h3>
                        <p className="text-gray-200 text-lg leading-relaxed">
                          {restaurant.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-[#FFA500]">Restaurant Info</h4>
                          <div className="space-y-2 text-gray-200">
                            <p><span className="font-medium">Cuisine:</span> {restaurant.cuisine_type}</p>
                            <p><span className="font-medium">Price Level:</span> {restaurant.budget_level}</p>
                            <p><span className="font-medium">Neighborhood:</span> {restaurant.neighborhood}</p>
                            {restaurant.rating && (
                              <p>
                                <span className="font-medium">Rating:</span> ⭐ {restaurant.rating}
                                {restaurant.review_count && ` (${restaurant.review_count} reviews)`}
                              </p>
                            )}
                            {restaurant.yelp_id && (
                              <p className="text-xs text-gray-400">Yelp ID: {restaurant.yelp_id}</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-[#FFA500]">Contact & Hours</h4>
                          <div className="space-y-2 text-gray-200">
                            {restaurant.phone && (
                              <p><span className="font-medium">Phone:</span> {restaurant.phone}</p>
                            )}
                            {restaurant.address && restaurant.address !== 'Address not available' && (
                              <p><span className="font-medium">Address:</span> {restaurant.address}</p>
                            )}
                            <p><span className="font-medium">Hours:</span> {restaurant.hours}</p>
                            {restaurant.website && (
                              <p>
                                <span className="font-medium">Website:</span> 
                                <a 
                                  href={restaurant.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#FFA500] hover:text-[#FFB520] ml-1"
                                >
                                  Visit Website
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-white overflow-y-auto h-full">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-3 text-[#FFA500]">Location</h3>
                        {restaurant.address && restaurant.address !== 'Address not available' ? (
                          <p className="text-gray-200 text-lg mb-4">{restaurant.address}</p>
                        ) : (
                          <p className="text-gray-400 text-lg mb-4">Address not available - please call restaurant</p>
                        )}
                        
                        <div className="bg-white/10 p-4 rounded-lg">
                          <p className="text-sm text-gray-300 mb-2">
                            Click below to get directions or book a ride
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handleDirections}
                              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                            >
                              🗺️ Directions
                            </button>
                            <button
                              onClick={handleUber}
                              className="p-3 bg-black hover:bg-gray-900 rounded-lg transition-colors text-sm"
                            >
                              🚗 Uber
                            </button>
                          </div>
                        </div>
                      </div>

                      {restaurant.latitude && restaurant.longitude && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-[#FFA500]">Map Info</h4>
                          <div className="bg-white/10 p-4 rounded-lg text-center">
                            <p className="text-gray-300 mb-2">Coordinates available for mapping</p>
                            <p className="text-sm text-gray-400">
                              {restaurant.latitude.toFixed(4)}, {restaurant.longitude.toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Located in: {restaurant.neighborhood}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 sticky top-6">
              <h3 className="text-white text-xl font-semibold mb-4 text-center">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                {restaurant.phone && (
                  <button
                    onClick={handleCall}
                    className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    📞 Call Restaurant
                  </button>
                )}

                {showPremiumAccess ? (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">⚡ Choose Your Booking Method</h4>
                      <p className="text-sm mb-3">Standard reservations may be limited during peak times. Guarantee your table with Premium Access.</p>
                    </div>
                    
                    <button
                      onClick={() => restaurant.website && window.open(restaurant.website, '_blank')}
                      className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      🍽️ Standard Reservation (Free)
                    </button>
                    
                    {restaurant.premium_access_fee && restaurant.premium_access_fee > 0 && (
                      <button
                        onClick={handlePremiumAccess}
                        className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                      >
                        ⭐ Premium Access - ${restaurant.premium_access_fee}
                      </button>
                    )}
                    
                    <div className="text-xs text-gray-300 space-y-1">
                      <p>• Premium Access: Guaranteed seating + priority service</p>
                      <p>• Fee is non-refundable and separate from dining bill</p>
                    </div>
                    
                    <button
                      onClick={() => setShowPremiumAccess(false)}
                      className="w-full p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
                    >
                      ← Back to Restaurant Details
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleReservation}
                    className="w-full p-4 bg-[#FFA500] hover:bg-[#FFB520] text-black rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    🍽️ Make Reservation
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleUber}
                    className="p-3 bg-black hover:bg-gray-900 text-white rounded-lg transition-colors text-sm"
                  >
                    🚗 Uber
                  </button>
                  <button
                    onClick={handleLyft}
                    className="p-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm"
                  >
                    🚗 Lyft
                  </button>
                </div>

                <button
                  onClick={handleDirections}
                  className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  🗺️ Get Directions
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="text-white text-sm space-y-2">
                  <div>
                    <span className="font-medium text-[#FFA500]">Cuisine:</span>
                    <span className="ml-2">{restaurant.cuisine_type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#FFA500]">Price:</span>
                    <span className="ml-2">{restaurant.budget_level}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#FFA500]">Location:</span>
                    <span className="ml-2">{restaurant.neighborhood}</span>
                  </div>
                  {restaurant.premium_access_fee && restaurant.premium_access_fee > 0 && (
                    <div>
                      <span className="font-medium text-[#FFA500]">Premium Access:</span>
                      <span className="ml-2">${restaurant.premium_access_fee}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-[#3B2F8F] to-[#5A4AAF] rounded-xl p-6 max-w-md w-full border-2 border-[#FFA500]/30">
            <h2 className="text-2xl font-bold text-[#FFA500] mb-4">Premium Access Confirmation</h2>
            
            <div className="space-y-4 text-white">
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">⭐ Premium Access Features</h3>
                <ul className="text-sm space-y-1">
                  <li>• ${restaurant.premium_access_fee} fee for guaranteed seating + priority service</li>
                  <li>• Skip standard waiting list</li>
                  <li>• Premium service priority</li>
                </ul>
              </div>

              <div className="bg-yellow-600/20 border border-yellow-500/30 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Important Terms</h4>
                <ul className="text-sm space-y-1">
                  <li>• Fee: ${restaurant.premium_access_fee} (non-refundable)</li>
                  <li>• Does not apply to your dining bill</li>
                  <li>• Reservation access fee only</li>
                  <li>• Subject to restaurant availability</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPremiumAccess}
                  className="flex-1 p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold"
                >
                  Confirm ${restaurant.premium_access_fee}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}