<?php

namespace App\Providers;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\ServiceProvider;
use App\Models\Mail_setting;
use Illuminate\Support\Facades\Schema;


class MailConfigServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        if (class_exists(Mail_setting::class) && Schema::hasTable('mail_settings')) {
            $settings = Mail_setting::first();
            if ($settings) {
                Config::set('mail.mailers.smtp', [
                    'transport' => $settings->mailer ?? 'smtp',
                    'host'      => $settings->host ?? 'smtp.mailtrap.io',
                    'port'      => $settings->port ?? 587,
                    'username'  => $settings->username,
                    'password'  => $settings->password,
                    'encryption'=> $settings->encryption ?? 'tls',
                ]);
                Config::set('mail.from.address', $settings->from_address ?? 'default@example.com');
                Config::set('mail.from.name', $settings->from_name ?? 'Laravel');
            }
        }
    }


}
