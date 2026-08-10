<?php

namespace App\Imports;

use App\Models\MedicineMaster;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;
use Throwable;

class MedicineMasterImport implements ToModel, WithStartRow, WithValidation, SkipsOnFailure
{
    public function __construct()
    {
        MedicineMaster::truncate();
    }

    public function startRow(): int
    {
        return 2;
    }

    public function model(array $row)
    {
        if (empty($row[0]) || trim($row[0]) === '') {
            return null; // This skips the row
        }

        return new MedicineMaster([
            'name' => $row[0],
        ]);
    }

    public function rules(): array
    {
        return [
            '0' => 'required|string|max:255', 
        ];
    }

    public function onFailure(Failure ...$failures)
    {
        foreach ($failures as $failure) {
        }
    }
}