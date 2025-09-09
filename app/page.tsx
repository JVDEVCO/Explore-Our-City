'use client'
import { useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Type definitions
interface City {
  id: string
  name: string
}

interface BudgetLevel {
  symbol: string
  label: string
  value: string
}

interface Restaurant {
  id: number
  name: string
  cuisine: string
  rating: number
  price: string
  image: string
  address: string
}

export default function Home() {
  const router = useRouter()

  // Core states with explicit types
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false)
  const [areaMode, setAreaMode] = useState<string>('') // 'specific' or 'all'
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Cities data
  const cities: City[] = [
    { id: 'miami', name: 'Miami & Beaches' },
    { id: 'nashville', name: 'Nashville, TN' },
    { id: 'nyc', name: 'New York City, NY' }
  ]

  // Neighborhoods (for Miami)
  const neighborhoods: string[] = [
    'South Beach', 'Mid Beach', 'North Beach', 'Downtown Miami',
    'Brickell', 'Wynwood', 'Design District', 'Coral Gables',
    'Coconut Grove', 'Little Havana', 'Aventura', 'Bal Harbour'
  ]

  // Categories
  const categories: string[] = [
    'Dining',
    'Entertainment',
    'Adventure',
    'Nature',
    'Culture'
  ]

  // Budget levels
  const budgetLevels: BudgetLevel[] = [
    { symbol: '$', label: 'Quick Bite (Under $25/person)', value: 'quick' },
    { symbol: '$$', label: 'Casual Dining ($25-75/person)', value: 'casual' },
    { symbol: '$$$', label: 'Upscale ($75-150/person)', value: 'upscale' },
    { symbol: '$$$$', label: 'Fine Dining ($150-300/person)', value: 'fine' },
    { symbol: '$$$$$', label: 'Ultra Luxury ($300+/person)', value: 'luxury' }
  ]

  // Cuisine types
  const cuisineTypes: string[] = [
    'American', 'Argentinian', 'Asian', 'BBQ', 'Brazilian', 'British',
    'Burgers', 'Caribbean', 'Chinese', 'Colombian', 'Contemporary',
    'Cuban', 'French', 'German', 'Greek', 'Haitian', 'Ice Cream',
    'Indian', 'Italian', 'Japanese', 'Korean', 'Lebanese', 'Maine Lobster',
    'Mediterranean', 'Mexican', 'Nicaraguan', 'Peruvian', 'Pizza',
    'Russian', 'Seafood', 'Spanish', 'Steakhouse', 'Sushi', 'Thai',
    'Turkish', 'Venezuelan', 'Vietnamese'
  ]

  const handleCitySelect = (cityId: string): void => {
    const city = cities.find(c => c.id === cityId)
    if (city) {
      setSelectedCity(city.name)
      setCityDropdownOpen(false)
      // Reset all selections when city changes
      setAreaMode('')
      setSelectedNeighborhood('')
      setSelectedCategory('')
      setSelectedBudget('')
      setSelectedCuisine('')
      setRestaurants([])
    }
  }

  const handleAreaModeSelect = (mode: string): void => {
    setAreaMode(mode)
    // Reset downstream selections
    setSelectedNeighborhood('')
    setSelectedCategory('')
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])

    // If Explore All, auto-set category to Dining for now
    if (mode === 'all') {
      setSelectedCategory('Dining')
    }
  }

  const handleNeighborhoodSelect = (e: ChangeEvent<HTMLSelectElement>): void => {
    const neighborhood = e.target.value
    setSelectedNeighborhood(neighborhood)
    // Auto-set category to Dining when neighborhood is selected
    if (neighborhood) {
      setSelectedCategory('Dining')
    }
    // Reset downstream selections
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
  }

  const handleCategorySelect = (category: string): void => {
    setSelectedCategory(category)
    // Reset downstream selections
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
  }

  const handleBudgetSelect = (e: ChangeEvent<HTMLSelectElement>): void => {
    const budget = e.target.value
    setSelectedBudget(budget)
    // Reset downstream selections
    setSelectedCuisine('')
    setRestaurants([])
  }

  const fetchRestaurants = async (cuisine: string): Promise<void> => {
    setLoading(true)
    setSelectedCuisine(cuisine)

    const selectedBudgetObj = budgetLevels.find(b => b.label === selectedBudget)

    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('restaurants')
      //   .select('*')
      //   .eq('cuisine', cuisine)
      //   .eq('budget', selectedBudgetObj?.value)
      //   .eq('neighborhood', selectedNeighborhood || 'all')

      // Mock data for now - remove when connecting to Supabase
      const mockRestaurants: Restaurant[] = [
        {
          id: 1,
          name: 'Sample Restaurant 1',
          cuisine: cuisine,
          rating: 4.5,
          price: selectedBudgetObj?.symbol || '$',
          image: '/api/placeholder/300/200',
          address: '123 Ocean Drive'
        },
        {
          id: 2,
          name: 'Sample Restaurant 2',
          cuisine: cuisine,
          rating: 4.8,
          price: selectedBudgetObj?.symbol || '$',
          image: '/api/placeholder/300/200',
          address: '456 Collins Ave'
        }
      ]

      setRestaurants(mockRestaurants)
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  const handleCuisineSelect = (e: ChangeEvent<HTMLSelectElement>): void => {
    const cuisine = e.target.value
    if (cuisine) {
      void fetchRestaurants(cuisine) // void to handle async properly
    }
  }

  const handleSearch = (): void => {
    if (!searchText.trim()) return

    // Navigate with search query
    const params = new URLSearchParams({
      search: searchText,
      city: selectedCity || 'Miami & Beaches'
    })
    router.push(`/restaurants?${params.toString()}`)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRestaurantSelect = (restaurantId: number): void => {
    // Navigate to restaurant detail or show action buttons
    router.push(`/restaurant/${restaurantId}`)
  }

  // Determine what should be enabled
  const isNeighborhoodEnabled: boolean = areaMode === 'specific' && selectedCity === 'Miami & Beaches'
  const isCategoryEnabled: boolean = (areaMode === 'all' || (areaMode === 'specific' && selectedNeighborhood !== '')) && selectedCity === 'Miami & Beaches'
  const isBudgetEnabled: boolean = selectedCategory === 'Dining'
  const isCuisineEnabled: boolean = selectedBudget !== ''
  const isComingSoon: boolean = selectedCity !== '' && selectedCity !== 'Miami & Beaches'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B2F8F] via-[#4A3A9F] to-[#5A4AAF] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-[#FFA500] mb-4">Explore Our City</h1>
          <p className="text-xl mb-2">Dining. Entertainment. Adventure. Nature. Culture.</p>
          <p className="text-lg mb-2">The Ultimate Find-Reserve-Go Experience</p>
          <p className="text-md">From $5 authentic tacos to $50,000 yacht experiences</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {/* 1. City Selection Dropdown */}
          <div className="bg-white/10 backdrop-blur rounded-lg">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
              type="button"
            >
              <span className="text-xl">📍 {selectedCity || 'Select City'}</span>
              <span className="transform transition-transform">
                {cityDropdownOpen ? '▼' : '▶'}
              </span>
            </button>

            {cityDropdownOpen && (
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {cities.map(city => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city.id)}
                      className="w-full p-3 rounded-lg text-left bg-white/20 hover:bg-white/30 transition-colors"
                      type="button"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Show all controls upfront when Miami is selected */}
          {selectedCity === 'Miami & Beaches' && (
            <>
              {/* 2. Specific Area / Explore All buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAreaModeSelect('specific')}
                  className={`p-4 rounded-lg font-semibold transition-all ${areaMode === 'specific'
                      ? 'bg-[#FFA500] text-black shadow-lg'
                      : 'bg-white/20 hover:bg-white/30'
                    }`}
                  type="button"
                >
                  📍 Specific Area
                </button>
                <button
                  onClick={() => handleAreaModeSelect('all')}
                  className={`p-4 rounded-lg font-semibold transition-all ${areaMode === 'all'
                      ? 'bg-white/30 text-white shadow-lg'
                      : 'bg-white/20 hover:bg-white/30'
                    }`}
                  type="button"
                >
                  {areaMode === 'all' ? '☑️' : '☐'} Explore All
                </button>
              </div>

              {/* 3. Neighborhoods dropdown - visible but disabled until Specific Area selected */}
              <select
                value={selectedNeighborhood}
                onChange={handleNeighborhoodSelect}
                disabled={!isNeighborhoodEnabled}
                className={`w-full p-4 rounded-lg font-semibold transition-all ${isNeighborhoodEnabled
                    ? 'bg-[#FFA500] text-black cursor-pointer'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <option value="">Neighborhoods</option>
                {neighborhoods.map(neighborhood => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>

              {/* 4. Category section - always visible, shows current selection */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-lg mb-3">
                  {selectedCategory ? `${selectedCategory === 'Dining' ? '🍽️' : ''} ${selectedCategory}` : 'Select Category'}
                </div>
                {/* Category buttons grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {categories.filter(cat => cat !== 'Dining').map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      disabled={!isCategoryEnabled || selectedCategory === 'Dining'}
                      className={`p-3 rounded-lg transition-all ${selectedCategory === category
                          ? 'bg-[#FFA500] text-black'
                          : isCategoryEnabled && selectedCategory !== 'Dining'
                            ? 'bg-white/20 hover:bg-white/30'
                            : 'bg-gray-600/30 text-gray-400 cursor-not-allowed'
                        }`}
                      type="button"
                    >
                      {category === 'Entertainment' && '🎭 '}
                      {category === 'Adventure' && '🏄 '}
                      {category === 'Nature' && '🌿 '}
                      {category === 'Culture' && '🎨 '}
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Budget Category dropdown - visible but disabled until Dining selected */}
              <select
                value={selectedBudget}
                onChange={handleBudgetSelect}
                disabled={!isBudgetEnabled}
                className={`w-full p-4 rounded-lg font-semibold transition-all ${isBudgetEnabled
                    ? 'bg-[#FFA500] text-black cursor-pointer'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <option value="">Budget Category</option>
                {budgetLevels.map(level => (
                  <option key={level.value} value={level.label}>
                    {level.symbol} - {level.label}
                  </option>
                ))}
              </select>

              {/* 6. Cuisine Selection dropdown - visible but disabled until budget selected */}
              <select
                value={selectedCuisine}
                onChange={handleCuisineSelect}
                disabled={!isCuisineEnabled}
                className={`w-full p-4 rounded-lg font-semibold transition-all ${isCuisineEnabled
                    ? 'bg-[#2FA488] text-white cursor-pointer'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <option value="">🍴 Select Cuisine</option>
                {cuisineTypes.map(cuisine => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>

              {/* Restaurant Tiles - Show after cuisine selection */}
              {loading && (
                <div className="text-center py-8">
                  <div className="text-2xl">Loading restaurants...</div>
                </div>
              )}

              {restaurants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {restaurants.map(restaurant => (
                    <div
                      key={restaurant.id}
                      onClick={() => handleRestaurantSelect(restaurant.id)}
                      className="bg-white/10 backdrop-blur rounded-lg overflow-hidden cursor-pointer hover:bg-white/20 transition-all transform hover:scale-105"
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleRestaurantSelect(restaurant.id)
                      }}
                    >
                      <Image
                        src={restaurant.image}
                        alt={restaurant.name}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
                        <p className="text-sm mb-2">{restaurant.cuisine} • {restaurant.price}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-400">⭐ {restaurant.rating}</span>
                          <span className="text-sm text-gray-300">{restaurant.address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Coming Soon message for other cities */}
          {isComingSoon && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-8 text-center">
              <h2 className="text-2xl mb-4">🚧 Coming Soon!</h2>
              <p className="text-lg">
                {selectedCity} will be available soon.
              </p>
              <p className="text-md mt-2">
                Please select Miami & Beaches to explore available options.
              </p>
            </div>
          )}

          {/* Search Bar - Always visible */}
          <div className="relative mt-8">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="🔍 Search restaurants, venues, or experiences..."
              className="w-full p-4 pr-12 rounded-full bg-white/10 backdrop-blur border-2 border-[#FFA500]/50 text-white placeholder-white/60 focus:border-[#FFA500] focus:outline-none transition-colors"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#FFA500] rounded-full hover:bg-[#FFB520] transition-colors"
              type="button"
              aria-label="Search"
            >
              🔍
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}