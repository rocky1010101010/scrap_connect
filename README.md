# ♻️ ScrapConnect — Location-Based Scrap Collection Marketplace

**Sustainable Scrap Recycling through Proximity-Driven Discovery and NGO Sourcing**  
*Aligned with UN Sustainable Development Goals: **SDG 12** (Responsible Consumption and Production) & **SDG 11** (Sustainable Cities and Communities).*

---

## 🌟 Overview

**ScrapConnect** transforms the informal, fragmented scrap collection economy into an organized circular marketplace. Using the **Haversine great-circle distance algorithm**, the application ranks listings nearest to the buyer/recycler first, slashing procurement miles and carbon footprint. Non-Governmental Organisations (NGOs) and recyclers can execute consolidated bulk orders that aggregate materials across multiple nearby sellers before committing to pickup.

---

## 📱 User Interface Screens (Replicating the Design Reference)

The web application features two viewing modes:

1. **Triple Wireframe Showcase (Default)**: Directly mirrors the 3-screen mobile wireframe from the reference design side-by-side in realistic smartphone frames:
   - **Screen 1 — Homepage (Nearest Listings First)**:
     - Search bar (`Search scrap...`)
     - Category filters: *All*, *Copper Wire*, *Cardboard*, *Aluminium Scrap*, *E-Waste*
     - "Nearest to you" list strictly sorted ascending by Haversine distance (`0.2 km`, `1.7 km`, `6.1 km`, etc.)
     - One-tap banner: **NGO Bulk Order** (Request large quantities)
     - One-tap banner: **Premium: Free Delivery** (Upgrade for free pickup)
     - Bottom Navigation: `Home`, `Search`, `Orders`
   - **Screen 2 — Search Results (Nearest Match Ranked First)**:
     - Live search query box with green border (`"copper"`)
     - Subtitle indicator: `Sorted by distance` + match count
     - Closest match highlighting (`S1: Copper Wire • 0.2 km`) with interactive `[View]` button
     - Secondary match (`S2: Copper Wire • 24.7 km`)
   - **Screen 3 — NGO Bulk Order Feasibility Check**:
     - Material selection (`Copper Wire`, `Cardboard`, `Aluminium`, etc.)
     - Quantity needed input (`50 kg`)
     - Maximum search radius control (`30 km`)
     - Green action button: **Check Availability**
     - Dynamic feasibility verdict box:
       - **Available:** `65 kg`
       - **Avg price:** `Rs. 542/kg` (weighted blended price calculation)
       - **Status:** `Feasible` (or `Shortfall` with needed deficit)
       - **Across 2 nearby sellers** with itemized breakdown
       - **Place Consolidated Bulk Order** button

2. **Unified Responsive App Mode**:
   - Clean, full-featured web app with tab navigation (`Home`, `Search`, `NGO Bulk`, `Live Map`, `Orders`).
   - **Interactive Leaflet.js Map** displaying user GPS pin (with pulsing radius ring) and all scrap seller pins.
   - **Post Listing Modal (Seller Portal)** allowing sellers to list new scrap batches in real time.
   - **Location Switcher Modal** with presets (Kozhikode Center, Beach, Cyberpark, Kochi, Bengaluru) or real device GPS.
   - **Orders Management & Circular Receipts** tracking pickup status and kg of CO2 equivalent diverted from landfill.

---

## 📐 Object-Oriented Programming (OOP) Architecture

The application adheres to the OOP principles outlined in the project report:

### 1. `ScrapListing` Class
Encapsulates each scrap item's metadata and self-contained distance calculations:
- `itemId`, `material`, `quantity_kg`, `price_per_kg`, `latitude`, `longitude`, `sellerName`, `image`, `grade`, `sdgImpact`.
- `distanceFrom(userLat, userLon)`: Computes great-circle distance in kilometres using the Haversine formula:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- `totalValue()`: Returns `quantity_kg * price_per_kg`.

### 2. `Marketplace` Class
Encapsulates aggregation, ranking, and search logic without exposing internal distance math:
- `nearbyListings(userLat, userLon, categoryKey)`: Returns all listings sorted ascending by distance.
- `search(keyword, userLat, userLon)`: Keyword filter preserving nearest-first proximity ranking.
- `bulkOrderQuote(material, minQuantityKg, maxDistanceKm, userLat, userLon)`: Aggregates total available kilograms and calculates weighted average price:
  $$\text{Average Price} = \frac{\sum (\text{quantity}_i \times \text{price}_i)}{\sum \text{quantity}_i}$$

---

## 🚀 Running the Web Application

The project is already initialized in:
`C:\Users\khris\.gemini\antigravity-ide\scratch\scrapconnect`

### Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Verify Logic via Node.js
```bash
node --input-type=module -e "import { Marketplace } from './app.js'; import { INITIAL_LISTINGS, DEFAULT_USER_LOCATION } from './data.js'; const m = new Marketplace(); m.loadInitialData(INITIAL_LISTINGS); console.log(m.bulkOrderQuote('Copper Wire', 50, 100, DEFAULT_USER_LOCATION.latitude, DEFAULT_USER_LOCATION.longitude));"
```

---

## 🌍 UN Sustainable Development Goals (SDG) Alignment
- **SDG 12 (Responsible Consumption & Production)**: Diverts valuable recyclable metal, cardboard, and e-waste from landfills back into regional supply chains.
- **SDG 11 (Sustainable Cities & Communities)**: Minimizes logistical fuel burn by prioritizing neighborhood sellers within walking/micro-freight distance.
