// Global variables
let currentUser = null;
let isAdmin = false;
let products = [];
let activeFilters = ['All'];
let currentSearchTerm = ''; // Keep track of search term

// DOM elements
const productsContainer = document.getElementById('products-container');
const authButtons = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');
const usernameElement = document.getElementById('username');
const adminPanelLink = document.getElementById('admin-panel-link');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const categoryFilters = document.querySelectorAll('.category-filter');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    checkAuthStatus();
    
    // Load products
    fetchProducts();
    
    // Setup event listeners
    setupEventListeners();
});

// Event listeners setup
function setupEventListeners() {
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Logout button click
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Category filters
    if (categoryFilters && categoryFilters.length > 0) {
        categoryFilters.forEach(filter => {
            filter.addEventListener('change', handleCategoryFilter);
        });
    }
    
    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    // Search input enter key
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
}

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            isAdmin = data.user.isAdmin;
            
            // Update UI based on auth status
            updateAuthUI();
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// Update UI based on authentication status
function updateAuthUI() {
    if (currentUser) {
        authButtons.classList.add('d-none');
        userInfo.classList.remove('d-none');
        usernameElement.textContent = currentUser.name;
        
        if (isAdmin) {
            adminPanelLink.style.display = 'block';
        }
        
        // Add Profile link to navbar
        if (!document.getElementById('profile-link')) {
            const navbarNav = document.querySelector('.navbar-nav');
            const profileLi = document.createElement('li');
            profileLi.className = 'nav-item';
            
            const profileLink = document.createElement('a');
            profileLink.className = 'nav-link';
            profileLink.href = 'profile.html';
            profileLink.textContent = 'My Profile';
            profileLink.id = 'profile-link';
            
            profileLi.appendChild(profileLink);
            navbarNav.appendChild(profileLi);
        }
        
        // Show rating/review controls for logged in users
        const ratingSection = document.getElementById('rating-section');
        if (ratingSection) {
            ratingSection.classList.remove('d-none');
        }
    } else {
        authButtons.classList.remove('d-none');
        userInfo.classList.add('d-none');
        
        // Remove Profile link from navbar
        const profileLink = document.getElementById('profile-link');
        if (profileLink) {
            profileLink.parentElement.remove();
        }
        
        // Hide rating/review controls for guests
        const ratingSection = document.getElementById('rating-section');
        if (ratingSection) {
            ratingSection.classList.add('d-none');
        }
    }
}

// Fetch products from API with current filters and search
async function fetchProducts() {
    if (!productsContainer) {
        return;
    }
    
    productsContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>'; // Show loading spinner

    const params = new URLSearchParams();
    
    // Add categories (unless 'All' is selected)
    if (!activeFilters.includes('All')) {
        activeFilters.forEach(cat => params.append('category', cat));
    }
    
    // Add search term
    if (currentSearchTerm) {
        params.append('search', currentSearchTerm);
    }
    
    const url = `/api/products${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            products = result.data || []; // Assuming API returns { data: [...] }
            displayProducts(products);
        } else {
            showError('Failed to load products');
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        showError('Failed to load products');
    }
}

// Display products in the products container
function displayProducts(productsToDisplay) {
    // Clear loading spinner
    productsContainer.innerHTML = '';
    
    if (productsToDisplay.length === 0) {
        productsContainer.innerHTML = '<div class="col-12 text-center py-5"><p>No products found matching your criteria.</p></div>';
        return;
    }
    
    // Create product cards
    productsToDisplay.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
}

// Create a product card element
function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-sm-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card product-card h-100';
    card.dataset.productId = product._id;
    card.addEventListener('click', () => openProductModal(product));
    
    // Product image
    const imgContainer = document.createElement('div');
    imgContainer.className = 'product-img-container';
    
    const img = document.createElement('img');
    img.className = 'product-img';
    img.src = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'images/placeholder.jpg';
    img.alt = product.name;
    imgContainer.appendChild(img);
    
    // Card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const name = document.createElement('h5');
    name.className = 'card-title';
    name.textContent = product.name;
    
    const price = document.createElement('p');
    price.className = 'card-text product-price';
    price.textContent = `$${product.price.toFixed(2)}`;
    
    // Add product description with two-line limit
    const description = document.createElement('p');
    description.className = 'card-text product-description';
    description.textContent = product.description || 'No description available';
    
    const category = document.createElement('p');
    category.className = 'card-text product-category';
    category.textContent = product.category;
    
    // Add seller information if available
    if (product.seller) {
        const seller = document.createElement('p');
        seller.className = 'card-text product-seller';
        seller.textContent = `Seller: ${product.seller}`;
        cardBody.appendChild(seller);
    }
    
    const rating = document.createElement('div');
    rating.className = 'product-rating';
    rating.textContent = `Rating: ${product.avgRating.toFixed(1)} (${product.reviews.length} reviews)`;

    // Set color based on rating (red to green)
    if (product.reviews.length > 0 && product.avgRating > 0) {
        // Interpolate hue from 0 (red) to 120 (green) based on rating 1-10
        const hue = ((product.avgRating - 1) / 9) * 120;
        rating.style.color = `hsl(${hue}, 100%, 40%)`; // Using HSL for smooth transition
    }
    
    // Assemble card
    cardBody.appendChild(name);
    cardBody.appendChild(price);
    cardBody.appendChild(description); // Add description to card
    cardBody.appendChild(category);
    cardBody.appendChild(rating);
    
    card.appendChild(imgContainer);
    card.appendChild(cardBody);
    
    col.appendChild(card);
    return col;
}

// Open product modal with details
function openProductModal(product) {
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    
    // Set product details in modal
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-price').textContent = product.price.toFixed(2);
    document.getElementById('product-category').textContent = product.category;
    
    // Set seller information
    const sellerElement = document.getElementById('product-seller');
    if (sellerElement) {
        sellerElement.textContent = product.seller || 'Unknown';
    }
    
    document.getElementById('product-rating').textContent = product.avgRating.toFixed(1);
    document.getElementById('product-reviews-count').textContent = product.reviews.length;
    
    // Set product image
    const productImage = document.getElementById('product-image');
    productImage.src = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'images/placeholder.jpg';

    // --- Handle Optional Attributes --- 
    const optionalAttributes = [
        { id: 'material', value: product.material, unit: '' },
        { id: 'size', value: product.size, unit: '' },
        { id: 'age', value: product.age, unit: '' }, // Consider adding " years" or similar if applicable
        { id: 'battery', value: product.batteryLife, unit: '' }
    ];

    optionalAttributes.forEach(attr => {
        const container = document.getElementById(`product-${attr.id}-container`);
        const span = document.getElementById(`product-${attr.id}`);
        if (container && span && attr.value !== null && attr.value !== undefined && String(attr.value).trim() !== '') {
            span.textContent = attr.value + attr.unit;
            container.style.display = 'block'; 
        } else if (container) {
            container.style.display = 'none'; 
        }
    });

    displayReviews(product.reviews || [], product._id);
    
    if (currentUser) {
        document.getElementById('rating-section').classList.remove('d-none');
        
        document.getElementById('review-text').value = ''; 
        
        const ratingInput = document.getElementById('rating-value');
        ratingInput.value = '0'; 
        const starContainer = document.getElementById('star-rating-input');
        if (starContainer) {
            updateStarDisplay(starContainer, 0); 
        }
        
        setupStarRatingInput(); 
        
        const submitReviewBtn = document.getElementById('submit-review');
        submitReviewBtn.replaceWith(submitReviewBtn.cloneNode(true)); 
        document.getElementById('submit-review').onclick = () => submitReview(product._id);

    } else {
        document.getElementById('rating-section').classList.add('d-none');
    }
    
    productModal.show();
}

function displayReviews(reviews, productId) {
    const reviewsContainer = document.getElementById('reviews-container');
    const noReviewsMessage = document.getElementById('no-reviews-message');
    
    reviewsContainer.innerHTML = '';
    
    if (reviews.length === 0) {
        if (noReviewsMessage) {
             noReviewsMessage.style.display = 'block';
             reviewsContainer.appendChild(noReviewsMessage); // Append ensures it's visible
        } else {
             const p = document.createElement('p');
             p.id = 'no-reviews-message';
             p.textContent = 'No reviews yet.';
             reviewsContainer.appendChild(p);
        }
        return;
    } else if (noReviewsMessage) {
         noReviewsMessage.style.display = 'none';
    }
    
    reviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item mb-3';
        reviewItem.id = `review-${review._id}`; 
        
        const reviewHeader = document.createElement('div');
        reviewHeader.className = 'd-flex justify-content-between align-items-center mb-1';
        
        const reviewUserInfo = document.createElement('div'); 
        
        let userElement;
        if (review.userId && review.userId._id) {
            userElement = document.createElement('a');
            userElement.href = `/profile.html?id=${review.userId._id}`;
            userElement.className = 'review-user fw-bold me-2 text-decoration-none'; 
            const userName = `${review.userId.name || ''}${review.userId.surname ? ' ' + review.userId.surname : ''}`.trim();
            userElement.textContent = userName || 'User'; 
        } else {
            userElement = document.createElement('span');
            userElement.className = 'review-user fw-bold me-2';
            userElement.textContent = 'Anonymous';
        }
        
        const reviewDate = document.createElement('small');
        reviewDate.className = 'review-date text-muted';
        reviewDate.textContent = new Date(review.createdAt).toLocaleDateString();

        reviewUserInfo.appendChild(userElement); 
        reviewUserInfo.appendChild(reviewDate);

        reviewHeader.appendChild(reviewUserInfo);
        
        if (currentUser && review.userId && review.userId._id && review.userId._id === currentUser._id) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-sm btn-outline-danger ms-2'; 
            deleteButton.innerHTML = '&times;'; 
            deleteButton.title = 'Delete Review';
            deleteButton.onclick = () => handleDeleteReview(productId, review._id); 
            reviewHeader.appendChild(deleteButton);
        }
        
        const reviewRatingStars = generateStars(review.rating);
        reviewRatingStars.classList.add('mb-2');
        
        const reviewComment = document.createElement('p');
        reviewComment.className = 'review-comment mb-0';
        reviewComment.textContent = review.comment || "";

        reviewItem.appendChild(reviewHeader);
        reviewItem.appendChild(reviewRatingStars);
        if (review.comment) {
             reviewItem.appendChild(reviewComment);
        }
        
        reviewsContainer.appendChild(reviewItem);
    });
}

function handleCategoryFilter(event) {
    const allCategoryCheckbox = document.getElementById('all-category');
    const selectedCategory = event.target.value;
    
    if (selectedCategory === 'All') {
        if (allCategoryCheckbox.checked) {
            categoryFilters.forEach(filter => {
                if (filter.value !== 'All') {
                    filter.checked = false;
                }
            });
            activeFilters = ['All'];
        } else {
            if (!Array.from(categoryFilters).some(filter => filter.checked)) {
                allCategoryCheckbox.checked = true;
                activeFilters = ['All'];
            }
        }
    } else {
        if (event.target.checked) {
            allCategoryCheckbox.checked = false;
            
            if (!activeFilters.includes(selectedCategory)) {
                activeFilters = activeFilters.filter(cat => cat !== 'All');
                activeFilters.push(selectedCategory);
            }
        } else {
            activeFilters = activeFilters.filter(cat => cat !== selectedCategory);
            
            if (activeFilters.length === 0) {
                allCategoryCheckbox.checked = true;
                activeFilters = ['All'];
            }
        }
    }
    
    fetchProducts();
}

function handleSearch() {
    currentSearchTerm = searchInput.value.trim();
    fetchProducts();
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginError = document.getElementById('login-error');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            isAdmin = data.user.isAdmin;
            
            // Update UI
            updateAuthUI();
            
            // Close modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
            
            // Reset form
            loginForm.reset();
            loginError.classList.add('d-none');
        } else {
            const errorData = await response.json();
            loginError.textContent = errorData.message || 'Login failed. Please check your credentials.';
            loginError.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'An error occurred during login. Please try again.';
        loginError.classList.remove('d-none');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const surname = document.getElementById('register-surname').value; 
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const registerError = document.getElementById('register-error');

    if (!name || !surname || !email || !phone || !password) {
        registerError.textContent = 'Missing required fields (name, surname, email, phone, password)';
        registerError.classList.remove('d-none');
        return;
    }
    registerError.classList.add('d-none');

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                surname,
                email,
                phone, 
                password
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            isAdmin = data.user.isAdmin;
            
            // Update UI
            updateAuthUI();
            
            // Close modal
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            registerModal.hide();
            
            // Reset form
            registerForm.reset();
        } else {
            const errorData = await response.json();
            registerError.textContent = errorData.message || 'Registration failed. Please try again.';
            registerError.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Registration error:', error);
        registerError.textContent = 'An error occurred during registration. Please try again.';
        registerError.classList.remove('d-none');
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            currentUser = null;
            isAdmin = false;
            
            updateAuthUI();
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}


function updateStarDisplay(starContainer, value) {
    const stars = starContainer.querySelectorAll('.star');
    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        star.classList.remove('hovered', 'selected'); // Clear previous states
        if (starValue <= value) {
            star.classList.add('selected');
        }
    });
}

function handleStarHover(event) {
    const starContainer = event.currentTarget;
    const hoveredStar = event.target.closest('.star');
    if (!hoveredStar) return;

    const hoverValue = parseInt(hoveredStar.dataset.value);
    const stars = starContainer.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('hovered');
        if (parseInt(star.dataset.value) <= hoverValue) {
            star.classList.add('hovered');
        }
    });
}

function handleStarMouseOut(event) {
    const starContainer = event.currentTarget;
    const ratingInput = document.getElementById('rating-value');
    const currentValue = parseInt(ratingInput.value);
    updateStarDisplay(starContainer, currentValue);
}

function handleStarClick(event) {
    const clickedStar = event.target.closest('.star');
    if (!clickedStar) return;

    const ratingInput = document.getElementById('rating-value');
    const newValue = parseInt(clickedStar.dataset.value);
    ratingInput.value = newValue;
    
    const starContainer = event.currentTarget;
    updateStarDisplay(starContainer, newValue); 
}

function setupStarRatingInput() {
    const starContainer = document.getElementById('star-rating-input');
    if (!starContainer) return;

    starContainer.removeEventListener('mouseover', handleStarHover);
    starContainer.removeEventListener('mouseout', handleStarMouseOut);
    starContainer.removeEventListener('click', handleStarClick);

    starContainer.addEventListener('mouseover', handleStarHover);
    starContainer.addEventListener('mouseout', handleStarMouseOut);
    starContainer.addEventListener('click', handleStarClick);

    const ratingInput = document.getElementById('rating-value');
    updateStarDisplay(starContainer, parseInt(ratingInput.value));
}


function generateStars(rating) {
    const starContainer = document.createElement('div');
    starContainer.className = 'star-rating';
    const maxStars = 10;

    for (let i = 1; i <= maxStars; i++) {
        const star = document.createElement('span');
        star.innerHTML = i <= rating ? '&#9733;' : '&#9734;';
        starContainer.appendChild(star);
    }
    return starContainer;
}

async function submitReview(productId) {
    const ratingInput = document.getElementById('rating-value');
    const rating = parseInt(ratingInput.value);
    const reviewText = document.getElementById('review-text').value.trim();
    
    if (rating === 0 && !reviewText) {
        showToast('Please select a rating or write a review comment.', 'warning');
        return;
    }
    
    const requestBody = {};
    if (rating > 0) {
        requestBody.rating = rating;
    }
    if (reviewText) {
        requestBody.comment = reviewText;
    }
    
    console.log('Submitting review with body:', requestBody);

    try {
        const response = await fetch(`/api/products/${productId}/review`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            credentials: 'include'
        });
        
        const responseData = await response.json();
        console.log('Server response:', response.status, responseData);

        if (response.ok) {
            showToast('Review submitted successfully', 'success');
            
            await fetchProducts();
            
            const productModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            productModal.hide(); 
            document.getElementById('review-text').value = '';
            ratingInput.value = '0';
            const starContainer = document.getElementById('star-rating-input');
            if (starContainer) updateStarDisplay(starContainer, 0);

        } else {
            showToast(responseData.message || `Failed to submit review (Status: ${response.status})`, 'error');
        }
    } catch (error) {
        console.error('Review submission error:', error);
        showToast('An error occurred while submitting your review.', 'error');
    }
}

async function handleDeleteReview(productId, reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${productId}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const responseData = await response.json();

        if (response.ok) {
            showToast('Review deleted successfully', 'success');
            const reviewElement = document.getElementById(`review-${reviewId}`);
            if (reviewElement) {
                reviewElement.remove();
            }
            const productRatingSpan = document.getElementById('product-rating');
            const reviewsCountSpan = document.getElementById('product-reviews-count');
            if (productRatingSpan) {
                productRatingSpan.textContent = responseData.avgRating.toFixed(1);
            }
            // Update review count (decrement)
            if (reviewsCountSpan) {
                const currentCount = parseInt(reviewsCountSpan.textContent);
                reviewsCountSpan.textContent = Math.max(0, currentCount - 1); // Decrement or keep at 0
            }
            await fetchProducts(); 

        } else {
            showToast(responseData.message || 'Failed to delete review', 'error');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showToast('An error occurred while deleting the review.', 'error');
    }
}

function showError(message) {
    if (productsContainer) {
        productsContainer.innerHTML = `<div class="col-12 text-center py-5"><p class="text-danger">${message}</p></div>`;
    }
}

function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = 'info', duration = 5000) {
    const container = ensureToastContainer();

    const toast = document.createElement('div');
    toast.classList.add('toast');
    if (type) {
        toast.classList.add(type);
    }
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, { once: true });
    }, duration);
}

