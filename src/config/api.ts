// API Configuration
// Always use local backend (bundled with Electron app)

// Local backend URL (bundled with Electron)
const LOCAL_API_URL = 'http://localhost:5000';

// Always use local backend since it's bundled with the app
export const API_BASE_URL = import.meta.env.VITE_API_URL || LOCAL_API_URL;

console.log('🔗 API Base URL:', API_BASE_URL);
