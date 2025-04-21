// تحديث روابط التحميل وإضافة معلومات الخادم الخلفي
document.addEventListener('DOMContentLoaded', function() {
    // إضافة مستمع حدث للنموذج
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // الحصول على قيم النموذج
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // إرسال البيانات إلى الخادم الخلفي (محاكاة)
            console.log('تم إرسال الرسالة:');
            console.log('الاسم:', name);
            console.log('البريد الإلكتروني:', email);
            console.log('الرسالة:', message);
            
            // عرض رسالة نجاح
            alert('تم إرسال رسالتك بنجاح! سنتواصل معك قريبًا.');
            
            // إعادة تعيين النموذج
            contactForm.reset();
        });
    }
    
    // إضافة مستمع حدث لشريط التنقل المتجاوب
    const navToggle = document.createElement('div');
    navToggle.className = 'nav-toggle';
    navToggle.innerHTML = '<span></span><span></span><span></span>';
    
    const headerContainer = document.querySelector('.header-container');
    if (headerContainer) {
        headerContainer.appendChild(navToggle);
        
        navToggle.addEventListener('click', function() {
            const nav = document.querySelector('header nav');
            nav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // إضافة تأثيرات التمرير
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // تحديث معلومات الإصدار
    const versionInfo = {
        version: '1.0.0',
        releaseDate: '2025-04-19',
        changelog: [
            'إطلاق النسخة الأولى من التطبيق',
            'دعم تسجيل السيارات المسروقة',
            'دعم البحث عن السيارات المسروقة',
            'دعم الإبلاغ عن مشاهدة السيارات المسروقة',
            'واجهة مستخدم بتصميم سوداني مميز'
        ]
    };
    
    // إضافة مستمع حدث لعرض سجل التغييرات
    const versionInfoElements = document.querySelectorAll('.version-info');
    versionInfoElements.forEach(element => {
        element.style.cursor = 'pointer';
        element.addEventListener('click', function() {
            showChangelog(versionInfo);
        });
    });
    
    // عرض سجل التغييرات
    function showChangelog(versionInfo) {
        // إنشاء عنصر النافذة المنبثقة
        const modal = document.createElement('div');
        modal.className = 'download-modal';
        
        // إنشاء محتوى النافذة المنبثقة
        modal.innerHTML = `
            <div class="download-modal-content">
                <span class="close-modal">&times;</span>
                <h3>سجل التغييرات - الإصدار ${versionInfo.version}</h3>
                <p>تاريخ الإصدار: ${versionInfo.releaseDate}</p>
                
                <div class="changelog">
                    <h4>التغييرات:</h4>
                    <ul>
                        ${versionInfo.changelog.map(item => `<li>${item}</li>`).join('')}
                    </ul>
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
    }
    
    console.log('تم تنفيذ وظائف الموقع بنجاح');
});
