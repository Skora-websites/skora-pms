
<!DOCTYPE html>
<html lang="en">
<head>

	<!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Invoice Settings</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="author" content="Dreams Technologies">
	
    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>

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

    <!-- Quill CSS -->
    <link rel="stylesheet" href="assets/plugins/quill/quill.snow.css">

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
                                    <h5 class="fw-bold">Invoice Settings</h5>
                                </div>
                                <div class="card-body px-0 mx-3">
                                    <form action="https://preclinic.dreamstechnologies.com/html/template/invoice-settings.html">

                                        <!-- start row -->
                                        <div class="row border-bottom mb-3">
                                            <div class="col-lg-12">

                                                <!-- start row -->
                                                <div class="row align-items-center mb-3">
                                                    <div class="col-lg-3">
                                                        <label class="form-label mb-0">Invoice Image</label>
                                                    </div><!-- end col -->
                                                    <div class="col-lg-9">
                                                        <input type="file" class="form-control">
                                                    </div><!-- end col -->
                                                </div>
                                                <!-- end row -->

                                            </div><!-- end col -->
                                            <div class="col-lg-12">

                                                <!-- start row -->
                                                <div class="row align-items-center mb-3">
                                                <div class="col-lg-3">
                                                    <label class="form-label mb-0">Invoice Prefix</label>
                                                </div><!-- end col -->
                                                <div class="col-lg-4">
                                                    <input type="text" class="form-control">
                                                </div><!-- end col -->
                                            </div>
                                            <!-- end row -->

                                            </div><!-- end col -->
                                            <div class="col-lg-12">

                                                <!-- start row -->
                                                <div class="row align-items-center mb-3">
                                                <div class="col-lg-3">
                                                    <label class="form-label mb-0">Invoice Roundoff</label>
                                                </div><!-- end col -->
                                                <div class="col-lg-4">
                                                    <select class="select">
                                                        <option>Select</option>
                                                        <option>Mar 18 2025</option>
                                                        <option>2025 Mar 18</option>
                                                    </select>
                                                </div><!-- end col -->
                                                <div class="col-lg-5">
                                                    <div class="form-check form-switch ps-0">
                                                        <input class="form-check-input m-0" type="checkbox" checked="">
                                                    </div>
                                                </div><!-- end col -->
                                            </div>
                                            <!-- end row -->

                                            </div><!-- end col -->
                                            <div class="col-lg-12">

                                                <!-- start row -->
                                                <div class="row align-items-center mb-3">
                                                <div class="col-lg-3">
                                                    <label class="form-label mb-0">Show Company Details</label>
                                                </div><!-- end col -->
                                                <div class="col-lg-8">
                                                    <div class="form-check form-switch ps-0">
                                                        <input class="form-check-input m-0" type="checkbox" checked="">
                                                    </div>
                                                </div><!-- end col -->
                                            </div>
                                            <!-- end row -->

                                            </div><!-- end col -->
                                            <div class="col-lg-12">

                                                <!-- start row -->
                                                <div class="row align-items-center mb-3">
                                                <div class="col-lg-3">
                                                    <label class="form-label mb-0">Invoice Terms</label>
                                                </div><!-- end col -->
                                                <div class="col-lg-9">
                                                    <div class="editor three-line"></div>
                                                </div><!-- end col -->
                                            </div>
                                            <!-- end row -->

                                            </div><!-- end col -->
                                        </div>
                                        <!-- end row -->

                                        <div class="d-flex align-items-center justify-content-end">
                                            <a href="javascript:void(0);" class="btn btn-light me-3">Cancel</a>
                                            <a href="javascript:void(0);" class="btn btn-primary">Save Changes</a>
                                        </div>
                                    </form>
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
    <script src="assets/js/jquery-3.7.1.min.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>    

	<!-- Simplebar JS -->
	<script src="assets/plugins/simplebar/simplebar.min.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>

    <!-- Daterangepikcer JS -->
    <script src="assets/js/moment.min.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>
    <script src="assets/plugins/daterangepicker/daterangepicker.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>

    <!-- Quill JS -->
    <script src="assets/plugins/quill/quill.min.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="fd38ad57b04ab54d565c7280-text/javascript"></script>

<script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="fd38ad57b04ab54d565c7280-|49" defer></script><script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fec762f5f51de","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>
</body>

</html>