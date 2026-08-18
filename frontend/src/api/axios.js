import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// We will attach the token to requests in the AuthContext where we have access to it, 
// or we can use a getter here if we expose a module-level variable.
// For simplicity with React Context, we will attach it within the components or provide a function.
// Let's set up an interceptor that reads from a global variable if needed, but context is better.
// Actually, we can just export the axios instance.

export default api;
