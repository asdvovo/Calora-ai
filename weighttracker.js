// weighttracker.js - الكود الكامل والمحدث

import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList,
    Modal, TextInput, Dimensions, Alert, StatusBar, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;
const HISTORY_KEY = 'weightHistory';

const lightTheme = { 
    primary: '#388E3C', 
    background: '#E8F5E9', 
    card: '#FFFFFF', 
    textPrimary: '#212121', 
    textSecondary: '#757575', 
    inputBackground: '#F5F5F5', 
    overlay: 'rgba(0,0,0,0.5)', 
    statusBar: 'dark-content', 
    chartLine: (opacity = 1) => `rgba(56, 142, 60, ${opacity})`, 
    chartLabel: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`, 
    tooltipBg: '#212121', 
    tooltipText: '#FFFFFF', 
    white: '#FFFFFF', 
    red: '#F44336', 
};
const darkTheme = { 
    primary: '#66BB6A', 
    background: '#121212', 
    card: '#1E1E1E', 
    textPrimary: '#FFFFFF', 
    textSecondary: '#B0B0B0', 
    inputBackground: '#2C2C2C', 
    overlay: 'rgba(0,0,0,0.7)', 
    statusBar: 'light-content', 
    chartLine: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`, 
    chartLabel: (opacity = 1) => `rgba(224, 224, 224, ${opacity})`, 
    tooltipBg: '#E0E0E0', 
    tooltipText: '#121212', 
    white: '#FFFFFF', 
    red: '#EF9A9A', 
};

const translations = { ar: { weightProgress: 'تطور الوزن', chartEmpty: 'أضف وزنين على الأقل لرؤية الرسم البياني.', statistics: 'إحصائيات', startWeight: 'وزن البداية', currentWeight: 'الوزن الحالي', totalChange: 'التغير الكلي', history: 'السجل التاريخي', historyEmpty: 'لم تقم بتسجيل وزنك بعد.', addWeightTitle: 'إضافة وزن جديد', weightInputPlaceholder: 'أدخل وزنك بالكيلوجرام', cancel: 'إلغاء', save: 'حفظ', errorTitle: 'خطأ', invalidWeight: 'الرجاء إدخال وزن صحيح.', kgUnit: ' كجم' }, en: { weightProgress: 'Weight Progress', chartEmpty: 'Add at least two weights to see the chart.', statistics: 'Statistics', startWeight: 'Start Weight', currentWeight: 'Current Weight', totalChange: 'Total Change', history: 'History Log', historyEmpty: 'You have not logged your weight yet.', addWeightTitle: 'Add New Weight', weightInputPlaceholder: 'Enter your weight in kg', cancel: 'Cancel', save: 'Save', errorTitle: 'Error', invalidWeight: 'Please enter a valid weight.', kgUnit: ' kg' } };

const WeightChartComponent = ({ data, theme, selectedPoint, onPointClick, t }) => {
    const chartConfig = {
        backgroundColor: theme.card,
        backgroundGradientFrom: theme.card,
        backgroundGradientTo: theme.card,
        decimalPlaces: 1,
        color: theme.chartLine,
        labelColor: theme.chartLabel,
        propsForDots: { r: "5", strokeWidth: "2", stroke: theme.background },
    };

    return (
        <View>
            <LineChart
                data={data}
                width={screenWidth - 60}
                height={220}
                yAxisSuffix={t('kgUnit')}
                chartConfig={chartConfig}
                withShadow={true} 
                bezier
                style={{ borderRadius: 16 }}
                onDataPointClick={onPointClick}
            />
            {selectedPoint && (
                <View style={[styles.tooltipPositioner, { left: selectedPoint.x, top: selectedPoint.y }]}>
                    <View style={styles.tooltipContainer}>
                        <View style={styles.tooltipBox(theme)}>
                            <View style={styles.tooltipContent}>
                                <Text style={styles.tooltipValue(theme)}>{selectedPoint.value.toFixed(1)}</Text>
                                <Text style={styles.tooltipUnit(theme)}>{t('kgUnit')}</Text>
                            </View>
                        </View>
                        <View style={styles.tooltipArrow(theme)} />
                    </View>
                </View>
            )}
        </View>
    );
};

const WeightScreen = () => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('ar');
    const [isRTL, setIsRTL] = useState(true);
    const [history, setHistory] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [displayChartData, setDisplayChartData] = useState({ labels: [], datasets: [{ data: [] }] });
    const [isChartLoading, setChartLoading] = useState(true);
    const [isProcessingClick, setIsProcessingClick] = useState(false);
    const [chartKey, setChartKey] = useState(0);

    const t = (key) => translations[language]?.[key] || translations['en'][key];

    const loadSettings = async () => { try { const savedTheme = await AsyncStorage.getItem('isDarkMode'); const currentTheme = savedTheme === 'true' ? darkTheme : lightTheme; setTheme(currentTheme); const savedLang = await AsyncStorage.getItem('appLanguage'); const currentLang = savedLang || 'ar'; setLanguage(currentLang); setIsRTL(currentLang === 'ar'); } catch (e) { console.error('Failed to load settings.', e); } };
    
    const loadHistory = useCallback(async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
            const data = jsonValue != null ? JSON.parse(jsonValue) : [];
            data.sort((a, b) => new Date(a.date) - new Date(b.date));
            setHistory(data);
            return data;
        } catch (e) {
            console.error('Failed to load weight history.', e);
            setHistory([]);
            return [];
        }
    }, []);
    
    useFocusEffect(useCallback(() => {
        const loadAndPrepareData = async () => {
            setChartLoading(true);
            setChartKey(prevKey => prevKey + 1);
            setSelectedPoint(null);
            
            await loadSettings();
            const historyData = await loadHistory();

            const newChartData = historyData.length > 0
                ? {
                    // --- ✅✅✅ التعديل المطلوب هنا ✅✅✅ ---
                    // تم تغيير 'ar-EG' إلى تعبير شرطي يعتمد على لغة التطبيق
                    labels: historyData.map(item => new Date(item.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })).slice(-7),
                    // ------------------------------------------
                    datasets: [{ 
                        data: historyData.map(item => item.weight).slice(-7),
                        strokeWidth: 3
                    }]
                  }
                : { labels: [], datasets: [{ data: [] }] };
            
            setDisplayChartData(newChartData);
            setChartLoading(false);
        };
        
        loadAndPrepareData();
    }, [loadHistory, language])); // أضف language إلى مصفوفة الاعتماديات

    const handleSaveWeight = async () => { const weightValue = parseFloat(newWeight); if (isNaN(weightValue) || weightValue <= 0) { Alert.alert(t('errorTitle'), t('invalidWeight')); return; } const today = new Date(); const todayDateString = today.toISOString().split('T')[0]; const newEntry = { date: today.toISOString(), weight: weightValue }; const existingEntryIndex = history.findIndex(item => item.date.split('T')[0] === todayDateString); let updatedHistory; if (existingEntryIndex > -1) { updatedHistory = [...history]; updatedHistory[existingEntryIndex] = newEntry; } else { updatedHistory = [...history, newEntry]; } updatedHistory.sort((a, b) => new Date(a.date) - new Date(b.date)); try { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory)); await AsyncStorage.setItem('lastKnownWeight', JSON.stringify({ weight: weightValue })); setHistory(updatedHistory); setNewWeight(''); setModalVisible(false); } catch (e) { console.error('Failed to save weight.', e); } };
    
    const handlePointClick = (data) => {
        if (isProcessingClick) return;
        setIsProcessingClick(true);
        if (selectedPoint && selectedPoint.index === data.index && selectedPoint.value === data.value) {
            setSelectedPoint(null);
        } else {
            setSelectedPoint(data);
        }
        setTimeout(() => {
            setIsProcessingClick(false);
        }, 300);
    };
    
    const currentWeight = history.length > 0 ? history[history.length - 1].weight : 0;
    const startWeight = history.length > 0 ? history[0].weight : 0;
    const weightChange = history.length > 1 ? currentWeight - startWeight : 0;

    return (
        <SafeAreaView style={styles.rootContainer(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card(theme)}>
                    <Text style={styles.sectionTitle(theme, isRTL)}>{t('weightProgress')}</Text>
                    
                    {isChartLoading ? (
                        <View style={styles.chartLoaderContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : history.length > 1 ? (
                        <WeightChartComponent
                            key={chartKey}
                            data={displayChartData}
                            theme={theme}
                            selectedPoint={selectedPoint}
                            onPointClick={handlePointClick}
                            t={t}
                        />
                    ) : (
                        <View style={styles.chartLoaderContainer}>
                            <Text style={styles.emptyText(theme)}>{t('chartEmpty')}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.card(theme)}><Text style={styles.sectionTitle(theme, isRTL)}>{t('statistics')}</Text><View style={styles.statsContainer(isRTL)}><View style={styles.statItem}><Text style={styles.statValue(theme)}>{startWeight}{t('kgUnit')}</Text><Text style={styles.statLabel(theme)}>{t('startWeight')}</Text></View><View style={styles.statItem}><Text style={styles.statValue(theme)}>{currentWeight}{t('kgUnit')}</Text><Text style={styles.statLabel(theme)}>{t('currentWeight')}</Text></View><View style={styles.statItem}><Text style={[styles.statValue(theme), {color: weightChange > 0 ? theme.red : theme.primary}]}>{weightChange.toFixed(1)}{t('kgUnit')}</Text><Text style={styles.statLabel(theme)}>{t('totalChange')}</Text></View></View></View>
                <View style={styles.card(theme)}><Text style={styles.sectionTitle(theme, isRTL)}>{t('history')}</Text><FlatList data={[...history].reverse()} keyExtractor={(item) => item.date} renderItem={({ item }) => (<View style={styles.historyItem(theme, isRTL)}><Text style={styles.historyWeight(theme)}>{item.weight}{t('kgUnit')}</Text><Text style={styles.historyDate(theme)}>{new Date(item.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text></View>)} ListEmptyComponent={<Text style={styles.emptyText(theme)}>{t('historyEmpty')}</Text>}/></View>
            </ScrollView>
            <TouchableOpacity style={styles.fab(theme, isRTL)} onPress={() => setModalVisible(true)}><Ionicons name="add" size={30} color={theme.white} /></TouchableOpacity>
            <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}><View style={styles.modalOverlay(theme)}><View style={styles.modalView(theme)}><Text style={styles.modalTitle(theme)}>{t('addWeightTitle')}</Text><TextInput style={styles.weightInput(theme, isRTL)} value={newWeight} onChangeText={setNewWeight} keyboardType="numeric" placeholder={t('weightInputPlaceholder')} placeholderTextColor={theme.textSecondary} autoFocus={true}/><View style={styles.modalActions(isRTL)}><TouchableOpacity style={[styles.actionButton, styles.cancelButton(theme)]} onPress={() => setModalVisible(false)}><Text style={[styles.actionButtonText, styles.cancelButtonText(theme)]}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.addButton(theme)]} onPress={handleSaveWeight}><Text style={styles.actionButtonText(theme)}>{t('save')}</Text></TouchableOpacity></View></View></View></Modal>
        </SafeAreaView>
    );
};

const styles = {
    rootContainer: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    container: { padding: 20, paddingBottom: 120 },
    card: (theme) => ({ backgroundColor: theme.card, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }),
    sectionTitle: (theme, isRTL) => ({ fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left', marginBottom: 15 }),
    emptyText: (theme) => ({ textAlign: 'center', color: theme.textSecondary, fontSize: 16 }),
    chartLoaderContainer: { height: 220, justifyContent: 'center', alignItems: 'center' },
    statsContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around' }),
    statItem: { alignItems: 'center' },
    statValue: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary }),
    statLabel: (theme) => ({ fontSize: 14, color: theme.textSecondary, marginTop: 4 }),
    historyItem: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.background }),
    historyDate: (theme) => ({ fontSize: 16, color: theme.textPrimary }),
    historyWeight: (theme) => ({ fontSize: 16, color: theme.textSecondary, fontWeight: 'bold' }),
    fab: (theme, isRTL) => ({ 
        position: 'absolute', 
        bottom: 30,
        [isRTL ? 'left' : 'right']: 30,
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        backgroundColor: theme.primary, 
        justifyContent: 'center', 
        alignItems: 'center', 
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    }),
    modalOverlay: (theme) => ({ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.overlay }),
    modalView: (theme) => ({ width: '85%', backgroundColor: theme.card, borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }),
    modalTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 15 }),
    weightInput: (theme, isRTL) => ({ width: '100%', backgroundColor: theme.inputBackground, color: theme.textPrimary, padding: 15, borderRadius: 10, textAlign: isRTL ? 'right' : 'left', fontSize: 18, fontWeight: 'bold', marginVertical: 10 }),
    modalActions: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', width: '100%', marginTop: 20 }),
    actionButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
    addButton: (theme) => ({ backgroundColor: theme.primary }),
    actionButtonText: (theme) => ({ color: theme.white, fontSize: 16, fontWeight: 'bold' }),
    cancelButton: (theme) => ({ backgroundColor: theme.inputBackground }),
    cancelButtonText: (theme) => ({ color: theme.primary, fontWeight: 'bold' }),
    tooltipPositioner: { position: 'absolute' },
    tooltipContainer: { alignItems: 'center', transform: [ { translateX: '-50%' }, { translateY: -55 } ] },
    tooltipBox: (theme) => ({ backgroundColor: theme.tooltipBg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, }),
    tooltipArrow: (theme) => ({ width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.tooltipBg, }),
    tooltipContent: { 
        flexDirection: 'row', 
        alignItems: 'baseline' 
    },
    tooltipValue: (theme) => ({ color: theme.tooltipText, fontWeight: 'bold', fontSize: 16 }),
    tooltipUnit: (theme) => ({ color: theme.tooltipText, fontSize: 12, fontWeight: 'normal', marginLeft: 4 }),
};

export default WeightScreen;