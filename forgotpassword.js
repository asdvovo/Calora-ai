// File: forgotpassword.js (الكود الكامل والنهائي)

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, StatusBar, Dimensions, Image, Alert, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseclient'; // تأكد من المسار الصحيح

const { width, height } = Dimensions.get('window');

// ==========================================================
// ===== الثيمات والترجمات =====
// ==========================================================
const lightTheme = {
    primary: '#4CAF50', secondary: '#2ECC71', background: '#FFFFFF', textPrimary: '#212529',
    textSecondary: '#6C757D', borderColor: '#E9ECEF', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#F7F8F9',
};
const darkTheme = {
    primary: '#66BB6A', secondary: '#81C784', background: '#121212', textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0', borderColor: '#2C2C2C', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#1E1E1E',
};
const translations = {
    ar: {
        headerTitle: 'نسيت كلمة المرور', title: 'هل نسيت كلمة المرور؟',
        subtitle: 'أدخل عنوان البريد الإلكتروني المرتبط بحسابك.',
        placeholderEmail: 'البريد الإلكتروني', recoverButtonText: 'إرسال الرمز',
        alertTitle: 'خطأ', alertMessage: 'الرجاء إدخال عنوان بريد إلكتروني صحيح.',
        successTitle: 'تم الإرسال',
        successMessage: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني. الرجاء التحقق من صندوق الوارد الخاص بك.',
    },
    en: {
        headerTitle: 'Forgot Password', title: 'Forgot Your Password?',
        subtitle: 'Enter the email address associated with your account.',
        placeholderEmail: 'Email', recoverButtonText: 'Send Code',
        alertTitle: 'Error', alertMessage: 'Please enter a valid email address.',
        successTitle: 'Sent',
        successMessage: 'A verification code has been sent to your email. Please check your inbox.',
    }
};

const HeaderCurve = ({ theme }) => {
  const pathData = `M0,0 L${width},0 L${width},${height * 0.12} Q${width / 2},${height * 0.18} 0,${height * 0.12} Z`;
  return (
    <View style={styles.headerCurveContainer}>
      <Svg height={height * 0.18} width={width} viewBox={`0 0 ${width} ${height * 0.18}`}>
        <Defs>
          <LinearGradient id="grad-forgot" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={theme.primary} />
            <Stop offset="1" stopColor={theme.secondary} />
          </LinearGradient>
        </Defs>
        <Path d={pathData} fill="url(#grad-forgot)" />
      </Svg>
    </View>
  );
};

const ForgotPasswordScreen = ({ navigation }) => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('en');
    const [isRTL, setIsRTL] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const t = (key) => translations[language]?.[key] || key;

    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                try {
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    const currentLang = savedLang || 'en';
                    setLanguage(currentLang);
                    setIsRTL(currentLang === 'ar');
                } catch (e) { console.error('Failed to load settings.', e); }
            };
            loadSettings();
        }, [])
    );

    const validateEmail = (emailToValidate) => {
        const emailRegex = /\S+@\S+\.\S+/;
        return emailRegex.test(emailToValidate);
    };

    const handleRecover = async () => {
        if (!validateEmail(email)) {
            Alert.alert(t('alertTitle'), t('alertMessage'));
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
                redirectTo: ' ', // مهم لمنع إعادة التوجيه
            });
            if (error) {
                Alert.alert(t('alertTitle'), error.message);
            } else {
                Alert.alert(t('successTitle'), t('successMessage'), [
                    { text: 'OK', onPress: () => navigation.navigate('EmailVerification', { email: email.toLowerCase() }) },
                ]);
            }
        } catch (error) {
            Alert.alert(t('alertTitle'), 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
            <HeaderCurve theme={theme} />
            <View style={styles.headerContent}>
                <TouchableOpacity style={styles.backButton(isRTL)} onPress={() => navigation.goBack()}>
                    <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={theme.headerText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle(theme)}>{t('headerTitle')}</Text>
            </View>
            <View style={styles.formContainer}>
                <Text style={styles.title(theme)}>{t('title')}</Text>
                <Text style={styles.subtitle(theme)}>{t('subtitle')}</Text>
                <View style={styles.inputContainer(theme, isRTL)}>
                    <Icon name="mail" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                    <TextInput
                        placeholder={t('placeholderEmail')}
                        placeholderTextColor={theme.textSecondary}
                        style={styles.input(theme, isRTL)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <TouchableOpacity style={styles.recoverButton(theme)} onPress={handleRecover} disabled={loading}>
                    {loading ? <ActivityIndicator color={theme.headerText} /> : <Text style={styles.recoverButtonText(theme)}>{t('recoverButtonText')}</Text>}
                </TouchableOpacity>
            </View>
            <Image
                source={require('./assets/leavesdecoration.png')}
                style={styles.footerImage}
            />
        </SafeAreaView>
    );
};

const styles = {
    container: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    headerCurveContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
    headerContent: { marginTop: StatusBar.currentHeight || 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    backButton: (isRTL) => ({ padding: 10, position: 'absolute', [isRTL ? 'right' : 'left']: 15, zIndex: 1 }),
    headerTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.headerText, textAlign: 'center', flex: 1 }),
    formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 80 },
    title: (theme) => ({ fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center', marginBottom: 10 }),
    subtitle: (theme) => ({ fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22 }),
    inputContainer: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: 12, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: theme.borderColor, height: 58 }),
    inputIcon: (isRTL) => ({ [isRTL ? 'marginLeft' : 'marginRight']: 10 }),
    input: (theme, isRTL) => ({ flex: 1, fontSize: 16, color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }),
    recoverButton: (theme) => ({ backgroundColor: theme.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: theme.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }),
    recoverButtonText: (theme) => ({ color: theme.headerText, fontSize: 18, fontWeight: 'bold' }),
    footerImage: { position: 'absolute', bottom: 0, width: width, height: 80, resizeMode: 'cover' },
};

export default ForgotPasswordScreen;