import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ShoppingCart, Bell, Calendar as CalendarIcon } from 'lucide-react-native';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      <View style={styles.separator} />

      <Link href="/shopping-list" asChild>
        <TouchableOpacity style={styles.option}>
          <ShoppingCart size={24} color="#333" style={styles.icon} />
          <Text style={styles.optionText}>Shopping List</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/reminders" asChild>
        <TouchableOpacity style={styles.option}>
          <Bell size={24} color="#333" style={styles.icon} />
          <Text style={styles.optionText}>Reminders</Text>
        </TouchableOpacity>
      </Link>

      <View style={styles.separator} />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: '80%',
    backgroundColor: '#eee',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  icon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
