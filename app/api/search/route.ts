import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const tags = searchParams.get('tags');
  const category = searchParams.get('category');
  const neighborhood = searchParams.get('neighborhood');
  
  // Allow either text query OR tag-based search
  if (!query && !tags) {
    return NextResponse.json({ error: 'Query or tags parameter required' }, { status: 400 });
  }

  let expandedTerms: string[] = [];
  
  if (query) {
    // Get semantic mappings for text search
    const { data: mappings } = await supabase
      .from('search_mappings')
      .select('mapped_terms, category')
      .eq('search_term', query.toLowerCase());
    
    expandedTerms = mappings?.[0]?.mapped_terms || [query];
  } else if (tags) {
    // Use provided tags directly for category-based search
    expandedTerms = tags.split(',').map(tag => tag.trim());
  }
  
  // Search restaurants with expanded terms
  const restaurantConditions = expandedTerms.map(term => 
    `name.ilike.%${term}%,primary_cuisine.ilike.%${term}%,secondary_cuisine.ilike.%${term}%`
  ).join(',');
  
  const restaurantQuery = supabase
    .from('restaurants')
    .select('id, name, primary_cuisine, secondary_cuisine, neighborhood, budget_category, price_range, yelp_rating, address, phone, website, yelp_review_count')
    .or(restaurantConditions)
    .eq('is_active', true)
    .limit(10);
  
  // Search activities with expanded terms
  const activityConditions = expandedTerms.map(term =>
    `name.ilike.%${term}%,description.ilike.%${term}%,activity_type.ilike.%${term}%`
  ).join(',');
  
  const activityQuery = supabase
    .from('activities')
    .select('id, name, primary_category, activity_type, neighborhood, price_tier, price_range, description, address, phone, website, image_url, tags')
    .or(activityConditions)
    .eq('status', 'active')
    .limit(10);
  
  // Execute both searches
  const [restaurantResults, activityResults] = await Promise.all([
    restaurantQuery,
    activityQuery
  ]);
  
  return NextResponse.json({
    restaurants: restaurantResults.data || [],
    activities: activityResults.data || [],
    expandedFrom: query,
    usedTerms: expandedTerms,
    total: (restaurantResults.data?.length || 0) + (activityResults.data?.length || 0)
  });
}