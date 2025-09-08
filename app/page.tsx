'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Home() {
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedAreaType, setSelectedAreaType] = useState('') // 'specific' or 'explore'
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBudget, setSelectedBudget] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [cuisines, setCuisines] = useState([])
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const miamiareas = [
    // Miami Beach Areas
    { id: 'south-beach', name: 'South Beach', city: 'miami' },
    { id: 'mid-beach', name: 'Mid Beach', city: 'miami' },
    { id: 'north-beach', name: 'North Beach', city: 'miami' },
    { id: 'bal-harbour', name: 'Bal Harbour', city: 'miami' },
    { id: 'sunny-isles', name: 'Sunny Isles', city: 'miami' },
    // Miami City Areas
    { id: 'downtown', name: 'Downtown', city: 'miami' },
    { id: 'brickell', name: 'Brickell', city: 'miami' },
    { id: 'wynwood', name: 'Wynwood', city: 'miami' },
    { id: 'design-district', name: 'Design District', city: 'miami' },
    { id: 'coral-gables', name: 'Coral Gables', city: 'miami' },
    { id: 'coconut-grove', name: 'Coconut Grove', city: 'miami' },
    { id: 'little-havana', name: 'Little Havana', city: 'miami' },
    { id: 'midtown', name: 'Midtown', city: 'miami' },
    { id: 'aventura', name: 'Aventura', city: 'miami' }
  ]

  const handleCitySelection = (city) => {
    setSelectedCity(city)
    // Reset all subsequent selections
    setSelectedAreaType('')
    setSelectedNeighborhood('')
    setSelectedCategory('')
    setSelectedBudget('')
    setSelectedCuisine('')
    setCuisines([])
  }

  const handleAreaTypeSelection = (areaType) => {
    setSelectedAreaType(areaType)
    // Reset subsequent selections
    setSelectedNeighborhood('')
    setSelectedCategory('')
    setSelectedBudget('')
    setSelectedCuisine('')
    setCuisines([])
  }

  const handleNeighborhoodSelection = (neighborhood) => {
    setSelectedNeighborhood(neighborhood)
    // Reset subsequent selections
    setSelectedCategory('')
    setSelectedBudget('')
    setSelectedCuisine('')
    setCuisines([])
  }

  const handleCategorySelection = (category) => {
    setSelectedCategory(category)
    setSelectedBudget('')
    setSelectedCuisine('')
    setCuisines([])
  }

  const handleBudgetSelection = async (budget) => {
    setSelectedBudget(budget)
    setSelectedCuisine('')

    if (selectedCategory === 'dining' && budget) {
      await fetchCuisinesForBudget(budget)
    } else if (selectedCategory && selectedCategory !== 'dining' && budget) {
      navigateToResults()
    }
  }

  const handleCuisineSelection = (cuisine) => {
    setSelectedCuisine(cuisine)
    if (cuisine && selectedBudget) {
      navigateToResults()
    }
  }

  const navigateToResults = () => {
    const params = new URLSearchParams()
    if (selectedCity) params.set('city', selectedCity)
    if (selectedAreaType) params.set('areaType', selectedAreaType)
    if (selectedNeighborhood) params.set('neighborhood', selectedNeighborhood)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedBudget) params.set('budget', selectedBudget)
    if (selectedCuisine) params.set('cuisine', selectedCuisine)

    router.push(`/restaurants?${params.toString()}`)
  }

  const fetchCuisinesForBudget = async (budget) => {
    // Alphabetized list of proper cuisine types with smart categorization
    const properCuisines = [
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
      'Maine Lobster',
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

    setCuisines(properCuisines)
  }

  const categories = [
    { id: 'dining', name: 'Dining', icon: '🍽️', description: 'Budget-Based' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎭', description: 'Type-Based' },
    { id: 'adventure', name: 'Adventure', icon: '🏄', description: 'Activity-Based' },
    { id: 'nature', name: 'Nature', icon: '🌿', description: 'Experience-Based' },
    { id: 'culture', name: 'Culture', icon: '🎨', description: 'Venue-Based' }
  ]

  const budgetOptions = [
    { id: 'quick', name: 'Quick Bite', range: 'Under $25' },
    { id: 'casual', name: 'Casual Dining', range: '$25-75' },
    { id: 'premium', name: 'Premium Experience', range: '$75-200' },
    { id: 'luxury', name: 'Luxury Dining', range: '$200-1,000' },
    { id: 'ultra', name: 'Ultra Premium', range: '$1,000+' }
  ]

  const featuredRestaurants = [
    { name: "South Pointe Tavern", priceRange: "$$$", cuisine: "American" },
    { name: "Living Room at the W", priceRange: "$$$", cuisine: "Lounge" },
    { name: "Bar Centro", priceRange: "$$$", cuisine: "Cocktails" }
  ]

  const getHelperText = () => {
    if (!selectedCity) return 'Start by selecting a city'
    if (!selectedAreaType) return 'Choose to explore specific areas or the entire city'
    if (selectedAreaType === 'specific' && !selectedNeighborhood) return 'Select a specific neighborhood'
    if (!selectedCategory) return 'Choose your experience type'
    if (selectedCategory === 'dining' && !selectedBudget) return 'Select your budget range'
    if (selectedCategory === 'dining' && selectedBudget && !selectedCuisine && cuisines.length > 0) return 'Choose your cuisine type'
    if (selectedCategory !== 'dining' && selectedCategory) return 'Ready to explore!'
    return 'Ready to discover amazing places!'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #581c87 100%)',
      color: 'white',
      padding: isMobile ? '1rem' : '2rem 1rem',
      display: 'flex',
      flexDirection: 'column'
    }}>

      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        padding: isMobile ? '0' : '0 1rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          background: 'linear-gradient(45deg, #fbbf24, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1.2'
        }}>
          Explore Our City
        </h1>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.1rem',
          marginBottom: '0.3rem',
          opacity: 0.9
        }}>
          Dining. Entertainment. Adventure. Nature. Culture.
        </p>
        <p style={{
          fontSize: isMobile ? '0.8rem' : '1rem',
          marginBottom: '0.3rem',
          opacity: 0.8
        }}>
          The Ultimate Find-Reserve-Go Experience
        </p>
        <p style={{
          fontSize: isMobile ? '0.7rem' : '0.9rem',
          opacity: 0.7
        }}>
          From $5 authentic tacos to $50,000 yacht experiences
        </p>
      </div>

      <div style={{
        maxWidth: '1000px',
        margin: '0 auto 2rem',
        width: '100%',
        padding: isMobile ? '0' : '0 1rem'
      }}>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {/* Step 1: City Selection */}
          <select
            value={selectedCity}
            onChange={(e) => handleCitySelection(e.target.value)}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              padding: isMobile ? '1rem' : '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #4b5563',
              fontSize: isMobile ? '1rem' : '0.9rem'
            }}
          >
            <option value="">Which City Are You Exploring?</option>
            <option value="miami">Miami & Beaches</option>
            <option value="nashville">Nashville</option>
            <option value="nyc">New York City</option>
          </select>

          {/* Step 2: Area Type Selection - Two Half Buttons */}
          {selectedCity && (
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => handleAreaTypeSelection('specific')}
                style={{
                  flex: 1,
                  backgroundColor: selectedAreaType === 'specific' ? '#fbbf24' : '#374151',
                  color: selectedAreaType === 'specific' ? 'black' : 'white',
                  padding: isMobile ? '1rem' : '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: isMobile ? '1rem' : '0.9rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                📍 Specific Area
              </button>
              <button
                onClick={() => handleAreaTypeSelection('explore')}
                style={{
                  flex: 1,
                  backgroundColor: selectedAreaType === 'explore' ? '#fbbf24' : '#374151',
                  color: selectedAreaType === 'explore' ? 'black' : 'white',
                  padding: isMobile ? '1rem' : '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: isMobile ? '1rem' : '0.9rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                🗺️ Explore All
              </button>
            </div>
          )}

          {/* Step 3: Neighborhood Selection (only for specific area) */}
          {selectedAreaType === 'specific' && (
            <select
              value={selectedNeighborhood}
              onChange={(e) => handleNeighborhoodSelection(e.target.value)}
              style={{
                backgroundColor: '#fbbf24',
                color: 'black',
                padding: isMobile ? '1rem' : '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: isMobile ? '1rem' : '0.9rem',
                fontWeight: 'bold'
              }}
            >
              <option value="">Select Neighborhood</option>
              {miamiareas.filter(area => area.city === selectedCity).map(area => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          )}

          {/* Step 4: Experience Category (shows when area decision is made) */}
          {(selectedAreaType === 'explore' || (selectedAreaType === 'specific' && selectedNeighborhood)) && (
            <select
              value={selectedCategory}
              onChange={(e) => handleCategorySelection(e.target.value)}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                padding: isMobile ? '1rem' : '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #4b5563',
                fontSize: isMobile ? '1rem' : '0.9rem'
              }}
            >
              <option value="">Choose Your Experience</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name} ({category.description})
                </option>
              ))}
            </select>
          )}

          {/* Step 5: Budget (appears when dining is selected) */}
          {selectedCategory === 'dining' && (
            <select
              value={selectedBudget}
              onChange={(e) => handleBudgetSelection(e.target.value)}
              style={{
                backgroundColor: '#fbbf24',
                color: 'black',
                padding: isMobile ? '1rem' : '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: isMobile ? '1rem' : '0.9rem',
                fontWeight: 'bold'
              }}
            >
              <option value="">💰 Select Your Budget Range</option>
              {budgetOptions.map(budget => (
                <option key={budget.id} value={budget.id}>
                  {budget.name} ({budget.range})
                </option>
              ))}
            </select>
          )}

          {/* Step 6: Cuisine (appears when budget is selected) */}
          {selectedCategory === 'dining' && selectedBudget && cuisines.length > 0 && (
            <select
              value={selectedCuisine}
              onChange={(e) => handleCuisineSelection(e.target.value)}
              style={{
                backgroundColor: '#34d399',
                color: 'black',
                padding: isMobile ? '1rem' : '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: isMobile ? '1rem' : '0.9rem',
                fontWeight: 'bold'
              }}
            >
              <option value="">🍽️ Choose Cuisine Type</option>
              {cuisines.map(cuisine => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Helper text */}
        <div style={{
          textAlign: 'center',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          opacity: 0.8,
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '0.5rem'
        }}>
          {getHelperText()}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={isMobile ? "Search to bypass dropdowns..." : "Search restaurants, events, experiences to bypass dropdowns..."}
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '0.75rem',
              borderRadius: '0.5rem',
              color: 'black',
              border: '2px solid #fbbf24',
              fontSize: isMobile ? '1rem' : '0.9rem',
              boxSizing: 'border-box'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.2rem',
            opacity: 0.6
          }}>
            🔍
          </div>
        </div>
      </div>

      {/* Featured Venues Section */}
      <div style={{
        flex: 1,
        padding: isMobile ? '0' : '0 1rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '1.8rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#fbbf24'
        }}>
          Featured Venues
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {featuredRestaurants.map((restaurant, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#374151',
                borderRadius: '0.5rem',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !isMobile && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => !isMobile && (e.currentTarget.style.transform = 'scale(1)')}
              onClick={() => router.push(`/restaurant/${index + 1}`)}
            >
              <div style={{
                backgroundColor: '#4b5563',
                height: isMobile ? '120px' : '150px',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                color: '#9ca3af'
              }}>
                Image
              </div>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 'bold',
                marginBottom: '0.25rem'
              }}>
                {restaurant.name}
              </h3>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                opacity: 0.8
              }}>
                {restaurant.priceRange} - {restaurant.cuisine}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div style={{
        textAlign: 'center',
        marginTop: '2rem',
        padding: isMobile ? '1rem 0' : '1rem'
      }}>
        <button style={{
          backgroundColor: '#eab308',
          color: 'black',
          padding: isMobile ? '1rem 2rem' : '0.5rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          border: 'none',
          marginRight: '1rem',
          fontSize: isMobile ? '1rem' : '0.9rem',
          cursor: 'pointer'
        }}>
          Sign Up Free
        </button>
        <button style={{
          backgroundColor: '#374151',
          color: 'white',
          padding: isMobile ? '1rem 2rem' : '0.5rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          border: 'none',
          fontSize: isMobile ? '1rem' : '0.9rem',
          cursor: 'pointer'
        }}>
          Share This App
        </button>
      </div>
    </div>
  )
}