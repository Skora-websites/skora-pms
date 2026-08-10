<?php

namespace App\Http\Controllers;
use PragmaRX\Google2FAQRCode\Google2FA;

abstract class Controller
{
//     public function generate2FA()
// {
//     $google2fa = new Google2FA();

//     $companyName = "FacultyFinder"; // apna project/app ka naam
//     $userEmail = "ashish@example.com"; // user ka email/unique identity

//     $secretKey = $google2fa->generateSecretKey();

//     // Issuer set karna ho to URL generate karte waqt pass karna hota hai
//     $qrCodeUrl = $google2fa->getQRCodeUrl(
//         $companyName,   // Issuer (App name dikhega Authenticator app me)
//         $userEmail,     // User identifier
//         $secretKey
//     );

//     return view('auth.2fa', compact('secretKey', 'qrCodeUrl'));
// }


    public function register_patient(){

        
        return view('doctor.patient-registration');

    }

}
