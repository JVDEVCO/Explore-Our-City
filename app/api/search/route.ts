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
  let restaurantQuery = supabase
    .from('restaurants')
    .select('id, name, primary_cuisine, secondary_cuisine, neighborhood, budget_category, price_range, yelp_rating, address, phone, website, yelp_review_count, image_url')
    .eq('is_active', true)
    .limit(50);

  // Build OR conditions properly
  const restaurantOrConditions = expandedTerms.map(term => 
    `name.ilike.%${term}%,primary_cuisine.ilike.%${term}%,secondary_cuisine.ilike.%${term}%`
  ).join(',');
  
  if (restaurantOrConditions) {
    restaurantQuery = restaurantQuery.or(restaurantOrConditions);
  }
  
  // Search activities with expanded terms
  let activityQuery = supabase
    .from('activities')
    .select('id, name, primary_category, activity_type, neighborhood, price_tier, price_range, description, address, phone, website, image_url, tags')
    .eq('status', 'active')
    .limit(50);

  // Build OR conditions properly for activities
  const activityOrConditions = expandedTerms.map(term =>
    `name.ilike.%${term}%,description.ilike.%${term}%,activity_type.ilike.%${term}%,tags.cs.{${term}}`
  ).join(',');
  
  if (activityOrConditions) {
    activityQuery = activityQuery.or(activityOrConditions);
  }
  
  // Add neighborhood filter if provided
  if (neighborhood && neighborhood !== 'all') {
    restaurantQuery = restaurantQuery.eq('neighborhood', neighborhood);
    activityQuery = activityQuery.eq('neighborhood', neighborhood);
  }
  
  // Execute both searches
  try {
    const [restaurantResults, activityResults] = await Promise.all([
      restaurantQuery,
      activityQuery
    ]);
    
    // Check for errors in the database queries
    if (restaurantResults.error) {
      console.error('Restaurant query error:', restaurantResults.error);
    }
    
    if (activityResults.error) {
      console.error('Activity query error:', activityResults.error);
    }
    
    return NextResponse.json({
      restaurants: restaurantResults.data || [],
      activities: activityResults.data || [],
      expandedFrom: query || tags,
      usedTerms: expandedTerms,
      total: (restaurantResults.data?.length || 0) + (activityResults.data?.length || 0)
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      error: 'Search failed',
      restaurants: [],
      activities: [],
      total: 0
    }, { status: 500 });
  }
}