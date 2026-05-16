import { StyleSheet, Text, View } from 'react-native';

export function StatCard({ label, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    elevation: 2,
    flex: 1,
    margin: 5,
    minWidth: 120,
    padding: 14,
    shadowColor: '#223',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  value: {
    color: '#17213f',
    fontSize: 24,
    fontWeight: '900',
  },
  label: {
    color: '#6f7894',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});