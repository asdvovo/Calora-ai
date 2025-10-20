// profile.js (الكود الكامل بعد التعديل)

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
// ✅ --- التعديل (1): استيراد useFocusEffect بدلاً من useIsFocused --- ✅
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- الترجمات والثيمات (تبقى كما هي داخل الملف) ---
const translations = {
  en: { newUser: 'New User', editProfile: 'Edit Profile', settings: 'Settings', about: 'About', logout: 'Logout', logoutErrorTitle: 'Error', logoutErrorMessage: 'An error occurred while logging out.' },
  ar: { newUser: 'مستخدم جديد', editProfile: 'تعديل الملف الشخصي', settings: 'الإعدادات', about: 'حول التطبيق', logout: 'تسجيل الخروج', logoutErrorTitle: 'خطأ', logoutErrorMessage: 'حدث خطأ أثناء تسجيل الخروج.' },
};
const lightTheme = { background: '#F5FBF5', surface: '#FFFFFF', primaryText: '#1C1C1E', secondaryText: '#8A8A8E', separator: '#E5E5EA', logout: '#FF3B30', statusBar: 'dark-content', borderColor: '#FFFFFF' };
const darkTheme = { background: '#121212', surface: '#1E1E1E', primaryText: '#FFFFFF', secondaryText: '#A5A5A5', separator: '#38383A', logout: '#EF5350', statusBar: 'light-content', borderColor: '#1E1E1E' };

const SettingsItem = ({ icon, name, onPress, color, theme, isRTL }) => (
    <TouchableOpacity style={styles.settingsItem(theme)} onPress={onPress}>
      <View style={[styles.settingsItemContent, { flexDirection: 'row' }]}>
        {icon}
        <Text style={[styles.settingsItemText(theme), { color: color || theme.primaryText, flex: 1, textAlign: isRTL ? 'right' : 'left', marginHorizontal: 15 }]}>{name}</Text>
      </View>
      <Icon name={isRTL ? "chevron-left" : "chevron-right"} size={22} color="#C7C7CC" />
    </TouchableOpacity>
);

const ProfileScreen = () => {
  const [userData, setUserData] = useState({ firstName: '', lastName: '', profileImage: null });
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('en'); // القيمة الأولية سيتم تحديثها فوراً

  // يتم تحديد الثيم والاتجاه بناءً على الحالة الحالية
  const theme = isDarkMode ? darkTheme : lightTheme;
  const isRTL = language === 'ar';
  const t = (key) => translations[language]?.[key] || translations['en'][key];

  // دالة موحدة لتحميل كل بيانات الشاشة (بيانات المستخدم، الثيم، اللغة)
  const loadScreenData = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('userProfile');
      if (userJson) setUserData(JSON.parse(userJson));

      const themeValue = await AsyncStorage.getItem('isDarkMode');
      setIsDarkMode(themeValue === 'true');
      
      const langValue = await AsyncStorage.getItem('appLanguage');
      if (langValue) {
        setLanguage(langValue);
      }
    } catch (e) {
      console.error("Failed to load data.", e);
    }
  }, []);

  // ✅ --- التعديل (2): استخدام useFocusEffect لتشغيل الكود عند التركيز على الشاشة --- ✅
  useFocusEffect(
    useCallback(() => {
      // سيتم استدعاء هذه الدالة في كل مرة يتم فيها فتح شاشة الملف الشخصي
      loadScreenData();

      // يمكن إرجاع دالة للتنظيف إذا لزم الأمر، ولكنها غير ضرورية هنا
      return () => {};
    }, [loadScreenData]) // الاعتمادية هنا هي الدالة نفسها
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadScreenData();
    setRefreshing(false);
  }, [loadScreenData]);
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userProfile');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      Alert.alert(t('logoutErrorTitle'), t('logoutErrorMessage'));
    }
  };

  return (
    <SafeAreaView style={styles.container(theme)}>
      <StatusBar barStyle={theme.statusBar} />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
            <Image
                source={require('./assets/profilebackground.png')}
                style={styles.headerImage}
                resizeMode="cover"
            />
        </View>

        <View style={styles.profileContainer}>
          <Image
            source={userData.profileImage ? { uri: userData.profileImage } : require('./assets/profile.png')} 
            style={styles.profileImage(theme)}
          />
          <Text style={styles.profileName(theme)}>
            {userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : t('newUser')}
          </Text>
        </View>
        <View style={styles.menuContainer}>
          <View style={styles.menuSection(theme)}>
            <SettingsItem icon={<Icon name="user" size={22} color={theme.secondaryText} />} name={t('editProfile')} onPress={() => navigation.navigate('EditProfile')} theme={theme} isRTL={isRTL}/>
            <View style={styles.separator(theme)} />
            <SettingsItem icon={<Ionicons name="settings-outline" size={22} color={theme.secondaryText} />} name={t('settings')} onPress={() => navigation.navigate('Settings')} theme={theme} isRTL={isRTL} />
          </View>
          <View style={styles.menuSection(theme)}>
            <SettingsItem icon={<Icon name="info" size={22} color={theme.secondaryText} />} name={t('about')} onPress={() => navigation.navigate('About')} theme={theme} isRTL={isRTL} />
            <View style={styles.separator(theme)} />
            <SettingsItem icon={<Ionicons name="log-out-outline" size={24} color={theme.logout} />} name={t('logout')} onPress={handleLogout} color={theme.logout} theme={theme} isRTL={isRTL} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: (theme) => ({ flex: 1, backgroundColor: theme.background }),
  header: { height: 200, overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, },
  headerImage: { width: '100%', height: '150%', position: 'absolute', top: -50, },
  profileContainer: { alignItems: 'center', marginTop: -70 },
  profileImage: (theme) => ({ width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: theme.borderColor || theme.surface, backgroundColor: '#E0E0E0' }),
  profileName: (theme) => ({ fontSize: 22, fontWeight: 'bold', color: theme.primaryText, marginTop: 12 }),
  menuContainer: { paddingHorizontal: 20, marginTop: 40 },
  menuSection: (theme) => ({ backgroundColor: theme.surface, borderRadius: 12, marginBottom: 20, overflow: 'hidden' }),
  settingsItem: (theme) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15 }),
  settingsItemContent: { alignItems: 'center', flex: 1 },
  settingsItemText: (theme) => ({ fontSize: 17, color: theme.primaryText }),
  separator: (theme) => ({ height: StyleSheet.hairlineWidth, backgroundColor: theme.separator, marginLeft: 54 }),
};

export default ProfileScreen;