import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return <SafeAreaView style={styles.container}><View><Text style={styles.title}>Critol Finance</Text><Text style={styles.quote}>AAPL  $189.98  +1.24%</Text><Text>Sincronizado con tu cartera</Text></View><StatusBar style="light" /></SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", justifyContent: "center", padding: 24 },
  title: { color: "#34d399", fontSize: 28, fontWeight: "700", marginBottom: 24 },
  quote: { color: "#fff", fontSize: 20, marginBottom: 12 }
});
