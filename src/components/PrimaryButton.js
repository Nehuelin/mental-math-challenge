import { Pressable, StyleSheet, Text } from 'react-native';

export function PrimaryButton({ title, onPress, selected = false, disabled = false, variant = 'primary' }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.text, variant === 'ghost' && styles.ghostText, selected && styles.selectedText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: 5,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  primary: {
    backgroundColor: '#3957ff',
  },
  secondary: {
    backgroundColor: '#17213f',
  },
  danger: {
    backgroundColor: '#c93d5a',
  },
  ghost: {
    backgroundColor: '#eef2ff',
    borderColor: '#cfd8ff',
    borderWidth: 1,
  },
  selected: {
    backgroundColor: '#0f1a33',
    borderColor: '#6fffe9',
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  ghostText: {
    color: '#17213f',
  },
  selectedText: {
    color: '#ffffff',
  },
});