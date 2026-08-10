<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Symptom;
use App\Models\Examination;
use App\Models\Diagnosis;
use App\Models\LabTest;
use App\Models\MedicineMaster;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SymptomExport;
use App\Exports\ExaminationExport;
use App\Exports\DiagnosisExport;
use App\Exports\LabTestExport;
use App\Exports\MedicineMasterExport; // New
use App\Imports\SymptomImport;
use App\Imports\ExaminationImport;
use App\Imports\DiagnosisImport;
use App\Imports\LabTestImport;
use App\Imports\MedicineMasterImport; // New

class MasterController extends Controller
{
    // Show the main page with all data
    public function index()
    {
        $symptoms = Symptom::all();
        $examinations = Examination::all();
        $diagnoses = Diagnosis::all();
        $lab_tests = LabTest::all();
        $medicines = MedicineMaster::all(); // New
        return view('super-admin.Consult-master', compact('symptoms', 'examinations', 'diagnoses', 'lab_tests', 'medicines'));
    }

    // Symptoms methods
    public function getSymptoms(){
        $symptoms = Symptom::paginate(50);
        return response()->json($symptoms);
    }

    public function storeSymptom(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        Symptom::create($validated);
        return response()->json(['message' => 'Symptom added successfully']);
    }

    public function editSymptom($id)
    {
        return response()->json(Symptom::findOrFail($id));
    }

    public function updateSymptom(Request $request, $id)
    {
        $item = Symptom::findOrFail($id);
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $item->update($validated);
        return response()->json(['message' => 'Symptom updated successfully']);
    }

    public function destroySymptom($id)
    {
        Symptom::findOrFail($id)->delete();
        return response()->json(['message' => 'Symptom deleted successfully']);
    }

    public function exportSymptoms()
    {
        return Excel::download(new SymptomExport, 'symptoms.xlsx');
    }

    public function importSymptoms(Request $request)
    {
        Excel::import(new SymptomImport, $request->file('file'));
        return back()->with('success', 'Symptoms imported successfully');
    }

    // Examinations methods
    public function getExaminations()
    {
        $examinations = Examination::paginate(50);
        return response()->json($examinations);
    }

    public function storeExamination(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        Examination::create($validated);
        return response()->json(['message' => 'Examination added successfully']);
    }

    public function editExamination($id)
    {
        return response()->json(Examination::findOrFail($id));
    }

    public function updateExamination(Request $request, $id)
    {
        $item = Examination::findOrFail($id);
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $item->update($validated);
        return response()->json(['message' => 'Examination updated successfully']);
    }

    public function destroyExamination($id)
    {
        Examination::findOrFail($id)->delete();
        return response()->json(['message' => 'Examination deleted successfully']);
    }

    public function exportExaminations()
    {
        return Excel::download(new ExaminationExport, 'examinations.xlsx');
    }

    public function importExaminations(Request $request)
    {
        Excel::import(new ExaminationImport, $request->file('file'));
        return back()->with('success', 'Examinations imported successfully');
    }

    // Diagnoses methods
    public function getDiagnoses()
    {
        $diagnoses = Diagnosis::paginate(50);
        return response()->json($diagnoses);
    }

    public function storeDiagnosis(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        Diagnosis::create($validated);
        return response()->json(['message' => 'Diagnosis added successfully']);
    }

    public function editDiagnosis($id)
    {
        return response()->json(Diagnosis::findOrFail($id));
    }

    public function updateDiagnosis(Request $request, $id)
    {
        $item = Diagnosis::findOrFail($id);
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $item->update($validated);
        return response()->json(['message' => 'Diagnosis updated successfully']);
    }

    public function destroyDiagnosis($id)
    {
        Diagnosis::findOrFail($id)->delete();
        return response()->json(['message' => 'Diagnosis deleted successfully']);
    }

    public function exportDiagnoses()
    {
        return Excel::download(new DiagnosisExport, 'diagnoses.xlsx');
    }

    public function importDiagnoses(Request $request)
    {
        Excel::import(new DiagnosisImport, $request->file('file'));
        return back()->with('success', 'Diagnoses imported successfully');
    }

    // Lab Tests methods
    public function getLabTests()
    {
        $lab_tests = LabTest::paginate(50);
        return response()->json($lab_tests);
    }

    public function storeLabTest(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        LabTest::create($validated);
        return response()->json(['message' => 'Lab Test added successfully']);
    }

    public function editLabTest($id)
    {
        return response()->json(LabTest::findOrFail($id));
    }

    public function updateLabTest(Request $request, $id)
    {
        $item = LabTest::findOrFail($id);
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $item->update($validated);
        return response()->json(['message' => 'Lab Test updated successfully']);
    }

    public function destroyLabTest($id)
    {
        LabTest::findOrFail($id)->delete();
        return response()->json(['message' => 'Lab Test deleted successfully']);
    }

    public function exportLabTests()
    {
        return Excel::download(new LabTestExport, 'lab_tests.xlsx');
    }

    public function importLabTests(Request $request)
    {
        Excel::import(new LabTestImport, $request->file('file'));
        return back()->with('success', 'Lab Tests imported successfully');
    }

    // Medicine methods (New)
    public function getMedicines()
    {
        $medicines = MedicineMaster::paginate(50);
        return response()->json($medicines);
    }

    public function storeMedicine(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        MedicineMaster::create($validated);
        return response()->json(['message' => 'Medicine added successfully']);
    }

    public function editMedicine($id)
    {
        return response()->json(MedicineMaster::findOrFail($id));
    }

    public function updateMedicine(Request $request, $id)
    {
        $item = MedicineMaster::findOrFail($id);
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $item->update($validated);
        return response()->json(['message' => 'Medicine updated successfully']);
    }

    public function destroyMedicine($id)
    {
        MedicineMaster::findOrFail($id)->delete();
        return response()->json(['message' => 'Medicine deleted successfully']);
    }

    public function exportMedicines()
    {
        return Excel::download(new MedicineMasterExport, 'medicines.xlsx');
    }

    public function importMedicines(Request $request)
    {

        Excel::import(new MedicineMasterImport, $request->file('file'));
        return back()->with('success', 'Medicines imported successfully');
    }
};