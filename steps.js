import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { 
    View, Text, ScrollView, SafeAreaView, TouchableOpacity, 
    ActivityIndicator, Alert, Modal, TextInput, StatusBar,
    Platform, PermissionsAndroid, InteractionManager, AppState
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit, { Scopes } from 'react-native-google-fit'; 
import Animated, { useAnimatedStyle, useSharedValue, withTiming, useAnimatedProps, runOnJS } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

// إنشاء مكون مسار متحرك
const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- Worklet للرسم (محمي من الأخطاء) ---
const describeArc = (x, y, radius, startAngle, endAngle) => {
    'worklet';
    // حماية ضد القيم غير الرقمية لتجنب الانهيار
    if (typeof x !== 'number' || typeof y !== 'number' || typeof radius !== 'number' || typeof endAngle !== 'number' || isNaN(endAngle)) {
        return "M 0 0";
    }
    
    let finalAngle = endAngle >= 360 ? 359.9 : endAngle;
    if (finalAngle <= 0) return "M 0 0";

    const startRad = (startAngle - 90) * Math.PI / 180.0;
    const endRad = (finalAngle - 90) * Math.PI / 180.0;

    const start = {
        x: x + radius * Math.cos(startRad),
        y: y + radius * Math.sin(startRad),
    };
    const end = {
        x: x + radius * Math.cos(endRad),
        y: y + radius * Math.sin(endRad),
    };

    const largeArcFlag = finalAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

// --- الثيمات ---
const lightTheme = { primary: '#388E3C', primaryDark: '#1B5E20', background: '#E8F5E9',  card: '#FFFFFF',  textPrimary: '#212121',  textSecondary: '#757575', progressUnfilled: '#D6EAD7', inputBackground: '#F5F5F5',  overlay: 'rgba(0,0,0,0.5)', accentOrange: '#FF7043', accentBlue: '#007BFF', white: '#FFFFFF', statusBar: 'dark-content', };
const darkTheme = { primary: '#66BB6A', primaryDark: '#81C784', background: '#121212',  card: '#1E1E1E',  textPrimary: '#FFFFFF',  textSecondary: '#B0B0B0', progressUnfilled: '#2C2C2C', inputBackground: '#2C2C2C',  overlay: 'rgba(0,0,0,0.7)', accentOrange: '#FF8A65', accentBlue: '#42A5F5', white: '#FFFFFF', statusBar: 'light-content', };

// --- النصوص ---
const translations = { 
    ar: { screenTitle: 'تقرير الخطوات', todaySteps: 'خطوات اليوم', kmUnit: ' كم', calUnit: ' سعرة', last7Days: 'آخر 7 أيام', last30Days: 'آخر 30 يوم', week: 'الأسبوع', month: 'الشهر', noData: 'لا توجد بيانات.', changeGoalTitle: 'تغيير الهدف', changeGoalMsg: 'أدخل هدفك الجديد:', goalPlaceholder: 'مثال: 8000', cancel: 'إلغاء', save: 'حفظ', notAvailableTitle: 'Google Fit غير متصل', notAvailableMsg: 'اضغط للربط وعرض الخطوات.', connectBtn: 'ربط Google Fit', permissionDeniedTitle: 'صلاحية مرفوضة', permissionDeniedMsg: 'يرجى تفعيل صلاحية النشاط البدني.' },
    en: { screenTitle: 'Steps Report', todaySteps: 'Today\'s Steps', kmUnit: ' km', calUnit: ' kcal', last7Days: 'Last 7 Days', last30Days: 'Last 30 Days', week: 'Week', month: 'Month', noData: 'No data.', changeGoalTitle: 'Change Goal', changeGoalMsg: 'Enter new goal:', goalPlaceholder: 'Ex: 8000', cancel: 'Cancel', save: 'Save', notAvailableTitle: 'Google Fit Disconnected', notAvailableMsg: 'Connect to track steps.', connectBtn: 'Connect Google Fit', permissionDeniedTitle: 'Permission Denied', permissionDeniedMsg: 'Please grant activity permission.' }
};

// --- المكون الدائري ---
const AnimatedStepsCircle = ({ progress, size, strokeWidth, currentStepCount, theme }) => { 
    const RADIUS = size / 2; 
    const CENTER_RADIUS = RADIUS - strokeWidth / 2; 
    
    // تصحيح النسبة المئوية
    const validProgress = isNaN(progress) || progress < 0 ? 0 : (progress > 1 ? 1 : progress);
    const animatedProgress = useSharedValue(0); 

    useEffect(() => { 
        // تأخير بسيط لمنع التعارض مع بداية التشغيل
        const timeout = setTimeout(() => {
            animatedProgress.value = withTiming(validProgress, { duration: 1500 }); 
        }, 100);
        return () => clearTimeout(timeout);
    }, [validProgress]); 
    
    const animatedPathProps = useAnimatedProps(() => { 
        const angle = animatedProgress.value * 360;
        return { d: describeArc(size / 2, size / 2, CENTER_RADIUS, 0, angle) }; 
    }); 

    return ( 
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <Circle cx={size / 2} cy={size / 2} r={CENTER_RADIUS} stroke={theme.progressUnfilled} strokeWidth={strokeWidth} fill="transparent" />
                {validProgress > 0 && (
                    <AnimatedPath animatedProps={animatedPathProps} stroke={theme.primary} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" />
                )}
            </Svg>
            <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: theme.textPrimary }}>
                    {Math.round(currentStepCount || 0).toLocaleString()}
                </Text>
            </View>
        </View> 
    ); 
};

const StepsScreen = () => {
    const navigation = useNavigation(); 
    const [theme, setTheme] = useState(lightTheme);
    const [stepsData, setStepsData] = useState({ current: 0, history: [] });
    const [stepsGoal, setStepsGoal] = useState(10000);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [language, setLanguage] = useState('en');
    
    const isFetching = useRef(false);
    const isRTL = language === 'en'; 
    const t = (key) => translations[language]?.[key] || translations['en'][key] || key;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: t('screenTitle'),
            headerStyle: { backgroundColor: theme.card, elevation: 0 },
            headerTintColor: theme.textPrimary,
            headerRight: isRTL ? () => <TouchableOpacity onPress={() => navigation.goBack()} style={{marginHorizontal:15}}><Ionicons name="arrow-back" size={24} color={theme.textPrimary}/></TouchableOpacity> : null,
            headerLeft: !isRTL ? () => <TouchableOpacity onPress={() => navigation.goBack()} style={{marginHorizontal:15}}><Ionicons name="arrow-forward" size={24} color={theme.textPrimary}/></TouchableOpacity> : null,
        });
    }, [navigation, theme, language]);

    // --- دالة الربط (معدلة خصيصاً لحل مشكلة أندرويد 7) ---
    const connect = async () => {
        try {
            let permissionGranted = true;

            if (Platform.OS === 'android') {
                // 🔥 التعديل الحاسم: فحص إصدار الأندرويد
                // API 29 = Android 10
                if (Platform.Version >= 29) {
                    // للأجهزة الحديثة فقط نطلب الإذن
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
                    );
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        permissionGranted = false;
                        Alert.alert(t('permissionDeniedTitle'), t('permissionDeniedMsg'));
                        return;
                    }
                }
                // في أندرويد 7 (API 24, 25) الإذن بيتاخد أوتوماتيك من الـ Manifest
                // فمش بنعمل request عشان ميرجعش Error
            }

            if (permissionGranted) {
                const options = { 
                    scopes: [
                        Scopes.FITNESS_ACTIVITY_READ, 
                        Scopes.FITNESS_ACTIVITY_WRITE,
                        Scopes.FITNESS_BODY_READ // ضفته عشان انت حاطه في المانيفست
                    ] 
                };
                
                const res = await GoogleFit.authorize(options);
                if (res.success) {
                    await AsyncStorage.setItem('isGoogleFitConnected', 'true');
                    setIsConnected(true);
                    fetchSteps();
                } else {
                    // لو فشل ممكن يكون مفيش حساب جوجل متسجل على المحاكي
                    Alert.alert("Google Fit", "Failed to connect. Please check your Google account.");
                }
            }
        } catch (e) { 
            console.warn(e); 
        }
    };

    const fetchSteps = async () => {
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            // جلب خطوات اليوم
            const todayOpts = { startDate: startOfDay.toISOString(), endDate: today.toISOString() };
            let todaySteps = 0;
            
            try {
                const todayRes = await GoogleFit.getDailyStepCountSamples(todayOpts);
                if (todayRes && todayRes.length) {
                    todayRes.forEach(source => {
                        if (source.steps && source.steps.length > 0) {
                            if(source.steps[0].value > todaySteps) todaySteps = source.steps[0].value;
                        }
                    });
                }
            } catch (err) { console.log("Today steps error", err); }

            // جلب التاريخ
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const historyOpts = {
                startDate: lastWeek.toISOString(),
                endDate: today.toISOString(),
                bucketUnit: 'DAY',
                bucketInterval: 1
            };
            
            const historyMap = {};
            try {
                const historyRes = await GoogleFit.getDailyStepCountSamples(historyOpts);
                if (historyRes) {
                    historyRes.forEach(source => {
                        if (source.source.includes('com.google.android.gms') || source.source.includes('estimated') || source.source.includes('user_input')) {
                            source.steps.forEach(step => {
                                 if(step.date) historyMap[step.date.slice(0, 10)] = step.value;
                            });
                        }
                    });
                }
            } catch (err) { console.log("History steps error", err); }

            const chartData = [];
            for(let i=6; i>=0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayName = language === 'ar' ? ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'][d.getDay()] : d.toDateString().slice(0,3);
                chartData.push({ day: dayName, steps: historyMap[dateStr] || 0 });
            }

            setStepsData({ current: todaySteps, history: chartData });

        } catch (e) {
            console.log("Fetch Error:", e);
        } finally {
            isFetching.current = false;
        }
    };

    const checkInitialConnection = async () => {
        const storedConnected = await AsyncStorage.getItem('isGoogleFitConnected');
        if (storedConnected === 'true') {
            const authorized = await GoogleFit.checkIsAuthorized();
            if (authorized) {
                setIsConnected(true);
                fetchSteps();
            } else {
                // محاولة إعادة الاتصال الصامت لو كان مصرح له سابقاً
                const options = { scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE, Scopes.FITNESS_BODY_READ] };
                try {
                    const authRes = await GoogleFit.authorize(options);
                    if(authRes.success) {
                        setIsConnected(true);
                        fetchSteps();
                    } else {
                        setIsConnected(false);
                    }
                } catch(e) { setIsConnected(false); }
            }
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            let mounted = true;
            const loadSettings = async () => {
                const dark = await AsyncStorage.getItem('isDarkMode');
                const lang = await AsyncStorage.getItem('appLanguage');
                
                if(mounted) {
                    setTheme(dark === 'true' ? darkTheme : lightTheme);
                    if(lang) setLanguage(lang);
                    
                    const goal = await AsyncStorage.getItem('stepsGoal');
                    if(goal) setStepsGoal(parseInt(goal));
                    
                    InteractionManager.runAfterInteractions(() => {
                        checkInitialConnection();
                    });
                }
            };
            loadSettings();
            return () => { mounted = false; isFetching.current = false; };
        }, [])
    );

    const progress = stepsGoal > 0 ? (stepsData.current / stepsGoal) : 0;
    
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '85%', backgroundColor: theme.card, borderRadius: 15, padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center', marginBottom: 10 }}>{t('changeGoalTitle')}</Text>
                        <TextInput 
                            keyboardType="numeric" 
                            placeholder="8000" 
                            placeholderTextColor={theme.textSecondary}
                            style={{ backgroundColor: theme.inputBackground, padding: 10, borderRadius: 8, textAlign: 'center', color: theme.textPrimary, marginBottom: 15 }}
                            onSubmitEditing={(e) => {
                                const val = parseInt(e.nativeEvent.text);
                                if(val > 0) { setStepsGoal(val); AsyncStorage.setItem('stepsGoal', val.toString()); }
                                setModalVisible(false);
                            }}
                        />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: theme.primary, padding: 10, borderRadius: 8, alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 20, marginBottom: 15, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 20 }}>{t('todaySteps')}</Text>
                    
                    {isConnected ? (
                        <>
                            <AnimatedStepsCircle size={180} strokeWidth={15} currentStepCount={stepsData.current} progress={progress} theme={theme} />
                            
                            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', width: '100%', marginTop: 25 }}>
                                <TouchableOpacity onPress={() => setModalVisible(true)} style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="flag-checkered" size={24} color={theme.accentBlue} />
                                    <Text style={{ marginTop: 5, color: theme.textPrimary }}>{stepsGoal.toLocaleString()}</Text>
                                </TouchableOpacity>
                                <View style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="fire" size={24} color={theme.accentOrange} />
                                    <Text style={{ marginTop: 5, color: theme.textPrimary }}>{Math.round(stepsData.current * 0.04)} {t('calUnit')}</Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="map-marker-distance" size={24} color={theme.primary} />
                                    <Text style={{ marginTop: 5, color: theme.textPrimary }}>{(stepsData.current * 0.000762).toFixed(2)} {t('kmUnit')}</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="google-fit" size={50} color={theme.textSecondary} />
                            <Text style={{ marginTop: 10, color: theme.textSecondary, textAlign: 'center' }}>{t('notAvailableMsg')}</Text>
                            <TouchableOpacity onPress={connect} style={{ marginTop: 15, backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('connectBtn')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {isConnected && (
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 15, textAlign: isRTL ? 'right' : 'left' }}>{t('last7Days')}</Text>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 }}>
                            {stepsData.history.map((item, index) => {
                                const max = Math.max(...stepsData.history.map(d => d.steps), 1);
                                const height = (item.steps / max) * 100;
                                return (
                                    <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                                        <View style={{ width: 8, height: `${Math.max(height, 5)}%`, backgroundColor: theme.primary, borderRadius: 4 }} />
                                        <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 5 }}>{item.day}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default StepsScreen;