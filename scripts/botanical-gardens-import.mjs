import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const botanicalGardens = [
  {
    name: "Fairchild Tropical Botanic Garden",
    primary_category: "culture",
    activity_type: "nature",
    neighborhood: "Coral Gables", 
    price_tier: 3,
    price_range: "$$$",
    description: "83-acre botanical garden featuring tropical plants, butterfly conservatory, and educational programs",
    address: "10901 Old Cutler Rd, Coral Gables, FL 33156",
    phone: "+13056673651",
    website: "https://www.fairchildgarden.org",
    status: "active",
    tags: [
      "culture", "adventure", "nature", "outdoor", "gardens", "educational", 
      "family", "tourist-attraction", "photography", "walking", "scenic",
      "weather-dependent", "relaxing", "botanical", "tropical", "wildlife"
    ]
  },
  {
    name: "Montgomery Botanical Center", 
    primary_category: "culture",
    activity_type: "nature",
    neighborhood: "Coral Gables",
    price_tier: 2, 
    price_range: "$$",
    description: "120-acre botanical research center with rare palm and cycad collections, guided tours available",
    address: "11901 Old Cutler Rd, Coral Gables, FL 33156", 
    phone: "+3056665885",
    website: "https://www.montgomerybotanical.org",
    status: "active",
    tags: [
      "culture", "adventure", "nature", "outdoor", "gardens", "educational",
      "research", "guided-tours", "rare-plants", "palms", "scientific",
      "weather-dependent", "peaceful", "botanical", "conservation"
    ]
  },
  {
    name: "Pinecrest Gardens",
    primary_category: "culture", 
    activity_type: "nature",
    neighborhood: "Pinecrest",
    price_tier: 2,
    price_range: "$$", 
    description: "20-acre cultural arts park with botanical gardens, events venue, and flamingo habitat",
    address: "11000 Red Rd, Pinecrest, FL 33156",
    phone: "+3053228899", 
    website: "https://www.pinecrest-fl.gov/recreation/pinecrest-gardens",
    status: "active",
    tags: [
      "culture", "adventure", "nature", "outdoor", "gardens", "arts",
      "events", "family", "flamingos", "wildlife", "cultural-events", 
      "weather-dependent", "photography", "walking", "community"
    ]
  },
  {
    name: "The Kampong Garden",
    primary_category: "culture",
    activity_type: "nature", 
    neighborhood: "Coconut Grove",
    price_tier: 3,
    price_range: "$$$",
    description: "9-acre National Tropical Botanical Garden with rare fruit trees and historic home tours",
    address: "4013 Douglas Rd, Coconut Grove, FL 33133",
    phone: "+3054426866",
    website: "https://ntbg.org/gardens/kampong", 
    status: "active",
    tags: [
      "culture", "adventure", "nature", "outdoor", "gardens", "historic",
      "educational", "rare-plants", "fruit-trees", "guided-tours",
      "tropical", "research", "weather-dependent", "scenic", "botanical"
    ]
  }
]

async function importBotanicalGardens() {
  console.log('Importing botanical gardens...')
  
  const { data, error } = await supabase
    .from('activities')
    .insert(botanicalGardens)
    
  if (error) {
    console.error('Import error:', error)
  } else {
    console.log(`Successfully imported ${data.length} botanical gardens`)
    console.log('Added venues:', data.map(d => d.name))
  }
}

importBotanicalGardens()
