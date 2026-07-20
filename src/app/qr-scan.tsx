import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function QRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // El código QR debería contener el club_id o un link de registro
    // Por ejemplo: https://nexassist.com/registro?club=12345
    try {
      const url = new URL(data);
      const clubId = url.searchParams.get('club');
      
      if (clubId) {
        Alert.alert(
          'Código QR detectado',
          `Club ID: ${clubId}`,
          [
            {
              text: 'Cancelar',
              onPress: () => setScanned(false),
              style: 'cancel'
            },
            {
              text: 'Registrarse',
              onPress: () => {
                // Navegar a pantalla de registro con el club_id
                router.push({ pathname: '/register', params: { club: clubId } });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Código QR inválido');
        setScanned(false);
      }
    } catch (error) {
      // Si no es una URL, podría ser solo el club_id directamente
      Alert.alert(
        'Código QR detectado',
        `Club ID: ${data}`,
        [
          {
            text: 'Cancelar',
            onPress: () => setScanned(false),
            style: 'cancel'
          },
          {
            text: 'Registrarse',
            onPress: () => {
              router.push({ pathname: '/register', params: { club: data } });
            }
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Escanea el código QR del club</Text>
        {scanned && (
          <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Escanear otro</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#208AEF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
