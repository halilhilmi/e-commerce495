let currentUser = null;
let products = [];
let users = [];

const productsTableBody = document.getElementById('products-table-body');
const usersTableBody = document.getElementById('users-table-body');
const usernameElement = document.getElementById('username');
const logoutBtn = document.getElementById('logout-btn');
const addProductForm = document.getElementById('add-product-form');
const addUserForm = document.getElementById('add-user-form');
const sectionLinks = document.querySelectorAll('.list-group-item');
const productSection = document.getElementById('products-section');
const userSection = document.getElementById('users-section');

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();

    setupEventListeners();
});

function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);
    
    addProductForm.addEventListener('submit', handleAddProduct);
    
    addUserForm.addEventListener('submit', handleAddUser);
    
    sectionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            showSection(section);
        });
    });
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
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            usernameElement.textContent = currentUser.name;
            
            if (!currentUser.isAdmin) {
                window.location.href = '/index.html';
                return;
            }
            
            loadProducts();
            loadUsers();
        } else {
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/index.html';
    }
}

async function loadProducts() {
    try {
        const url = `/api/products?_=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-cache' }); 

        if (response.ok) {
            const result = await response.json(); 
            products = result.data; 
            displayProducts();
        } else {
            showProductsError('Failed to load products');
        }
    } catch (error) {
        showProductsError('Failed to load products');
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            credentials: 'include'
        });
        if (response.ok) {
            users = await response.json();
            displayUsers();
        } else {
            showUsersError('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showUsersError('Failed to load users');
    }
}

function displayProducts() {
    productsTableBody.innerHTML = '';
    
    if (products.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No products found</td>';
        productsTableBody.appendChild(row);
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = product.name;
        
        const categoryCell = document.createElement('td');
        categoryCell.textContent = product.category;
        
        const priceCell = document.createElement('td');
        priceCell.textContent = `$${product.price.toFixed(2)}`;
        
        const actionsCell = document.createElement('td');
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-primary me-2';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editProduct(product._id);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteProduct(product._id);
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(nameCell);
        row.appendChild(categoryCell);
        row.appendChild(priceCell);
        row.appendChild(actionsCell);
        
        productsTableBody.appendChild(row);
    });
}

function displayUsers() {
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No users found</td>';
        usersTableBody.appendChild(row);
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name;
        
        const emailCell = document.createElement('td');
        emailCell.textContent = user.email;
        
        const roleCell = document.createElement('td');
        roleCell.textContent = user.isAdmin ? 'Admin' : 'User';
        
        const actionsCell = document.createElement('td');
        
        // Don't allow deleting the current user
        if (user._id !== currentUser._id) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteUser(user._id);
            actionsCell.appendChild(deleteBtn);
        } else {
            actionsCell.textContent = '(Current User)';
        }
        
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(roleCell);
        row.appendChild(actionsCell);
        
        usersTableBody.appendChild(row);
    });
}

async function handleAddProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const imageUrl = document.getElementById('product-image').value;
    const seller = document.getElementById('product-seller').value;
    const addProductError = document.getElementById('add-product-error');
    
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description,
                price,
                category,
                seller: seller || undefined,
                images: imageUrl ? [imageUrl] : []
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const addProductModal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            addProductModal.hide();
            
            addProductForm.reset();
            addProductError.classList.add('d-none');
            
            loadProducts();
        } else {
            const errorData = await response.json();
            addProductError.textContent = errorData.message || 'Failed to add product';
            addProductError.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        addProductError.textContent = 'An error occurred while adding the product';
        addProductError.classList.remove('d-none');
    }
}

async function handleAddUser(event) {
    event.preventDefault();
    
    const name = document.getElementById('user-name').value;
    const surname = document.getElementById('user-surname').value;
    const email = document.getElementById('user-email').value;
    const phone = document.getElementById('user-phone').value;
    const password = document.getElementById('user-password').value;
    const isAdmin = document.getElementById('user-admin').checked;
    const addUserError = document.getElementById('add-user-error');
    
    if (!name || !surname || !email || !phone || !password) {
        addUserError.textContent = 'Missing required fields (name, surname, email, phone, password)';
        addUserError.classList.remove('d-none');
        return;
    }
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                surname,
                email,
                phone,
                password,
                isAdmin
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const addUserModal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            addUserModal.hide();
            
            addUserForm.reset();
            addUserError.classList.add('d-none');
            
            loadUsers();
        } else {
            const errorData = await response.json();
            addUserError.textContent = errorData.message || 'Failed to add user';
            addUserError.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error adding user:', error);
        addUserError.textContent = 'An error occurred while adding the user';
        addUserError.classList.remove('d-none');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            loadProducts();
        } else {
            const errorData = await response.json();
            showToast(errorData.message || 'Failed to delete product', 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('An error occurred while deleting the product', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            loadUsers();
        } else {
            const errorData = await response.json();
            showToast(errorData.message || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('An error occurred while deleting the user', 'error');
    }
}

function editProduct(productId) {
    window.location.href = `/edit-product.html?id=${productId}`;
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

function showSection(section) {
    sectionLinks.forEach(link => {
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    if (section === 'products') {
        productSection.classList.remove('d-none');
        userSection.classList.add('d-none');
    } else if (section === 'users') {
        productSection.classList.add('d-none');
        userSection.classList.remove('d-none');
    }
}

function showProductsError(message) {
    productsTableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-danger">${message}</td>
        </tr>
    `;
}

function showUsersError(message) {
    usersTableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-danger">${message}</td>
        </tr>
    `;
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