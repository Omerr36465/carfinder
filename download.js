// تحديث روابط التحميل وإضافة معلومات الخادم الخلفي
document.addEventListener('DOMContentLoaded', function() {
    // تكوين روابط التحميل المختلفة
    const downloadLinks = {
        standard: 'downloads/SudanStolenCarsApp.apk',
        samsung: 'downloads/samsung_compatible/SudanStolenCarsApp_Samsung.apk',
        fullSize: 'downloads/full_size/SudanStolenCarsApp_FullSize.apk',
        apiUrl: 'https://sudan-stolen-cars-api.onrender.com/api'
    };
    
    // معلومات الإصدارات
    const versionInfo = {
        standard: {
            version: '1.0.0',
            size: '11 ميجابايت',
            date: '2025-04-19',
            minSdk: 21
        },
        samsung: {
            version: '1.0.0',
            size: '12 ميجابايت',
            date: '2025-04-19',
            minSdk: 21
        },
        fullSize: {
            version: '1.0.0',
            size: '15 ميجابايت',
            date: '2025-04-19',
            minSdk: 21
        }
    };
    
    // تحديث روابط التحميل في الصفحة
    const standardDownloadBtn = document.querySelector('.download-card:nth-child(1) .download-btn');
    if (standardDownloadBtn) {
        standardDownloadBtn.href = downloadLinks.standard;
        
        // تحديث معلومات الإصدار
        const versionInfoElement = document.querySelector('.download-card:nth-child(1) .version-info');
        if (versionInfoElement) {
            versionInfoElement.textContent = `الإصدار: ${versionInfo.standard.version} | الحجم: ${versionInfo.standard.size}`;
        }
    }
    
    // إضافة مستمع حدث لزر خيارات التحميل المتقدمة
    const advancedDownloadBtn = document.getElementById('advanced-download-btn');
    if (advancedDownloadBtn) {
        advancedDownloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAdvancedDownloadOptions();
        });
    }
    
    // عرض خيارات التحميل المتقدمة
    function showAdvancedDownloadOptions() {
        // إنشاء عنصر النافذة المنبثقة
        const modal = document.createElement('div');
        modal.className = 'download-modal';
        
        // إنشاء محتوى النافذة المنبثقة
        modal.innerHTML = `
            <div class="download-modal-content">
                <span class="close-modal">&times;</span>
                <h3>خيارات التحميل المتقدمة</h3>
                
                <div class="download-options-advanced">
                    <div class="download-option">
                        <h4>النسخة القياسية</h4>
                        <p>مناسبة لمعظم أجهزة أندرويد</p>
                        <p class="version-info">الإصدار: ${versionInfo.standard.version} | الحجم: ${versionInfo.standard.size}</p>
                        <a href="${downloadLinks.standard}" class="download-btn primary-btn" data-version="standard">تحميل</a>
                    </div>
                    
                    <div class="download-option">
                        <h4>نسخة سامسونج</h4>
                        <p>محسنة لأجهزة سامسونج</p>
                        <p class="version-info">الإصدار: ${versionInfo.samsung.version} | الحجم: ${versionInfo.samsung.size}</p>
                        <a href="${downloadLinks.samsung}" class="download-btn primary-btn" data-version="samsung">تحميل</a>
                    </div>
                    
                    <div class="download-option">
                        <h4>النسخة الكاملة</h4>
                        <p>تتضمن جميع الموارد عالية الدقة</p>
                        <p class="version-info">الإصدار: ${versionInfo.fullSize.version} | الحجم: ${versionInfo.fullSize.size}</p>
                        <a href="${downloadLinks.fullSize}" class="download-btn primary-btn" data-version="fullSize">تحميل</a>
                    </div>
                </div>
                
                <div class="api-info">
                    <h4>معلومات الخادم الخلفي (للمطورين)</h4>
                    <p>رابط API: <a href="${downloadLinks.apiUrl}" target="_blank">${downloadLinks.apiUrl}</a></p>
                    <p>يمكن للمطورين استخدام واجهة برمجة التطبيقات للوصول إلى بيانات السيارات المسروقة وإنشاء تطبيقات مخصصة.</p>
                    <p>للحصول على وثائق API كاملة، يرجى زيارة <a href="${downloadLinks.apiUrl}/docs" target="_blank">${downloadLinks.apiUrl}/docs</a></p>
                </div>
                
                <div class="device-compatibility">
                    <h4>توافق الأجهزة</h4>
                    <p>يتطلب التطبيق نظام أندرويد 5.0 (Lollipop) أو أحدث</p>
                    <p>للحصول على أفضل أداء، نوصي بنظام أندرويد 8.0 أو أحدث</p>
                </div>
            </div>
        `;
        
        // إضافة النافذة المنبثقة إلى الصفحة
        document.body.appendChild(modal);
        
        // إضافة مستمع حدث لزر الإغلاق
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // إضافة مستمع حدث للنقر خارج النافذة المنبثقة
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // إضافة مستمعات أحداث لأزرار التحميل
        const downloadButtons = modal.querySelectorAll('.download-btn');
        downloadButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // تتبع إحصائيات التحميل
                trackDownload(button.getAttribute('data-version'));
            });
        });
    }
    
    // تتبع إحصائيات التحميل
    function trackDownload(version) {
        // في بيئة حقيقية، سيتم إرسال بيانات التتبع إلى الخادم
        console.log(`تم تسجيل تحميل جديد للتطبيق (الإصدار: ${version})`);
        
        // تحديث عداد التحميلات المحلي
        let downloads = localStorage.getItem('appDownloads') || 0;
        downloads = parseInt(downloads) + 1;
        localStorage.setItem('appDownloads', downloads);
        
        // عرض رسالة للمستخدم
        alert('جاري تحميل التطبيق... سيبدأ التحميل تلقائياً خلال ثوانٍ.');
    }
    
    // إضافة معلومات الخادم الخلفي إلى الصفحة
    function addBackendInfo() {
        // إنشاء قسم معلومات المطورين
        const developerSection = document.createElement('section');
        developerSection.id = 'developers';
        developerSection.className = 'developers';
        
        developerSection.innerHTML = `
            <div class="section-container">
                <h2 class="section-title">للمطورين</h2>
                <div class="developer-info">
                    <div class="api-info-card">
                        <h3>واجهة برمجة التطبيقات (API)</h3>
                        <p>يمكن للمطورين الوصول إلى بيانات السيارات المسروقة من خلال واجهة برمجة التطبيقات الخاصة بنا.</p>
                        <p>رابط API: <a href="${downloadLinks.apiUrl}" target="_blank">${downloadLinks.apiUrl}</a></p>
                        <p>للحصول على وثائق API كاملة، يرجى زيارة <a href="${downloadLinks.apiUrl}/docs" target="_blank">${downloadLinks.apiUrl}/docs</a></p>
                        <a href="${downloadLinks.apiUrl}" target="_blank" class="secondary-btn">استكشاف API</a>
                    </div>
                    <div class="github-info-card">
                        <h3>مشروع مفتوح المصدر</h3>
                        <p>تطبيق سيارتي هو مشروع مفتوح المصدر يهدف إلى مساعدة المجتمع السوداني.</p>
                        <p>يمكنك المساهمة في تطوير التطبيق من خلال GitHub.</p>
                        <a href="https://github.com/sudanstolencarapp/mobile-app" target="_blank" class="secondary-btn">GitHub</a>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة القسم قبل قسم الاتصال
        const contactSection = document.getElementById('contact');
        contactSection.parentNode.insertBefore(developerSection, contactSection);
        
        // إضافة رابط في القائمة
        const navList = document.querySelector('header nav ul');
        const newNavItem = document.createElement('li');
        newNavItem.innerHTML = '<a href="#developers">للمطورين</a>';
        
        // إضافة العنصر قبل "اتصل بنا"
        const contactNavItem = Array.from(navList.children).find(item => item.textContent.includes('اتصل بنا'));
        navList.insertBefore(newNavItem, contactNavItem);
    }
    
    // إضافة معلومات الخادم الخلفي
    addBackendInfo();
    
    // إعداد وظيفة تحميل التطبيق
    setupDownloadFunctionality();
    
    console.log('تم تحديث روابط التحميل ومعلومات الخادم الخلفي بنجاح');
});

// تنفيذ وظيفة تحميل التطبيق
function setupDownloadFunctionality() {
    // إضافة مستمع حدث لزر التحميل الرئيسي
    const mainDownloadBtn = document.querySelector('.download-card:nth-child(1) .download-btn');
    if (mainDownloadBtn) {
        mainDownloadBtn.addEventListener('click', function(e) {
            // تتبع إحصائيات التحميل
            trackDownload('standard');
        });
    }
    
    // تتبع إحصائيات التحميل
    function trackDownload(version) {
        // في بيئة حقيقية، سيتم إرسال بيانات التتبع إلى الخادم
        console.log(`تم تسجيل تحميل جديد للتطبيق (الإصدار: ${version})`);
        
        // تحديث عداد التحميلات المحلي
        let downloads = localStorage.getItem('appDownloads') || 0;
        downloads = parseInt(downloads) + 1;
        localStorage.setItem('appDownloads', downloads);
    }
}
