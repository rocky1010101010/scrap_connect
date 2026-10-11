// ScrapConnect initial datasets and constants
// Aligned with the report prototype and sample listings

export const DEFAULT_USER_LOCATION = {
  name: "Kozhikode Center",
  area: "Kozhikode, Kerala",
  latitude: 11.4996,
  longitude: 75.7982
};

export const LOCATION_PRESETS = [
  {
    name: "Kozhikode Center (Default)",
    area: "Mavoor Rd, Kozhikode",
    latitude: 11.4996,
    longitude: 75.7982
  },
  {
    name: "Kozhikode Beach",
    area: "Beach Rd, Kozhikode",
    latitude: 11.2588,
    longitude: 75.7674
  },
  {
    name: "Calicut Cyberpark",
    area: "Palazhi, Kozhikode",
    latitude: 11.2854,
    longitude: 75.8756
  },
  {
    name: "Kochi Marine Drive",
    area: "Ernakulam, Kochi",
    latitude: 9.9816,
    longitude: 76.2799
  },
  {
    name: "Bengaluru Tech Hub",
    area: "Koramangala, Bengaluru",
    latitude: 12.9352,
    longitude: 77.6245
  }
];

export const INITIAL_LISTINGS = [
  {
    itemId: "S1",
    material: "Copper Wire",
    title: "Copper Wire - 40kg",
    quantity_kg: 40,
    price_per_kg: 550,
    latitude: 11.4995,
    longitude: 75.8000,
    sellerName: "S1: Green Scrap Hub",
    sellerPhone: "+91 98470 12345",
    verified: true,
    rating: 4.9,
    reviewsCount: 38,
    image: "./assets/copper.jpg",
    colorHex: "#b87333",
    description: "Clean industrial bright bare copper wire stripped from heavy machinery. Purity > 99.8%, dry storage, zero insulation remnants.",
    grade: "Grade 1 Bare Copper (Millberry)",
    address: "Shop 14, Old Market Yard, Mavoor Rd",
    badge: "Nearby Star",
    sdgImpact: {
      co2SavedKg: 132,
      energySavedKwh: 480
    }
  },
  {
    itemId: "S3",
    material: "Cardboard",
    title: "Cardboard - 100kg",
    quantity_kg: 100,
    price_per_kg: 8,
    latitude: 11.5100,
    longitude: 75.8100,
    sellerName: "S3: EcoBox Recycling",
    sellerPhone: "+91 94471 88990",
    verified: true,
    rating: 4.8,
    reviewsCount: 52,
    image: "./assets/cardboard.jpg",
    colorHex: "#8d7b68",
    description: "Dry corrugated carton boxes compressed and bundled with jute twine. Ready for paper mills and eco-packaging conversion.",
    grade: "OCC (Old Corrugated Containers)",
    address: "Plot 8, Link Rd Industrial Shed",
    badge: "Bulk Ready",
    sdgImpact: {
      co2SavedKg: 90,
      treesPreserved: 2
    }
  },
  {
    itemId: "S4",
    material: "Aluminium Scrap",
    title: "Aluminium Scrap - 60kg",
    quantity_kg: 60,
    price_per_kg: 120,
    latitude: 11.4600,
    longitude: 75.7600,
    sellerName: "S4: City Alloy Works",
    sellerPhone: "+91 97455 33221",
    verified: true,
    rating: 4.6,
    reviewsCount: 24,
    image: "./assets/aluminium.jpg",
    colorHex: "#90a4ae",
    description: "Window frame profiles, clean structural aluminium offcuts, and de-coated extrusions. High smelting yield with minimal dross.",
    grade: "6063 Architectural Scrap",
    address: "Kallai Timber Road Depot",
    badge: "Verified Yard",
    sdgImpact: {
      co2SavedKg: 492,
      bauxiteSavedKg: 240
    }
  },
  {
    itemId: "S2",
    material: "Copper Wire",
    title: "Copper Wire - 25kg",
    quantity_kg: 25,
    price_per_kg: 530,
    latitude: 11.6000,
    longitude: 76.0000,
    sellerName: "S2: Malabar Metal Traders",
    sellerPhone: "+91 99950 44556",
    verified: true,
    rating: 4.7,
    reviewsCount: 19,
    image: "./assets/copper.jpg",
    colorHex: "#c87d55",
    description: "Heavy gauge stripped electrical wiring coils from residential renovation. Untangled and weighed on digital certified scales.",
    grade: "Berry Copper Wire",
    address: "Thamarassery Bypass Junction",
    badge: "Regional Supplier",
    sdgImpact: {
      co2SavedKg: 82,
      energySavedKwh: 300
    }
  },
  {
    itemId: "S5",
    material: "E-Waste Circuit Boards",
    title: "E-Waste PCBs - 15kg",
    quantity_kg: 15,
    price_per_kg: 320,
    latitude: 11.5200,
    longitude: 75.7800,
    sellerName: "S5: CircuitLoop Tech Hub",
    sellerPhone: "+91 98951 77665",
    verified: true,
    rating: 5.0,
    reviewsCount: 41,
    image: "./assets/ewaste.jpg",
    colorHex: "#2e7d32",
    description: "High-grade telecommunications and server motherboard scrap. Unpicked components, gold-plated connectors, strictly sorted.",
    grade: "Telecom / Server Grade A",
    address: "Near Civil Station, Wayanad Road",
    badge: "Certified E-Recycler",
    sdgImpact: {
      co2SavedKg: 145,
      preciousMetalRecycledG: 18
    }
  },
  {
    itemId: "S6",
    material: "Aluminium Scrap",
    title: "Aluminium Cans - 35kg",
    quantity_kg: 35,
    price_per_kg: 115,
    latitude: 11.5300,
    longitude: 75.8200,
    sellerName: "S6: Circular Metals & Cans",
    sellerPhone: "+91 97460 11998",
    verified: false,
    rating: 4.5,
    reviewsCount: 14,
    image: "./assets/aluminium.jpg",
    colorHex: "#78909c",
    description: "Crushed Used Beverage Cans (UBC) gathered from community recycling bins. Cleaned, rinsed, ready for remelt ingot casting.",
    grade: "UBC Baled Cans",
    address: "West Hill Marine Yard",
    badge: "Eco Collector",
    sdgImpact: {
      co2SavedKg: 287,
      landfillVolumeM3: 1.2
    }
  }
];

export const MATERIAL_CATEGORIES = [
  { id: "all", label: "All Items", icon: "✨" },
  { id: "copper", label: "Copper Wire", icon: "⚡", searchKey: "copper" },
  { id: "cardboard", label: "Cardboard", icon: "📦", searchKey: "cardboard" },
  { id: "aluminium", label: "Aluminium Scrap", icon: "🔩", searchKey: "aluminium" },
  { id: "ewaste", label: "E-Waste", icon: "💻", searchKey: "e-waste" }
];
