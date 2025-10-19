// SignUpScreen.js (الكود الكامل والنهائي)

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, Image, StatusBar, Dimensions, Alert, ActivityIndicator 
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseclient'; // تأكد أن هذا هو المسار الصحيح لملفك

const { width, height } = Dimensions.get('window');

// ==========================================================
// ===== الثيمات (لا يوجد تغيير) =====
// ==========================================================
const lightTheme = {
    primary: '#4CAF50', background: '#F8F9FA', card: '#FFFFFF', textPrimary: '#212529', textSecondary: '#6C757D',
    borderColor: '#E9ECEF', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#F8F9FA',
};
const darkTheme = {
    primary: '#66BB6A', background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0',
    borderColor: '#2C2C2C', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#2C2C2C',
};

// ==========================================================
// ===== الترجمات (لا يوجد تغيير) =====
// ==========================================================
const translations = {
    ar: {
        headerTitle: 'إنشاء حساب', headerSubtitle: 'انضم إلى مجتمعنا', cardTitle: 'حساب جديد', usernamePlaceholder: 'اسم المستخدم',
        emailPlaceholder: 'البريد الإلكتروني', passwordPlaceholder: 'كلمة المرور', confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
        signUpButton: 'إنشاء حساب', errorTitle: 'خطأ', fillFieldsError: 'الرجاء ملء جميع الحقول.',
        invalidEmailError: 'الرجاء إدخال بريد إلكتروني صحيح.', passwordMismatchError: 'كلمتا المرور غير متطابقتين.',
        accountCreationError: 'حدث خطأ أثناء إنشاء الحساب.', successTitle: 'تم بنجاح!',
        accountSuccess: 'تم إنشاء حسابك. برجاء التحقق من بريدك الإلكتروني لتفعيل الحساب قبل تسجيل الدخول.',
    },
    en: {
        headerTitle: 'Create Account', headerSubtitle: 'Join our community', cardTitle: 'Sign Up', usernamePlaceholder: 'Username',
        emailPlaceholder: 'Email', passwordPlaceholder: 'Password', confirmPasswordPlaceholder: 'Confirm Password',
        signUpButton: 'Sign Up', errorTitle: 'Error', fillFieldsError: 'Please fill in all fields.',
        invalidEmailError: 'Please enter a valid email address.', passwordMismatchError: 'Passwords do not match.',
        accountCreationError: 'An error occurred while creating the account.', successTitle: 'Success!',
        accountSuccess: 'Your account has been created. Please check your email to activate your account before signing in.',
    }
};

const SignUpScreen = ({ navigation }) => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('en');
    const [isRTL, setIsRTL] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordSecure, setIsPasswordSecure] = useState(true);
    const [isConfirmPasswordSecure, setIsConfirmPasswordSecure] = useState(true);
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

    const handleEmailChange = (text) => {
        const englishEmailRegex = /^[a-zA-Z0-9@._-]*$/;
        if (englishEmailRegex.test(text)) { setEmail(text); }
    };

    const handleSignUp = async () => {
        if (!username.trim() || !email.trim() || !password || !confirmPassword) { Alert.alert(t('errorTitle'), t('fillFieldsError')); return; }
        if (!email.includes('@') || !email.includes('.')) { Alert.alert(t('errorTitle'), t('invalidEmailError')); return; }
        if (password !== confirmPassword) { Alert.alert(t('errorTitle'), t('passwordMismatchError')); return; }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.toLowerCase(),
                password: password,
                options: { data: { username: username } },
            });

            if (error) {
                Alert.alert(t('errorTitle'), error.message);
            } else if (data.user) {
                const initialProfile = {
                    firstName: username,
                    lastName: '',
                    profileImage: null,
                    email: email.toLowerCase(),
                };
                await AsyncStorage.setItem('userProfile', JSON.stringify(initialProfile));
                
                await AsyncStorage.setItem('hasSeenOnboarding', 'true');

                Alert.alert(t('successTitle'), t('accountSuccess'), [
                    { text: 'حسناً', onPress: () => navigation.navigate('SignIn') },
                ]);
            }
        } catch (error) {
            Alert.alert(t('errorTitle'), t('accountCreationError'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
            <View style={styles.header(theme)}>
                <Image source={require('./assets/palmleaf1.png')} style={styles.headerImageLeft} resizeMode="contain" />
                <Image source={require('./assets/palmleaf.png')} style={styles.headerImageRight} resizeMode="contain" />
                <Text style={styles.title(theme)}>{t('headerTitle')}</Text>
                <Text style={styles.subtitle(theme)}>{t('headerSubtitle')}</Text>
            </View>
            <View style={styles.card(theme)}>
                <View style={styles.cardContent}>
                    <View style={styles.titleContainer(isRTL)}>
                        {/* ✅✅✅ هنا التعديل الوحيد في الملف كله ✅✅✅ */}
                        <TouchableOpacity 
                            style={styles.backButton(isRTL)} 
                            onPress={() => navigation.navigate('Index', { initialSlideIndex: 2 })}
                        >
                            <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={28} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.cardTitle(theme)}>{t('cardTitle')}</Text>
                    </View>
                    <View style={styles.inputContainer(theme, isRTL)}>
                        <Icon name="user" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                        <TextInput placeholder={t('usernamePlaceholder')} placeholderTextColor={theme.textSecondary} style={styles.input(theme, isRTL)} autoCapitalize="none" value={username} onChangeText={setUsername}/>
                    </View>
                    <View style={styles.inputContainer(theme, isRTL)}>
                        <Icon name="mail" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                        <TextInput placeholder={t('emailPlaceholder')} placeholderTextColor={theme.textSecondary} style={styles.input(theme, isRTL)} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={handleEmailChange}/>
                    </View>
                    <View style={styles.inputContainer(theme, isRTL)}>
                        <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                        <TextInput placeholder={t('passwordPlaceholder')} placeholderTextColor={theme.textSecondary} style={styles.input(theme, isRTL)} secureTextEntry={isPasswordSecure} value={password} onChangeText={setPassword}/>
                        <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)}>
                            <Icon name={isPasswordSecure ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputContainer(theme, isRTL)}>
                        <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                        <TextInput placeholder={t('confirmPasswordPlaceholder')} placeholderTextColor={theme.textSecondary} style={styles.input(theme, isRTL)} secureTextEntry={isConfirmPasswordSecure} value={confirmPassword} onChangeText={setConfirmPassword}/>
                        <TouchableOpacity onPress={() => setIsConfirmPasswordSecure(!isConfirmPasswordSecure)}>
                            <Icon name={isConfirmPasswordSecure ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.signUpButton(theme)} onPress={handleSignUp} disabled={loading}>
                        {loading ? <ActivityIndicator color={theme.headerText} /> : <Text style={styles.signUpButtonText(theme)}>{t('signUpButton')}</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = {
    container: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    header: (theme) => ({ backgroundColor: theme.primary, height: height * 0.3, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, justifyContent: 'center', paddingHorizontal: 30, paddingTop: 20, position: 'relative', overflow: 'hidden' }),
    headerImageLeft: { position: 'absolute', top: -40, left: -40, width: 200, height: 200, transform: [{ rotate: '10deg' }] },
    headerImageRight: { position: 'absolute', top: -40, right: -40, width: 200, height: 200, transform: [{ rotate: '-9deg' }] },
    title: (theme) => ({ fontSize: 42, fontWeight: 'bold', color: theme.headerText }),
    subtitle: (theme) => ({ fontSize: 18, color: theme.headerText, marginTop: 5 }),
    card: (theme) => ({ position: 'absolute', top: height * 0.25, left: 20, right: 20, bottom: 20, backgroundColor: theme.card, borderRadius: 30, paddingHorizontal: 25, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15 }),
    cardContent: { flex: 1, justifyContent: 'center', paddingTop: 10 },
    titleContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 12 }),
    backButton: (isRTL) => ({ padding: 5, [isRTL ? 'marginLeft' : 'marginRight']: 10 }),
    cardTitle: (theme) => ({ fontSize: 32, fontWeight: 'bold', color: theme.textPrimary }),
    inputContainer: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: 15, paddingHorizontal: 20, marginVertical: 6, borderWidth: 1, borderColor: theme.borderColor, height: 55 }),
    inputIcon: (isRTL) => ({ [isRTL ? 'marginLeft' : 'marginRight']: 15 }),
    input: (theme, isRTL) => ({ flex: 1, fontSize: 16, color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }),
    signUpButton: (theme) => ({ backgroundColor: theme.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 12 }),
    signUpButtonText: (theme) => ({ color: theme.headerText, fontSize: 18, fontWeight: 'bold' }),
};

export default SignUpScreen;