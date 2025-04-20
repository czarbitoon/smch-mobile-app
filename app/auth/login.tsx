import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, typography } from "../constants/theme";

// Set up axios interceptor to add Authorization header
axios.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://api:8000/api";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState<Array<{id: string, name: string}>>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<number>(0);
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
      const { access_token } = response.data;
      await AsyncStorage.setItem("token", access_token);
      router.replace("/(tabs)");
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrorMessage(null);
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        type: selectedUserType,
        office_id: selectedOfficeId,
      });
      if (response.data.user) {
        Alert.alert("Registration successful! Please login.");
        setIsRegistering(false);
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setSelectedOfficeId(null);
        setSelectedUserType(0);
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
      <Text style={styles.title}>{isRegistering ? "Register" : "Login"}</Text>
      {isRegistering && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Office</Text>
            <View style={styles.dropdownBox}>
              <Picker
                selectedValue={selectedOfficeId}
                onValueChange={setSelectedOfficeId}
                style={{ flex: 1 }}
              >
                <Picker.Item label="Select Office" value={null} />
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
                onValueChange={v => setSelectedUserType(Number(v))}
                style={{ flex: 1 }}
              >
                <Picker.Item label="User" value={0} />
                <Picker.Item label="Staff" value={1} />
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
      {errorMessage && (
        <Text style={styles.error}>{errorMessage}</Text>
      )}
      <View style={{ height: 24 }} />
      <Button
        title={loading ? (isRegistering ? "Registering..." : "Logging in...") : (isRegistering ? "Register" : "Login")}
        onPress={isRegistering ? handleRegister : handleLogin}
        disabled={loading}
      />
      <View style={{ height: 16 }} />
      <TouchableOpacity
        onPress={() => {
          setIsRegistering(r => !r);
          setErrorMessage(null);
        }}
      >
        <Text style={styles.switchText}>
          {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

import { Picker } from '@react-native-picker/picker';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.title,
    fontWeight: typography.fontWeightBold,
    marginBottom: spacing.lg,
    color: colors.primary,
    fontFamily: typography.fontFamily,
  },
  input: {
    width: "100%",
    height: 48,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.body,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
  },
  error: {
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamily,
  },
  switchText: {
    color: colors.primary,
    textAlign: "center",
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.md,
  },
  toggle: {
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
  },
  dropdownContainer: {
    width: "100%",
    marginBottom: spacing.md,
  },
  dropdownLabel: {
    fontSize: typography.body,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
  },
  dropdownBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
});

export default LoginScreen;