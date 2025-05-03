import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, typography } from "../constants/theme";


 axios.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
   if (token) {
     config.headers = config.headers || {};
     config.headers["Authorization"] = `Bearer ${token}`;
   }
   return config;
 });

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState<Array<{id: string, name: string}>>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [selectedUserType, setSelectedUserType] = useState<string>("user");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (isRegistering) {
      axios.get(`${API_URL}/offices`).then(res => {
        setOffices(res.data.data.offices || []);
      }).catch(() => setOffices([]));
    }
  }, [isRegistering]);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { access_token, user_role } = response.data;
      await AsyncStorage.setItem("token", access_token);
      if (user_role) {
        // Ensure user_role is stored as a string (e.g., 'user', 'staff', 'admin', 'superadmin')
        await AsyncStorage.setItem("user_role", String(user_role));
      }
      // Fetch user details from profile endpoint
      const profileRes = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const user = profileRes.data.user;
      if (user && typeof user.user_role !== "undefined") {
        // Always store user_role as a string
        await AsyncStorage.setItem("user_role", String(user.user_role));
      }
      await AsyncStorage.setItem("user", JSON.stringify(user));
      // Optionally, update Redux store here if using
      // Navigate based on string role
      switch (String(user.user_role)) {
        case "admin":
        case "superadmin":
          router.replace("/screens/adminDashboard");
          break;
        case "staff":
          router.replace("/screens/staffDashboard");
          break;
        case "user":
          router.replace("/screens/userDashboard");
          break;
        default:
          setErrorMessage("Unknown role. Please contact support.");
          break;
      }
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage("Full name is required");
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Email is required");
      setLoading(false);
      return;
    }
    if (!selectedOfficeId) {
      setErrorMessage("Please select an office");
      setLoading(false);
      return;
    }
    if (!password) {
      setErrorMessage("Password is required");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmPassword,
        user_role: selectedUserType,
        office_id: selectedOfficeId,
      });
      if (response.data.user) {
        if (response.data.user.user_role) {
          await AsyncStorage.setItem("user_role", String(response.data.user.user_role));
        }
        Alert.alert("Registration successful! Please login.");
        setIsRegistering(false);
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setSelectedOfficeId("");
        setSelectedUserType("user");
      } else {
        setErrorMessage(response.data.error || "Registration failed");
      }
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formBox}>
        <Text style={styles.title}>{isRegistering ? "Register" : "Login"}</Text>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {isRegistering && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Office</Text>
              <View style={styles.dropdownBox}>
                <Picker
                  selectedValue={selectedOfficeId}
                  onValueChange={v => setSelectedOfficeId(v || "")}
                  style={{ flex: 1 }}
                >
                  <Picker.Item label="Select Office" value="" />
                  {offices.map(office => (
                    <Picker.Item key={office.id} label={office.name} value={office.id} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Role</Text>
              <View style={styles.dropdownBox}>
                <Picker
                  selectedValue={selectedUserType}
                  onValueChange={v => setSelectedUserType(v)}
                  style={{ flex: 1 }}
                >
                  <Picker.Item label="User" value="user" />
                  <Picker.Item label="Staff" value="staff" />
                </Picker>
              </View>
            </View>
          </>
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible(v => !v)}>
            <Text style={styles.toggle}>{isPasswordVisible ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
        {isRegistering && (
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Confirm Password"
              secureTextEntry={!isConfirmPasswordVisible}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(v => !v)}>
              <Text style={styles.toggle}>{isConfirmPasswordVisible ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={isRegistering ? handleRegister : handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isRegistering ? "Register" : "Login"}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => {
            setIsRegistering(v => !v);
            setErrorMessage(null);
          }}
        >
          <Text style={styles.switchText}>
            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

import { Picker } from '@react-native-picker/picker';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f4f6fb",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  formBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 44,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#fafbfc",
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
    marginLeft: 2,
  },
  dropdownBox: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fafbfc",
    paddingHorizontal: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  toggle: {
    color: "#1976d2",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#1976d2",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  switchBtn: {
    marginTop: 18,
    alignItems: "center",
  },
  switchText: {
    color: "#1976d2",
    fontSize: 15,
    fontWeight: "bold",
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
    fontSize: 15,
  },
});

export default LoginScreen;