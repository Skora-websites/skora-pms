<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\MailSettingController;
use App\Http\Controllers\DoctordashboardController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\LogoutController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ConsulController;
use App\Http\Controllers\MasterController;
use App\Http\Controllers\DoctorSchedulingController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\HomevisitController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\PatientdashboardController;
use App\Http\Controllers\TestBookingController;
use App\Http\Controllers\ShopingController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\StaffPermissionController;
use App\Http\Controllers\FrontendController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\VendorUploadController;
use App\Http\Controllers\LandingPageController;




use App\Models\LandingSection;

Route::get('/', function () {
    $sections = LandingSection::with(['items' => function($query) {
        $query->where('is_active', true)->orderBy('order', 'asc');
    }])->where('is_active', true)->get()->keyBy('key');

    return view('front.index', compact('sections'));
});



Route::get('/about', function () { return view('front.about'); })->name('about');
Route::get('/contact', function () { return view('front.contact'); })->name('contact');
Route::get('/privacy-policy', function () { return view('front.privacy-policy'); })->name('privacy-policy');
Route::get('/terms-conditions', function () { return view('front.terms-conditions'); })->name('terms-conditions');
Route::get('/cancellation-policy', function () { return view('front.cancellation-policy'); })->name('cancellation-policy');
Route::get('/refund-policy', function () { return view('front.refund-policy'); })->name('refund-policy');
Route::post('/book-demo', [App\Http\Controllers\FrontendController::class, 'bookDemo'])->name('book.demo');
// Vendor Upload Routes
Route::get('/vendor/upload-test/{token}', [VendorUploadController::class, 'showUploadForm'])->name('vendor.upload.form');
Route::post('/vendor/upload-test/{token}', [VendorUploadController::class, 'uploadFile'])->name('vendor.upload.submit');

Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'authenticate']);

Route::match(['get', 'post'], 'logout', [LogoutController::class, 'logout'])->name('doctor.logout');

// Route::get('/signups', [RegistrationController::class, 'showRegistrationForm'])->name('register.show');
// Route::post('/signup', [RegistrationController::class, 'register'])->name('register.submit');
// Route::post('/send-otp', [RegistrationController::class, 'sendOtp'])->name('otp.send')
//     ->middleware('throttle:3,1'); // Limit OTP sends to 3 per minute
// // OTP verification endpoint
// Route::post('/verify-otp', [RegistrationController::class, 'verifyOtp'])->name('otp.verify')
//     ->middleware('throttle:5,1'); // Limit verification attempts to 5 per minute

Route::get('/signup', [RegistrationController::class, 'showRegistrationForm'])->name('register.show');
Route::post('/signup', [RegistrationController::class, 'register'])->name('register.submit');

Route::get('/my-consent', [AppointmentController::class, 'myConsent'])->name('my-consent');

Route::get('/my-consent/{slug}', [FrontendController::class, 'showConsultConsent'])
     ->name('my.consult.consent');

Route::post('/my-consent/{slug}/submit', [FrontendController::class, 'submitConsultConsent'])
     ->name('submit.consult.consent');
 
 // Support Assistant (Chat Boat) AJAX Routes for any authenticated user
 Route::middleware(['auth:sanctum', 'verified'])->group(function () {
     Route::get('/assistant/support/ticket', [SupportController::class, 'getOrCreateTicket'])->name('assistant.support.ticket');
     Route::post('/assistant/support/sendMessage', [SupportController::class, 'sendMessage'])->name('assistant.support.sendMessage');
     Route::get('/assistant/support/{id}/messages', [SupportController::class, 'getSupportMessages'])->name('assistant.support.messages');
 });



Route::post('/check-consent-before-booking', [AppointmentController::class, 'checkConsentBeforeBooking'])
     ->name('doctor.check-consent-before-booking');



// auth:sanctum', 'verified ----- iska matlab hai ki user ka email verified hoga and sanctum se login kia hua hoga

Route::middleware(['auth:sanctum', 'verified', 'checkrole:super_admin'])
    ->group(function () {
        Route::get('/super-admin-dashboard', [SuperAdminController::class, 'index'])->name('super-admin.dashboard');
        Route::get('/dashboard-settings', [SuperAdminController::class, 'setings'])->name('super-admin.dashboard-settings');
        Route::get('/faqs', [SuperAdminController::class, 'faqs'])->name('super-admin.faqs');
     
        Route::get('/email-setup', [MailSettingController::class, 'mailsetup'])->name('super-admin.email-setup');
        Route::get('/mail-settings', [MailSettingController::class, 'edit'])->name('mail.settings.edit');
        Route::post('/mail-settings', [MailSettingController::class, 'update'])->name('mail.settings.update');
        Route::get('/super-admin/settings/company/data', [CompanySettingController::class, 'fetch'])->name('company.settings.fetch');
        Route::post('/super-admin/settings/company', [CompanySettingController::class, 'save'])->name('company.settings.save');
        Route::get('/patient-registration', [SuperAdminController::class, 'testingsd'])->name('super-admin.patient-registration');

        // ====================== MANAGE DOCTORS ======================
        Route::get('/manage-doctors', [SuperAdminController::class, 'manageDoctors'])->name('super-admin.manage-doctors');
        Route::get('/super-admin/doctors/data', [SuperAdminController::class, 'getDoctors'])->name('super-admin.doctors.data');
        Route::get('/super-admin/doctor/{id}/permissions', [SuperAdminController::class, 'getDoctorPermissions'])->name('super-admin.doctor.permissions');
        Route::post('/super-admin/doctor/permissions/sync', [SuperAdminController::class, 'syncDoctorPermissions'])->name('super-admin.doctor.permissions.sync');
        
        // ====================== MANAGE CLINICS ======================
        Route::get('/manage-clinics', [SuperAdminController::class, 'manageClinics'])->name('super-admin.manage-clinics');
    Route::get('/super-admin/manage-clinics/data', [SuperAdminController::class, 'getClinics'])->name('super-admin.clinics.data');
    Route::post('/super-admin/manage-clinics/store', [SuperAdminController::class, 'storeClinic'])->name('super-admin.clinic.store');
    Route::get('/super-admin/manage-clinics/{id}/details', [SuperAdminController::class, 'getClinicDetails'])->name('super-admin.clinic.details');
    Route::post('/super-admin/manage-clinics/update', [SuperAdminController::class, 'updateClinic'])->name('super-admin.clinic.update');
    Route::delete('/super-admin/manage-clinics/{id}/delete', [SuperAdminController::class, 'deleteClinic'])->name('super-admin.clinic.delete');

        // ====================== MANAGE ALL USERS ======================
        Route::get('/manage-users', [SuperAdminController::class, 'manageUsers'])->name('super-admin.manage-users');
        Route::get('/super-admin/users/data', [SuperAdminController::class, 'getUsers'])->name('super-admin.users.data');
        Route::post('/super-admin/user/store', [SuperAdminController::class, 'storeUser'])->name('super-admin.user.store');
        Route::get('/super-admin/user/{id}/details', [SuperAdminController::class, 'getUserDetails'])->name('super-admin.user.details');
        Route::post('/super-admin/user/update', [SuperAdminController::class, 'updateUser'])->name('super-admin.user.update');

        // ====================== TOGGLE USER STATUS (ACTIVATE/DEACTIVATE) ======================
        Route::post('/super-admin/user/toggle-status', [SuperAdminController::class, 'toggleUserStatus'])->name('super-admin.user.toggle-status');


    //  Doctor Consult created Master   
    Route::get('/Consult-masters', [MasterController::class, 'index'])->name('super-admin.Consult-master');
    Route::get('admin/symptoms', [MasterController::class, 'getSymptoms']);
    Route::post('admin/symptoms/store', [MasterController::class, 'storeSymptom']);
    Route::get('admin/symptoms/{id}/edit', [MasterController::class, 'editSymptom']);
    Route::put('admin/symptoms/{id}', [MasterController::class, 'updateSymptom']);
    Route::delete('admin/symptoms/{id}', [MasterController::class, 'destroySymptom']);
    Route::get('admin/symptoms/export', [MasterController::class, 'exportSymptoms']);
    Route::post('admin/symptoms/import', [MasterController::class, 'importSymptoms']);

    // Examinations routes
    Route::get('admin/examinations', [MasterController::class, 'getExaminations']);
    Route::post('admin/examinations/store', [MasterController::class, 'storeExamination']);
    Route::get('admin/examinations/{id}/edit', [MasterController::class, 'editExamination']);
    Route::put('admin/examinations/{id}', [MasterController::class, 'updateExamination']);
    Route::delete('admin/examinations/{id}', [MasterController::class, 'destroyExamination']);
    Route::get('admin/examinations/export', [MasterController::class, 'exportExaminations']);
    Route::post('admin/examinations/import', [MasterController::class, 'importExaminations']);

    // Diagnoses routes
    Route::get('admin/diagnoses', [MasterController::class, 'getDiagnoses']);
    Route::post('admin/diagnoses/store', [MasterController::class, 'storeDiagnosis']);
    Route::get('admin/diagnoses/{id}/edit', [MasterController::class, 'editDiagnosis']);
    Route::put('admin/diagnoses/{id}', [MasterController::class, 'updateDiagnosis']);
    Route::delete('admin/diagnoses/{id}', [MasterController::class, 'destroyDiagnosis']);
    Route::get('admin/diagnoses/export', [MasterController::class, 'exportDiagnoses']);
    Route::post('admin/diagnoses/import', [MasterController::class, 'importDiagnoses']);
    // Lab Tests routes
    Route::get('admin/lab_tests', [MasterController::class, 'getLabTests']);
    Route::post('admin/lab_tests/store', [MasterController::class, 'storeLabTest']);
    Route::get('admin/lab_tests/{id}/edit', [MasterController::class, 'editLabTest']);
    Route::put('admin/lab_tests/{id}', [MasterController::class, 'updateLabTest']);
    Route::delete('admin/lab_tests/{id}', [MasterController::class, 'destroyLabTest']);
    Route::get('admin/lab_tests/export', [MasterController::class, 'exportLabTests']);
    Route::post('admin/lab_tests/import', [MasterController::class, 'importLabTests']);


    Route::get('/categories', [CategoryController::class, 'index'])->name('super-admin.blog-category');
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::get('/categories/{id}/edit', [CategoryController::class, 'edit'])->name('categories.edit');
    Route::patch('/categories/{id}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->name('categories.destroy');
    
    // start Blogs
    Route::get('/super-admin-blogs', [BlogController::class, 'index'])->name('super-admin.blogs');
    Route::post('/super-admin-blogs', [BlogController::class, 'store'])->name('blogs.store');
    Route::get('/edit/{blogs_id}',[BlogController::class,'editBlog'])->name('super-admin.Blog-edit');
    Route::put('/super-admin/blogs/{id}', [BlogController::class, 'update'])->name('super-admin.blogs.update');
    Route::delete('super-admin/blogs/{id}', [BlogController::class, 'destroy'])->name('super-admin.blogs.destroy');

    // Medicine routes
    Route::get('admin/medicines', [MasterController::class, 'getMedicines']);
    Route::post('admin/medicines/store', [MasterController::class, 'storeMedicine']);
    Route::get('admin/medicines/{id}/edit', [MasterController::class, 'editMedicine']);
    Route::put('admin/medicines/{id}', [MasterController::class, 'updateMedicine']);
    Route::delete('admin/medicines/{id}', [MasterController::class, 'destroyMedicine']);
    Route::post('admin/medicines/import', [MasterController::class, 'importMedicines']);

    // Admin Support & Videos Routes
    Route::get('/super-admin/supports', [SupportController::class, 'index'])->name('super-admin.supports.index');
    Route::get('/super-admin/supports/{id}', [SupportController::class, 'show'])->name('super-admin.supports.show');
    Route::post('/super-admin/supports/{id}/reply', [SupportController::class, 'reply'])->name('super-admin.supports.reply');
    Route::post('/super-admin/supports/{id}/close', [SupportController::class, 'closeTicket'])->name('super-admin.supports.close');
    Route::get('/super-admin/supports/{id}/messages', [SupportController::class, 'getSupportMessages'])->name('super-admin.supports.messages');
    
    Route::get('/super-admin/support-videos', [SupportController::class, 'videos'])->name('super-admin.supports.videos');
    Route::post('/super-admin/support-videos', [SupportController::class, 'storeVideo'])->name('super-admin.supports.store-video');
    Route::delete('/super-admin/support-videos/{id}', [SupportController::class, 'destroyVideo'])->name('super-admin.supports.destroy-video');

    // ====================== LANDING PAGE MANAGEMENT ======================
    Route::get('/super-admin/landing-page', [LandingPageController::class, 'index'])->name('super-admin.landing-page');
    Route::post('/super-admin/landing-page/section/{key}', [LandingPageController::class, 'updateSection'])->name('super-admin.landing-page.section.update');
    Route::post('/super-admin/landing-page/item/store/{section_key}', [LandingPageController::class, 'storeItem'])->name('super-admin.landing-page.item.store');
    Route::post('/super-admin/landing-page/item/update/{id}', [LandingPageController::class, 'updateItem'])->name('super-admin.landing-page.item.update');
    Route::delete('/super-admin/landing-page/item/delete/{id}', [LandingPageController::class, 'destroyItem'])->name('super-admin.landing-page.item.delete');

    });




    Route::middleware(['auth:sanctum', 'verified', 'checkrole:doctor'])
    ->group(function () {

        Route::get('/trial-expired', [DoctordashboardController::class, 'trialExpired'])->name('doctor.trial-expired');

        Route::get('/profile', function () {   return view('doctor.doctor-profile');  })->name('doctor.profile');
        Route::post('/update-profile/{id}', [DoctordashboardController::class, 'updateProfile'])->name('update.profile');
   

          // Route::get('/consult-pdf', function () {   return view('doctor.doctor-consult-pdf');  })->name('doctor.consult-pdf');
          // Route::post('/update-consult-pdf/{id}', [DoctordashboardController::class, 'updateConsultPdf'])->name('update.consult-pdf');
    
      // Replace your old routes with these
        Route::middleware(['rolepermission:dashboard'])->group(function () {
            Route::get('/doctor-dashboard', [DoctordashboardController::class, 'index'])->name('doctor.dashboard');
            Route::get('/consult-pdf', [DoctordashboardController::class, 'consultPdf'])->name('doctor.consult-pdf');
            Route::post('/update-consult-pdf/{id}', [DoctordashboardController::class, 'updateConsultPdf'])->name('update.consult-pdf');
        });
        Route::middleware(['rolepermission:registrations'])->group(function () {
            Route::get('/patient-registrations', [DoctordashboardController::class, 'register_patient'])->name('doctor.patient-registration');
            // AJAX Routes for CRUD
            Route::post('/patients', [DoctordashboardController::class, 'store'])->name('patients.store');
            Route::get('/show-patients/{id}', [DoctordashboardController::class, 'show'])->name('patients.show');
            Route::put('/update-patients/{id}', [DoctordashboardController::class, 'update'])->name('patients.update');
            Route::get('/export-users', [DoctordashboardController::class, 'exportUsers'])->name('export.users');
            Route::get('/doctor-filter-patients', [DoctordashboardController::class, 'filter_patients'])->name('doctor.filter_patients');
            Route::get('/patient-details/{id}', [RegistrationController::class, 'allpatientDetailshow'])->name('doctor.patient-details');
            Route::get('/doctors-patient-details/{id}', [RegistrationController::class, 'allpatientDetailshow'])->name('doctor.patient-details.alias');
            Route::get('/patient-details-sidebar/{id}', [RegistrationController::class, 'allpatientDetailshow'])->name('doctor.patient-details.sidebar');
        });
        Route::middleware(['rolepermission:shop'])->group(function () {
             Route::get('/shoping', [ShopingController::class, 'index'])->name('doctors.shoping');
        });
        Route::middleware(['rolepermission:chat'])->group(function () {
            Route::get('/chat-index', [ChatController::class, 'index'])->name('doctor.chat');
            Route::get('/chat/new-messages', [ChatController::class, 'getNewMessages']);
            Route::post('/chat/send', [ChatController::class, 'send']);
            Route::post('/chat/reply/{message}', [ChatController::class, 'reply']);
            Route::post('/chat/favorite/{message}', [ChatController::class, 'favorite']);
            Route::delete('/chat/delete/{message}', [ChatController::class, 'delete']);
            Route::get('/chat/search', [ChatController::class, 'search']);
            Route::post('/chat/mute', [ChatController::class, 'mute']);
            Route::post('/chat/clear', [ChatController::class, 'clear']);
            Route::delete('/chat/delete', [ChatController::class, 'deleteChat']);
            Route::put('/chat/update/{message}', [ChatController::class, 'update']);
        });

        Route::middleware(['rolepermission:appointments'])->group(function () {
            Route::get('show-detail-appointment/{id}', [DoctordashboardController::class, 'showAppointment'])->name('doctor.appointment.show');
            Route::get('/doctors-appointments', [AppointmentController::class, 'showappointment'])->name('doctors.appointment');
            Route::get('/book-appointments', [AppointmentController::class, 'bookappointment'])->name('book-appointment')->middleware('can:appointments-create');
            Route::get('/doctor/book-appointment', [AppointmentController::class, 'bookappointment'])->name('doctor.bookappointment')->middleware('can:appointments-create');
            Route::get('/doctor/appointments/booked-times', [AppointmentController::class, 'getBookedTimes'])->name('doctor.appointments.booked_times');
            Route::get('/doctor/appointments/search-patients', [AppointmentController::class, 'searchPatients'])->name('doctor.appointments.search-patients');

            Route::post('/doctor/appointments', [AppointmentController::class, 'store'])->name('doctor.appointments.store')->middleware('can:appointments-create');
            Route::get('/edit-book-appointments', [AppointmentController::class, 'editappointment'])->name('edit-book-appointment');
            Route::get('/booked-times', [AppointmentController::class, 'bookedTimes'])->name('doctors.appointment.booked_times');
            Route::post('/update-book-appointment', [AppointmentController::class, 'updateappointment'])->name('update-book-appointment');
            Route::get('/consent/form/{appointment_id}', [AppointmentController::class, 'showConsentForm'])->name('consent.form');
            Route::post('/doctor/appointment/cancel', [AppointmentController::class, 'cancelAppointment'])->name('doctor.appointment.cancel');
            Route::post('/doctor/appointment/delete', [AppointmentController::class, 'deleteAppointment'])->name('doctor.appointment.delete');
            Route::post('/doctor/appointment/complete', [AppointmentController::class, 'completeAppointment'])->name('doctor.appointment.complete');
            Route::post('/doctor/appointment/update-status', [AppointmentController::class, 'updateStatus'])->name('doctor.appointment.update_status');
            Route::post('/doctor/appointment/upload-prescription', [AppointmentController::class, 'uploadConsultationPrescription'])->name('doctor.appointment.upload_prescription');
            Route::get('/doctor-filter-patients-appointments', [AppointmentController::class, 'filter_patients_appointments'])->name('doctor.filter_patients_appointments');
            Route::get('/doctor-appointment/{id}', [AppointmentController::class, 'show_appointment'])->name('doctor.appointment.show');
            
            // Appointment related bottom routes
            Route::get('/appointment', [DoctordashboardController::class, 'appointment'])->name('appointment');
            Route::post('/send-whatsapp', [AppointmentController::class, 'sendWhatsapp'])->name('doctor.send-whatsapp');
            Route::post('/generate-consent-link', [AppointmentController::class, 'generateConsentLink'])->name('doctor.generate-consent-link');
            Route::post('/check-consent-status', [AppointmentController::class, 'checkConsentStatus'])->name('doctor.check-consent-status');
            Route::get('/appointment-setting', [DoctordashboardController::class, 'appointmentSetting'])->name('appointment-setting');
            Route::get('/cancellation-reason', [DoctordashboardController::class, 'cancellationReason'])->name('cancellation-reason');

            // Consultation Routes
            Route::get('/doctor-consultation/{appointment_id}', [ConsulController::class, 'showconsultation'])->name('doctors.consultation');
            Route::get('/doctor-upload-consultation-prescription/{appointment_id}', [ConsulController::class, 'showconsultation_pdf_upload'])->name('doctors.consultation-pdf-upload');
            Route::post('/consultations/store', [ConsultationController::class, 'store'])->name('consultations.store');
            Route::get('/consultations/{id}/pdf', [ConsultationController::class, 'generatePdf'])->name('consultations.pdf');
            Route::get('/medicines/search', [ConsulController::class, 'searchMedicines'])->name('medicines.search');
            Route::post('/consultation/save', [ConsulController::class, 'saveConsultation'])->name('consultation.save');
            Route::get('/doctor/appointment/{appointment_id}/consultation-details', [ConsulController::class, 'getConsultationDetails'])->name('doctor.appointment.consultation-details');
        });

        // ── Income & Expense — Unified Transaction Routes ──────────────────────
        Route::middleware(['rolepermission:income-expense'])->group(function () {
            Route::get('/income-expence', [TransactionController::class, 'index'])->name('doctor.income-expence');
            Route::get('/transactions/data', [TransactionController::class, 'getTransactionData'])->name('transactions.data');
            Route::get('/transactions/totals', [TransactionController::class, 'getTotals'])->name('transactions.totals');
            Route::get('/transaction-categories', [TransactionController::class, 'getCategories'])->name('transaction-categories.get');
            Route::post('/transaction-categories', [TransactionController::class, 'storeCategory'])->name('transaction-categories.store');
            Route::post('/transactions/export-selected', [TransactionController::class, 'exportSelected'])->name('transactions.export-selected');
            Route::get('/transactions/export-all', [TransactionController::class, 'exportAll'])->name('transactions.export-all');
            Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
            Route::get('/transactions/{id}', [TransactionController::class, 'show'])->name('transactions.show');
            Route::put('/transactions/{id}', [TransactionController::class, 'update'])->name('transactions.update');
            Route::delete('/transactions/{id}', [TransactionController::class, 'destroy'])->name('transactions.destroy');
            Route::patch('/transactions/{id}/status', [TransactionController::class, 'updateStatus'])->name('transactions.status');
            
            // Bottom expense route
            Route::get('/expense', [DoctordashboardController::class, 'expense'])->name('expense');
        });


    
    // Follow Up Routes
        Route::middleware(['rolepermission:follow-up'])->group(function () {
            Route::get('/follow-ups', [ConsultationController::class, 'followUps'])->name('doctor.follow-ups');
            Route::post('/follow-ups/{id}/status', [ConsultationController::class, 'updateFollowUpStatus'])->name('doctor.follow-ups.status-update');
        });


    


    // ====================== DOCTOR STAFF PERMISSIONS ======================
        Route::middleware(['rolepermission:roles-permissions'])->group(function () {
            Route::get('/staff-permissions', [StaffPermissionController::class, 'index'])->name('staff-permissions.index');
            Route::get('/doctor/staff/receptionists', [StaffPermissionController::class, 'getReceptionists'])->name('staff.receptionists');
            Route::get('/staff/receptionist/{user}/permissions', [StaffPermissionController::class, 'getPermissions'])->name('staff.receptionist.permissions');
            Route::post('/staff/receptionist/{user}/permissions', [StaffPermissionController::class, 'savePermissions'])->name('staff.receptionist.save-permissions');
            Route::get('/roles-permission', [RoleController::class, 'index'])->name('roles-permission');
            Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create');
            Route::get('/roles/{id}/edit', [RoleController::class, 'edit'])->name('roles.edit');
            Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
            Route::get('/roles/{id}', [RoleController::class, 'show'])->name('roles.show');
            Route::put('/roles/{id}', [RoleController::class, 'update'])->name('roles.update');
            Route::delete('/roles/{id}', [RoleController::class, 'destroy'])->name('roles.destroy');
            Route::get('/permissions/all', [RoleController::class, 'allPermissions'])->name('permissions.all');
            Route::get('/my-staff', [StaffController::class, 'index'])->name('my-staff.index');
            Route::post('/my-staff', [StaffController::class, 'store'])->name('my-staff.store');
            Route::put('/my-staff/{id}', [StaffController::class, 'update'])->name('my-staff.update');
            Route::delete('/my-staff/{id}', [StaffController::class, 'destroy'])->name('my-staff.destroy');
            Route::get('/my-staff/attendance/data', [StaffController::class, 'getAttendanceData'])->name('my-staff.attendance.data');
            Route::post('/my-staff/attendance/save', [StaffController::class, 'saveAttendance'])->name('my-staff.attendance.save');
            Route::get('/my-staff/attendance/report', [StaffController::class, 'getAttendanceReport'])->name('my-staff.attendance.report');
        });



});



 Route::middleware(['auth:sanctum', 'verified', 'checkrole:doctor'])
    ->group(function () {
        Route::middleware(['rolepermission:dashboard'])->group(function () {
            Route::get('/appointment', [DoctordashboardController::class, 'appointment'])->name('appointment');
            Route::get('/prescription', [DoctordashboardController::class, 'prescription'])->name('prescription');
            Route::get('/faq', [DoctordashboardController::class, 'faq'])->name('faq');
            Route::get('/chat-page', [DoctordashboardController::class, 'chat'])->name('chat');
            Route::get('/video-call', [DoctordashboardController::class, 'videoCall'])->name('video-call');
            Route::get('/shop', [DoctordashboardController::class, 'shop'])->name('shop');
            Route::get('/setting', [DoctordashboardController::class, 'setting'])->name('setting');
            Route::get('/profile-settings', [DoctordashboardController::class, 'profileSettings'])->name('profile-settings');
            Route::get('/change-password', [DoctordashboardController::class, 'changePassword'])->name('change-password');
            Route::get('/notifications', [DoctordashboardController::class, 'notifications'])->name('notifications');
        });
    

        Route::middleware(['rolepermission:schedule'])->group(function () {
            Route::get('/schedule', [DoctorSchedulingController::class, 'index'])->name('doctor.doctor-schedule');
            Route::post('/schedule', [DoctorSchedulingController::class, 'storeSchedule'])->name('doctor.schedule.store');
            Route::get('/schedule/{id}', [DoctorSchedulingController::class, 'show'])->name('doctor.schedule.show');
            Route::get('/schedule/{id}/edit', [DoctorSchedulingController::class, 'getSchedule'])->name('doctor.schedule.get');
            Route::put('/schedule/{id}', [DoctorSchedulingController::class, 'updateSchedule'])->name('doctor.schedule.update');
            Route::delete('/schedule/{id}', [DoctorSchedulingController::class, 'destroySchedule'])->name('doctor.schedule.destroy');
            Route::post('/schedule/clinic', [DoctorSchedulingController::class, 'storeClinic'])->name('doctor.clinic.store');
            Route::delete('/clinic/{id}', [DoctorSchedulingController::class, 'destroyClinic'])->name('doctor.clinic.destroy');
            Route::get('/clinic/{id}', [DoctorSchedulingController::class, 'getClinic'])->name('doctor.clinic.get');
            Route::put('/clinic/{id}', [DoctorSchedulingController::class, 'updateClinic'])->name('doctor.clinic.update');
            Route::get('/working-hours', [DoctordashboardController::class, 'workingHours'])->name('working-hours');
        });
    

        Route::middleware(['rolepermission:home-visit'])->group(function () {
            Route::get('/home-visit', [HomevisitController::class,'ShowHomevisit'])->name('doctor-home-visit');
            Route::get('/home-visit-patient-details/{id}', [HomevisitController::class,'patientDetailshowing'])->name('doctor.patient-details');
            Route::get('/home-visit/create', [HomevisitController::class, 'create'])->name('home-visit.create');
            Route::get('/home-visit/create/{patient_id}', [HomevisitController::class, 'createWithPatient'])->name('home-visit.create.with-patient');
            
            // Sidebar home-visit route
            Route::get('/home-visit-sidebar', [DoctordashboardController::class, 'homeVisit'])->name('home-visit');
        });



  




    // ------------------------
    // main Test Booking  CRUD Routes
    // ------------------------
    
        Route::middleware(['rolepermission:test-booking'])->group(function () {
            Route::get('/test-booking', [TestBookingController::class,'Showtestbooking'])->name('doctor-test-booking');
            Route::get('/show-test-bookings/{id}', [TestBookingController::class, 'show'])->name('doctor.show-test-bookings');
            Route::get('/test-bookings/filter', [TestBookingController::class, 'filterTestBookings'])->name('doctor.test-bookings.filter');
            Route::delete('/test-bookings/delete', [TestBookingController::class, 'deleteTestBooking'])->name('doctor.test-bookings.delete');
            Route::get('/add-test-booking', [TestBookingController::class, 'Addtestbooking'])->name('doctor-add-test-booking');
            Route::post('test-bookings', [TestBookingController::class, 'store'])->name('doctor.test-bookings.store');
            Route::get('test-bookings', [TestBookingController::class, 'index'])->name('doctor.test-bookings.index');
            Route::get('test-bookings/{id}/edit', [TestBookingController::class, 'edit'])->name('doctor.test-bookings.edit');
            Route::put('test-bookings/{id}', [TestBookingController::class, 'update'])->name('doctor.test-bookings.update');
            Route::delete('test-bookings/{id}', [TestBookingController::class, 'destroy'])->name('doctor.test-bookings.destroy');
            Route::get('/search-user', [TestBookingController::class, 'searchUser'])->name('search-user');
            Route::get('/get-user-details', [TestBookingController::class, 'getUserDetails'])->name('get-user-details');
            Route::get('/get-mobile-suggestions', [TestBookingController::class, 'getMobileSuggestions'])->name('get.mobile.suggestions');
            Route::get('/get-registration-suggestions', [TestBookingController::class, 'getRegistrationSuggestions'])->name('get.registration.suggestions');
            Route::get('/get-patient-details', [TestBookingController::class, 'getPatientDetails'])->name('get.patient.details');
            Route::get('/doctor/vendors', [TestBookingController::class, 'getVendors'])->name('doctor.vendors');
            Route::post('/doctor/vendors', [TestBookingController::class, 'addVendor'])->name('doctor.vendors.add');
            Route::put('/doctor/vendors/{id}', [TestBookingController::class, 'updateVendor'])->name('doctor.vendors.update');
            Route::delete('/doctor/vendors/{id}', [TestBookingController::class, 'deleteVendor'])->name('doctor.vendors.delete');
            Route::get('/doctor/tests', [TestBookingController::class, 'getTests'])->name('doctor.tests');
            Route::post('/doctor/tests', [TestBookingController::class, 'addTest'])->name('doctor.tests.add');
            Route::put('/doctor/tests/{id}', [TestBookingController::class, 'updateTest'])->name('doctor.tests.update');
            Route::delete('/doctor/tests/{id}', [TestBookingController::class, 'deleteTest'])->name('doctor.tests.delete');
            Route::post('/doctor/test-bookings/update-status', [TestBookingController::class, 'updateStatus'])->name('doctor.test-bookings.update-status');
        });
    
    
 

    
   
        Route::middleware(['rolepermission:billing'])->group(function () {
            Route::get('/doctor-billing', [BillingController::class, 'index'])->name('doctor-billing');
            Route::post('/billing-types', [BillingController::class, 'storeBillingType'])->name('billing-types.store');
            Route::get('/billing-types', [BillingController::class, 'getBillingTypes'])->name('billing-types.get');
            Route::post('/billings', [BillingController::class, 'storeBilling'])->name('billings.store');
            Route::get('/billings-data', [BillingController::class, 'getBillings'])->name('billings.get');
            Route::get('/billings/{id}', [BillingController::class, 'show'])->name('billings.show');
            Route::put('/billings/{id}', [BillingController::class, 'update'])->name('billings.update');
            Route::delete('/billings/{id}', [BillingController::class, 'destroy'])->name('billings.destroy');
            Route::post('/consultation-billings', [BillingController::class, 'storeBillingConsultpage'])->name('billingsConsultpage.store');
            Route::get('/billings/{id}/print-pdf', [BillingController::class, 'printPDF'])->name('billings.print-pdf');
        });
    


        Route::middleware(['rolepermission:support'])->group(function () {
            Route::get('/support', [DoctordashboardController::class, 'doctorsupport'])->name('doctor.supports');
            Route::get('/support/{id}', [DoctordashboardController::class, 'showSupportTicket'])->name('doctor.supports.show');
            Route::post('/support', [DoctordashboardController::class, 'storeSupportTicket'])->name('doctor.supports.store');
            Route::post('/support/{id}/reply', [DoctordashboardController::class, 'replySupportTicket'])->name('doctor.supports.reply');
            Route::get('/support/{id}/messages', [DoctordashboardController::class, 'getSupportMessages'])->name('doctor.supports.messages');
            
            // Sidebar support route
            Route::get('/support-sidebar', [DoctordashboardController::class, 'support'])->name('support');
        });


});


  Route::middleware(['auth:sanctum', 'verified', 'checkrole:patient'])
    ->group(function () {
        Route::get('/patient-dashboard', [PatientdashboardController::class, 'index'])->name('patient.dashboard');
       
    });