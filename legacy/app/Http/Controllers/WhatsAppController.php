<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WhatsAppController extends Controller
{
    private $appKey;
    private $authKey;

    public function __construct()
    {
        // Load from .env
        $this->appKey = config('services.whatsapp.appkey');
        $this->authKey = config('services.whatsapp.authkey');
    }

    /**
     * Send WhatsApp message with file after appointment booking
     */
    public function sendAppointmentConfirmation(Request $request)
    {
        // Validate required fields
        $request->validate([
            'doctor_name' => 'required|string',
            'date_time' => 'required|string',
            'patient_name' => 'required|string',
            'mobile_no' => 'required|regex:/^[0-9]{10,15}$/', // 10-15 digits
            'blood_group' => 'nullable|string',
            'bp_level' => 'nullable|string',
            'weight' => 'nullable|string',
            'height' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        // Extract data
        $doctorName = $request->input('doctor_name');
        $appointmentDateTime = $request->input('date_time');
        $patientName = $request->input('patient_name');
        $mobileNo = $request->input('mobile_no');
        $bloodGroup = $request->input('blood_group', 'N/A');
        $bpLevel = $request->input('bp_level', 'N/A');
        $weight = $request->input('weight', 'N/A');
        $height = $request->input('height', 'N/A');
        $remarks = $request->input('remarks', 'No remarks');

        // Format message
        $message = "📌 *Appointment Confirmed*\n\n" .
                   "👨‍⚕️ Doctor: $doctorName\n" .
                   "📅 Date & Time: $appointmentDateTime\n" .
                   "👤 Patient: $patientName\n" .
                   "🩸 Blood Group: $bloodGroup\n" .
                   "⚖️ Weight: $weight kg\n" .
                   "📏 Height: $height cm\n" .
                   "🫀 BP Level: $bpLevel\n" .
                   "📝 Remarks: $remarks\n\n" .
                   "Thank you for choosing DocRx!";

        // File URL (replace with your dynamic PDF URL)
        $fileUrl = 'https://www.africau.edu/images/default/sample.pdf';

        try {
            // Send WhatsApp message via API
            $response = Http::asMultipart()
                ->post('https://whatsapp.rajatmarketingss.online/api/create-message', [
                    [
                        'name' => 'appkey',
                        'contents' => $this->appKey
                    ],
                    [
                        'name' => 'authkey',
                        'contents' => $this->authKey
                    ],
                    [
                        'name' => 'to',
                        'contents' => $mobileNo
                    ],
                    [
                        'name' => 'message',
                        'contents' => $message
                    ],
                    [
                        'name' => 'file',
                        'contents' => $fileUrl
                    ],
                    [
                        'name' => 'sandbox',
                        'contents' => 'false'
                    ]
                ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp message sent successfully!',
                    'data' => $response->json()
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send WhatsApp message.',
                    'error' => $response->body()
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending the message.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}