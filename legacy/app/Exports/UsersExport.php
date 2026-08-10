<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Illuminate\Support\Facades\Auth;


class UsersExport implements FromCollection, WithHeadings
{
public function collection()
{
    $userId = Auth::id();
    $patientIds = User::where('reference_role_id', $userId)->pluck('id');

    return User::query()
        ->select('id', 'name', 'email', 'phone', 'gender', 'dob')
        ->whereIn('id', $patientIds)
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->getRawOriginal('email'),
                'phone' => $user->phone,
                'gender' => $user->gender,
                'dob' => $user->dob,
            ];
        });
}



    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Email',
            'Phone',
            'Gender'
        ];
    }
}
