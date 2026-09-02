import axios from "axios";

const axiosInstance = axios.create({
    // In development the API runs on port 5000; in production the Express
    // server serves the frontend and proxies /api from the same origin.
    baseURL: import.meta.env.DEV ? "http://localhost:5000/api" : "/api",
    withCredentials: true,
});

export default axiosInstance;
