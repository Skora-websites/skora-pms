<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctrs | Custom Field Settings</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="33e8c68233b33e49af2a2c86-text/javascript"></script>

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
            <div class="content">

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
                                    <div class="d-flex align-items-center justify-content-between">
                                        <h5 class="fw-bold">Custom Field</h5>
                                        <a href="javascript:void(0);" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add_reason"><i class="ti ti-plus me-1"></i>New Custom Field</a>
                                    </div>
                                </div>
                                <div class="card-body px-0 mx-3">
                                    <!-- Table List -->
                                    <div class="table-responsive border">
                                        <table class="table table-nowrap">
                                            <thead class="tablehead-light">
                                                <tr>
                                                    <th>Module</th>
                                                    <th>Label</th>
                                                    <th>Type</th>
                                                    <th>Default Value</th>
                                                    <th>Required</th>
                                                    <th>Status</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Patient</td>
                                                    <td>Preferred Language</td>
                                                    <td>Select</td>
                                                    <td>English</td>
                                                    <td>
                                                        <div class="form-check form-switch ps-0">
                                                            <input class="form-check-input m-0" type="checkbox" checked="">
                                                        </div>
                                                    </td>
                                                    <td><span class="badge bg-soft-success fs-13 fw-medium text-success d-inline-flex align-items-center"><i class="ti ti-point-filled"></i>Active</span></td>
                                                    <td class="action-item">
                                                        <a href="javascript:void(0);" data-bs-toggle="dropdown" class="btn p-1 btn-white border">
                                                            <i class="ti ti-dots-vertical"></i>
                                                        </a>
                                                        <ul class="dropdown-menu p-2">
                                                            <li>
                                                                <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_reason">Edit</a>
                                                            </li>
                                                            <li>
                                                                <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_reason">Delete</a>
                                                            </li>
                                                        </ul>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Staff</td>
                                                    <td>Job Type</td>
                                                    <td>Text</td>
                                                    <td>Full Time</td>
                                                    <td>
                                                        <div class="form-check form-switch ps-0">
                                                            <input class="form-check-input m-0" type="checkbox" checked="">
                                                        </div>
                                                    </td>
                                                    <td><span class="badge bg-soft-success fs-13 fw-medium text-success d-inline-flex align-items-center"><i class="ti ti-point-filled"></i>Active</span></td>
                                                    <td class="action-item">
                                                        <a href="javascript:void(0);" data-bs-toggle="dropdown" class="btn p-1 btn-white border">
                                                            <i class="ti ti-dots-vertical"></i>
                                                        </a>
                                                        <ul class="dropdown-menu p-2">
                                                            <li>
                                                                <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#edit_reason">Edit</a>
                                                            </li>
                                                            <li>
                                                                <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#delete_reason">Delete</a>
                                                            </li>
                                                        </ul>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <!-- /Table List -->
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

        <!-- Start Add Categories -->
        <div id="add_reason" class="modal fade">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="text-dark modal-title fw-bold">Add Custom Field</h5>
                        <button type="button" class="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="fa-solid fa-x"></i></button>
                    </div>
                    <form action="https://preclinic.dreamstechnologies.com/html/template/custom-fields-settings.html">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Module<span class="text-danger ms-1">*</span></label>
                                <select class="select">
                                    <option>Select</option>
                                    <option>Patient</option>
                                    <option>Staff</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Input Type<span class="text-danger ms-1">*</span></label>
                                <select class="select">
                                    <option>Select</option>
                                    <option>Text</option>
                                    <option>Number</option>
                                    <option>Password</option>
                                    <option>File</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Label<span class="text-danger ms-1">*</span></label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Default Value<span class="text-danger ms-1">*</span></label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="mb-0">
                                <div class="d-flex align-items-center justify-content-between">
                                    <label class="form-label">Required</label>
                                    <div class="form-check form-switch ps-0">
                                        <input class="form-check-input m-0" type="checkbox" checked="">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer d-flex align-items-center gap-1">
                            <button type="button" class="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Add Custom Field</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- End Add Categories -->

        <!-- Start Edit Categories -->
        <div id="edit_reason" class="modal fade">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="text-dark modal-title fw-bold">Edit Custom Field</h5>
                        <button type="button" class="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="fa-solid fa-x"></i></button>
                    </div>
                    <form action="https://preclinic.dreamstechnologies.com/html/template/custom-fields-settings.html">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Module<span class="text-danger ms-1">*</span></label>
                                <select class="select">
                                    <option>Select</option>
                                    <option selected>Patient</option>
                                    <option>Staff</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Input Type<span class="text-danger ms-1">*</span></label>
                                <select class="select">
                                    <option selected>Select</option>
                                    <option>Text</option>
                                    <option>Number</option>
                                    <option>Password</option>
                                    <option>File</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Label<span class="text-danger ms-1">*</span></label>
                                <input type="text" class="form-control" value="Preferred Language">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Default Value<span class="text-danger ms-1">*</span></label>
                                <input type="text" class="form-control" value="English">
                            </div>
                            <div class="mb-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <label class="form-label">Required</label>
                                    <div class="form-check form-switch ps-0">
                                        <input class="form-check-input m-0" type="checkbox" checked="">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-0">
                                <div class="d-flex align-items-center justify-content-between">
                                    <label class="form-label">Status</label>
                                    <div class="form-check form-switch ps-0">
                                        <input class="form-check-input m-0" type="checkbox" checked="">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer d-flex align-items-center gap-1">
                            <button type="button" class="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- End Edit Categories -->

        <!-- Start Delete Modal  -->
        <div class="modal fade" id="delete_reason">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <div class="modal-body text-center position-relative">
                        <img src="assets/img/bg/delete-modal-bg-01.png" alt="" class="img-fluid position-absolute top-0 start-0">
                        <img src="assets/img/bg/delete-modal-bg-02.png" alt="" class="img-fluid position-absolute bottom-0 end-0">
                        <div class="mb-3">
                            <span class="avatar avatar-lg bg-danger text-white"><i class="ti ti-trash fs-24"></i></span>
                        </div>
                        <h5 class="fw-bold mb-1">Delete Confirmation</h5>
                        <p class="mb-3">Are you sure want to delete?</p>
                        <div class="d-flex justify-content-center">
                            <a href="javascript:void(0);" class="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal">Cancel</a>
                            <a href="custom-fields-settings.html" class="btn btn-danger position-relative z-1">Yes, Delete</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- End Delete Modal  -->

    </div>
    <!-- End Wrapper -->

    <!-- jQuery -->
    <script src="assets/js/jquery-3.7.1.min.js" type="33e8c68233b33e49af2a2c86-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="33e8c68233b33e49af2a2c86-text/javascript"></script>

    <!-- Simplebar JS -->
    <script src="assets/plugins/simplebar/simplebar.min.js" type="33e8c68233b33e49af2a2c86-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="33e8c68233b33e49af2a2c86-text/javascript"></script>

    <!-- Daterangepikcer JS -->
    <script src="assets/js/moment.min.js" type="33e8c68233b33e49af2a2c86-text/javascript"></script>
    <script src="assets/plugins/daterangepicker/daterangepicker.js" type="33e8c68233b33e49af2a2c86-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="33e8c68233b33e49af2a2c86-text/javascript"></script>

    <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="33e8c68233b33e49af2a2c86-|49" defer></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fec7a8b8a51de","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>
</body>

</html>