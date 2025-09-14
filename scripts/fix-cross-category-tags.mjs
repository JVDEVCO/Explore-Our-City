import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Venues that should have adventure tags added
const crossCategoryUpdates = [
  {
    name: "Miami Beach Botanical Garden",
    addTags: ["adventure", "nature", "outdoor", "walking", "scenic", "peaceful", "photography"]
  },
  {
    name: "The Selfie Room Miami Beach", 
    addTags: ["adventure", "interactive", "unique-experience"]
  },
  {
    name: "Miami Beach Bandshell",
    addTags: ["adventure", "active", "community"]
  },
  {
    name: "Bentley Beach Club",
    addTags: ["adventure", "water", "beach-access"]
  },
  {
    name: "Art Basel Miami Beach 2016",
    addTags: ["adventure", "cultural-adventure", "exploration"]
  },
  {
    name: "Rooftop Cinema Club South Beach", 
    addTags: ["adventure", "unique-experience", "rooftop-adventure"]
  },
  {
    name: "South Beach Seafood Festival",
    addTags: ["adventure", "culinary-adventure", "outdoor"]
  }
]

// Add adventure tags to waterfront entertainment venues
async function updateWaterfrontVenues() {
  console.log('Updating waterfront venues with adventure tags...')
  
  const { data: waterfrontVenues } = await supabase
    .from('activities')
    .select('id, name, tags')
    .contains('tags', ['waterfront'])
    .eq('primary_category', 'entertainment')
    
  for (const venue of waterfrontVenues || []) {
    const updatedTags = [...venue.tags, 'adventure', 'water', 'scenic', 'outdoor-adventure']
    const uniqueTags = [...new Set(updatedTags)]
    
    await supabase
      .from('activities')
      .update({ tags: uniqueTags })
      .eq('id', venue.id)
      
    console.log(`Updated ${venue.name} with adventure tags`)
  }
}

// Add adventure tags to outdoor entertainment venues  
async function updateOutdoorVenues() {
  console.log('Updating outdoor venues with adventure tags...')
  
  const { data: outdoorVenues } = await supabase
    .from('activities')
    .select('id, name, tags')
    .contains('tags', ['outdoor'])
    .eq('primary_category', 'entertainment')
    
  for (const venue of outdoorVenues || []) {
    const updatedTags = [...venue.tags, 'adventure', 'active', 'nature', 'outdoor-adventure']
    const uniqueTags = [...new Set(updatedTags)]
    
    await supabase
      .from('activities')
      .update({ tags: uniqueTags })
      .eq('id', venue.id)
      
    console.log(`Updated ${venue.name} with adventure tags`)
  }
}

// Update specific venues with targeted tags
async function updateSpecificVenues() {
  console.log('Updating specific venues with cross-category tags...')
  
  for (const update of crossCategoryUpdates) {
    const { data: venue } = await supabase
      .from('activities')
      .select('id, tags')
      .eq('name', update.name)
      .single()
      
    if (venue) {
      const updatedTags = [...venue.tags, ...update.addTags]
      const uniqueTags = [...new Set(updatedTags)]
      
      await supabase
        .from('activities')
        .update({ tags: uniqueTags })
        .eq('id', venue.id)
        
      console.log(`Updated ${update.name} with additional tags:`, update.addTags)
    }
  }
}

async function fixCrossCategoryTagging() {
  await updateWaterfrontVenues()
  await updateOutdoorVenues() 
  await updateSpecificVenues()
  console.log('Cross-category tagging updates complete')
}

fixCrossCategoryTagging()