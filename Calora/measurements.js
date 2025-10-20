// In measurements.js (شاشة القياسات المعدلة لتعمل على Expo Snack)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
// --- استخدام المكتبة البديلة المتوافقة مع Snack ---
import Slider from '@miblanchard/react-native-slider'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===================================================================
// --- 1. الثيمات والترجمات ---
// ===================================================================
const lightTheme = {
  primary: '#388E3C', textAndIcons: '#2E7D32', background: '#F9FBFA', white: '#FFFFFF',
  cardBorder: '#EFF2F1', grayText: '#888888', disabled: '#A5D6A7', progressBarBg: '#E8F5E9',
  bubbleBg: '#E8F5E9', sliderMaxTrack: '#D1E7D3', statusBar: 'dark-content',
};

const darkTheme = {
  primary: '#66BB6A', textAndIcons: '#AED581', background: '#121212', white: '#1E1E1E',
  cardBorder: '#272727', grayText: '#B0B0B0', disabled: '#4CAF50', progressBarBg: '#333333',
  bubbleBg: '#37474F', sliderMaxTrack: '#37474F', statusBar: 'light-content',
};

const translations = {
  en: {
    title: "What Are Your Measurements?",
    subtitle: "Don't worry, this information is private and helps us set your starting point.",
    heightLabel: "Height",
    heightUnit: "cm",
    weightLabel: "Current Weight",
    weightUnit: "kg",
    nextButton: "Next",
  },
  ar: {
    title: "ما هي قياساتك الحالية؟",
    subtitle: "لا تقلق، هذه المعلومات خاصة بك وحدك وتساعدنا في تحديد نقطة البداية.",
    heightLabel: "الطول",
    heightUnit: "سم",
    weightLabel: "الوزن الحالي",
    weightUnit: "كجم",
    nextButton: "التالي",
  },
};

// ===================================================================
// --- 2. المكونات الاحترافية الديناميكية ---
// ===================================================================
const ProgressBar = ({ step, totalSteps, theme }) => (
  <View style={styles.progressBarContainer(theme)}>
    <View style={[styles.progressBar(theme), { width: `${(step / totalSteps) * 100}%` }]} />
  </View>
);

const PrimaryButton = ({ title, onPress, disabled = false, theme }) => (
  <TouchableOpacity
    style={[styles.button(theme), disabled ? styles.buttonDisabled(theme) : styles.buttonEnabled(theme)]}
    onPress={onPress} disabled={disabled} activeOpacity={0.7}>
    <Text style={styles.buttonText(theme)}>{title}</Text>
  </TouchableOpacity>
);

const ScreenHeader = ({ title, subtitle, theme }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.title(theme)}>{title}</Text>
    <Text style={styles.subtitle(theme)}>{subtitle}</Text>
  </View>
);

const MeasurementSlider = ({ label, unit, value, onValueChange, min, max, step, theme, isRTL }) => (
  <View style={styles.sliderComponentContainer}>
    <View style={styles.sliderLabelContainer(isRTL)}>
      <Text style={styles.label(theme, isRTL)}>{label}</Text>
      <View style={styles.valueBubble(theme, isRTL)}>
        <Text style={styles.sliderValue(theme)}>{value.toFixed(label === translations[isRTL ? 'ar' : 'en'].weightLabel ? 1 : 0)}</Text>
        <Text style={styles.sliderUnit(theme, isRTL)}>{unit}</Text>
      </View>
    </View>
    <Slider
      style={styles.sliderStyle}
      minimumValue={min} maximumValue={max} step={step} value={value} 
      onValueChange={(newValue) => onValueChange(newValue[0])} // المكتبة الجديدة ترجع القيمة داخل مصفوفة
      minimumTrackTintColor={theme.primary} maximumTrackTintColor={theme.sliderMaxTrack} thumbTintColor={theme.primary}
    />
  </View>
);

// ===================================================================
// --- 3. شاشة القياسات (MeasurementsScreen) ---
// ===================================================================
const MeasurementsScreen = ({ navigation, route }) => {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70.0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('ar');

  const theme = isDarkMode ? darkTheme : lightTheme;
  const isRTL = language === 'ar';
  const t = (key) => translations[language]?.[key] || translations['en'][key];

  useEffect(() => {
    const loadSettings = async () => {
      // In Snack, AsyncStorage might have limitations, but the code is correct
      const darkMode = await AsyncStorage.getItem('isDarkMode');
      setIsDarkMode(darkMode === 'true');
      const lang = await AsyncStorage.getItem('appLanguage');
      if (lang) setLanguage(lang);
    };
    loadSettings();
  }, []);

  const handleNextPress = () => {
    const collectedData = {
      ...(route?.params || {}),
      height: Math.round(height),
      weight: parseFloat(weight.toFixed(1)),
    };
    // This will now work because navigation is provided by App.js
    // For the demo, we'll just show an alert
    alert(`Data to be sent to next screen: ${JSON.stringify(collectedData)}`);
    // In a real app, you would use:
    // navigation.navigate('Goal', collectedData); 
  };

  return (
    <SafeAreaView style={styles.safeArea(theme)}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <View style={styles.container}>
        <ProgressBar step={2} totalSteps={4} theme={theme} />
        <ScreenHeader title={t('title')} subtitle={t('subtitle')} theme={theme} />
        <View style={styles.formContainer}>
          <MeasurementSlider
            label={t('heightLabel')} unit={t('heightUnit')} value={height} onValueChange={setHeight}
            min={120} max={220} step={1} theme={theme} isRTL={isRTL}
          />
          <MeasurementSlider
            label={t('weightLabel')} unit={t('weightUnit')} value={weight} onValueChange={setWeight}
            min={40} max={150} step={0.5} theme={theme} isRTL={isRTL}
          />
        </View>
        <View style={styles.footer}>
          <PrimaryButton title={t('nextButton')} onPress={handleNextPress} theme={theme} />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ===================================================================
// --- 4. الأنماط الديناميكية ---
// ===================================================================
const styles = {
  safeArea: (theme) => ({ flex: 1, backgroundColor: theme.background }),
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  progressBarContainer: (theme) => ({ height: 8, width: '100%', backgroundColor: theme.progressBarBg, borderRadius: 4, marginBottom: 20 }),
  progressBar: (theme) => ({ height: '100%', backgroundColor: theme.primary, borderRadius: 4 }),
  headerContainer: { alignItems: 'center', marginVertical: 20, paddingHorizontal: 10 },
  title: (theme) => ({ fontSize: 28, fontWeight: 'bold', color: theme.textAndIcons, marginBottom: 12, textAlign: 'center' }),
  subtitle: (theme) => ({ fontSize: 16, color: theme.grayText, textAlign: 'center', lineHeight: 24 }),
  formContainer: { flex: 1, justifyContent: 'center' },
  label: (theme, isRTL) => ({ fontSize: 18, color: theme.textAndIcons, marginBottom: 12, fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }),
  footer: { paddingBottom: 20, paddingTop: 10 },
  button: (theme) => ({ paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%' }),
  buttonEnabled: (theme) => ({ backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 }),
  buttonDisabled: (theme) => ({ backgroundColor: theme.disabled, elevation: 0, shadowColor: 'transparent' }),
  buttonText: (theme) => ({ color: theme.background === '#121212' ? '#000' : '#FFF', fontSize: 18, fontWeight: 'bold' }),
  sliderComponentContainer: { width: '100%', marginBottom: 40 },
  sliderLabelContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }),
  valueBubble: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'baseline', backgroundColor: theme.bubbleBg, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 }),
  sliderValue: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.primary, fontVariant: ['tabular-nums'] }),
  sliderUnit: (theme, isRTL) => ({ fontSize: 14, color: theme.textAndIcons, fontWeight: '600', [isRTL ? 'marginRight' : 'marginLeft']: 5 }),
  sliderStyle: { width: '100%', height: 40, marginTop: 15 },
};

export default MeasurementsScreen;