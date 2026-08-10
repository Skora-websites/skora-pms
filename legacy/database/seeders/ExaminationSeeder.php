<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Examination;

class ExaminationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $examinations = [

            // General Examination
            'Blood Pressure (BP)',
            'Pulse Rate',
            'Respiratory Rate',
            'Temperature',
            'Oxygen Saturation (SpO2)',
            'Height',
            'Weight',
            'BMI (Body Mass Index)',

            // Physical Examination
            'General Appearance',
            'Skin Examination',
            'Head & Neck Examination',
            'Eye Examination',
            'Ear Examination',
            'Nose Examination',
            'Throat Examination',

            // Cardiovascular
            'Heart Sounds',
            'ECG (Electrocardiogram)',
            '2D Echo',

            // Respiratory
            'Chest Examination',
            'Lung Auscultation',
            'Chest X-ray',

            // Abdomen
            'Abdominal Examination',
            'Liver Function Test',
            'Kidney Function Test',

            // Neurological
            'Reflex Test',
            'Motor Function Test',
            'Sensory Examination',
            'Coordination Test',

            // Orthopedic
            'Joint Examination',
            'Range of Motion Test',
            'Spine Examination',

            // Lab Related
            'Blood Test',
            'Urine Test',
            'Thyroid Profile',
            'Sugar Test (Fasting/PP)',
        ];

        foreach ($examinations as $name) {
            Examination::updateOrCreate(['name' => $name]);
        }
    }
}
