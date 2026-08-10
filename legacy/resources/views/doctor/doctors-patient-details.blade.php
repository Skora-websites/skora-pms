<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Patient Details</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">
    @include('doctor.inc.header-links')
</head>
<body>
    <div class="main-wrapper">
        @include('doctor.inc.header')
        @include('doctor.inc.sidebar')
        
        <div class="page-wrapper">
            <div class="content">
                <!-- Page Header -->
                <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
                    <div class="flex-grow-1">
                        <h4 class="fw-bold mb-0">Patient Details</h4>
                    </div>
                    <div class="text-end d-flex">
                        <div class="dropdown me-1">
                            <a href="javascript:void(0);" class="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center" data-bs-toggle="dropdown">
                                Export<i class="ti ti-chevron-down ms-2"></i>
                            </a>
                            <ul class="dropdown-menu p-2">
                                <li><a class="dropdown-item" href="#">Download as PDF</a></li>
                                <li><a class="dropdown-item" href="#">Download as Excel</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <!-- End Page Header -->

                <!-- Patient Card -->
                <div class="card">
                    <div class="row align-items-end">
                        <div class="col-xl-9 col-lg-8">
                            <div class="d-sm-flex align-items-center position-relative z-0 overflow-hidden p-3">
                                <img src="{{ asset('assets-doctor/img/icons/shape-01.svg') }}" alt="img" class="z-n1 position-absolute end-0 top-0 d-none d-lg-flex">
                                <a href="javascript:void(0);" class="avatar avatar-xxxl patient-avatar me-2 flex-shrink-0">
                                    <img src="{{ $patient->profile_photo_url ?? asset('assets-doctor/img/users/user-08.jpg') }}" alt="patient" class="rounded">
                                </a>
                                <div>
                                    <p class="text-primary mb-1">{{ $patient->registration_id ?? '#PT0000' }}</p>
                                    <h5 class="mb-1"><a href="javascript:void(0);" class="fw-bold">{{ $patient->name }}</a></h5>
                                    <p class="mb-3">{{ $patient->address ?? 'No address provided' }}</p>
                                    <div class="d-flex align-items-center flex-wrap">
                                        <p class="mb-0 d-inline-flex align-items-center"><i class="ti ti-phone me-1 text-dark"></i>Phone: <span class="text-dark ms-1">{{ $patient->phone ?? 'N/A' }}</span></p>
                                        <span class="mx-2 text-light">|</span>
                                        <p class="mb-0 d-inline-flex align-items-center"><i class="ti ti-calendar-time me-1 text-dark"></i>Last Visited: <span class="text-dark ms-1">{{ $latestAppointment ? $latestAppointment->date : 'N/A' }}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-lg-4">
                            <div class="p-3 text-lg-end">
                                <div class="mb-4">
                                    <a href="tel:{{ $patient->phone }}" class="btn btn-outline-primary shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14 me-2 text-dark"><i class="ti ti-phone "></i></a>
                                    <a href="javascript:void(0);" class="btn btn-outline-primary shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14 me-2 text-dark"><i class="ti ti-message-circle"></i></a>
                                </div>
                                @can('appointments-create')
                                <a href="{{ route('book-appointment') }}" class="btn btn-primary"><i class="ti ti-calendar-event me-1"></i>Book Appointment</a>
                                @endcan
                            </div>
                        </div>
                    </div>
                </div>
                <!-- End Patient Card -->

                <!-- About and Vital Signs -->
                <div class="row">
                    <div class="col-xl-5 d-flex">
                        <div class="card shadow-sm flex-fill w-100">
                            <div class="card-header">
                                <h5 class="fw-bold mb-0"><i class="ti ti-user-star me-1"></i>About</h5>
                            </div>
                            <div class="card-body pb-0">
                                <div class="row">
                                    <div class="col-sm-5">
                                        <div class="d-flex align-items-center mb-3">
                                            <span class="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2"><i class="ti ti-calendar-event fs-16"></i></span>
                                            <div>
                                                <h6 class="fs-13 fw-bold mb-1">DOB</h6>
                                                <p class="mb-0">{{ $patient->dob ?? 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-7">
                                        <div class="d-flex align-items-center mb-3">
                                            <span class="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2"><i class="ti ti-droplet fs-16"></i></span>
                                            <div>
                                                <h6 class="fs-13 fw-bold mb-1">Blood Group</h6>
                                                <p class="mb-0">{{ $latestAppointment->blood_group ?? 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-5">
                                        <div class="d-flex align-items-center mb-3">
                                            <span class="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2"><i class="ti ti-gender-male fs-16"></i></span>
                                            <div>
                                                <h6 class="fs-13 fw-bold mb-1">Gender</h6>
                                                <p class="mb-0">{{ $patient->gender ?? 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-7">
                                        <div class="d-flex align-items-center mb-3">
                                            <span class="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2"><i class="ti ti-mail fs-16"></i></span>
                                            <div>
                                                <h6 class="fs-13 fw-bold mb-1">Email</h6>
                                                <p class="mb-0 text-break"><a href="mailto:{{ $patient->email }}">{{ $patient->email ?? 'N/A' }}</a></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-7 d-flex">
                        <div class="card shadow-sm flex-fill w-100">
                            <div class="card-header">
                                <h5 class="fw-bold mb-0"><i class="ti ti-book me-1"></i>Vital Signs</h5>
                            </div>
                            <div class="card-body pb-0">
                                <div class="row">
                                    <div class="col-sm-4">
                                        <div class="d-flex align-items-center mb-3">
                                            <span class="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border"><i class="ti ti-droplet fs-16"></i></span>
                                            <div>
                                                <h6 class="fs-13 fw-bold mb-1 text-truncate">Blood Pressure</h6>
                                                <p class="mb-0 d-inline-flex align-items-center text-truncate"><i class="ti ti-point-filled me-1 text-success fs-18"></i>{{ $latestAppointment->bp ?? 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-4">
                                        <div class="d-flex align-items-center mb-3">
                                            <span class="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border"><i class="ti ti-weight fs-16"></i></span>
                                            <div>
                                                <h6 class="fs-13 fw-bold mb-1 text-truncate">Weight</h6>
                                                <p class="mb-0 d-inline-flex align-items-center text-truncate"><i class="ti ti-point-filled me-1 text-success fs-18"></i>{{ $latestAppointment->weight ? $latestAppointment->weight . ' kg' : 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-4">
                                        <div class="d-flex align-items-center mb-3">
                                            <span class="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border"><i class="ti ti-ruler fs-16"></i></span>
                                            <div>
                                                <h6 class="fs-13 fw-bold mb-1 text-truncate">Height</h6>
                                                <p class="mb-0 d-inline-flex align-items-center text-truncate"><i class="ti ti-point-filled me-1 text-success fs-18"></i>{{ $latestAppointment->height ? $latestAppointment->height . ' cm' : 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Add more vital signs if available in Appointment model -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- End About and Vital Signs -->

                <!-- Tabs -->
                <ul class="nav nav-tabs nav-bordered mb-3">
                    <li class="nav-item">
                        <a href="#appointments" data-bs-toggle="tab" aria-expanded="false" class="nav-link active bg-transparent">
                            <span>Appointments</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#transactions" data-bs-toggle="tab" aria-expanded="true" class="nav-link bg-transparent">
                            <span>Transactions</span>
                        </a>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Appointments Tab -->
                    <div class="tab-pane show active" id="appointments">
                        <!-- Filter -->
                        <div class="d-flex align-items-center justify-content-between flex-wrap">
                            <div class="d-flex align-items-center gap-2">
                                <div class="search-set mb-3">
                                    <div class="table-search d-flex align-items-center mb-0">
                                        <div class="search-input">
                                            <input type="text" class="form-control" placeholder="Search appointments">
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex right-content align-items-center flex-wrap mb-3">
                                    <div class="reportrange-picker d-flex align-items-center reportrange">
                                        <i class="ti ti-calendar text-gray-5 fs-14 me-1"></i>
                                        <span class="reportrange-picker-field">{{ now()->format('d M y') }} - {{ now()->format('d M y') }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row-gap-3">
                                <div class="dropdown me-2">
                                    <a href="javascript:void(0);" class="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                                        <i class="ti ti-filter text-gray-5 me-1"></i>Filters
                                    </a>
                                    <div class="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0">
                                        <div class="d-flex align-items-center justify-content-between border-bottom filter-header">
                                            <h4 class="mb-0 fw-bold">Filter</h4>
                                            <div class="d-flex align-items-center">
                                                <a href="javascript:void(0);" class="link-danger text-decoration-underline">Clear All</a>
                                            </div>
                                        </div>
                                        <form action="#">
                                            <div class="filter-body pb-0">
                                                <div class="mb-3">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <label class="form-label">Doctor</label>
                                                        <a href="javascript:void(0);" class="link-primary mb-1">Reset</a>
                                                    </div>
                                                    <div class="dropdown">
                                                        <a href="javascript:void(0);" class="dropdown-toggle btn bg-white d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                                                            Select <i class="ti ti-chevron-down ms-auto"></i>
                                                        </a>
                                                        <div class="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                                            <div class="mb-3">
                                                                <input type="text" class="form-control form-control-md" placeholder="Search doctors">
                                                            </div>
                                                            <ul class="mb-3">
                                                                @foreach(\App\Models\User::where('role', 'doctor')->get() as $doctor)
                                                                    <li class="mb-1">
                                                                        <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" value="{{ $doctor->id }}">
                                                                            <span class="avatar avatar-xs rounded-circle me-2">
                                                                                <img src="{{ $doctor->profile_photo_url ?? asset('assets-doctor/img/profiles/avatar-01.jpg') }}" class="flex-shrink-0 rounded-circle" alt="img">
                                                                            </span>{{ $doctor->name }}
                                                                        </label>
                                                                    </li>
                                                                @endforeach
                                                            </ul>
                                                            <div class="row g-2">
                                                                <div class="col-6">
                                                                    <a href="javascript:void(0);" class="btn btn-outline-white w-100 close-filter">Cancel</a>
                                                                </div>
                                                                <div class="col-6">
                                                                    <a href="javascript:void(0);" class="btn btn-primary w-100">Select</a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <label class="form-label">Mode</label>
                                                        <a href="javascript:void(0);" class="link-primary mb-1">Reset</a>
                                                    </div>
                                                    <div class="dropdown">
                                                        <a href="javascript:void(0);" class="dropdown-toggle btn bg-white d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                                                            Select <i class="ti ti-chevron-down ms-auto"></i>
                                                        </a>
                                                        <div class="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                                            <ul class="mb-3">
                                                                <li class="mb-1">
                                                                    <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                                        <input class="form-check-input m-0 me-2" type="checkbox" value="clinical_visit">In Person
                                                                    </label>
                                                                </li>
                                                                <li class="mb-0">
                                                                    <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                                        <input class="form-check-input m-0 me-2" type="checkbox" value="online_visit">Online
                                                                    </label>
                                                                </li>
                                                                <li class="mb-0">
                                                                    <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                                        <input class="form-check-input m-0 me-2" type="checkbox" value="home_visit">Home Visit
                                                                    </label>
                                                                </li>
                                                                <li class="mb-0">
                                                                    <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                                        <input class="form-check-input m-0 me-2" type="checkbox" value="on_call_visit">On Call
                                                                    </label>
                                                                </li>
                                                            </ul>
                                                            <div class="row g-2">
                                                                <div class="col-6">
                                                                    <a href="javascript:void(0);" class="btn btn-outline-white w-100 close-filter">Cancel</a>
                                                                </div>
                                                                <div class="col-6">
                                                                    <a href="javascript:void(0);" class="btn btn-primary w-100">Select</a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label mb-1 text-dark fs-14 fw-medium">Date<span class="text-danger">*</span></label>
                                                    <div class="input-icon-end position-relative">
                                                        <input type="text" class="form-control bookingrange" placeholder="dd/mm/yyyy">
                                                        <span class="input-icon-addon">
                                                            <i class="ti ti-calendar"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="filter-footer d-flex align-items-center justify-content-end border-top">
                                                <a href="javascript:void(0);" class="btn btn-light btn-md me-2 fw-medium close-filter">Close</a>
                                                <button type="submit" class="btn btn-primary btn-md fw-medium">Filter</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- End Filter -->

                        <!-- Appointments Table -->
                        <div class="table-responsive">
                            <table class="table datatable table-nowrap">
                                <thead>
                                    <tr>
                                        <th class="no-sort">Date & Time</th>
                                        <th>Doctor Name</th>
                                        <th>Mode</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @forelse ($appointments as $appointment)
                                        <tr>
                                            <td>{{ \Carbon\Carbon::parse($appointment->date . ' ' . $appointment->time)->format('d M Y - h:i A') }}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <a href="{{ route('doctor.patient-details', $appointment->doctor_id) }}" class="avatar me-2 flex-shrink-0">
                                                        <img src="{{ $appointment->doctor->profile_photo_url ?? asset('assets-doctor/img/doctors/doctor-10.jpg') }}" alt="img" class="rounded-circle">
                                                    </a>
                                                    <div>
                                                        <h6 class="fs-14 mb-1 text-truncate"><a href="{{ route('doctor.patient-details', $appointment->doctor_id) }}" class="fw-semibold">{{ $appointment->doctor->name }}</a></h6>
                                                        <p class="mb-0 fs-13 text-truncate">{{ $appointment->doctor->specialization ?? 'N/A' }}</p>
                                                    </div>
                                                </td>
                                            <td>{{ ucwords(str_replace('_', ' ', $appointment->case_type)) }}</td>
                                            <td>
                                                <span class="badge fs-13 badge-soft-{{ $appointment->status == 'cancelled' ? 'danger' : 'success' }} rounded text-{{ $appointment->status == 'cancelled' ? 'danger' : 'success' }} fw-medium">
                                                    {{ ucfirst($appointment->status ?? 'Scheduled') }}
                                                </span>
                                            </td>
                                            <td class="action-item">
                                                <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                                    <i class="ti ti-dots-vertical"></i>
                                                </a>
                                                <ul class="dropdown-menu p-2">
                                                    <li>
                                                        <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                                    </li>
                                                    <li>
                                                        <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                                    </li>
                                                </ul>
                                            </td>
                                        </tr>
                                    @empty
                                        <tr>
                                            <td colspan="5" class="text-center">No appointments found.</td>
                                        </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>
                        <!-- End Appointments Table -->
                    </div>

                    <!-- Transactions Tab -->
                    <div class="tab-pane" id="transactions">
                        <div class="alert alert-info">Transactions data is not available in the provided models. Please provide a Transaction model or remove this tab.</div>
                    </div>
                </div>
                <!-- End Tab Content -->
            </div>
            @include('doctor.inc.footer')
        </div>
    </div>
    @include('doctor.inc.footer-links')


    
</body>
</html>