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
  primary_cuisine: string;
  budget_category: string;
  neighborhood: string;
  phone?: string;
  address?: string;
  website?: string;
  image_url?: string;
  yelp_rating?: number;
  yelp_review_count?: number;
  price_range?: string;
}

interface Activity {
  id: string;
  name: string;
  primary_category: string;
  activity_type: string;
  neighborhood: string;
  price_tier?: string;
  price_range?: string;
  phone?: string;
  address?: string;
  website?: string;
  image_url?: string;
  description?: string;
  tags?: string[];
}

interface SearchResults {
  restaurants: Restaurant[];
  activities: Activity[];
  total: number;
  expandedFrom: string;
  usedTerms: string[];
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
  
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false)

  // Category results states
  const [categoryResults, setCategoryResults] = useState<{activities: Activity[], restaurants: Restaurant[], total: number} | null>(null)
  const [showCategoryResults, setShowCategoryResults] = useState<boolean>(false)

  const cities: City[] = [
    { id: 'miami-beaches', name: 'Miami & Beaches' },
    { id: 'fort-lauderdale', name: 'Fort Lauderdale' },
    { id: 'palm-beach', name: 'Palm Beach' },
    { id: 'keys', name: 'Florida Keys' }
  ]

  const neighborhoods: Record<string, string[]> = {
    'miami-beaches': [
      'South Beach', 'Mid-Beach', 'North Beach', 'Downtown Miami', 'Brickell', 
      'Wynwood', 'Little Havana', 'Coral Gables', 'Coconut Grove', 'Key Biscayne',
      'Virginia Key', 'Miami Design District', 'Edgewater', 'Bal Harbour',
      'Bay Harbor Islands', 'Surfside', 'North Bay Village'
    ],
    'fort-lauderdale': ['Las Olas', 'Beach Area', 'Downtown', 'Port Everglades', 'Victoria Park'],
    'palm-beach': ['Worth Avenue', 'Clematis Street', 'CityPlace', 'Palm Beach Island'],
    'keys': ['Key Largo', 'Islamorada', 'Marathon', 'Key West']
  }

  const categories: string[] = ['dining', 'entertainment', 'adventure', 'culture']

  // Category tag mappings
  const categoryTagMappings: Record<string, string[]> = {
    'adventure': ['adventure', 'outdoor', 'active', 'sports', 'nature', 'thrill', 'water', 'hiking', 'boating'],
    'entertainment': ['entertainment', 'nightlife', 'music', 'shows', 'gaming', 'bars', 'clubs', 'comedy', 'live-music'],
    'culture': ['culture', 'museums', 'art', 'history', 'tours', 'galleries', 'historic', 'educational', 'cultural'],
    'dining': []
  }

  // Dynamic budget levels based on category
  const getBudgetLevels = (): BudgetLevel[] => {
    if (selectedCategory === 'dining') {
      return [
        { symbol: '$', label: 'Quick Bite (Under $25/person)', value: 'budget' },
        { symbol: '$$', label: 'Casual Dining ($25-60/person)', value: 'mid-range' },
        { symbol: '$$$', label: 'Fine Dining ($60-120/person)', value: 'upscale' },
        { symbol: '$$$$', label: 'Luxury Experience ($120-300/person)', value: 'luxury' },
        { symbol: '$$$$$', label: 'Ultra-Luxury Experience ($300+/person)', value: 'ultra-luxury' }
      ]
    } else {
      return [
        { symbol: '$', label: 'Budget Activities (Under $25/person)', value: 'budget' },
        { symbol: '$$', label: 'Standard Activities ($25-75/person)', value: 'mid-range' },
        { symbol: '$$$', label: 'Premium Activities ($75-200/person)', value: 'upscale' },
        { symbol: '$$$$', label: 'Luxury Experiences ($200-1000/person)', value: 'luxury' },
        { symbol: '$$$$$', label: 'Ultra-Luxury Experiences ($1000+/person)', value: 'ultra-luxury' }
      ]
    }
  }

  const cuisineTypes: string[] = [
    'American', 'Argentinian', 'Asian', 'Bagels', 'Bakery', 'Bar', 'BBQ', 'Brazilian',
    'British', 'Burgers', 'Cafe', 'Caribbean', 'Chinese', 'Colombian', 'Creole', 'Cuban',
    'Deli', 'Desserts', 'Dominican', 'Fast Food', 'French', 'German', 'Greek', 'Haitian',
    'Healthy/Organic', 'Ice Cream/Gelato', 'Indian', 'Irish Pub', 'Italian', 'Japanese',
    'Juice Bar', 'Korean', 'Lebanese', 'Maine Lobster', 'Mediterranean', 'Mexican',
    'Middle Eastern', 'Nightclub', 'Peruvian', 'Pizza', 'Portuguese', 'Seafood',
    'Soul Food', 'Southern', 'Spanish', 'Sports Bar', 'Steakhouse', 'Takeout', 'Thai',
    'Turkish', 'Vegan', 'Vegetarian', 'Venezuelan', 'Vietnamese', 'Wine Bar'
  ]

  // Dynamic search placeholder
  const getSearchPlaceholder = (): string => {
    switch (selectedCategory) {
      case 'adventure':
        return "Search adventure activities, outdoor experiences... (try 'kayaking', 'hiking', 'boat tours')"
      case 'entertainment':
        return "Search entertainment venues, nightlife... (try 'live music', 'comedy shows', 'rooftop bars')"
      case 'culture':
        return "Search museums, cultural sites... (try 'art galleries', 'historic tours', 'exhibitions')"
      case 'dining':
        return "Search restaurants, dining experiences... (try 'steak', 'seafood', 'rooftop dining')"
      default:
        return "Search restaurants, venues, or experiences... (try 'steak', 'mini golf', 'family activities')"
    }
  }

  // Search functions
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowSearchResults(true)
    setShowCategoryResults(false)

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (response.ok) {
        setSearchResults(data)
      } else {
        console.error('Search error:', data.error)
        setSearchResults({
          restaurants: [],
          activities: [],
          total: 0,
          expandedFrom: searchQuery,
          usedTerms: [searchQuery]
        })
      }
    } catch (error) {
      console.error('Search fetch error:', error)
      setSearchResults({
        restaurants: [],
        activities: [],
        total: 0,
        expandedFrom: searchQuery,
        usedTerms: [searchQuery]
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setShowSearchResults(false)
  }

  const clearCategoryResults = () => {
    setShowCategoryResults(false)
    setCategoryResults(null)
  }

  // Dropdown handlers
  const handleCitySelection = (city: string) => {
    setSelectedCity(city)
    setSelectedAreaType('')
    setSelectedNeighborhood('')
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
    clearSearch()
    clearCategoryResults()
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
    clearSearch()
    clearCategoryResults()
  }

  const handleNeighborhoodSelection = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood)
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
    clearSearch()
    clearCategoryResults()
  }

  // Updated category selection handler
  const handleCategorySelection = async (category: string) => {
    setSelectedCategory(category)
    setSelectedBudget('')
    setSelectedCuisine('')
    setRestaurants([])
    clearSearch()

    // If dining is selected, keep the original restaurant flow
    if (category === 'dining') {
      setShowCategoryResults(false)
      setCategoryResults(null)
      return
    }

    // For adventure, entertainment, culture - query Activities database
    if (categoryTagMappings[category]) {
      try {
        setShowCategoryResults(true)
        
        const tags = categoryTagMappings[category].join(',')
        
        const params = new URLSearchParams({
          tags: tags,
          category: category,
          ...(selectedCity && { city: selectedCity }),
          ...(selectedNeighborhood && selectedNeighborhood !== 'all' && { neighborhood: selectedNeighborhood })
        })

        const response = await fetch(`/api/search?${params.toString()}`)
        const data = await response.json()
        
        setCategoryResults({
          activities: data.activities || [],
          restaurants: data.restaurants || [],
          total: data.total || 0
        })
        
      } catch (error) {
        console.error('Category search error:', error)
        setCategoryResults({ activities: [], restaurants: [], total: 0 })
      }
    }
  }

  const handleBudgetSelection = (budget: string) => {
    setSelectedBudget(budget)
    setSelectedCuisine('')
    setRestaurants([])
    clearSearch()
    clearCategoryResults()
  }

  const handleCuisineSelection = async (cuisine: string) => {
    setSelectedCuisine(cuisine)
    
    const params = new URLSearchParams({
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      budget: selectedBudget,
      cuisine: cuisine,
      category: selectedCategory
    })
    
    console.log('Navigating to restaurant results with params:', Object.fromEntries(params))
    router.push(`/restaurants?${params.toString()}`)
  }

  const viewRestaurant = (restaurant: Restaurant) => {
    const params = new URLSearchParams({
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      budget: selectedBudget,
      cuisine: selectedCuisine,
      category: selectedCategory
    })
    
    router.push(`/restaurant/${restaurant.id}?${params.toString()}`)
  }

  const viewActivity = (activity: Activity) => {
    const params = new URLSearchParams({
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      category: selectedCategory
    })
    
    router.push(`/activity/${activity.id}?${params.toString()}`)
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
            {getBudgetLevels().map((budget) => (
              <option key={budget.value} value={budget.value}>
                {budget.symbol} - {budget.label}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory === 'dining' && (
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
        )}

        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder={getSearchPlaceholder()}
              className="w-full p-3 pr-32 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#FFA500] focus:outline-none"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors text-sm"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="bg-[#FFA500] hover:bg-[#FFB520] text-black p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Search"
              >
                {isSearching ? '⏳' : '🔍'}
              </button>
            </div>
          </div>
        </div>

        {showCategoryResults && categoryResults && (
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-semibold">
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Activities ({categoryResults.total} found)
              </h3>
              <button
                onClick={() => {
                  setShowCategoryResults(false)
                  setCategoryResults(null)
                  setSelectedCategory('')
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
              >
                Clear
              </button>
            </div>

            {categoryResults.total === 0 ? (
              <div className="text-gray-300 text-center py-8">
                <p>No {selectedCategory} activities found</p>
                <p className="text-sm mt-2">Try selecting a different area or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryResults.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => viewActivity(activity)}
                  >
                    {activity.image_url && (
                      <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                        <Image
                          src={activity.image_url}
                          alt={activity.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h5 className="text-white font-semibold mb-2">{activity.name}</h5>
                    <p className="text-gray-300 text-sm mb-1">
                      {activity.activity_type} • {activity.price_tier || activity.price_range}
                    </p>
                    <p className="text-gray-400 text-sm">{activity.neighborhood}</p>
                    {activity.description && (
                      <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showSearchResults && searchResults && (
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-white text-xl font-semibold">
                  Search Results for &quot;{searchResults.expandedFrom}&quot; ({searchResults.total} found)
                </h3>
                {searchResults.usedTerms.length > 1 && (
                  <p className="text-gray-300 text-sm mt-1">
                    Expanded to include: {searchResults.usedTerms.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={clearSearch}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
              >
                Clear
              </button>
            </div>

            {searchResults.total === 0 ? (
              <div className="text-gray-300 text-center py-8">
                <p>No results found for &quot;{searchResults.expandedFrom}&quot;</p>
                <p className="text-sm mt-2">Try searching for restaurants like &quot;pizza&quot; or activities like &quot;golf&quot;</p>
              </div>
            ) : (
              <div className="space-y-6">
                {searchResults.restaurants.length > 0 && (
                  <div>
                    <h4 className="text-[#FFA500] text-lg font-semibold mb-3">
                      🍽️ Restaurants ({searchResults.restaurants.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.restaurants.map((restaurant) => (
                        <div
                          key={restaurant.id}
                          className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                          onClick={() => viewRestaurant(restaurant)}
                        >
                          {restaurant.image_url && (
                            <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                              <Image
                                src={restaurant.image_url}
                                alt={restaurant.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <h5 className="text-white font-semibold mb-2">{restaurant.name}</h5>
                          <p className="text-gray-300 text-sm mb-1">
                            {restaurant.primary_cuisine} • {restaurant.budget_category || restaurant.price_range}
                          </p>
                          <p className="text-gray-400 text-sm">{restaurant.neighborhood}</p>
                          {restaurant.yelp_rating && (
                            <p className="text-yellow-400 text-sm mt-1">
                              ⭐ {restaurant.yelp_rating} ({restaurant.yelp_review_count} reviews)
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.activities.length > 0 && (
                  <div>
                    <h4 className="text-[#FFA500] text-lg font-semibold mb-3">
                      🎯 Activities ({searchResults.activities.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                          onClick={() => viewActivity(activity)}
                        >
                          {activity.image_url && (
                            <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                              <Image
                                src={activity.image_url}
                                alt={activity.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <h5 className="text-white font-semibold mb-2">{activity.name}</h5>
                          <p className="text-gray-300 text-sm mb-1">
                            {activity.activity_type} • {activity.price_tier || activity.price_range}
                          </p>
                          <p className="text-gray-400 text-sm">{activity.neighborhood}</p>
                          {activity.description && (
                            <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {restaurants.length > 0 && !showSearchResults && !showCategoryResults && (
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
                    {restaurant.primary_cuisine} • {restaurant.budget_category}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {restaurant.neighborhood}
                  </p>
                  {restaurant.yelp_rating && (
                    <p className="text-yellow-400 text-sm mt-1">
                      ⭐ {restaurant.yelp_rating} ({restaurant.yelp_review_count} reviews)
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