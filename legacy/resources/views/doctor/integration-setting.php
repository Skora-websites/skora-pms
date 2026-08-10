
<!DOCTYPE html>
<html lang="en">
<head>

	<!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Integrations Settings</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="author" content="Dreams Technologies">
	
    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/favicon.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="1080582599d473fcf5dba3ee-text/javascript"></script>

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
                                    <h5 class="fw-bold">Integrations</h5>
                                </div>
                                <div class="card-body px-0 mx-3">
                                    <!-- start row -->
                                <div class="row">

                                    <div class="col-md-6">
                                        <div class="card shadow-none">
                                            <div class="card-body">
                                                <div class="d-flex">
                                                        <span class="avatar avatar-lg p-2 bg-light rounded flex-shrink-0 me-2"><img src="assets/img/icons/mail-icon.svg" alt="Img"></span>
                                                        <div>
                                                            <p class="fw-medium text-dark mb-1">Gmail</p>
                                                            <p class="mb-0">Send invoices, payment reminders and customer communication directly </p>
                                                        </div>
                                                </div>
                                            </div> <!-- end card body -->
                                            <div class="card-footer d-flex align-items-center justify-content-between ">
                                                <div class="d-flex align-items-center">
                                                    <a class="btn btn-sm btn-light border rounded-2 p-1 me-2" href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i class="ti ti-trash"></i></a>
                                                    <a class="btn btn-sm btn-light border rounded-2 p-1" href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i class="ti ti-settings"></i></a>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </div>
                                            </div> <!-- end card footer -->
                                        </div> <!-- end card -->
                                    </div> <!-- end col -->

                                    <div class="col-md-6">
                                        <div class="card shadow-none">
                                            <div class="card-body">
                                                <div class="d-flex">
                                                    <span class="avatar avatar-lg p-2 bg-light rounded flex-shrink-0 me-2"><img src="assets/img/icons/calender-icon.svg" alt="Img"></span>
                                                    <div>
                                                        <p class="fw-medium text-dark mb-1">Google Calendar</p>
                                                        <p class="mb-0">Automatically schedule invoice due dates and set up payment follow-up.</p>
                                                    </div>
                                                </div>
                                            </div> <!-- end card body -->
                                            <div class="card-footer d-flex align-items-center justify-content-between ">
                                                <div class="d-flex align-items-center">
                                                    <a class="btn btn-sm btn-light border rounded-2 p-1 me-2" href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i class="ti ti-trash"></i></a>
                                                    <a class="btn btn-sm btn-light border rounded-2 p-1" href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i class="ti ti-settings"></i></a>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input class="form-check-input m-0" type="checkbox" checked="">
                                                </div>
                                            </div> <!-- end card footer -->
                                        </div> <!-- end card -->
                                    </div> <!-- end col -->
                                </div>
								<!-- end row -->
                                </div>
                            </div>
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
    <script src="assets/js/jquery-3.7.1.min.js" type="1080582599d473fcf5dba3ee-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="1080582599d473fcf5dba3ee-text/javascript"></script>    

	<!-- Simplebar JS -->
	<script src="assets/plugins/simplebar/simplebar.min.js" type="1080582599d473fcf5dba3ee-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="1080582599d473fcf5dba3ee-text/javascript"></script>

    <!-- Daterangepikcer JS -->
    <script src="assets/js/moment.min.js" type="1080582599d473fcf5dba3ee-text/javascript"></script>
    <script src="assets/plugins/daterangepicker/daterangepicker.js" type="1080582599d473fcf5dba3ee-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="1080582599d473fcf5dba3ee-text/javascript"></script>

<script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="1080582599d473fcf5dba3ee-|49" defer></script><script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fec658f6b51de","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>
</body>

</html>