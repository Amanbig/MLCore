import axios from "axios";

// The Vite proxy handles routing from /api to http://127.0.0.1:8000
export const api = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
	// CRITICAL: Tells Axios to automatically include backend authorization cookies mapping to "set_cookie"
	withCredentials: true,
});
