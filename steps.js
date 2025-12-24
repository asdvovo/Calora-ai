import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, 
    ActivityIndicator, Alert, Modal, TextInput, StatusBar,
    Platform, PermissionsAndroid, AppState, InteractionManager 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit, { Scopes } from 'react-native-google-fit'; 
import Animated, { useAnimatedStyle, useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const STEP_LENGTH_KM = 0.000762;
const CALORIES_PER_STEP = 0.04;
const MAX_STEPS_GOAL = 100000;

const lightTheme = { 
    primary: '#388E3C', primaryDark: '#1B5E20', background: '#E8F5E9',  
    card: '#FFFFFF',  textPrimary: '#212121',  textSecondary: '#757575', 
    progressUnfilled: '#D6EAD7', inputBackground: '#F5F5F5',  overlay: 'rgba(0,0,0,0.5)', 
    accentOrange: '#FF7043', accentBlue: '#007BFF', white: '#FFFFFF', 
    statusBar: 'dark-content', indicatorDot: '#1B5E20' 
};

const darkTheme = { 
    primary: '#66BB6A', primaryDark: '#81C784', background: '#121212',  
    card: '#1E1E1E',  textPrimary: '#FFFFFF',  textSecondary: '#B0B0B0', 
    progressUnfilled: '#2C2C2C', inputBackground: '#2C2C2C',  overlay: 'rgba(0,0,0,0.7)', 
    accentOrange: '#FF8A65', accentBlue: '#42A5F5', white: '#FFFFFF', 
    statusBar: 'light-content', indicatorDot: '#A5D6A7' 
};

const translations = { 
    ar: {
        screenTitle: 'تقرير الخطوات', todaySteps: 'خطوات اليوم', kmUnit: ' كم', calUnit: ' سعرة', last7Days: 'آخر 7 أيام', last30Days: 'آخر 30 يوم', periodSummary: 'ملخص {period}', week: 'الأسبوع', month: 'الشهر', noData: 'لا توجد بيانات لعرضها.', periodStats: 'إحصائيات {period}', avgSteps: 'متوسط الخطوات اليومي:', totalSteps: 'إجمالي خطوات {period}:', bestDay: 'أفضل يوم في {period}:', changeGoalTitle: 'تغيير الهدف اليومي', changeGoalMsg: 'أدخل هدفك الجديد للخطوات:', goalPlaceholder: 'مثال: 8000', cancel: 'إلغاء', save: 'حفظ', goalTooLargeTitle: 'الهدف كبير جدًا', goalTooLargeMsg: 'الرجاء إدخال رقم أقل من {maxSteps}.', errorTitle: 'خطأ', invalidNumber: 'الرجاء إدخال رقم صحيح.', notAvailableTitle: 'Google Fit غير متصل', notAvailableMsg: 'يرجى ربط حساب Google Fit لعرض الخطوات.', connectBtn: 'ربط Google Fit', permissionDeniedTitle: 'صلاحية مرفوضة', permissionDeniedMsg: 'يرجى منح صلاحية النشاط البدني.', bestDayLabel: 'الأفضل:'
    },
    en: {
        screenTitle: 'Steps Report', todaySteps: 'Today\'s Steps', kmUnit: ' km', calUnit: ' kcal', last7Days: 'Last 7 Days', last30Days: 'Last 30 Days', periodSummary: '{period} Summary', week: 'Week', month: 'Month', noData: 'No data to display.', periodStats: '{period} Statistics', avgSteps: 'Daily Average:', totalSteps: 'Total {period} Steps:', bestDay: 'Best day in {period}:', changeGoalTitle: 'Change Daily Goal', changeGoalMsg: 'Enter your new steps goal:', goalPlaceholder: 'Ex: 8000', cancel: 'Cancel', save: 'Save', goalTooLargeTitle: 'Goal Too Large', goalTooLargeMsg: 'Please enter a number less than {maxSteps}.', errorTitle: 'Error', invalidNumber: 'Please enter a valid number.', notAvailableTitle: 'Google Fit Disconnected', notAvailableMsg: 'Please connect Google Fit to view steps.', connectBtn: 'Connect Google Fit', permissionDeniedTitle: 'Permission Denied', permissionDeniedMsg: 'Please grant physical activity permission.', bestDayLabel: 'Best:'
    }
};

const describeArc = (x, y, radius, startAngle, endAngle) => { 
    'worklet';
    if (typeof x !== 'number' || typeof y !== 'number' || typeof radius !== 'number' || isNaN(endAngle)) { return "M 0 0"; }
    const clampedEndAngle = Math.min(endAngle, 359.999); 
    const startRad = (startAngle - 90) * Math.PI / 180.0;
    const endRad = (clampedEndAngle - 90) * Math.PI / 180.0;
    const start = { x: x + radius * Math.cos(startRad), y: y + radius * Math.sin(startRad) }; 
    const end = { x: x + radius * Math.cos(endRad), y: y + radius * Math.sin(endRad) }; 
    const largeArcFlag = clampedEndAngle - startAngle <= 180 ? '0' : '1'; 
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`; 
};
const AnimatedPath = Animated.createAnimatedComponent(Path);

const AnimatedStepsCircle = ({ progress, size, strokeWidth, currentStepCount, theme }) => { 
    const RADIUS = size / 2; 
    const CENTER_RADIUS = RADIUS - strokeWidth / 2; 
    const DOT_SIZE = strokeWidth * 1.6; 
    const safeProgress = (isNaN(progress) || !isFinite(progress) || progress < 0) ? 0 : Math.min(progress, 1);
    const animatedProgress = useSharedValue(0); 
    
    useEffect(() => { animatedProgress.value = withTiming(safeProgress, { duration: 1000 }); }, [safeProgress]); 
    const animatedPathProps = useAnimatedProps(() => { 
        const angle = animatedProgress.value * 360; 
        if (angle <= 0) return { d: 'M 0 0' }; 
        return { d: describeArc(size / 2, size / 2, CENTER_RADIUS, 0, angle) }; 
    }); 
    const indicatorStyle = useAnimatedStyle(() => {
        const angleInRad = (animatedProgress.value * 360 - 90) * Math.PI / 180;
        const x = (size / 2) + CENTER_RADIUS * Math.cos(angleInRad);
        const y = (size / 2) + CENTER_RADIUS * Math.sin(angleInRad);
        return {
            transform: [ { translateX: x - (DOT_SIZE / 2) + 0 }, { translateY: y - (DOT_SIZE / 2) } ],
            opacity: 1 
        };
    });

    return ( 
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <Circle cx={size / 2} cy={size / 2} r={CENTER_RADIUS} stroke={theme.progressUnfilled} strokeWidth={strokeWidth} fill="transparent" />
                <AnimatedPath animatedProps={animatedPathProps} stroke={theme.primary} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" />
            </Svg>
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: theme.indicatorDot, borderWidth: 3, borderColor: theme.card, elevation: 3, shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2 }, indicatorStyle]} />
            <View style={styles.summaryTextContainer}>
                <Text style={styles.progressCircleText(theme)}>{Math.round(Number(currentStepCount) || 0).toLocaleString('en-US')}</Text>
            </View>
        </View> 
    ); 
};

const StepsScreen = () => {
    const navigation = useNavigation(); 
    const isFetchingRef = useRef(false);
    
    const [theme, setTheme] = useState(lightTheme);
    const [currentStepCount, setCurrentStepCount] = useState(0);
    const [stepsGoal, setStepsGoal] = useState(10000);
    const [historicalData, setHistoricalData] = useState([]);
    const [rawStepsData, setRawStepsData] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [isGoogleFitConnected, setIsGoogleFitConnected] = useState(true); // افتراضي true عشان ميعملش فليكر
    const [isPromptVisible, setPromptVisible] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [language, setLanguage] = useState('en');

    const isRTL = language === 'en'; 
    const t = (key) => translations[language]?.[key] || translations['en'][key] || key;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: t('screenTitle'),
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: theme.card, shadowColor: 'transparent', elevation: 0 },
            headerTintColor: theme.textPrimary,
            headerRight: isRTL ? () => <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginHorizontal: 15 }}><Ionicons name="arrow-back" size={24} color={theme.textPrimary} /></TouchableOpacity> : null,
            headerLeft: !isRTL ? () => <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginHorizontal: 15 }}><Ionicons name="arrow-forward" size={24} color={theme.textPrimary} /></TouchableOpacity> : null,
        });
    }, [navigation, theme, language, isRTL]);

    const connectGoogleFit = async () => {
        try {
            let permissionGranted = true;
            if (Platform.OS === 'android' && Platform.Version >= 29) {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    permissionGranted = false;
                    Alert.alert(t('permissionDeniedTitle'), t('permissionDeniedMsg'));
                    return;
                }
            }
            if (permissionGranted) {
                const options = { scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE, Scopes.FITNESS_BODY_READ] };
                const res = await GoogleFit.authorize(options);
                if (res.success) {
                    setIsGoogleFitConnected(true);
                    await AsyncStorage.setItem('isGoogleFitConnected', 'true');
                    GoogleFit.startRecording((callback) => {}, ['step', 'calorie']);
                    fetchGoogleFitData(true);
                } else {
                    Alert.alert(t('errorTitle'), 'Connection failed');
                }
            }
        } catch (error) { console.warn("Auth Error:", error); }
    };

    const fetchGoogleFitData = async (shouldFetchHistory = true) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            // تحقق مبدئي من التخزين
            const storedConnected = await AsyncStorage.getItem('isGoogleFitConnected');
            
            // لو المستخدم مسجلش دخول قبل كدة، اخرج
            if (storedConnected !== 'true') {
                setIsGoogleFitConnected(false);
                isFetchingRef.current = false;
                setLoading(false);
                return;
            }

            // لو مسجل، تأكد من الصلاحية
            const isAuth = await GoogleFit.checkIsAuthorized();
            
            // لو الصلاحية مش موجودة، حاول تعمل إعادة اتصال صامت
            if (!isAuth) {
                try {
                    const authRes = await GoogleFit.authorize({ scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE, Scopes.FITNESS_BODY_READ] });
                    if (!authRes.success) {
                        // لو فشل الاتصال الصامت، هنا بس نعتبره غير متصل
                        setIsGoogleFitConnected(false);
                        isFetchingRef.current = false;
                        setLoading(false);
                        return;
                    }
                } catch(e) {
                    setIsGoogleFitConnected(false);
                    isFetchingRef.current = false;
                    setLoading(false);
                    return;
                }
            }

            // وصلنا هنا يعني الاتصال تمام
            setIsGoogleFitConnected(true);
            
            // تفعيل التسجيل في الخلفية لضمان التحديث
            GoogleFit.startRecording((callback) => {
                // callback للاطمئنان فقط
            }, ['step']);

            const now = new Date();
            const startOfDay = new Date();
            startOfDay.setHours(0,0,0,0);
            
            const todayOpts = { startDate: startOfDay.toISOString(), endDate: now.toISOString() };
            try {
                const todayRes = await GoogleFit.getDailyStepCountSamples(todayOpts);
                if (todayRes && todayRes.length > 0) {
                    let maxSteps = 0;
                    todayRes.forEach(source => {
                        if (source.steps && source.steps.length > 0) {
                            if (source.steps[0].value > maxSteps) maxSteps = source.steps[0].value;
                        }
                    });
                    setCurrentStepCount(maxSteps);
                }
            } catch (e) { console.log("Today steps error", e); }

            if (shouldFetchHistory) {
                try {
                    const daysToFetch = 30; 
                    const historyStart = new Date();
                    historyStart.setDate(historyStart.getDate() - daysToFetch);
                    historyStart.setHours(0,0,0,0);

                    const historyOpts = {
                        startDate: historyStart.toISOString(),
                        endDate: new Date().toISOString(),
                        bucketUnit: 'DAY', bucketInterval: 1
                    };

                    const historyRes = await GoogleFit.getDailyStepCountSamples(historyOpts);
                    const finalData = {}; 

                    if (historyRes) {
                        historyRes.forEach(source => {
                            if (source.source.includes('com.google.android.gms') || source.source.includes('estimated')) {
                                source.steps.forEach(step => {
                                    if(step.date) {
                                        const dateStr = step.date.slice(0, 10);
                                        finalData[dateStr] = step.value;
                                    }
                                });
                            }
                        });
                    }
                    setRawStepsData(finalData);
                } catch (e) { console.log("History error", e); }
            }
        } catch (globalError) {
            console.warn("Fetch Error:", globalError);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        try {
            if (selectedPeriod === 'week') {
                const weekData = [];
                const today = new Date();
                const currentDayIndex = today.getDay(); 
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - currentDayIndex); 
                startOfWeek.setHours(0, 0, 0, 0);

                const enDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const arDays = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

                for (let i = 0; i < 7; i++) {
                    const d = new Date(startOfWeek);
                    d.setDate(startOfWeek.getDate() + i);
                    
                    const offset = d.getTimezoneOffset() * 60000;
                    const dateKey = new Date(d.getTime() - offset).toISOString().split('T')[0];
                    let dayName = language === 'ar' ? arDays[d.getDay()] : enDays[d.getDay()];

                    weekData.push({ day: dayName, steps: rawStepsData[dateKey] || 0 });
                }
                setHistoricalData(weekData);
            } else {
                const formattedData = [];
                for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const offset = d.getTimezoneOffset() * 60000;
                    const dateKey = new Date(d.getTime() - offset).toISOString().split('T')[0];
                    formattedData.push({ steps: rawStepsData[dateKey] || 0 });
                }
                const weeklyData = [];
                const chunkSize = Math.ceil(formattedData.length / 4);
                for (let w = 0; w < 4; w++) {
                    let weekTotal = 0;
                    for (let d = 0; d < chunkSize; d++) {
                        const index = (w * chunkSize) + d;
                        if (formattedData[index]) weekTotal += formattedData[index].steps;
                    }
                    weeklyData.push({ day: `${t('week')} ${w + 1}`, steps: weekTotal });
                }
                setHistoricalData(weeklyData);
            }
        } catch (err) { console.log("Chart Processing Error:", err); }
    }, [selectedPeriod, rawStepsData, language]);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            let interval = null;

            const init = async () => {
                const savedTheme = await AsyncStorage.getItem('isDarkMode');
                if (isMounted) setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                const savedLang = await AsyncStorage.getItem('appLanguage');
                if (isMounted) setLanguage(savedLang || 'en'); 
                const savedGoal = await AsyncStorage.getItem('stepsGoal');
                if (isMounted && savedGoal) setStepsGoal(parseInt(savedGoal, 10));

                InteractionManager.runAfterInteractions(() => {
                    if (isMounted) fetchGoogleFitData(true);
                });
            };
            init();

            // 🔥 تحديث دوري كل دقيقة عشان يجيب الخطوات الجديدة 🔥
            interval = setInterval(() => {
                if (isMounted && isGoogleFitConnected) {
                    fetchGoogleFitData(false); // false يعني متجيبش الهيستوري كله، هات اليوم بس
                }
            }, 60000);

            return () => { 
                isMounted = false; 
                if (interval) clearInterval(interval);
            };
        }, [isGoogleFitConnected]) 
    );
    
    const distance = (currentStepCount * STEP_LENGTH_KM).toFixed(2);
    const calories = Math.round(currentStepCount * CALORIES_PER_STEP);
    const totalPeriodSteps = historicalData.reduce((sum, item) => sum + item.steps, 0);
    const averageDivisor = selectedPeriod === 'week' ? 7 : 30; 
    let totalRawStepsForPeriod = 0;
    if (Object.keys(rawStepsData).length > 0) {
        const limit = selectedPeriod === 'week' ? 7 : 30;
        const keys = Object.keys(rawStepsData).sort().reverse().slice(0, limit);
        keys.forEach(k => totalRawStepsForPeriod += rawStepsData[k]);
    }
    const averagePeriodSteps = Math.round(totalRawStepsForPeriod / averageDivisor) || 0;
    const bestDayInPeriod = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.steps)) : 0;
    const maxChartSteps = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.steps), 1) : 1;
    const periodLabel = selectedPeriod === 'week' ? t('week') : t('month');
    const progress = stepsGoal > 0 ? (currentStepCount / stepsGoal) : 0;

    const renderTodaySummary = () => {
        if (!isGoogleFitConnected && !loading) {
            return (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="google-fit" size={48} color={theme.textSecondary} />
                    <Text style={styles.errorText(theme)}>{t('notAvailableTitle')}</Text>
                    <Text style={styles.errorSubText(theme)}>{t('notAvailableMsg')}</Text>
                    <TouchableOpacity style={styles.connectButton(theme)} onPress={connectGoogleFit}>
                        <Text style={styles.connectButtonText}>{t('connectBtn')}</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <>
                <View> 
                    <AnimatedStepsCircle size={180} strokeWidth={15} currentStepCount={currentStepCount} progress={progress} theme={theme} />
                </View>
                <View style={styles.subStatsContainer(isRTL)}>
                    <TouchableOpacity style={styles.subStatBox} onPress={() => setPromptVisible(true)}>
                        <MaterialCommunityIcons name="flag-checkered" size={24} color={theme.accentBlue} />
                        <Text style={styles.subStatText(theme)}>{stepsGoal.toLocaleString('en-US')}</Text>
                    </TouchableOpacity>
                    <View style={styles.subStatBox}>
                        <MaterialCommunityIcons name="fire" size={24} color={theme.accentOrange} />
                        <Text style={styles.subStatText(theme)}>{calories} {t('calUnit')}</Text>
                    </View>
                    <View style={styles.subStatBox}>
                        <MaterialCommunityIcons name="map-marker-distance" size={24} color={theme.primary} />
                        <Text style={styles.subStatText(theme)}>{distance} {t('kmUnit')}</Text>
                    </View>
                </View>
            </>
        );
    }

    return (
        <SafeAreaView style={styles.modalPage(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <Modal visible={isPromptVisible} transparent animationType="fade" onRequestClose={() => setPromptVisible(false)}>
                <View style={styles.modalOverlay(theme)}>
                    <View style={styles.promptContainer(theme)}>
                        <Text style={styles.promptTitle(theme)}>{t('changeGoalTitle')}</Text>
                        <TextInput 
                            style={styles.promptInput(theme)} 
                            keyboardType="numeric" 
                            placeholder="8000"
                            placeholderTextColor={theme.textSecondary}
                            onSubmitEditing={(e) => {
                                const val = parseInt(e.nativeEvent.text);
                                if(val > 0) { setStepsGoal(val); AsyncStorage.setItem('stepsGoal', val.toString()); }
                                setPromptVisible(false);
                            }}
                        />
                        <TouchableOpacity onPress={() => setPromptVisible(false)} style={[styles.promptButton, styles.promptButtonPrimary(theme)]}>
                            <Text style={styles.promptButtonTextPrimary}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.modalPageContent}>
                <View style={[styles.card(theme), styles.todaySummaryCard]}>
                    <Text style={styles.todaySummaryLabel(theme)}>{t('todaySteps')}</Text>
                    {renderTodaySummary()}
                </View>

                {isGoogleFitConnected && (
                <>
                    <View style={styles.card(theme)}>
                        <View style={styles.periodToggleContainer(theme, isRTL)}>
                            <TouchableOpacity style={[styles.periodToggleButton, selectedPeriod === 'week' && styles.activePeriodButton(theme)]} onPress={() => setSelectedPeriod('week')}><Text style={[styles.periodButtonText(theme), selectedPeriod === 'week' && styles.activePeriodText(theme)]}>{t('last7Days')}</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.periodToggleButton, selectedPeriod === 'month' && styles.activePeriodButton(theme)]} onPress={() => setSelectedPeriod('month')}><Text style={[styles.periodButtonText(theme), selectedPeriod === 'month' && styles.activePeriodText(theme)]}>{t('last30Days')}</Text></TouchableOpacity>
                        </View>
                        <Text style={styles.sectionTitle(theme, isRTL)}>{t('periodSummary').replace('{period}', periodLabel)}</Text>
                        
                        <View style={styles.chartContainer(isRTL)}>
                            {historicalData.map((item, index) => ( 
                                <View key={index} style={styles.barWrapper}>
                                    <View style={[
                                        styles.bar(theme), 
                                        {
                                            height: `${Math.max((item.steps / maxChartSteps) * 100, 5)}%`, 
                                            width: selectedPeriod === 'month' ? '60%' : '75%' 
                                        }
                                    ]} />
                                    <Text style={styles.barLabel(theme)} numberOfLines={1}>{item.day}</Text>
                                </View> 
                            ))}
                        </View> 
                    </View>

                    <View style={styles.card(theme)}>
                        <Text style={styles.sectionTitle(theme, isRTL)}>{t('periodStats').replace('{period}', periodLabel)}</Text>
                        {loading ? <ActivityIndicator color={theme.primary}/> : <>
                            <View style={styles.statsRow(theme, isRTL)}>
                                <Text style={styles.statLabel(theme, isRTL)}>{t('avgSteps')}</Text>
                                <Text style={styles.statValue(theme, isRTL)}>{averagePeriodSteps.toLocaleString('en-US')}</Text>
                            </View>
                            <View style={styles.statsRow(theme, isRTL)}>
                                <Text style={styles.statLabel(theme, isRTL)}>{t('totalSteps').replace('{period}', periodLabel)}</Text>
                                <Text style={styles.statValue(theme, isRTL)}>{totalPeriodSteps.toLocaleString('en-US')}</Text>
                            </View>
                            <View style={styles.statsRow(theme, isRTL)}>
                                <Text style={styles.statLabel(theme, isRTL)}>{selectedPeriod === 'week' ? t('bestDay').replace('{period}', periodLabel) : `${t('bestDayLabel')} ${periodLabel}`}</Text>
                                <Text style={styles.statValue(theme, isRTL)}>{bestDayInPeriod.toLocaleString('en-US')}</Text>
                            </View>
                        </>}
                    </View>
                </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = {
    modalPage: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    modalPageContent: { padding: 20 },
    card: (theme) => ({ backgroundColor: theme.card, borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }),
    sectionTitle: (theme, isRTL) => ({ 
        fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left', alignSelf: 'stretch', marginBottom: 4, marginTop: 15 
    }),
    todaySummaryCard: { alignItems: 'center', paddingVertical: 30 },
    todaySummaryLabel: (theme) => ({ fontSize: 16, color: theme.textSecondary, marginBottom: 20 }),
    progressCircleText: (theme) => ({ fontSize: 36, fontWeight: 'bold', color: theme.textPrimary }),
    summaryTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    subStatsContainer: (isRTL) => ({ 
        flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', width: '100%', marginTop: 25 
    }),
    subStatBox: { alignItems: 'center', padding: 10 },
    subStatText: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginTop: 5 }),
    chartContainer: (isRTL) => ({ 
        flexDirection: isRTL ? 'row-reverse' : 'row', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        height: 150, 
        marginTop: 20 
    }), 
    barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }, 
    barLabel: (theme) => ({ marginTop: 5, fontSize: 10, color: theme.textSecondary, textAlign: 'center' }),
    bar: (theme) => ({ backgroundColor: theme.primary, borderRadius: 5, minHeight: 5 }),
    statsRow: (theme, isRTL) => ({ 
        flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.background 
    }),
    statLabel: (theme, isRTL) => ({ fontSize: 16, color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }),
    statValue: (theme, isRTL) => ({ fontSize: 16, fontWeight: 'bold', color: theme.textPrimary, textAlign: isRTL ? 'left' : 'right' }),
    modalOverlay: (theme) => ({ flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center' }),
    promptContainer: (theme) => ({ width: '85%', backgroundColor: theme.card, borderRadius: 15, padding: 20 }),
    promptTitle: (theme) => ({ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: theme.textPrimary, marginBottom: 15 }),
    promptInput: (theme) => ({ borderWidth: 1, borderColor: theme.progressUnfilled, backgroundColor: theme.inputBackground, color: theme.textPrimary, borderRadius: 8, padding: 10, textAlign: 'center', fontSize: 18, marginBottom: 20 }),
    promptButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, alignItems: 'center' },
    promptButtonPrimary: (theme) => ({ backgroundColor: theme.primary }),
    promptButtonTextPrimary: { color: 'white', fontWeight: 'bold' },
    periodToggleContainer: (theme, isRTL) => ({ 
        flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: theme.background, borderRadius: 10, padding: 4, marginBottom: 10 
    }),
    periodToggleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    activePeriodButton: (theme) => ({ backgroundColor: theme.card, elevation: 2 }),
    periodButtonText: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.textSecondary }),
    activePeriodText: (theme) => ({ color: theme.primary }),
    errorContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: (theme) => ({ marginTop: 15, fontSize: 20, fontWeight: 'bold', color: theme.textPrimary }),
    errorSubText: (theme) => ({ marginTop: 5, fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 20 }),
    connectButton: (theme) => ({ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }),
    connectButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
};

export default StepsScreen;