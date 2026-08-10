<?php

namespace App\Exports;

use App\Models\Examination;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ExaminationExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Examination::select('name')->get();
    }

    public function headings(): array
    {
        return ['Examination Name'];
    }
}