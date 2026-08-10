<?php

use App\Models\DoctorClinic;

if (!function_exists('current_clinic')) {
    function current_clinic()
    {
        return DoctorClinic::currentClinic();
    }
}

if (!function_exists('set_current_clinic')) {
    function set_current_clinic($clinicId)
    {
        return DoctorClinic::setCurrentClinic($clinicId);
    }
}

if (!function_exists('my_clinics')) {
    function my_clinics()
    {
        return DoctorClinic::getMyClinics();
    }
}

if (!function_exists('switch_clinic')) {
    function switch_clinic($clinicId)
    {
        return DoctorClinic::switchClinic($clinicId);
    }
}

if (!function_exists('has_clinic')) {
    function has_clinic()
    {
        return DoctorClinic::getMyClinics()->count() > 0;
    }
}