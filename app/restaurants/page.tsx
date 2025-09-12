'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'

// Type definitions - Updated to match API response
interface Restaurant {
    id: number
    name: string
    cuisine_type: string
    neighborhood: string
    rating: number
    budget_level: string
    address: string
    phone?: string
    image_url?: string
    description?: string
    hours?: string
    review_count?: number
    latitude?: number
    longitude?: number
    distance_miles?: number
    distance_from_target?: string
    yelp_id?: string
}

// Loading component
function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF] text-white flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FFA500]"></div>
                <p className="mt-4 text-xl">Loading restaurants...</p>
            </div>
        </div>
    )
}

// Main content component that uses useSearchParams
function RestaurantsContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // State for primary neighborhood results
    const [primaryRestaurants, setPrimaryRestaurants] = useState<Restaurant[]>([])
    const [primaryLoading, setPrimaryLoading] = useState<boolean>(true)
    const [primaryHasMore, setPrimaryHasMore] = useState<boolean>(false)
    const [primaryShowAll, setPrimaryShowAll] = useState<boolean>(false)

    // State for nearby results
    const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([])
    const [nearbyLoading, setNearbyLoading] = useState<boolean>(false)
    const [nearbyShown, setNearbyShown] = useState<boolean>(false)

    // Modal state
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
    const [showActions, setShowActions] = useState<boolean>(false)

    // Get query parameters
    const neighborhood = searchParams.get('neighborhood') || ''
    const budget = searchParams.get('budget') || ''
    const cuisine = searchParams.get('cuisine') || ''
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || 'Miami & Beaches'

    // Budget mapping
    const budgetMap = useMemo(() => ({
        'budget': '$',
        'mid-range': '$$',
        'upscale': '$$$',
        'luxury': '$$$$',
        'ultra-luxury': '$$$$$'
    }), [])

    // Load primary neighborhood results
    useEffect(() => {
        const fetchPrimaryRestaurants = async (): Promise<void> => {
            setPrimaryLoading(true)

            try {
                const params = new URLSearchParams()
                
                if (cuisine && cuisine !== 'all') params.append('cuisine', cuisine)
                if (neighborhood && neighborhood !== 'all') params.append('neighborhood', neighborhood)
                if (budget && budget !== 'all') params.append('budget', budget)
                if (city && city !== 'all') params.append('city', city)
                if (search) params.append('search', search)
                
                // FIXED: Get more results initially (up to 50)
                params.append('limit', '50')
                params.append('searchType', 'primary')

                console.log('Fetching primary restaurants with params:', Object.fromEntries(params))

                const response = await fetch(`/api/restaurants?${params}`)
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                
                const data = await response.json()
                console.log('Received primary restaurants:', data)
                
                setPrimaryRestaurants(data || [])
                // FIXED: Check if we might have more results based on result count
                setPrimaryHasMore(data && data.length >= 50) // If we got full batch, there might be more

            } catch (error) {
                console.error('Error fetching primary restaurants:', error)
                setPrimaryRestaurants([])
            } finally {
                setPrimaryLoading(false)
            }
        }

        void fetchPrimaryRestaurants()
    }, [neighborhood, budget, cuisine, category, search, city])

    // Load more restaurants from the same neighborhood
    const handleLoadMorePrimary = async (): Promise<void> => {
        try {
            const params = new URLSearchParams()
            
            if (cuisine && cuisine !== 'all') params.append('cuisine', cuisine)
            if (neighborhood && neighborhood !== 'all') params.append('neighborhood', neighborhood)
            if (budget && budget !== 'all') params.append('budget', budget)
            if (city && city !== 'all') params.append('city', city)
            if (search) params.append('search', search)
            
            // Get next batch starting from current count
            params.append('limit', '25')
            params.append('offset', primaryRestaurants.length.toString())
            params.append('searchType', 'primary')

            const response = await fetch(`/api/restaurants?${params}`)
            
            if (response.ok) {
                const moreData = await response.json()
                setPrimaryRestaurants(prev => [...prev, ...moreData])
                setPrimaryShowAll(true)
                setPrimaryHasMore(moreData.length >= 25) // Check if there might be more
            }
        } catch (error) {
            console.error('Error loading more primary restaurants:', error)
        }
    }

    // Load nearby neighborhood results
    const handleShowNearby = async (): Promise<void> => {
        if (nearbyShown) {
            setNearbyShown(false)
            return
        }

        setNearbyLoading(true)

        try {
            const params = new URLSearchParams()
            
            if (cuisine && cuisine !== 'all') params.append('cuisine', cuisine)
            if (neighborhood && neighborhood !== 'all') params.append('neighborhood', neighborhood)
            if (budget && budget !== 'all') params.append('budget', budget)
            if (city && city !== 'all') params.append('city', city)
            if (search) params.append('search', search)
            
            // Get nearby restaurants
            params.append('limit', '30')
            params.append('searchType', 'nearby')

            console.log('Fetching nearby restaurants with params:', Object.fromEntries(params))

            const response = await fetch(`/api/restaurants?${params}`)
            
            if (response.ok) {
                const nearbyData = await response.json()
                console.log('Received nearby restaurants:', nearbyData)
                setNearbyRestaurants(nearbyData || [])
                setNearbyShown(true)
            }
        } catch (error) {
            console.error('Error loading nearby restaurants:', error)
        } finally {
            setNearbyLoading(false)
        }
    }

    const handleRestaurantClick = (restaurant: Restaurant): void => {
        setSelectedRestaurant(restaurant)
        setShowActions(true)
    }

    const handleCall = (phone?: string): void => {
        if (phone) {
            window.location.href = `tel:${phone.replace(/\D/g, '')}`
        }
    }

    const handleUberLyft = (address: string, service: 'uber' | 'lyft'): void => {
        const encodedAddress = encodeURIComponent(address)
        if (service === 'uber') {
            window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`, '_blank')
        } else {
            window.open(`https://lyft.com/ride?id=lyft&pickup=current_location&destination=${encodedAddress}`, '_blank')
        }
    }

    const handleReservation = (restaurant: Restaurant): void => {
        // FIXED: Navigate to restaurant detail page preserving current search context
        const currentParams = new URLSearchParams(window.location.search)
        const restaurantUrl = `/restaurant/${restaurant.id}?${currentParams.toString()}`
        router.push(restaurantUrl)
    }

    const handleDirections = (address: string): void => {
        const encodedAddress = encodeURIComponent(address)
        window.open(`https://maps.google.com/maps?daddr=${encodedAddress}`, '_blank')
    }

    // FIXED: Proper back navigation that preserves search state
    const handleBack = (): void => {
        // Build URL with current search parameters
        const params = new URLSearchParams()
        if (city) params.set('city', city)
        if (neighborhood) params.set('neighborhood', neighborhood)
        if (budget) params.set('budget', budget)
        if (cuisine) params.set('cuisine', cuisine)
        if (category) params.set('category', category)
        if (search) params.set('search', search)
        
        const homeUrl = `/?${params.toString()}`
        router.push(homeUrl)
    }

    // Get budget display text
    const getBudgetDisplayText = (budgetKey: string): string => {
        const budgetTexts = {
            'budget': 'Quick Bite (Under $25/person)',
            'mid-range': 'Casual Dining ($25-60/person)',
            'upscale': 'Fine Dining ($60-120/person)',
            'luxury': 'Luxury Experience ($120-300/person)',
            'ultra-luxury': 'Ultra-Luxury Experience ($300+/person)'
        }
        return budgetTexts[budgetKey as keyof typeof budgetTexts] || budgetKey
    }

    // Restaurant card component
    const RestaurantCard = ({ restaurant, showDistance = false }: { restaurant: Restaurant, showDistance?: boolean }) => (
        <div
            onClick={() => handleRestaurantClick(restaurant)}
            className="bg-white/10 backdrop-blur rounded-lg overflow-hidden cursor-pointer hover:bg-white/20 transition-all transform hover:scale-105 border border-white/10 hover:border-[#FFA500]/30"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === 'Enter') handleRestaurantClick(restaurant)
            }}
        >
            <Image
                src={restaurant.image_url || '/api/placeholder/400/300'}
                alt={restaurant.name}
                width={400}
                height={300}
                className="w-full h-48 object-cover"
            />
            <div className="p-4">
                <h3 className="font-bold text-xl mb-2 text-white">{restaurant.name}</h3>
                <p className="text-sm mb-2 text-gray-300">
                    {restaurant.cuisine_type} • {restaurant.budget_level}
                </p>
                <p className="text-sm mb-2 text-gray-300">
                    {restaurant.neighborhood}
                    {showDistance && restaurant.distance_miles && (
                        <span className="text-[#FFA500] ml-2">
                            • {restaurant.distance_miles} mi
                        </span>
                    )}
                </p>
                <div className="flex items-center justify-between mb-2">
                    {restaurant.rating && (
                        <span className="text-[#FFA500] font-medium">
                            ⭐ {restaurant.rating}
                            {restaurant.review_count && (
                                <span className="text-gray-400 text-xs ml-1">
                                    ({restaurant.review_count})
                                </span>
                            )}
                        </span>
                    )}
                    <span className="text-sm text-gray-400">{restaurant.hours}</span>
                </div>
                {restaurant.address && restaurant.address !== 'Address not available' && (
                    <p className="text-sm text-gray-400 mb-2">{restaurant.address}</p>
                )}
                {restaurant.description && (
                    <p className="text-sm mt-2 text-gray-300 line-clamp-2">{restaurant.description}</p>
                )}
                {restaurant.yelp_id && (
                    <p className="text-xs text-gray-500 mt-1">ID: {restaurant.yelp_id}</p>
                )}
            </div>
        </div>
    )

    if (primaryLoading) {
        return <LoadingSpinner />
    }

    const totalResults = primaryRestaurants.length + nearbyRestaurants.length

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF] text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={handleBack}
                        className="mb-4 px-6 py-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
                        type="button"
                    >
                        ← Back to Search
                    </button>

                    <h1 className="text-4xl font-bold text-[#FFA500] mb-2">Restaurant Results</h1>

                    {/* Search criteria display */}
                    <div className="mt-4 text-lg space-y-1">
                        {search && <p className="text-gray-200">Search: <span className="text-white font-medium">&quot;{search}&quot;</span></p>}
                        {cuisine && <p className="text-gray-200">Cuisine: <span className="text-white font-medium">{cuisine}</span></p>}
                        {neighborhood && neighborhood !== 'all' && <p className="text-gray-200">Area: <span className="text-white font-medium">{neighborhood}</span></p>}
                        {budget && <p className="text-gray-200">Budget: <span className="text-white font-medium">{budgetMap[budget as keyof typeof budgetMap]} - {getBudgetDisplayText(budget)}</span></p>}
                        {category && <p className="text-gray-200">Category: <span className="text-white font-medium">{category.charAt(0).toUpperCase() + category.slice(1)}</span></p>}
                    </div>
                </div>

                {/* Results Sections */}
                {primaryRestaurants.length === 0 && nearbyRestaurants.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-8 max-w-md mx-auto">
                            <h2 className="text-2xl mb-4 text-[#FFA500]">No restaurants found</h2>
                            <p className="text-lg text-gray-200 mb-4">
                                Try adjusting your search criteria or exploring different neighborhoods
                            </p>
                            <button
                                onClick={handleBack}
                                className="mt-4 px-6 py-3 bg-[#FFA500] text-black rounded-lg hover:bg-[#FFB520] transition-colors"
                                type="button"
                            >
                                New Search
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Summary */}
                        <div className="mb-8">
                            <p className="text-xl text-gray-200">
                                Found <span className="text-[#FFA500] font-semibold">{totalResults}</span> restaurants
                                {neighborhood && neighborhood !== 'all' && (
                                    <span> for {neighborhood}</span>
                                )}
                            </p>
                        </div>

                        {/* Primary Neighborhood Results */}
                        {primaryRestaurants.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">
                                        {cuisine} in {neighborhood}
                                        <span className="text-[#FFA500] ml-2">({primaryRestaurants.length})</span>
                                    </h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                    {primaryRestaurants.slice(0, primaryShowAll ? undefined : 20).map(restaurant => (
                                        <RestaurantCard key={`primary-${restaurant.id}-${restaurant.yelp_id}`} restaurant={restaurant} />
                                    ))}
                                </div>
                                
                                {/* FIXED: Load More Button logic for Same Neighborhood */}
                                {primaryRestaurants.length > 20 && !primaryShowAll && (
                                    <div className="text-center mb-6">
                                        <button
                                            onClick={handleLoadMorePrimary}
                                            className="px-8 py-3 bg-[#FFA500] text-black rounded-lg hover:bg-[#FFB520] transition-colors font-medium"
                                            type="button"
                                        >
                                            See More {cuisine} in {neighborhood} ({primaryRestaurants.length - 20} more)
                                        </button>
                                    </div>
                                )}

                                {primaryHasMore && primaryShowAll && (
                                    <div className="text-center mb-6">
                                        <button
                                            onClick={handleLoadMorePrimary}
                                            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                            type="button"
                                        >
                                            Load More from {neighborhood}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Nearby Areas Section */}
                        {neighborhood && neighborhood !== 'all' && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">
                                        {cuisine} Near {neighborhood}
                                        {nearbyRestaurants.length > 0 && (
                                            <span className="text-[#FFA500] ml-2">({nearbyRestaurants.length})</span>
                                        )}
                                    </h2>
                                </div>

                                {!nearbyShown ? (
                                    <div className="text-center">
                                        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-4">
                                            <p className="text-gray-200 mb-4">
                                                Explore {cuisine} options in neighboring areas
                                            </p>
                                            <button
                                                onClick={handleShowNearby}
                                                disabled={nearbyLoading}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                                type="button"
                                            >
                                                {nearbyLoading ? 'Finding nearby restaurants...' : `Explore ${cuisine} in Nearby Areas`}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {nearbyRestaurants.length > 0 ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                                    {nearbyRestaurants.map(restaurant => (
                                                        <RestaurantCard key={`nearby-${restaurant.id}-${restaurant.yelp_id}`} restaurant={restaurant} showDistance={true} />
                                                    ))}
                                                </div>
                                                
                                                <div className="text-center">
                                                    <button
                                                        onClick={() => setNearbyShown(false)}
                                                        className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                                                        type="button"
                                                    >
                                                        Hide Nearby Areas
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center bg-white/10 backdrop-blur rounded-lg p-6">
                                                <p className="text-gray-300">No {cuisine} restaurants found in nearby areas</p>
                                                <button
                                                    onClick={() => setNearbyShown(false)}
                                                    className="mt-3 px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                                                    type="button"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Action Modal */}
                {showActions && selectedRestaurant && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-gradient-to-br from-[#3B2F8F] to-[#5A4AAF] rounded-xl p-6 max-w-md w-full border-2 border-[#FFA500]/30">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-[#FFA500]">{selectedRestaurant.name}</h2>
                                <button
                                    onClick={() => setShowActions(false)}
                                    className="text-gray-400 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mb-4 text-sm text-gray-300">
                                <p>{selectedRestaurant.cuisine_type} • {selectedRestaurant.budget_level}</p>
                                <p>{selectedRestaurant.neighborhood}
                                    {selectedRestaurant.distance_miles && (
                                        <span className="text-[#FFA500]"> • {selectedRestaurant.distance_miles} mi away</span>
                                    )}
                                </p>
                                {selectedRestaurant.address && selectedRestaurant.address !== 'Address not available' && (
                                    <p>{selectedRestaurant.address}</p>
                                )}
                                {selectedRestaurant.rating && (
                                    <p>⭐ {selectedRestaurant.rating} 
                                        {selectedRestaurant.review_count && ` (${selectedRestaurant.review_count} reviews)`}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                {/* Call Button */}
                                {selectedRestaurant.phone && (
                                    <button
                                        onClick={() => handleCall(selectedRestaurant.phone)}
                                        className="w-full p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        type="button"
                                    >
                                        📞 Call {selectedRestaurant.phone}
                                    </button>
                                )}

                                {/* Reservation Button */}
                                <button
                                    onClick={() => handleReservation(selectedRestaurant)}
                                    className="w-full p-4 bg-[#FFA500] hover:bg-[#FFB520] text-black rounded-lg transition-colors flex items-center justify-center gap-2"
                                    type="button"
                                >
                                    🍽️ View Details & Reserve
                                </button>

                                {/* Ride Options */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleUberLyft(selectedRestaurant.address, 'uber')}
                                        className="p-4 bg-black hover:bg-gray-900 rounded-lg transition-colors"
                                        type="button"
                                    >
                                        🚗 Uber
                                    </button>
                                    <button
                                        onClick={() => handleUberLyft(selectedRestaurant.address, 'lyft')}
                                        className="p-4 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors"
                                        type="button"
                                    >
                                        🚗 Lyft
                                    </button>
                                </div>

                                {/* Directions Button */}
                                <button
                                    onClick={() => handleDirections(selectedRestaurant.address)}
                                    className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    type="button"
                                >
                                    🗺️ Get Directions
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={() => setShowActions(false)}
                                    className="w-full p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    type="button"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Main component with Suspense boundary
export default function RestaurantsPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <RestaurantsContent />
        </Suspense>
    )
}