<?php

namespace App\Imports;

use App\Models\Examination;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;

class ExaminationImport implements ToModel, WithStartRow
{
    public function __construct()
    {
        Examination::truncate(); // pura table delete ho jayega
    }

    // Agar excel me header hai to start row set karo
    public function startRow(): int
    {
        return 2; // 1st row header ho to 2 se start karo
    }

    public function model(array $row)
    {
        return new Examination([
            'name' => $row[0],
        ]);
    }
}
