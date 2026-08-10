<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// The MailConfigServiceProvider was overwriting .env with garbage database data. 
// We will update the DB with what's actually in .env.
$setting = \App\Models\Mail_setting::first();
if ($setting) {
    $setting->update([
        'mailer' => 'smtp',
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'rockykumar998877@gmail.com',
        'password' => 'pdwhtftfhglcnfcx',
        'encryption' => 'tls',
        'from_address' => 'rockykumar998877@gmail.com',
        'from_name' => env('APP_NAME'),
    ]);
    echo "Database Mail Settings fixed successfully.";
} else {
    echo "No mail settings row found.";
}
