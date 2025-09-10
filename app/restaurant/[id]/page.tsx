'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
}

export default function RestaurantDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [loading, setLoading] = useState(true)
    const [showWebsite, setShowWebsite] = useState(true)

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                // TODO: Replace with actual Supabase query
                // const { data, error } = await supabase
                //   .from('restaurants')
                //   .select('*')
                //   .eq('id', params.id)
                //   .single()

                // Mock data for now - replace when Supabase is connected
                const mockRestaurant: Restaurant = {
                    id: params.id as string,
                    name: 'Joe\'s Stone Crab',
                    cuisine_type: 'Seafood',
                    budget_level: '$$$',
                    neighborhood: 'South Beach',
                    city: 'Miami Beach',
                    phone: '(305) 673-0365',
                    address: '11 Washington Ave, Miami Beach, FL 33139',
                    website: 'https://joesstonecrab.com',
                    image_url: '/api/placeholder/800/400',
                    description: 'Iconic Miami Beach seafood restaurant serving stone crab since 1913. A must-visit destination for locals and tourists alike.',
                    hours: '11:30 AM - 10:00 PM',
                    rating: 4.6
                }

                setRestaurant(mockRestaurant)
            } catch (error) {
                console.error('Error fetching restaurant:', error)
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
        if (restaurant?.website) {
            window.open(restaurant.website, '_blank')
        } else if (restaurant?.phone) {
            window.open(`tel:${restaurant.phone}`, '_self')
        }
    }

    const handleBack = () => {
        router.back()
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
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-[#FFA500] text-black rounded-lg hover:bg-[#FFB520] transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF]">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                        >
                            ← Back to Results
                        </button>
                        <h1 className="text-2xl font-bold text-[#FFA500]">{restaurant.name}</h1>
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
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Website/Content Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20">
                            {/* View Toggle */}
                            <div className="flex bg-white/20 border-b border-white/20">
                                <button
                                    onClick={() => setShowWebsite(true)}
                                    className={`flex-1 py-3 px-4 transition-colors ${showWebsite
                                            ? 'bg-[#FFA500] text-black'
                                            : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    Restaurant Website
                                </button>
                                <button
                                    onClick={() => setShowWebsite(false)}
                                    className={`flex-1 py-3 px-4 transition-colors ${!showWebsite
                                            ? 'bg-[#FFA500] text-black'
                                            : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    Details
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="h-96 lg:h-[600px]">
                                {showWebsite && restaurant.website ? (
                                    <iframe
                                        src={restaurant.website}
                                        className="w-full h-full"
                                        title={`${restaurant.name} Website`}
                                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                    />
                                ) : (
                                    <div className="p-6 text-white">
                                        <div className="space-y-4">
                                            {restaurant.image_url && (
                                                <img
                                                    src={restaurant.image_url}
                                                    alt={restaurant.name}
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                            )}

                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">About</h3>
                                                <p className="text-gray-200">
                                                    {restaurant.description || 'A wonderful dining experience awaits you.'}
                                                </p>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Information</h3>
                                                <div className="space-y-2 text-gray-200">
                                                    {restaurant.address && (
                                                        <p><span className="font-medium">Address:</span> {restaurant.address}</p>
                                                    )}
                                                    {restaurant.phone && (
                                                        <p><span className="font-medium">Phone:</span> {restaurant.phone}</p>
                                                    )}
                                                    {restaurant.hours && (
                                                        <p><span className="font-medium">Hours:</span> {restaurant.hours}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 sticky top-6">
                            <h3 className="text-white text-xl font-semibold mb-4 text-center">
                                Quick Actions
                            </h3>

                            <div className="space-y-3">
                                {/* Call Button */}
                                {restaurant.phone && (
                                    <button
                                        onClick={handleCall}
                                        className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        📞 Call Restaurant
                                    </button>
                                )}

                                {/* Reservation Button */}
                                <button
                                    onClick={handleReservation}
                                    className="w-full p-4 bg-[#FFA500] hover:bg-[#FFB520] text-black rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    🍽️ Make Reservation
                                </button>

                                {/* Transportation */}
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

                                {/* Directions Button */}
                                <button
                                    onClick={handleDirections}
                                    className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    🗺️ Get Directions
                                </button>
                            </div>

                            {/* Restaurant Info Summary */}
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}