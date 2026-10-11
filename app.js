import { INITIAL_LISTINGS, DEFAULT_USER_LOCATION, LOCATION_PRESETS, MATERIAL_CATEGORIES } from './data.js';

const globalScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});

/**
 * ScrapListing Class
 * Encapsulates listing data and distance computation using the Haversine formula
 */
export class ScrapListing {
  constructor(data) {
    this.itemId = data.itemId;
    this.material = data.material;
    this.title = data.title || `${data.material} - ${data.quantity_kg}kg`;
    this.quantity_kg = Number(data.quantity_kg);
    this.price_per_kg = Number(data.price_per_kg);
    this.latitude = Number(data.latitude);
    this.longitude = Number(data.longitude);
    this.sellerName = data.sellerName || `Seller ${data.itemId}`;
    this.sellerPhone = data.sellerPhone || '+91 98000 00000';
    this.verified = Boolean(data.verified);
    this.rating = data.rating || 4.8;
    this.reviewsCount = data.reviewsCount || 12;
    this.image = data.image || './assets/copper.jpg';
    this.colorHex = data.colorHex || '#2e7d32';
    this.description = data.description || 'Clean sorted scrap ready for local collection and circular recycling.';
    this.grade = data.grade || 'Standard Recyclable Grade';
    this.address = data.address || 'Local Yard, Kozhikode';
    this.badge = data.badge || 'Verified';
    this.sdgImpact = data.sdgImpact || {
      co2SavedKg: Math.round(data.quantity_kg * 2.8),
      energySavedKwh: Math.round(data.quantity_kg * 8.5)
    };
  }

  /**
   * Great-circle distance (km) from user coordinates using the Haversine formula
   * R = 6371 km (Earth mean radius)
   */
  distanceFrom(userLat, userLon) {
    const R = 6371;
    const toRad = deg => (deg * Math.PI) / 180;
    const phi1 = toRad(userLat);
    const phi2 = toRad(this.latitude);
    const dPhi = toRad(this.latitude - userLat);
    const dLambda = toRad(this.longitude - userLon);

    const a =
      Math.sin(dPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Total commercial value of the listing batch
   */
  totalValue() {
    return this.quantity_kg * this.price_per_kg;
  }
}

/**
 * Marketplace Class
 * Manages listings collection, nearest-first ranking, search, and bulk order aggregation
 */
export class Marketplace {
  constructor() {
    this.listings = [];
  }

  addListing(listingData) {
    const listing = listingData instanceof ScrapListing ? listingData : new ScrapListing(listingData);
    this.listings.push(listing);
    return listing;
  }

  loadInitialData(seedArray) {
    this.listings = seedArray.map(item => new ScrapListing(item));
  }

  /**
   * Return listings sorted nearest-first (used for Homepage)
   */
  nearbyListings(userLat, userLon, categoryKey = 'all') {
    let filtered = [...this.listings];
    if (categoryKey && categoryKey !== 'all') {
      const cat = MATERIAL_CATEGORIES.find(c => c.id === categoryKey);
      if (cat && cat.searchKey) {
        filtered = filtered.filter(item =>
          item.material.toLowerCase().includes(cat.searchKey.toLowerCase())
        );
      }
    }
    return filtered.sort((a, b) => a.distanceFrom(userLat, userLon) - b.distanceFrom(userLat, userLon));
  }

  /**
   * Keyword search sorted nearest-first (used for Search Screen)
   */
  search(keyword, userLat, userLon) {
    const cleanKey = (keyword || '').trim().toLowerCase();
    const matches = this.listings.filter(item => {
      if (!cleanKey) return true;
      return (
        item.material.toLowerCase().includes(cleanKey) ||
        item.title.toLowerCase().includes(cleanKey) ||
        item.itemId.toLowerCase().includes(cleanKey) ||
        item.description.toLowerCase().includes(cleanKey)
      );
    });
    return matches.sort((a, b) => a.distanceFrom(userLat, userLon) - b.distanceFrom(userLat, userLon));
  }

  /**
   * NGO bulk order quote: aggregates quantity across nearby sellers
   */
  bulkOrderQuote(materialName, minQuantityKg, maxDistanceKm = 100, userLat, userLon) {
    const target = (materialName || '').trim().toLowerCase();
    const matching = this.listings
      .filter(item => item.material.toLowerCase().includes(target))
      .filter(item => {
        if (!maxDistanceKm) return true;
        return item.distanceFrom(userLat, userLon) <= maxDistanceKm;
      })
      .sort((a, b) => a.distanceFrom(userLat, userLon) - b.distanceFrom(userLat, userLon));

    const totalQty = matching.reduce((sum, item) => sum + item.quantity_kg, 0);
    const totalVal = matching.reduce((sum, item) => sum + item.totalValue(), 0);
    const avgPrice = totalQty > 0 ? totalVal / totalQty : 0;
    const meetsRequirement = totalQty >= minQuantityKg;
    const shortfall = Math.max(0, minQuantityKg - totalQty);

    return {
      material: materialName,
      minQuantityKg,
      total_available_kg: totalQty,
      average_price_per_kg: Number(avgPrice.toFixed(2)),
      meets_requirement: meetsRequirement,
      shortfall_kg: shortfall,
      sellerCount: matching.length,
      matchingSellers: matching.map(item => ({
        itemId: item.itemId,
        material: item.material,
        quantity_kg: item.quantity_kg,
        price_per_kg: item.price_per_kg,
        distance_km: item.distanceFrom(userLat, userLon),
        sellerName: item.sellerName,
        total_value: item.totalValue()
      }))
    };
  }
}

// ---------------------------------------------------------------------------
// App State & Controller
// ---------------------------------------------------------------------------

export const state = {
  marketplace: new Marketplace(),
  userLocation: { ...DEFAULT_USER_LOCATION },
  isPremium: typeof window !== 'undefined' && window.localStorage ? Boolean(window.localStorage.getItem('scrapconnect_premium') === 'true') : false,
  viewMode: 'triple-mockup', // 'triple-mockup' (side-by-side) or 'single-app'
  activeSingleTab: 'home',   // 'home' | 'search' | 'bulk' | 'orders' | 'map'
  searchQuery: 'copper',      // default matching Screen 2 in reference
  selectedCategory: 'all',
  bulkMaterial: 'Copper Wire', // default matching Screen 3 in reference
  bulkQuantity: 50,           // default matching Screen 3 in reference
  bulkMaxRadius: 30,          // radius in km
  orders: [
    {
      orderId: 'ORD-8941',
      date: 'Today, 11:20 AM',
      type: 'Direct Pickup',
      itemTitle: 'Copper Wire - 40kg',
      seller: 'S1: Green Scrap Hub',
      quantityKg: 40,
      pricePerKg: 550,
      totalAmount: 22000,
      deliveryFee: 0,
      status: 'Driver Dispatched',
      distanceKm: 0.2,
      co2Saved: '132 kg CO2 eq.'
    }
  ],
  activeDetailListing: null,
  mapInstance: null,
  mapMarkers: []
};

// Initialize marketplace with seed items
state.marketplace.loadInitialData(INITIAL_LISTINGS);

// ---------------------------------------------------------------------------
// DOM Selectors and Rendering
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });
}

function initApp() {
  bindGlobalEvents();
  renderAllScreens();
  initMapIfNeeded();
  setupLiveLocationListener();
}

/**
 * Event bindings for navigation, view mode toggle, search, and modals
 */
function bindGlobalEvents() {
  // View mode switcher: Triple Mockup vs Single Responsive App
  const modeTripleBtn = document.getElementById('btn-mode-triple');
  const modeSingleBtn = document.getElementById('btn-mode-single');
  const appContainer = document.getElementById('app-showcase-container');

  if (modeTripleBtn && modeSingleBtn && appContainer) {
    modeTripleBtn.addEventListener('click', () => {
      state.viewMode = 'triple-mockup';
      modeTripleBtn.classList.add('active');
      modeSingleBtn.classList.remove('active');
      appContainer.classList.remove('single-mode');
      appContainer.classList.add('triple-mode');
      syncSearchInputs();
    });

    modeSingleBtn.addEventListener('click', () => {
      state.viewMode = 'single-app';
      modeSingleBtn.classList.add('active');
      modeTripleBtn.classList.remove('active');
      appContainer.classList.remove('triple-mode');
      appContainer.classList.add('single-mode');
      showSingleTab(state.activeSingleTab);
    });
  }

  // Location selector triggers
  const changeLocButtons = document.querySelectorAll('.action-change-location');
  changeLocButtons.forEach(btn => {
    btn.addEventListener('click', openLocationModal);
  });

  // Premium toggles
  const premiumButtons = document.querySelectorAll('.action-upgrade-premium');
  premiumButtons.forEach(btn => {
    btn.addEventListener('click', openPremiumModal);
  });

  // "Add Listing" button
  const addListingBtn = document.getElementById('btn-add-listing-header');
  if (addListingBtn) {
    addListingBtn.addEventListener('click', openAddListingModal);
  }

  // Close modals on overlay click or close button
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.closest('.modal-close-btn')) {
        closeAllModals();
      }
    });
  });

  // Modal forms
  const formAddListing = document.getElementById('form-add-listing');
  if (formAddListing) {
    formAddListing.addEventListener('submit', handleAddListingSubmit);
  }

  const formLocation = document.getElementById('form-select-location');
  if (formLocation) {
    formLocation.addEventListener('submit', handleLocationSubmit);
  }

  // Bulk order check button on Screen 3
  const checkAvailabilityBtn = document.getElementById('bulk-check-btn');
  if (checkAvailabilityBtn) {
    checkAvailabilityBtn.addEventListener('click', handleBulkCheck);
  }

  const placeBulkOrderBtn = document.getElementById('bulk-order-submit-btn');
  if (placeBulkOrderBtn) {
    placeBulkOrderBtn.addEventListener('click', handlePlaceBulkOrder);
  }

  // Synchronize bottom nav bars across screens
  bindBottomNavEvents();

  // Search input listeners
  bindSearchInputs();
}

/**
 * Bottom Nav click handler
 */
function bindBottomNavEvents() {
  document.querySelectorAll('.app-nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const targetScreen = item.getAttribute('data-target-tab');
      if (!targetScreen) return;

      if (state.viewMode === 'triple-mockup') {
        // Scroll the respective phone into view or highlight it
        const targetPhone = document.getElementById(`phone-${targetScreen}`);
        if (targetPhone) {
          targetPhone.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          targetPhone.classList.add('phone-highlight');
          setTimeout(() => targetPhone.classList.remove('phone-highlight'), 1200);
        } else if (targetScreen === 'orders' || targetScreen === 'map') {
          // Switch to single view to see orders or map
          const singleBtn = document.getElementById('btn-mode-single');
          if (singleBtn) singleBtn.click();
          showSingleTab(targetScreen);
        }
      } else {
        showSingleTab(targetScreen);
      }
    });
  });
}

/**
 * Synchronize search inputs across Home and Search screen
 */
function bindSearchInputs() {
  const homeSearchInput = document.getElementById('home-search-input');
  const resultsSearchInput = document.getElementById('results-search-input');

  if (homeSearchInput) {
    homeSearchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      if (resultsSearchInput) {
        resultsSearchInput.value = state.searchQuery;
      }
      renderSearchResultsScreen();
    });

    homeSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (state.viewMode === 'triple-mockup') {
          const searchPhone = document.getElementById('phone-search');
          if (searchPhone) {
            searchPhone.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            searchPhone.classList.add('phone-highlight');
            setTimeout(() => searchPhone.classList.remove('phone-highlight'), 1200);
          }
        } else {
          showSingleTab('search');
        }
      }
    });
  }

  if (resultsSearchInput) {
    resultsSearchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      if (homeSearchInput) {
        homeSearchInput.value = state.searchQuery;
      }
      renderSearchResultsScreen();
    });
  }

  // Category pills
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedCategory = chip.getAttribute('data-cat') || 'all';
      renderHomeScreen();
    });
  });
}

function syncSearchInputs() {
  const homeSearchInput = document.getElementById('home-search-input');
  const resultsSearchInput = document.getElementById('results-search-input');
  if (homeSearchInput) homeSearchInput.value = state.searchQuery;
  if (resultsSearchInput) resultsSearchInput.value = state.searchQuery;
}

/**
 * Single-mode Tab switcher
 */
export function showSingleTab(tabId) {
  state.activeSingleTab = tabId;

  // Update tabs active styling
  document.querySelectorAll('.single-screen-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById(`panel-${tabId}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  // Update nav bars
  document.querySelectorAll('.single-bottom-nav .app-nav-item').forEach(navItem => {
    if (navItem.getAttribute('data-target-tab') === tabId) {
      navItem.classList.add('active');
    } else {
      navItem.classList.remove('active');
    }
  });

  if (tabId === 'map') {
    setTimeout(initMapIfNeeded, 200);
  } else if (tabId === 'orders') {
    renderOrdersScreen();
  }
}

/**
 * Render all 3 screens and auxiliary sections
 */
export function renderAllScreens() {
  renderLocationHeaders();
  renderHomeScreen();
  renderSearchResultsScreen();
  renderBulkOrderScreen();
  renderOrdersScreen();
  renderPremiumBadges();
  updateImpactMeters();
}

/**
 * Render user location indicators
 */
function renderLocationHeaders() {
  const locLabels = document.querySelectorAll('.user-current-location-label');
  locLabels.forEach(el => {
    el.textContent = `${state.userLocation.name} (${state.userLocation.latitude.toFixed(4)}, ${state.userLocation.longitude.toFixed(4)})`;
  });
}

/**
 * SCREEN 1: Homepage - Nearest Listings First
 */
export function renderHomeScreen() {
  const container = document.getElementById('home-listings-container');
  if (!container) return;

  const nearbyItems = state.marketplace.nearbyListings(
    state.userLocation.latitude,
    state.userLocation.longitude,
    state.selectedCategory
  );

  if (nearbyItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No scrap listings found in this category.</p>
        <button class="btn-text" onclick="window.clearCategoryFilter()">Reset filter</button>
      </div>
    `;
    return;
  }

  container.innerHTML = nearbyItems.map(item => {
    const dist = item.distanceFrom(state.userLocation.latitude, state.userLocation.longitude);
    const distClass = dist < 2.0 ? 'dist-near' : dist < 10.0 ? 'dist-mid' : 'dist-far';

    return `
      <div class="listing-card" onclick="window.openItemDetail('${item.itemId}')">
        <div class="card-thumb-wrapper" style="border-left: 4px solid ${item.colorHex};">
          <img src="${item.image}" alt="${item.material}" class="card-thumb-img" onerror="this.src='./assets/copper.jpg'" />
        </div>
        <div class="card-info">
          <div class="card-title-row">
            <h4 class="card-title">${item.title}</h4>
            <span class="seller-id-pill">${item.itemId}</span>
          </div>
          <div class="card-meta">
            <span class="distance-badge ${distClass}">
              <span class="pin-dot"></span> ${dist} km away
            </span>
            <span class="price-badge">Rs. ${item.price_per_kg}/kg</span>
          </div>
          <div class="card-sub-info">
            <span class="seller-name-sub">By ${item.sellerName}</span>
            <span class="rating-sub">★ ${item.rating}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * SCREEN 2: Search Results - Nearest Match Ranked First
 */
export function renderSearchResultsScreen() {
  const container = document.getElementById('search-results-container');
  const countLabel = document.getElementById('search-matches-count');
  if (!container) return;

  const searchInput = document.getElementById('results-search-input');
  const query = searchInput ? searchInput.value : state.searchQuery;

  const results = state.marketplace.search(
    query,
    state.userLocation.latitude,
    state.userLocation.longitude
  );

  if (countLabel) {
    countLabel.textContent = `${results.length} listing${results.length === 1 ? '' : 's'} found`;
  }

  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>No scrap listings found for "<strong>${escapeHtml(query)}</strong>"</p>
        <p class="empty-sub">Try searching "copper", "cardboard", or "aluminium"</p>
      </div>
    `;
    return;
  }

  container.innerHTML = results.map(item => {
    const dist = item.distanceFrom(state.userLocation.latitude, state.userLocation.longitude);
    const isClosest = dist === results[0].distanceFrom(state.userLocation.latitude, state.userLocation.longitude);

    return `
      <div class="search-card ${isClosest ? 'closest-match-card' : ''}">
        <div class="search-card-left">
          <div class="search-card-title-row">
            <span class="search-item-id">${item.itemId}:</span>
            <span class="search-item-material">${item.material}</span>
            ${isClosest ? '<span class="closest-tag">Nearest</span>' : ''}
          </div>
          <div class="search-dist-label">${dist} km</div>
          <div class="search-specs-label">${item.quantity_kg} kg • Rs. ${item.price_per_kg}/kg</div>
        </div>
        <div class="search-card-right">
          <button class="btn-view-card" onclick="window.openItemDetail('${item.itemId}')">View</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * SCREEN 3: NGO Bulk Order Feasibility Check
 */
export function renderBulkOrderScreen() {
  const matSelect = document.getElementById('bulk-material-select');
  const qtyInput = document.getElementById('bulk-qty-input');

  if (matSelect && state.bulkMaterial) {
    matSelect.value = state.bulkMaterial;
  }
  if (qtyInput && state.bulkQuantity) {
    qtyInput.value = state.bulkQuantity;
  }

  // Run initial feasibility check to populate result box
  handleBulkCheck();
}

/**
 * Bulk Availability Computation using Marketplace.bulkOrderQuote()
 */
function handleBulkCheck() {
  const matSelect = document.getElementById('bulk-material-select');
  const qtyInput = document.getElementById('bulk-qty-input');
  const radiusInput = document.getElementById('bulk-radius-input');

  const material = matSelect ? matSelect.value : state.bulkMaterial;
  const quantity = qtyInput ? Number(qtyInput.value) || 0 : state.bulkQuantity;
  const radius = radiusInput ? Number(radiusInput.value) || 30 : state.bulkMaxRadius;

  state.bulkMaterial = material;
  state.bulkQuantity = quantity;
  state.bulkMaxRadius = radius;

  const quote = state.marketplace.bulkOrderQuote(
    material,
    quantity,
    radius,
    state.userLocation.latitude,
    state.userLocation.longitude
  );

  const resultContainer = document.getElementById('bulk-result-card');
  if (!resultContainer) return;

  const statusClass = quote.meets_requirement ? 'status-feasible' : 'status-shortfall';
  const statusText = quote.meets_requirement ? 'Feasible' : `Shortfall (${quote.shortfall_kg} kg needed)`;

  resultContainer.innerHTML = `
    <div class="bulk-result-inner ${statusClass}">
      <div class="bulk-row">
        <span class="bulk-label">Available:</span>
        <span class="bulk-val font-bold text-accent">${quote.total_available_kg} kg</span>
      </div>
      <div class="bulk-row">
        <span class="bulk-label">Avg price:</span>
        <span class="bulk-val">Rs. ${quote.average_price_per_kg.toFixed(0)}/kg</span>
      </div>
      <div class="bulk-row">
        <span class="bulk-label">Status:</span>
        <span class="bulk-val bulk-status-tag ${quote.meets_requirement ? 'tag-green' : 'tag-amber'}">
          ${statusText}
        </span>
      </div>
      <div class="bulk-summary-note">
        Across ${quote.sellerCount} nearby seller${quote.sellerCount === 1 ? '' : 's'} (within ${radius} km)
      </div>

      <!-- Seller Distribution Breakdown -->
      <div class="bulk-seller-breakdown">
        ${quote.matchingSellers.map(s => `
          <div class="seller-contrib-row">
            <span class="contrib-id">${s.itemId}</span>
            <span class="contrib-qty">${s.quantity_kg}kg @ Rs.${s.price_per_kg}</span>
            <span class="contrib-dist">${s.distance_km} km</span>
          </div>
        `).join('')}
      </div>

      <div class="bulk-cost-estimate">
        <span>Estimated Total:</span>
        <strong>Rs. ${(quote.total_available_kg * quote.average_price_per_kg).toLocaleString('en-IN')}</strong>
      </div>
    </div>
  `;

  // Update order button state
  const submitBtn = document.getElementById('bulk-order-submit-btn');
  if (submitBtn) {
    if (quote.meets_requirement) {
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = `Procure ${quantity}kg via Consolidated NGO Order`;
      submitBtn.classList.remove('btn-disabled');
    } else {
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = `Procure Available ${quote.total_available_kg}kg (Partial Order)`;
      submitBtn.classList.remove('btn-disabled');
    }
  }
}

/**
 * Handle Consolidated NGO Bulk Order placement
 */
function handlePlaceBulkOrder() {
  const quote = state.marketplace.bulkOrderQuote(
    state.bulkMaterial,
    state.bulkQuantity,
    state.bulkMaxRadius,
    state.userLocation.latitude,
    state.userLocation.longitude
  );

  const orderId = `NGO-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderAmount = quote.total_available_kg * quote.average_price_per_kg;

  const newOrder = {
    orderId,
    date: 'Just now',
    type: 'NGO Consolidated Sourcing',
    itemTitle: `${quote.material} (${Math.min(state.bulkQuantity, quote.total_available_kg)}kg)`,
    seller: `${quote.sellerCount} aggregated local sellers`,
    quantityKg: Math.min(state.bulkQuantity, quote.total_available_kg),
    pricePerKg: quote.average_price_per_kg,
    totalAmount: orderAmount,
    deliveryFee: state.isPremium ? 0 : 250,
    status: 'Consolidation Scheduled',
    distanceKm: quote.matchingSellers[0]?.distance_km || 0.2,
    co2Saved: `${Math.round(quote.total_available_kg * 3.3)} kg CO2 eq.`
  };

  state.orders.unshift(newOrder);
  showToast(`✅ Bulk order ${orderId} created successfully! Redirecting to Orders...`);

  // Switch to single view Orders tab to show fulfillment
  setTimeout(() => {
    const singleBtn = document.getElementById('btn-mode-single');
    if (singleBtn) singleBtn.click();
    showSingleTab('orders');
  }, 1000);
}

/**
 * ORDERS SCREEN: Order tracking and SDG Impact Receipts
 */
export function renderOrdersScreen() {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  if (state.orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No active orders placed yet.</p>
        <p class="empty-sub">Explore nearby listings to request doorstep pickup!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.orders.map(order => `
    <div class="order-card">
      <div class="order-card-header">
        <div class="order-id-group">
          <span class="order-id">${order.orderId}</span>
          <span class="order-type-badge">${order.type}</span>
        </div>
        <span class="order-status-badge status-active">${order.status}</span>
      </div>
      <div class="order-card-body">
        <h4 class="order-title">${order.itemTitle}</h4>
        <div class="order-seller-info">From: ${order.seller}</div>
        <div class="order-numbers-grid">
          <div><span class="num-lbl">Quantity:</span> <strong>${order.quantityKg} kg</strong></div>
          <div><span class="num-lbl">Rate:</span> <strong>Rs. ${order.pricePerKg}/kg</strong></div>
          <div><span class="num-lbl">Total Value:</span> <strong>Rs. ${order.totalAmount.toLocaleString('en-IN')}</strong></div>
          <div><span class="num-lbl">Delivery:</span> <strong>${order.deliveryFee === 0 ? 'FREE (Premium)' : `Rs. ${order.deliveryFee}`}</strong></div>
        </div>
        <div class="order-sdg-tag">
          🌱 Environmental Impact: <strong>${order.co2Saved} diverted from landfill</strong>
        </div>
      </div>
      <div class="order-card-footer">
        <span class="order-timestamp">${order.date}</span>
        <button class="btn-sm btn-outline" onclick="window.viewOrderReceipt('${order.orderId}')">View Receipt & QR</button>
      </div>
    </div>
  `).join('');
}

/**
 * Item Detail Modal
 */
globalScope.openItemDetail = function(itemId) {
  const item = state.marketplace.listings.find(l => l.itemId === itemId);
  if (!item) return;

  const dist = item.distanceFrom(state.userLocation.latitude, state.userLocation.longitude);
  const modal = document.getElementById('item-detail-modal');
  const body = document.getElementById('item-detail-modal-body');

  body.innerHTML = `
    <div class="detail-header-image" style="background-image: url('${item.image}');">
      <span class="detail-grade-tag">${item.grade}</span>
      <span class="detail-distance-tag">📍 ${dist} km away</span>
    </div>
    <div class="detail-content-padding">
      <div class="detail-title-row">
        <div>
          <h3 class="detail-item-title">${item.title}</h3>
          <p class="detail-seller-name">${item.sellerName} • ★ ${item.rating} (${item.reviewsCount} deals)</p>
        </div>
        <div class="detail-price-box">
          <span class="detail-unit-price">Rs. ${item.price_per_kg}</span>
          <span class="detail-unit-lbl">per kg</span>
        </div>
      </div>

      <div class="detail-summary-metrics">
        <div class="metric-pill">
          <span class="metric-lbl">Total Available</span>
          <span class="metric-val">${item.quantity_kg} kg</span>
        </div>
        <div class="metric-pill">
          <span class="metric-lbl">Total Value</span>
          <span class="metric-val">Rs. ${item.totalValue().toLocaleString('en-IN')}</span>
        </div>
        <div class="metric-pill">
          <span class="metric-lbl">Delivery Fee</span>
          <span class="metric-val ${state.isPremium ? 'text-accent' : ''}">
            ${state.isPremium ? 'FREE (Premium)' : 'Rs. 45'}
          </span>
        </div>
      </div>

      <div class="detail-desc-box">
        <h5>Listing Description</h5>
        <p>${item.description}</p>
        <p class="detail-address-line">📍 <strong>Pickup Yard:</strong> ${item.address}</p>
      </div>

      <div class="detail-sdg-card">
        <div class="sdg-card-header">
          <span>🌿 SDG 12 Circular Resource Contribution</span>
        </div>
        <p>Purchasing and recycling this batch prevents approximately <strong>${item.sdgImpact.co2SavedKg} kg of CO2 equivalent</strong> emissions compared to virgin extraction.</p>
      </div>

      <div class="detail-action-buttons">
        <button class="btn-secondary" onclick="window.contactSeller('${item.sellerPhone}')">📞 Call Seller</button>
        <button class="btn-primary" onclick="window.bookDirectPickup('${item.itemId}')">🚚 Book Instant Pickup</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

/**
 * Direct Pickup booking
 */
globalScope.bookDirectPickup = function(itemId) {
  const item = state.marketplace.listings.find(l => l.itemId === itemId);
  if (!item) return;

  const dist = item.distanceFrom(state.userLocation.latitude, state.userLocation.longitude);
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    orderId,
    date: 'Just now',
    type: 'Direct Scrap Pickup',
    itemTitle: item.title,
    seller: item.sellerName,
    quantityKg: item.quantity_kg,
    pricePerKg: item.price_per_kg,
    totalAmount: item.totalValue(),
    deliveryFee: state.isPremium ? 0 : 50,
    status: 'Pickup Requested',
    distanceKm: dist,
    co2Saved: `${item.sdgImpact.co2SavedKg} kg CO2 eq.`
  };

  state.orders.unshift(newOrder);
  closeAllModals();
  showToast(`🎉 Order ${orderId} placed with ${item.sellerName}!`);

  const singleBtn = document.getElementById('btn-mode-single');
  if (singleBtn) singleBtn.click();
  showSingleTab('orders');
};

globalScope.contactSeller = function(phone) {
  alert(`Connecting to verified scrap dealer phone: ${phone}\n(WhatsApp / Telephony dialer trigger)`);
};

globalScope.clearCategoryFilter = function() {
  state.selectedCategory = 'all';
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
  const allChip = document.querySelector('.category-chip[data-cat="all"]');
  if (allChip) allChip.classList.add('active');
  renderHomeScreen();
};

/**
 * Handle new Listing Submission by Seller
 */
function handleAddListingSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const material = form.elements['material'].value.trim();
  const quantity = Number(form.elements['quantity'].value);
  const price = Number(form.elements['price'].value);
  const seller = form.elements['sellerName'].value.trim() || 'Community Seller';
  const description = form.elements['description'].value.trim() || 'Locally collected scrap batch.';

  if (!material || !quantity || !price) {
    alert('Please fill in material, quantity, and price.');
    return;
  }

  // Slight random offset from current user location for realism
  const latOffset = (Math.random() - 0.5) * 0.02;
  const lonOffset = (Math.random() - 0.5) * 0.02;

  const newItemId = `S${state.marketplace.listings.length + 1}`;
  let image = './assets/copper.jpg';
  let colorHex = '#2e7d32';

  if (material.toLowerCase().includes('cardboard')) {
    image = './assets/cardboard.jpg';
    colorHex = '#8d7b68';
  } else if (material.toLowerCase().includes('aluminium') || material.toLowerCase().includes('aluminum')) {
    image = './assets/aluminium.jpg';
    colorHex = '#90a4ae';
  } else if (material.toLowerCase().includes('waste') || material.toLowerCase().includes('circuit')) {
    image = './assets/ewaste.jpg';
    colorHex = '#388e3c';
  }

  const newListing = state.marketplace.addListing({
    itemId: newItemId,
    material,
    title: `${material} - ${quantity}kg`,
    quantity_kg: quantity,
    price_per_kg: price,
    latitude: state.userLocation.latitude + latOffset,
    longitude: state.userLocation.longitude + lonOffset,
    sellerName: seller,
    verified: true,
    rating: 5.0,
    reviewsCount: 1,
    image,
    colorHex,
    description,
    grade: 'Community Recycled Batch',
    address: `${state.userLocation.name} Yard`
  });

  closeAllModals();
  form.reset();
  renderAllScreens();
  initMapIfNeeded();
  showToast(`✅ Successfully listed ${newListing.title} as ${newItemId}!`);
}

/**
 * Location Modal Handlers
 */
function openLocationModal() {
  const modal = document.getElementById('location-modal');
  const select = document.getElementById('location-preset-select');
  if (select) {
    select.innerHTML = LOCATION_PRESETS.map((p, idx) => `
      <option value="${idx}" ${p.name === state.userLocation.name ? 'selected' : ''}>
        ${p.name} (${p.area})
      </option>
    `).join('');
  }
  modal.classList.add('active');
}

function handleLocationSubmit(e) {
  e.preventDefault();
  const select = document.getElementById('location-preset-select');
  const selectedIdx = Number(select.value);
  const preset = LOCATION_PRESETS[selectedIdx];

  if (preset) {
    state.userLocation = { ...preset };
    closeAllModals();
    renderAllScreens();
    if (state.mapInstance) {
      updateMapUserPosition();
    }
    showToast(`📍 Location updated to ${preset.name}! Distances recalculated.`);
  }
}

/**
 * Use Real Browser GPS if requested
 */
function setupLiveLocationListener() {
  const gpsBtn = document.getElementById('btn-use-real-gps');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      gpsBtn.textContent = 'Acquiring GPS...';
      navigator.geolocation.getCurrentPosition(
        pos => {
          state.userLocation = {
            name: 'My Current Location (GPS)',
            area: 'Live GPS Coordinates',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
          gpsBtn.textContent = '📍 Use My Real GPS';
          closeAllModals();
          renderAllScreens();
          if (state.mapInstance) updateMapUserPosition();
          showToast(`📍 Live coordinates loaded: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        err => {
          gpsBtn.textContent = '📍 Use My Real GPS';
          alert(`GPS lookup failed: ${err.message}. Retaining simulated location.`);
        },
        { timeout: 8000 }
      );
    });
  }
}

/**
 * Premium Membership Modal Handlers
 */
function openPremiumModal() {
  const modal = document.getElementById('premium-modal');
  const toggleBtn = document.getElementById('btn-toggle-premium-status');
  if (toggleBtn) {
    toggleBtn.textContent = state.isPremium ? 'Cancel Premium Membership' : 'Upgrade to Premium (₹299/mo)';
    toggleBtn.className = state.isPremium ? 'btn-danger' : 'btn-primary-golden';
  }
  modal.classList.add('active');
}

globalScope.togglePremiumPlan = function() {
  state.isPremium = !state.isPremium;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('scrapconnect_premium', state.isPremium ? 'true' : 'false');
  }
  closeAllModals();
  renderPremiumBadges();
  showToast(state.isPremium ? '🌟 Welcome to ScrapConnect Premium! Free deliveries enabled.' : 'Premium status paused.');
};

function renderPremiumBadges() {
  document.querySelectorAll('.premium-banner-dynamic').forEach(banner => {
    if (state.isPremium) {
      banner.innerHTML = `
        <div class="premium-active-pill">
          <span>👑 Premium Active: Zero Delivery Fees on all scrap pickups</span>
        </div>
      `;
    } else {
      banner.innerHTML = `
        <div class="premium-callout-card" onclick="window.openPremiumModalDirect()">
          <span class="gold-crown">👑</span>
          <div class="premium-text">
            <strong>Premium: Free Delivery</strong>
            <p>Upgrade for zero pickup fees & NGO priority logistics</p>
          </div>
          <span class="arrow-right">→</span>
        </div>
      `;
    }
  });
}

globalScope.openPremiumModalDirect = openPremiumModal;

function openAddListingModal() {
  const modal = document.getElementById('add-listing-modal');
  modal.classList.add('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
}

/**
 * Map Initialization using Leaflet
 */
function initMapIfNeeded() {
  const mapElement = document.getElementById('leaflet-map-canvas');
  if (!mapElement) return;

  if (typeof L === 'undefined') {
    console.warn('Leaflet library is loading...');
    setTimeout(initMapIfNeeded, 500);
    return;
  }

  if (!state.mapInstance) {
    state.mapInstance = L.map('leaflet-map-canvas').setView(
      [state.userLocation.latitude, state.userLocation.longitude],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors | ScrapConnect'
    }).addTo(state.mapInstance);
  }

  updateMapUserPosition();
}

function updateMapUserPosition() {
  if (!state.mapInstance) return;

  // Clear existing markers
  state.mapMarkers.forEach(m => state.mapInstance.removeLayer(m));
  state.mapMarkers = [];

  const userLat = state.userLocation.latitude;
  const userLon = state.userLocation.longitude;

  // User location marker
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div class="pulse-marker-user"><span class="user-center-dot"></span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  const userMarker = L.marker([userLat, userLon], { icon: userIcon })
    .addTo(state.mapInstance)
    .bindPopup(`<strong>Your Location</strong><br>${state.userLocation.name}`);
  state.mapMarkers.push(userMarker);

  // Radius circle (5km local zone)
  const circle = L.circle([userLat, userLon], {
    color: '#2e7d32',
    fillColor: '#4caf50',
    fillOpacity: 0.1,
    radius: 5000
  }).addTo(state.mapInstance);
  state.mapMarkers.push(circle);

  // Scrap Listing Markers
  state.marketplace.listings.forEach(item => {
    const dist = item.distanceFrom(userLat, userLon);
    const itemMarker = L.marker([item.latitude, item.longitude], {
      icon: L.divIcon({
        className: 'custom-scrap-marker',
        html: `<div class="scrap-pin" style="background:${item.colorHex}"><span>${item.itemId}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
    }).addTo(state.mapInstance);

    itemMarker.bindPopup(`
      <div class="map-popup-card">
        <strong>${item.title}</strong><br>
        <span>📍 ${dist} km away</span><br>
        <span>Rs. ${item.price_per_kg}/kg</span><br>
        <button style="margin-top:6px;padding:4px 8px;font-size:11px;background:#2e7d32;color:#fff;border:none;border-radius:4px;cursor:pointer;" onclick="window.openItemDetail('${item.itemId}')">View Details</button>
      </div>
    `);

    state.mapMarkers.push(itemMarker);
  });

  state.mapInstance.setView([userLat, userLon], 12);
}

/**
 * SDG Impact Metrics updater
 */
function updateImpactMeters() {
  const totalKg = state.marketplace.listings.reduce((sum, item) => sum + item.quantity_kg, 0);
  const totalCO2 = Math.round(totalKg * 2.85);

  const kgEl = document.getElementById('stat-total-kg');
  const co2El = document.getElementById('stat-co2-saved');
  if (kgEl) kgEl.textContent = `${totalKg} kg`;
  if (co2El) co2El.textContent = `${totalCO2} kg`;
}

/**
 * Toast Notification Utility
 */
export function showToast(msg) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

globalScope.viewOrderReceipt = function(orderId) {
  const ord = state.orders.find(o => o.orderId === orderId);
  if (!ord) return;
  alert(
    `🧾 ScrapConnect Circular Sourcing Receipt\n` +
    `----------------------------------------\n` +
    `Order ID: ${ord.orderId}\n` +
    `Type: ${ord.type}\n` +
    `Material: ${ord.itemTitle}\n` +
    `Total Amount: Rs. ${ord.totalAmount}\n` +
    `Status: ${ord.status}\n` +
    `SDG 12 Impact: ${ord.co2Saved}\n` +
    `Verification QR: [SCAN AT PICKUP TRUCK]`
  );
};
