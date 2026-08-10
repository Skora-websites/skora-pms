<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Appointment Reminders</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- Favicon -->
    <link rel="shortcut icon" href="assets-doctor/img/logo.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets-doctor/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets-doctor/js/theme-script.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets-doctor/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets-doctor/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets-doctor/plugins/simplebar/simplebar.min.css">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="assets-doctor/plugins/select2/css/select2.min.css">

    <!-- Fontawesome CSS -->
    <link rel="stylesheet" href="assets-doctor/plugins/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="assets-doctor/plugins/fontawesome/css/all.min.css">

    <!-- Datetimepicker CSS -->
    <link rel="stylesheet" href="assets-doctor/css/bootstrap-datetimepicker.min.css">

    <!-- Daterangepikcer CSS -->
    <link rel="stylesheet" href="assets-doctor/plugins/daterangepicker/daterangepicker.css">

    <!-- Main CSS -->
    <link rel="stylesheet" href="assets-doctor/css/style.css" id="app-style">

</head>

<body>

    <!-- Begin Wrapper -->
    <div class="main-wrapper">

        <!-- Topbar Start -->
        <?php include('assets-doctor/inc/header.php'); ?>
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
        <div class="page-wrapper">
            <div class="content" id="profilePage">
                <div class="mb-3 border-bottom pb-3">
                    <h4 class="fw-bold mb-0">Settings</h4>
                </div>
                <div class="card mb-0">
                    <div class="card-body p-0">
                        <div class="settings-wrapper d-flex">
                            <!-- Start Settings Sidebar -->
                            <?php include('assets-doctor/inc/setting-sidebar.php'); ?>
                            <!-- End Settings Sidebar -->

                            <div class="card flex-fill mb-0 border-0 bg-light-500 shadow-none">
                                <div class="card-header border-bottom px-0 mx-3">
                                    <div class="d-flex align-items-center">
                                        <h5 class="fw-bold">Appointment Reminders</h5>
                                    </div>
                                </div>
                                <div class="card-body px-0 mx-3 break-hours-section" id="break-hours-section">

                                    <!-- start row -->
                                    <div class="row row-gap-2 align-items-center justify-content-between pb-3 mb-3 border-bottom">
                                        <div class="col-lg-11">
                                            <h6 class="fs-14 fw-medium">Automatically notify clients about upcoming appointments.</h6>
                                        </div><!-- end col -->
                                        <div class="col-lg-1">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input text-end me-1" type="checkbox" checked="">
                                            </div>
                                        </div><!-- end col -->
                                        <div class="col-lg-11">
                                            <h6 class="fs-14 fw-medium">Reminders for weekend appointments go out on Friday.</h6>
                                        </div><!-- end col -->
                                        <div class="col-lg-1">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input text-end me-1" type="checkbox">
                                            </div>
                                        </div><!-- end col -->
                                        <div class="col-lg-11">
                                            <h6 class="fs-14 fw-medium">Appointments auto-cancel if clients reply 'No' or 'Cancel' to reminders.</h6>
                                        </div><!-- end col -->
                                        <div class="col-lg-1">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input text-end me-1" type="checkbox" checked="">
                                            </div>
                                        </div><!-- end col -->
                                    </div>
                                    <!-- end row -->

                                    <div>
                                        <h5 class="fw-bold mb-3">Automatic Reminders</h5>

                                        <div class="reminder-list mb-3 border-bottom">

                                            <div class="row d-flex align-items-center mb-3 reminder-list-item">
                                                <div class="col-md-2">
                                                    <h6 class="fs-14 fw-medium mb-0">Reminder </h6>
                                                </div>
                                                <div class="col-md-10 flex-grow-1">
                                                    <div class="d-flex align-items-center justify-content-end">
                                                        <div class="me-2">
                                                            <select class="select me-2">
                                                                <option selected>Email</option>
                                                                <option>SMS</option>
                                                            </select>
                                                        </div>
                                                        <div class="me-2">
                                                            <select class="select me-2">
                                                                <option>Select</option>
                                                                <option>Welcome Email</option>
                                                                <option selected>Appointment Reminder</option>
                                                                <option>Appointment Confirmation</option>
                                                                <option>Appointment Rescheduled</option>
                                                                <option>Appointment Cancelled</option>
                                                                <option>Test Result Notification</option>
                                                            </select>
                                                        </div>
                                                        <div class="me-2">
                                                            <select class="select me-2">
                                                                <option selected>01 </option>
                                                                <option>02</option>
                                                                <option>03</option>
                                                                <option>05</option>
                                                                <option>10</option>
                                                            </select>
                                                        </div>
                                                        <span class="me-2">
                                                            Days Before
                                                        </span>
                                                        <div class="d-flex align-items-center">
                                                            <a href="javascript:void(0);" class="btn btn-white p-2 border rounded-2 me-2"><i class="ti ti-edit"></i></a>
                                                            <a href="javascript:void(0);" class="btn btn-white p-2 border rounded-2 add-reminder"><i class="ti ti-plus"></i></a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row d-flex align-items-center mb-3 reminder-list-item">
                                                <div class="col-md-2">
                                                    <h6 class="fs-14 fw-medium mb-0">Reminder </h6>
                                                </div>
                                                <div class="col-md-10 flex-grow-1">
                                                    <div class="d-flex align-items-center justify-content-end">
                                                        <div class="me-2">
                                                            <select class="select me-2">
                                                                <option selected>Email</option>
                                                                <option>SMS</option>
                                                            </select>
                                                        </div>
                                                        <div class="me-2">
                                                            <select class="select me-2">
                                                                <option>Select</option>
                                                                <option>Welcome Email</option>
                                                                <option selected>Appointment Reminder</option>
                                                                <option>Appointment Confirmation</option>
                                                                <option>Appointment Rescheduled</option>
                                                                <option>Appointment Cancelled</option>
                                                                <option>Test Result Notification</option>
                                                            </select>
                                                        </div>
                                                        <div class="me-2">
                                                            <select class="select me-2">
                                                                <option selected>01 </option>
                                                                <option>02</option>
                                                                <option>03</option>
                                                                <option>05</option>
                                                                <option>10</option>
                                                            </select>
                                                        </div>
                                                        <span class="me-2">
                                                            Days Before
                                                        </span>
                                                        <div class="d-flex align-items-center">
                                                            <a href="javascript:void(0);" class="btn btn-white p-2 border rounded-2 me-2"><i class="ti ti-edit"></i></a>
                                                            <a href="javascript:void(0);" class="btn btn-white p-2 border rounded-2 remove-reminder"><i class="ti ti-trash"></i></a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        <div class=" pb-3 mb-3 border-bottom">
                                            <div class="d-flex align-items-center justify-content-between mb-3">
                                                <h5 class="fw-bold mb-0">Manual Reminders</h5>
                                            </div>

                                            <!-- start row -->
                                            <div class="row align-items-center row-gap-2 mb-3">
                                                <div class="col-lg-6">
                                                    <p class="text-dark fw-medium mb-0">SMS Reminder Template</p>
                                                </div><!-- end col -->
                                                <div class="col-lg-6">
                                                    <div class="d-flex align-items-center gap-3">
                                                        <select class="select">
                                                            <option>Select</option>
                                                            <option>Appointment Confirmation</option>
                                                            <option>Appointment Reminder</option>
                                                            <option>Appointment Rescheduled</option>
                                                            <option>Appointment Cancellation</option>
                                                            <option>Test Results Notification</option>
                                                            <option>Follow-Up Reminder</option>
                                                        </select>
                                                        <a href="javascript:void(0);" class="btn btn-white p-2 border rounded-2 me-2"><i class="ti ti-edit"></i></a>
                                                    </div>
                                                </div><!-- end col -->
                                            </div>
                                            <!-- end row -->

                                            <!-- start row -->
                                            <div class="row align-items-center row-gap-2 mb-3">
                                                <div class="col-lg-6">
                                                    <p class="text-dark fw-medium mb-0">Email Reminder Template</p>
                                                </div><!-- end col -->
                                                <div class="col-lg-6">
                                                    <div class="d-flex align-items-center gap-3">
                                                        <select class="select">
                                                            <option>Select</option>
                                                            <option>Welcome Email</option>
                                                            <option>Appointment Confirmation</option>
                                                            <option>Appointment Reminder</option>
                                                            <option>Appointment Rescheduled</option>
                                                            <option>Appointment Cancelled</option>
                                                            <option>Test Result Notification</option>
                                                        </select>
                                                        <a href="javascript:void(0);" class="btn btn-white p-2 border rounded-2 me-2"><i class="ti ti-edit"></i></a>
                                                    </div>
                                                </div><!-- end col -->
                                            </div>
                                            <!-- end row -->

                                            <div class="border-top pt-3">

                                                <!-- start row -->
                                                <div class="row align-items-center mb-3">
                                                    <div class="col-9">
                                                        <p class="mb-0 text-dark fw-medium">Send reminder automatically upon new appointment booking</p>
                                                    </div>
                                                    <div class="col-3">
                                                        <div class="d-flex align-items-center justify-content-end">
                                                            <div class="form-check form-switch">
                                                                <input class="form-check-input text-end me-1" type="checkbox" checked="">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- start end -->

                                                <!-- start row -->
                                                <div class="row align-items-center row-gap-2">
                                                    <div class="col-xl-5 col-lg-3">
                                                        <p class="text-dark fw-medium mb-0">Reminder</p>
                                                    </div><!-- end col -->
                                                    <div class="col-xl-7 col-lg-9">
                                                        <div class="d-flex align-items-center gap-3">
                                                            <select class="select">
                                                                <option>Email</option>
                                                                <option>SMS</option>
                                                            </select>
                                                            <select class="select">
                                                                <option>Appointment Remainder</option>
                                                                <option>Welcome Email</option>
                                                                <option>Appointment Confirmation</option>
                                                                <option>Appointment Reminder</option>
                                                                <option>Appointment Rescheduled</option>
                                                                <option>Appointment Cancelled</option>
                                                                <option>Test Result Notification</option>
                                                            </select>
                                                            <a href="javascript:void(0);" class="btn btn-white p-2 border rounded-2 me-2"><i class="ti ti-edit"></i></a>
                                                        </div>
                                                    </div><!-- end col -->
                                                </div>
                                                <!-- end row -->
                                            </div>

                                        </div>

                                        <div class="d-flex align-items-center justify-content-end">
                                            <a href="javascript:void(0);" class="btn btn-light me-2">Cancel</a>
                                            <a href="javascript:void(0);" class="btn btn-primary">Save Changes</a>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                    </div><!-- end card body -->
                </div><!-- end card -->

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

    <!-- jQuery -->
    <script src="assets-doctor/js/jquery-3.7.1.min.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets-doctor/js/bootstrap.bundle.min.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>

    <!-- Simplebar JS -->
    <script src="assets-doctor/plugins/simplebar/simplebar.min.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets-doctor/plugins/select2/js/select2.min.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>

    <!-- Daterangepikcer JS -->
    <script src="assets-doctor/js/moment.min.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>
    <script src="assets-doctor/plugins/daterangepicker/daterangepicker.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>

    <!-- Date Time Pikcer JS -->
    <script src="assets-doctor/js/bootstrap-datetimepicker.min.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets-doctor/js/script.js" type="0ea854bda0b6efc57c08769f-text/javascript"></script>

    <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="0ea854bda0b6efc57c08769f-|49" defer></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fec723ba051de","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>
</body>

</html>