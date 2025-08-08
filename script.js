// Sample product data
const products = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    category: "smartphones",
    price: 999.99,
    image: "/placeholder.svg?height=250&width=280",
    description: "The latest iPhone with advanced camera system and A17 Pro chip for exceptional performance.",
  },
  {
    id: 2,
    name: "MacBook Air M2",
    category: "laptops",
    price: 1199.99,
    image: "/placeholder.svg?height=250&width=280",
    description: "Ultra-thin laptop with M2 chip, perfect for work and creativity with all-day battery life.",
  },
  {
    id: 3,
    name: "AirPods Pro",
    category: "headphones",
    price: 249.99,
    image: "/placeholder.svg?height=250&width=280",
    description: "Premium wireless earbuds with active noise cancellation and spatial audio.",
  },
  {
    id: 4,
    name: "Samsung Galaxy S24",
    category: "smartphones",
    price: 899.99,
    image: "/placeholder.svg?height=250&width=280",
    description: "Flagship Android phone with AI-powered camera and stunning display technology.",
  },
  {
    id: 5,
    name: "Dell XPS 13",
    category: "laptops",
    price: 1099.99,
    image: "/placeholder.svg?height=250&width=280",
    description: "Premium ultrabook with InfinityEdge display and powerful Intel processors.",
  },
  {
    id: 6,
    name: "Sony WH-1000XM5",
    category: "headphones",
    price: 399.99,
    image: "/placeholder.svg?height=250&width=280",
    description: "Industry-leading noise canceling headphones with exceptional sound quality.",
  },
  {
    id: 7,
    name: "iPad Pro 12.9",
    category: "accessories",
    price: 1099.99,
    image: "/placeholder.svg?height=250&width=280",
    description: "Professional tablet with M2 chip and Liquid Retina XDR display for creative work.",
  },
  {
    id: 8,
    name: "Apple Watch Series 9",
    category: "accessories",
    price: 399.99,
    image: "/placeholder.svg?height=250&width=280",
    description: "Advanced smartwatch with health monitoring and fitness tracking capabilities.",
  },
]

// PWA Variables
let deferredPrompt
let isOnline = navigator.onLine
let swRegistration = null

// PWA Initialization
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerServiceWorker()
  })
}

// Register Service Worker
async function registerServiceWorker() {
  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js")
    console.log("Service Worker registered successfully:", swRegistration)

    // Check for updates
    swRegistration.addEventListener("updatefound", () => {
      const newWorker = swRegistration.installing
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateNotification()
        }
      })
    })
  } catch (error) {
    console.error("Service Worker registration failed:", error)
  }
}

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement("div")
  notification.className = "update-notification show"
  notification.innerHTML = `
    <span>New version available!</span>
    <button class="update-btn" onclick="updateApp()">Update</button>
    <button class="update-btn" onclick="dismissUpdate()" style="background: transparent; color: white;">Later</button>
  `
  document.body.appendChild(notification)
}

// Update app
function updateApp() {
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: "SKIP_WAITING" })
    window.location.reload()
  }
}

// Dismiss update notification
function dismissUpdate() {
  const notification = document.querySelector(".update-notification")
  if (notification) {
    notification.remove()
  }
}

// Install prompt handling
window.addEventListener("beforeinstallprompt", (e) => {
  console.log("PWA: Install prompt available")
  e.preventDefault()
  deferredPrompt = e
  showInstallButton()
})

function showInstallButton() {
  const installBtn = document.getElementById("installBtn")
  if (installBtn) {
    installBtn.style.display = "flex"
    installBtn.addEventListener("click", installApp)
  }
}

async function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log("PWA: Install prompt outcome:", outcome)

    if (outcome === "accepted") {
      hideInstallButton()
    }

    deferredPrompt = null
  }
}

function hideInstallButton() {
  const installBtn = document.getElementById("installBtn")
  if (installBtn) {
    installBtn.style.display = "none"
  }
}

// Online/Offline handling
window.addEventListener("online", handleOnline)
window.addEventListener("offline", handleOffline)

function handleOnline() {
  isOnline = true
  console.log("PWA: Back online")
  showConnectivityStatus("You're back online!", true)

  // Sync any pending data
  if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register("cart-sync")
    })
  }
}

function handleOffline() {
  isOnline = false
  console.log("PWA: Gone offline")
  showConnectivityStatus("You're offline. Some features may be limited.", false)
}

function showConnectivityStatus(message, online) {
  const indicator = document.getElementById("offlineIndicator")
  if (indicator) {
    indicator.innerHTML = `
      <i class="fas fa-${online ? "wifi" : "exclamation-triangle"}"></i>
      <span>${message}</span>
    `
    indicator.className = `offline-indicator show ${online ? "online" : ""}`

    // Auto-hide after 3 seconds if online
    if (online) {
      setTimeout(() => {
        indicator.classList.remove("show")
      }, 3000)
    }
  }
}

// Enhanced cart functionality with offline support
function addToCartOffline(product) {
  // Store in localStorage for offline sync
  const offlineCart = JSON.parse(localStorage.getItem("offlineCart") || "[]")
  offlineCart.push({
    action: "add",
    product: product,
    timestamp: Date.now(),
  })
  localStorage.setItem("offlineCart", JSON.stringify(offlineCart))

  // Register for background sync
  if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register("cart-sync")
    })
  }
}

// Check for app shortcuts
function handleAppShortcuts() {
  const urlParams = new URLSearchParams(window.location.search)

  if (urlParams.get("cart") === "open") {
    setTimeout(() => {
      toggleCart()
    }, 500)
  }
}

// PWA Loading screen
function showPWALoading() {
  const loading = document.createElement("div")
  loading.className = "pwa-loading show"
  loading.innerHTML = `
    <div class="logo">TechStore</div>
    <div class="spinner"></div>
    <p>Loading your store...</p>
  `
  document.body.appendChild(loading)

  setTimeout(() => {
    loading.classList.remove("show")
    setTimeout(() => {
      loading.remove()
    }, 300)
  }, 1500)
}

// Enhanced error handling for offline scenarios
function handleOfflineError(error, context) {
  console.warn(`PWA: Offline operation in ${context}:`, error)

  if (!isOnline) {
    showConnectivityStatus("Action saved. Will sync when online.", false)
  }
}

// Shopping cart
let cart = []
let filteredProducts = [...products]

// DOM elements
const productsGrid = document.getElementById("productsGrid")
const cartSidebar = document.getElementById("cartSidebar")
const cartItems = document.getElementById("cartItems")
const cartCount = document.querySelector(".cart-count")
const totalAmount = document.getElementById("totalAmount")
const cartTotal = document.getElementById("cartTotal")
const searchInput = document.getElementById("searchInput")
const filterButtons = document.querySelectorAll(".filter-btn")
const productModal = document.getElementById("productModal")
const modalBody = document.getElementById("modalBody")
const loading = document.querySelector(".loading")

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  // Show PWA loading screen
  if (window.matchMedia("(display-mode: standalone)").matches) {
    showPWALoading()
  }

  // Handle app shortcuts
  handleAppShortcuts()

  // Check initial connectivity
  if (!isOnline) {
    handleOffline()
  }

  // Existing code...
  showLoading()
  setTimeout(() => {
    hideLoading()
    displayProducts(products)
  }, 1000)

  setupEventListeners()
})

function showLoading() {
  loading.style.display = "block"
  productsGrid.style.display = "none"
}

function hideLoading() {
  loading.style.display = "none"
  productsGrid.style.display = "grid"
}

function setupEventListeners() {
  // Search functionality
  searchInput.addEventListener("input", handleSearch)

  // Filter buttons
  filterButtons.forEach((button) => {
    button.addEventListener("click", handleFilter)
  })

  // Close modal when clicking outside
  productModal.addEventListener("click", (e) => {
    if (e.target === productModal) {
      closeModal()
    }
  })

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
}

function displayProducts(productsToShow) {
  productsGrid.innerHTML = ""

  productsToShow.forEach((product) => {
    const productCard = createProductCard(product)
    productsGrid.appendChild(productCard)
  })
}

function createProductCard(product) {
  const card = document.createElement("div")
  card.className = "product-card"
  card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <button class="add-to-cart" onclick="addToCart(${product.id})">
                <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
        </div>
    `

  // Add click event to open modal (except for the button)
  card.addEventListener("click", (e) => {
    if (!e.target.closest(".add-to-cart")) {
      openProductModal(product)
    }
  })

  return card
}

function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase()
  const activeCategory = document.querySelector(".filter-btn.active").dataset.category

  filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) || product.description.toLowerCase().includes(searchTerm)
    const matchesCategory = activeCategory === "all" || product.category === activeCategory

    return matchesSearch && matchesCategory
  })

  displayProducts(filteredProducts)
}

function handleFilter(e) {
  // Remove active class from all buttons
  filterButtons.forEach((btn) => btn.classList.remove("active"))

  // Add active class to clicked button
  e.target.classList.add("active")

  const category = e.target.dataset.category
  const searchTerm = searchInput.value.toLowerCase()

  filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) || product.description.toLowerCase().includes(searchTerm)
    const matchesCategory = category === "all" || product.category === category

    return matchesSearch && matchesCategory
  })

  displayProducts(filteredProducts)
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId)
  const existingItem = cart.find((item) => item.id === productId)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({ ...product, quantity: 1 })
  }

  // Add offline support
  if (!isOnline) {
    addToCartOffline(product)
  }

  updateCartUI()
  showAddToCartAnimation()
}

function showAddToCartAnimation() {
  // Simple animation feedback
  const cartIcon = document.querySelector(".cart-icon")
  cartIcon.style.transform = "scale(1.2)"
  setTimeout(() => {
    cartIcon.style.transform = "scale(1)"
  }, 200)
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  updateCartUI()
}

function updateQuantity(productId, change) {
  const item = cart.find((item) => item.id === productId)
  if (item) {
    item.quantity += change
    if (item.quantity <= 0) {
      removeFromCart(productId)
    } else {
      updateCartUI()
    }
  }
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  cartCount.textContent = totalItems
  totalAmount.textContent = total.toFixed(2)

  if (cart.length === 0) {
    cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `
    cartTotal.style.display = "none"
  } else {
    cartItems.innerHTML = cart
      .map(
        (item) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="quantity-btn" onclick="removeFromCart(${item.id})" style="margin-left: 10px; color: #dc3545;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `,
      )
      .join("")
    cartTotal.style.display = "block"
  }
}

function toggleCart() {
  cartSidebar.classList.toggle("open")
}

function openProductModal(product) {
  modalBody.innerHTML = `
        <div>
            <img src="${product.image}" alt="${product.name}" class="modal-image">
        </div>
        <div class="modal-info">
            <h2>${product.name}</h2>
            <div class="product-category">${product.category.toUpperCase()}</div>
            <div class="modal-price">$${product.price.toFixed(2)}</div>
            <p class="modal-description">${product.description}</p>
            <button class="add-to-cart" onclick="addToCart(${product.id}); closeModal();">
                <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
        </div>
    `
  productModal.style.display = "block"
}

function closeModal() {
  productModal.style.display = "none"
}

function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty!")
    return
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  alert(
    `Thank you for your purchase! Total: $${total.toFixed(2)}\n\nThis is a demo. In a real store, you would be redirected to a payment processor.`,
  )

  // Clear cart after checkout
  cart = []
  updateCartUI()
  toggleCart()
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (productModal.style.display === "block") {
      closeModal()
    } else if (cartSidebar.classList.contains("open")) {
      toggleCart()
    }
  }
})

// Smooth scroll to top when clicking logo
document.querySelector(".logo").addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
})
