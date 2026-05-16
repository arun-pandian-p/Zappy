/**
 * 🖼️ Test Unsplash API
 * Verifies Unsplash API connectivity and image search functionality.
 * 
 * Usage: node scripts/utils/test_unsplash.js
 */
const accessKey = 'yj0MFfgE-D__T4jgS5zA3KXWs8zh8vf9P7nbyMM4cNI';
const query = 'burger';

async function testUnsplash() {
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${accessKey}`);
    const data = await response.json();
    console.log('Unsplash test results count:', data.results?.length);
    if (data.results?.length > 0) {
      console.log('First image URL:', data.results[0].urls.small);
    } else {
      console.log('No results found. Response:', data);
    }
  } catch (error) {
    console.error('Unsplash test failed:', error);
  }
}

testUnsplash();
