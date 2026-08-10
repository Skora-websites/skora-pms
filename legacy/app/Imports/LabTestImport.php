<?php

namespace App\Imports;

use App\Models\LabTest;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;

class LabTestImport implements ToModel, WithStartRow
{
    public function __construct()
    {
        LabTest::truncate();
    }

    public function startRow(): int
    {
        return 2; 
    }

    public function model(array $row)
    {
        return new LabTest([
            'name' => $row[0],
        ]);
    }
}
