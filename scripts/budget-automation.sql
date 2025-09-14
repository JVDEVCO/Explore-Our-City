-- ============================================================
-- BUDGET CATEGORY AUTOMATION SCRIPT
-- Fixes 20,000+ restaurants with missing budget categories
-- Uses actual budget values: budget, mid-range, upscale, luxury, ultra-luxury
-- ============================================================

-- Step 1: Audit current budget category distribution
SELECT 
  budget_category,
  COUNT(*) as count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM restaurants)), 1) as percentage
FROM restaurants 
GROUP BY budget_category
ORDER BY count DESC;

-- ============================================================
-- PHASE 1: CHAIN RESTAURANT AUTOMATION (IMMEDIATE IMPACT)
-- ============================================================

-- Update known chain restaurants with standard budget categories
UPDATE restaurants 
SET budget_category = 
  CASE 
    -- Quick Bite (budget) - Under $25/person
    WHEN name ILIKE '%subway%' OR name ILIKE '%chipotle%' OR name ILIKE '%panera bread%' THEN 'budget'
    WHEN name ILIKE '%starbucks%' OR name ILIKE '%dunkin%' OR name ILIKE '%mcdonald%' THEN 'budget'
    WHEN name ILIKE '%taco bell%' OR name ILIKE '%kfc%' OR name ILIKE '%pollo tropical%' THEN 'budget'
    WHEN name ILIKE '%jimmy john%' OR name ILIKE '%jersey mike%' OR name ILIKE '%firehouse%' THEN 'budget'
    
    -- Casual Dining (mid-range) - $25-60/person
    WHEN name ILIKE '%shake shack%' OR name ILIKE '%five guys%' OR name ILIKE '%in-n-out%' THEN 'mid-range'
    WHEN name ILIKE '%yard house%' OR name ILIKE '%pf chang%' OR name ILIKE '%cheesecake factory%' THEN 'mid-range'
    WHEN name ILIKE '%olive garden%' OR name ILIKE '%red lobster%' OR name ILIKE '%outback%' THEN 'mid-range'
    WHEN name ILIKE '%applebee%' OR name ILIKE '%chili%' OR name ILIKE '%tgif%' THEN 'mid-range'
    WHEN name ILIKE '%buffalo wild%' OR name ILIKE '%hooters%' OR name ILIKE '%dave & buster%' THEN 'mid-range'
    
    -- Fine Dining (upscale) - $60-120/person
    WHEN name ILIKE '%capital grille%' OR name ILIKE '%morton%' OR name ILIKE '%smith & wollensky%' THEN 'upscale'
    WHEN name ILIKE '%flemings%' OR name ILIKE '%ocean prime%' OR name ILIKE '%seasons 52%' THEN 'upscale'
    WHEN name ILIKE '%eddie v%' OR name ILIKE '%mastro%' OR name ILIKE '%del frisco%' THEN 'upscale'
    
    -- Luxury Experience (luxury) - $120-300/person
    WHEN name ILIKE '%ruth chris%' OR name ILIKE '%joe''s stone crab%' OR name ILIKE '%prime 112%' THEN 'luxury'
    WHEN name ILIKE '%cut%' OR name ILIKE '%katsuya%' OR name ILIKE '%boa%' THEN 'luxury'
    
    -- Ultra-Luxury (ultra-luxury) - $300+/person
    WHEN name ILIKE '%nobu%' OR name ILIKE '%carbone%' OR name ILIKE '%zuma%' THEN 'ultra-luxury'
    WHEN name ILIKE '%cipriani%' OR name ILIKE '%hakkasan%' OR name ILIKE '%makoto%' THEN 'ultra-luxury'
    
    ELSE budget_category
  END
WHERE budget_category IS NULL;

-- Check how many restaurants were updated by chain logic
SELECT 
  'Chain restaurants updated' as category,
  COUNT(*) as updated_count
FROM restaurants 
WHERE budget_category IS NOT NULL
  AND (name ILIKE '%shake shack%' OR name ILIKE '%five guys%' OR name ILIKE '%nobu%' 
       OR name ILIKE '%starbucks%' OR name ILIKE '%chipotle%' OR name ILIKE '%ruth chris%');

-- ============================================================
-- PHASE 2: CUISINE-BASED STATISTICAL MODELING
-- ============================================================

-- Calculate most common budget category for each cuisine type
WITH cuisine_budget_stats AS (
  SELECT 
    primary_cuisine,
    budget_category,
    COUNT(*) as count,
    ROW_NUMBER() OVER (PARTITION BY primary_cuisine ORDER BY COUNT(*) DESC) as rank
  FROM restaurants 
  WHERE budget_category IS NOT NULL
    AND primary_cuisine IS NOT NULL
  GROUP BY primary_cuisine, budget_category
),
dominant_cuisine_budgets AS (
  SELECT 
    primary_cuisine, 
    budget_category,
    count
  FROM cuisine_budget_stats 
  WHERE rank = 1
    AND count >= 3  -- Only use patterns with at least 3 examples
)
-- Apply statistical patterns to restaurants without budget categories
UPDATE restaurants 
SET budget_category = dcb.budget_category
FROM dominant_cuisine_budgets dcb
WHERE restaurants.primary_cuisine = dcb.primary_cuisine
  AND restaurants.budget_category IS NULL;

-- Show cuisine-based assignments made
SELECT 
  dcb.primary_cuisine,
  dcb.budget_category,
  COUNT(r.id) as restaurants_updated
FROM dominant_cuisine_budgets dcb
JOIN restaurants r ON r.primary_cuisine = dcb.primary_cuisine
WHERE r.budget_category = dcb.budget_category
GROUP BY dcb.primary_cuisine, dcb.budget_category
ORDER BY restaurants_updated DESC;

-- ============================================================
-- PHASE 3: NEIGHBORHOOD-BASED PATTERNS
-- ============================================================

-- Apply neighborhood premium patterns for high-end areas
UPDATE restaurants 
SET budget_category = 
  CASE 
    -- Ultra-luxury neighborhoods - bump up categories
    WHEN neighborhood IN ('Fisher Island', 'Star Island', 'Bal Harbour') 
         AND budget_category = 'upscale' THEN 'luxury'
    WHEN neighborhood IN ('Fisher Island', 'Star Island') 
         AND budget_category = 'mid-range' THEN 'upscale'
    
    -- High-end neighborhoods - moderate bump
    WHEN neighborhood IN ('South Beach', 'Design District', 'Coral Gables') 
         AND budget_category = 'budget' THEN 'mid-range'
    
    ELSE budget_category
  END
WHERE budget_category IS NOT NULL;

-- ============================================================
-- PHASE 4: CUISINE-SPECIFIC LOGIC
-- ============================================================

-- Apply cuisine-specific budget logic for remaining NULL entries
UPDATE restaurants 
SET budget_category = 
  CASE 
    -- Fine dining cuisines typically upscale or higher
    WHEN primary_cuisine IN ('French', 'Contemporary', 'Modern American') 
         AND budget_category IS NULL THEN 'upscale'
    
    -- Steakhouses typically luxury
    WHEN primary_cuisine = 'Steakhouse' AND budget_category IS NULL THEN 'luxury'
    
    -- Casual cuisines typically mid-range
    WHEN primary_cuisine IN ('Pizza', 'Burgers', 'Deli', 'Sandwiches') 
         AND budget_category IS NULL THEN 'mid-range'
    
    -- Quick service cuisines typically budget
    WHEN primary_cuisine IN ('Fast Food', 'Takeout', 'Food Truck') 
         AND budget_category IS NULL THEN 'budget'
    
    -- Ethnic cuisines typically mid-range
    WHEN primary_cuisine IN ('Cuban', 'Latin', 'Mexican', 'Chinese', 'Thai', 'Vietnamese') 
         AND budget_category IS NULL THEN 'mid-range'
    
    -- Upscale ethnic cuisines
    WHEN primary_cuisine IN ('Japanese', 'Sushi', 'Italian') 
         AND budget_category IS NULL THEN 'upscale'
    
    ELSE budget_category
  END
WHERE budget_category IS NULL;

-- ============================================================
-- PHASE 5: FINAL CLEANUP AND VERIFICATION
-- ============================================================

-- Handle any remaining NULL entries with default mid-range
UPDATE restaurants 
SET budget_category = 'mid-range'
WHERE budget_category IS NULL
  AND primary_cuisine IS NOT NULL;

-- Final audit - show results
SELECT 
  budget_category,
  COUNT(*) as count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM restaurants)), 1) as percentage
FROM restaurants 
GROUP BY budget_category
ORDER BY 
  CASE budget_category
    WHEN 'budget' THEN 1
    WHEN 'mid-range' THEN 2  
    WHEN 'upscale' THEN 3
    WHEN 'luxury' THEN 4
    WHEN 'ultra-luxury' THEN 5
    ELSE 6
  END;

-- Show remaining NULL entries for manual review
SELECT 
  COUNT(*) as remaining_null_count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM restaurants)), 1) as percentage_null
FROM restaurants 
WHERE budget_category IS NULL;

-- Sample remaining NULL entries for investigation
SELECT 
  name, 
  primary_cuisine, 
  neighborhood, 
  address
FROM restaurants 
WHERE budget_category IS NULL
LIMIT 20;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check distribution by neighborhood
SELECT 
  neighborhood,
  budget_category,
  COUNT(*) as count
FROM restaurants 
WHERE budget_category IS NOT NULL
GROUP BY neighborhood, budget_category
ORDER BY neighborhood, count DESC;

-- Check high-end restaurants are properly categorized
SELECT 
  name,
  primary_cuisine,
  neighborhood,
  budget_category
FROM restaurants 
WHERE name ILIKE '%carbone%' 
   OR name ILIKE '%nobu%' 
   OR name ILIKE '%zuma%'
   OR name ILIKE '%prime 112%'
   OR name ILIKE '%joe''s stone crab%'
ORDER BY name;