<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Expense</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

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
                        <h4 class="fw-bold mb-0"> Expenses </h4>
                    </div>

                    <div class="text-end d-flex">
                        <!-- dropdown-->
                        <div class="dropdown me-1">
                            <a href="" class="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center" data-bs-toggle="dropdown">
                                Income & Expense<i class="ti ti-chevron-down ms-2"></i>
                            </a>
                            <ul class="dropdown-menu p-2">
                                <li>
                                    <a class="dropdown-item" href="expense.php"><i class="ti ti-credit-card me-2"></i>Expense</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="income.php"><i class="ti ti-coins me-2"></i>Income</a>
                                </li>
                            </ul>
                        </div>
                        <!-- <a href="javascript:void(0);" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#staticBackdrop"><i class="ti ti-plus me-1"></i>Add </a> -->
                        <a href="javascript:void(0);"
                            class="btn btn-primary ms-2 fs-13 btn-md"
                            data-bs-toggle="modal"
                            data-bs-target="#staticBackdrop"
                            data-transaction="expense"
                            onclick="prepareTransactionModal(this)">
                            <i class="ti ti-plus me-1"></i>Add Expense
                        </a>
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
                        <!-- <div class="dropdown">
                            <a href="javascript:void(0);" class="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                                <span class="me-1"> Sort By : </span> Recent
                            </a>
                            <ul class="dropdown-menu  dropdown-menu-end p-2">
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">Recent</a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">Oldest</a>
                                </li>
                            </ul>
                        </div> -->
                    </div>
                </div>
                <!--  End Filter -->

                <!--  Start Table -->
                <div class="table-responsive">
                    <table class="table table-nowrap datatable">
                        <thead class="thead-light">
                            <tr>
                                <th class="no-sort">
                                    Expense
                                </th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Purchased By</th>
                                <th>Payment Method</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td> <a href="#">Gloves & Masks</a></td>
                                <td class="text-dark"> Medical Supplies </td>
                                <td class="fw-semibold text-dark"> $800</td>
                                <td class="text-dark"> 30 Apr 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-01.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">James Adair </a>
                                    </div>
                                </td>
                                <td class="text-dark">PayPal</td>
                                <td> <span class="badge badge-soft-success rounded text-success fw-medium border border-success">Approved</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">Microscope Parts</a></td>
                                <td class="text-dark"> Laboratory </td>
                                <td class="fw-semibold text-dark"> $930</td>
                                <td class="text-dark"> 15 Apr 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-02.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Esther Schmidt </a>
                                    </div>
                                </td>
                                <td class="text-dark">Debit Card</td>
                                <td> <span class="badge badge-soft-warning rounded text-warning fw-medium border border-warning">Pending</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">Thermometers</a></td>
                                <td class="text-dark"> Medical Supplies </td>
                                <td class="fw-semibold text-dark"> $850</td>
                                <td class="text-dark">02 Apr 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-03.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Judi Lenahan </a>
                                    </div>
                                </td>
                                <td class="text-dark">Cheque</td>
                                <td> <span class="badge badge-soft-success rounded text-success fw-medium border border-success">Approved</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">Disinfectant Supplies</a></td>
                                <td class="text-dark"> Cleaning Services </td>
                                <td class="fw-semibold text-dark"> $700</td>
                                <td class="text-dark"> 27 Mar 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-04.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Robert Reid </a>
                                    </div>
                                </td>
                                <td class="text-dark">Debit Card</td>
                                <td> <span class="badge badge-soft-danger rounded text-danger fw-medium border border-danger">Rejected </span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">IV Sets</a></td>
                                <td class="text-dark"> Medical Supplies </td>
                                <td class="fw-semibold text-dark"> $650</td>
                                <td class="text-dark"> 12 Mar 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/profiles/avatar-01.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Dottie Sellers </a>
                                    </div>
                                </td>
                                <td class="text-dark">PayPal</td>
                                <td> <span class="badge badge-soft-primary rounded text-primary fw-medium border border-primary">New</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">Reagent Refill</a></td>
                                <td class="text-dark"> Laboratory </td>
                                <td class="fw-semibold text-dark"> $430</td>
                                <td class="text-dark"> 05 Mar 2025</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/doctors/doctor-02.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Cheryl Bilodeau </a>
                                    </div>
                                </td>
                                <td class="text-dark">Cheque</td>
                                <td> <span class="badge badge-soft-danger rounded text-danger fw-medium border border-danger">Rejected</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">Syringes & Gauze</a></td>
                                <td class="text-dark"> Medical Supplies </td>
                                <td class="fw-semibold text-dark"> $300</td>
                                <td class="text-dark"> 24 Feb 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-07.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Valerie Padgett </a>
                                    </div>
                                </td>
                                <td class="text-dark">Debit Card</td>
                                <td> <span class="badge badge-soft-primary rounded text-primary fw-medium border border-primary">New</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">Blood Collection Tubes</a></td>
                                <td class="text-dark"> Laboratory </td>
                                <td class="fw-semibold text-dark"> $450</td>
                                <td class="text-dark"> 16 Feb 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/doctors/doctor-05.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Diane Nash </a>
                                    </div>
                                </td>
                                <td class="text-dark">Cheque</td>
                                <td> <span class="badge badge-soft-success rounded text-success fw-medium border border-success">Approved</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">Bandages & Tapes</a></td>
                                <td class="text-dark"> Medical Supplies </td>
                                <td class="fw-semibold text-dark"> $570</td>
                                <td class="text-dark"> 01 Feb 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/doctors/doctor-07.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Sally Cavazos </a>
                                    </div>
                                </td>
                                <td class="text-dark">Debit Card</td>
                                <td> <span class="badge badge-soft-primary rounded text-primary fw-medium border border-primary">New</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_modal">Delete</a>
                                        </li>
                                    </ul>
                                </td>
                            </tr>

                            <tr>
                                <td> <a href="#">Tissue Slides</a></td>
                                <td class="text-dark"> Laboratory </td>
                                <td class="fw-semibold text-dark"> $800</td>
                                <td class="text-dark"> 25 Jan 2025 </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:void(0);" class="avatar avatar-md me-2">
                                            <img src="assets/img/users/user-09.jpg" alt="product" class="rounded-circle">
                                        </a>
                                        <a href="javascript:void(0);" class="text-dark fw-semibold">Forest Heath </a>
                                    </div>
                                </td>
                                <td class="text-dark">PayPal</td>
                                <td> <span class="badge badge-soft-success rounded text-success fw-medium border border-success">Approved</span> </td>
                                <td class="action-item">
                                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu p-2">
                                        <li>
                                            <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_new_expense">Edit</a>
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

<!-- Start Add Expense -->
<div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header form-bg px-3">
                <h5 class="modal-title text-white fw-bold" id="modalTitle">Add Transaction</h5>
                <button type="button" class="btn-close bg-white rounded-circle" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form>
                    <!-- Transaction Type Selector -->
                    <div class="mb-3">
                        <label class="form-label text-dark fw-bold">Transaction Type<span class="text-danger">*</span></label>
                        <select class="form-select fw-bold border-0 border-start border-3 border-info shadow" id="transaction_type" onchange="toggleTransactionFields(this.value)">
                            <option class="fw-bold" selected disabled>Select</option>
                            <option class="fw-bold" value="expense">Expense</option>
                            <option class="fw-bold" value="income">Income</option>
                        </select>
                    </div>

                    <!-- Expense Fields -->
                    <div id="expense_fields" style="display: none;">
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Date<span class="text-danger">*</span></label>
                                <input type="date" class="form-control border-0 border-start border-3 border-info shadow ">
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Category<span class="text-danger">*</span></label>
                                <input type="text" class="form-control border-0 border-start border-3 border-info shadow" placeholder="category">
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Subcategory<span class="text-danger">*</span></label>
                                <input type="text" class="form-control border-0 border-start border-3 border-info shadow" placeholder="sub-category">
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Created By<span class="text-danger">*</span></label>
                                <input type="text" class="form-control border-0 border-start border-3 border-info shadow" placeholder="created-by">
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Amount<span class="text-danger">*</span></label>
                                <input type="number" class="form-control border-0 border-start border-3 border-info shadow" placeholder="amount">
                            </div>
                            <!-- File Upload (Common) -->
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Upload File</label>
                                <input type="file" class="form-control border-0 border-start border-3 border-info shadow">
                            </div>
                            <!-- Submit Button -->
                            <div class="">
                                <button type="submit" class="btn btn-primary btn-sm">Submit</button>
                            </div>

                        </div>
                    </div>

                    <!-- Income Fields -->
                    <div id="income_fields" style="display: none;">
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Date<span class="text-danger">*</span></label>
                                <input type="date" class="form-control border-0 border-start border-3 border-info shadow">
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Income Source<span class="text-danger">*</span></label>
                                <select class="form-select border-0 border-start border-3 border-info shadow">
                                    <option selected disabled>Select Source</option>
                                    <option>Patient - John Doe (ID: P101)</option>
                                    <option>Donation</option>
                                </select>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Created By<span class="text-danger">*</span></label>
                                <input type="text" class="form-control border-0 border-start border-3 border-info shadow" placeholder="created-by">
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Amount<span class="text-danger">*</span></label>
                                <input type="number" class="form-control border-0 border-start border-3 border-info shadow" placeholder="amount">
                            </div>
                            <!-- File Upload (Common) -->
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Upload File</label>
                                <input type="file" class="form-control border-0 border-start border-3 border-info shadow">
                            </div>

                            <!-- Submit Button -->
                            <div class="">
                                <button type="submit" class="btn btn-primary btn-sm">Submit</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- End Add Expense  -->


<!-- <script>
    function toggleTransactionFields(type) {
        
        document.getElementById('expense_fields').style.display = (type === 'expense') ? 'block' : 'none';
        document.getElementById('income_fields').style.display = (type === 'income') ? 'block' : 'none';

       
        const title = document.getElementById('modalTitle');
        if (type === 'expense') {
            title.textContent = 'Add Expense';
        } else if (type === 'income') {
            title.textContent = 'Add Income';
        } else {
            title.textContent = 'Add Transaction';
        }
    }
</script> -->

<script>
    function toggleTransactionFields(type) {
        // Show/hide respective fields
        document.getElementById('expense_fields').style.display = (type === 'expense') ? 'block' : 'none';
        document.getElementById('income_fields').style.display = (type === 'income') ? 'block' : 'none';

        // Update modal title
        const title = document.getElementById('modalTitle');
        if (type === 'expense') {
            title.textContent = 'Add Expense';
        } else if (type === 'income') {
            title.textContent = 'Add Income';
        } else {
            title.textContent = 'Add Transaction';
        }

        // Set dropdown value
        const select = document.getElementById('transaction_type');
        select.value = type || '';
    }

    // Prepare modal when clicking "Add" button
    function prepareTransactionModal(button) {
        const type = button.getAttribute('data-transaction');
        toggleTransactionFields(type);
    }

    // Optional: reset modal when closed
    document.getElementById('staticBackdrop').addEventListener('hidden.bs.modal', function() {
        // Reset dropdown
        const select = document.getElementById('transaction_type');
        select.value = '';
        toggleTransactionFields(''); // hides all sections
    });
</script>