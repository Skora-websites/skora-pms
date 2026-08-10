<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use App\Models\Appointment;
use App\Models\Consultation;

$u = User::where('phone', '7766886760')->first();
if (!$u) {
    echo "User not found\n";
    exit;
}

echo "Patient: {$u->name} (ID: {$u->id})\n";

echo "\nAppointments:\n";
$appts = Appointment::where('patient_id', $u->id)->get(['id', 'date', 'status']);
foreach ($appts as $a) {
    echo "ID: {$a->id}, Date: {$a->date}, Status: {$a->status}\n";
}

echo "\nConsultations:\n";
$cons = Consultation::where('patient_id', $u->id)->get(['id', 'appointment_id', 'consultation_date']);
foreach ($cons as $c) {
    echo "ID: {$c->id}, ApptID: {$c->appointment_id}, Date: {$c->consultation_date}\n";
}
