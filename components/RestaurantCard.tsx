interface RestaurantCardProps {
    name: string
    cuisine: string
    priceRange: string
    area: string
    rating?: number
    phone?: string
    address?: string
}

export default function RestaurantCard({
    name,
    cuisine,
    priceRange,
    area,
    rating,
    phone,
    address
}: RestaurantCardProps) {
    const formatRating = (rating?: number) => {
        if (!rating) return 'N/A'
        return rating.toFixed(1)
    }

    const getStars = (rating?: number) => {
        if (!rating) return '☆☆☆☆☆'
        const fullStars = Math.floor(rating)
        const halfStar = rating % 1 >= 0.5 ? 1 : 0
        return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars - halfStar)
    }

    return (
        <div className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{name}</h3>
            <div className="text-gray-600 text-sm space-y-1">
                <p>{cuisine} • {priceRange}</p>
                <p>{area}</p>
                <div className="flex items-center gap-2">
                    <span className="text-yellow-500">{getStars(rating)}</span>
                    <span className="text-gray-500">{formatRating(rating)}</span>
                </div>
            </div>

            {phone && (
                <a
                    href={`tel:${phone}`}
                    className="mt-3 block w-full text-center py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Call Now
                </a>
            )}
        </div>
    )
}