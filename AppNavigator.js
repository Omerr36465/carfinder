import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// سياقات
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CarsProvider } from '../context/CarsContext';

// شاشات
import EnhancedSplashScreen from '../screens/EnhancedSplashScreen';
import EnhancedLoginScreen from '../screens/EnhancedLoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EnhancedHomeScreen from '../screens/EnhancedHomeScreen';
import AddCarScreen from '../screens/AddCarScreen';
import CarDetailsScreen from '../screens/CarDetailsScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportScreen from '../screens/ReportScreen';
import MyReportsScreen from '../screens/MyReportsScreen';
import MyCarsScreen from '../screens/MyCarsScreen';
import EditCarScreen from '../screens/EditCarScreen';

// ألوان
import { colors } from '../assets/colors';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// مكون التنقل السفلي
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Add') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.lightGray,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={EnhancedHomeScreen} 
        options={{ 
          tabBarLabel: 'الرئيسية',
        }} 
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ 
          tabBarLabel: 'البحث',
        }} 
      />
      <Tab.Screen 
        name="Add" 
        component={AddCarScreen} 
        options={{ 
          tabBarLabel: 'إضافة',
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator} 
        options={{ 
          tabBarLabel: 'حسابي',
        }} 
      />
    </Tab.Navigator>
  );
};

// مكون تنقل الملف الشخصي
const ProfileStack = createStackNavigator();

const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          title: 'الملف الشخصي',
        }} 
      />
      <ProfileStack.Screen 
        name="MyCars" 
        component={MyCarsScreen} 
        options={{ 
          title: 'سياراتي المسجلة',
        }} 
      />
      <ProfileStack.Screen 
        name="MyReports" 
        component={MyReportsScreen} 
        options={{ 
          title: 'بلاغاتي',
        }} 
      />
      <ProfileStack.Screen 
        name="EditCar" 
        component={EditCarScreen} 
        options={{ 
          title: 'تعديل بيانات السيارة',
        }} 
      />
    </ProfileStack.Navigator>
  );
};

// مكون التنقل الرئيسي
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  // عرض شاشة البداية أثناء التحميل
  if (loading) {
    return <EnhancedSplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {isAuthenticated ? (
        // مسارات المستخدم المصادق
        <>
          <Stack.Screen 
            name="Main" 
            component={TabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="CarDetails" 
            component={CarDetailsScreen} 
            options={{ 
              title: 'تفاصيل السيارة',
            }} 
          />
          <Stack.Screen 
            name="Report" 
            component={ReportScreen} 
            options={{ 
              title: 'الإبلاغ عن مشاهدة',
            }} 
          />
        </>
      ) : (
        // مسارات المستخدم غير المصادق
        <>
          <Stack.Screen 
            name="Splash" 
            component={EnhancedSplashScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Login" 
            component={EnhancedLoginScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ 
              title: 'إنشاء حساب جديد',
            }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
};

// مكون التطبيق الرئيسي مع مزودي السياق
const AppWithProviders = () => {
  return (
    <NavigationContainer>
      <AuthProvider>
        <CarsProvider>
          <AppNavigator />
        </CarsProvider>
      </AuthProvider>
    </NavigationContainer>
  );
};

export default AppWithProviders;
