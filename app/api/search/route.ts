import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

// Helper function for consistent timestamp formatting
function getTimestamp(): string {
  return new Date().toISOString();
}

export async function GET(request: NextRequest) {
  console.log(`[${getTimestamp()}] Search API: Request started`);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(`[${getTimestamp()}] Search API: Missing Supabase environment variables:`, { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    });
    return NextResponse.json(
      { error: 'Server configuration error' }, 
      { status: 500 }
    );
  }

  console.log(`[${getTimestamp()}] Search API: Supabase client created successfully`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const tags = searchParams.get('tags');
  const neighborhood = searchParams.get('neighborhood');
  const city = searchParams.get('city'); // Get city parameter
  
  console.log(`[${getTimestamp()}] Search API: Parameters parsed:`, { query, tags, neighborhood, city });

  // Allow either text query OR tag-based search
  if (!query && !tags) {
    console.log(`[${getTimestamp()}] Search API: Missing required parameters`);
    return NextResponse.json({ error: 'Query or tags parameter required' }, { status: 400 });
  }

  // Handle city parameter - ignore for Miami since all data is Miami area
  // For future expansion to other cities, add filtering logic here
  if (city && city !== 'miami-beaches') {
    console.log(`[${getTimestamp()}] Search API: Non-Miami city requested: ${city} - no data available`);
    return NextResponse.json({
      restaurants: [],
      activities: [],
      expandedFrom: query || tags,
      usedTerms: [],
      total: 0
    });
  }

  let expandedTerms: string[] = [];
  
  if (query) {
    console.log(`[${getTimestamp()}] Search API: Processing text query: ${query}`);
    // Get semantic mappings for text search
    const { data: mappings } = await supabase
      .from('search_mappings')
      .select('mapped_terms, category')
      .eq('search_term', query.toLowerCase());
    
    expandedTerms = mappings?.[0]?.mapped_terms || [query];
  } else if (tags) {
    console.log(`[${getTimestamp()}] Search API: Processing tag search: ${tags}`);
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
    console.log(`[${getTimestamp()}] Search API: Executing parallel restaurant and activity queries`);
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
    
    console.log(`[${getTimestamp()}] Search API: Query results - Restaurants: ${restaurantResults.data?.length || 0}, Activities: ${activityResults.data?.length || 0}`);
    
    return NextResponse.json({
      restaurants: restaurantResults.data || [],
      activities: activityResults.data || [],
      expandedFrom: query || tags,
      usedTerms: expandedTerms,
      total: (restaurantResults.data?.length || 0) + (activityResults.data?.length || 0)
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Search API: Error occurred:`, error);
    return NextResponse.json({
      error: 'Search failed',
      restaurants: [],
      activities: [],
      total: 0
    }, { status: 500 });
  }
}