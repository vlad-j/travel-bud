import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapHeight?: number | string;
}

export default function BottomSheet({ visible, onClose, title, children, snapHeight }: BottomSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <Pressable style={[styles.sheet, snapHeight ? { maxHeight: snapHeight as any } : {}]} onPress={() => {}}>
            <View style={styles.handle} />
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
              <View style={{ height: Platform.OS === 'ios' ? 20 : 8 }} />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}


export function SheetButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[btnStyles.btn, disabled && btnStyles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={btnStyles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

export function MenuSheet({ visible, onClose, items }: {
  visible: boolean; onClose: () => void;
  items: { label: string; icon: string; onPress: () => void; danger?: boolean }[];
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Platform.OS === 'ios' ? 34 : 16 }]} onPress={() => {}}>
          <View style={styles.handle} />
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[menuStyles.row, i < items.length - 1 && menuStyles.border]}
              onPress={() => { onClose(); setTimeout(item.onPress, 150); }}
              activeOpacity={0.7}
            >
              <Text style={menuStyles.icon}>{item.icon}</Text>
              <Text style={[menuStyles.label, item.danger && menuStyles.danger]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={menuStyles.cancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={menuStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  kav: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
});


const btnStyles = StyleSheet.create({
  btn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0, elevation: 0 },
  text: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  border: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  icon: { fontSize: 20, width: 28, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  danger: { color: '#F44336' },
  cancel: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#888' },
});
