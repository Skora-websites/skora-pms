<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Consultation Consent Confirmation</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.6; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #0e606e; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #0e606e; margin: 0; font-size: 24px; text-transform: uppercase; }
        .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
        
        .section { margin-bottom: 25px; }
        .section-title { font-weight: bold; color: #0e606e; border-left: 4px solid #46bccc; padding-left: 10px; margin-bottom: 15px; font-size: 16px; background: #f8fafc; padding-top: 5px; padding-bottom: 5px; }
        
        .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-grid td { padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 14px; }
        .label { font-weight: bold; background: #f1f5f9; width: 30%; }
        
        .consent-text { font-size: 14px; background: #fdfdfd; padding: 20px; border: 1px solid #e2e8f0; border-radius: 5px; }
        
        .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        .signature-box { margin-top: 40px; }
        .digital-stamp { display: inline-block; border: 2px solid #28a745; color: #28a745; padding: 10px 20px; font-weight: bold; text-transform: uppercase; transform: rotate(-5deg); border-radius: 5px; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Consultation Consent Certificate</h1>
        <p>Issued by {{ config('app.name', 'SkoraCares') }}</p>
    </div>

    <div class="section">
        <div class="section-title">Appointment Information</div>
        <table class="info-grid">
            <tr>
                <td class="label">Appointment ID</td>
                <td>#{{ $appointment->id }}</td>
                <td class="label">Date & Time</td>
                <td>{{ \Carbon\Carbon::parse($appointment->date)->format('d F, Y') }} at {{ \Carbon\Carbon::parse($appointment->time)->format('h:i A') }}</td>
            </tr>
            <tr>
                <td class="label">Consultation Type</td>
                <td colspan="3">{{ ucwords(str_replace('_', ' ', $appointment->case_type)) }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Patient & Doctor Details</div>
        <table class="info-grid">
            <tr>
                <td class="label">Patient Name</td>
                <td>{{ $patient->name }}</td>
                <td class="label">Patient ID</td>
                <td>{{ $patient->registration_id ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Doctor Name</td>
                <td colspan="3">Dr. {{ $doctor->name }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Consent Declaration</div>
        <div class="consent-text">
            <p>I, <strong>{{ $patient->name }}</strong>, hereby provide my full consent for the medical consultation as scheduled. I confirm that I have reviewed the consultation documents provided by Dr. {{ $doctor->name }} and agree to proceed with the treatment/advice as discussed.</p>
            <p>This consent has been provided digitally through the {{ config('app.name') }} Patient Portal. I understand that this electronic confirmation carries the same weight as a physical signature for the purposes of this medical record.</p>
        </div>
    </div>

    <div class="signature-box" style="text-align: right;">
        <div class="digital-stamp">Digitally Accepted</div>
        <p style="font-size: 14px; margin-top: 10px;">
            <strong>Accepted On:</strong> {{ \Carbon\Carbon::parse($consent->accepted_at)->format('d M Y, h:i A') }}<br>
            <strong>IP Address:</strong> {{ request()->ip() }}
        </p>
    </div>

    <div class="footer">
        This is a computer-generated document and does not require a physical signature.<br>
        &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
    </div>
</body>
</html>
