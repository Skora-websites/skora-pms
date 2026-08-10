<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Appointments</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- header links  -->
    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/favicon.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Font Awosome Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/all.min.css">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="assets/plugins/select2/css/select2.min.css">

    <!-- Daterangepikcer CSS -->
    <link rel="stylesheet" href="assets/plugins/daterangepicker/daterangepicker.css">

    <!-- Datetimepicker CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap-datetimepicker.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets/plugins/simplebar/simplebar.min.css">

    <!-- Datatable CSS -->
    <link rel="stylesheet" href="assets/css/dataTables.bootstrap5.min.css">

    <!-- Main CSS -->
    <link rel="stylesheet" href="assets/css/style.css" id="app-style">
    <!--  -->

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
                        <h4 class="fw-semibold mb-0"> Appointment </h4>
                    </div>
                    <div class="text-end d-flex">
                        <!-- dropdown-->
                        <div class="dropdown me-1">
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
                        <div class="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center">
                            <a href="doctors-appointments.php" class="bg-light rounded p-1 d-flex align-items-center justify-content-center"> <i class="ti ti-list fs-14 text-dark"></i></a>
                            <a href="doctors-appointment-details.php" class="bg-white rounded p-1 d-flex align-items-center justify-content-center"> <i class="ti ti-calendar-event fs-14 text-body"></i> </a>
                        </div>

                        <a href="javascript:void(0);" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="offcanvas" data-bs-target="#new_appointment"><i class="ti ti-plus me-1"></i> New Appointment </a>
                    </div>
                </div>
                <!-- End Page Header -->

                <!--  Start Filter -->
                <div class=" d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
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
                            <a href="javascript:void(0);" class="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                                <i class="ti ti-filter text-gray-5 me-1"></i>Filters
                            </a>
                            <div class="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0" id="filter-dropdown">
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
                                                <label class="form-label mb-1">Doctor</label>
                                                <a href="javascript:void(0);" class="link-primary mb-1">Reset</a>
                                            </div>
                                            <select class="select2" multiple="multiple">
                                                <option value="m-1" selected>Dr. Mick Thompson</option>
                                                <option value="m-2">Dr. Sarah Johnson</option>
                                                <option value="m-3">Dr. Emily Carter</option>
                                                <option value="m-4">Dr. David Lee</option>
                                                <option value="m-5">Dr. Anna Kim</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <div class="d-flex align-items-center justify-content-between">
                                                <label class="form-label">Designation</label>
                                                <a href="javascript:void(0);" class="link-primary mb-1">Reset</a>
                                            </div>
                                            <select class="select2" multiple="multiple">
                                                <option value="m-1" selected>Cardiologist</option>
                                                <option value="m-2">Orthopedic Surgeon</option>
                                                <option value="m-3">Pediatrician</option>
                                                <option value="m-4">Gynecologist</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <div class="d-flex align-items-center justify-content-between">
                                                <label class="form-label">Department</label>
                                                <a href="javascript:void(0);" class="link-primary mb-1">Reset</a>
                                            </div>
                                            <select class="select2" multiple="multiple">
                                                <option value="m-1" selected>Cardiology</option>
                                                <option value="m-2">Orthopedics</option>
                                                <option value="m-3">Pediatrics</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Date<span class="text-danger">*</span></label>
                                            <div class="input-icon-end position-relative">
                                                <input type="text" class="form-control datetimepicker" placeholder="dd/mm/yyyy">
                                                <span class="input-icon-addon">
                                                    <i class="ti ti-calendar"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="d-flex align-items-center justify-content-between">
                                                <label class="form-label">Amount</label>
                                                <a href="javascript:void(0);" class="link-primary mb-1">Reset</a>
                                            </div>
                                            <select class="select2" multiple="multiple">
                                                <option value="m-1" selected>$501 - $1000</option>
                                                <option value="m-2">$501 - $1100</option>
                                                <option value="m-3">$701 - $1200</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <div class="d-flex align-items-center justify-content-between">
                                                <label class="form-label">Status</label>
                                                <a href="javascript:void(0);" class="link-primary mb-1">Reset</a>
                                            </div>
                                            <select class="select2" multiple="multiple">
                                                <option value="m-1" selected>Available</option>
                                                <option value="m-2">Unavailable</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="filter-footer d-flex align-items-center justify-content-end border-top">
                                        <a href="javascript:void(0);" class="btn btn-light btn-md me-2 fw-medium" id="close-filter">Close</a>
                                        <button type="submit" class="btn btn-primary btn-md fw-medium">Filter</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div class="dropdown">
                            <a href="javascript:void(0);" class="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                                <span class="me-1"> Sort By : </span> Recent
                            </a>
                            <ul class="dropdown-menu  dropdown-menu-end p-2">
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">Recently Added</a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">Ascending</a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">Desending</a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">Last Month</a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">Last 7 Days</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <!--  End Filter -->

                <!--  Start Table -->
                <div class="table-responsive">
                    <table class="table datatable table-nowrap">
                        <thead class="">
                            <tr>
                                <th class="no-sort">
                                    Date & Time
                                </th>
                                <th>Patient</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>30 Apr 2025 - 09:30 AM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-01.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="fw-semibold">Alberto Ripley <span class="text-body fs-13 fw-normal d-block"> +1 56556 54565 </span> </a>
                                    </div>
                                </td>
                                <td>
                                    In-person
                                </td>
                                <td> <span class="badge badge-soft-primary rounded text-primary fw-medium fs-13">Checked Out</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td>15 Apr 2025 - 11:20 AM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-02.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="text-dark fw-semibold">Susan Babin<span class="text-body fs-13 fw-normal d-block"> +1 65658 95654</span> </a>
                                    </div>
                                </td>
                                <td>
                                    Online
                                </td>
                                <td> <span class="badge badge-soft-warning rounded text-warning fw-medium fs-13">Checked In</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td>02 Apr 2025 - 08:15 AM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-03.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="text-dark fw-semibold">Carol Lam <span class="text-body fs-13 fw-normal d-block"> +1 55654 56647</span> </a>
                                    </div>
                                </td>
                                <td>
                                    In-Person
                                </td>
                                <td> <span class="badge badge-soft-danger rounded text-danger fw-medium fs-13">Cancelled</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td>27 Mar 2025 - 02:00 PM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-04.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="text-dark fw-semibold">Marsha Noland <span class="text-body fs-13 fw-normal d-block"> +1 65668 54558 </span> </a>
                                    </div>
                                </td>
                                <td>
                                    30 Apr 2025
                                </td>
                                <td> <span class="badge badge-soft-info rounded text-info fw-medium fs-13">Schedule</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>


                            <tr>
                                <td>12 Mar 2025 - 05:40 PM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-05.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="text-dark fw-semibold">Irma Armstrong <span class="text-body fs-13 fw-regular d-block"> +1 45214 66568 </span> </a>
                                    </div>
                                </td>
                                <td>
                                    Online
                                </td>
                                <td> <span class="badge badge-soft-success rounded text-success fw-medium fs-13">Confirmed</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td>24 Feb 2025 - 09:20 AM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-06.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="text-dark fw-semibold">Ezra Belcher <span class="text-body fs-13 fw-regular d-block"> +1 65895 41247 </span> </a>
                                    </div>
                                </td>
                                <td>
                                    In-Person
                                </td>
                                <td> <span class="badge badge-soft-danger rounded text-danger fw-medium fs-13">Cancelled</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td>16 Feb 2025 - 11:40 AM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-07.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="text-dark fw-semibold">Glen Lentz <span class="text-body fs-13 fw-regular d-block"> +1 62458 45845 </span> </a>
                                    </div>
                                </td>
                                <td>
                                    Online
                                </td>
                                <td> <span class="badge badge-soft-success rounded text-success fw-medium fs-13">Confirmed</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td>01 Feb 2025 - 04:00 PM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-08.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="text-dark fw-semibold">Bernard Griffith <span class="text-body fs-13 fw-regular d-block"> +1 61422 45214 </span> </a>
                                    </div>
                                </td>
                                <td>
                                    Online
                                </td>
                                <td> <span class="badge badge-soft-primary rounded text-primary fw-medium fs-13">Checked Out</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td>25 Jan 2025 - 03:10 PM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-09.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.php" class="text-dark fw-semibold">John Elsass <span class="text-body fs-13 fw-regular d-block">+1 47851 26371</span> </a>
                                    </div>
                                </td>
                                <td>
                                    Online
                                </td>
                                <td> <span class="badge badge-soft-info rounded text-info fw-medium fs-13">Schedule</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td>12 Jan 2025 - 03:10 PM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.html" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-10.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="doctors-patient-details.html" class="text-dark fw-semibold">John Albert <span class="text-body fs-13 fw-regular d-block">+1 47851 35267</span> </a>
                                    </div>
                                </td>
                                <td>
                                    In-Person
                                </td>
                                <td> <span class="badge badge-soft-danger rounded text-danger fw-medium fs-13">cancelled</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#edit_appointment">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#view_details">View</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!--  End Table -->

            </div>
            <!-- End Content -->

            <!-- Footer Start -->
            <?php include('assets/inc/footer.php'); ?>
            <!-- Footer End -->

        </div>

        <!-- ========================
			End Page Content
		========================= -->

    </div>
    <!-- End Wrapper -->

    <!-- Start Add New Appointment -->
    <div class="offcanvas offcanvas-offset offcanvas-end" tabindex="-1" id="new_appointment">
        <div class="offcanvas-header d-block pb-0 px-0">
            <div class="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
                <h5 class="offcanvas-title fs-18 fw-bold">New Appointment</h5>
                <button type="button" class="btn-close opacity-100" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
        </div>
        <div class="offcanvas-body pt-3">
            <form action="#">
                <!-- start row-->
                <div class="row">
                    <div class="col-lg-12">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Appointment ID <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input type="text" class="form-control rounded bg-light" value="AP234354">
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-12">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Patient<span class="text-danger">*</span></label>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="true">
                                    Select
                                </a>
                                <div class="dropdown-menu shadow-lg w-100 dropdown-info">
                                    <div class="mb-3">
                                        <div class="input-icon-start position-relative">
                                            <span class="input-icon-addon fs-12">
                                                <i class="ti ti-search"></i>
                                            </span>
                                            <input type="text" class="form-control form-control-sm" placeholder="Search">
                                        </div>
                                    </div>
                                    <ul class="mb-3 list-style-none">
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/users/user-02.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>Emily Clark
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-01.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>John Carter
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-16.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>Sophia White
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-15.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>Michael Johnson
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-14.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>Olivia Harris
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-01.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>David Anderson
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-12">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Appointment Type <span class="text-danger">*</span></label>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="true">
                                    Select
                                </a>
                                <div class="dropdown-menu shadow-lg w-100 dropdown-info">
                                    <div class="mb-3">
                                        <div class="input-icon-start position-relative">
                                            <span class="input-icon-addon fs-12">
                                                <i class="ti ti-search"></i>
                                            </span>
                                            <input type="text" class="form-control form-control-sm" placeholder="Select">
                                        </div>
                                    </div>
                                    <ul class="mb-3 list-style-none">
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                In Person
                                            </label>
                                        </li>
                                        <li class="list-none">
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Online
                                            </label>
                                        </li>

                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-6">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium"> Date of Appointment <span class="text-danger">*</span></label>
                            <div class="input-icon-end position-relative">
                                <input type="text" class="form-control datetimepicker" placeholder="dd/mm/yyyy">
                                <span class="input-icon-addon">
                                    <i class="ti ti-calendar"></i>
                                </span>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-6">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium"> Time <span class="text-danger">*</span></label>
                            <div class="input-icon-end position-relative">
                                <input type="text" class="form-control timepicker" placeholder="-- : --">
                                <span class="input-icon-addon">
                                    <i class="ti ti-clock"></i>
                                </span>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-12">
                        <div class="mb-3">
                            <div>
                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Appointment Reason</label>
                                <textarea rows="4" class="form-control rounded"> </textarea>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-12">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Status<span class="text-danger">*</span></label>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="true">
                                    Select
                                </a>
                                <div class="dropdown-menu shadow-lg w-100 dropdown-info">
                                    <div class="mb-3">
                                        <div class="input-icon-start position-relative">
                                            <span class="input-icon-addon fs-12">
                                                <i class="ti ti-search"></i>
                                            </span>
                                            <input type="text" class="form-control form-control-sm" placeholder="Select">
                                        </div>
                                    </div>
                                    <ul class="mb-3 list-style-none">
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Checked Out
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox" checked>
                                                Checked In
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Cancelled
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Scheduled
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div> <!-- end col-->
                </div>
                <!-- end row-->
            </form>
        </div>
        <div class="offcanvas-footer mb-1 mt-3 p-3 border-1 border-top">
            <div class=" d-flex justify-content-end gap-2">
                <a href="javascript:void(0);" class="btn btn-light btm-md">Cancel</a>
                <button data-bs-dismiss="offcanvas" class="btn btn-primary btm-md" id="filter-submit">Create Create Appointment</button>
            </div>
        </div>
    </div>
    <!-- End Add New Appointment-->

    <!-- Start Edit New Appointment -->
    <div class="offcanvas offcanvas-offset offcanvas-end" tabindex="-1" id="edit_appointment">
        <div class="offcanvas-header d-block pb-0 px-0">
            <div class="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
                <h5 class="offcanvas-title fs-18 fw-bold"> Edit Appointment</h5>
                <button type="button" class="btn-close opacity-100" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
        </div>
        <div class="offcanvas-body pt-3">
            <form action="#">
                <!-- start row-->
                <div class="row">
                    <div class="col-lg-12">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Appointment ID <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input type="text" class="form-control rounded bg-light" value="AP234354">
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-12">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Patient<span class="text-danger">*</span></label>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="true">
                                    Emily Clark
                                </a>
                                <div class="dropdown-menu shadow-lg w-100 dropdown-info">
                                    <div class="mb-3">
                                        <div class="input-icon-start position-relative">
                                            <span class="input-icon-addon fs-12">
                                                <i class="ti ti-search"></i>
                                            </span>
                                            <input type="text" class="form-control form-control-sm" placeholder="Search">
                                        </div>
                                    </div>
                                    <ul class="mb-3 list-style-none">
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/users/user-02.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>Emily Clark
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-01.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>John Carter
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-16.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>Sophia White
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-15.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>Michael Johnson
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-14.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>Olivia Harris
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                <span class="avatar avatar-sm rounded-circle me-2"><img src="assets/img/profiles/avatar-01.jpg" class="flex-shrink-0 rounded-circle" alt="img"></span>David Anderson
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-12">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Appointment Type <span class="text-danger">*</span></label>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="true">
                                    In Person
                                </a>
                                <div class="dropdown-menu shadow-lg w-100 dropdown-info">
                                    <div class="mb-3">
                                        <div class="input-icon-start position-relative">
                                            <span class="input-icon-addon fs-12">
                                                <i class="ti ti-search"></i>
                                            </span>
                                            <input type="text" class="form-control form-control-sm" placeholder="Select">
                                        </div>
                                    </div>
                                    <ul class="mb-0 list-style-none">
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                In Person
                                            </label>
                                        </li>
                                        <li class="list-none">
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Online
                                            </label>
                                        </li>

                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-6">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium"> Date of Appointment <span class="text-danger">*</span></label>
                            <div class="input-icon-end position-relative">
                                <input type="text" class="form-control datetimepicker" placeholder="20/08/2025">
                                <span class="input-icon-addon">
                                    <i class="ti ti-calendar"></i>
                                </span>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-6">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium"> Time <span class="text-danger">*</span></label>
                            <div class="input-icon-end position-relative">
                                <input type="text" class="form-control timepicker" placeholder="01 : 20 : PM">
                                <span class="input-icon-addon">
                                    <i class="ti ti-clock"></i>
                                </span>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-12">
                        <div class="mb-3">
                            <div>
                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Appointment Reason</label>
                                <textarea rows="4" class="form-control rounded"> An account of the present illness, which includes the circumstances surrounding the onset of recent health changes and the Purpose. </textarea>
                            </div>
                        </div>
                    </div> <!-- end col-->

                    <div class="col-lg-12">
                        <div class="mb-3">
                            <label class="form-label mb-1 text-dark fs-14 fw-medium">Status<span class="text-danger">*</span></label>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="true">
                                    Checked Out
                                </a>
                                <div class="dropdown-menu shadow-lg w-100 dropdown-info">
                                    <div class="mb-3">
                                        <div class="input-icon-start position-relative">
                                            <span class="input-icon-addon fs-12">
                                                <i class="ti ti-search"></i>
                                            </span>
                                            <input type="text" class="form-control form-control-sm" placeholder="Select">
                                        </div>
                                    </div>
                                    <ul class="mb-3 list-style-none">
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Checked Out
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox" checked>
                                                Checked In
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Cancelled
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Scheduled
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div> <!-- end col-->
                </div>
                <!-- end row-->
            </form>
        </div>
        <div class="offcanvas-footer mb-1 mt-3 p-3 border-1 border-top">
            <div class=" d-flex justify-content-end gap-2">
                <a href="javascript:void(0);" class="btn btn-light btm-md">Cancel</a>
                <button data-bs-dismiss="offcanvas" class="btn btn-primary btm-md" id="filter-submit2">Create Create Appointment</button>
            </div>
        </div>
    </div>
    <!-- End Edit New Appointment-->

    <!-- Start View Details -->
    <div class="offcanvas offcanvas-offset offcanvas-end" tabindex="-1" id="view_details">
        <div class="offcanvas-header d-block pb-0 px-0">
            <div class="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
                <h5 class="offcanvas-title fs-18 fw-bold">Appointment Details <span class="badge badge-soft-primary border pt-1 px-2 border-primary fw-medium ms-2">#AP544658</span></h5>
                <button type="button" class="btn-close opacity-100" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
        </div>
        <div class="offcanvas-body pt-0 px-0">
            <h6 class="bg-light py-2 px-3 text-dark fw-bold"> When & Where </h6>
            <div class="px-3 my-4">
                <p class="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between"> Appointment On <span class="text-body fw-normal"> Saturday, 25 Apr 2025 </span> </p>
                <p class="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between"> Time <span class="text-body fw-normal"> 09:00 AM - 11:00 AM </span> </p>
                <p class="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between"> Location <span class="text-body fw-normal">Newyork , USA </span> </p>
                <p class="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between"> Appointment Type <span class="text-body fw-normal"> Online Consultation </span> </p>
                <div class="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between"> Patient Details
                    <div class="text-body fw-normal d-flex align-items-center">
                        <span class="avatar avatar-sm">
                            <img src="assets/img/users/avatar-2.jpg" alt="" class="rounded-circle me-1">
                        </span>
                        James Adrian
                    </div>
                </div>
            </div>
            <h6 class="bg-light py-2 px-3 text-dark fw-bold"> Appointment Details </h6>
            <div class="px-3 my-4">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="d-flex align-items-center">
                        Telehealth
                        <label class="d-flex align-items-center form-switch ps-1">
                            <input class="form-check-input m-0 me-2" type="checkbox" checked>
                        </label>
                    </div>
                    <div> <a href="online-consulation.html" class="btn-primary btn btn-sm rounded d-flex align-items-center"> <i class="ti ti-video me-1"></i> Start </a></div>
                </div>
                <div class="row align-items-center">
                    <div class="col-lg-6 col-md-6">
                        <p class="text-dark"> Status </p>
                    </div>

                    <div class="col-lg-6 col-md-6">
                        <div class="mb-3">
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="dropdown-toggle form-control rounded d-flex align-items-center justify-content-between border" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="true">
                                    Pending
                                </a>
                                <div class="dropdown-menu shadow-lg w-100 dropdown-info">
                                    <div class="mb-3">
                                        <div class="input-icon-start position-relative">
                                            <span class="input-icon-addon fs-12">
                                                <i class="ti ti-search"></i>
                                            </span>
                                            <input type="text" class="form-control form-control-sm" placeholder="Select">
                                        </div>
                                    </div>
                                    <ul class="mb-0 list-style-none">
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Checked Out
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox" checked>
                                                Checked In
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Cancelled
                                            </label>
                                        </li>
                                        <li>
                                            <label class="dropdown-item px-2 d-flex align-items-center text-dark">
                                                <input class="form-check-input m-0 me-2" type="checkbox">
                                                Scheduled
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
    <!-- End Add New Appointment-->

    <!-- Start Delete Modal  -->
    <div class="modal fade" id="delete_modal">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-body text-center position-relative">
                    <img src="assets/img/bg/delete-modal-bg-01.png" alt="" class="img-fluid position-absolute top-0 start-0 z-0">
                    <img src="assets/img/bg/delete-modal-bg-02.png" alt="" class="img-fluid position-absolute bottom-0 end-0 z-0">
                    <div class="mb-3 position-relative z-1">
                        <span class="avatar avatar-lg bg-danger text-white"><i class="ti ti-trash fs-24"></i></span>
                    </div>
                    <h5 class="fw-bold mb-1 position-relative z-1">Delete Confirmation</h5>
                    <p class="mb-3 position-relative z-1">Are you sure want to delete?</p>
                    <div class="d-flex justify-content-center">
                        <a href="javascript:void(0);" class="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal">Cancel</a>
                        <a href="#" class="btn btn-danger position-relative z-1" data-bs-dismiss="modal">Yes, Delete</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- End Delete Modal  -->



    <!-- jQuery -->
    <script src="assets/js/jquery-3.7.1.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Simplebar JS -->
    <script src="assets/plugins/simplebar/simplebar.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Daterangepikcer JS -->
    <script src="assets/js/moment.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>
    <script src="assets/plugins/daterangepicker/daterangepicker.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Datetimepicker JS -->
    <script src="assets/js/moment.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>
    <script src="assets/js/bootstrap-datetimepicker.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Datatable JS -->
    <script src="assets/js/jquery.dataTables.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>
    <script src="assets/js/dataTables.bootstrap5.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="d7ab00c85387527fb6389a9e-|49" defer></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fed9b69ddf04f","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>


</body>

</html>
















<!-- Assessment Form -->
<div class="col-xl-12 d-flex">
    <div class="card shadow-sm flex-fill w-100 form-bg" style="border-top: 4px solid #00bef2;">
        <div class="card-body">
            <h3 class="fw-bold mb-2 text-white">Assessment Form</h3>
            <div class="mb-3">
                <form>
                    <div class="mb-3">
                        <label class="form-label text-white">Patient Name:</label>
                        <input type="text" class="form-control" placeholder="Enter patient name">
                    </div>
                    <div class="mb-3">
                        <label class="form-label text-white">Assessment Notes:</label>
                        <textarea name="assessmentNotes" id="assessmentNotes" class="form-control tinymce-editor"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Assessment</button>
                </form>
            </div>
        </div>
    </div>
</div>










<!-- patient registration form  -->
<div class="modal-body">
    <form id="mainForm" onsubmit="return handleSubmit(event)">
        <!-- Step 1: Personal Info -->
        <div id="step1">
            <div class="row">
                <h5 class="mb-3">Personal Info</h5>

                <div class="col-12 col-lg-10 ">
                    <div class="row">
                        <div class="col-12 col-lg-6  mb-2">
                            <label class="form-label fs-14">Referred By</label>
                            <div class="input-group">
                                <div class="input-group-text"><i class="ti ti-user"></i></div>
                                <input type="text" class="form-control" placeholder="" name="referred_by">
                            </div>
                        </div>
                        <!-- Name -->
                        <div class="col-12 col-lg-6  mb-2">
                            <label class="form-label fs-14">Enter Name</label>
                            <div class="input-group">
                                <div class="input-group-text"><i class="ti ti-user"></i></div>
                                <input type="text" class="form-control" placeholder="Full Name" name="full_name">
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="col-12 col-lg-6 mb-2">
                            <label class="form-label fs-14">Enter Email</label>
                            <div class="input-group">
                                <div class="input-group-text"><i class="ti ti-mail"></i></div>
                                <input type="email" class="form-control" placeholder="Email Address" name="email">
                            </div>
                        </div>

                        <!-- Gender -->
                        <div class="col-12 col-lg-6 mb-2">
                            <label class="form-label fs-14">Gender</label>
                            <div class="input-group">
                                <div class="input-group-text"><i class="ti ti-gender-bigender"></i></div>
                                <select class="form-select" name="gender">
                                    <option selected disabled>Select Gender</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>


                        <!-- Address -->
                        <div class="col-12 col-lg-6 mb-2">
                            <label class="form-label fs-14">Address </label>
                            <div class="input-group">
                                <div class="input-group-text"><i class="ti ti-map-pin"></i></div>
                                <input type="text" class="form-control" placeholder="Address" name="address">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Image Display -->
                <div class="col-12 col-lg-2 ">
                    <div class="mb-2 d-flex justify-content-center">
                        <div class="avatar avatar-xxxl">
                            <img src="assets/img/users/user-04.jpg" alt="user" class="img-fluid img1 rounded" id="profileImagePreview">
                        </div>
                    </div>
                    <div class="input-group">
                        <input type="file" class="form-control" id="profileImageInput" onchange="previewImage(event)" name="profile_image">
                    </div>
                </div>

                <!-- Mobile -->
                <div class="col-12 col-lg-4  mb-2">
                    <label class="form-label fs-14">Mobile Number</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-phone"></i></div>
                        <input type="text" class="form-control" placeholder="Mobile Number" name="mobile">
                    </div>
                </div>

                <!-- Password -->
                <div class="col-12 col-lg-4 mb-2">
                    <label class="form-label fs-14">Enter Password</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-lock"></i></div>
                        <input type="password" class="form-control" placeholder="Password" name="password">
                    </div>
                </div>

                <!-- Confirm Password -->
                <div class="col-12 col-lg-4 mb-2">
                    <label class="form-label fs-14">Confirm Password</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-lock"></i></div>
                        <input type="password" class="form-control" placeholder="Confirm Password" name="confirm_password">
                    </div>
                </div>
            </div>

            <div class="col-12 mt-3">
                <button type="button" class="btn btn-secondary">Save</button>
                <button type="button" class="btn btn-primary" onclick="showStep(2)">Next</button>
            </div>
        </div>

        <!-- Step 2: Vital -->
        <div id="step2" style="display: none;">
            <div class="row">
                <h5 class="mb-3">Vital Info</h5>

                <!-- Blood Group -->
                <div class="col-12 col-lg-4 mb-2">
                    <label class="form-label fs-14">Blood Group</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-droplet"></i></div>
                        <select class="form-select" name="blood_group">
                            <option selected disabled>Select Blood Group</option>
                            <option>A+</option>
                            <option>A-</option>
                            <option>B+</option>
                            <option>B-</option>
                            <option>AB+</option>
                            <option>AB-</option>
                            <option>O+</option>
                            <option>O-</option>
                        </select>
                    </div>
                </div>

                <!-- BP -->
                <div class="col-12 col-lg-4 mb-2">
                    <label class="form-label fs-14">BP</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-heartbeat"></i></div>
                        <input type="text" class="form-control" placeholder="e.g. 120/80" name="bp">
                    </div>
                </div>

                <!-- Weight -->
                <div class="col-12 col-lg-4 mb-2">
                    <label class="form-label fs-14">Weight (kg)</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-scale"></i></div>
                        <input type="text" class="form-control" placeholder="Weight" name="weight">
                    </div>
                </div>

                <!-- Height -->
                <div class="col-12 col-lg-4 mb-2">
                    <label class="form-label fs-14">Height (cm)</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-ruler"></i></div>
                        <input type="text" class="form-control" placeholder="Height" name="height">
                    </div>
                </div>


            </div>

            <!-- Navigation -->
            <div class="mt-3 d-flex justify-content-between">
                <div>
                    <button type="button" class="btn btn-secondary" onclick="showStep(1)">Back</button>
                    <button type="button" class="btn btn-secondary">Save</button>
                </div>

                <div>
                    <button type="button" class="btn btn-outline-primary me-2" onclick="showStep(3)">Skip</button>
                    <button type="button" class="btn btn-primary" onclick="showStep(3)">Next</button>
                </div>
            </div>
        </div>

        <!-- Step 3: Consent Form -->
        <div id="step3" style="display: none;">
            <div class="row">
                <h5 class="mb-3">Consent Form</h5>

                <!-- Checkboxes -->
                <div class="col-12 mb-3">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="showOtp" onchange="toggleField('otpField')">
                        <label class="form-check-label" for="showOtp">Send OTP</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="showConsult" onchange="toggleField('consultField')">
                        <label class="form-check-label" for="showConsult">Send Consent</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="showFormImage" onchange="toggleField('formImageField')">
                        <label class="form-check-label" for="showFormImage">Upload Image</label>
                    </div>
                </div>

                <!-- OTP -->
                <div class="col-4 mb-2" id="otpField" style="display: none;">
                    <label class="form-label fs-14">OTP</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-key"></i></div>
                        <input type="text" class="form-control" placeholder="Enter OTP" name="otp">
                    </div>
                </div>

                <!-- Consent -->
                <div class="col-4 mb-2" id="consultField" style="display: none;">
                    <label class="form-label fs-14">Consent</label>
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-stethoscope"></i></div>
                        <input type="text" class="form-control" placeholder="Consult Name / Department" name="consent_info">
                    </div>
                </div>

                <!-- Upload Image -->
                <div class="col-4 mb-2" id="formImageField" style="display: none;">
                    <label class="form-label fs-14">Choose Image</label>
                    <input type="file" class="form-control" name="consent_image">
                </div>

                <!-- Buttons -->
                <div class="col-12 mt-3">
                    <button type="button" class="btn btn-secondary" onclick="showStep(2)">Back</button>
                    <button type="submit" class="btn btn-success">Submit</button>
                </div>
            </div>
        </div>
    </form>

</div>
<!--  -->
<!-- patient registration form js  -->
<script>
    function showStep(stepNumber) {
        // Hide all steps
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'none';

        // Show the selected step
        document.getElementById('step' + stepNumber).style.display = 'block';

        // Update active tab
        const tabs = document.querySelectorAll('#stepTabs .nav-link');
        tabs.forEach((tab, index) => {
            tab.classList.remove('active');
            if (index + 1 === stepNumber) {
                tab.classList.add('active');
            }
        });
    }
</script>

<script>
    function previewImage(event) {
        const input = event.target;
        const preview = document.getElementById('profileImagePreview');

        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
            }
            reader.readAsDataURL(input.files[0]);
        }
    }
</script>


<!-- OTP Modal -->
<div class="modal fade" id="otpModal" tabindex="-1" aria-labelledby="otpModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="otpModalLabel">Enter OTP</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <input type="text" id="enteredOtp" class="form-control mb-3" placeholder="Enter OTP">
                <div class="d-flex justify-content-end">
                    <button class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn btn-success" onclick="confirmOtp()">Confirm</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- consent modal popup  -->
<!-- Consent Modal -->
<div class="modal fade" id="consentModal" tabindex="-1" aria-labelledby="consentModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-info text-white">
                <h5 class="modal-title" id="consentModalLabel">Enter Consent Info</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <input type="text" id="enteredConsent" class="form-control mb-3" placeholder="Consent Name / Department">
                <div class="d-flex justify-content-end">
                    <button class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn btn-success" onclick="confirmConsent()">Confirm</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- upload image modal popup  -->
<!-- Upload Image Modal -->
<div class="modal fade" id="uploadModal" tabindex="-1" aria-labelledby="uploadModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
                <h5 class="modal-title" id="uploadModalLabel">Upload Image</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <input type="file" class="form-control mb-3" id="uploadImageInput" name="consent_image">
                <div class="d-flex justify-content-end">
                    <button class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn btn-success" onclick="confirmImage()">Confirm</button>
                </div>
            </div>
        </div>
    </div>
</div>


<script>
    function handleSubmit(event) {
        event.preventDefault(); // prevent default submit
        const sendOtpChecked = document.getElementById("showOtp").checked;
        const sendConsentChecked = document.getElementById("showConsult").checked;
        const sendImageChecked = document.getElementById("showFormImage").checked;

        // Hide main form
        document.getElementById("mainForm").style.display = "none";

        // Priority-based modal triggering (optional: adjust order)
        if (sendOtpChecked) {
            const otpModal = new bootstrap.Modal(document.getElementById('otpModal'));
            otpModal.show();
        } else if (sendConsentChecked) {
            const consentModal = new bootstrap.Modal(document.getElementById('consentModal'));
            consentModal.show();
        } else if (sendImageChecked) {
            const uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));
            uploadModal.show();
        } else {
            // If none selected, just submit normally
            document.getElementById("mainForm").style.display = "block";
            document.getElementById("mainForm").submit();
        }

        return false;
    }

    // Re-show main form after modals close
    ['otpModal', 'consentModal', 'uploadModal'].forEach(function(modalId) {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', function() {
                document.getElementById("mainForm").style.display = "block";
            });
        }
    });

    // Optional: Modal submit confirm buttons
    function confirmOtp() {
        const otp = document.getElementById("enteredOtp").value.trim();
        if (otp === "") {
            alert("Please enter OTP");
            return;
        }
        document.getElementById("otpModal").classList.remove('show');
        document.getElementById("mainForm").submit();
    }

    function confirmConsent() {
        const consent = document.getElementById("enteredConsent").value.trim();
        if (consent === "") {
            alert("Please enter consent info");
            return;
        }
        document.getElementById("consentModal").classList.remove('show');
        document.getElementById("mainForm").submit();
    }

    function confirmImage() {
        // You can add image validation if needed
        document.getElementById("uploadModal").classList.remove('show');
        document.getElementById("mainForm").submit();
    }
</script>
<!--  -->


<!-- search and add functionality code and js  -->
<div class="col-xl-6 d-flex">
    <div class="card shadow-sm flex-fill w-100" style="border-top: 4px solid #00bef2;">
        <div class="card-body">
            <h3 class="fw-bold mb-2">Diagnosis</h3>
            <div class="mb-2">
                <label class="fw-bold text-dark mb-1" for="">Patient Complaints</label>
                <div class="d-flex align-items-center justify-content-between">
                    <div class="w-100 me-2">
                        <div class="input-group mb-1">
                            <div class="input-group-text"><i class="ti ti-search"></i></div>
                            <input type="text" class="form-control" id="complaintSearch" placeholder="Search patient complaints">
                        </div>
                    </div>
                    <div>
                        <i class="ti ti-plus fs-2 bg-info rounded-pill shadow text-white" data-bs-toggle="modal" data-bs-target="#staticBackdrop"></i>
                    </div>
                </div>
                <ul class="mb-3 list-style-none" id="patientComplaintList" style="display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); width: calc(100% - 2rem); max-height: 200px; overflow-y: auto;">
                    <li>
                        <label class="px-2 d-flex align-items-center">
                            <input class="form-check-input m-0 me-2" type="checkbox" data-complaint="Fever"> Fever
                        </label>
                    </li>
                    <li>
                        <label class="px-2 d-flex align-items-center">
                            <input class="form-check-input m-0 me-2" type="checkbox" data-complaint="Headache"> Headache
                        </label>
                    </li>
                    <li>
                        <label class="px-2 d-flex align-items-center">
                            <input class="form-check-input m-0 me-2" type="checkbox" data-complaint="Cough"> Cough
                        </label>
                    </li>
                </ul>
            </div>

            <div class="mb-2">

                <label class="fw-bold text-dark mb-1" for="">Select Treatment</label>
                <div class="d-flex align-items-center justify-content-between">
                    <div class="w-100 me-2">
                        <div class="input-group mb-2">
                            <div class="input-group-text"><i class="ti ti-search"></i></div>
                            <input type="text" class="form-control" id="treatmentSearch" placeholder="Search treatments">
                        </div>
                    </div>
                    <div>
                        <i class="ti ti-plus fs-2 bg-info rounded-pill shadow text-white" data-bs-toggle="modal" data-bs-target="#addTreatmentModal"></i>
                    </div>
                </div>
                <ul class="mb-3 list-style-none p-3" id="treatmentList" style="display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); width: calc(100% - 2rem); max-height: 200px; overflow-y: auto;">
                    <li>
                        <label class="px-2 d-flex align-items-center mb-2">
                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Ultrasound"> Ultrasound Therapy
                        </label>
                    </li>
                    <li>
                        <label class="px-2 d-flex align-items-center mb-2">
                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Estim"> E-STIM
                        </label>
                    </li>
                    <li>
                        <label class="px-2 d-flex align-items-center mb-2">
                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Tens"> TENS
                        </label>
                    </li>
                    <li>
                        <label class="px-2 d-flex align-items-center mb-2">
                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Ift"> IFT
                        </label>
                    </li>
                    <li>
                        <label class="px-2 d-flex align-items-center mb-2">
                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Laser"> Laser therapy
                        </label>
                    </li>
                </ul>
            </div>


            <div class="mb-3">
                <label>Description:</label>
                <textarea name="content" id="content" class="form-control"></textarea>
            </div>

        </div>
    </div>
</div>
<!--Patient Complaint Modal -->
<div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header form-bg">
                <h4 class="modal-title text-white" id="staticBackdropLabel">Add New Complaint</h4>
                <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <!-- <div class="modal-header">
                <h4 class="modal-title " id="staticBackdropLabel">Add New Complaint</h4>
                <button type="button" class="btn-close " data-bs-dismiss="modal" aria-label="Close"></button>
            </div> -->
            <div class="modal-body">
                <div>
                    <div class="input-group">
                        <input type="text" class="form-control" id="newComplaint" placeholder="Add new complaint">
                        <!-- <button class="btn btn-primary" type="button" id="addComplaintBtn">Add</button> -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" type="button" id="addComplaintBtn">Add</button>
            </div>
        </div>
    </div>
</div>

<!--Patient Complaint JavaScript -->
<script>
    // Initialize patient complaint list visibility
    const patientComplaintList = document.getElementById('patientComplaintList');
    const complaintSearch = document.getElementById('complaintSearch');
    if (patientComplaintList.children.length > 0) {
        patientComplaintList.style.display = 'none'; // Initially hidden
    }

    // Function to filter complaints based on search input
    function filterComplaints(searchTerm) {
        const complaints = patientComplaintList.querySelectorAll('li');
        let hasVisibleComplaints = false;
        complaints.forEach(complaint => {
            const complaintText = complaint.querySelector('label').textContent.toLowerCase();
            if (complaintText.includes(searchTerm.toLowerCase())) {
                complaint.style.display = 'block';
                hasVisibleComplaints = true;
            } else {
                complaint.style.display = 'none';
            }
        });
        // Show or hide the list based on whether there are visible complaints
        patientComplaintList.style.display = hasVisibleComplaints ? 'block' : 'none';
    }

    // Function to update search input with selected complaints
    function updateSearchInput() {
        const checkboxes = patientComplaintList.querySelectorAll('input[type="checkbox"]:checked');
        const selectedComplaints = Array.from(checkboxes).map(checkbox => checkbox.dataset.complaint);
        complaintSearch.value = selectedComplaints.join(', ');
        updateComplaintTable();
    }

    // Function to update the complaint table
    function updateComplaintTable() {
        const table = document.getElementById('patientComplaintTable');
        const tableBody = document.getElementById('patientComplaintTableBody');
        tableBody.innerHTML = ''; // Clear existing rows
        const checkboxes = patientComplaintList.querySelectorAll('input[type="checkbox"]:checked');
        const selectedComplaints = Array.from(checkboxes).map(checkbox => checkbox.dataset.complaint);

        if (selectedComplaints.length > 0) {
            table.style.display = 'table';
            selectedComplaints.forEach(complaint => {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.textContent = complaint;
                row.appendChild(cell);
                tableBody.appendChild(row);
            });
        } else {
            table.style.display = 'none';
        }
    }

    // Show checklist and filter on search input
    complaintSearch.addEventListener('input', () => {
        const searchTerm = complaintSearch.value.trim();
        filterComplaints(searchTerm);
    });

    // Toggle checklist on input click
    complaintSearch.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click from closing the dropdown immediately
        filterComplaints(complaintSearch.value.trim());
    });

    // Close checklist when clicking outside
    document.addEventListener('click', (event) => {
        if (!complaintSearch.contains(event.target) && !patientComplaintList.contains(event.target)) {
            patientComplaintList.style.display = 'none';
        }
    });

    // Add event listeners to checkboxes
    patientComplaintList.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            updateSearchInput();
        }
    });

    // Add new complaint from modal
    const addComplaintBtn = document.getElementById('addComplaintBtn');
    addComplaintBtn.addEventListener('click', () => {
        const newComplaintInput = document.getElementById('newComplaint');
        const newComplaint = newComplaintInput.value.trim();

        if (newComplaint) {
            const li = document.createElement('li');
            li.innerHTML = `
                <label class="px-2 d-flex align-items-center">
                    <input class="form-check-input m-0 me-2" type="checkbox" data-complaint="${newComplaint}">
                    ${newComplaint}
                </label>
            `;
            patientComplaintList.appendChild(li);
            newComplaintInput.value = ''; // Clear the input
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('staticBackdrop'));
            modal.hide();
            updateSearchInput(); // Update input after adding new complaint
        } else {
            alert('Please enter a complaint.');
        }
    });
</script>

<!--Select Treatment Modal -->
<div class="modal fade" id="addTreatmentModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="addTreatmentLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header form-bg">
                <h4 class="modal-title text-white" id="addTreatmentLabel">Add New Treatment</h4>
                <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <input type="text" class="form-control" id="newTreatment" placeholder="Add new treatment">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" type="button" id="addTreatmentBtn">Add</button>
            </div>
        </div>
    </div>
</div>

<!-- Select treatment JS  -->
<script>
    const treatmentList = document.getElementById('treatmentList');
    const treatmentSearch = document.getElementById('treatmentSearch');

    // Filter treatment list based on input
    function filterTreatments(searchTerm) {
        const treatments = treatmentList.querySelectorAll('li');
        let hasVisible = false;
        treatments.forEach(treatment => {
            const text = treatment.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                treatment.style.display = 'block';
                hasVisible = true;
            } else {
                treatment.style.display = 'none';
            }
        });
        treatmentList.style.display = hasVisible ? 'block' : 'none';
    }

    // Update selected treatments in input
    function updateTreatmentSearch() {
        const checkboxes = treatmentList.querySelectorAll('input[type="checkbox"]:checked');
        const selected = Array.from(checkboxes).map(cb => cb.dataset.treatment);
        treatmentSearch.value = selected.join(', ');
    }

    treatmentSearch.addEventListener('input', () => {
        filterTreatments(treatmentSearch.value.trim());
    });

    treatmentSearch.addEventListener('click', (e) => {
        e.stopPropagation();
        filterTreatments(treatmentSearch.value.trim());
    });

    document.addEventListener('click', (e) => {
        if (!treatmentSearch.contains(e.target) && !treatmentList.contains(e.target)) {
            treatmentList.style.display = 'none';
        }
    });

    treatmentList.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            updateTreatmentSearch();
        }
    });

    // Add new treatment via modal
    document.getElementById('addTreatmentBtn').addEventListener('click', () => {
        const newInput = document.getElementById('newTreatment');
        const newValue = newInput.value.trim();

        if (newValue) {
            const li = document.createElement('li');
            li.innerHTML = `
                <label class="px-2 d-flex align-items-center">
                    <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="${newValue}">
                    ${newValue}
                </label>
            `;
            treatmentList.appendChild(li);
            newInput.value = '';
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTreatmentModal'));
            modal.hide();
            updateTreatmentSearch();
        } else {
            alert("Please enter a treatment.");
        }
    });
</script>

<!-- end of dignosis  -->