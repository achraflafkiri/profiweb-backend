// utils/geocoding.js
const axios = require('axios');

// Cache to store city coordinates to avoid repeated API calls
const cityCoordinatesCache = new Map();

// Function to get coordinates from city name with caching
const getCityCoordinates = async (cityName) => {
  // Check cache first
  if (cityCoordinatesCache.has(cityName.toLowerCase())) {
    return cityCoordinatesCache.get(cityName.toLowerCase());
  }

  try {
    // Using Nominatim (OpenStreetMap) - free geocoding service
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: cityName,
        format: 'json',
        limit: 1,
        countrycodes: 'ma' // Morocco - adjust if needed
      },
      headers: {
        'User-Agent': 'ParentApp/1.0' // Replace with your app name
      }
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      const coords = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      };
      
      // Cache the result
      cityCoordinatesCache.set(cityName.toLowerCase(), coords);
      
      return coords;
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Distance in kilometers
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

module.exports = {
  getCityCoordinates,
  calculateDistance
};