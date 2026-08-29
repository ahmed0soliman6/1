/*
 * إعدادات Firebase للمزامنة السحابية.
 * استبدل هذا الكائن بإعدادات مشروع Firebase الخاص بك.
 * عند ترك apiKey فارغاً أو 'YOUR_API_KEY'، تعمل Soli Medical بالبيانات المحلية فقط.
 *
 * لإعداد Firebase جديد:
 * 1. أنشئ مشروع Firebase على console.firebase.google.com
 * 2. فعّل Authentication → Anonymous sign-in
 * 3. أنشئ Firestore Database
 * 4. انسخ إعدادات Web App وضعها هنا
 */
window.SOLI_FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};
