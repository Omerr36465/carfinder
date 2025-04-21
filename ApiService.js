import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// تكوين الإعدادات الافتراضية
const API_URL = 'https://sudan-stolen-cars-api.onrender.com/api';

// إنشاء مثيل axios مع الإعدادات الافتراضية
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة معترض للطلبات لإضافة رمز المصادقة
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إضافة معترض للاستجابات للتعامل مع أخطاء المصادقة
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // إذا كان الخطأ 401 (غير مصرح) وليس محاولة إعادة
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // محاولة تحديث الرمز
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/users/refresh-token`, {
            refreshToken,
          });
          
          if (response.data.token) {
            await AsyncStorage.setItem('userToken', response.data.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.log('فشل تحديث الرمز:', refreshError);
        // تسجيل الخروج عند فشل تحديث الرمز
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
      }
    }
    
    return Promise.reject(error);
  }
);

// تصدير دوال API
export default {
  // دوال المصادقة
  auth: {
    register: (userData) => api.post('/users/register', userData),
    login: (credentials) => api.post('/users/login', credentials),
    logout: () => api.post('/users/logout'),
    getProfile: () => api.get('/users/me'),
    updateProfile: (userData) => api.put('/users/update', userData),
    changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  },
  
  // دوال السيارات
  cars: {
    getAll: (params) => api.get('/cars', { params }),
    search: (query) => api.get(`/cars/search?query=${query}`),
    getById: (id) => api.get(`/cars/${id}`),
    add: (carData) => {
      const formData = new FormData();
      
      // إضافة بيانات السيارة
      Object.keys(carData).forEach(key => {
        if (key !== 'images') {
          formData.append(key, carData[key]);
        }
      });
      
      // إضافة الصور
      if (carData.images && carData.images.length > 0) {
        carData.images.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: 'image/jpeg',
            name: `car_image_${index}.jpg`,
          });
        });
      }
      
      return api.post('/cars', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    update: (id, carData) => {
      const formData = new FormData();
      
      // إضافة بيانات السيارة
      Object.keys(carData).forEach(key => {
        if (key !== 'images') {
          formData.append(key, carData[key]);
        }
      });
      
      // إضافة الصور الجديدة
      if (carData.newImages && carData.newImages.length > 0) {
        carData.newImages.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: 'image/jpeg',
            name: `car_image_${index}.jpg`,
          });
        });
      }
      
      return api.put(`/cars/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    delete: (id) => api.delete(`/cars/${id}`),
    getStats: () => api.get('/cars/stats/summary'),
    getMyCars: () => api.get('/cars/user/my-cars'),
  },
  
  // دوال التقارير
  reports: {
    add: (reportData) => {
      const formData = new FormData();
      
      // إضافة بيانات التقرير
      Object.keys(reportData).forEach(key => {
        if (key !== 'images') {
          formData.append(key, reportData[key]);
        }
      });
      
      // إضافة الصور
      if (reportData.images && reportData.images.length > 0) {
        reportData.images.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: 'image/jpeg',
            name: `report_image_${index}.jpg`,
          });
        });
      }
      
      return api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    getForCar: (carId) => api.get(`/reports/car/${carId}`),
    getById: (id) => api.get(`/reports/${id}`),
    getMyReports: () => api.get('/reports/user/my-reports'),
  },
  
  // دوال الإدارة
  admin: {
    login: (credentials) => api.post('/admin/login', credentials),
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: (params) => api.get('/admin/users', { params }),
    updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
    toggleUserStatus: (userId, isActive) => api.put(`/admin/users/${userId}/status`, { isActive }),
    verifyCar: (carId, isVerified) => api.put(`/admin/cars/${carId}/verify`, { isVerified }),
    updateCarStatus: (carId, status) => api.put(`/admin/cars/${carId}/status`, { status }),
    updateReportStatus: (reportId, status, notes) => api.put(`/reports/${reportId}/status`, { status, notes }),
    createAdmin: (adminData) => api.post('/admin/create-admin', adminData),
  },
};
