// In IndexScreen.js (الكود الكامل والجديد)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, Dimensions,
  TouchableOpacity, StatusBar, SafeAreaView, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // استيراد useFocusEffect

const { width, height } = Dimensions.get('window');

// ==========================================================
// ===== الخطوة 1: تعريف الثيمات والترجمات =====
// ==========================================================

const lightTheme = {
    background: '#F6FEF6',
    primary: '#4CAF50',
    text: '#333333',
    inactive: '#A5D6A7',
    white: '#FFFFFF',
    statusBar: 'dark-content',
};

const darkTheme = {
    background: '#121212',
    primary: '#66BB6A',
    text: '#E0E0E0',
    inactive: '#424242',
    white: '#1E1E1E',
    statusBar: 'light-content',
};

const translations = {
    ar: {
        cameraTitle: 'الكاميرا هي أخصائي التغذية الخاص بك',
        cameraDesc: 'التقط صورة لوجبتك، وسيقوم الذكاء الاصطناعي بتحليلها فورًا، مزودًا إياك بسعرات حرارية وماكروز دقيقة (بروتين، كربوهيدرات، ودهون) بكل سهولة.',
        accuracyTitle: 'دقة تفهمك',
        accuracyDesc: 'هل سئمت من التطبيقات التي لا تتعرف على أطباقك المحلية المفضلة؟ الذكاء الاصطناعي لدينا مدرب خصيصًا على المطبخ المصري والشرق أوسطي ليمنحك معلومات غذائية تثق بها.',
        resultsTitle: 'حوّل المعرفة إلى نتائج',
        resultsDesc: 'حدد أهدافك، تتبع تقدمك برسوم بيانية واضحة، واتخذ خيارات غذائية أذكى كل يوم. رحلتك الصحية لم تكن بهذه البساطة والوضوح من قبل.',
        nextButton: 'التالي',
        signInButton: 'تسجيل الدخول',
        signUpButton: 'إنشاء حساب',
    },
    en: {
        cameraTitle: 'Your Camera is Your Nutritionist',
        cameraDesc: 'Just snap a photo of your meal, and our AI instantly analyzes it, providing you with accurate calories and macros (protein, carbs, and fats) with ease.',
        accuracyTitle: 'Accuracy That Understands You',
        accuracyDesc: 'Tired of apps that don’t recognize your favorite local dishes? Our AI is specially trained on Egyptian & Middle Eastern cuisine to give you nutritional info you can trust.',
        resultsTitle: 'Turn Knowledge into Results',
        resultsDesc: 'Set your goals, track your progress with clear charts, and make smarter food choices every day. Your health journey has never been this simple and clear.',
        nextButton: 'Next',
        signInButton: 'Sign In',
        signUpButton: 'Sign Up',
    }
};

// بيانات الشرائح الثابتة (الصور والمفاتيح)
const slidesContent = [
    { id: '1', image: require('./assets/scan.png'), titleKey: 'cameraTitle', descriptionKey: 'cameraDesc' },
    { id: '2', image: require('./assets/calorie.png'), titleKey: 'accuracyTitle', descriptionKey: 'accuracyDesc' },
    { id: '3', image: require('./assets/goal.png'), titleKey: 'resultsTitle', descriptionKey: 'resultsDesc' }
];

const getItemLayout = (data, index) => ({ length: width, offset: width * index, index });

const IndexScreen = ({ navigation, route }) => {
    // ==========================================================
    // ===== الخطوة 2: إضافة حالات للثيم واللغة =====
    // ==========================================================
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('en');
    const [isRTL, setIsRTL] = useState(false);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // دالة مساعدة للترجمة
    const t = (key) => translations[language]?.[key] || key;

    // ==========================================================
    // ===== الخطوة 3: تحميل الإعدادات عند فتح الشاشة =====
    // ==========================================================
    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                try {
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? darkTheme : lightTheme);

                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    const currentLang = savedLang || 'en'; // الإنجليزية هي الافتراضية
                    setLanguage(currentLang);
                    setIsRTL(currentLang === 'ar');
                } catch (e) {
                    console.error('Failed to load settings from storage.', e);
                }
            };
            loadSettings();
        }, [])
    );
    
    useEffect(() => {
        const initialIndex = route.params?.initialSlideIndex;
        if (initialIndex !== undefined && slidesRef.current) {
            setTimeout(() => {
                slidesRef.current.scrollToIndex({ index: initialIndex, animated: false });
            }, 100);
        }
    }, [route.params?.initialSlideIndex]);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;
    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNextPress = () => {
        const nextSlideIndex = currentIndex + 1;
        if (nextSlideIndex < slidesContent.length) {
            if (slidesRef.current) {
                slidesRef.current.scrollToIndex({ index: nextSlideIndex });
            }
        }
    };
    
    // دمج بيانات الشرائح مع الترجمات الحالية
    const slides = slidesContent.map(slide => ({
        ...slide,
        title: t(slide.titleKey),
        description: t(slide.descriptionKey),
    }));

    const currentSlide = slides[currentIndex] || slides[0];

    return (
        // ==========================================================
        // ===== الخطوة 4: تطبيق الثيم واللغة على الواجهة =====
        // ==========================================================
        <SafeAreaView style={styles.container(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <View style={styles.topContainer(theme)}>
                <FlatList
                    ref={slidesRef}
                    data={slides}
                    renderItem={({ item }) => (
                        <View style={styles.slideItem}>
                            <Image source={item.image} style={styles.image} resizeMode="contain" />
                        </View>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    getItemLayout={getItemLayout}
                    scrollEventThrottle={32}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                />
            </View>
            <View style={styles.bottomContainer(theme, isRTL)}>
                <View style={styles.paginatorContainer(isRTL)}>
                    {slides.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 25, 8], extrapolate: 'clamp' });
                        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });
                        return <Animated.View key={i.toString()} style={[styles.dot(theme), { width: dotWidth, opacity }]} />;
                    })}
                </View>

                <Text style={styles.title(theme, isRTL)}>{currentSlide.title}</Text>
                <Text style={styles.description(theme, isRTL)}>{currentSlide.description}</Text>

                {currentIndex === slides.length - 1 ? (
                    // ✅✅✅ المنطقة التي تم تعديلها ✅✅✅
                    <View style={styles.authButtonsContainer(isRTL)}>
                        <TouchableOpacity style={styles.authButton(styles.signInButton(theme))} onPress={async () => {
                            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                            navigation.navigate('SignIn');
                        }}>
                            <Text style={styles.authButtonText(styles.signInButtonText(theme))}>{t('signInButton')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.authButton(styles.signUpButton(theme))} onPress={async () => {
                            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                            navigation.navigate('SignUp');
                        }}>
                            <Text style={styles.authButtonText(styles.signUpButtonText(theme))}>{t('signUpButton')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.button(theme)} onPress={handleNextPress}>
                        <Text style={styles.buttonText(theme)}>{t('nextButton')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

// ==========================================================
// ===== الخطوة 5: تحويل الأنماط لتكون ديناميكية =====
// ==========================================================
const styles = {
    container: (theme) => ({
        flex: 1,
        backgroundColor: theme.background,
    }),
    topContainer: (theme) => ({
        height: height * 0.55,
        backgroundColor: theme.background,
        borderBottomLeftRadius: 80,
        borderBottomRightRadius: 80,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 8,
        overflow: 'hidden',
    }),
    slideItem: {
        width: width,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    image: {
        width: width * 0.8,
        height: height * 0.5,
    },
    bottomContainer: (theme, isRTL) => ({
        flex: 1,
        alignItems: isRTL ? 'flex-end' : 'flex-start',
        paddingHorizontal: 30,
        paddingTop: 30,
        paddingBottom: 40,
        backgroundColor: theme.background,
    }),
    title: (theme, isRTL) => ({
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.text,
        textAlign: isRTL ? 'right' : 'left',
        marginBottom: 15,
    }),
    description: (theme, isRTL) => ({
        fontSize: 14,
        color: theme.text,
        textAlign: isRTL ? 'right' : 'left',
        lineHeight: 22,
        opacity: 0.7,
        marginBottom: 20,
    }),
    paginatorContainer: (isRTL) => ({
        flexDirection: isRTL ? 'row-reverse' : 'row',
        marginBottom: 25,
        width: '100%',
    }),
    dot: (theme) => ({
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        backgroundColor: theme.primary,
    }),
    button: (theme) => ({
        backgroundColor: theme.white,
        borderRadius: 50,
        paddingVertical: 18,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    }),
    buttonText: (theme) => ({
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    }),
    authButtonsContainer: (isRTL) => ({
        flexDirection: isRTL ? 'row-reverse' : 'row',
        width: '100%',
        marginTop: 'auto',
        justifyContent: 'space-between',
        gap: 15,
    }),
    authButton: (specificStyles) => ({
        flex: 1,
        paddingVertical: 16,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        ...specificStyles,
    }),
    signInButton: (theme) => ({
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.primary,
    }),
    signUpButton: (theme) => ({
        backgroundColor: theme.primary,
        elevation: 5,
        shadowColor: theme.primary,
        shadowOpacity: 0.3,
        shadowRadius: 5,
    }),
    authButtonText: (specificStyles) => ({
        fontSize: 16,
        fontWeight: '600',
        ...specificStyles,
    }),
    signInButtonText: (theme) => ({
        color: theme.primary,
    }),
    signUpButtonText: (theme) => ({
        color: theme.white,
    }),
};

export default IndexScreen;