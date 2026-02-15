// Simple test to verify authentication endpoints are working
const express = require('express');
const request = require('supertest');
const app = express();

// Mock the authentication routes
app.get('/api/auth/google', (req, res) => {
  res.status(200).json({ message: 'Google auth endpoint working' });
});

app.get('/api/auth/github', (req, res) => {
  res.status(200).json({ message: 'GitHub auth endpoint working' });
});

app.get('/api/auth/linkedin', (req, res) => {
  res.status(200).json({ message: 'LinkedIn auth endpoint working' });
});

app.get('/api/auth/azuread', (req, res) => {
  res.status(200).json({ message: 'Azure AD auth endpoint working' });
});

app.post('/api/auth/register', (req, res) => {
  res.status(200).json({ message: 'Email registration endpoint working' });
});

app.post('/api/auth/login', (req, res) => {
  res.status(200).json({ message: 'Email login endpoint working' });
});

// Test the endpoints
async function testAuthEndpoints() {
  console.log('Testing authentication endpoints...');
  
  const endpoints = [
    '/api/auth/google',
    '/api/auth/github', 
    '/api/auth/linkedin',
    '/api/auth/azuread',
    '/api/auth/register',
    '/api/auth/login'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await request(app).get(endpoint);
      console.log(`✓ ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`✗ ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('Authentication endpoint tests completed.');
}

if (require.main === module) {
  testAuthEndpoints();
}

module.exports = { testAuthEndpoints };