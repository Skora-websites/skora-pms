<?php

namespace Database\Seeders;

use App\Models\Symptom;
use Illuminate\Database\Seeder;

class SymptomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $symptoms = [
            // General
            'Fever', 'Cough', 'Fatigue', 'Body Ache', 'Headache', 'Chills', 'Sweating', 
            'Weakness', 'Lethargy', 'Weight Loss (Unexplained)', 'Night Sweats',

            // Respiratory
            'Shortness of breath', 'Sore throat', 'Runny nose', 'Congestion', 'Sneezing', 
            'Wheezing', 'Chest Tightness', 'Dry Cough', 'Productive Cough',

            // Digestive
            'Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Heartburn', 'Bloating', 
            'Constipation', 'Loss of appetite', 'Indigestion', 'Difficulty Swallowing',

            // Pain & Neurological
            'Chest pain', 'Back pain', 'Joint pain', 'Muscle weakness', 'Numbness', 
            'Tingling', 'Dizziness', 'Vertigo', 'Confusion', 'Fainting',

            // Skin & Allergy
            'Skin Rash', 'Itching', 'Skin Discoloration', 'Swelling (Edema)', 'Hives',

            // Sensory
            'Vision changes', 'Hearing loss', 'Ringing in ears (Tinnitus)', 'Loss of Taste', 
            'Loss of Smell',

            // Mental & Sleep
            'Anxiety', 'Depression', 'Insomnia', 'Drowsiness', 'Irritability', 
            'Memory Loss', 'Mood Swings',

            // Urinary
            'Painful Urination', 'Frequent Urination', 'Blood in Urine',

            // Other
            'Hair Loss', 'Brittle Nails', 'Cold Hands/Feet', 'Palpitations'
        ];

        foreach ($symptoms as $name) {
            Symptom::updateOrCreate(['name' => $name]);
        }
    }
}
