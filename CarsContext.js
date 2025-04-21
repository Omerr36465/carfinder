import React, { createContext, useState, useContext } from 'react';
import ApiService from '../services/ApiService';
import { useAuth } from './AuthContext';

// إنشاء سياق السيارات
const CarsContext = createContext();

// مزود سياق السيارات
export const CarsProvider = ({ children }) => {
  const { token } = useAuth();
  const [cars, setCars] = useState([]);
  const [myCars, setMyCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentCar, setCurrentCar] = useState(null);
  const [reports, setReports] = useState([]);

  // الحصول على جميع السيارات
  const getAllCars = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.cars.getAll(params);
      setCars(response.data.cars);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب السيارات');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء جلب السيارات' };
    } finally {
      setLoading(false);
    }
  };

  // البحث عن السيارات
  const searchCars = async (query) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.cars.search(query);
      setCars(response.data.cars);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء البحث عن السيارات');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء البحث عن السيارات' };
    } finally {
      setLoading(false);
    }
  };

  // الحصول على سيارة محددة
  const getCarById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.cars.getById(id);
      setCurrentCar(response.data.car);
      
      return response.data.car;
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب بيانات السيارة');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // إضافة سيارة جديدة
  const addCar = async (carData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.cars.add(carData);
      
      // تحديث قائمة السيارات الخاصة بالمستخدم
      await getMyCars();
      
      return { success: true, car: response.data.car };
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إضافة السيارة');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء إضافة السيارة' };
    } finally {
      setLoading(false);
    }
  };

  // تحديث بيانات سيارة
  const updateCar = async (id, carData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.cars.update(id, carData);
      
      // تحديث السيارة الحالية إذا كانت هي نفسها
      if (currentCar && currentCar._id === id) {
        setCurrentCar(response.data.car);
      }
      
      // تحديث قائمة السيارات الخاصة بالمستخدم
      await getMyCars();
      
      return { success: true, car: response.data.car };
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء تحديث بيانات السيارة');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء تحديث بيانات السيارة' };
    } finally {
      setLoading(false);
    }
  };

  // حذف سيارة
  const deleteCar = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await ApiService.cars.delete(id);
      
      // تحديث قائمة السيارات الخاصة بالمستخدم
      await getMyCars();
      
      // إعادة تعيين السيارة الحالية إذا كانت هي نفسها
      if (currentCar && currentCar._id === id) {
        setCurrentCar(null);
      }
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء حذف السيارة');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء حذف السيارة' };
    } finally {
      setLoading(false);
    }
  };

  // الحصول على إحصائيات السيارات
  const getStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.cars.getStats();
      setStats(response.data);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب الإحصائيات');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // الحصول على السيارات الخاصة بالمستخدم
  const getMyCars = async () => {
    if (!token) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.cars.getMyCars();
      setMyCars(response.data.cars);
      
      return response.data.cars;
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب السيارات الخاصة بك');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // إضافة تقرير مشاهدة
  const addReport = async (reportData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.reports.add(reportData);
      
      // تحديث قائمة التقارير إذا كانت للسيارة الحالية
      if (currentCar && currentCar._id === reportData.carId) {
        await getReportsForCar(reportData.carId);
      }
      
      return { success: true, report: response.data.report };
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إضافة التقرير');
      return { success: false, error: error.response?.data?.message || 'حدث خطأ أثناء إضافة التقرير' };
    } finally {
      setLoading(false);
    }
  };

  // الحصول على تقارير سيارة محددة
  const getReportsForCar = async (carId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.reports.getForCar(carId);
      setReports(response.data.reports);
      
      return response.data.reports;
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب التقارير');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // الحصول على التقارير الخاصة بالمستخدم
  const getMyReports = async () => {
    if (!token) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.reports.getMyReports();
      
      return response.data.reports;
    } catch (error) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب التقارير الخاصة بك');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return (
    <CarsContext.Provider
      value={{
        cars,
        myCars,
        loading,
        error,
        stats,
        currentCar,
        reports,
        getAllCars,
        searchCars,
        getCarById,
        addCar,
        updateCar,
        deleteCar,
        getStats,
        getMyCars,
        addReport,
        getReportsForCar,
        getMyReports,
      }}
    >
      {children}
    </CarsContext.Provider>
  );
};

// هوك مخصص لاستخدام سياق السيارات
export const useCars = () => {
  const context = useContext(CarsContext);
  
  if (!context) {
    throw new Error('يجب استخدام useCars داخل CarsProvider');
  }
  
  return context;
};

export default CarsContext;
