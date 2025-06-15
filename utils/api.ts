import { Platform } from "react-native";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:8000/api"
    : "http://localhost:8000/api");

// For production, prefer EXPO_PUBLIC_API_URL, which should be set in your .env file or CI/CD environment.
// Example .env.production:
// EXPO_PUBLIC_API_URL=https://your-production-domain.com/api