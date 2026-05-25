import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useVendorContext } from './_layout';
import { auth } from '../../utils/api';

export default function VendorOnboardingOTP() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateData } = useVendorContext();

  const handleNext = async () => {
    setLoading(true);
    try {
      const { user, error } = await auth.signInOrRegister(phone);
      if (error) throw error;
      if (!user) throw new Error('Authentication failed. Please try again.');

      updateData({ phone });
      router.push('/vendor-setup/details');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
        </View>

        <Text style={styles.title}>
          Enter your phone number
        </Text>
        <Text style={styles.subtitle}>
          (OTP is skipped for testing)
        </Text>

        <View style={styles.inputContainer}>
            <>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </>
        </View>

        <TouchableOpacity 
          style={[styles.button, !phone ? styles.buttonDisabled : null]} 
          onPress={handleNext}
          disabled={!phone || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  progressActive: {
    backgroundColor: '#E1F5EE',
    borderColor: '#0F6E56',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 24,
    height: 56,
  },
  prefix: {
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0F6E56',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0c4bb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});