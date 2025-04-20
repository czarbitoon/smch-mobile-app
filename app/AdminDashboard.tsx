import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "./store/authSlice";

const AdminDashboard = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
          <Text style={styles.drawerName}>{user?.name || "Admin"}</Text>
          <Text style={styles.drawerEmail}>{user?.email || ""}</Text>
        </View>
        <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate("devices")}> 
          <MaterialIcons name="devices" size={22} color="#333" />
          <Text style={styles.drawerItemText}>Devices</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate("offices")}> 
          <MaterialIcons name="business" size={22} color="#333" />
          <Text style={styles.drawerItemText}>Offices</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate("reports")}> 
          <MaterialIcons name="description" size={22} color="#333" />
          <Text style={styles.drawerItemText}>Reports</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("devices")}> 
          <MaterialIcons name="devices" size={48} color="#1976d2" />
          <Text style={styles.cardText}>Device Management</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("offices")}> 
          <MaterialIcons name="business" size={48} color="#1976d2" />
          <Text style={styles.cardText}>Office Management</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("reports")}> 
          <MaterialIcons name="description" size={48} color="#1976d2" />
          <Text style={styles.cardText}>Reports</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1976d2",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  drawer: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  drawerHeader: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: "#1976d2",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  drawerName: {
    color: "#222",
    fontSize: 18,
    fontWeight: "bold",
  },
  drawerEmail: {
    color: "#555",
    fontSize: 14,
    opacity: 0.7,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  drawerItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: "#222",
  },
  body: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    width: "45%",
    marginVertical: 12,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardText: {
    marginTop: 16,
    fontSize: 16,
    color: "#222",
    fontWeight: "500",
  },
});

export default AdminDashboard;