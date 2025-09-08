'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase.js'

interface Restaurant {
    id: string
    name: string
    cuisine_type: string
    price_range: string
    neighborhood: string
    address: string
    phone?: string
    website?: string
    rating?: number
}

export default function RestaurantsPage() {
    const searchParams = useSearchParams()
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const neighborhood = searchParams.get('neighborhood')
    const cuisine = searchParams.get('cuisine')
    const budget = searchParams.get('budget')
    const category = searchParams.get('category')

    useEffect(() => {
        fetchRestaurants()
    }, [neighborhood, cuisine, budget, category])

    const fetchRestaurants = async () => {
        try {
            setLoading(true)
            setError(null)

            let query = supabase
                .from('businesses')
                .select('*')
                .eq('is_active', true)

            // Apply filters based on search params
            if (neighborhood) {
                // Convert neighborhood ID to actual name for matching
                const neighborhoodName = neighborhood.replace(/-/g, ' ')
                    .split(' ')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                query = query.ilike('address', `%${neighborhoodName}%`)
            }

            if (cuisine && cuisine !== 'all') {
                query = query.eq('cuisine_type', cuisine)
            }

            if (budget) {
                const budgetToPriceRange: Record<string, string> = {
                    'quick': '$',
                    'casual': '$$',
                    'premium': '$$$',
                    'luxury': '$$$$',
                    'ultra': '$$$$$'
                }
                const priceRange = budgetToPriceRange[budget]
                if (priceRange) {
                    query = query.eq('price_range', priceRange)
                }
            }

            const { data, error: queryError } = await query.limit(100)

            if (queryError) {
                throw queryError
            }

            setRestaurants(data || [])
        } catch (err: any) {
            console.error('Error fetching restaurants:', err)
            setError(err.message || 'Failed to load restaurants')
        } finally {
            setLoading(false)
        }
    }

    const getFilterDescription = () => {
        const filters = []
        if (neighborhood) filters.push(`in ${neighborhood.replace(/-/g, ' ')}`)
        if (cuisine) filters.push(cuisine)
        if (budget) filters.push(`${budget} dining`)
        if (category) filters.push(category)

        return filters.length > 0
            ? `Showing restaurants ${filters.join(', ')}`
            : 'Showing all restaurants'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-12">
                        <div className="text-2xl text-gray-600">Loading restaurants...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-12">
                        <div className="text-2xl text-red-600">Error: {error}</div>
                        <button
                            onClick={() => fetchRestaurants()}
                            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Miami Restaurant Results
                    </h1>
                    <p className="text-gray-600">{getFilterDescription()}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Found {restaurants.length} restaurants
                    </p>
                </div>

                {restaurants.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-xl text-gray-600">
                            No restaurants found matching your criteria.
                        </p>
                        <a
                            href="/"
                            className="inline-block mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Start New Search
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurants.map((restaurant) => (
                            <div
                                key={restaurant.id}
                                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                        {restaurant.name}
                                    </h2>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        {restaurant.cuisine_type && (
                                            <p>
                                                <span className="font-medium">Cuisine:</span> {restaurant.cuisine_type}
                                            </p>
                                        )}

                                        {restaurant.price_range && (
                                            <p>
                                                <span className="font-medium">Price:</span> {restaurant.price_range}
                                            </p>
                                        )}

                                        {restaurant.neighborhood && (
                                            <p>
                                                <span className="font-medium">Area:</span> {restaurant.neighborhood}
                                            </p>
                                        )}

                                        {restaurant.address && (
                                            <p className="text-xs">
                                                <span className="font-medium">Address:</span> {restaurant.address}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {restaurant.phone && (
                                            <a
                                                href={`tel:${restaurant.phone}`}
                                                className="block w-full text-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                            >
                                                Call Now
                                            </a>
                                        )}

                                        {restaurant.website && (
                                            <a
                                                href={restaurant.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                            >
                                                Visit Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <a
                        href="/"
                        className="inline-block px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        ← New Search
                    </a>
                </div>
            </div>
        </div>
    )
}