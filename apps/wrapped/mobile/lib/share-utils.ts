/**
 * Shared utilities for image sharing and downloading
 * Uses Expo SDK 54 APIs
 */

import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

/**
 * Share an image using the native share dialog
 */
export async function shareImage(uri: string, dialogTitle: string): Promise<boolean> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('Teilen nicht verfügbar', 'Teilen wird auf diesem Gerät nicht unterstützt.');
    return false;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle,
  });

  return true;
}

/**
 * Save an image to the device's media library (photo gallery)
 */
export async function saveToGallery(uri: string): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Berechtigung erforderlich',
      'Bitte erlaube den Zugriff auf deine Fotos, um das Bild zu speichern.'
    );
    return false;
  }

  try {
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Gespeichert!', 'Das Bild wurde in deiner Galerie gespeichert.');
    return true;
  } catch (error) {
    console.error('Failed to save to gallery:', error);
    Alert.alert('Fehler', 'Das Bild konnte nicht gespeichert werden.');
    return false;
  }
}
