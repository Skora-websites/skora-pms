<?php

namespace App\Exports;

use App\Models\Appointment;
use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AppointmentsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $doctorId;
    protected $status;
    protected $searchName;
    protected $searchPhone;
    protected $startDate;
    protected $endDate;
    protected $selectedIds;

    public function __construct($doctorId, $status, $searchName, $searchPhone, $startDate, $endDate, $selectedIds = [])
    {
        $this->doctorId = $doctorId;
        $this->status = $status;
        $this->searchName = $searchName;
        $this->searchPhone = $searchPhone;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->selectedIds = $selectedIds;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        $query = Appointment::where('doctor_id', $this->doctorId)
            ->with('patient')
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc');

        // Apply status filter
        if ($this->status) {
            if ($this->status === 'pending') {
                $query->where('status', 'confirmed');
            } else {
                $query->where('status', $this->status);
            }
        }

        // Apply search filters
        if ($this->searchName) {
            $query->whereHas('patient', function ($q) {
                $q->where('name', 'like', '%' . $this->searchName . '%');
            });
        }

        if ($this->searchPhone) {
            $query->whereHas('patient', function ($q) {
                $q->where('phone', 'like', '%' . $this->searchPhone . '%');
            });
        }

        // Apply date range filter
        if ($this->startDate && $this->endDate) {
            $start = Carbon::parse($this->startDate)->startOfDay();
            $end = Carbon::parse($this->endDate)->endOfDay();
            $query->whereBetween('date', [$start, $end]);
        }

        // Apply default today filter if no filters
        if (!$this->startDate && !$this->endDate && !$this->searchName && !$this->searchPhone) {
            $query->whereDate('date', today());
        }

        // If specific IDs are selected
        if (!empty($this->selectedIds)) {
            $query->whereIn('id', $this->selectedIds);
        }

        return $query->get();
    }

    /**
    * @var Appointment $appointment
    */
    public function map($appointment): array
    {
        $patient = $appointment->patient;
        
        // Calculate age from DOB if available
        $age = 'N/A';
        if ($patient && $patient->dob) {
            $age = Carbon::parse($patient->dob)->age . ' years';
        }

        // Format visit type
        $visitType = $appointment->case_type ? 
            str_replace('_', ' ', ucwords($appointment->case_type)) : 'N/A';

        // Format status
        $status = $appointment->status ? ucwords($appointment->status) : 'N/A';
        if ($status === 'Confirmed') {
            $status = 'Confirmed';
        }

        return [
            $appointment->index ?? '',
            $patient->name ?? ($appointment->patient_string ?? 'N/A'),
            $patient->phone ?? ($appointment->mobile_number ?? 'N/A'),
            $visitType,
            Carbon::parse($appointment->date)->format('d-m-Y'),
            $appointment->time ?? 'N/A',
            $patient->gender ?? 'N/A',
            $age,
            $appointment->blood_group ?? 'N/A',
            $appointment->bp ?? 'N/A',
            $appointment->weight ? $appointment->weight . ' kg' : 'N/A',
            $appointment->height ? $appointment->height . ' cm' : 'N/A',
            $status,
            $appointment->remarks ?? 'N/A',
            $appointment->note ?? 'N/A',
        ];
    }

    /**
    * @return array
    */
    public function headings(): array
    {
        return [
            'Sr No',
            'Patient Name',
            'Contact',
            'Visit Type',
            'Date',
            'Time',
            'Gender',
            'Age',
            'Blood Group',
            'BP',
            'Weight',
            'Height',
            'Status',
            'Remarks',
            'Note',
        ];
    }

    /**
    * @param Worksheet $sheet
    */
    public function styles(Worksheet $sheet)
    {
        // Make header row bold and add background color
        $sheet->getStyle('A1:O1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '0D6EFD'],
            ],
        ]);

        // Add borders to all cells
        $sheet->getStyle('A1:O' . $sheet->getHighestRow())
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

        // Auto-size columns
        foreach (range('A', 'O') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        return [];
    }
}