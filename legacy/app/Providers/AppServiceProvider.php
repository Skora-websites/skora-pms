<?php

namespace App\Providers;

use App\Http\Responses\LoginResponse;
use Illuminate\Support\ServiceProvider;
use Illuminate\Pagination\Paginator;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Clinic Helper file automatically load karein
        require_once app_path('Helpers/ClinicHelper.php');
    }

    public function boot()
    {
        // Share current clinic data with all views
        view()->composer('*', function ($view) {
            if (auth()->check()) {
                $view->with('currentClinic', \App\Models\DoctorClinic::currentClinic());
                $view->with('myClinics', \App\Models\DoctorClinic::getMyClinics());
            } else {
                $view->with('currentClinic', null);
                $view->with('myClinics', collect());
            }
        });

        // Use Bootstrap 5 for pagination
        Paginator::useBootstrapFive();
    }
}