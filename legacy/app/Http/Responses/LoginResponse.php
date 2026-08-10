<?php

// namespace App\Http\Responses;

// use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
// use Symfony\Component\HttpFoundation\Response;

// class LoginResponse implements LoginResponseContract
// {
//     public function toResponse($request): Response
//     {
//         $role = $request->user()->role;
        
//         return match($role) {
//             'student' => redirect()->intended('/student/dashboard'),
//             'teacher' => redirect()->intended('/teacher/dashboard'),
//             'admin' => redirect()->intended('/admin/dashboard'),
//             'super_admin' => redirect()->intended('/super-admin/dashboard'),
//             default => redirect('/dashboard'),
//         };
//     }
// }