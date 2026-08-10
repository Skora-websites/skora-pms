<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
$user = User::where('role', 'super_admin')->first();
if (!$user) {
    $user = User::where('role', 'admin')->first();
}
if (!$user) {
    $user = User::first();
}

if ($user) {
    auth()->login($user);
    echo "Logged in as: " . $user->email . "\n";
}

view()->share('errors', new \Illuminate\Support\ViewErrorBag);

try {
    $html = view('super-admin.dashboard', [
        'totalDoctors' => 1,
        'activeDoctors' => 1,
        'totalPatients' => 1,
        'totalStaff' => 1,
        'totalPrescriptions' => 1,
        'totalAppointments' => 1,
        'homeVisits' => 1,
        'testBookings' => 1,
        'videoConsultations' => 1,
        'textConsultations' => 1,
        'scheduledCount' => 1,
        'inProgressCount' => 1,
        'completedCount' => 1,
        'cancelledCount' => 1,
        'scheduledPercent' => 50,
        'inProgressPercent' => 20,
        'completedPercent' => 20,
        'cancelledPercent' => 10,
        'newPatientsCount' => 1,
        'appointmentsTodayCount' => 1,
        'completedConsultationsCount' => 1,
        'activePatientsCount' => 1,
        'satisfactionRate' => 95,
        'monthlyAppointmentsData' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        'monthlyCompletedData' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        'cancellationData' => [1, 1, 1, 1, 1],
        'newAppointments' => collect(),
        'upcomingAppointments' => collect(),
        'completedAppointments' => collect(),
        'doctorsList' => collect()
    ])->render();
    echo "Blade view compiled successfully!\n";
} catch (\Exception $e) {
    echo "Blade Compilation Error: " . $e->getMessage() . "\n";
}
