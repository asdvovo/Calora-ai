// In GoalScreen.js (الكود الكامل والمعدل)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ===================================================================
// --- 1. الثيمات والترجمات ---
// ===================================================================
const lightTheme = {
  primary: '#388E3C', textAndIcons: '#2E7D32', background: '#F9FBFA', white: '#FFFFFF',
  cardBorder: '#EFF2F1', grayText: '#888888', disabled: '#A5D6A7', progressBarBg: '#E8F5E9',
  statusBar: 'dark-content',
};

const darkTheme = {
  primary: '#66BB6A', textAndIcons: '#AED581', background: '#121212', white: '#1E1E1E',
  cardBorder: '#272727', grayText: '#B0B0B0', disabled: '#4CAF50', progressBarBg: '#333333',
  statusBar: 'light-content',
};

const translations = {
  en: {
    title: "What's Your Main Goal?",
    subtitle: "Select the goal you are aiming to achieve.",
    goalLabel: "Goal",
    loseWeight: "Lose Weight",
    maintainWeight: "Maintain Weight",
    gainWeight: "Gain Weight",
    targetWeightLabel: "Target Weight",
    unit: "kg",
    nextButton: "Next",
  },
  ar: {
    title: "ما هو هدفك الرئيسي؟",
    subtitle: "اختر الهدف الذي تسعى لتحقيقه.",
    goalLabel: "الهدف",
    loseWeight: "فقدان الوزن",
    maintainWeight: "الحفاظ على وزني",
    gainWeight: "زيادة الوزن",
    targetWeightLabel: "الوزن المستهدف",
    unit: "كجم",
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
  <Pressable
    style={({ pressed }) => [ styles.button(theme), disabled ? styles.buttonDisabled(theme) : styles.buttonEnabled(theme), pressed && !disabled && styles.buttonPressed ]}
    onPress={() => !disabled && (Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), onPress())}
    disabled={disabled}>
    <Text style={styles.buttonText(theme)}>{title}</Text>
  </Pressable>
);

const ScreenHeader = ({ title, subtitle, theme }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.title(theme)}>{title}</Text>
    <Text style={styles.subtitle(theme)}>{subtitle}</Text>
  </View>
);

const GoalCard = ({ title, iconName, isSelected, onPress, theme, isRTL }) => (
  <Pressable
    style={({ pressed }) => [ styles.goalCard(theme, isRTL), isSelected && styles.goalCardSelected(theme), pressed && styles.cardPressed ]}
    onPress={onPress}>
    <Icon name={iconName} size={28} color={isSelected ? (theme.background === '#121212' ? theme.background : theme.white) : theme.textAndIcons} />
    <Text style={[styles.goalCardText(theme, isRTL), isSelected && styles.goalCardTextSelected(theme, isRTL)]}>
      {title}
    </Text>
  </Pressable>
);

// ===================================================================
// --- 3. شاشة تحديد الهدف (GoalScreen) ---
// ===================================================================
const GoalScreen = ({ navigation, route }) => {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('ar');

  const theme = isDarkMode ? darkTheme : lightTheme;
  const isRTL = language === 'ar';
  const t = (key) => translations[language]?.[key] || translations['en'][key];

  useEffect(() => {
    const loadSettings = async () => {
      const darkMode = await AsyncStorage.getItem('isDarkMode');
      setIsDarkMode(darkMode === 'true');
      const lang = await AsyncStorage.getItem('appLanguage');
      if (lang) setLanguage(lang);
    };
    loadSettings();
  }, []);

  const handleGoalSelection = (goal) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(goal);
  };

  const handleNextPress = () => {
    const updatedUserData = {
      ...(route.params || {}),
      goal: selectedGoal,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
    };
    navigation.navigate('ActivityLevel', updatedUserData);
  };

  const isButtonDisabled = !selectedGoal || ((selectedGoal === 'lose' || selectedGoal === 'gain') && !targetWeight);

  return (
    <SafeAreaView style={styles.safeArea(theme)}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <View style={styles.container}>
        <ProgressBar step={3} totalSteps={4} theme={theme} />
        <ScreenHeader title={t('title')} subtitle={t('subtitle')} theme={theme} />
        <View style={styles.formContainer}>
          <Text style={styles.label(theme, isRTL)}>{t('goalLabel')}</Text>
          <GoalCard title={t('loseWeight')} iconName="arrow-down-thin-circle-outline" isSelected={selectedGoal === 'lose'} onPress={() => handleGoalSelection('lose')} theme={theme} isRTL={isRTL} />
          <GoalCard title={t('maintainWeight')} iconName="minus-circle-outline" isSelected={selectedGoal === 'maintain'} onPress={() => handleGoalSelection('maintain')} theme={theme} isRTL={isRTL} />
          <GoalCard title={t('gainWeight')} iconName="arrow-up-thin-circle-outline" isSelected={selectedGoal === 'gain'} onPress={() => handleGoalSelection('gain')} theme={theme} isRTL={isRTL} />

          {(selectedGoal === 'lose' || selectedGoal === 'gain') && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.label(theme, isRTL)}>{t('targetWeightLabel')}</Text>
              <View style={[styles.inputWrapper(theme, isRTL), isInputFocused && styles.inputWrapperFocused(theme)]}>
                <TextInput
                  style={styles.targetWeightInput(theme, isRTL)}
                  placeholder="75"
                  placeholderTextColor={theme.grayText}
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                />
                <Text style={styles.unitText(theme, isRTL)}>{t('unit')}</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.footer}>
          <PrimaryButton title={t('nextButton')} onPress={handleNextPress} disabled={isButtonDisabled} theme={theme} />
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
  container: { flex: 1, padding: 24 },
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
  buttonPressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.15 },
  buttonText: (theme) => ({ color: theme.background === '#121212' ? '#000' : '#FFF', fontSize: 18, fontWeight: 'bold' }),
  goalCard: (theme, isRTL) => ({ backgroundColor: theme.white, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 16, marginBottom: 15, borderWidth: 2, borderColor: theme.cardBorder, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 }),
  goalCardSelected: (theme) => ({ backgroundColor: theme.primary, borderColor: theme.primary, elevation: 6, shadowColor: theme.primary, shadowOpacity: 0.2 }),
  cardPressed: { transform: [{ scale: 0.99 }] },
  goalCardText: (theme, isRTL) => ({ fontSize: 18, fontWeight: 'bold', color: theme.textAndIcons, [isRTL ? 'marginRight' : 'marginLeft']: 15 }),
  goalCardTextSelected: (theme, isRTL) => ({ color: theme.background === '#121212' ? theme.background : theme.white }),
  inputWrapper: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: theme.white, borderRadius: 16, borderWidth: 2, borderColor: theme.cardBorder, paddingHorizontal: 15 }),
  inputWrapperFocused: (theme) => ({ borderColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  targetWeightInput: (theme, isRTL) => ({ flex: 1, paddingVertical: 18, fontSize: 18, color: theme.textAndIcons, textAlign: isRTL ? 'right' : 'left', fontWeight: '500' }),
  unitText: (theme, isRTL) => ({ fontSize: 16, color: theme.grayText, [isRTL ? 'marginLeft' : 'marginRight']: 8 }),
};

export default GoalScreen;