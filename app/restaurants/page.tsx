'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'

// Type definitions
interface Restaurant {
    id: number
    name: string
    cuisine: string
    neighborhood: string
    rating: number
    price_level: string
    address: string
    phone?: string
    image_url?: string
    description?: string
    hours?: string
    reservation_link?: string
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

    // State
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
    const [showActions, setShowActions] = useState<boolean>(false)

    // Get query parameters
    const neighborhood = searchParams.get('neighborhood') || ''
    const budget = searchParams.get('budget') || ''
    const cuisine = searchParams.get('cuisine') || ''
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || 'Miami & Beaches'

    // Budget mapping - use useMemo to avoid recreating on every render
    const budgetMap = useMemo(() => ({
        'budget': '$',
        'mid-range': '$$',
        'upscale': '$$$',
        'luxury': '$$$$',
        'ultra-luxury': '$$$$$'
    }), [])

    useEffect(() => {
        const fetchRestaurants = async (): Promise<void> => {
            setLoading(true)

            try {
                // TODO: Replace with actual Supabase query
                // const { data, error } = await supabase
                //   .from('restaurants')
                //   .select('*')
                //   .eq('cuisine', cuisine)
                //   .eq('price_level', budgetMap[budget])
                //   .eq('neighborhood', neighborhood === 'all' ? undefined : neighborhood)
                //   .ilike('name', search ? `%${search}%` : undefined)

                // Mock data for testing - remove when Supabase is connected
                const mockData: Restaurant[] = [
                    {
                        id: 1,
                        name: 'Joe\'s Stone Crab',
                        cuisine: cuisine || 'Seafood',
                        neighborhood: neighborhood || 'South Beach',
                        rating: 4.6,
                        price_level: budgetMap[budget as keyof typeof budgetMap] || '$$$',
                        address: '11 Washington Ave, Miami Beach, FL 33139',
                        phone: '(305) 673-0365',
                        image_url: '/api/placeholder/400/300',
                        description: 'Iconic Miami Beach seafood restaurant since 1913',
                        hours: '11:30 AM - 10:00 PM',
                        reservation_link: 'https://joesstonecrab.com/reservations'
                    },
                    {
                        id: 2,
                        name: 'Carbone Miami',
                        cuisine: cuisine || 'Italian',
                        neighborhood: neighborhood || 'South Beach',
                        rating: 4.7,
                        price_level: budgetMap[budget as keyof typeof budgetMap] || '$$$$',
                        address: '49 Collins Ave, Miami Beach, FL 33139',
                        phone: '(305) 938-1000',
                        image_url: '/api/placeholder/400/300',
                        description: 'Upscale Italian-American dining experience',
                        hours: '5:30 PM - 11:00 PM',
                        reservation_link: 'https://resy.com/cities/mia/carbone-miami'
                    },
                    {
                        id: 3,
                        name: 'Yardbird Southern Table',
                        cuisine: cuisine || 'Southern',
                        neighborhood: neighborhood || 'South Beach',
                        rating: 4.5,
                        price_level: budgetMap[budget as keyof typeof budgetMap] || '$$',
                        address: '1600 Lenox Ave, Miami Beach, FL 33139',
                        phone: '(305) 538-5220',
                        image_url: '/api/placeholder/400/300',
                        description: 'Southern comfort food with a modern twist',
                        hours: '11:00 AM - 11:00 PM',
                        reservation_link: 'https://resy.com/cities/mia/yardbird-southern-table-bar'
                    },
                    {
                        id: 4,
                        name: 'Zuma Miami',
                        cuisine: cuisine || 'Japanese',
                        neighborhood: neighborhood || 'Downtown Miami',
                        rating: 4.8,
                        price_level: budgetMap[budget as keyof typeof budgetMap] || '$$$$',
                        address: '270 Biscayne Blvd Way, Miami, FL 33131',
                        phone: '(305) 577-0277',
                        image_url: '/api/placeholder/400/300',
                        description: 'Contemporary Japanese robatayaki cuisine',
                        hours: '6:00 PM - 12:00 AM',
                        reservation_link: 'https://resy.com/cities/mia/zuma-miami'
                    },
                    {
                        id: 5,
                        name: 'Stubborn Seed',
                        cuisine: cuisine || 'American',
                        neighborhood: neighborhood || 'South Beach',
                        rating: 4.4,
                        price_level: budgetMap[budget as keyof typeof budgetMap] || '$$$',
                        address: '101 Washington Ave, Miami Beach, FL 33139',
                        phone: '(305) 203-7181',
                        image_url: '/api/placeholder/400/300',
                        description: 'Modern American cuisine with creative flair',
                        hours: '5:30 PM - 11:00 PM',
                        reservation_link: 'https://resy.com/cities/mia/stubborn-seed'
                    },
                    {
                        id: 6,
                        name: 'Versailles Restaurant',
                        cuisine: cuisine || 'Cuban',
                        neighborhood: neighborhood || 'Little Havana',
                        rating: 4.3,
                        price_level: budgetMap[budget as keyof typeof budgetMap] || '$',
                        address: '3555 SW 8th St, Miami, FL 33135',
                        phone: '(305) 444-0240',
                        image_url: '/api/placeholder/400/300',
                        description: 'Authentic Cuban cuisine and culture',
                        hours: '8:00 AM - 2:00 AM',
                        reservation_link: 'https://versaillesrestaurant.com'
                    }
                ]

                setRestaurants(mockData)
            } catch (error) {
                console.error('Error fetching restaurants:', error)
                setRestaurants([])
            } finally {
                setLoading(false)
            }
        }

        void fetchRestaurants()
    }, [neighborhood, budget, cuisine, category, search, city, budgetMap])

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

    const handleReservation = (link?: string): void => {
        if (link) {
            window.open(link, '_blank')
        }
    }

    const handleDirections = (address: string): void => {
        const encodedAddress = encodeURIComponent(address)
        window.open(`https://maps.google.com/maps?daddr=${encodedAddress}`, '_blank')
    }

    const handleBack = (): void => {
        router.push('/')
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

    if (loading) {
        return <LoadingSpinner />
    }

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

                {/* Restaurant Grid */}
                {restaurants.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-8 max-w-md mx-auto">
                            <h2 className="text-2xl mb-4 text-[#FFA500]">No restaurants found</h2>
                            <p className="text-lg text-gray-200">Try adjusting your search criteria</p>
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
                        <div className="mb-6">
                            <p className="text-xl text-gray-200">
                                Found <span className="text-[#FFA500] font-semibold">{restaurants.length}</span> restaurants
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {restaurants.map(restaurant => (
                                <div
                                    key={restaurant.id}
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
                                        <p className="text-sm mb-2 text-gray-300">{restaurant.cuisine} • {restaurant.price_level}</p>
                                        <p className="text-sm mb-2 text-gray-300">{restaurant.neighborhood}</p>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[#FFA500] font-medium">⭐ {restaurant.rating}</span>
                                            <span className="text-sm text-gray-400">{restaurant.hours}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-2">{restaurant.address}</p>
                                        {restaurant.description && (
                                            <p className="text-sm mt-2 text-gray-300 line-clamp-2">{restaurant.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                <p>{selectedRestaurant.cuisine} • {selectedRestaurant.price_level}</p>
                                <p>{selectedRestaurant.address}</p>
                                {selectedRestaurant.hours && <p>Hours: {selectedRestaurant.hours}</p>}
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
                                {selectedRestaurant.reservation_link && (
                                    <button
                                        onClick={() => handleReservation(selectedRestaurant.reservation_link)}
                                        className="w-full p-4 bg-[#FFA500] hover:bg-[#FFB520] text-black rounded-lg transition-colors flex items-center justify-center gap-2"
                                        type="button"
                                    >
                                        🍽️ Make Reservation
                                    </button>
                                )}

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