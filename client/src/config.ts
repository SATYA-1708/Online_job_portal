// Use environment variables if provided, otherwise default to relative paths in production 
// and localhost:5000 for local development. This ensures it works seamlessly anywhere.
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : `http://${window.location.hostname}:5000/api`);
const SERVER_BASE = import.meta.env.VITE_SERVER_URL || (import.meta.env.PROD ? '' : `http://${window.location.hostname}:5000`);

export { API_BASE, SERVER_BASE };
