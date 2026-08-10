
<!DOCTYPE html>
<html lang="en">
<head>

	<!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Notifications Settings</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="author" content="Dreams Technologies">
	
    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="03bdcdd6ae3d1206afc3e479-text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets/plugins/simplebar/simplebar.min.css">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="assets/plugins/select2/css/select2.min.css">

    <!-- Fontawesome CSS -->
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/all.min.css">

    <!-- Daterangepikcer CSS -->
    <link rel="stylesheet" href="assets/plugins/daterangepicker/daterangepicker.css">

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
            <div class="content" id="profilePage">

                <!-- Page Header -->
                <div class="mb-3 border-bottom pb-3">
                    <h4 class="fw-bold mb-0">Settings</h4>
                </div>
				<!-- End Page Header -->

                <div class="card">
                    <div class="card-body p-0">
                        <div class="settings-wrapper d-flex">

                             <!-- Start Settings Sidebar -->
                            <?php include('assets/inc/setting-sidebar.php'); ?>
                            <!-- End Settings Sidebar -->

                            <div class="card flex-fill mb-0 border-0 bg-light-500 shadow-none">
                                <div class="card-header border-bottom px-0 mx-3">
                                    <h5 class="fw-bold">Notifications</h5>
                                </div><!-- end card header -->
                                <div class="card-body px-0 mx-3">
                                    <!-- Items -->
                                    <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border mb-3 p-3 rounded">
                                        <div class="d-flex align-items-center">
                                            <span class="avatar avatar-lg border bg-light me-2">
                                                <i class="ti ti-calendar-time text-dark fs-16"></i>
                                            </span>
                                            <div>
                                                <h5 class="fs-14 fw-semibold mb-1">New Appointment Booking</h5>
                                                <p class="fs-13">Alert when an appointment is booked</p>
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center gap-4">
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> Email </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> SMS </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> In App </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Items -->
                                    <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border mb-3 p-3 rounded">
                                        <div class="d-flex align-items-center">
                                            <span class="avatar avatar-lg border bg-light me-2">
                                                <i class="ti ti-calendar-x text-dark fs-16"></i>
                                            </span>
                                            <div>
                                                <h5 class="fs-14 fw-semibold mb-1">Appointment Cancellation</h5>
                                                <p class="fs-13">Alert if a appointment is cancel</p>
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center gap-4">
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> Email </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> SMS </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> In App </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Items -->
                                    <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border mb-3 p-3">
                                        <div class="d-flex align-items-center">
                                            <span class="avatar avatar-lg border bg-light me-2">
                                                <i class="ti ti-calendar-time text-dark fs-16"></i>
                                            </span>
                                            <div>
                                                <h5 class="fs-14 fw-semibold mb-1">Lab Report Ready</h5>
                                                <p class="fs-13">Notify when test reports are available</p>
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center gap-4">
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> Email </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> SMS </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> In App </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Items -->
                                    <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border mb-3 p-3">
                                        <div class="d-flex align-items-center">
                                            <span class="avatar avatar-lg border bg-light me-2">
                                                <i class="ti ti-activity-heartbeat text-dark fs-16"></i>
                                            </span>
                                            <div>
                                                <h5 class="fs-14 fw-semibold mb-1">Follow-up Reminders</h5>
                                                <p class="fs-13">Scheduled follow-ups from doctors</p>
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center gap-4">
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> Email </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> SMS </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> In App </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Items -->
                                    <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border mb-3 p-3">
                                        <div class="d-flex align-items-center">
                                            <span class="avatar avatar-lg border bg-light me-2">
                                                <i class="ti ti-file-dollar text-dark fs-16"></i>
                                            </span>
                                            <div>
                                                <h5 class="fs-14 fw-semibold mb-1">Billing/Invoice Notification</h5>
                                                <p class="fs-13">Notify when a new bill or invoice is generated</p>
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center gap-4">
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> Email </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> SMS </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> In App </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Items -->
                                    <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border mb-0 p-3">
                                        <div class="d-flex align-items-center">
                                            <span class="avatar avatar-lg border bg-light me-2">
                                                <i class="ti ti-alert-octagon text-dark fs-16"></i>
                                            </span>
                                            <div>
                                                <h5 class="fs-14 fw-semibold mb-1">System Alerts</h5>
                                                <p class="fs-13">Login attempts, data changes, or system updates.</p>
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center gap-4">
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> Email </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> SMS </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                            <div class="">
                                                <p class="fw-medium mb-1 text-dark"> In App </p>
                                                <label class="d-flex align-items-center form-switch ps-0">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div><!-- end card body -->
                            </div><!-- end card -->
                        </div>

                    </div><!-- end card body -->
                </div><!-- end card -->
                                
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
    <script src="assets/js/jquery-3.7.1.min.js" type="03bdcdd6ae3d1206afc3e479-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="03bdcdd6ae3d1206afc3e479-text/javascript"></script>    

	<!-- Simplebar JS -->
	<script src="assets/plugins/simplebar/simplebar.min.js" type="03bdcdd6ae3d1206afc3e479-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="03bdcdd6ae3d1206afc3e479-text/javascript"></script>

    <!-- Daterangepikcer JS -->
    <script src="assets/js/moment.min.js" type="03bdcdd6ae3d1206afc3e479-text/javascript"></script>
    <script src="assets/plugins/daterangepicker/daterangepicker.js" type="03bdcdd6ae3d1206afc3e479-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="03bdcdd6ae3d1206afc3e479-text/javascript"></script>

<script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="03bdcdd6ae3d1206afc3e479-|49" defer></script><script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fec63dabbf04f","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>
</body>
</html>