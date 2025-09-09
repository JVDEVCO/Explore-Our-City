'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  cuisine_type: string;
  budget_level: string;
  neighborhood: string;
  city: string;
  phone?: string;
  address?: string;
  website?: string;
  image_url?: string;
}

function SearchContent() {
  // State management
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedAreaType, setSelectedAreaType] = useState<string>('')
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('dining')
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Data arrays
  const cities: City[] = [
    { id: 'miami-beaches', name: 'Miami & Beaches' },
    { id: 'fort-lauderdale', name: 'Fort Lauderdale' },
    { id: 'palm-beach', name: 'Palm Beach' },
    { id: 'keys', name: 'Florida Keys' }
  ]

  const neighborhoods: Record<string, string[]> = {
    'miami-beaches': ['South Beach', 'Mid Beach', 'North Beach', 'Downtown Miami', 'Brickell', 'Wynwood', 'Design District', 'Little Havana', 'Coral Gables', 'Coconut Grove'],
    'fort-lauderdale': ['Las Olas', 'Beach Area', 'Downtown', 'Port Everglades', 'Victoria Park'],
    'palm-beach': ['Worth Avenue', 'Clematis Street', 'CityPlace', 'Palm Beach Island'],
    'keys': ['Key Largo', 'Islamorada', 'Marathon', 'Key West']
  }

  const categories: string[] = ['dining', 'entertainment', 'adventure', 'nature', 'culture']

  const budgetLevels: BudgetLevel[] = [
    { symbol: '$', label: 'Quick Bite (Under $25/person)', value: 'budget' },
    { symbol: '$$', label: 'Casual Dining ($25-60/person)', value: 'mid-range' },
    { symbol: '$$$', label: 'Fine Dining ($60-120/person)', value: 'upscale' },
    { symbol: '$$$$', label: 'Luxury Experience ($120+/person)', value: 'luxury' }
  ]

  const cuisineTypes: string[] = [
    'American',
    'Argentinian',
    'BBQ',
    'Brazilian',
    'British',
    'Burgers',
    'Caribbean',
    'Chinese',
    'Cuban',
    'Ethiopian',
    'French',
    'Fusion',
    'German',
    'Greek',
    'Indian',
    'Italian',
    'Japanese',
    'Korean',
    'Lebanese',
    'Maine Lobster', // Special Miami category
    'Mediterranean',
    'Mexican',
    'Moroccan',
    'Peruvian',
    'Pizza',
    'Russian',
    'Seafood',
    'Spanish',
    'Steakhouse',
    'Sushi',
    'Thai',
    'Turkish',
    'Vegan',
    'Vegetarian',
    'Vietnamese'
  ]

  // Handler functions
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
    setSelectedNeighborhood('')
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

  const handleCuisineSelection = async (cuisine: string) => {
    setSelectedCuisine(cuisine)
    setLoading(true)

    try {
      const params = new URLSearchParams({
        city: selectedCity,
        neighborhood: selectedNeighborhood,
        budget: selectedBudget,
        cuisine: cuisine
      })

      const response = await fetch(`/api/restaurants?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data)
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  // CTA Handler functions
  const handleCall = (restaurant: Restaurant) => {
    if (restaurant.phone) {
      window.open(`tel:${restaurant.phone}`, '_self')
    }
  }

  const handleDirections = (restaurant: Restaurant) => {
    if (restaurant.address) {
      const encodedAddress = encodeURIComponent(restaurant.address)
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank')
    }
  }

  const handleUber = (restaurant: Restaurant) => {
    if (restaurant.address) {
      const encodedAddress = encodeURIComponent(restaurant.address)
      window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`, '_blank')
    }
  }

  const handleReservation = (restaurant: Restaurant) => {
    if (restaurant.website) {
      window.open(restaurant.website, '_blank')
    } else if (restaurant.phone) {
      window.open(`tel:${restaurant.phone}`, '_self')
    }
  }

  const openModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedRestaurant(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800">
      {/* Header */}
      <div className="text-center py-12 px-4">
        <h1 className="text-5xl font-bold text-yellow-400 mb-4">
          Explore Our City
        </h1>
        <p className="text-xl text-gray-200 mb-2">
          Dining. Entertainment. Adventure. Nature. Culture.
        </p>
        <p className="text-lg text-gray-300 mb-4">
          The Ultimate Find-Reserve-Go Experience
        </p>
        <p className="text-gray-400">
          From $5 authentic tacos to $50,000 yacht experiences
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {/* City Selection */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-3">
          <select
            value={selectedCity}
            onChange={(e) => handleCitySelection(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">📍 Select City →</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Area Type Selection */}
        <div className={`bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-3 transition-opacity duration-300 ${!selectedCity ? 'opacity-50' : 'opacity-100'
          }`}>
          <div className="grid grid-cols-2 gap-4">
            <button
              disabled={!selectedCity}
              onClick={() => handleAreaTypeSelection('specific')}
              className={`p-3 rounded-lg transition-colors ${selectedAreaType === 'specific'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
                } ${!selectedCity ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              📍 Specific Area
            </button>
            <button
              disabled={!selectedCity}
              onClick={() => handleAreaTypeSelection('explore-all')}
              className={`p-3 rounded-lg transition-colors ${selectedAreaType === 'explore-all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
                } ${!selectedCity ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              🔍 Explore All
            </button>
          </div>
        </div>

        {/* Neighborhood Selection */}
        <div className={`bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-3 transition-opacity duration-300 ${!selectedAreaType ? 'opacity-50' : 'opacity-100'
          }`}>
          <select
            value={selectedNeighborhood}
            onChange={(e) => handleNeighborhoodSelection(e.target.value)}
            disabled={!selectedAreaType}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">🏘️ Choose neighborhood...</option>
            {selectedCity && neighborhoods[selectedCity]?.map((neighborhood) => (
              <option key={neighborhood} value={neighborhood}>
                {neighborhood}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selection - Now as dropdown */}
        <div className={`bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-3 transition-opacity duration-300 ${!selectedNeighborhood ? 'opacity-50' : 'opacity-100'
          }`}>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategorySelection(e.target.value)}
            disabled={!selectedNeighborhood}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">🎭 Dining. Entertainment. Adventure. Nature. Culture.</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Selection - Now as dropdown */}
        <div className={`bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-3 transition-opacity duration-300 ${!selectedCategory ? 'opacity-50' : 'opacity-100'
          }`}>
          <select
            value={selectedBudget}
            onChange={(e) => handleBudgetSelection(e.target.value)}
            disabled={!selectedCategory}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">💰 Budget Level</option>
            {budgetLevels.map((budget) => (
              <option key={budget.value} value={budget.value}>
                {budget.symbol} - {budget.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cuisine Selection */}
        <div className={`bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-3 transition-opacity duration-300 ${!selectedBudget ? 'opacity-50' : 'opacity-100'
          }`}>
          <select
            value={selectedCuisine}
            onChange={(e) => handleCuisineSelection(e.target.value)}
            disabled={!selectedBudget}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">🍽️ Choose your cuisine type...</option>
            {cuisineTypes.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search restaurants, venues, or experiences..."
              className="w-full p-3 pr-16 bg-gray-700 text-white rounded-lg border border-yellow-500 focus:border-yellow-400 focus:outline-none"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-500 hover:bg-yellow-600 text-black p-2 rounded-lg transition-colors">
              🔍
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-white mt-4">Finding perfect matches...</p>
          </div>
        )}

        {/* Restaurant Results */}
        {restaurants.length > 0 && (
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-white text-xl font-semibold mb-4">
              Found {restaurants.length} restaurants
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => openModal(restaurant)}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA Modal */}
      {showModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-semibold">
                {selectedRestaurant.name}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleCall(selectedRestaurant)}
                className="w-full p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                📞 Call Restaurant
              </button>

              <button
                onClick={() => handleReservation(selectedRestaurant)}
                className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                🍽️ OpenTable and Resy
              </button>

              <button
                onClick={() => handleUber(selectedRestaurant)}
                className="w-full p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                🚗 Get Uber/Lyft
              </button>

              <button
                onClick={() => handleDirections(selectedRestaurant)}
                className="w-full p-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                🗺️ Get Directions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Loading Explore Our City...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}