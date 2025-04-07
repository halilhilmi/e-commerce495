document.addEventListener('DOMContentLoaded', () => {
    loadProductDetails();
    document.getElementById('edit-product-form').addEventListener('submit', handleUpdateProduct);
});

let currentProduct = null;

function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function loadProductDetails() {
    const productId = getProductId();
    const form = document.getElementById('edit-product-form');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    if (!productId) {
        errorMessage.textContent = 'No product ID found in URL.';
        errorMessage.classList.remove('d-none');
        loadingMessage.classList.add('d-none');
        return;
    }

    try {
        const url = `/api/products/${productId}?_=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-cache' });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                currentProduct = result.data;
                populateForm(currentProduct);
                form.classList.remove('d-none');
            } else {
                throw new Error(result.message || 'Failed to load product data.');
            }
        } else if (response.status === 404) {
            throw new Error('Product not found.');
        } else {
            throw new Error(`Failed to load product. Status: ${response.status}`);
        }

    } catch (error) {
        console.error('Error loading product details:', error);
        errorMessage.textContent = error.message || 'An error occurred while loading product details.';
        errorMessage.classList.remove('d-none');
    } finally {
        loadingMessage.classList.add('d-none');
    }
}

function populateForm(product) {
    document.getElementById('product-id').value = product._id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-image').value = product.images && product.images.length > 0 ? product.images[0] : '';
    document.getElementById('product-seller').value = product.seller || '';
    document.getElementById('product-material').value = product.material || '';
    document.getElementById('product-size').value = product.size || '';
    document.getElementById('product-age').value = product.age !== null && product.age !== undefined ? product.age : '';
    document.getElementById('product-battery').value = product.batteryLife !== null && product.batteryLife !== undefined ? product.batteryLife : '';
}

async function handleUpdateProduct(event) {
    event.preventDefault();
    const productId = document.getElementById('product-id').value;
    const errorMessage = document.getElementById('error-message');

    const updatedProductData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        seller: document.getElementById('product-seller').value || null,
        images: [document.getElementById('product-image').value].filter(url => url),
        material: document.getElementById('product-material').value || null,
        size: document.getElementById('product-size').value || null,
        age: document.getElementById('product-age').value ? parseInt(document.getElementById('product-age').value) : null,
        batteryLife: document.getElementById('product-battery').value ? parseInt(document.getElementById('product-battery').value) : null,
    };

    if (isNaN(updatedProductData.price) || updatedProductData.price <= 0) {
        errorMessage.textContent = 'Please enter a valid price.';
        errorMessage.classList.remove('d-none');
        return;
    }
    
    errorMessage.classList.add('d-none');

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProductData),
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showToast('Product updated successfully!', 'success');

                setTimeout(() => {
                    window.location.href = '/admin.html';
                }, 500);

            } else {
                throw new Error(result.message || 'Failed to update product.');
            }
        } else {
            const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status}` }));
             throw new Error(errorData.message || `Failed to update product. Status: ${response.status}`);
        }

    } catch (error) {
        console.error('Error updating product:', error);
        errorMessage.textContent = error.message || 'An error occurred while updating the product.';
        errorMessage.classList.remove('d-none');
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