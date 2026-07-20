import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const clubId = params.club as string;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [playingSide, setPlayingSide] = useState('ambas');
  const [gender, setGender] = useState('');
  const [availabilityDays, setAvailabilityDays] = useState('');
  const [availabilityHours, setAvailabilityHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [clubName, setClubName] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !phone || !gender) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      // Aquí se implementaría la lógica de registro real con Stripe
      // Por ahora, solo mostramos un mensaje de éxito
      Alert.alert(
        '¡Bienvenido a Nexa! 🎾',
        `Te has registrado exitosamente en ${clubName || 'tu club'}.\n\nNombre: ${name}\nEmail: ${email}\nTeléfono: ${phone}\nLado: ${playingSide}\nGénero: ${gender}\nDisponibilidad: ${availabilityDays} ${availabilityHours}\n\n¡Gracias por unirte a la comunidad de pádel más grande!`,
        [
          { text: 'OK', onPress: () => router.replace('/') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Hubo un error al procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              <ThemedText style={styles.title}>Registro</ThemedText>
              <ThemedText style={styles.subtitle}>Club ID: {clubId}</ThemedText>
              
              <ThemedText style={styles.welcomeMessage}>
                ¡Bienvenido a Nexa! 🎾
              </ThemedText>
              <ThemedText style={styles.welcomeSubtext}>
                Completa tu registro para unirte a {clubName || 'tu club'}
              </ThemedText>
              
              <ThemedText style={styles.sectionTitle}>Datos Personales</ThemedText>
              
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
              
              <ThemedText style={styles.sectionTitle}>Perfil de Juego</ThemedText>
              
              <ThemedText style={styles.label}>¿De qué lado jugás?</ThemedText>
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.optionButton, playingSide === 'derecha' && styles.selectedOption]}
                  onPress={() => setPlayingSide('derecha')}
                >
                  <Text style={styles.optionText}>Derecha</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionButton, playingSide === 'reves' && styles.selectedOption]}
                  onPress={() => setPlayingSide('reves')}
                >
                  <Text style={styles.optionText}>Revés</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionButton, playingSide === 'ambas' && styles.selectedOption]}
                  onPress={() => setPlayingSide('ambas')}
                >
                  <Text style={styles.optionText}>Ambas</Text>
                </TouchableOpacity>
              </View>
              
              <ThemedText style={styles.label}>Género</ThemedText>
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.optionButton, gender === 'varon' && styles.selectedOption]}
                  onPress={() => setGender('varon')}
                >
                  <Text style={styles.optionText}>Varón</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionButton, gender === 'mujer' && styles.selectedOption]}
                  onPress={() => setGender('mujer')}
                >
                  <Text style={styles.optionText}>Mujer</Text>
                </TouchableOpacity>
              </View>
              
              <ThemedText style={styles.sectionTitle}>Disponibilidad</ThemedText>
              
              <TextInput
                style={styles.input}
                placeholder="Días disponibles (ej: Lunes, Miércoles, Viernes)"
                value={availabilityDays}
                onChangeText={setAvailabilityDays}
                placeholderTextColor="#999"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Rango horario (ej: 18:00 - 22:00)"
                value={availabilityHours}
                onChangeText={setAvailabilityHours}
                placeholderTextColor="#999"
              />
              
              <ThemedText style={styles.sectionTitle}>Método de Pago</ThemedText>
              <ThemedText style={styles.note}>
                El procesamiento de pagos estará disponible próximamente
              </ThemedText>
              
              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Registrarse</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace('/')}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.7,
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#208AEF',
  },
  welcomeSubtext: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: '#208AEF',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    marginBottom: 15,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  button: {
    backgroundColor: '#208AEF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
