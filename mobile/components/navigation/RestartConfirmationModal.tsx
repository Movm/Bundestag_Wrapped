/**
 * RestartConfirmationModal - Confirmation dialog for restarting the wrapped experience
 *
 * Triggered when user double-taps the home tab button.
 * Follows the Modal pattern established in SlideQuiz.tsx.
 */

import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RestartConfirmationModal({
  visible,
  onConfirm,
  onCancel,
}: Props) {
  if (!visible) return null;

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  return (
    <Modal transparent animationType="none">
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          style={styles.dialog}
        >
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>Neu starten?</Text>
          <Text style={styles.message}>
            Dein Fortschritt wird zurückgesetzt.
          </Text>
          <View style={styles.buttons}>
            <Pressable
              style={styles.cancelButton}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Abbrechen"
            >
              <Text style={styles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable
              style={styles.confirmButton}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Neu starten"
            >
              <Text style={styles.confirmText}>Neu starten</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#ec4899',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
