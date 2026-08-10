<?php

namespace App\Http\Controllers;

use App\Models\TestBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VendorUploadController extends Controller
{
    public function showUploadForm($token)
    {
        $booking = TestBooking::with(['patient', 'doctor', 'vendor'])
            ->where('upload_link_token', $token)
            ->first();

        if (!$booking) {
            abort(404, 'Invalid or expired upload link.');
        }

        return view('vendor.upload-test', compact('booking', 'token'));
    }

    public function uploadFile(Request $request, $token)
    {
        $booking = TestBooking::where('upload_link_token', $token)->first();

        if (!$booking) {
            return back()->with('error', 'Invalid or expired upload link.');
        }

        $request->validate([
            'test_report' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        if ($request->hasFile('test_report')) {
            $file = $request->file('test_report');
            // Store file in public/test_reports directory
            $path = $file->store('test_reports', 'public');
            
            // Update booking status and file path
            $booking->update([
                'uploaded_file_path' => $path,
                'status' => 'completed'
            ]);

            return back()->with('success', 'Test report uploaded successfully. Doctor has been notified.');
        }

        return back()->with('error', 'Failed to upload report. Please try again.');
    }
}
