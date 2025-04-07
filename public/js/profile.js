let currentUser = null;
let userReviews = [];
let profileUserId = null;

const usernameElement = document.getElementById('username');
const profileUsernameElement = document.getElementById('profile-username');
const profileEmailElement = document.getElementById('profile-email');
const profileAvgRatingElement = document.getElementById('profile-avg-rating');
const userReviewsContainer = document.getElementById('user-reviews-container');
const adminPanelLink = document.getElementById('admin-panel-link');
const logoutBtn = document.getElementById('logout-btn');
const profileTitle = document.querySelector('.card-header h2');
const reviewsTitle = document.querySelector('#user-reviews-container').closest('.card').querySelector('.card-header h3');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    profileUserId = urlParams.get('id'); 

    checkAuthStatus();
    
    setupEventListeners();
});

function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);
}

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const targetProfileId = urlParams.get('id');
        
        if (targetProfileId) {
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                updateAuthUI();
            } else {
                const profileNavLink = document.querySelector('.navbar-nav .nav-item .nav-link');
                if (profileNavLink) {
                    profileNavLink.parentElement.style.display = 'none';
                }
                
                const userInfoElement = document.getElementById('user-info');
                if (userInfoElement) {
                    userInfoElement.style.display = 'none';
                }
            }
            
            loadUserProfile(targetProfileId, false);
            loadUserReviews(targetProfileId, false);
            
            profileTitle.textContent = "User Profile";
            reviewsTitle.textContent = "User's Reviews";
            
            return;
        }
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            updateAuthUI();
            
            loadUserProfile(currentUser._id, true);
            loadUserReviews(currentUser._id, true);
            
            profileTitle.textContent = "My Profile";
            reviewsTitle.textContent = "My Reviews";
        } else {
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        if (profileUserId) {
            loadUserProfile(profileUserId, false);
            loadUserReviews(profileUserId, false);
            
            const profileNavLink = document.querySelector('.navbar-nav .nav-item .nav-link');
            if (profileNavLink) {
                profileNavLink.parentElement.style.display = 'none';
            }
            
            const userInfoElement = document.getElementById('user-info');
            if (userInfoElement) {
                userInfoElement.style.display = 'none';
            }
        } else {
            window.location.href = '/index.html';
        }
    }
}

function updateAuthUI() {
    if (currentUser) {
        usernameElement.textContent = currentUser.name;
        
        if (currentUser.isAdmin) {
            adminPanelLink.style.display = 'block';
            adminPanelLink.href = 'admin.html';
        }
    }
}

async function loadUserProfile(userId, isOwnProfile) {
    const profileApiUrl = isOwnProfile ? '/api/users/profile' : `/api/users/${userId}`;
    
    try {
        const response = await fetch(profileApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            profileUsernameElement.textContent = `${userData.name || ''}${userData.surname ? ' ' + userData.surname : ''}`.trim() || 'User';
            profileEmailElement.textContent = isOwnProfile ? userData.email : '-'; 
        } else {
             console.error('Failed to load profile data. Status:', response.status);
            showError('Failed to load profile data');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile data');
    }
}

async function loadUserReviews(userId, isOwnProfile) {
    const reviewsApiUrl = `/api/users/${userId}/reviews`;
    
    try {
        const response = await fetch(reviewsApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            userReviews = await response.json();
            
            if (userReviews.length > 0) {
                const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
                const avgRating = totalRating / userReviews.length;
                profileAvgRatingElement.textContent = `${avgRating.toFixed(1)}/10 (${userReviews.length} reviews given)`;
            } else {
                profileAvgRatingElement.textContent = 'No ratings given yet';
            }
            
            displayUserReviews(isOwnProfile);
        } else {
             console.error('Failed to load reviews. Status:', response.status);
            showError('Failed to load reviews');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        showError('Failed to load reviews');
    }
}

function displayUserReviews(isOwnProfile) {
    userReviewsContainer.innerHTML = '';
    
    if (userReviews.length === 0) {
        userReviewsContainer.innerHTML = `<p class="text-center">${isOwnProfile ? 'You have' : 'This user has'} not written any reviews yet.</p>`;
        return;
    }
    
    userReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'card mb-3';
        
        const reviewCardBody = document.createElement('div');
        reviewCardBody.className = 'card-body';
        
        const productName = document.createElement('h5');
        productName.className = 'card-title';
        productName.textContent = review.productName;
        
        const reviewHeader = document.createElement('div');
        reviewHeader.className = 'd-flex justify-content-between align-items-center mb-2';
        
        const reviewRating = document.createElement('div');
        reviewRating.className = 'review-rating';
        reviewRating.textContent = `Rating: ${review.rating}/10`;

        if (review.rating && review.rating > 0) {
            const hue = ((review.rating - 1) / 9) * 120;
            reviewRating.style.color = `hsl(${hue}, 100%, 40%)`;
        }
        
        const reviewDate = document.createElement('small');
        reviewDate.className = 'text-muted';
        reviewDate.textContent = new Date(review.createdAt).toLocaleDateString();
        
        reviewHeader.appendChild(reviewRating);
        reviewHeader.appendChild(reviewDate);
        
        const reviewComment = document.createElement('p');
        reviewComment.className = 'card-text';
        reviewComment.textContent = review.comment;
        
        reviewCardBody.appendChild(productName);
        reviewCardBody.appendChild(reviewHeader);
        reviewCardBody.appendChild(reviewComment);
        
        reviewCard.appendChild(reviewCardBody);
        userReviewsContainer.appendChild(reviewCard);
    });
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
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showError(message) {
    userReviewsContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
            ${message}
        </div>
    `;
} 