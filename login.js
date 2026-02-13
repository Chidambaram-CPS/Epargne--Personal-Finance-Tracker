/**
 * Login Page Script
 * Handles form submission and navigation to dashboard
 */

// Get DOM elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Handles form submission
 * Validates inputs and redirects to dashboard on success
 * @param {Event} e - Form submit event
 */
function handleLogin(e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Validation
  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Please enter a valid email address');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  // If validation passes, redirect to dashboard
  // TODO: In production, send credentials to server for authentication
  console.log('Logging in with:', { email, password });
  window.location.href = 'dashboard.html';
}

// Attach event listener
loginForm.addEventListener('submit', handleLogin);
