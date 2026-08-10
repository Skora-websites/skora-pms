<?php

namespace App\Exports;

use App\Models\LabTest;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class LabTestExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return LabTest::select('name')->get();
    }

    public function headings(): array
    {
        return ['LabTest Name'];
    }
}