cat > scripts/complete-schema.sql << 'EOF'
-- Complete Miami Beach Hospitality Platform Database Schema

-- Enhanced businesses table with all restaurant data
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS hours_of_operation JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS accepts_reservations BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS parking_info TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dress_code TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cuisine_type TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS average_meal_cost DECIMAL(8,2);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gratuity_included BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tax_warning TEXT DEFAULT 'Includes 3% city taxes (2% tourism + 1% social services)';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('restaurant', 'bar', 'club', 'cheap_eats', 'hotel', 'experience'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS miami_api_id INTEGER UNIQUE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- User profiles with preferences and loyalty data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  dining_preferences JSONB DEFAULT '{}',
  budget_preference TEXT CHECK (budget_preference IN ('budget', 'moderate', 'upscale', 'luxury')) DEFAULT 'moderate',
  loyalty_tier TEXT CHECK (loyalty_tier IN ('explorer', 'insider', 'vip', 'elite')) DEFAULT 'explorer',
  total_visits INTEGER DEFAULT 0,
  total_spend DECIMAL(12,2) DEFAULT 0,
  average_party_size INTEGER DEFAULT 2,
  preferred_booking_times TEXT[] DEFAULT '{}',
  special_occasions JSONB DEFAULT '{}',
  social_influence_score INTEGER DEFAULT 0,
  prefers_cheap_eats BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Two-way review system: Users review businesses (public)
CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  title TEXT,
  review_text TEXT,
  food_rating INTEGER CHECK (food_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  ambiance_rating INTEGER CHECK (ambiance_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  visit_date DATE,
  party_size INTEGER,
  occasion TEXT,
  photos TEXT[] DEFAULT '{}',
  helpful_votes INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Two-way review system: Businesses review users (private to businesses)
CREATE TABLE IF NOT EXISTS vendor_user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES auth.users(id), -- business owner account
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reliability_rating INTEGER CHECK (reliability_rating BETWEEN 1 AND 5),
  spending_rating INTEGER CHECK (spending_rating BETWEEN 1 AND 5),
  behavior_rating INTEGER CHECK (behavior_rating BETWEEN 1 AND 5),
  influence_rating INTEGER CHECK (influence_rating BETWEEN 1 AND 5),
  would_welcome_back BOOLEAN,
  private_notes TEXT,
  visit_date TIMESTAMP,
  reservation_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Premium access and "buy your way in" features
CREATE TABLE IF NOT EXISTS premium_access_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  offer_type TEXT CHECK (offer_type IN ('fully_booked_premium', 'members_only_day_pass', 'vip_upgrade', 'priority_seating')),
  title TEXT NOT NULL,
  description TEXT,
  original_price DECIMAL(10,2),
  premium_price DECIMAL(10,2) NOT NULL,
  available_slots INTEGER,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  restrictions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty program tracking
CREATE TABLE IF NOT EXISTS loyalty_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  visit_date TIMESTAMP DEFAULT NOW(),
  amount_spent DECIMAL(10,2),
  points_earned INTEGER DEFAULT 0,
  tier_at_visit TEXT CHECK (tier_at_visit IN ('explorer', 'insider', 'vip', 'elite')),
  benefits_used JSONB DEFAULT '{}',
  reservation_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-paid benefits and credits
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  credit_type TEXT CHECK (credit_type IN ('cocktail', 'dining_dollars', 'experience_pass')),
  purchased_amount DECIMAL(10,2),
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  remaining_balance DECIMAL(10,2),
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Members-only clubs
CREATE TABLE IF NOT EXISTS members_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  club_type TEXT CHECK (club_type IN ('social', 'beach', 'rooftop', 'speakeasy', 'wine', 'business')),
  description TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  membership_fee DECIMAL(10,2),
  day_pass_price DECIMAL(10,2),
  dress_code TEXT,
  age_requirement INTEGER DEFAULT 21,
  amenities TEXT[] DEFAULT '{}',
  operating_hours JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reservations system
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')) DEFAULT 'pending',
  special_requests TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  estimated_cost DECIMAL(10,2),
  premium_access_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cost transparency tracking
CREATE TABLE IF NOT EXISTS cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  estimated_base_cost DECIMAL(8,2),
  gratuity_percentage DECIMAL(5,2) DEFAULT 20.00,
  city_tax_percentage DECIMAL(5,2) DEFAULT 3.00,
  total_estimated_cost DECIMAL(8,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_access_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_estimates ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later)
CREATE POLICY "Public businesses" ON businesses FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public user reviews" ON user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON user_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Vendors can view own reviews" ON vendor_user_reviews FOR ALL USING (auth.uid() = vendor_id);
EOF
