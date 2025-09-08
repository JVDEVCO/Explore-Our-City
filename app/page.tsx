'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState('Miami & Beaches')
  const [areaType, setAreaType] = useState('specific') // 'specific' or 'all'
  const [selectedArea, setSelectedArea] = useState('South Beach')
  const [selectedCategory, setSelectedCategory] = useState('dining')
  const [selectedBudget, setSelectedBudget] = useState('Quick Bite (Under $25)')
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false)
  const [selectedCuisine, setSelectedCuisine] = useState('')

  // Dropdown states
  const [cityDropdownOpen, setCityDropdownOpen] = useState(true)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(true)
  const [cuisineDropdownOpen, setCuisineDropdownOpen] = useState(false)

  const areas = [
    'South Beach', 'Mid Beach', 'North Beach', 'Downtown Miami',
    'Brickell', 'Wynwood', 'Design District', 'Coral Gables',
    'Coconut Grove', 'Little Havana', 'Aventura', 'Bal Harbour'
  ]

  const budgetOptions = [
    { label: 'Quick Bite (Under $25)', value: 'quick', priceRange: '$' },
    { label: 'Casual Dining ($25-75)', value: 'casual', priceRange: '$$' },
    { label: 'Upscale ($75-200)', value: 'premium', priceRange: '$$$' },
    { label: 'Fine Dining ($200-500)', value: 'luxury', priceRange: '$$$$' },
    { label: 'Ultra Premium ($500+)', value: 'ultra', priceRange: '$$$$$' }
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

  const handleCuisineSelect = (cuisine: string) => {
    setSelectedCuisine(cuisine)
    // Navigate to restaurants page with filters
    const selectedBudgetObj = budgetOptions.find(b => b.label === selectedBudget)
    const params = new URLSearchParams({
      area: areaType === 'all' ? 'all' : selectedArea.toLowerCase().replace(' ', '-'),
      budget: selectedBudgetObj?.value || 'quick',
      cuisine: cuisine
    })
    router.push(`/restaurants?${params.toString()}`)
  }

  const handleSearch = () => {
    const selectedBudgetObj = budgetOptions.find(b => b.label === selectedBudget)
    const params = new URLSearchParams({
      area: areaType === 'all' ? 'all' : selectedArea.toLowerCase().replace(' ', '-'),
      budget: selectedBudgetObj?.value || 'quick',
      category: selectedCategory
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

        {/* City Selection Dropdown */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-white/10 backdrop-blur rounded-lg">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="w-full p-4 text-left flex items-center justify-between"
            >
              <span className="text-xl">📍 {selectedCity}</span>
              <span>{cityDropdownOpen ? '▼' : '▶'}</span>
            </button>

            {cityDropdownOpen && (
              <div className="px-4 pb-4">
                {/* Area Type Selection */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={() => setAreaType('specific')}
                    className={`p-3 rounded-lg ${areaType === 'specific' ? 'bg-[#FFA500] text-black' : 'bg-white/20'}`}
                  >
                    📍 Specific Area
                  </button>
                  <button
                    onClick={() => setAreaType('all')}
                    className={`p-3 rounded-lg ${areaType === 'all' ? 'bg-[#FFA500] text-black' : 'bg-white/20'}`}
                  >
                    🗺️ Explore All
                  </button>
                </div>

                {/* Area Selection */}
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
              </div>
            )}
          </div>

          {/* Category Selection Dropdown */}
          <div className="bg-white/10 backdrop-blur rounded-lg">
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full p-4 text-left flex items-center justify-between"
            >
              <span className="text-xl">🍽️ Dining (Budget-Based)</span>
              <span>{categoryDropdownOpen ? '▼' : '▶'}</span>
            </button>

            {categoryDropdownOpen && (
              <div className="px-4 pb-4">
                {/* Budget Selection */}
                <select
                  value={selectedBudget}
                  onChange={(e) => {
                    setSelectedBudget(e.target.value)
                    setShowCuisineDropdown(true)
                    setCuisineDropdownOpen(true)
                  }}
                  className="w-full p-4 rounded-lg bg-[#FFA500] text-black font-semibold mb-4"
                >
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

          {/* Other Categories (placeholder) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <button className="p-3 bg-white/10 rounded-lg hover:bg-white/20">
              🎭 Entertainment
            </button>
            <button className="p-3 bg-white/10 rounded-lg hover:bg-white/20">
              🏄 Adventure
            </button>
            <button className="p-3 bg-white/10 rounded-lg hover:bg-white/20">
              🌿 Nature
            </button>
            <button className="p-3 bg-white/10 rounded-lg hover:bg-white/20">
              🎨 Culture
            </button>
          </div>

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