// ------------------------------------------------
// 1) FIREBASE INITIALIZATION (shared across pages)
// ------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDx0t5M9QRPQoRBaMDtDUmGICCX8r_k2nw",
  authDomain: "astre-f93d3.firebaseapp.com",
  databaseURL: "https://astre-f93d3-default-rtdb.firebaseio.com",
  projectId: "astre-f93d3",
  storageBucket: "astre-f93d3.firebasestorage.app",
  messagingSenderId: "175273255912",
  appId: "1:175273255912:web:f2da15b4b4a32064a3fa5d",
  measurementId: "G-5X6K01L2Z0"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// ------------------------------------------------
// 2) UTILITY: Check which page we’re on
// ------------------------------------------------
const path = window.location.pathname;
const page = path.substring(path.lastIndexOf('/') + 1);

// ------------------------------------------------
// 3) STARFIELD & INTRO (for index.html only)
// ------------------------------------------------
if (page === "index.html" || page === "") {
  const introContainer = document.getElementById("introContainer");
  const starCanvas = document.getElementById("starfield");
  const starCtx = starCanvas.getContext("2d");
  const logoText = document.getElementById("logoText");
  const flashScreen = document.getElementById("flashScreen");
  const heroSection = document.getElementById("heroSection");

  // Resize + init stars
  let stars = [];
  function resizeCanvas() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    initStars();
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function initStars() {
    stars = [];
    const numStars = 300;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * starCanvas.width,
        y: Math.random() * starCanvas.height,
        radius: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.6 + 0.2,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  function animateStars() {
    starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    stars.forEach(star => {
      star.alpha += (Math.random() - 0.5) * 0.02;
      if (star.alpha < 0.2) star.alpha = 0.2;
      if (star.alpha > 1) star.alpha = 1;

      star.y += star.speed;
      if (star.y > starCanvas.height) {
        star.y = 0;
        star.x = Math.random() * starCanvas.width;
        star.radius = Math.random() * 1.5 + 0.3;
        star.speed = Math.random() * 0.6 + 0.2;
      }

      starCtx.beginPath();
      starCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      starCtx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      starCtx.fill();
    });

    requestAnimationFrame(animateStars);
  }
  initStars();
  animateStars();

  // Intro animation via GSAP
  function runIntro() {
    const tl = gsap.timeline();
    tl.to(logoText, {
      strokeDashoffset: 0,
      duration: 1,
      ease: "power2.inOut"
    });
    tl.to(
      flashScreen,
      {
        opacity: 1,
        duration: 0.08,
        ease: "power1.in",
        yoyo: true,
        repeat: 1
      },
      "-=0.2"
    );
    tl.to(
      logoText,
      {
        onStart: () => {
          logoText.style.animation = "as-flicker 2s ease-in-out";
        },
        duration: 0.1
      },
      "-=0.1"
    );
    tl.to(introContainer, {
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      delay: 1.4,
      onComplete: () => {
        introContainer.style.display = "none";
        document.body.style.overflow = "auto";
        heroSection.classList.remove("hidden");
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    runIntro();
  });
}

// ------------------------------------------------
// 4) LOAD & DISPLAY PRODUCTS + HANDLE “Buy Now”
//    (for collections.html only)
// ------------------------------------------------
if (page === "collections.html") {
  document.body.style.overflow = "auto";
  const productGrid = document.getElementById("productGrid");

  function loadProducts() {
    const productsRef = database.ref("products");
    productsRef.on("value", snapshot => {
      const data = snapshot.val() || {};
      renderProducts(data);
    });
  }

  function renderProducts(products) {
    productGrid.innerHTML = "";
    if (!Object.keys(products).length) {
      productGrid.innerHTML =
        '<p class="no-products">No products available.</p>';
      return;
    }
    Object.keys(products).forEach(key => {
      const { name, description, price, imageUrl } = products[key];
      const card = document.createElement("div");
      card.classList.add("product-card");

      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = name;
      card.appendChild(img);

      const title = document.createElement("h3");
      title.textContent = name;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = description;
      card.appendChild(desc);

      const priceEl = document.createElement("div");
      priceEl.classList.add("price");
      priceEl.textContent = `$${parseFloat(price).toFixed(2)}`;
      card.appendChild(priceEl);

      const buyBtn = document.createElement("button");
      buyBtn.classList.add("buy-btn");
      buyBtn.textContent = "Buy Now";
      buyBtn.addEventListener("click", () => handleBuy(key, name));
      card.appendChild(buyBtn);

      productGrid.appendChild(card);
    });
  }

  function handleBuy(productId, productName) {
    const email = prompt(`Enter your email to order "${productName}":`);
    if (!email) return;
    const ordersRef = database.ref("orders");
    const newOrderRef = ordersRef.push();
    newOrderRef
      .set({
        productId,
        email,
        timestamp: Date.now()
      })
      .then(() => {
        alert("Thank you! Your order has been placed.");
      })
      .catch(err => {
        console.error("Error placing order:", err);
        alert("Failed to place order. Please try again later.");
      });
  }

  window.addEventListener("DOMContentLoaded", () => {
    loadProducts();
  });
}

// ------------------------------------------------
// 5) ADMIN AUTH + DASHBOARD (for admin.html only)
// ------------------------------------------------
if (page === "admin.html") {
  document.body.classList.add("admin-loaded"); // enable scroll
  const loginWrapper = document.getElementById("loginWrapper");
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const dashboardSection = document.getElementById("dashboardSection");
  const logoutBtn = document.getElementById("logoutBtn");
  const addProductForm = document.getElementById("addProductForm");
  const prodNameInput = document.getElementById("prodName");
  const prodDescInput = document.getElementById("prodDesc");
  const prodPriceInput = document.getElementById("prodPrice");
  const prodImageInput = document.getElementById("prodImage");
  const existingProductsList = document.getElementById("existingProductsList");
  const ordersTableBody = document.querySelector("#ordersTable tbody");

  // Auth state listener
  auth.onAuthStateChanged(user => {
    if (user) {
      loginWrapper.classList.add("hidden");
      dashboardSection.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
      loadExistingProducts();
      loadOrders();
    } else {
      loginWrapper.classList.remove("hidden");
      dashboardSection.classList.add("hidden");
      logoutBtn.classList.add("hidden");
    }
  });

  // Handle login
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const pw = loginPassword.value;
    if (!email || !pw) {
      alert("Please enter both email and password.");
      return;
    }
    auth
      .signInWithEmailAndPassword(email, pw)
      .then(() => {
        loginForm.reset();
      })
      .catch(err => {
        console.error("Login error:", err);
        alert("Login failed: " + err.message);
      });
  });

  // Handle logout
  logoutBtn.addEventListener("click", () => {
    auth
      .signOut()
      .then(() => {
        // nothing else to do; listener will switch view
      })
      .catch(err => {
        console.error("Logout error:", err);
      });
  });

  // Add new product
  addProductForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = prodNameInput.value.trim();
    const description = prodDescInput.value.trim();
    const price = parseFloat(prodPriceInput.value).toFixed(2);
    const imageUrl = prodImageInput.value.trim();
    if (!name || !description || !price || !imageUrl) {
      alert("Please fill in all fields.");
      return;
    }
    const productsRef = database.ref("products");
    const newProdRef = productsRef.push();
    newProdRef
      .set({ name, description, price, imageUrl })
      .then(() => {
        alert("Product added successfully!");
        addProductForm.reset();
      })
      .catch(err => {
        console.error("Error adding product:", err);
        alert("Failed to add product.");
      });
  });

  // Load existing products
  function loadExistingProducts() {
    const productsRef = database.ref("products");
    productsRef.on("value", snapshot => {
      const data = snapshot.val() || {};
      renderExistingProducts(data);
    });
  }

  function renderExistingProducts(products) {
    existingProductsList.innerHTML = "";
    if (!Object.keys(products).length) {
      existingProductsList.innerHTML =
        '<p class="no-products">No products found.</p>';
      return;
    }
    Object.keys(products).forEach(key => {
      const { name, description, price, imageUrl } = products[key];
      const card = document.createElement("div");
      card.classList.add("product-card");

      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = name;
      card.appendChild(img);

      const infoDiv = document.createElement("div");
      infoDiv.innerHTML = `
        <h3>${name}</h3>
        <p>${description}</p>
        <div class="price">$${parseFloat(price).toFixed(2)}</div>
      `;
      card.appendChild(infoDiv);

      const removeBtn = document.createElement("button");
      removeBtn.classList.add("buy-btn");
      removeBtn.style.background = "#f00";
      removeBtn.style.color = "#fff";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        if (!confirm("Are you sure you want to remove this product?")) return;
        const singleProdRef = database.ref(`products/${key}`);
        singleProdRef.remove().catch(err => {
          console.error("Error removing product:", err);
          alert("Failed to remove product.");
        });
      });
      card.appendChild(removeBtn);

      existingProductsList.appendChild(card);
    });
  }

  // Load orders
  function loadOrders() {
    const ordersRef = database.ref("orders");
    ordersRef.on("value", snapshot => {
      const data = snapshot.val() || {};
      renderOrders(data);
    });
  }

  function renderOrders(orders) {
    ordersTableBody.innerHTML = "";
    if (!Object.keys(orders).length) {
      ordersTableBody.innerHTML =
        '<tr><td colspan="4" class="no-orders">No orders placed yet.</td></tr>';
      return;
    }
    // Need product name from products
    database
      .ref("products")
      .once("value")
      .then(prodSnap => {
        const prodData = prodSnap.val() || {};
        Object.keys(orders).forEach(orderId => {
          const { productId, email, timestamp } = orders[orderId];
          const productName = prodData[productId]?.name || "Unknown";
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${orderId}</td>
            <td>${productName}</td>
            <td>${email}</td>
            <td>${new Date(timestamp).toLocaleString()}</td>
          `;
          ordersTableBody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error("Error fetching products for orders:", err);
      });
  }

  // Kick off listeners
  window.addEventListener("DOMContentLoaded", () => {
    // Nothing else needed here; onAuthStateChanged will do the rest
  });
}
