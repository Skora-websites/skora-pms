<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create roles & permissions first
        $this->call(RolePermissionSeeder::class);

        // 2. Create default users (Admin & Doctor)
        $this->call(UserSeeder::class);

        // 3. Seed master data
        $this->call(SymptomSeeder::class);
        $this->call(ExaminationSeeder::class);
        $this->call(DiagnosisSeeder::class);
        $this->call(LabTestSeeder::class);
        $this->call(MedicineSeeder::class);

        // 4. Seed landing page data
        $this->call(LandingPageSeeder::class);
    }
}
