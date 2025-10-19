// ملف: App.js (الكود النهائي بعد التعديل المطلوب)

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './supabaseclient';

// --- استيراد الشاشات ---
import SplashScreen from './Splash';
import IndexScreen from './Index';
import SignInScreen from './signin';
import SignUpScreen from './signup';
import ForgotPasswordScreen from './forgotpassword';
import EmailVerificationScreen from './emailverification';
import ResetPasswordScreen from './resetpassword';
import BasicInfoScreen from './basicinfo';
import MeasurementsScreen from './measurements';
import GoalScreen from './goal';
import ActivityLevelScreen from './activitylevel';
import ResultsScreen from './results';
import MainUI from './mainui';
import ProfileScreen from './profile'; // مهم يفضل موجود عشان تاب البروفايل
// ✅ --- الخطوة 1: استيراد الشاشات الفرعية هنا --- ✅
import EditProfileScreen from './editprofile';
import SettingsScreen from './setting';
import AboutScreen from './about';
// (ممكن تشيل ReportsScreen من هنا لو هي مجرد تاب في MainUI)

const Stack = createStackNavigator();

// Navigator لشاشات المصادقة (التسجيل والدخول)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Index" component={IndexScreen} />
    <Stack.Screen name="SignIn" component={SignInScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="BasicInfo" component={BasicInfoScreen} />
    <Stack.Screen name="Measurements" component={MeasurementsScreen} />
    <Stack.Screen name="Goal" component={GoalScreen} />
    <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
    <Stack.Screen name="Results" component={ResultsScreen} />
  </Stack.Navigator>
);

// Navigator لشاشات التطبيق الرئيسية بعد تسجيل الدخول
const MainAppStack = () => (
  // ✅ --- الخطوة 2: تعريف كل الشاشات هنا --- ✅
  <Stack.Navigator initialRouteName="MainUI" screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}>
    <Stack.Screen name="MainUI" component={MainUI} />
    {/* 
      الشاشات دي مبقتش جزء من تاب البروفايل، بقت شاشات رئيسية في التطبيق كله
      لما تتنقل ليها، الـ Bottom Tab Bar هيفضل ظاهر تحت
    */}
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
  </Stack.Navigator>
);

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));
        const [{ data }] = await Promise.all([sessionPromise, minTimePromise]);
        setSession(data.session);
      } catch (error) {
        console.error("Initialization error:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <NavigationContainer>
          {session && session.user ? <MainAppStack /> : <AuthStack />}
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;