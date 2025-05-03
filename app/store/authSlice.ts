import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  name: string;
  email: string;
  user_role?: string | number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  user_role: string | number | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  user_role: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string; user_role: string | number }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.user_role = action.payload.user_role;
      AsyncStorage.setItem("token", action.payload.token);
      AsyncStorage.setItem("user_role", String(action.payload.user_role));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.user_role = null;
      AsyncStorage.removeItem("token");
      AsyncStorage.removeItem("user_role");
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      if (action.payload.user_role !== undefined) {
        state.user_role = action.payload.user_role;
        AsyncStorage.setItem("user_role", String(action.payload.user_role));
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      AsyncStorage.setItem("token", action.payload);
    },
    setUserRole: (state, action: PayloadAction<string | number>) => {
      state.user_role = action.payload;
      AsyncStorage.setItem("user_role", String(action.payload));
    },
  },
});

export const { login, logout, setUser, setToken, setUserRole } = authSlice.actions;
export default authSlice.reducer;