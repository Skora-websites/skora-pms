@extends('layouts.layout-doctor')
@section('title', 'Doctor || Patient Registration')
@section('content')
    <div class="main-wrapper">
        <div class="modal fade" id="searchModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content bg-transparent">
                    <div class="card shadow-none mb-0">
                        <div class="px-3 py-2 d-flex flex-row align-items-center" id="search-top">
                            <i class="ti ti-search fs-22"></i>
                            <input type="search" class="form-control border-0" placeholder="Search">
                            <button type="button" class="btn p-0" data-bs-dismiss="modal" aria-label="Close"><i
                                    class="ti ti-x fs-22"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="page-wrapper">
            <div class="content">
                <div>
                    <h4 class="fw-bold mb-3 color-doctorrx">Patient Registration</h4>
                </div>
                <div class="row g-3 mb-3">

                    <!-- LEFT SECTION -->
                    <div class="col-12 col-lg-8">
                        <div class="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2">
                            <div class="w-100 w-lg-auto d-none d-md-block">
                                <div class="input-icon-start position-relative">
                                    <span class="input-icon-addon text-dark">
                                        <i class="ti ti-calendar-event"></i>
                                    </span>
                                    <input type="text" class="form-control form-control-sm date-input bookingrange w-100"
                                        value="Select Date Range">
                                </div>
                            </div>
                            <div class="w-100">
                                <input type="text" id="searchName" class="form-control form-control-sm"
                                    placeholder="Search by Name">
                            </div>
                            <div class="w-100">
                                <input type="text" id="searchPhone" class="form-control form-control-sm"
                                    placeholder="Search by Phone">
                            </div>

                        </div>
                    </div>

                    <div class="col-12 col-lg-4">
                        <div
                            class="d-flex flex-row flex-lg-row 
                        justify-content-between justify-content-lg-end 
                        gap-2">
                            <div class="dropdown w-50 w-lg-auto">
                                <a href="javascript:void(0);"
                                    class="btn btn-md fs-14 fw-normal border bg-white rounded text-dark w-100 p-2"
                                    data-bs-toggle="dropdown">
                                    Export <i class="ti ti-chevron-down ms-1"></i>
                                </a>
                                <ul class="dropdown-menu p-2">
                                    <li><a class="dropdown-item" href="{{ route('export.users') }}">Download as Excel</a>
                                    </li>
                                </ul>
                            </div>
                            <a href="javascript:void(0);" class="btn btn-primary fs-13 btn-md w-50 w-lg-auto"
                                data-bs-toggle="modal" data-bs-target="#addModal">
                                <i class="ti ti-plus me-1"></i> New Registration
                            </a>

                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="table datatable table-responsive text-nowrap">
                        <table class="table" id="dataTable">
                            <thead class="table-light">
                                <tr>

                                    <th class="no-sort">Date & Time</th>
                                    <th>Patient</th>
                                    <th>Patient ID</th>
                                    <th>Age</th>
                                    <th>State</th>
                                    @can('appointments-create')
                                    <th>Book Appointment</th>
                                    @endcan
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="patientTableBody">
    @foreach ($patients as $patient)
        <tr>
            <td>{{ $patient->created_at->format('d M Y - h:i A') }}</td>
            <td>
                <div class="d-flex align-items-center">
                    <a href="{{ route('doctor.patient-details', $patient->id) }}" 
                       class="avatar avatar-md me-2">
                        @php
                            $profileImage = $patient->profile_photo_path 
                                ? asset($patient->profile_photo_path)
                                : asset('assets-doctor/img/profiles/avatar-01.jpg');
                        @endphp
                        <img src="{{ $profileImage }}"
                             alt="{{ $patient->name }}" class="rounded-circle">
                    </a>
                    <a href="{{ route('doctor.patient-details', $patient->id) }}"
                       class="text-dark fw-semibold patient-hover">
                        {{ $patient->name }}
                        <span class="text-body fs-13 fw-normal d-block">{{ $patient->phone }}</span>
                    </a>
                </div>
            </td>
            <td>{{ $patient->registration_id ?? '' }}</td>
            <td>{{ $patient->dob ? \Carbon\Carbon::parse($patient->dob)->age : 'N/A' }} years</td>
            <td>{{ $patient->state ?? 'N/A' }}</td>
            @can('appointments-create')
            <td>
                <a href="{{ route('book-appointment', ['patient_id' => $patient->id]) }}" 
                   class="btn btn-sm btn-outline-primary">
                    Book Appointment
                </a>
            </td>
            @endcan
            <td>
                <div class="dropdown">
                    <a href="#" class="text-muted" role="button"
                       id="dropdownMenuButton{{ $patient->id }}" data-bs-toggle="dropdown"
                       aria-expanded="false">
                        <i class="ti ti-dots-vertical"></i>
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton{{ $patient->id }}">
                        <li>
                            <a class="dropdown-item" href="javascript:void(0);" 
                               onclick="editPatient({{ $patient->id }})">
                                Edit
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="{{ route('doctor.patient-details', $patient->id) }}">
                                View Details
                            </a>
                        </li>
                        @can('appointments-create')
                        <li>
                            <a class="dropdown-item" href="{{ route('book-appointment', ['patient_id' => $patient->id]) }}">
                                Book Appointment
                            </a>
                        </li>
                        @endcan
                        {{-- <li>
                            <a class="dropdown-item" href="{{ route('home-visit.create', ['patient_id' => $patient->id]) }}">
                                Schedule Home Visit
                            </a>
                        </li> --}}
                    </ul>
                </div>
            </td>
        </tr>
    @endforeach
</tbody>
                        </table>
                        <div class="d-flex justify-content-end mt-4" id="pagination">
                            {{ $patients->links('pagination::bootstrap-5') }}
                        </div>
                    </div>
                </div>
            </div>
        </div>


        <div class="modal fade" id="addModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
            aria-labelledby="addModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header rounded card-header ">
                        <h4 class="modal-title fw-bold" id="addModalLabel">Patient Registration Form</h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addForm">
                            @csrf
                            <div class="row">
                                <div class="row">
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Referred by</label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-user"></i></div>
                                            <input type="text" class="form-control" placeholder="Referred by"
                                                name="referred_by">
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Enter name <span
                                                class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <div class="input-group-text p-0" style="min-width: 65px;">
                                                <select class="form-select border-0 bg-transparent" name="salutation" style="box-shadow: none;">
                                                    @foreach ($salutations as $salutation)
                                                        <option value="{{ $salutation->value }}">{{ $salutation->value }}</option>
                                                    @endforeach
                                                </select>
                                            </div>
                                            <input type="text" class="form-control" placeholder="Full Name"
                                                name="name" required>
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Enter email</label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-mail"></i></div>
                                            <input type="email" class="form-control" placeholder="Email address"
                                                name="email" pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                                title="Enter a valid email address">
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Gender <span class="text-danger">*</span></label>
                                        <div class="btn-group w-100" role="group" aria-label="Gender">
                                            <input type="radio" class="btn-check gender-option" name="gender"
                                                id="add-male" value="Male" required>
                                            <label class="btn btn-outline-primary p-2" for="add-male">Male</label>
                                            <input type="radio" class="btn-check gender-option" name="gender"
                                                id="add-female" value="Female">
                                            <label class="btn btn-outline-primary p-2" for="add-female">Female</label>
                                            <input type="radio" class="btn-check gender-option" name="gender"
                                                id="add-other" value="Other">
                                            <label class="btn btn-outline-primary p-2" for="add-other">Other</label>
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Mobile Number <span
                                                class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-phone"></i></div>
                                            <input type="tel" class="form-control" placeholder="Mobile Number"
                                                minlength="10" maxlength="10" name="phone" required
                                                pattern="[\+]?[0-9]{10,15}"
                                                title="Enter a valid phone number (10-15 digits, optional +)">
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">DOB (to calculate age in years) <span
                                                class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-calendar"></i></div>
                                            <input type="date" class="form-control" placeholder="DOB" name="dob"
                                                required>
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Aadhaar Card Number</label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-id"></i></div>
                                            <input type="text" class="form-control" placeholder="12 Digit Aadhaar No"
                                                name="aadhaar_no" minlength="12" maxlength="12" pattern="\d{12}">
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Profile Photo</label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-camera"></i></div>
                                            <input type="file" class="form-control" name="profile_photo" accept="image/*">
                                        </div>
                                    </div>
                                    <div class="col-lg-12 mb-2">
                                        <label class="form-label fs-14">Address <span class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-map-pin"></i></div>
                                            <input id="add_address" type="text" class="form-control" placeholder="Search Address" name="address" required autocomplete="off">
                                        </div>
                                        <div id="add_photon_results" class="photon-results-container"></div>
                                    </div>
                                </div>
                                <div class="col-12 mb-3">
                                    <span type="button"
                                        class="btn-link text-decoration-underline toggle-address-details">Add
                                        Details</span>
                                </div>
                                <div class="address-details" style="display: none;">
                                    <h5 class="mb-3">Address Details</h5>
                                    <div class="row">
                                        <div class="col-12 col-lg-6 mb-2">
                                            <label class="form-label fs-14">Pincode</label>
                                            <div class="input-group">
                                                <div class="input-group-text"><i class="ti ti-map-pin"></i></div>
                                                <input id="add_pincode" type="text" class="form-control" placeholder="Pincode"
                                                    name="pincode">
                                            </div>
                                        </div>
                                        <div class="col-12 col-lg-6 mb-2">
                                            <label class="form-label fs-14">City</label>
                                            <div class="input-group">
                                                <div class="input-group-text"><i class="ti ti-building"></i></div>
                                                <input id="add_city" type="text" class="form-control" placeholder="City"
                                                    name="city">
                                            </div>
                                        </div>
                                        <div class="col-12 col-lg-6 mb-2">
                                            <label class="form-label fs-14">State</label>
                                            <div class="input-group">
                                                <div class="input-group-text"><i class="ti ti-map"></i></div>
                                                <input id="add_state" type="text" class="form-control" placeholder="State"
                                                    name="state">
                                            </div>
                                        </div>
                                        <div class="col-12 col-lg-6 mb-2">
                                            <label class="form-label fs-14">Street Address</label>
                                            <div class="input-group">
                                                <div class="input-group-text"><i class="ti ti-road-sign"></i></div>
                                                <input id="add_street_address" type="text" class="form-control" placeholder="Street Address"
                                                    name="street_address">
                                                <input type="hidden" id="add_latitude" name="latitude">
                                                <input type="hidden" id="add_longitude" name="longitude">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-12 mt-3 d-flex justify-content-end gap-2">
                                <button type="submit" class="btn btn-md btn-primary submit-btn" style="font-size:15px;">
                                    Add Patient
                                </button>
                                <button type="button" class="btn btn-md btn-dark" data-bs-dismiss="modal"
                                    style="font-size:15px;">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        <div class="modal fade" id="editModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
            aria-labelledby="editModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header rounded card-header bg-doctor-x">
                        <h4 class="modal-title fw-bold text-white" id="editModalLabel">Edit Patient</h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editForm">
                            @csrf
                            <input type="hidden" name="id" id="editPatientId">
                            <!-- Same form fields as add -->
                            <div class="row">
                                <div class="row">
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Referred by </label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-user"></i></div>
                                            <input type="text" class="form-control" placeholder="Referred by"
                                                name="referred_by">
                                        </div>
                                    </div>
                                    <!-- Name -->
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Enter name <span
                                                class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <div class="input-group-text p-0" style="min-width: 65px;">
                                                <select class="form-select border-0 bg-transparent" name="salutation" id="edit_salutation" style="box-shadow: none;">
                                                    @foreach ($salutations as $salutation)
                                                        <option value="{{ $salutation->value }}">{{ $salutation->value }}</option>
                                                    @endforeach
                                                </select>
                                            </div>
                                            <input type="text" class="form-control" placeholder="Full Name"
                                                name="name" required>
                                        </div>
                                    </div>
                                    <!-- Email -->
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Enter email</label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-mail"></i></div>
                                            <input type="email" class="form-control" placeholder="Email address"
                                                name="email" pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                                title="Enter a valid email address">
                                        </div>
                                    </div>
                                    <!-- Edit Modal Gender -->
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Gender <span class="text-danger">*</span></label>
                                        <div class="btn-group w-100" role="group" aria-label="Gender">
                                            <input type="radio" class="btn-check gender-option" name="gender"
                                                id="edit-male" value="Male" required>
                                            <label class="btn btn-outline-primary p-2" for="edit-male">Male</label>

                                            <input type="radio" class="btn-check gender-option" name="gender"
                                                id="edit-female" value="Female">
                                            <label class="btn btn-outline-primary p-2" for="edit-female">Female</label>

                                            <input type="radio" class="btn-check gender-option" name="gender"
                                                id="edit-other" value="Other">
                                            <label class="btn btn-outline-primary p-2" for="edit-other">Other</label>
                                        </div>
                                    </div>
                                    <!-- Mobile -->
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Mobile Number <span
                                                class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-phone"></i></div>
                                            <input type="tel" class="form-control" placeholder="Mobile Number"
                                                name="phone" minlength="10" maxlength="10" required
                                                pattern="[\+]?[0-9]{10,15}"
                                                title="Enter a valid phone number (10-15 digits, optional +)">
                                        </div>
                                    </div>
                                    <!-- Date of Birth -->
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">DOB (to calculate age in years) <span
                                                class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-calendar"></i></div>
                                            <input type="date" class="form-control" placeholder="DOB" name="dob"
                                                required>
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Aadhaar Card Number</label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-id"></i></div>
                                            <input type="text" class="form-control" placeholder="12 Digit Aadhaar No"
                                                name="aadhaar_no" minlength="12" maxlength="12" pattern="\d{12}">
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-6 mb-2">
                                        <label class="form-label fs-14">Profile Photo</label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-camera"></i></div>
                                            <input type="file" class="form-control" name="profile_photo" accept="image/*">
                                        </div>
                                    </div>
                                    <!-- Address -->
                                    <div class="col-lg-12 mb-2">
                                        <label class="form-label fs-14">Address <span class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="ti ti-map-pin"></i></div>
                                            <input id="edit_address" type="text" class="form-control" placeholder="Search Address" name="address" required autocomplete="off">
                                        </div>
                                        <div id="edit_photon_results" class="photon-results-container"></div>
                                    </div>
                                </div>

                                <div class="col-12 mb-3">
                                    <span type="button"
                                        class="btn-link text-decoration-underline toggle-address-details">Add
                                        Details</span>
                                </div>

                                <div class="address-details" style="display: none;">
                                    <h5 class="mb-3">Address Details</h5>
                                    <div class="row">
                                        <!-- Pincode -->
                                        <div class="col-12 col-lg-6 mb-2">
                                            <label class="form-label fs-14">Pincode</label>
                                            <div class="input-group">
                                                <div class="input-group-text"><i class="ti ti-map-pin"></i></div>
                                                <input id="edit_pincode" type="text" class="form-control" placeholder="Pincode"
                                                    name="pincode">
                                            </div>
                                        </div>
                                        <!-- City -->
                                        <div class="col-12 col-lg-6 mb-2">
                                            <label class="form-label fs-14">City</label>
                                            <div class="input-group">
                                                <div class="input-group-text"><i class="ti ti-building"></i></div>
                                                <input id="edit_city" type="text" class="form-control" placeholder="City"
                                                    name="city">
                                            </div>
                                        </div>
                                        <!-- State -->
                                        <div class="col-12 col-lg-6 mb-2">
                                            <label class="form-label fs-14">State</label>
                                            <div class="input-group">
                                                <div class="input-group-text"><i class="ti ti-map"></i></div>
                                                <input id="edit_state" type="text" class="form-control" placeholder="State"
                                                    name="state">
                                            </div>
                                        </div>
                                        <!-- Street Address -->
                                        <div class="col-12 col-lg-6 mb-2">
                                            <label class="form-label fs-14">Street address</label>
                                            <div class="input-group">
                                                <div class="input-group-text"><i class="ti ti-road-sign"></i></div>
                                                <input id="edit_street_address" type="text" class="form-control" placeholder="Street address"
                                                    name="street_address">
                                                <input type="hidden" id="edit_latitude" name="latitude">
                                                <input type="hidden" id="edit_longitude" name="longitude">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-lg-12 mt-3 d-flex justify-content-end gap-2">
                                <button type="submit" class="btn btn-md btn-primary submit-btn"
                                    style="font-size:15px;">Update Patient</button>
                                <button type="button" class="btn btn-md btn-dark" data-bs-dismiss="modal"
                                    style="font-size:15px;">
                                    Cancel
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>


        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js"></script>


        <script>
            $(document).ready(function() {
                // Check if we should open the registration modal automatically
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('register')) {
                    $('#addModal').modal('show');
                }

                // Initialize Date Range Picker
                $('.bookingrange').daterangepicker({
                    opens: 'right',
                    autoApply: false,
                    alwaysShowCalendars: true,
                    autoUpdateInput: false,
                    showDropdowns: true,
                    locale: {
                        format: 'DD MMM YYYY'
                    },
                    ranges: {
                        'Till Date': [moment("2000-01-01"), moment()],
                        'Today': [moment(), moment()],
                        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                        'Custom Range': []
                    }
                }, function(start, end, label) {
                    $('.bookingrange').val(start.format('DD MMM YYYY') + ' - ' + end.format('DD MMM YYYY'));
                    filterData(start.format('YYYY-MM-DD'), end.format(
                    'YYYY-MM-DD')); // Call filter function with dates
                });

                // Toggle Address Details
                $(document).on('click', '.toggle-address-details', function() {
                    let details = $(this).closest('.modal-body').find('.address-details');
                    if (details.is(':hidden')) {
                        details.show();
                        $(this).text('Hide Details');
                    } else {
                        details.hide();
                        $(this).text('Add Details');
                    }
                });

                // Handle Edit Patient Click (Fetch Data for Edit Modal)
                $(document).on('click', '.edit-patient', function() {
                    let id = $(this).data('id');
                    $.ajax({
                        url: '{{ route('patients.show', ':id') }}'.replace(':id', id),
                        type: 'GET',
                        success: function(response) {
                            if (response.success) {
                                let patient = response.data;
                                $('#editPatientId').val(patient.id);
                                $('#editForm [name="salutation"]').val(patient.salutation || 'Mr.');
                                $('#editForm [name="referred_by"]').val(patient.referred_by);
                                $('#editForm [name="name"]').val(patient.name);
                                $('#editForm [name="email"]').val(patient.email);
                                $('#editForm [name="phone"]').val(patient.phone);
                                $('#editForm [name="dob"]').val(patient.dob);
                                $('#editForm [name="aadhaar_no"]').val(patient.aadhaar_no);
                                $('#editForm [name="address"]').val(patient.address);
                                $('#editForm [name="pincode"]').val(patient.pincode);
                                $('#editForm [name="city"]').val(patient.city);
                                $('#editForm [name="state"]').val(patient.state);
                                $('#editForm [name="street_address"]').val(patient.street_address);

                                // Set gender radio button dynamically
                                $('#editForm .gender-option').prop('checked',
                                false); // Uncheck all first
                                if (patient.gender) {
                                    $('#editForm [id="edit-' + patient.gender.toLowerCase() + '"]')
                                        .prop('checked', true);
                                }

                                let editDetails = $('#editModal .address-details');
                                let editToggle = $('#editModal .toggle-address-details');
                                if (patient.pincode || patient.city || patient.state || patient
                                    .street_address) {
                                    editDetails.show();
                                    editToggle.text('Hide Details');
                                } else {
                                    editDetails.hide();
                                    editToggle.text('Add Details');
                                }
                                $('#editModal').modal('show');
                            } else {
                                showAlert(response.message, 'error');
                            }
                        },
                        error: function(xhr) {
                            showAlert('Error fetching patient details.', 'error');
                        }
                    });
                });

                // Handle Add Form Submission
                $('#addForm').submit(function(e) {
                    e.preventDefault();
                    let formData = new FormData($(this)[0]);
                    let url = '{{ route('patients.store') }}';
                    submitForm($(this), url, 'POST', formData);
                });

                // Handle Edit Form Submission
                $('#editForm').submit(function(e) {
                    e.preventDefault();
                    let formData = new FormData($(this)[0]);
                    formData.append('_method', 'PUT'); // For spoofing PUT request with FormData
                    let id = $('#editPatientId').val();
                    let url = '{{ route('patients.update', ':id') }}'.replace(':id', id);
                    submitForm($(this), url, 'POST', formData); // Use POST with _method=PUT
                });

                // Common Submit Function
                function submitForm(form, url, method, formData) {
                    $.ajax({
                        url: url,
                        type: method,
                        data: formData,
                        processData: false,
                        contentType: false,
                        headers: {
                            'X-CSRF-TOKEN': $('input[name="_token"]').val()
                        },
                        beforeSend: function() {
                            form.find('.submit-btn').html(
                                '<i class="fas fa-spinner fa-spin"></i> Processing...');
                        },
                        success: function(response) {
                            if (response.success) {
                                form.closest('.modal').modal('hide');
                                form[0].reset();
                                form.closest('.modal-body').find('.address-details').hide();
                                form.closest('.modal-body').find('.toggle-address-details').text(
                                    'Add Details');
                                filterData();
                                showAlert(response.message, 'success');

                                const urlParams = new URLSearchParams(window.location.search);
                                if (urlParams.get('redirect_to') === 'book-appointment' && response.patient_id) {
                                    let returnUrl = '{{ route('book-appointment') }}?patient_id=' + response.patient_id;
                                    if (urlParams.has('date')) returnUrl += '&date=' + urlParams.get('date');
                                    if (urlParams.has('time')) returnUrl += '&time=' + encodeURIComponent(urlParams.get('time'));
                                    window.location.href = returnUrl;
                                    return;
                                }
                            } else {
                                showAlert(response.message, 'error');
                            }
                        },
                        error: function(xhr) {
                            let errorMsg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON
                                .message : 'An error occurred.';
                            showAlert(errorMsg, 'error');
                        },
                        complete: function() {
                            form.find('.submit-btn').html(method === 'POST' ? 'Add Patient' :
                                'Update Patient');
                        }
                    });
                }

                let filterTimer;
                $('#searchName, #searchPhone').on('keyup', function() {
                    clearTimeout(filterTimer);
                    filterTimer = setTimeout(filterData, 500);
                });

                // Filter Data Function
                function filterData(startDate = null, endDate = null, page = 1) {
                    let data = {
                        page: page
                    };
                    if (startDate && endDate) {
                        data.start_date = startDate;
                        data.end_date = endDate;
                    }
                    data.name = $('#searchName').val().trim();
                    data.phone = $('#searchPhone').val().trim();

                    $('#patientTableBody').html(
                        '<tr><td colspan="6"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>');
                    $('#pagination').html('');

                    $.ajax({
                        url: '{{ route('doctor.filter_patients') }}',
                        type: 'GET',
                        data: data,
                        timeout: 10000, // 10 seconds timeout
                        success: function(response) {
                            if (response.success) {
                                let html = '';
                                if (response.patients && response.patients.length > 0) {
                                    response.patients.forEach(function(patient) {
                                        let age = patient.dob ? (new Date().getFullYear() -
                                            new Date(patient.dob).getFullYear()) : '';
                                        html += `
                                    <tr>
                                        <td>${new Date(patient.created_at).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <a href="{{ url('doctors-patient-details', '') }}" class="avatar avatar-md me-2">
                                                    <img src="${patient.profile_photo_path ? '{{ asset('') }}' + patient.profile_photo_path : '{{ asset('assets-doctor/img/profiles/avatar-01.jpg') }}'}" alt="${patient.name}" class="rounded-circle">
                                                </a>
                                                <a href="{{ url('doctors-patient-details', '') }}/${patient.id}" class="text-dark fw-semibold">
                                                    ${patient.name}
                                                    <span class="text-body fs-13 fw-normal d-block">${patient.phone}</span>
                                                </a>
                                            </div>
                                        </td>
                                        <td>${patient.registration_id || ''}</td>
                                        <td>${age} years</td>
                                        <td>${patient.state || ''}</td>
                                        @can('appointments-create')
                                        <td><a href="{{ route('book-appointment') }}?patient_id=${patient.id}" class="btn btn-sm btn-outline-primary">Book Appointment</a></td>
                                        @endcan
                                        <td>
                                            <div class="dropdown">
                                                <a href="#" class="text-muted" role="button" id="dropdownMenuButton${patient.id}" data-bs-toggle="dropdown" aria-expanded="false">
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                    width="18"height="25"viewBox="0 0 24 24"fill="none"stroke="currentColor"stroke-width="2" stroke-linecap="round"
                                                    stroke-linejoin="round"class="view-icon"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/> <circle cx="12" cy="12" r="3"/>
                                                </svg>

                                                </a>
                                                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton${patient.id}">
                                                    <li><a class="dropdown-item edit-patient" href="javascript:void(0);" data-id="${patient.id}" data-bs-toggle="modal" data-bs-target="#editModal">Edit</a></li>
                                                    <li><a class="dropdown-item" href="{{ url('doctors-patient-details', '') }}/${patient.id}">View</a></li>
                                                    @can('appointments-create')
                                                    <li><a class="dropdown-item" href="{{ route('book-appointment') }}?patient_id=${patient.id}">Book Appointment</a></li>
                                                    @endcan
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>`;
                                    });
                                } else {
                                    '<tr><td colspan="8"> \
                                    <div class="card-body text-center py-5"> \
                                        <i class="ti ti-frown fs-48 text-muted mb-3"></i> \
                                        <h5 class="text-muted">No Patients Found</h5> \
                                        <p class="text-muted">You don’t have any scheduled appointments yet.</p> \
                                        <button data-bs-toggle="modal" data-bs-target="#addModal" type="button" class="btn btn-primary"> \
                                            <i class="ti ti-plus me-1"></i> Book First Appointment \
                                        </button> \
                                    </div> \
                                </td></tr>';

                                }
                                $('#patientTableBody').html(html);
                                $('#pagination').html(response.pagination.links);
                            } else {
                                $('#patientTableBody').html(
                                    '<tr><td colspan="6">No data available.</td></tr>');
                                showAlert(response.message, 'error');
                            }
                        },
                        error: function(xhr, status, error) {
                            console.log('Error Response:', xhr.responseText);
                            $('#patientTableBody').html(
                                '<tr><td colspan="6">Error loading data. Please try again.</td></tr>');
                            if (status === 'timeout') {
                                showAlert('Request timed out. Please try again.', 'error');
                            } else {
                                showAlert('An error occurred while filtering.', 'error');
                            }
                        }
                    });
                }

                $(document).on('click', '.pagination a', function(e) {
                    e.preventDefault();
                    let url = new URL($(this).attr('href'), window.location.origin);
                    let page = url.searchParams.get('page');
                    filterData(null, null, page);
                });

                $(document).ready(function() {
                    let $dateRange = $('.bookingrange');
                    if ($dateRange.val() !== 'Select Date Range') {
                        let dates = $dateRange.val().split(' - ');
                        filterData(dates[0], dates[1]);
                    } else {
                        filterData();
                    }
                    $('.bookingrange').on('apply.daterangepicker', function(ev, picker) {
                        filterData(picker.startDate.format('YYYY-MM-DD'), picker.endDate.format(
                            'YYYY-MM-DD'));
                        filterData();
                    });
                    let debounceTimer;
                    $('#searchName, #searchPhone').on('keyup', function() {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => {
                            filterData();
                        }, 300);
                    });
                });

                filterData();
            });
        </script>

        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const menuToggles = document.querySelectorAll('.menu-toggle');
                menuToggles.forEach(toggle => {
                    toggle.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        const menuItem = this.parentElement;
                        const subMenu = menuItem.querySelector('.menu-sub');

                        // Toggle active class
                        menuItem.classList.toggle('open');

                        // Toggle submenu visibility
                        if (subMenu) {
                            if (menuItem.classList.contains('open')) {
                                subMenu.style.display = 'block';
                            } else {
                                subMenu.style.display = 'none';
                            }
                        }
                    });
                });
                const activeSubmenuItem = document.querySelector('.menu-sub .menu-item.active');
                if (activeSubmenuItem) {
                    const parentMenu = activeSubmenuItem.closest('.menu-item');
                    parentMenu.classList.add('open');
                    activeSubmenuItem.closest('.menu-sub').style.display = 'block';
                }
        </script>

        <style>
            .pac-container { z-index: 10000 !important; }
            .photon-results-container {
                position: absolute; width: 100%; background: white; border: 1px solid #ccc;
                z-index: 10001; display: none; max-height: 200px; overflow-y: auto;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .photon-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; }
            .photon-item:last-child { border-bottom: none; }
            .photon-item:hover { background: #f0f0f0; }
            .photon-item .title { font-weight: bold; display: block; font-size: 13px; }
            .photon-item .subtitle { font-size: 11px; color: #777; }
        </style>

        <script src="https://maps.googleapis.com/maps/api/js?key={{ config('services.google.maps_api_key') }}&libraries=places"></script>
        <script>
            let autocompleteAdd, autocompleteEdit;

            function initAutocomplete() {
                const options = {
                    componentRestrictions: { country: "in" },
                    fields: ["address_components", "formatted_address", "geometry"],
                };

                const addInput = document.getElementById("add_address");
                const editInput = document.getElementById("edit_address");

                if (addInput && !addInput.dataset.autocompleteInitialized) {
                    autocompleteAdd = new google.maps.places.Autocomplete(addInput, options);
                    autocompleteAdd.addListener("place_changed", () => {
                        fillInAddress(autocompleteAdd, "add");
                    });
                    addInput.dataset.autocompleteInitialized = "true";
                }

                if (editInput && !editInput.dataset.autocompleteInitialized) {
                    autocompleteEdit = new google.maps.places.Autocomplete(editInput, options);
                    autocompleteEdit.addListener("place_changed", () => {
                        fillInAddress(autocompleteEdit, "edit");
                    });
                    editInput.dataset.autocompleteInitialized = "true";
                }
                
                // Add Photon fallback listeners
                setupPhotonFallback("add");
                setupPhotonFallback("edit");
            }

            function setupPhotonFallback(prefix) {
                let timeout = null;
                const inputId = "#" + prefix + "_address";
                const resultsId = "#" + prefix + "_photon_results";

                $(document).on('input', inputId, function() {
                    clearTimeout(timeout);
                    const $input = $(this);
                    const query = $input.val();
                    const $results = $(resultsId);

                    if (query.length < 3) {
                        $results.hide();
                        return;
                    }

                    timeout = setTimeout(() => {
                        // Show Photon if Google dropdown is NOT visible
                        const googleVisible = $('.pac-container:visible').length > 0;
                        if (!googleVisible) {
                            fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`)
                                .then(response => response.json())
                                .then(data => {
                                    $results.empty();
                                    if (data.features && data.features.length > 0) {
                                        data.features.forEach(feature => {
                                            const p = feature.properties;
                                            const label = [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(', ');
                                            const item = $(`<div class="photon-item">
                                                <span class="title">${p.name || p.street || 'Result'}</span>
                                                <span class="subtitle">${label}</span>
                                            </div>`);
                                            item.on('mousedown', function(e) { e.preventDefault(); }); // Prevent blur
                                            item.on('click', function() {
                                                $input.val(label);
                                                $results.hide();
                                                fillInFromPhoton(feature, prefix);
                                            });
                                            $results.append(item);
                                        });
                                        $results.show();
                                    } else {
                                        $results.hide();
                                    }
                                }).catch(err => console.error("Photon error:", err));
                        } else {
                            $results.hide();
                        }
                    }, 400);
                });

                $(document).on('click', function(e) {
                    if (!$(e.target).closest('.input-group, .photon-results-container').length) {
                        $('.photon-results-container').hide();
                    }
                });
            }

            function fillInFromPhoton(feature, prefix) {
                const p = feature.properties;
                const coords = feature.geometry.coordinates;
                
                document.getElementById(prefix + "_city").value = p.city || p.town || p.district || "";
                document.getElementById(prefix + "_state").value = p.state || "";
                document.getElementById(prefix + "_pincode").value = p.postcode || "";
                document.getElementById(prefix + "_street_address").value = (p.street || "") + (p.housenumber ? " " + p.housenumber : "");
                
                // Save coordinates (Photon returns [lng, lat])
                document.getElementById(prefix + "_latitude").value = coords[1];
                document.getElementById(prefix + "_longitude").value = coords[0];

                const modalBody = document.getElementById(prefix + "_address").closest('.modal-body');
                const details = $(modalBody).find('.address-details');
                const toggle = $(modalBody).find('.toggle-address-details');
                if (details.is(':hidden')) {
                    details.show();
                    toggle.text('Hide Details');
                }
            }

            function fillInAddress(autocomplete, prefix) {
                const place = autocomplete.getPlace();
                if (!place.address_components) return;

                let streetNumber = "";
                let route = "";
                let city = "";
                let state = "";
                let pincode = "";

                for (const component of place.address_components) {
                    const componentType = component.types[0];
                    switch (componentType) {
                        case "street_number": streetNumber = component.long_name; break;
                        case "route": route = component.short_name; break;
                        case "locality": case "postal_town": city = component.long_name; break;
                        case "administrative_area_level_1": state = component.long_name; break;
                        case "postal_code": pincode = component.long_name; break;
                    }
                }

                document.getElementById(prefix + "_address").value = place.formatted_address;
                document.getElementById(prefix + "_city").value = city;
                document.getElementById(prefix + "_state").value = state;
                document.getElementById(prefix + "_pincode").value = pincode;
                document.getElementById(prefix + "_street_address").value = (streetNumber ? streetNumber + " " : "") + route;
                
                if (place.geometry && place.geometry.location) {
                    document.getElementById(prefix + "_latitude").value = place.geometry.location.lat();
                    document.getElementById(prefix + "_longitude").value = place.geometry.location.lng();
                }

                const modalBody = document.getElementById(prefix + "_address").closest('.modal-body');
                const details = $(modalBody).find('.address-details');
                const toggle = $(modalBody).find('.toggle-address-details');
                if (details.is(':hidden')) {
                    details.show();
                    toggle.text('Hide Details');
                }
            }

            google.maps.event.addDomListener(window, 'load', initAutocomplete);
            $(document).on('shown.bs.modal', '#addModal, #editModal', function () {
                initAutocomplete();
            });
        </script>
    @endsection
