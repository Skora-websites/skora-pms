<?php

namespace App\Exports;

use App\Models\MedicineMaster;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class MedicineMasterExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return MedicineMaster::select('name')->get();
    }

    public function headings(): array
    {
        return ['Medicine Name']; 
    }
}