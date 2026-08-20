const CACHE_NAME = 'ibrahim-sadaqah-static-v2';
const DYNAMIC_CACHE = 'ibrahim-sadaqah-dynamic-v2';

// الملفات الأساسية التي يتم تحميلها فوراً لتشغيل الموقع بدون نت
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg'
];

// تثبيت التطبيق وحفظ الملفات الأساسية
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// تفعيل النسخة الجديدة وحذف القديمة إن وجدت
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
      );
    })
  );
});

// استراتيجية جلب البيانات: "ابحث في التخزين المؤقت أولاً، وإلا اجلب من الإنترنت واحفظه"
self.addEventListener('fetch', (e) => {
  // لا تقم بتخزين طلبات يوتيوب أو طلبات الإرسال POST
  if (e.request.method !== 'GET' || e.request.url.includes('youtube.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // إذا كان الملف موجوداً في الجهاز (بدون نت)، اعرضه، ثم قم بتحديثه في الخلفية إذا توفر النت
        fetch(e.request).then((networkResponse) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(e.request, networkResponse);
          });
        }).catch(() => {}); // تجاهل الخطأ إذا لم يكن هناك نت
        
        return cachedResponse;
      }

      // إذا لم يكن موجوداً، اطلبه من النت واحفظ نسخة منه للمرات القادمة (مثل سور القرآن)
      return fetch(e.request).then((networkResponse) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // يمكن هنا إضافة رسالة خطأ تظهر إذا انقطع النت ولم يكن الملف مخزناً
      });
    })
  );
});
