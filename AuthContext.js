import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

// إنشاء سياق المصادقة
const AuthContext = createContext();

// مزود سياق المصادقة
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // تحميل بيانات المستخدم من التخزين المحلي عند بدء التطبيق
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('userToken');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (e) {
        console.error('خطأ في تحميل بيانات المستخدم:', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadStoredData();
  }, []);

  // تسجيل مستخدم جديد
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.auth.register(userData);
      
      const { user, token } = response.data;
      
      // تخزين بيانات المستخدم والرمز
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('userToken', token);
      
      setUser(user);
      setToken(token);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء التسجيل');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء التسجيل' };
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الدخول
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.auth.login(credentials);
      
      const { user, token } = response.data;
      
      // تخزين بيانات المستخدم والرمز
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('userToken', token);
      
      setUser(user);
      setToken(token);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'بيانات الدخول غير صحيحة');
      return { success: false, error: error.response?.data?.message || 'بيانات الدخول غير صحيحة' };
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      setLoading(true);
      
      // محاولة تسجيل الخروج من الخادم
      await ApiService.auth.logout();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج من الخادم:', error);
    } finally {
      // حذف البيانات المحلية بغض النظر عن نجاح الاتصال بالخادم
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  };

  // تحديث بيانات المستخدم
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.auth.updateProfile(userData);
      
      const updatedUser = response.data.user;
      
      // تحديث بيانات المستخدم المخزنة
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء تحديث البيانات');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء تحديث البيانات' };
    } finally {
      setLoading(false);
    }
  };

  // تغيير كلمة المرور
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      
      await ApiService.auth.changePassword(passwordData);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور' };
    } finally {
      setLoading(false);
    }
  };

  // تحديث بيانات المستخدم من الخادم
  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      const response = await ApiService.auth.getProfile();
      
      const updatedUser = response.data.user;
      
      // تحديث بيانات المستخدم المخزنة
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
    } catch (error) {
      console.error('خطأ في تحديث بيانات المستخدم:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        refreshUserData,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// هوك مخصص لاستخدام سياق المصادقة
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('يجب استخدام useAuth داخل AuthProvider');
  }
  
  return context;
};

export default AuthContext;
