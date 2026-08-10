<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Appointment</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Font Awesome Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/all.min.css">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="assets/plugins/select2/css/select2.min.css">

    <!-- Daterangepicker CSS -->
    <link rel="stylesheet" href="assets/plugins/daterangepicker/daterangepicker.css">

    <!-- Datetimepicker CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap-datetimepicker.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets/plugins/simplebar/simplebar.min.css">

    <!-- Datatable CSS -->
    <link rel="stylesheet" href="assets/css/dataTables.bootstrap5.min.css">

    <!-- Main CSS -->
    <link rel="stylesheet" href="assets/css/style.css" id="app-style">

    <style>
        .step-tab {
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            text-align: center;
            border-radius: 0;
            background-color: #f5f5f9;
            border: 1px solid #00bef2 !important;
            margin-right: -1px;
            color: #495057;
        }

        .step-tab:hover {
            background-color: #00bef2;
            border: 1px solid #fff !important;
            color: #fff;
        }

        .step-tab.active {
            background-color: #00bef2 !important;
            color: #fff !important;
            border-color: #00bef2 !important;
        }

        /* Ensure radio list width matches input group */
        #radioList {
            width: 100% !important;
            max-width: 100%;
            z-index: 1050;
            /* Ensure it appears above other elements */
        }

        /* Circular 3D Confirmation Modal Styling */
        #confirmationModal .modal-content {
            border-radius: 50%;
            width: 200px;
            height: 200px;
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2),
                inset 0 4px 8px rgba(255, 255, 255, 0.5),
                inset 0 -4px 8px rgba(0, 0, 0, 0.2);
            border: 5px solid #1e88e5;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #confirmationModal .modal-dialog {
            max-width: 200px;
        }

        #confirmationModal .modal-body {
            padding: 0;
            text-align: center;
            background: transparent;
        }

        #confirmationModal .token-number {
            font-size: 3.5rem;
            font-weight: 700;
            color: #1e88e5;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2),
                -1px -1px 2px rgba(255, 255, 255, 0.5);
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

        <!-- Start Page Content -->
        <div class="page-wrapper">
            <!-- Start Content -->
            <div class="content">
                <!-- Start Page Header -->
                <div>
                    <h4 class="fw-bold mb-3 color-doctorrx">Wallet</h4>
                </div>
                <div class="row align-items-center">
                    <!-- Left Side Filters -->
                    <div class="col-lg-9">
                        <div class="row">
                            <!-- Search -->
                            <div class="col-12 col-md-6 col-lg-3 mb-3">
                                <div class="search-set">
                                    <div class="table-search d-flex align-items-center mb-0">
                                        <div class="search-input w-100">
                                            <a href="javascript:void(0);" class="btn-searchset"></a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="col-12 col-md-6 col-lg-3 mb-3">
                                <div class=" w-100">
                                    <a href="" class="btn btn-md w-100 fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center justify-content-between" data-bs-toggle="dropdown">
                                        Current Balance : $8984
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side Buttons -->
                    <div class="col-lg-3 text-lg-end mb-3">
                        <div class="d-flex flex-wrap gap-2 justify-content-lg-end">
                            <!-- Export Button -->
                            <div class="">
                                <a href="" class="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center" data-bs-toggle="dropdown">
                                    Last Withdrawn Amount : $4985
                                </a>

                            </div>

                            <!-- Book Appointment Button -->
                            <!-- <a href="javascript:void(0);" class="btn btn-primary fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                                <i class="ti ti-plus me-1"></i> Book Appointment
                            </a> -->
                        </div>
                    </div>
                </div>

                <!-- Start Table -->
                <div class="table-responsive text-nowrap">
                    <table class="table">
                        <thead class="table-light">
                            <tr>
                                <th class="px-3 sortable" onclick="sortTable(0)">Sr No. <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(1)">Date & Time <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(2)">Note <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(3)">Patient <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(4)">Amount <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(5)">Status <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(5)">Action <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(5)">Type <i class="fas fa-sort"></i></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-02.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="Prescription.php" class="text-dark fw-semibold">Susan Babin<span class="text-body fs-13 fw-normal d-block"> +1 65658 95654</span> </a>
                                    </div>
                                </td>
                                <td>15 Apr 2025 - 11:20 AM</td>
                                <td>Withdraw Money to Bank to Account Number 1231231231</td>
                                <td>$6591</td>
                                <td><span class="badge badge-soft-success rounded text-success fw-medium fs-13">Approved</span></td>
                                <td>Credit</td>
                                <td>Withdraw money to Bank</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="doctors-patient-details.php" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-03.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="Prescription.php" class="text-dark fw-semibold">Carol Lam <span class="text-body fs-13 fw-normal d-block"> +1 55654 56647</span> </a>
                                    </div>
                                </td>
                                <td>02 Apr 2025 - 08:15 AM</td>
                                <td>Withdraw Money to Bank to Account Number 1231231231</td>
                                <td>$6297</td>
                                <td><span class="badge badge-soft-danger rounded text-danger fw-medium fs-13">Pending</span></td>
                                <td>Credit</td>
                                <td>Withdraw Money to Bank</td>
                            </tr>
                        </tbody>

                    </table>
                </div>
                <!-- End Table -->
            </div>
            <!-- End Content -->

            <!-- Footer Start -->
            <?php include('assets/inc/footer.php'); ?>
            <!-- Footer End -->
        </div>
        <!-- End Page Content -->
    </div>
    <!-- End Wrapper -->


    <!-- jQuery -->
    <script src="assets/js/jquery-3.7.1.min.js" type="text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="text/javascript"></script>

    <!-- Simplebar JS -->
    <script src="assets/plugins/simplebar/simplebar.min.js" type="text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="text/javascript"></script>

    <!-- Daterangepicker JS -->
    <script src="assets/js/moment.min.js" type="text/javascript"></script>
    <script src="assets/plugins/daterangepicker/daterangepicker.js" type="text/javascript"></script>

    <!-- Datetimepicker JS -->
    <script src="assets/js/bootstrap-datetimepicker.min.js" type="text/javascript"></script>

    <!-- Datatable JS -->
    <script src="assets/js/jquery.dataTables.min.js" type="text/javascript"></script>
    <script src="assets/js/dataTables.bootstrap5.min.js" type="text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="text/javascript"></script>

</body>

</html>