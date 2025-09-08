'use client'
import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Restaurant {
    id: string
    name: string
    primary_cuisine?: string
    cuisine_type?: string
    price_range: string
    neighborhood: string
    address: string
    phone?: string
    website?: string
    rating?: number
    review_count?: number
    photo_url?: string
    is_open?: boolean
}

function RestaurantsContent() {
    const searchParams = useSearchParams()
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const neighborhood = searchParams.get('neighborhood')
    const budget = searchParams.get('budget')
    const cuisine = searchParams.get('cuisine')

    const fetchRestaurants = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // Use businesses table
            let query = supabase.from('businesses').select('*')

            // Neighborhood filter
            if (neighborhood && neighborhood !== 'all') {
                const dbNeighborhood = neighborhood
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                query = query.ilike('address', `%${dbNeighborhood}%`)
            }

            // Budget filter - EXACT matches
            if (budget === 'quick') query = query.eq('price_range', '$')
            if (budget === 'casual') query = query.eq('price_range', '$$')
            if (budget === 'upscale') query = query.eq('price_range', '$$$')
            if (budget === 'fine') query = query.eq('price_range', '$$$$')
            if (budget === 'luxury') query = query.eq('price_range', '$$$$$')

            // Cuisine filter
            if (cuisine && cuisine !== 'all') {
                query = query.or(`primary_cuisine.eq.${cuisine},cuisine_type.eq.${cuisine}`)
            }

            const { data, error: queryError } = await query.limit(50)

            if (queryError) {
                throw queryError
            }

            setRestaurants(data || [])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load restaurants'
            console.error('Error fetching restaurants:', err)
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [neighborhood, budget, cuisine])

    useEffect(() => {
        fetchRestaurants()
    }, [fetchRestaurants])

    const getFilterDescription = () => {
        const filters = []
        if (neighborhood && neighborhood !== 'all') {
            const displayName = neighborhood.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            filters.push(displayName)
        }
        if (cuisine) filters.push(cuisine)
        if (budget) {
            const budgetLabels: Record<string, string> = {
                'quick': 'Under $25',
                'casual': '$25-75',
                'upscale': '$75-150',
                'fine': '$150-500',
                'luxury': '$500+'
            }
            filters.push(budgetLabels[budget] || budget)
        }

        return filters.length > 0
            ? filters.join(' • ')
            : 'All restaurants'
    }

    const formatPriceRange = (price: string) => {
        const priceMap: Record<string, string> = {
            '$': '$0-25',
            '$$': '$25-75',
            '$$$': '$75-150',
            '$$$$': '$150-500',
            '$$$$$': '$500+'
        }
        return priceMap[price] || price
    }

    const getStars = (rating?: number) => {
        if (!rating) return '☆☆☆☆☆'
        const fullStars = Math.floor(rating)
        const halfStar = rating % 1 >= 0.5 ? 1 : 0
        const emptyStars = 5 - fullStars - halfStar
        return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <div className="text-2xl text-gray-600">Loading restaurants...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white p-4">
                <div className="max-w-7xl mx-auto">
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {restaurants.length} restaurants
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">{getFilterDescription()}</p>
                        </div>
                        <Link
                            href="/"
                            className="px-4 py-2 bg-[#FFA500] text-black rounded-lg hover:bg-[#FFB520] font-medium"
                        >
                            New Search
                        </Link>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {restaurants.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <p className="text-xl text-gray-600">
                            No restaurants found matching your criteria.
                        </p>
                        <Link
                            href="/"
                            className="inline-block mt-4 px-6 py-2 bg-[#FFA500] text-black rounded-lg hover:bg-[#FFB520]"
                        >
                            Start New Search
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {restaurants.map((restaurant) => (
                            <div
                                key={restaurant.id}
                                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            >
                                {/* Image placeholder - replace with actual images when available */}
                                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 relative">
                                    {restaurant.photo_url ? (
                                        <img
                                            src={restaurant.photo_url}
                                            alt={restaurant.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <span className="text-6xl opacity-20">🍽️</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                        {restaurant.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {restaurant.rating ? restaurant.rating.toFixed(1) : 'N/A'}
                                        </span>
                                        <span className="text-yellow-500 text-sm">
                                            {getStars(restaurant.rating)}
                                        </span>
                                        {restaurant.review_count && (
                                            <span className="text-gray-500 text-sm">
                                                ({restaurant.review_count.toLocaleString()})
                                            </span>
                                        )}
                                        <span className="text-gray-700 text-sm">
                                            • {formatPriceRange(restaurant.price_range)}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-2">
                                        <span className={`inline-block ${restaurant.is_open ? 'text-green-600' : 'text-red-600'} font-medium mr-2`}>
                                            {restaurant.is_open ? 'Open' : 'Closed'}
                                        </span>
                                        • {restaurant.primary_cuisine || restaurant.cuisine_type || 'Restaurant'}
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        {restaurant.address}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-3 flex gap-2">
                                        {restaurant.phone && (
                                            <a
                                                href={`tel:${restaurant.phone}`}
                                                className="flex-1 py-2 px-3 bg-green-500 text-white text-sm rounded hover:bg-green-600 text-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Call
                                            </a>
                                        )}
                                        {restaurant.website && (
                                            <a
                                                href={restaurant.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-2 px-3 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 text-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function RestaurantsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <div className="text-2xl text-gray-600">Loading...</div>
                    </div>
                </div>
            </div>
        }>
            <RestaurantsContent />
        </Suspense>
    )
}