<?php

namespace App\Exports;

use App\Models\Diagnosis;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class DiagnosisExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Diagnosis::select('name')->get();
    }

    public function headings(): array
    {
        return [' Diagnosis Name'];
    }
}