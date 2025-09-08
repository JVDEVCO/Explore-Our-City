export default function RestaurantCard({ restaurant }) {
    return (
        <div style={{
            backgroundColor: '#374151',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #4b5563'
        }}>
            <div style={{
                height: '100px',
                backgroundColor: '#4b5563',
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                color: '#9ca3af'
            }}>
                Image
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {restaurant.name}
            </h3>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>
                {restaurant.priceRange} - {restaurant.cuisine}
            </p>
        </div>
    )
}