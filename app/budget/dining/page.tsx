'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
const { supabase } = require('../../../lib/supabase')

export default function DiningBudgetSelection() {
    const router = useRouter()
    const [budgetStats, setBudgetStats] = useState({})
    const [loading, setLoading] = useState(true)

    const budgetOptions = [
        {
            id: 'quick',
            name: 'Quick Bite',
            range: 'Under $25',
            price_range: '$',
            description: 'Fast, casual, and affordable eats',
            icon: '🌭',
            examples: 'Tacos, sandwiches, casual cafes'
        },
        {
            id: 'casual',
            name: 'Casual Dining',
            range: '$25-75',
            price_range: '$$',
            description: 'Relaxed atmosphere with quality food',
            icon: '🍕',
            examples: 'Family restaurants, bistros, pubs'
        },
        {
            id: 'premium',
            name: 'Premium Experience',
            range: '$75-200',
            price_range: '$$$',
            description: 'Upscale dining with excellent service',
            icon: '🍾',
            examples: 'Fine dining, steakhouses, wine bars'
        },
        {
            id: 'luxury',
            name: 'Luxury Dining',
            range: '$200-1,000',
            price_range: '$$$$',
            description: 'Exclusive, high-end culinary experiences',
            icon: '👨‍🍳',
            examples: 'Michelin-starred, celebrity chef restaurants'
        },
        {
            id: 'ultra',
            name: 'Ultra Premium',
            range: '$1,000+',
            price_range: '$$$$$',
            description: 'Once-in-a-lifetime dining experiences',
            icon: '💎',
            examples: 'Private chef experiences, yacht dining'
        }
    ]

    useEffect(() => {
        fetchBudgetStats()
    }, [])

    const fetchBudgetStats = async () => {
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('price_range, business_type')
                .eq('is_active', true)
                .in('business_type', ['restaurant', 'cheap_eats', 'bar'])

            if (error) {
                console.error('Error fetching budget stats:', error)
            } else {
                // Count restaurants by price range
                const stats = {}
                data.forEach(item => {
                    if (item.price_range) {
                        stats[item.price_range] = (stats[item.price_range] || 0) + 1
                    }
                })
                setBudgetStats(stats)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleBudgetSelection = (budgetId) => {
        router.push(`/cuisine/${budgetId}`)
    }

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #581c87 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                Loading dining options...
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #581c87 100%)',
            color: 'white',
            padding: '2rem 1rem'
        }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <button
                    onClick={() => router.push('/')}
                    style={{
                        backgroundColor: 'transparent',
                        color: 'white',
                        border: '1px solid white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        marginBottom: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    ← Back to Categories
                </button>

                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    background: 'linear-gradient(45deg, #fbbf24, #f97316)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Choose Your Dining Budget
                </h1>

                <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    Select your price range to discover restaurants that fit your budget
                </p>

                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    From quick bites to luxury experiences
                </p>
            </div>

            {/* Budget Options Grid */}
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    padding: '1rem'
                }}>
                    {budgetOptions.map((budget) => {
                        const restaurantCount = budgetStats[budget.price_range] || 0
                        const isAvailable = restaurantCount > 0

                        return (
                            <div
                                key={budget.id}
                                onClick={() => isAvailable && handleBudgetSelection(budget.id)}
                                style={{
                                    backgroundColor: isAvailable ? '#374151' : '#1f2937',
                                    borderRadius: '1rem',
                                    padding: '2rem',
                                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.3s ease',
                                    border: '2px solid transparent',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    opacity: isAvailable ? 1 : 0.6
                                }}
                                onMouseEnter={(e) => {
                                    if (isAvailable) {
                                        e.currentTarget.style.transform = 'translateY(-5px)'
                                        e.currentTarget.style.borderColor = '#fbbf24'
                                        e.currentTarget.style.backgroundColor = '#4b5563'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isAvailable) {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.borderColor = 'transparent'
                                        e.currentTarget.style.backgroundColor = '#374151'
                                    }
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        fontSize: '3rem',
                                        marginRight: '1rem'
                                    }}>
                                        {budget.icon}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            marginBottom: '0.25rem',
                                            color: '#fbbf24'
                                        }}>
                                            {budget.name}
                                        </h3>

                                        <div style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            color: '#34d399',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {budget.range}
                                        </div>

                                        <div style={{
                                            fontSize: '0.9rem',
                                            opacity: 0.8,
                                            marginBottom: '0.5rem'
                                        }}>
                                            {budget.description}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    fontSize: '0.85rem',
                                    opacity: 0.7,
                                    marginBottom: '1rem',
                                    fontStyle: 'italic'
                                }}>
                                    {budget.examples}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        opacity: 0.8
                                    }}>
                                        {restaurantCount} restaurants available
                                    </div>

                                    {isAvailable ? (
                                        <div style={{
                                            fontSize: '0.8rem',
                                            opacity: 0.6,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}>
                                            Tap to Explore →
                                        </div>
                                    ) : (
                                        <div style={{
                                            fontSize: '0.8rem',
                                            opacity: 0.5,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}>
                                            Coming Soon
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Summary Stats */}
            <div style={{
                textAlign: 'center',
                marginTop: '3rem',
                padding: '2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                maxWidth: '600px',
                margin: '3rem auto 0'
            }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#fbbf24' }}>
                    Miami Beach Dining Overview
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    fontSize: '0.9rem'
                }}>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#34d399' }}>
                            {budgetStats['$'] || 0}
                        </div>
                        <div style={{ opacity: 0.7 }}>Quick Bites</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#34d399' }}>
                            {budgetStats['$$'] || 0}
                        </div>
                        <div style={{ opacity: 0.7 }}>Casual Dining</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#34d399' }}>
                            {budgetStats['$$$'] || 0}
                        </div>
                        <div style={{ opacity: 0.7 }}>Premium</div>
                    </div>
                </div>
            </div>
        </div>
    )
}