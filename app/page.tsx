'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface City {
  id: string;
  name: string;
}

interface BudgetLevel {
  symbol: string;
  label: string;
  value: string;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string; // This matches what API returns
  budget_level: string; // This matches what API returns
  neighborhood: string;
  city: string;
  phone?: string;
  address?: string;
  website?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
}

function SearchContent() {
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedAreaType, setSelectedAreaType] = useState<string>('')
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const cities: City[] = [
    { id: 'miami-beaches', name: 'Miami & Beaches' },
    { id: 'fort-lauderdale', name: 'Fort Lauderdale' },
    { id: 'palm-beach', name: 'Palm Beach' },
    { id: 'keys', name: 'Florida Keys' }
  ]

  // Updated neighborhoods to match your actual database data
  const neighborhoods: Record<string, string[]> = {
    'miami-beaches': [
      'South Beach', 
      'Mid-Beach', 
      'North Beach', 
      'Downtown Miami', 
      'Brickell', 
      'Wynwood', 
      'Little Havana', 
      'Coral Gables', 
      'Coconut Grove',
      'Key Biscayne',
      'Virginia Key',
      'Miami Design District',
      'Edgewater',
      'Bal Harbour',
      'Bay Harbor Islands',
      'Surfside',
      'North Bay Village'
    ],
    'fort-lauderdale': ['Las Olas', 'Beach Area', 'Downtown', 'Port Everglades', 'Victoria Park'],
    'palm-beach': ['Worth Avenue', 'Clematis Street', 'CityPlace', 'Palm Beach Island'],
    'keys': ['Key Largo', 'Islamorada', 'Marathon', 'Key West']
  }

  const categories: string[] = ['dining', 'entertainment', 'adventure', 'culture']

  const budgetLevels: BudgetLevel[] = [
    { symbol: '$', label: 'Quick Bite (Under $25/person)', value: 'budget' },
    { symbol: '$$', label: 'Casual Dining ($25-60/person)', value: 'mid-range' },
    { symbol: '$$$', label: 'Fine Dining ($60-120/person)', value: 'upscale' },
    { symbol: '$$$$', label: 'Luxury Experience ($120-300/person)', value: 'luxury' },
    { symbol: '$$$$$', label: 'Ultra-Luxury Experience ($300+/person)', value: 'ultra-luxury' }
  ]

  // FIXED: Alphabetized cuisine types with all missing categories added
  const cuisineTypes: string[] = [
    'American',
    'Argentinian',
    'Asian',
    'Bagels',
    'Bakery',
    'Bar',
    'BBQ',
    'Brazilian',
    'British',
    'Burgers',
    'Cafe',
    'Caribbean',
    'Chinese',
    'Colombian',
    'Creole',
    'Cuban',
    'Deli',
    'Desserts',
    'Dominican',
    'Fast Food',
    'French',
    'German',
    'Greek',
    'Haitian',
    'Healthy/Organic',
    'Ice Cream/Gelato',
    'Indian',
    'Irish Pub',
    'Italian',
    'Japanese',
    'Juice Bar',
    'Korean',
    'Lebanese',
    'Maine Lobster',
    'Mediterranean',
    'Mexican',
    'Middle Eastern',
    'Nightclub',
    'Peruvian',
    'Pizza',
    'Portuguese',
    'Seafood',
    'Soul Food',
    'Southern',
    'Spanish',
    'Sports Bar',
    'Steakhouse',
    'Takeout',
    'Thai',
    'Turkish',
    'Vegan',
    'Vegetarian',
    'Venezuelan',
    'Vietnamese',
    'Wine Bar'
  ]

  const handleCitySelection = (city: string) => {
    setSelectedCity(city)
    setSelectedAreaType('')
    setSelectedNeighborhood('')
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
  }

  const handleAreaTypeSelection = (areaType: string) => {
    setSelectedAreaType(areaType)
    if (areaType === 'explore-all') {
      setSelectedNeighborhood('all')
    } else {
      setSelectedNeighborhood('')
    }
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
  }

  const handleNeighborhoodSelection = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood)
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
  }

  const handleCategorySelection = (category: string) => {
    setSelectedCategory(category)
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
  }

  const handleBudgetSelection = (budget: string) => {
    setSelectedBudget(budget)
    setSelectedCuisine('')
    setRestaurants([])
  }

  // FIXED: Navigate to restaurant results page instead of showing inline results
  const handleCuisineSelection = async (cuisine: string) => {
    setSelectedCuisine(cuisine)
    
    // Build parameters for navigation to restaurant results page
    const params = new URLSearchParams({
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      budget: selectedBudget,
      cuisine: cuisine,
      category: selectedCategory
    })
    
    console.log('Navigating to restaurant results with params:', Object.fromEntries(params))
    
    // Navigate to the restaurant results page with all search context preserved
    router.push(`/restaurants?${params.toString()}`)
  }

  // FIXED: Navigate to restaurant detail with search context preserved
  const viewRestaurant = (restaurant: Restaurant) => {
    // Build parameters to preserve search context
    const params = new URLSearchParams({
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      budget: selectedBudget,
      cuisine: selectedCuisine,
      category: selectedCategory
    })
    
    // Navigate to restaurant detail with search context
    router.push(`/restaurant/${restaurant.id}?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF]">
      <div className="text-center py-4 px-4">
        <h1 className="text-5xl font-bold text-[#FFA500] mb-2">
          Explore Our City
        </h1>
        <p className="text-xl text-white mb-1">
          Dining. Entertainment. Adventure. Culture.
        </p>
        <p className="text-lg text-gray-100 mb-1">
          The Ultimate Find-Reserve-Go Experience
        </p>
        <p className="text-gray-200 mb-1">
          From $5 authentic tacos to $50,000 yacht experiences
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-3">
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
          <select
            value={selectedCity}
            onChange={(e) => handleCitySelection(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#FFA500] focus:outline-none"
          >
            <option value="">📍 Select City →</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className={`bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 border border-gray-700 transition-opacity duration-300 ${
          !selectedCity ? 'opacity-50' : 'opacity-100'
        }`}>
          <div className="grid grid-cols-2 gap-4">
            <button
              disabled={!selectedCity}
              onClick={() => handleAreaTypeSelection('specific')}
              className={`p-3 h-12 rounded-lg transition-colors flex items-center justify-center border ${
                selectedAreaType === 'specific'
                  ? 'bg-[#FFA500] text-black border-[#FFA500]'
                  : 'bg-gray-700 text-white hover:bg-gray-600 border-gray-600'
              } ${!selectedCity ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              📍 Specific Area
            </button>
            <button
              disabled={!selectedCity}
              onClick={() => handleAreaTypeSelection('explore-all')}
              className={`p-3 h-12 rounded-lg transition-colors flex items-center justify-center border ${
                selectedAreaType === 'explore-all'
                  ? 'bg-[#FFA500] text-black border-[#FFA500]'
                  : 'bg-gray-700 text-white hover:bg-gray-600 border-gray-600'
              } ${!selectedCity ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              🔍 Explore All
            </button>
          </div>
        </div>

        {selectedAreaType === 'specific' && (
          <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
            <select
              value={selectedNeighborhood}
              onChange={(e) => handleNeighborhoodSelection(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#FFA500] focus:outline-none"
            >
              <option value="">🏘️ Choose neighborhood...</option>
              {selectedCity && neighborhoods[selectedCity]?.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={`bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 border border-gray-700 transition-opacity duration-300 ${
          (selectedAreaType === 'specific' && !selectedNeighborhood) ? 'opacity-50' : 'opacity-100'
        }`}>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategorySelection(e.target.value)}
            disabled={selectedAreaType === 'specific' && !selectedNeighborhood}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#FFA500] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">🎭 Dining? Entertainment? Adventure? Culture?</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={`bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 border border-gray-700 transition-opacity duration-300 ${
          !selectedCategory ? 'opacity-50' : 'opacity-100'
        }`}>
          <select
            value={selectedBudget}
            onChange={(e) => handleBudgetSelection(e.target.value)}
            disabled={!selectedCategory}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#FFA500] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">💰 Budget Level</option>
            {budgetLevels.map((budget) => (
              <option key={budget.value} value={budget.value}>
                {budget.symbol} - {budget.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 border border-gray-700 transition-opacity duration-300 ${
          !selectedBudget ? 'opacity-50' : 'opacity-100'
        }`}>
          <select
            value={selectedCuisine}
            onChange={(e) => handleCuisineSelection(e.target.value)}
            disabled={!selectedBudget}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#FFA500] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">🍽️ Choose your cuisine type...</option>
            {cuisineTypes.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search restaurants, venues, or experiences..."
              className="w-full p-3 pr-16 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#FFA500] focus:outline-none"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#FFA500] hover:bg-[#FFB520] text-black p-2 rounded-lg transition-colors">
              🔍
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFA500] mx-auto"></div>
            <p className="text-white mt-4">Finding perfect matches...</p>
          </div>
        )}

        {restaurants.length > 0 && (
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-white text-xl font-semibold mb-4">
              Found {restaurants.length} restaurants
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => viewRestaurant(restaurant)}
                >
                  {restaurant.image_url && (
                    <div className="relative h-40 mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h4 className="text-white font-semibold text-lg mb-2">
                    {restaurant.name}
                  </h4>
                  <p className="text-gray-300 mb-1">
                    {restaurant.cuisine_type} • {restaurant.budget_level}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {restaurant.neighborhood}
                  </p>
                  {restaurant.rating && (
                    <p className="text-yellow-400 text-sm mt-1">
                      ⭐ {restaurant.rating} ({restaurant.review_count} reviews)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFA500] mx-auto mb-4"></div>
          <p className="text-white">Loading Explore Our City...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}