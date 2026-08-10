@extends('layouts.layout-doctor')
@section('title', 'Doctor || Schedule Management')
@section('content')
<link rel="stylesheet" href="{{ asset('assets-doctor/css/schedule-time.css') }}">

<div class="main-wrapper">
    <div class="page-wrapper">
        <div class="content">
            <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
                <div class="flex-grow-1">
                    <h4 class="fw-bold mb-0 color-doctorrx">Doctor Schedule Management</h4>
                </div>
                <div class="d-flex gap-2 align-items-center">
                    <button class="btn btn-info btn-sm text-white" data-bs-toggle="modal" data-bs-target="#helpGuideModal">
                        <i class="ti ti-help me-1"></i> Help Guide
                    </button>
                    <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addClinicModal">
                        <i class="ti ti-plus me-1"></i> Add New Clinic
                    </button>
                    <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addScheduleModal">
                        <i class="ti ti-calendar-plus me-1"></i> Add Schedule
                    </button>
                </div>
            </div>
            
            <div id="alertContainer"></div>
            
            <div id="clinicsContainer">
                @include('doctor.partials-clinics-list')
            </div>
        </div>
    </div>
<div class="modal fade" id="helpGuideModal" tabindex="-1" aria-labelledby="helpGuideModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold" id="helpGuideModalLabel">
                    <i class="ti ti-help me-2"></i> डॉक्टर हेल्प गाइड / Doctor Help Guide
                </h5>
               <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
                <div class="text-end mb-3">
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary active" id="langHindi">हिंदी</button>
                        <button type="button" class="btn btn-outline-primary" id="langEnglish">English</button>
                    </div>
                </div>

                <div id="hindiContent">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3 border-info">
                                <div class="card-header bg-info bg-opacity-10 text-info fw-bold">
                                    <i class="ti ti-building-hospital me-2"></i> क्लिनिक कैसे जोड़ें?
                                </div>
                                <div class="card-body">
                                    <ol class="mb-0 ps-3">
                                        <li class="mb-2">"Add New Clinic" बटन पर क्लिक करें</li>
                                        <li class="mb-2">क्लिनिक का नाम डालें</li>
                                        <li class="mb-2">पता चुनें (मैनुअल या मैप)</li>
                                        <li class="mb-2">फोन नंबर और फीस डालें</li>
                                        <li class="mb-2">क्लिनिक का लोगो अपलोड करें</li>
                                        <li class="mb-0">"Add Clinic" दबाएं</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3 border-success">
                                <div class="card-header bg-success bg-opacity-10 text-success fw-bold">
                                    <i class="ti ti-calendar-plus me-2"></i> शेड्यूल कैसे जोड़ें?
                                </div>
                                <div class="card-body">
                                    <ol class="mb-0 ps-3">
                                        <li class="mb-2">"Add Schedule" बटन पर क्लिक करें</li>
                                        <li class="mb-2">क्लिनिक चुनें</li>
                                        <li class="mb-2">मरीजों की संख्या डालें</li>
                                        <li class="mb-2">काम के दिन चुनें</li>
                                        <li class="mb-2">सेशन टाइमिंग सेट करें</li>
                                        <li class="mb-0">"Add Schedule" दबाएं</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="card mb-3 border-warning">
                                <div class="card-header bg-warning bg-opacity-10 text-warning fw-bold">
                                    <i class="ti ti-edit me-2"></i> एडिट/डिलीट कैसे करें?
                                </div>
                                <div class="card-body">
                                    <p class="mb-2"><strong>क्लिनिक एडिट/डिलीट:</strong></p>
                                    <ul class="mb-3 ps-3">
                                        <li>क्लिनिक कार्ड में ⋮ बटन दबाएं</li>
                                        <li>"Edit Clinic" या "Delete Clinic" चुनें</li>
                                    </ul>
                                    <p class="mb-2"><strong>शेड्यूल एडिट/डिलीट:</strong></p>
                                    <ul class="mb-0 ps-3">
                                        <li>"View Schedule" में जाएं</li>
                                        <li>पेंसिल आइकन (एडिट) या ट्रैश आइकन (डिलीट) दबाएं</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3 border-primary">
                                <div class="card-header bg-primary bg-opacity-10 text-primary fw-bold">
                                    <i class="ti ti-clock me-2"></i> टाइमिंग सेट करने का तरीका
                                </div>
                                <div class="card-body">
                                    <ul class="mb-0 ps-3">
                                        <li class="mb-2">टाइम फील्ड पर क्लिक करें</li>
                                        <li class="mb-2">घंटा, मिनट और AM/PM चुनें</li>
                                        <li class="mb-2">"Select Time" दबाएं</li>
                                        <li class="mb-2">ड्यूरेशन ऑटोमैटिक कैलकुलेट होगा</li>
                                        <li class="mb-0">24 घंटे के लिए "24 Hours Open" चेक करें</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="alert alert-info mt-3 mb-0">
                        <i class="ti ti-info-circle me-2"></i>
                        <strong>टिप:</strong> पहले क्लिनिक जोड़ें, फिर शेड्यूल। हर क्लिनिक का अलग शेड्यूल बनाएं।
                    </div>
                </div>

                <!-- इंग्लिश कंटेंट - English Content (initially hidden) -->
                <div id="englishContent" style="display: none;">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3 border-info">
                                <div class="card-header bg-info bg-opacity-10 text-info fw-bold">
                                    <i class="ti ti-building-hospital me-2"></i> How to Add Clinic?
                                </div>
                                <div class="card-body">
                                    <ol class="mb-0 ps-3">
                                        <li class="mb-2">Click "Add New Clinic" button</li>
                                        <li class="mb-2">Enter clinic name</li>
                                        <li class="mb-2">Choose address (Manual or Map)</li>
                                        <li class="mb-2">Enter phone number and fee</li>
                                        <li class="mb-2">Upload clinic logo</li>
                                        <li class="mb-0">Click "Add Clinic"</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3 border-success">
                                <div class="card-header bg-success bg-opacity-10 text-success fw-bold">
                                    <i class="ti ti-calendar-plus me-2"></i> How to Add Schedule?
                                </div>
                                <div class="card-body">
                                    <ol class="mb-0 ps-3">
                                        <li class="mb-2">Click "Add Schedule" button</li>
                                        <li class="mb-2">Select clinic</li>
                                        <li class="mb-2">Enter max patients</li>
                                        <li class="mb-2">Select working days</li>
                                        <li class="mb-2">Set session timings</li>
                                        <li class="mb-0">Click "Add Schedule"</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="card mb-3 border-warning">
                                <div class="card-header bg-warning bg-opacity-10 text-warning fw-bold">
                                    <i class="ti ti-edit me-2"></i> How to Edit/Delete?
                                </div>
                                <div class="card-body">
                                    <p class="mb-2"><strong>Edit/Delete Clinic:</strong></p>
                                    <ul class="mb-3 ps-3">
                                        <li>Click ⋮ button in clinic card</li>
                                        <li>Select "Edit Clinic" or "Delete Clinic"</li>
                                    </ul>
                                    <p class="mb-2"><strong>Edit/Delete Schedule:</strong></p>
                                    <ul class="mb-0 ps-3">
                                        <li>Go to "View Schedule"</li>
                                        <li>Click pencil icon (Edit) or trash icon (Delete)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3 border-primary">
                                <div class="card-header bg-primary bg-opacity-10 text-primary fw-bold">
                                    <i class="ti ti-clock me-2"></i> How to Set Timings?
                                </div>
                                <div class="card-body">
                                    <ul class="mb-0 ps-3">
                                        <li class="mb-2">Click on time field</li>
                                        <li class="mb-2">Select hour, minute and AM/PM</li>
                                        <li class="mb-2">Click "Select Time"</li>
                                        <li class="mb-2">Duration auto-calculates</li>
                                        <li class="mb-0">Check "24 Hours Open" for 24x7 clinics</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="alert alert-info mt-3 mb-0">
                        <i class="ti ti-info-circle me-2"></i>
                        <strong>Tip:</strong> First add clinic, then schedule. Create separate schedules for each clinic.
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="videoTutorialBtn">
                    <i class="ti ti-video me-1"></i> Watch Video Tutorial
                </button>
            </div>
        </div>
    </div>
</div>


    <!-- Add Clinic Modal -->
    <div id="addClinicModal" class="modal fade">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">Add New Clinic</h5>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="addClinicForm" method="POST" enctype="multipart/form-data">
                    @csrf
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Clinic Name</label>
                                <input type="text" class="form-control" name="clinic_name" placeholder="Enter clinic name" required>
                            </div>
                           
                            <div class="col-md-6">
                                <label class="form-label">Address Type</label>
                                <div class="address-type-tabs nav nav-pills mb-3">
                                    <button class="nav-link active" type="button" data-bs-target="#manualAddress" data-bs-toggle="pill">Manual Address</button>
                                    <button class="nav-link" type="button" data-bs-target="#mapAddress" data-bs-toggle="pill">Map Location</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="tab-content">
                                <!-- Manual Address Tab -->
                                <div class="tab-pane fade show active" id="manualAddress">
                                    <input type="hidden" name="address_type" value="manual">
                                    <label class="form-label">Clinic Address</label>
                                    <textarea class="form-control manual-address" name="address" rows="3" placeholder="Enter complete clinic address"></textarea>
                                </div>
                                <!-- Map Address Tab -->
                                <div class="tab-pane fade" id="mapAddress">
                                    <input type="hidden" name="address_type" value="map">
                                    <label class="form-label">Select Location from Map</label>
                                    <div class="input-group mb-2">
                                        <input type="text" class="form-control" id="mapSearch" placeholder="Search location on map">
                                        <button class="btn btn-outline-secondary" type="button" id="useCurrentLocation">
                                            <i class="ti ti-current-location"></i> Current Location
                                        </button>
                                    </div>
                                    <div class="map-container" id="addressMap"></div>
                                    <div class="row mt-2">
                                        <div class="col-md-6">
                                            <label class="form-label small mb-1">Latitude</label>
                                            <input type="text" class="form-control form-control-sm" name="latitude" id="latitude" placeholder="Lat" readonly>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label small mb-1">Longitude</label>
                                            <input type="text" class="form-control form-control-sm" name="longitude" id="longitude" placeholder="Lng" readonly>
                                        </div>
                                    </div>
                                    <div class="mt-3" id="mapAddressWrapper" style="display: none;">
                                        <label class="form-label">Clinic Address (from Map)</label>
                                        <input type="text" class="form-control map-address" name="address" id="mapAddressInput" placeholder="Select location on map or type address here">
                                        <small class="text-muted">You can manually edit the address if the map location is not precise.</small>
                                    </div>
                                    <div class="mt-2">
                                        <small class="text-muted">Selected Map Point: <span id="selectedAddressText">No location selected</span></small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Phone Number</label>
                                    <input type="text" class="form-control" name="phone" placeholder="Enter phone number" minlength="10" maxlength="10" required>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Consultation Fee (₹)</label>
                                    <input type="number" class="form-control" name="consultation_fee" placeholder="Enter consultation fee" step="0.01" required>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-bold">Clinic Logo</label>
                                <input type="file" name="clinic_logo" class="form-control" required>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="addClinicBtn">
                            <span class="loading-spinner spinner-border spinner-border-sm me-2"></span>
                            Add Clinic
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Edit Clinic Modal -->
    <div id="editClinicModal" class="modal fade">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">Edit Clinic</h5>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editClinicForm" method="POST" enctype="multipart/form-data">
                    @csrf
                    @method('PUT')
                    <input type="hidden" name="clinic_id" id="edit_clinic_id">
                    <input type="hidden" name="address_type" id="edit_address_type" value="manual">
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Clinic Name</label>
                                <input type="text" class="form-control" name="clinic_name" id="edit_clinic_name" placeholder="Enter clinic name" required>
                            </div>
                           
                            <div class="col-md-6">
                                <label class="form-label">Address Type</label>
                                <div class="address-type-tabs nav nav-pills mb-3" id="editAddressTabs">
                                    <button class="nav-link active" type="button" data-bs-target="#editManualAddress" data-bs-toggle="pill">Manual Address</button>
                                    <button class="nav-link" type="button" data-bs-target="#editMapAddress" data-bs-toggle="pill">Map Location</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="tab-content">
                                <!-- Manual Address Tab -->
                                <div class="tab-pane fade show active" id="editManualAddress">
                                    <label class="form-label">Clinic Address</label>
                                    <textarea class="form-control manual-address" name="address" id="edit_clinic_address" rows="3" placeholder="Enter complete clinic address"></textarea>
                                </div>
                                <!-- Map Address Tab -->
                                <div class="tab-pane fade" id="editMapAddress">
                                    <label class="form-label">Select Location from Map</label>
                                    <div class="input-group mb-2">
                                        <input type="text" class="form-control" id="editMapSearch" placeholder="Search location on map">
                                        <button class="btn btn-outline-secondary" type="button" id="editUseCurrentLocation">
                                            <i class="ti ti-current-location"></i> Current Location
                                        </button>
                                    </div>
                                    <div class="map-container" id="editAddressMap"></div>
                                    <div class="row mt-2">
                                        <div class="col-md-6">
                                            <label class="form-label small mb-1">Latitude</label>
                                            <input type="text" class="form-control form-control-sm" name="latitude" id="editLatitude" placeholder="Lat" readonly>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label small mb-1">Longitude</label>
                                            <input type="text" class="form-control form-control-sm" name="longitude" id="editLongitude" placeholder="Lng" readonly>
                                        </div>
                                    </div>
                                    <div class="mt-3" id="editMapAddressWrapper" style="display: none;">
                                        <label class="form-label">Clinic Address (from Map)</label>
                                        <input type="text" class="form-control map-address" name="address" id="editMapAddressInput" placeholder="Select location on map or type address here">
                                        <small class="text-muted">You can manually edit the address if the map location is not precise.</small>
                                    </div>
                                    <div class="mt-2">
                                        <small class="text-muted">Selected Map Point: <span id="editSelectedAddressText">No location selected</span></small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Phone Number</label>
                                    <input type="text" class="form-control" name="phone" id="edit_clinic_phone" placeholder="Enter phone number" minlength="10" maxlength="10" required>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Consultation Fee (₹)</label>
                                    <input type="number" class="form-control" name="consultation_fee" id="edit_clinic_fee" placeholder="Enter consultation fee" step="0.01" required>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-bold">Clinic Logo</label>
                                <input type="file" name="clinic_logo" class="form-control">
                                <small class="text-muted">Leave empty to keep current logo</small>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="updateClinicBtn">
                            <span class="loading-spinner spinner-border spinner-border-sm me-2"></span>
                            Update Clinic
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Add Schedule Modal -->
    <div id="addScheduleModal" class="modal fade">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">Add New Schedule</h5>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="addScheduleForm">
                    @csrf
                    <div class="modal-body">
                        <!-- Clinic Selection -->
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Select Clinic</label>
                                <select class="form-select" name="doctor_clinic_id" id="clinic_select" required>
                                    <option value="">Choose your clinic</option>
                                    @foreach($clinics as $clinic)
                                        <option value="{{ $clinic->id }}">{{ $clinic->clinic_name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            
                            <!-- Max Patients -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Maximum Patients per Session</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" name="max_patients" placeholder="Enter maximum patients" min="1" max="500" required>
                                    <span class="input-group-text">patients</span>
                                </div>
                            </div>
                        </div>

                        <!-- Days Selection -->
                        <div class="card mb-3">
                            <div class="card-body">
                                <label class="form-label fw-bold mb-3">Select Working Days</label>
                                <div class="d-flex flex-wrap gap-2">
                                    @php
                                        $days = [
                                            'monday' => 'Mon', 'tuesday' => 'Tue', 'wednesday' => 'Wed',
                                            'thursday' => 'Thu', 'friday' => 'Fri', 'saturday' => 'Sat',
                                            'sunday' => 'Sun'
                                        ];
                                    @endphp
                                    @foreach($days as $key => $day)
                                    <div class="form-check day-check-card">
                                        <input class="form-check-input day-checkbox" type="checkbox"
                                            name="days[]" value="{{ $key }}" id="day_{{ $key }}">
                                        <label class="form-check-label day-label" for="day_{{ $key }}">
                                            <span class="day-short">{{ $day }}</span>
                                        </label>
                                    </div>
                                    @endforeach
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="d-flex flex-wrap gap-4 align-items-center ms-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" name="is_24_hours" id="is_24_hours" value="1">
                                    <label class="form-check-label hours24-label" for="is_24_hours">
                                        <i class="ti ti-clock-24 me-2"></i>24 Hours Open (No specific sessions)
                                    </label>
                                </div>
                                
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="enable_interval">
                                    <label class="form-check-label" for="enable_interval">
                                        <i class="ti ti-clock me-2"></i>Set Common Slot Interval
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3 ms-3" id="interval_input_section" style="display: none;">
                            <div class="row w-100">
                                <div class="col-md-6 mb-2">
                                    <label class="form-label">Slot Duration (Minutes)</label>
                                    <input type="number" class="form-control" name="slot_duration" placeholder="e.g. 30" min="5" value="30">
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label class="form-label">Gap Between Slots (Minutes)</label>
                                    <input type="number" class="form-control" name="gap_duration" placeholder="e.g. 5" min="0" value="0">
                                </div>
                            </div>
                            <small class="text-muted mt-1 d-block"><i class="ti ti-info-circle me-1"></i>This interval will be used to generate bookable slots.</small>
                        </div>

                        <div id="sessionTimingSection">
                            <label class="form-label fw-bold mb-3">Session Timing (Select sessions and set timings)</label>
                            
                            <div class="row">
                                <!-- Morning Session -->
                                <div class="col-md-6">
                                    <div class="session-time-card card mb-3">
                                        <div class="card-body">
                                            <div class="row align-items-center">
                                                <div class="col-md-3">
                                                    <div class="form-check">
                                                        <input type="checkbox" class="form-check-input session-checkbox" name="session_types[]" value="morning" id="session_morning">
                                                        <label class="form-check-label fw-bold" for="session_morning">
                                                            <i class="ti ti-sun text-warning me-2"></i>Morning
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="col-md-9">
                                                    <div class="row g-2 session-time-fields" id="morning_time_fields" style="display: none;">
                                                        <div class="col-md-6">
                                                            <label class="form-label small">Start Time</label>
                                                            <input type="text" class="form-control timepicker morning-start-time" name="morning_start_time" placeholder="09:00 AM" readonly>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <label class="form-label small">End Time</label>
                                                            <input type="text" class="form-control timepicker morning-end-time" name="morning_end_time" placeholder="12:00 PM" readonly>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Afternoon Session -->
                                <div class="col-md-6">
                                    <div class="session-time-card card mb-3">
                                        <div class="card-body">
                                            <div class="row align-items-center">
                                                <div class="col-md-3">
                                                    <div class="form-check">
                                                        <input type="checkbox" class="form-check-input session-checkbox" name="session_types[]" value="afternoon" id="session_afternoon">
                                                        <label class="form-check-label fw-bold" for="session_afternoon">
                                                            <i class="ti ti-sunset text-orange me-2"></i>Afternoon
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="col-md-9">
                                                    <div class="row g-2 session-time-fields" id="afternoon_time_fields" style="display: none;">
                                                        <div class="col-md-6">
                                                            <label class="form-label small">Start Time</label>
                                                            <input type="text" class="form-control timepicker afternoon-start-time" name="afternoon_start_time" placeholder="12:00 PM" readonly>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <label class="form-label small">End Time</label>
                                                            <input type="text" class="form-control timepicker afternoon-end-time" name="afternoon_end_time" placeholder="04:00 PM" readonly>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Evening Session -->
                                <div class="col-md-6">
                                    <div class="session-time-card card mb-3">
                                        <div class="card-body">
                                            <div class="row align-items-center">
                                                <div class="col-md-3">
                                                    <div class="form-check">
                                                        <input type="checkbox" class="form-check-input session-checkbox" name="session_types[]" value="evening" id="session_evening">
                                                        <label class="form-check-label fw-bold" for="session_evening">
                                                            <i class="ti ti-moon-stars text-info me-2"></i>Evening
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="col-md-9">
                                                    <div class="row g-2 session-time-fields" id="evening_time_fields" style="display: none;">
                                                        <div class="col-md-6">
                                                            <label class="form-label small">Start Time</label>
                                                            <input type="text" class="form-control timepicker evening-start-time" name="evening_start_time" placeholder="04:00 PM" readonly>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <label class="form-label small">End Time</label>
                                                            <input type="text" class="form-control timepicker evening-end-time" name="evening_end_time" placeholder="08:00 PM" readonly>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Night Session -->
                                <div class="col-md-6">
                                    <div class="session-time-card card mb-3">
                                        <div class="card-body">
                                            <div class="row align-items-center">
                                                <div class="col-md-3">
                                                    <div class="form-check">
                                                        <input type="checkbox" class="form-check-input session-checkbox" name="session_types[]" value="night" id="session_night">
                                                        <label class="form-check-label fw-bold" for="session_night">
                                                            <i class="ti ti-moon text-dark me-2"></i>Night
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="col-md-9">
                                                    <div class="row g-2 session-time-fields" id="night_time_fields" style="display: none;">
                                                        <div class="col-md-6">
                                                            <label class="form-label small">Start Time</label>
                                                            <input type="text" class="form-control timepicker night-start-time" name="night_start_time" placeholder="08:00 PM" readonly>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <label class="form-label small">End Time</label>
                                                            <input type="text" class="form-control timepicker night-end-time" name="night_end_time" placeholder="11:00 PM" readonly>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Info text for 24 hours mode -->
                        <div id="info24Hours" class="alert alert-info" style="display: none;">
                            <i class="ti ti-info-circle me-2"></i> 24 Hours mode is selected. All sessions will be ignored.
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="addScheduleBtn">
                            <span class="loading-spinner spinner-border spinner-border-sm me-2"></span>
                            <i class="ti ti-calendar-plus me-1"></i>Add Schedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Edit Schedule Modal -->
    <div id="editScheduleModal" class="modal fade">
        <div class="modal-dialog modal-dialog-centered modal-md">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">Edit Schedule</h5>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editScheduleForm">
                    @csrf
                    @method('PUT')
                    <input type="hidden" name="schedule_id" id="edit_schedule_id">
                    
                    <div class="modal-body">
                        <!-- Clinic Info (Readonly) -->
                        {{-- <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Clinic</label>
                                <input type="text" class="form-control" id="edit_clinic_name" readonly>
                            </div>
                            
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Day</label>
                                <select class="form-select" name="day_of_week" id="edit_day_of_week" required>
                                    <option value="monday">Monday</option>
                                    <option value="tuesday">Tuesday</option>
                                    <option value="wednesday">Wednesday</option>
                                    <option value="thursday">Thursday</option>
                                    <option value="friday">Friday</option>
                                    <option value="saturday">Saturday</option>
                                    <option value="sunday">Sunday</option>
                                </select>
                            </div>
                        </div> --}}

                        <!-- Session Type -->
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Session Type</label>
                                <select class="form-select" name="session_type" id="edit_session_type" required>
                                    <option value="morning">Morning</option>
                                    <option value="afternoon">Afternoon</option>
                                    <option value="evening">Evening</option>
                                    <option value="night">Night</option>
                                </select>
                            </div>
                            
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Max Patients</label>
                                <input type="number" class="form-control" name="max_patients" id="edit_max_patients" min="1" required>
                            </div>
                        </div>

                        <!-- 24 Hours Option -->
                        <div class="mb-3">
                            <div class="d-flex flex-wrap gap-4 align-items-center">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" name="is_24_hours" id="edit_is_24_hours" value="1">
                                    <label class="form-check-label" for="edit_is_24_hours">
                                        <i class="ti ti-clock-24 me-2"></i>24 Hours Open
                                    </label>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="edit_enable_interval">
                                    <label class="form-check-label" for="edit_enable_interval">
                                        <i class="ti ti-clock me-2"></i>Set Common Slot Interval
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3" id="edit_interval_input_section" style="display: none;">
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <label class="form-label">Slot Duration (Min)</label>
                                    <input type="number" class="form-control" name="slot_duration" id="edit_slot_duration" placeholder="e.g. 30" min="5" value="30">
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label class="form-label">Gap (Min)</label>
                                    <input type="number" class="form-control" name="gap_duration" id="edit_gap_duration" placeholder="e.g. 5" min="0" value="0">
                                </div>
                            </div>
                        </div>

                        <!-- Time Selection -->
                        <div id="edit_time_section">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Start Time</label>
                                    <input type="text" class="form-control timepicker" name="start_time" id="edit_start_time" placeholder="09:00 AM" readonly>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">End Time</label>
                                    <input type="text" class="form-control timepicker" name="end_time" id="edit_end_time" placeholder="05:00 PM" readonly>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="updateScheduleBtn">
                            <span class="loading-spinner spinner-border spinner-border-sm me-2"></span>
                            <i class="ti ti-edit me-1"></i>Update Schedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- View Clinic Details Modal -->
    <div id="viewClinicModal" class="modal fade">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">Clinic Schedule Details</h5>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="clinicScheduleDetails">
                    <!-- Content will be loaded dynamically -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Time Picker Modal -->
    <div class="modal fade" id="timePickerModal">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h6 class="modal-title">Select Time</h6>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="time-picker-widget text-center">
                        <div class="time-display mb-3 d-flex align-items-center justify-content-center gap-2">
                            <h5 class="fw-bold text-primary mb-0" id="selectedTime">12:00</h5>
                            <span class="fw-bold h5 mb-0" id="periodDisplay">AM</span>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="timePeriodToggle">
                                <label class="form-check-label" for="timePeriodToggle"></label>
                            </div>
                        </div>
                       
                        <div class="time-controls">
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <label class="form-label text-muted">Hour</label>
                                    <select class="form-select" id="hourSelect">
                                        @for($i = 1; $i <= 12; $i++)
                                            <option value="{{ $i }}">{{ str_pad($i, 2, '0', STR_PAD_LEFT) }}</option>
                                        @endfor
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-muted">Minute</label>
                                    <select class="form-select" id="minuteSelect">
                                        @for($i = 0; $i < 60; $i += 5)
                                            <option value="{{ str_pad($i, 2, '0', STR_PAD_LEFT) }}">{{ str_pad($i, 2, '0', STR_PAD_LEFT) }}</option>
                                        @endfor
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmTime">Select Time</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteConfirmationModal">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm Delete</h5>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p id="deleteMessage">Are you sure you want to delete this item?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                        <span class="loading-spinner spinner-border spinner-border-sm me-2"></span>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://maps.googleapis.com/maps/api/js?key={{ config('services.google.maps_api_key') }}&libraries=places"></script>

<script>
$(document).ready(function() {
    let map, marker, geocoder;
    let editMap, editMarker, editGeocoder;
    let currentAddressType = 'manual';
    let currentTimeField = null;
    let deleteType, deleteId;

    // ==================== ADDRESS TYPE MANAGEMENT ====================
    function setAddressType(context, type) {
        context.find('.address-type-tabs .nav-link').removeClass('active');
        const isEdit = context.attr('id') === 'editClinicModal';
        const tabTarget = type === 'manual' ? (isEdit ? '#editManualAddress' : '#manualAddress') : (isEdit ? '#editMapAddress' : '#mapAddress');
        
        context.find(`[data-bs-target="${tabTarget}"]`).addClass('active');
        context.find('.tab-pane').removeClass('show active');
        context.find(tabTarget).addClass('show active');
        
        if (isEdit) {
            $('#edit_address_type').val(type);
        } else {
            $('#addClinicModal input[name="address_type"]').val(type);
        }
        
        if (type === 'manual') {
            context.find('.manual-address').prop('disabled', false).attr('required', true);
            context.find('.map-address').prop('disabled', true).removeAttr('required');
            context.find('#mapAddressWrapper, #editMapAddressWrapper').hide();
        } else {
            context.find('.manual-address').prop('disabled', true).removeAttr('required');
            context.find('.map-address').prop('disabled', false);
        }
    }

    $('.address-type-tabs .nav-link').click(function() {
        const target = $(this).attr('data-bs-target');
        const context = (target.includes('Manual')) ? (target.includes('edit') ? $('#editClinicModal') : $('#addClinicModal')) : (target.includes('edit') ? $('#editClinicModal') : $('#addClinicModal'));
        
        // Simpler context detection
        const actualContext = $(this).closest('.modal');
        const type = target.includes('Manual') ? 'manual' : 'map';
        
        setAddressType(actualContext, type);
        
        if (type === 'map') {
            if (actualContext.attr('id') === 'addClinicModal') initializeMap();
            else {
                const lat = $('#editLatitude').val() || 28.6139;
                const lng = $('#editLongitude').val() || 77.2090;
                initializeEditMap(lat, lng);
            }
        }
    });

    // Initialize modals
    $('#addClinicModal').on('show.bs.modal', function() {
        setAddressType($(this), 'manual');
    });

    // ==================== CLINIC MANAGEMENT ====================

    // Add Clinic Form
    $('#addClinicForm').on('submit', function(e) {
        e.preventDefault();
        
        const type = $('#addClinicModal input[name="address_type"]').first().val();
        if (type === 'manual') {
            const manualAddress = $('#addClinicModal .manual-address').val().trim();
            if (!manualAddress) {
                showAlert('Please enter clinic address', 'error');
                return;
            }
        } else {
            const mapAddress = $('#addClinicModal .map-address').val().trim();
            if (!mapAddress) {
                showAlert('Please select a location from map', 'error');
                return;
            }
        }
        
        const button = $('#addClinicBtn');
        setLoading(button, true);
        
        const formData = new FormData(this);
        
        $.ajax({
            url: '{{ route("doctor.clinic.store") }}',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showAlert(response.message, 'success');
                    $('#addClinicModal').modal('hide');
                    $('#addClinicForm')[0].reset();
                    setAddressType($('#addClinicModal'), 'manual');
                    location.reload();
                } else {
                    showAlert(response.message, 'error');
                }
            },
            error: function(xhr) {
                handleAjaxError(xhr, 'adding clinic');
            },
            complete: function() {
                setLoading(button, false);
            }
        });
    });

    // Edit Clinic
    $(document).on('click', '.edit-clinic', function() {
        const clinicId = $(this).data('id');
       
        $.ajax({
            url: '/clinic/' + clinicId,
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    const clinic = response.clinic;
                   
                    $('#edit_clinic_id').val(clinic.id);
                    $('#edit_clinic_name').val(clinic.clinic_name);
                    $('#edit_clinic_phone').val(clinic.phone);
                    $('#edit_clinic_fee').val(clinic.consultation_fee);
                   
                    if (clinic.address_type === 'map') {
                        setAddressType($('#editClinicModal'), 'map');
                        $('#editMapAddressInput').val(clinic.address);
                        $('#editMapAddressWrapper').show();
                        $('#editSelectedAddressText').text(clinic.address);
                        $('#editLatitude').val(clinic.latitude);
                        $('#editLongitude').val(clinic.longitude);
                        initializeEditMap(clinic.latitude, clinic.longitude);
                    } else {
                        setAddressType($('#editClinicModal'), 'manual');
                        $('#edit_clinic_address').val(clinic.address);
                    }
                   
                    $('#editClinicModal').modal('show');
                }
            },
            error: function() {
                showAlert('Error loading clinic details.', 'error');
            }
        });
    });

    // Update Clinic Form
    $('#editClinicForm').on('submit', function(e) {
        e.preventDefault();
        
        const type = $('#edit_address_type').val();
        if (type === 'manual') {
            const manualAddress = $('#edit_clinic_address').val().trim();
            if (!manualAddress) {
                showAlert('Please enter clinic address', 'error');
                return;
            }
        } else {
            const mapAddress = $('#editMapAddressInput').val().trim();
            const lat = $('#editLatitude').val();
            const lng = $('#editLongitude').val();
            
            if (!mapAddress || !lat || !lng) {
                showAlert('Please select a valid location from the map', 'error');
                return;
            }
        }
        
        const clinicId = $('#edit_clinic_id').val();
        const button = $('#updateClinicBtn');
        setLoading(button, true);
        
        const formData = new FormData(this);
        formData.append('_method', 'PUT');
        
        $.ajax({
            url: '/clinic/' + clinicId,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showAlert(response.message, 'success');
                    $('#editClinicModal').modal('hide');
                    location.reload();
                } else {
                    showAlert(response.message, 'error');
                }
            },
            error: function(xhr) {
                handleAjaxError(xhr, 'updating clinic');
            },
            complete: function() {
                setLoading(button, false);
            }
        });
    });

    // Delete Clinic
    $(document).on('click', '.delete-clinic', function() {
        deleteType = 'clinic';
        deleteId = $(this).data('id');
        $('#deleteMessage').text('Are you sure you want to delete this clinic? All associated schedules will be deleted.');
        $('#deleteConfirmationModal').modal('show');
    });

    // ==================== SCHEDULE MANAGEMENT ====================

    // Add Schedule Form
    $('#addScheduleForm').on('submit', function(e) {
        e.preventDefault();
       
        // Validate at least one day selected
        if ($('.day-checkbox:checked').length === 0) {
            showAlert('Please select at least one working day', 'error');
            return;
        }

        const is24Hours = $('#is_24_hours').is(':checked');
       
        if (!is24Hours) {
            // Validate at least one session is selected with times
            const selectedSessions = $('.session-checkbox:checked');
            if (selectedSessions.length === 0) {
                showAlert('Please select at least one session type and set timings', 'error');
                return;
            }
           
            // Validate each selected session has times
            let validSessions = true;
            selectedSessions.each(function() {
                const sessionType = $(this).val();
                const startTime = $(`.${sessionType}-start-time`).val();
                const endTime = $(`.${sessionType}-end-time`).val();
               
                if (!startTime || !endTime) {
                    showAlert(`Please set start and end time for ${sessionType} session`, 'error');
                    validSessions = false;
                    return false;
                }
            });
            if (!validSessions) return;
        }
       
        const button = $('#addScheduleBtn');
        setLoading(button, true);
       
        const formData = $(this).serialize();
       
        $.ajax({
            url: '{{ route("doctor.schedule.store") }}',
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    showAlert(response.message, 'success');
                    $('#addScheduleModal').modal('hide');
                    $('#addScheduleForm')[0].reset();
                    location.reload();
                } else {
                    showAlert(response.message, 'error');
                }
            },
            error: function(xhr) {
                handleAjaxError(xhr, 'adding schedule');
            },
            complete: function() {
                setLoading(button, false);
            }
        });
    });

    $(document).on('click', '.edit-schedule', function() {
        const scheduleId = $(this).data('id');
       
        $.ajax({
            url: '/schedule/' + scheduleId + '/edit',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    const schedule = response.schedule;
                   
                    $('#edit_schedule_id').val(schedule.id);
                    $('#edit_clinic_name').val(schedule.clinic.clinic_name);
                    $('#edit_day_of_week').val(schedule.day_of_week);
                    $('#edit_session_type').val(schedule.session_type);
                    $('#edit_max_patients').val(schedule.max_patients);
                   
                    $('#edit_is_24_hours').prop('checked', schedule.is_24_hours);
                   
                    if (schedule.is_24_hours) {
                        $('#edit_time_section').hide();
                    } else {
                        $('#edit_time_section').show();
                        $('#edit_start_time').val(schedule.start_time);
                        $('#edit_end_time').val(schedule.end_time);
                    }
                   
                    $('#editScheduleModal').modal('show');
                }
            },
            error: function() {
                showAlert('Error loading schedule details.', 'error');
            }
        });
    });

    // Update Schedule
    $('#editScheduleForm').on('submit', function(e) {
        e.preventDefault();
        const scheduleId = $('#edit_schedule_id').val();
        const button = $('#updateScheduleBtn');
        setLoading(button, true);
       
        $.ajax({
            url: '/schedule/' + scheduleId,
            type: 'PUT',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    showAlert(response.message, 'success');
                    $('#editScheduleModal').modal('hide');
                    location.reload();
                } else {
                    showAlert(response.message, 'error');
                }
            },
            error: function(xhr) {
                handleAjaxError(xhr, 'updating schedule');
            },
            complete: function() {
                setLoading(button, false);
            }
        });
    });

    // Delete Schedule
    $(document).on('click', '.delete-schedule', function() {
        deleteType = 'schedule';
        deleteId = $(this).data('id');
        $('#deleteMessage').text('Are you sure you want to delete this schedule?');
        $('#deleteConfirmationModal').modal('show');
    });

    // Confirm Delete
    $('#confirmDeleteBtn').click(function() {
        const button = $('#confirmDeleteBtn');
        setLoading(button, true);
        
        let url;
        if (deleteType === 'clinic') {
            url = '/clinic/' + deleteId;
        } else if (deleteType === 'schedule') {
            url = '/schedule/' + deleteId;
        }
        
        $.ajax({
            url: url,
            type: 'DELETE',
            data: {
                '_token': '{{ csrf_token() }}'
            },
            success: function(response) {
                if (response.success) {
                    showAlert(response.message, 'success');
                    $('#deleteConfirmationModal').modal('hide');
                    location.reload();
                } else {
                    showAlert(response.message, 'error');
                }
            },
            error: function(xhr) {
                handleAjaxError(xhr, 'deleting ' + deleteType);
            },
            complete: function() {
                setLoading(button, false);
            }
        });
    });

    // View Clinic Details
    $(document).on('click', '.view-clinic', function() {
        const clinicId = $(this).data('id');
       
        $.ajax({
            url: '/schedule/' + clinicId,
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    let html = generateClinicScheduleHTML(response);
                    $('#clinicScheduleDetails').html(html);
                    $('#viewClinicModal').modal('show');
                }
            },
            error: function() {
                showAlert('Error loading clinic details.', 'error');
            }
        });
    });


    $(document).on('change', '.session-checkbox', function() {
        const sessionType = $(this).val();
        const timeFields = $('#' + sessionType + '_time_fields');
       
        if ($(this).is(':checked')) {
            timeFields.slideDown();
        } else {
            timeFields.slideUp();
        }
    });

    $('#is_24_hours').change(function() {
        if ($(this).is(':checked')) {
            $('#sessionTimingSection').hide();
            $('#info24Hours').show();
            $('.session-checkbox').prop('checked', false);
            $('.session-time-fields').hide();
        } else {
            $('#sessionTimingSection').show();
            $('#info24Hours').hide();
        }
    });

    $('#enable_interval').change(function() {
        if ($(this).is(':checked')) {
            $('#interval_input_section').slideDown();
        } else {
            $('#interval_input_section').slideUp();
            // Optional: reset values
            // $('#interval_input_section input').val('');
        }
    });

    $('#edit_is_24_hours').change(function() {
        if ($(this).is(':checked')) {
            $('#edit_time_section').hide();
        } else {
            $('#edit_time_section').show();
        }
    });

    $('#edit_enable_interval').change(function() {
        if ($(this).is(':checked')) {
            $('#edit_interval_input_section').slideDown();
        } else {
            $('#edit_interval_input_section').slideUp();
        }
    });


    function initializeTimepicker() {
        $(document).on('click', '.timepicker', function() {
            currentTimeField = $(this);
            const currentTime = $(this).val();
            if (currentTime) {
                const [time, period] = currentTime.split(' ');
                let [hour, min] = time.split(':').map(Number);
                $('#hourSelect').val(hour);
                $('#minuteSelect').val(min);
                $('#timePeriodToggle').prop('checked', period === 'PM');
            } else {
                $('#hourSelect').val(12);
                $('#minuteSelect').val('00');
                $('#timePeriodToggle').prop('checked', false);
            }
            updateTimeDisplay();
            $('#timePickerModal').modal('show');
        });
    }

    function updateTimeDisplay() {
        const hour = $('#hourSelect').val();
        const minute = $('#minuteSelect').val();
        $('#selectedTime').text(`${hour}:${minute}`);
        const isPM = $('#timePeriodToggle').is(':checked');
        $('#periodDisplay').text(isPM ? 'PM' : 'AM');
    }

    $('#hourSelect, #minuteSelect, #timePeriodToggle').change(updateTimeDisplay);

    $('#confirmTime').click(function() {
        if (currentTimeField) {
            const hour = $('#hourSelect').val();
            const minute = $('#minuteSelect').val();
            const isPM = $('#timePeriodToggle').is(':checked');
            const time12 = `${hour}:${minute} ${isPM ? 'PM' : 'AM'}`;
            currentTimeField.val(time12);
            $('#timePickerModal').modal('hide');
        }
    });


    function initializeMap() {
        if (map) return;
        geocoder = new google.maps.Geocoder();
        map = new google.maps.Map(document.getElementById('addressMap'), {
            center: {lat: -34.397, lng: 150.644},
            zoom: 8
        });
        marker = new google.maps.Marker({
            map: map,
            draggable: true
        });
        const searchBox = new google.maps.places.SearchBox(document.getElementById('mapSearch'));
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('mapSearch'));
        map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds());
        });
        searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length == 0) return;
            const place = places[0];
            if (!place.geometry) return;
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(17);
            }
            marker.setPosition(place.geometry.location);
            updateAddress(place.geometry.location);
        });
        marker.addListener('dragend', () => {
            updateAddress(marker.getPosition());
        });
        $('#useCurrentLocation').click(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(pos);
                    map.setZoom(17);
                    marker.setPosition(pos);
                    updateAddress(pos);
                }, () => {
                    showAlert('Error getting current location', 'error');
                });
            }
        });
        $('#addressMap').show();
    }

    function updateAddress(position) {
        $('#mapAddressWrapper').fadeIn();
        $('#selectedAddressText').text('Loading address...');
        geocoder.geocode({location: position}, (results, status) => {
            if (status === 'OK') {
                if (results[0]) {
                    const address = results[0].formatted_address;
                    $('#mapAddressInput').val(address);
                    $('#selectedAddressText').text(address);
                } else {
                    const fallback = `Map Location: ${position.lat().toFixed(6)}, ${position.lng().toFixed(6)}`;
                    $('#mapAddressInput').val(fallback);
                    $('#selectedAddressText').text(fallback);
                }
            } else {
                const fallback = `Map Location: ${position.lat().toFixed(6)}, ${position.lng().toFixed(6)}`;
                $('#mapAddressInput').val(fallback);
                $('#selectedAddressText').text(fallback);
                console.warn('Geocode was not successful: ' + status);
            }
            $('#latitude').val(position.lat().toFixed(6));
            $('#longitude').val(position.lng().toFixed(6));
        });
    }

    function initializeEditMap(lat, lng) {
        if (editMap) return;
        editGeocoder = new google.maps.Geocoder();
        editMap = new google.maps.Map(document.getElementById('editAddressMap'), {
            center: {lat: parseFloat(lat), lng: parseFloat(lng)},
            zoom: 8
        });
        editMarker = new google.maps.Marker({
            map: editMap,
            position: {lat: parseFloat(lat), lng: parseFloat(lng)},
            draggable: true
        });
        const searchBox = new google.maps.places.SearchBox(document.getElementById('editMapSearch'));
        editMap.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('editMapSearch'));
        editMap.addListener('bounds_changed', () => {
            searchBox.setBounds(editMap.getBounds());
        });
        searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length == 0) return;
            const place = places[0];
            if (!place.geometry) return;
            if (place.geometry.viewport) {
                editMap.fitBounds(place.geometry.viewport);
            } else {
                editMap.setCenter(place.geometry.location);
                editMap.setZoom(17);
            }
            editMarker.setPosition(place.geometry.location);
            updateEditAddress(place.geometry.location);
        });
        editMarker.addListener('dragend', () => {
            updateEditAddress(editMarker.getPosition());
        });
        $('#editUseCurrentLocation').click(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    editMap.setCenter(pos);
                    editMap.setZoom(17);
                    editMarker.setPosition(pos);
                    updateEditAddress(pos);
                }, () => {
                    showAlert('Error getting current location', 'error');
                });
            }
        });
        $('#editAddressMap').show();
    }

    function updateEditAddress(position) {
        $('#editMapAddressWrapper').fadeIn();
        $('#editSelectedAddressText').text('Loading address...');
        editGeocoder.geocode({location: position}, (results, status) => {
            if (status === 'OK') {
                if (results[0]) {
                    const address = results[0].formatted_address;
                    $('#editMapAddressInput').val(address);
                    $('#editSelectedAddressText').text(address);
                } else {
                    const fallback = `Map Location: ${position.lat().toFixed(6)}, ${position.lng().toFixed(6)}`;
                    $('#editMapAddressInput').val(fallback);
                    $('#editSelectedAddressText').text(fallback);
                }
            } else {
                const fallback = `Map Location: ${position.lat().toFixed(6)}, ${position.lng().toFixed(6)}`;
                $('#editMapAddressInput').val(fallback);
                $('#editSelectedAddressText').text(fallback);
                console.warn('Geocode was not successful: ' + status);
            }
            $('#editLatitude').val(position.lat().toFixed(6));
            $('#editLongitude').val(position.lng().toFixed(6));
        });
    }


    function generateClinicScheduleHTML(response) {
        const clinic = response.clinic;
        const schedules = response.schedules || {};
       
        let html = '<div class="clinic-info mb-4 p-3 bg-light rounded">';
        html += '<h5 class="fw-bold text-primary">' + clinic.clinic_name + '</h5>';
        let displayAddress = clinic.address;
        if (displayAddress && displayAddress.includes('Map Location:')) {
            displayAddress = 'Location: ' + clinic.clinic_name;
        }
        html += '<p class="text-muted mb-1"><i class="ti ti-map-pin me-2"></i>' + displayAddress + '</p>';
        html += '<p class="text-muted mb-1"><i class="ti ti-phone me-2"></i>' + clinic.phone + '</p>';
        html += '<p class="text-muted mb-0"><i class="ti ti-currency-rupee me-2"></i>Consultation Fee: ₹' + clinic.consultation_fee + '</p>';
        html += '</div>';
       
        html += '<h6 class="fw-bold mb-3 border-bottom pb-2">Weekly Schedule</h6>';
       
        if (Object.keys(schedules).length === 0) {
            html += '<div class="text-center py-4"><i class="ti ti-calendar-off fs-48 text-muted mb-3"></i><p class="text-muted">No schedules found for this clinic.</p></div>';
        } else {
            const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayNames = {
                'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
                'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
            };
           
            daysOrder.forEach(function(day) {
                const daySchedules = schedules[day] || [];
                if (daySchedules.length > 0) {
                    html += `<div class="day-header mt-3">${dayNames[day]}</div>`;
                   
                    daySchedules.forEach(function(schedule) {
                        const sessionClass = 'session-' + schedule.session_type;
                       
                        html += `<div class="card mb-2">
                            <div class="card-body py-2">
                                <div class="row align-items-center">
                                    <div class="col-md-2">
                                        <span class="session-badge ${sessionClass}">${schedule.session_type}</span>
                                    </div>
                                    <div class="col-md-3">
                                        ${schedule.is_24_hours ? 
                                            '<span class="badge bg-success">24 Hours</span>' : 
                                            `${schedule.start_time} - ${schedule.end_time}`}
                                    </div>
                                    <div class="col-md-2">
                                        Max: ${schedule.max_patients} patients
                                    </div>
                                    <div class="col-md-2">
                                        Duration: ${schedule.duration_hours}h ${schedule.duration_minutes}m
                                    </div>
                                    <div class="col-md-3 text-end">
                                        <button class="btn btn-sm btn-outline-danger delete-schedule" data-id="${schedule.id}">
                                            <i class="ti ti-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    });
                }
            });
        }
       
        return html;
    }

    function handleAjaxError(xhr, action) {
        const response = xhr.responseJSON;
        if (response && response.errors) {
            let errorMessage = 'Please fix the following errors:';
            Object.values(response.errors).forEach(error => {
                errorMessage += `\n• ${error[0]}`;
            });
            showAlert(errorMessage, 'error');
        } else {
            showAlert(`Error ${action}. Please try again.`, 'error');
        }
    }

    function setLoading(button, isLoading) {
        const spinner = button.find('.loading-spinner');
        if (isLoading) {
            spinner.show();
            button.prop('disabled', true);
        } else {
            spinner.hide();
            button.prop('disabled', false);
        }
    }

    initializeTimepicker();
});
</script>


<script>
$(document).ready(function() {
    $('#langHindi').click(function() {
        $(this).addClass('active');
        $('#langEnglish').removeClass('active');
        $('#hindiContent').show();
        $('#englishContent').hide();
    });
    
    $('#langEnglish').click(function() {
        $(this).addClass('active');
        $('#langHindi').removeClass('active');
        $('#englishContent').show();
        $('#hindiContent').hide();
    });
    
    $('#videoTutorialBtn').click(function() {
        window.open('https://your-tutorial-video-link.com', '_blank');
    });
    
    $('.clinic-help-btn').click(function() {
        var clinicName = $(this).data('clinic-name');
        $('#helpGuideModal').on('shown.bs.modal', function() {
        });
    });
});
</script>

@endsection