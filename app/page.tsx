'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [selectedDestination, setSelectedDestination] = useState('')
  const [destinationOpen, setDestinationOpen] = useState(true)
  const [areaType, setAreaType] = useState('') // 'specific' or 'all'
  const [selectedArea, setSelectedArea] = useState('South Beach')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState('')
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false)
  const [cuisineDropdownOpen, setCuisineDropdownOpen] = useState(false)
  const [selectedCuisine, setSelectedCuisine] = useState('')

  const destinations = [
    { id: 'miami', name: 'Miami & Beaches' },
    { id: 'nashville', name: 'Nashville, TN (Coming Soon)' },
    { id: 'nyc', name: 'NYC, NY (Coming Soon)' }
  ]

  const areas = [
    'South Beach', 'Mid Beach', 'North Beach', 'Downtown Miami',
    'Brickell', 'Wynwood', 'Design District', 'Coral Gables',
    'Coconut Grove', 'Little Havana', 'Aventura', 'Bal Harbour'
  ]

  const categories = [
    'Dining',
    'Entertainment',
    'Adventure',
    'Nature',
    'Culture'
  ]

  const budgetOptions = [
    { label: 'Quick Bite (Under $25 per person)', value: 'quick', priceRange: '$' },
    { label: 'Casual Dining ($25-75 per person)', value: 'casual', priceRange: '$$' },
    { label: 'Upscale ($75-150 per person)', value: 'upscale', priceRange: '$$$' },
    { label: 'Fine Dining ($150-500 per person)', value: 'fine', priceRange: '$$$$' },
    { label: 'Ultra Luxury ($500+ per person)', value: 'luxury', priceRange: '$$$$$' }
  ]

  const cuisineTypes = [
    'American', 'Argentinian', 'Asian', 'BBQ', 'Brazilian', 'British',
    'Burgers', 'Caribbean', 'Chinese', 'Colombian', 'Contemporary',
    'Cuban', 'French', 'German', 'Greek', 'Haitian', 'Ice Cream',
    'Indian', 'Italian', 'Japanese', 'Korean', 'Lebanese', 'Maine Lobster',
    'Mediterranean', 'Mexican', 'Nicaraguan', 'Peruvian', 'Pizza',
    'Russian', 'Seafood', 'Spanish', 'Steakhouse', 'Sushi', 'Thai',
    'Turkish', 'Venezuelan', 'Vietnamese'
  ]

  const handleDestinationSelect = (destination: string) => {
    if (destination === 'miami') {
      setSelectedDestination('Miami & Beaches')
      setDestinationOpen(false)
    }
    // Other destinations are placeholders for now
  }

  const handleAreaTypeSelect = (type: string) => {
    setAreaType(type)
    if (type === 'all') {
      setCategoryOpen(true)
      setSelectedArea('')
    } else if (type === 'specific') {
      // When specific area is selected, go straight to dining/budget
      setBudgetOpen(true)
    }
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setCategoryOpen(false)
    if (category === 'Dining') {
      setBudgetOpen(true)
    }
    // Other categories are placeholders for now
  }

  const handleBudgetSelect = (budget: string) => {
    setSelectedBudget(budget)
    setShowCuisineDropdown(true)
    setCuisineDropdownOpen(true)
  }

  const handleCuisineSelect = (cuisine: string) => {
    setSelectedCuisine(cuisine)
    const selectedBudgetObj = budgetOptions.find(b => b.label === selectedBudget)

    const params = new URLSearchParams({
      neighborhood: areaType === 'all' ? 'all' : selectedArea.toLowerCase().replace(/ /g, '-'),
      budget: selectedBudgetObj?.value || 'quick',
      cuisine: cuisine
    })

    router.push(`/restaurants?${params.toString()}`)
  }

  const handleSearch = () => {
    const selectedBudgetObj = budgetOptions.find(b => b.label === selectedBudget)
    const params = new URLSearchParams({
      neighborhood: areaType === 'all' ? 'all' : selectedArea.toLowerCase().replace(/ /g, '-'),
      budget: selectedBudgetObj?.value || 'quick',
      category: selectedCategory || 'dining'
    })
    router.push(`/restaurants?${params.toString()}`)
  }

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
          {/* Destination Selection Dropdown */}
          <div className="bg-white/10 backdrop-blur rounded-lg">
            <button
              onClick={() => setDestinationOpen(!destinationOpen)}
              className="w-full p-4 text-left flex items-center justify-between"
            >
              <span className="text-xl">📍 {selectedDestination || 'Choose Your Destination'}</span>
              <span>{destinationOpen ? '▼' : '▶'}</span>
            </button>

            {destinationOpen && (
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {destinations.map(dest => (
                    <button
                      key={dest.id}
                      onClick={() => handleDestinationSelect(dest.id)}
                      className={`w-full p-3 rounded-lg text-left ${dest.id === 'miami'
                          ? 'bg-white/20 hover:bg-white/30'
                          : 'bg-white/10 opacity-50 cursor-not-allowed'
                        }`}
                      disabled={dest.id !== 'miami'}
                    >
                      {dest.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Area Selection (only shows after destination selected) */}
          {selectedDestination && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAreaTypeSelect('specific')}
                  className={`p-3 rounded-lg ${areaType === 'specific' ? 'bg-[#FFA500] text-black' : 'bg-white/20'}`}
                >
                  📍 Specific Area
                </button>
                <button
                  onClick={() => handleAreaTypeSelect('all')}
                  className={`p-3 rounded-lg ${areaType === 'all' ? 'bg-[#FFA500] text-black' : 'bg-white/20'}`}
                >
                  🗺️ Explore All
                </button>
              </div>

              {/* Specific Area Dropdown */}
              {areaType === 'specific' && (
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full p-4 rounded-lg bg-[#FFA500] text-black font-semibold"
                >
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              )}

              {/* Category Dropdown (for Explore All) */}
              {areaType === 'all' && (
                <div className="bg-white/10 backdrop-blur rounded-lg">
                  <button
                    onClick={() => setCategoryOpen(!categoryOpen)}
                    className="w-full p-4 text-left flex items-center justify-between"
                  >
                    <span className="text-xl">
                      {selectedCategory || 'Dining. Entertainment. Adventure. Nature. Culture.'}
                    </span>
                    <span>{categoryOpen ? '▼' : '▶'}</span>
                  </button>

                  {categoryOpen && (
                    <div className="px-4 pb-4 space-y-2">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => handleCategorySelect(category)}
                          className="w-full p-3 bg-white/20 hover:bg-white/30 rounded text-left"
                        >
                          {category === 'Dining' && '🍽️'}
                          {category === 'Entertainment' && '🎭'}
                          {category === 'Adventure' && '🏄'}
                          {category === 'Nature' && '🌿'}
                          {category === 'Culture' && '🎨'} {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Budget Selection (for either path when Dining is selected) */}
              {((areaType === 'specific' && selectedArea) || (areaType === 'all' && selectedCategory === 'Dining')) && (
                <div className="bg-white/10 backdrop-blur rounded-lg">
                  <button
                    onClick={() => setBudgetOpen(!budgetOpen)}
                    className="w-full p-4 text-left flex items-center justify-between"
                  >
                    <span className="text-xl">🍽️ Dining (Budget-Based)</span>
                    <span>{budgetOpen ? '▼' : '▶'}</span>
                  </button>

                  {budgetOpen && (
                    <div className="px-4 pb-4">
                      <select
                        value={selectedBudget}
                        onChange={(e) => handleBudgetSelect(e.target.value)}
                        className="w-full p-4 rounded-lg bg-[#FFA500] text-black font-semibold mb-4"
                      >
                        <option value="">Select Budget Range</option>
                        {budgetOptions.map(budget => (
                          <option key={budget.value} value={budget.label}>
                            {budget.label}
                          </option>
                        ))}
                      </select>

                      {/* Cuisine Type Dropdown */}
                      {showCuisineDropdown && (
                        <div className="bg-[#2FA488] rounded-lg p-4">
                          <button
                            onClick={() => setCuisineDropdownOpen(!cuisineDropdownOpen)}
                            className="w-full text-left flex items-center justify-between mb-4"
                          >
                            <span className="text-xl">🍴 Choose Cuisine Type</span>
                            <span>{cuisineDropdownOpen ? '▼' : '▶'}</span>
                          </button>

                          {cuisineDropdownOpen && (
                            <>
                              <p className="text-center mb-4">Choose your cuisine type</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                {cuisineTypes.map(cuisine => (
                                  <button
                                    key={cuisine}
                                    onClick={() => handleCuisineSelect(cuisine)}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded text-sm"
                                  >
                                    {cuisine}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search restaurants, events, experiences to bypass dropdowns"
              className="w-full p-4 rounded-full bg-white/10 backdrop-blur border border-[#FFA500] text-white placeholder-white/60"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#FFA500] rounded-full"
            >
              🔍
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}