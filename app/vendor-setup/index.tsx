import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useVendorContext } from './_layout';
import { supabase } from '../../utils/supabase';

export default function VendorOnboardingOTP() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateData } = useVendorContext();

  const handleNext = async () => {
      setLoading(true);
      try {
        // SIMULATED AUTH: We sign up a fake email to give this vendor a real UUID in Supabase.
        const fakeEmail = `${phone}@teststore.com`;
        
        // 1. Try to sign in first
        let { data, error } = await supabase.auth.signInWithPassword({
            email: fakeEmail,
            password: 'testpassword123',
        });

        // Handle specific "Email not confirmed" error which happens if they tried signing up 
        // *before* disabling the "Confirm email" setting in Supabase.
        if (error && error.message.includes('Email not confirmed')) {
            alert("Error: This test number's account is stuck in an unconfirmed state.\n\n1. Go to Supabase Dashboard -> Authentication -> Providers -> Email and ensure 'Confirm Email' is OFF.\n2. Go to Authentication -> Users, and delete the user ending in @teststore.com.\n3. Try again!");
            setLoading(false);
            return;
        }

        // 2. If user doesn't exist, sign them up
        if (error && error.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: 'testpassword123',
            });
            
            // If Supabase requires email confirmation (which is on by default and skips auto-login)
            if (!signUpError && !signUpData?.session) {
                alert("Please go to Supabase Dashboard -> Authentication -> Providers -> Email and turn OFF 'Confirm email', then try again!");
                setLoading(false);
                return;
            }
            if (signUpError) throw signUpError;
        } else if (error) {
            throw error;
        }
        
        updateData({ phone });
        router.push('/vendor-setup/details');
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'An error occurred during simulated login');
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