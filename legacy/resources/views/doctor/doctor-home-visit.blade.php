<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Home Visit</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">
        @include('doctor.inc.header-links')
    <style>
    .patient-hover {
        position: relative;
        text-decoration: none;
        transition: all 0.3s ease;
    }

    .patient-hover::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -2px;
        width: 0%;
        height: 2px;
        background-color: var(--bs-success);
        transition: width 0.3s ease;
    }

    .patient-hover:hover {
        color: var(--bs-success) !important;
    }

    .patient-hover:hover::after {
        width: 100%;
    }
    </style>

</head>

<body>

    <!-- Begin Wrapper -->
    <div class="main-wrapper">

        <!-- Topbar Start -->
            @include('doctor.inc.header')

        <!-- Topbar End -->

        <!-- Search Modal -->
        <div class="modal fade" id="searchModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content bg-transparent">
                    <div class="card shadow-none mb-0">
                        <div class="px-3 py-2 d-flex flex-row align-items-center" id="search-top">
                            <i class="ti ti-search fs-22"></i>
                            <input type="search" class="form-control border-0" placeholder="Search">
                            <button type="button" class="btn p-0" data-bs-dismiss="modal" aria-label="Close"><i class="ti ti-x fs-22"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidenav Menu Start -->
            @include('doctor.inc.sidebar')


        <!-- Sidenav Menu End -->

        <!-- ========================
			Start Page Content
		========================= -->

        <div class="page-wrapper">

            <!-- Start Content -->
            <div class="content">

                <!-- Start Page Header -->
                <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
                    <div class="flex-grow-1">
                        <!-- <h4 class="fw-bold mb-0"> Expenses <span class="badge badge-soft-primary fw-medium border py-1 px-2 border-primary text-dark fs-13 ms-1">Total Expenses : 565</span> </h4> -->
                        <h4 class="fw-bold mb-0"> Home Visit </h4>
                    </div>


                </div>
                <!-- End Page Header -->

                <!--  Start Filter -->
                <div class=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                    <div class="d-flex align-items-center gap-2">
                        <div class="search-set">
                            <div class="d-flex align-items-center flex-wrap gap-2">
                                <div class="table-search d-flex align-items-center mb-0">
                                    <div class="search-input">
                                        <a href="javascript:void(0);" class="btn-searchset"></a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex right-content align-items-center flex-wrap">
                            <div class="input-icon-start position-relative">
                                <span class="input-icon-addon text-dark">
                                    <i class="ti ti-calendar-event"></i>
                                </span>
                                <input type="text" class="form-control form-control-sm bookingrange">
                            </div>
                        </div>
                    </div>

                    <div class="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">
                        <div class="dropdown me-2">
                            <a href="javascript:void(0);" class="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center" data-bs-toggle="dropdown">
                                Export<i class="ti ti-chevron-down ms-2"></i>
                            </a>
                            <ul class="dropdown-menu p-2">
                                <li>
                                    <a class="dropdown-item" href="#">Download as PDF</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#">Download as Excel</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                
        <div class="table-responsive">
            @if($homeVisits->count() > 0)
                <table class="table table-nowrap datatable align-middle">
                    <thead class="thead-light">
                        <tr>
                            <th>Sr.</th>
                            <th>Patient</th>
                            <th>Visit Status</th>
                            <th>Last Visit</th>
                            <th>Google Map</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($homeVisits as $visit)
                            <tr>
                                <td>{{ $loop->iteration }}</td>

                                <td>
                                    <div class="d-flex align-items-center">
                                        @php
                                            $patient = $visit->patient;
                                            $hasImage = !empty($patient->image);
                                            $name = $patient->name ?? 'Unknown';
                                            $initials = collect(explode(' ', $name))
                                                ->map(fn($word) => strtoupper(substr($word, 0, 1)))
                                                ->take(2)
                                                ->implode('');
                                        @endphp

                                        {{-- Patient Avatar / Initials --}}
                                        @if($hasImage)
                                            <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                                <img src="{{ asset($patient->image) }}" alt="patient" class="rounded-circle">
                                            </a>
                                        @else
                                            <div class="avatar avatar-md me-2 d-flex align-items-center justify-content-center rounded-circle bg-light text-dark fw-bold"
                                                style="width:45px;height:45px;font-size:16px;text-transform:uppercase;">
                                                {{ $initials }}
                                            </div>
                                        @endif

                                        {{-- Patient Details --}}
                                        <div>
                                            <a href="{{ route('doctor.patient-details', $patient->id ?? 0) }}" 
                                            class="fw-semibold text-dark patient-hover">
                                                {{ $patient->name ?? 'Unknown' }}
                                            </a><br>
                                            <small class="text-muted">ID: {{ $patient->registration_id ?? 'N/A' }}</small>
                                        </div>
                                    </div>
                                </td>

                                <td class="text-dark">{{ $visit->visit_status ?? 'Pending Visit' }}</td>

                                <td class="text-dark">
                                    {{ $visit->date ? \Carbon\Carbon::parse($visit->date)->format('d M Y') : 'N/A' }}
                                </td>

                                <td>
                                    @if($visit->address)
                                        <a href="{{ $visit->address }}" target="_blank" class="text-primary">
                                            <i class="ti ti-map-pin fs-5"></i>
                                        </a>
                                    @else
                                        <span class="text-muted">N/A</span>
                                    @endif
                                </td>

                                <td>
                                    @if($visit->status == 'active')
                                        <span class="badge bg-success">Active</span>
                                    @elseif($visit->status == 'pending')
                                        <span class="badge bg-warning text-dark">Pending</span>
                                    @else
                                        <span class="badge bg-danger">Inactive</span>
                                    @endif
                                </td>

                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li><a href="#" class="dropdown-item">Cancel</a></li>
                                        <li><a href="#" class="dropdown-item">Delete</a></li>
                                    </ul>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

            @else
                {{-- 🔸 No Appointments Found Card --}}
                <div class="card-body text-center py-5">
                    <i class="ti ti-calendar-x fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted mb-2">No Appointments Found</h5>
                    <p class="text-muted mb-3">You don’t have any scheduled appointments yet.</p>
                    <a href="{{ route('book-appointment') }}" class="btn btn-primary">
                        <i class="ti ti-plus me-1"></i> Book First Appointment
                    </a>
                </div>
            @endif
        </div>






            </div>
            <!-- End Content -->

            <!-- Footer Start -->
         @include('doctor.inc.footer')
            <!-- Footer End -->

        </div>

        <!-- ========================
			End Page Content
		========================= -->

    </div>
    <!-- End Wrapper -->

            @include('doctor.inc.footer-links')

</body>

</html>