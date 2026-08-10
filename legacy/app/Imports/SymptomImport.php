<?php

namespace App\Imports;

use App\Models\Symptom;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;

class SymptomImport implements ToModel, WithStartRow
{
    public function __construct()
    {
        Symptom::truncate(); 
    }
    public function startRow(): int
    {
        return 2;
    }

    public function model(array $row)
    {
        return new Symptom([
            'name' => $row[0],
        ]);
    }
}
