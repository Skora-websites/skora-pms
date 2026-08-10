<?php

namespace App\Exports;

use App\Models\Symptom;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SymptomExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Symptom::select('name')->get();
    }

    public function headings(): array
    {
        return ['Symptom Name'];
    }
}