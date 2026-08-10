<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LabTest;

class LabTestSeeder extends Seeder
{
    public function run(): void
    {
        $labTests = [

            // Blood Tests
            'Complete Blood Count (CBC)',
            'Blood Sugar (Fasting)',
            'Blood Sugar (Postprandial)',
            'HbA1c',
            'Blood Group & Rh Typing',

            // Liver Function
            'Liver Function Test (LFT)',
            'SGPT (ALT)',
            'SGOT (AST)',
            'Bilirubin Total/Direct',

            // Kidney Function
            'Kidney Function Test (KFT)',
            'Serum Creatinine',
            'Blood Urea',
            'Uric Acid',

            // Lipid Profile
            'Lipid Profile',
            'Cholesterol Total',
            'HDL Cholesterol',
            'LDL Cholesterol',
            'Triglycerides',

            // Thyroid
            'Thyroid Profile (T3, T4, TSH)',
            'TSH (Thyroid Stimulating Hormone)',

            // Urine Tests
            'Urine Routine & Microscopy',
            'Urine Culture',

            // Infection Tests
            'Dengue Test',
            'Malaria Test',
            'Typhoid Test (Widal)',
            'HIV Test',
            'Hepatitis B (HBsAg)',
            'Hepatitis C (HCV)',

            // Cardiac
            'Troponin Test',
            'CK-MB',

            // Vitamin & Minerals
            'Vitamin D Test',
            'Vitamin B12 Test',
            'Calcium Test',
            'Iron Studies',

            // Hormonal
            'Testosterone',
            'Estrogen',
            'Progesterone',

            // Others
            'ESR (Erythrocyte Sedimentation Rate)',
            'CRP (C-Reactive Protein)',
            'D-Dimer',
        ];

        foreach ($labTests as $name) {
            LabTest::updateOrCreate(['name' => $name]);
        }
    }
}
