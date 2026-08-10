@component('mail::message')
# 🧪 New Test Booking Request

Hello **{{ $booking->vendor->name ?? 'Vendor' }}**,  

You have received a new test booking request from  
### 👨‍⚕️ Dr. {{ $booking->doctor->name ?? 'Doctor' }}

---

## 👤 Patient Details
- **Name:** {{ $booking->patient->name ?? 'N/A' }}  
- **Phone:** {{ $booking->patient->phone ?? 'N/A' }}  
- **Gender / Age:** {{ $booking->patient->gender ?? 'N/A' }} / {{ $booking->patient->age ?? 'N/A' }}  

---

## 🧾 Tests Requested
@foreach($booking->tests as $test)
- ✅ {{ $test['name'] ?? 'N/A' }}
@endforeach

---

## 📅 Booking Schedule
- **Date:** {{ \Carbon\Carbon::parse($booking->booking_date)->format('d M Y') }}  
- **Time:** {{ \Carbon\Carbon::parse($booking->booking_time)->format('h:i A') }}

---

## 📤 Upload Test Results
Please upload the completed test results (PDF or Image) using the button below:

@component('mail::button', ['url' => $uploadLink, 'color' => 'success'])
📎 Upload Test Results
@endcomponent

---

If you have any questions, feel free to contact us.

Thanks & Regards,  
**{{ config('app.name') }}**

<br>

<div style="text-align:center; font-size:12px; color:#888;">
    Powered by <a href="https://www.skorasoft.com/" target="_blank" style="color:#4CAF50; text-decoration:none;">Skorasoft</a>
</div>

@endcomponent
