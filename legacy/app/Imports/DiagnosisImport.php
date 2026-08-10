<?php

namespace App\Imports;

use App\Models\Diagnosis;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;

class DiagnosisImport implements ToModel, WithStartRow
{
    public function __construct()
    {
        Diagnosis::truncate();
    }

    public function startRow(): int
    {
        return 2; 
    }

    public function model(array $row)
    {
        return new Diagnosis([
            'name' => $row[0],
        ]);
    }
}
