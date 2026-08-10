<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Diagnosis;

class DiagnosisSeeder extends Seeder
{
    public function run(): void
    {
        $diagnosisList = [

            // Infectious Diseases
            'Typhoid',
            'Malaria',
            'Dengue',
            'Tuberculosis',

            // Respiratory
            'Common Cold',
            'Asthma',
            'Pneumonia',

            // Lifestyle Diseases
            'Diabetes Mellitus',
            'Hypertension',
            'Obesity',

            // Digestive
            'Gastritis',
            'Acidity',
            'Food Poisoning',

            // Neurological
            'Migraine',
            'Epilepsy',

            // Skin
            'Fungal Infection',
            'Eczema',

            // Deficiency
            'Anemia',
            'Vitamin D Deficiency',
        ];

        foreach ($diagnosisList as $name) {
            Diagnosis::updateOrCreate(['name' => $name]);
        }
    }
}
