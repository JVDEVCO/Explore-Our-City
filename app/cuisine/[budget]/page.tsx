'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
    const router = useRouter()
    const [selectedCity, setSelectedCity] = useState('')
    const [selectedAreaType, setSelectedAreaType] = useState('') // 'specific' or 'all'
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedBudget, setSelectedBudget] = useState('')
    const [selectedCuisine, setSelectedCuisine] = useState('')
    const [cuisines, setCuisines] = useState<string[]>([])


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

    const handleCitySelection = (city: string) => {
        setSelectedCity(city)
        // Reset all subsequent selections
        setSelectedAreaType('')
        setSelectedNeighborhood('')
        setSelectedCategory('')
        setSelectedBudget('')
        setSelectedCuisine('')
        setCuisines([])
    }

    const handleAreaTypeSelection = (areaType: string) => {
        setSelectedAreaType(areaType)
        // Reset subsequent selections
        setSelectedNeighborhood('')
        setSelectedCategory('')
        setSelectedBudget('')
        setSelectedCuisine('')
        setCuisines([])
    }

    const handleNeighborhoodSelection = (neighborhood: string) => {
        setSelectedNeighborhood(neighborhood)
        // Reset subsequent selections
        setSelectedCategory('')
        setSelectedBudget('')
        setSelectedCuisine('')
        setCuisines([])
    }

    const handleCategorySelection = (category: string) => {
        setSelectedCategory(category)
        setSelectedBudget('')
        setSelectedCuisine('')
        setCuisines([])
    }

    const handleBudgetSelection = async (budget: string) => {
        setSelectedBudget(budget)
        setSelectedCuisine('')

        if (selectedCategory === 'dining' && budget) {
            await fetchCuisinesForBudget(budget)
        } else if (selectedCategory && selectedCategory !== 'dining' && budget) {
            navigateToResults()
        }
    }

    const handleCuisineSelection = (cuisine: string) => {
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

    const fetchCuisinesForBudget = async () => {
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
            'Colombian',
            'Contemporary',
            'Cuban',
            'French',
            'German',
            'Greek',
            'Haitian',
            'Ice Cream',
            'Indian',
            'Italian',
            'Japanese',
            'Korean',
            'Lebanese',
            'Maine Lobster',
            'Mediterranean',
            'Mexican',
            'Nicaraguan',
            'Peruvian',
            'Pizza',
            'Russian',
            'Seafood',
            'Spanish',
            'Steakhouse',
            'Sushi',
            'Thai',
            'Turkish',
            'Venezuelan',
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                    Explore Miami & Miami Beach
                </h1>

                {/* Helper Text */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <p className="text-gray-600 text-center">{getHelperText()}</p>
                </div>

                {/* City Selection */}
                {!selectedCity && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => handleCitySelection('miami')}
                            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                        >
                            <h2 className="text-2xl font-semibold mb-2">Miami</h2>
                            <p className="text-gray-600">Explore the Magic City</p>
                        </button>
                        <button
                            onClick={() => handleCitySelection('miami-beach')}
                            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                        >
                            <h2 className="text-2xl font-semibold mb-2">Miami Beach</h2>
                            <p className="text-gray-600">Discover Beach Paradise</p>
                        </button>
                    </div>
                )}

                {/* Area Type Selection */}
                {selectedCity && !selectedAreaType && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => handleAreaTypeSelection('all')}
                            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                        >
                            <h2 className="text-xl font-semibold mb-2">All Areas</h2>
                            <p className="text-gray-600">Explore everywhere in {selectedCity}</p>
                        </button>
                        <button
                            onClick={() => handleAreaTypeSelection('specific')}
                            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                        >
                            <h2 className="text-xl font-semibold mb-2">Specific Area</h2>
                            <p className="text-gray-600">Choose a particular neighborhood</p>
                        </button>
                    </div>
                )}

                {/* Neighborhood Selection */}
                {selectedAreaType === 'specific' && !selectedNeighborhood && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {miamiareas
                            .filter(area => area.city === selectedCity || selectedCity === 'miami')
                            .map(area => (
                                <button
                                    key={area.id}
                                    onClick={() => handleNeighborhoodSelection(area.id)}
                                    className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                                >
                                    <p className="font-medium">{area.name}</p>
                                </button>
                            ))}
                    </div>
                )}

                {/* Category Selection */}
                {((selectedAreaType === 'all') || (selectedAreaType === 'specific' && selectedNeighborhood)) && !selectedCategory && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => handleCategorySelection(category.id)}
                                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                            >
                                <div className="text-3xl mb-2">{category.icon}</div>
                                <h3 className="font-semibold">{category.name}</h3>
                                <p className="text-sm text-gray-600">{category.description}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Budget Selection */}
                {selectedCategory && !selectedBudget && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {budgetOptions.map(budget => (
                            <button
                                key={budget.id}
                                onClick={() => handleBudgetSelection(budget.id)}
                                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                            >
                                <h3 className="font-semibold text-lg">{budget.name}</h3>
                                <p className="text-gray-600">{budget.range}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Cuisine Selection */}
                {selectedCategory === 'dining' && selectedBudget && cuisines.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                        {cuisines.map(cuisine => (
                            <button
                                key={cuisine}
                                onClick={() => handleCuisineSelection(cuisine)}
                                className="p-3 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                            >
                                <p className="font-medium">{cuisine}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Navigation Breadcrumbs */}
                {selectedCity && (
                    <div className="flex flex-wrap gap-2 mt-8">
                        <button
                            onClick={() => handleCitySelection('')}
                            className="px-3 py-1 bg-gray-200 rounded-lg text-sm"
                        >
                            ← Start Over
                        </button>
                        {selectedCity && (
                            <span className="px-3 py-1 bg-blue-100 rounded-lg text-sm">
                                {selectedCity}
                            </span>
                        )}
                        {selectedAreaType && (
                            <span className="px-3 py-1 bg-blue-100 rounded-lg text-sm">
                                {selectedAreaType === 'all' ? 'All Areas' : 'Specific Area'}
                            </span>
                        )}
                        {selectedNeighborhood && (
                            <span className="px-3 py-1 bg-blue-100 rounded-lg text-sm">
                                {miamiareas.find(a => a.id === selectedNeighborhood)?.name}
                            </span>
                        )}
                        {selectedCategory && (
                            <span className="px-3 py-1 bg-blue-100 rounded-lg text-sm">
                                {categories.find(c => c.id === selectedCategory)?.name}
                            </span>
                        )}
                        {selectedBudget && (
                            <span className="px-3 py-1 bg-blue-100 rounded-lg text-sm">
                                {budgetOptions.find(b => b.id === selectedBudget)?.name}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}