<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Appointment Consent Required</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7fb; color: #333333; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fb; padding: 40px 0; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; }
        .header { background: linear-gradient(135deg, #0e606e, #46bccc); padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555; }
        .details-box { background-color: #f9fafb; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
        .details-box p { margin: 0 0 10px 0; font-size: 15px; }
        .details-box p:last-child { margin-bottom: 0; }
        .details-box strong { color: #2d3748; }
        .cta-container { text-align: center; margin-top: 30px; margin-bottom: 20px; }
        .btn { background-color: #46bccc; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s; }
        .btn:hover { background-color: #3aa3b3; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="main">
            <tr>
                <td class="header">
                    <h1>Action Required: Appointment Consent</h1>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <p>Dear {{ $patient->name ?? 'Patient' }},</p>
                    <p>You have an upcoming appointment booked with <strong>Dr. {{ $doctor->name ?? 'Doctor' }}</strong>. Before we can confirm your appointment, please review and submit your consultation consent form.</p>
                    
                    <div class="details-box">
                        <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($appointment->date)->format('l, F d, Y') }}</p>
                        <p><strong>Time:</strong> {{ \Carbon\Carbon::parse($appointment->time)->format('h:i A') }}</p>
                        <p><strong>Clinic:</strong> {{ $clinic->clinic_name ?? 'SkoraCares Clinic' }}</p>
                    </div>

                    <p>Please click the button below to review the consultation details and provide your consent digitally. You will also have the option to upload any relevant documents or past prescriptions.</p>

                    <div class="cta-container">
                        <a href="{{ url('/my-consent/' . $consent->slug) }}" class="btn">Review & Submit Consent</a>
                    </div>

                    <p style="font-size: 14px; margin-top: 30px;">If the button above does not work, copy and paste the following link into your browser:<br> <a href="{{ url('/my-consent/' . $consent->slug) }}" style="color: #46bccc; word-break: break-all;">{{ url('/my-consent/' . $consent->slug) }}</a></p>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    &copy; {{ date('Y') }} SkoraCares. All rights reserved.<br>
                    Please do not reply to this automated email.
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
