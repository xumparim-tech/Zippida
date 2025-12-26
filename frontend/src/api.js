import axios from 'axios';

// "VITE_API_URL" Vercel o'zgaruvchisidan olinadi. 
// Agar u yo'q bo'lsa (localda), localhost ishlatiladi.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 15000, // 15s (Render serveri uyqudan turishi uchun vaqt kerak)
});

export default api;
