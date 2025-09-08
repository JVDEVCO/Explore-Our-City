import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://znivqcrfuuchakybws.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuaXZxY3JoZnV1Y2hha3ZibHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjExMjcsImV4cCI6MjA3MTUzNzEyN30.l7WrHpCqK6wcebIdH36rqVvtR6VdzNW2cRMjqA8paX8'
)

async function executeMigration() {
    console.log('Starting complete Miami platform migration...')

    const { data, error } = await supabase.rpc('sql', {
        query: `
-- Create wine bar category
INSERT INTO categories (name, slug, category_type) 
SELECT 'Wine Bar', 'wine-bar', 'entertainment'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'wine-bar');

DO $$
DECLARE
    business_record RECORD;
    restaurant_count INTEGER := 0;
    bar_count INTEGER := 0;
    nightclub_count INTEGER := 0;
    hotel_count INTEGER := 0;
    total_migrated INTEGER := 0;
    mapped_bar_type TEXT;
BEGIN
    FOR business_record IN SELECT * FROM businesses LOOP
        -- RESTAURANTS (cuisine_type or restaurant keywords)
        IF business_record.cuisine_type IS NOT NULL 
           OR LOWER(business_record.name) LIKE '%restaurant%'
           OR LOWER(business_record.name) LIKE '%grill%'
           OR LOWER(business_record.name) LIKE '%bistro%'
           OR LOWER(business_record.name) LIKE '%cafe%'
           OR LOWER(business_record.name) LIKE '%eatery%'
           OR LOWER(business_record.name) LIKE '%kitchen%'
           OR LOWER(business_record.name) LIKE '%dining%' THEN
            
            INSERT INTO restaurants (
                id, name, slug, address, latitude, longitude, 
                phone, website, primary_cuisine, price_range, is_active, created_at
            ) VALUES (
                business_record.id, business_record.name, business_record.slug,
                business_record.address, business_record.latitude, business_record.longitude,
                business_record.phone, business_record.website,
                COALESCE(business_record.cuisine_type, 'american'),
                CASE business_record.price_range
                    WHEN '$' THEN '$'
                    WHEN '$$' THEN '$$'
                    WHEN '$$$' THEN '$$$'
                    WHEN '$$$$' THEN '$$$$'
                    ELSE '$$'
                END,
                true, NOW()
            );
            restaurant_count := restaurant_count + 1;
        
        -- BARS (ALL types including wine bars)
        ELSIF LOWER(business_record.name) LIKE '%bar%' 
           OR LOWER(business_record.name) LIKE '%lounge%'
           OR LOWER(business_record.name) LIKE '%pub%'
           OR LOWER(business_record.name) LIKE '%tavern%'
           OR LOWER(business_record.name) LIKE '%wine%'
           OR LOWER(business_record.name) LIKE '%cocktail%' THEN
            
            -- Map to correct bar_type constraint values
            mapped_bar_type := CASE 
                WHEN LOWER(business_record.name) LIKE '%wine%' THEN 'wine_bar'
                WHEN LOWER(business_record.name) LIKE '%sports%' THEN 'sports_bar'
                WHEN LOWER(business_record.name) LIKE '%cocktail%' OR LOWER(business_record.name) LIKE '%lounge%' THEN 'cocktail_lounge'
                WHEN LOWER(business_record.name) LIKE '%rooftop%' THEN 'rooftop'
                WHEN LOWER(business_record.name) LIKE '%beach%' THEN 'beach_bar'
                WHEN LOWER(business_record.name) LIKE '%beer%' THEN 'beer_hall'
                ELSE 'sports_bar'
            END;
            
            INSERT INTO bars (
                id, name, slug, address, latitude, longitude, 
                phone, website, bar_type, minimum_age, is_active, created_at
            ) VALUES (
                business_record.id, business_record.name, business_record.slug,
                business_record.address, business_record.latitude, business_record.longitude,
                business_record.phone, business_record.website,
                mapped_bar_type, 21, true, NOW()
            );
            bar_count := bar_count + 1;
        
        -- NIGHTCLUBS
        ELSIF LOWER(business_record.name) LIKE '%club%'
           OR LOWER(business_record.name) LIKE '%nightclub%'
           OR LOWER(business_record.name) LIKE '%ultra%' THEN
            
            INSERT INTO nightclubs (
                id, name, slug, address, latitude, longitude, 
                phone, website, club_type, minimum_age, is_active, created_at
            ) VALUES (
                business_record.id, business_record.name, business_record.slug,
                business_record.address, business_record.latitude, business_record.longitude,
                business_record.phone, business_record.website,
                CASE 
                    WHEN LOWER(business_record.name) LIKE '%ultra%' THEN 'ultra_lounge'
                    WHEN LOWER(business_record.name) LIKE '%beach%' THEN 'beach_club'
                    ELSE 'dance_club'
                END,
                21, true, NOW()
            );
            nightclub_count := nightclub_count + 1;
        
        -- HOTELS
        ELSIF LOWER(business_record.name) LIKE '%hotel%'
           OR LOWER(business_record.name) LIKE '%resort%'
           OR LOWER(business_record.name) LIKE '%inn%'
           OR LOWER(business_record.name) LIKE '%suites%' THEN
            
            INSERT INTO hotels (
                id, name, slug, address, latitude, longitude, 
                phone, website, hotel_type, star_rating, is_active, created_at
            ) VALUES (
                business_record.id, business_record.name, business_record.slug,
                business_record.address, business_record.latitude, business_record.longitude,
                business_record.phone, business_record.website,
                CASE business_record.budget_tier
                    WHEN 'ultra' THEN 'luxury'
                    WHEN 'luxury' THEN 'luxury'
                    WHEN 'premium' THEN 'boutique'
                    ELSE 'boutique'
                END,
                CASE business_record.budget_tier
                    WHEN 'ultra' THEN 5
                    WHEN 'luxury' THEN 5
                    WHEN 'premium' THEN 4
                    ELSE 3
                END,
                true, NOW()
            );
            hotel_count := hotel_count + 1;
        
        -- DEFAULT to restaurants
        ELSE
            INSERT INTO restaurants (
                id, name, slug, address, latitude, longitude, 
                phone, website, primary_cuisine, price_range, is_active, created_at
            ) VALUES (
                business_record.id, business_record.name, business_record.slug,
                business_record.address, business_record.latitude, business_record.longitude,
                business_record.phone, business_record.website,
                'american', '$$', true, NOW()
            );
            restaurant_count := restaurant_count + 1;
        END IF;
        
        total_migrated := total_migrated + 1;
    END LOOP;
    
    RAISE NOTICE 'RESTAURANTS: %', restaurant_count;
    RAISE NOTICE 'BARS (including wine bars): %', bar_count;
    RAISE NOTICE 'NIGHTCLUBS: %', nightclub_count;
    RAISE NOTICE 'HOTELS: %', hotel_count;
    RAISE NOTICE 'TOTAL MIGRATED: %', total_migrated;
END;
$$;
    `
    })

    if (error) {
        console.error('Migration Error:', error)
    } else {
        console.log('Migration completed successfully!')
    }
}

executeMigration()