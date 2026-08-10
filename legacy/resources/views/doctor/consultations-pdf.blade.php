<!DOCTYPE html>
<html>

<head>
    <title>Prescription - {{ $consultation->patient->name ?? 'Patient' }}</title>
    <style>
        @page {
            margin: 0;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
            line-height: 1.3;
            font-size: 11px;
        }

        .prescription-container {
            border: 1px solid #eee;
            padding: 20px;
            background: #fff;
        }

        /* Header section */
        .pdf-header {
            width: 100%;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
        }

        .pdf-header td {
            border: none;
            vertical-align: top;
            padding: 0;
        }

        .doctor-info {
            text-align: left;
        }

        .clinic-info {
            text-align: right;
        }

        .doctor-name {
            color: #8e44ad;
            font-size: 16px;
            font-weight: bold;
            margin: 0;
        }

        .clinic-name {
            color: #8e44ad;
            font-size: 15px;
            font-weight: bold;
            margin: 0;
        }

        .header-sub {
            font-size: 10px;
            margin: 1px 0;
            color: #555;
        }

        /* Patient info grid */
        .patient-info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            background: #fafafa;
            border: 1px solid #eee;
        }

        .patient-info-table td {
            border: none;
            padding: 6px 10px;
            width: 50%;
            border-bottom: 1px solid #eee;
        }

        .info-label {
            font-weight: bold;
            color: #444;
            margin-right: 5px;
        }

        /* Content sections */
        .content-section {
            margin-bottom: 8px;
            font-size: 12px;
            clear: both;
        }

        .section-label {
            font-weight: bold;
            display: inline-block;
            min-width: 90px;
            color: #333;
        }

        .section-value {
            display: inline-block;
            color: #555;
        }

        /* Medication Table */
        .medication-header {
            margin-top: 15px;
            margin-bottom: 8px;
            font-weight: bold;
            font-size: 13px;
            color: #8e44ad;
            border-bottom: 1.5px solid #8e44ad;
            padding-bottom: 3px;
        }

        .med-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .med-table th {
            background: #fdfbff;
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 10px;
            text-align: left;
            color: #8e44ad;
        }

        .med-table td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 10px;
            vertical-align: top;
        }

        /* Footer */
        .footer {
            margin-top: 50px;
            text-align: right;
            padding-bottom: 20px;
        }

        .signature-line {
            width: 160px;
            border-top: 1.5px solid #333;
            float: right;
            margin-top: 5px;
        }

        .auth-label {
            font-weight: bold;
            margin-bottom: 50px;
            font-size: 11px;
            display: block;
            color: #333;
        }

        .doc-name {
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 11px;
            display: block;
            color: #333;
        }

        /* Clinic Logo */
        .clinic-logo-container {
            text-align: center;
            vertical-align: middle;
        }

        .clinic-logo {
            max-height: 70px;
            max-width: 150px;
        }

        /* Made by footer */
        .made-by-footer {
            position: fixed;
            bottom: 10px;
            right: 20px;
            font-size: 11px;
            color: #888;
            font-style: italic;
        }
    </style>
</head>

<body>
    <div class="prescription-container">
        <!-- Prescription Header -->
        <table class="pdf-header">
            <tr>
                <td class="doctor-info" width="35%">
                    @php
                        $docName = $consultation->doctor->name ?? 'Doctor';
                        $cleanDocName = preg_match('/^Dr\.?\s/i', $docName) ? $docName : 'Dr. ' . $docName;
                    @endphp
                    <div class="doctor-name">{{ $cleanDocName }}</div>
                    <div class="header-sub">{{ $consultation->doctor->specialization ?? 'Specialist' }}</div>
                    <div class="header-sub">Registration No: {{ $consultation->doctor->reg_no ?? '---' }}</div>
                    <div class="header-sub">Mobile: {{ $consultation->doctor->phone ?? '---' }}</div>
                </td>
                <td class="clinic-logo-container" width="30%">
                    @php
                        $clinic = current_clinic();
                        $logoPath = public_path('assets/img/Logo.PNG');
                        if ($clinic && $clinic->clinic_logo && file_exists(public_path($clinic->clinic_logo))) {
                            $logoPath = public_path($clinic->clinic_logo);
                        } elseif (file_exists(public_path('uploads/profile/1776939557.jpg'))) {
                            $logoPath = public_path('uploads/profile/1776939557.jpg');
                        }
                    @endphp
                    @if (file_exists($logoPath))
                        <img src="{{ $logoPath }}" class="clinic-logo" alt="Logo">
                    @endif
                </td>
                <td class="clinic-info" width="35%">
                    <div class="clinic-name">
                        {{ optional(current_clinic())->clinic_name ?? 'Anil Physiotherapy Clinic' }}</div>
                    <div class="header-sub">{{ optional(current_clinic())->address ?? 'Golden Eye, City' }}</div>
                    <div class="header-sub">Email: {{ optional(current_clinic())->email ?? '---' }}</div>
                    <div class="header-sub">Contact: {{ optional(current_clinic())->phone ?? '---' }}</div>
                </td>
            </tr>
        </table>

        <!-- Patient Info Grid -->
        <table class="patient-info-table">
            <tr>
                <td><span class="info-label">Patient Name & ID:</span> {{ $consultation->patient->name ?? '---' }},
                    {{ $consultation->patient->registration_id ?? '---' }}</td>
                <td><span class="info-label">Date & Time:</span> {{ $consultation->created_at->format('d/m/Y h:i A') }}
                </td>
            </tr>
            <tr>
                <td><span class="info-label">Age/Gender:</span>
                    {{ \Carbon\Carbon::parse($consultation->patient->dob)->age ?? '---' }}y,
                    {{ $consultation->patient->gender ?? '---' }}</td>
                <td><span class="info-label">Mobile No:</span> {{ $consultation->patient->phone ?? '---' }}</td>
            </tr>
            <tr>
                <td><span class="info-label">Height / Weight:</span> {{ $consultation->appointment->height ?? '-' }} /
                    {{ $consultation->appointment->weight ?? '-' }}</td>
                <td><span class="info-label">Blood Group:</span> {{ $consultation->appointment->blood_group ?? '-' }}
                </td>
            </tr>
            <tr>
                <td><span class="info-label">Address:</span> {{ $consultation->patient->address ?? '---' }}</td>
                <td><span class="info-label">Consultation Type:</span> Routine</td>
            </tr>
        </table>

        <!-- Symptoms, Examinations, Diagnosis (Formatted as Text) -->
        @if ($consultation->symptoms->count() > 0)
            <div class="content-section">
                <span class="section-label">Symptoms:</span>
                <span class="section-value">{{ $consultation->symptoms->pluck('symptom')->join(', ') }}</span>
            </div>
        @endif

        @if ($consultation->examinations->count() > 0)
            <div class="content-section">
                <span class="section-label">Examinations:</span>
                <span
                    class="section-value">{{ $consultation->examinations->pluck('examination_name')->join(', ') }}</span>
            </div>
        @endif

        @if ($consultation->diagnoses->count() > 0)
            <div class="content-section">
                <span class="section-label">Diagnosis:</span>
                <span class="section-value">
                    @foreach ($consultation->diagnoses as $diag)
                        {{ $diag->diagnosis_name }}{{ $diag->note ? " ($diag->note)" : '' }}{{ !$loop->last ? ', ' : '' }}
                    @endforeach
                </span>
            </div>
        @endif
        @if ($consultation->labTests->count() > 0)
            <div class="content-section">
                <span class="section-label">Lab Tests:</span>
                <span class="section-value">
                    @foreach ($consultation->labTests as $lt)
                        {{ $lt->lab_test_name }}{{ $lt->note ? " ($lt->note)" : '' }}{{ !$loop->last ? ', ' : '' }}
                    @endforeach
                </span>
            </div>
        @endif

        <!-- Medications Section (Table) -->
        <div class="medication-header">Medication (Rx):</div>
        @if ($consultation->medications->count() > 0)
            <table class="med-table">
                <thead>
                    <tr>
                        <th width="5%">S.NO</th>
                        <th width="35%">MEDICINE</th>
                        <th width="15%">DOSE</th>
                        <th width="15%">FREQUENCY</th>
                        <th width="15%">DURATION</th>
                        <th width="15%">NOTES</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($consultation->medications as $index => $med)
                        <tr>
                            <td align="center">{{ $index + 1 }}</td>
                            <td>
                                <span class="medicine-name">{{ $med->medicine_name }}</span>
                                @if ($med->medicine_composition)
                                    <span class="medicine-sub">{{ $med->medicine_composition }}</span>
                                @endif
                            </td>
                            <td>{{ $med->dose ?? '---' }}</td>
                            <td>{{ $med->frequency ?? '---' }}<br><small>({{ $med->when_to_take ?? '---' }})</small>
                            </td>
                            <td>{{ $med->duration ?? '---' }}</td>
                            <td>{{ $med->note ?? '---' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p style="font-style: italic; color: #777;">No medications prescribed.</p>
        @endif

        @if (!empty($consultation->medications_note))
            <div style="margin-top: -5px; margin-bottom: 15px; padding: 6px 10px; border-left: 3px solid #8e44ad; background: #fafafa; font-size: 10px; color: #333;">
                <strong>Special Instructions:</strong> {{ $consultation->medications_note }}
            </div>
        @endif

        <!-- Additional Modules -->
        @if ($consultation->additional_info && is_array($consultation->additional_info))
            @foreach ($consultation->additional_info as $module)
                <div style="margin-top: 15px;">
                    <div
                        style="font-weight: bold; border-bottom: 2px solid #8e44ad; color: #8e44ad; padding-bottom: 4px; font-size: 14px; margin-bottom: 8px;">
                        {{ $module['title'] }}
                    </div>
                    <table
                        style="width: 100%; border-collapse: collapse; font-size: 11px; color: #444; border: 1px solid #eee;">
                        <tbody>
                            @foreach ($module['rows'] as $index => $row)
                                <tr>
                                    <td style="padding: 6px; border: 1px solid #eee; text-align: center; width: 40px;">
                                        {{ $index + 1 }}</td>
                                    @foreach ($row as $cell)
                                        <td style="padding: 6px; border: 1px solid #eee;">{{ $cell }}</td>
                                    @endforeach
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endforeach
        @endif

        <!-- Follow-up & Footer -->
        @if ($consultation->follow_up_date || $consultation->additional_notes)
            <div
                style="margin-top: 25px; padding: 12px; background: #fffaf0; border: 1px dashed #fad390; border-radius: 5px;">
                @if ($consultation->follow_up_date)
                    <div><span class="info-label">Follow-up:</span> {{ $consultation->follow_up_date }}</div>
                @endif
                @if ($consultation->additional_notes)
                    <div><span class="info-label">Clinical Notes:</span> {{ $consultation->additional_notes }}</div>
                @endif
            </div>
        @endif

        <div class="footer">
            <div class="auth-label">Authorized Signature</div>
            @php
                $footerDocName = $consultation->doctor->name ?? '---';
                $cleanFooterDocName = preg_match('/^Dr\.?\s/i', $footerDocName)
                    ? $footerDocName
                    : 'Dr. ' . $footerDocName;
            @endphp
            <div class="doc-name">{{ $cleanFooterDocName }}</div>
            <div class="signature-line"></div>
        </div>
    </div>
    <div class="made-by-footer">
        Made by
        <a href="https://www.skorasoft.com/" target="_blank">Skorasoft</a>
    </div>

</body>

</html>
