<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Roles & Permission</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Fontawesome CSS -->
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/all.min.css">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="assets/plugins/select2/css/select2.min.css">

    <!-- Bootstrap Tagsinput CSS -->
    <link rel="stylesheet" href="assets/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css">

    <!-- Rangeslider CSS -->
    <link rel="stylesheet" href="assets/plugins/ion-rangeslider/css/ion.rangeSlider.css">
    <link rel="stylesheet" href="assets/plugins/ion-rangeslider/css/ion.rangeSlider.min.css">

    <!-- Datatable CSS -->
    <link rel="stylesheet" href="assets/css/dataTables.bootstrap5.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets/plugins/simplebar/simplebar.min.css">

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
                <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
                    <div class="flex-grow-1">
                        <h4 class="fw-bold mb-0">Manage Roles</h4>
                    </div>
                    <div class="text-end d-flex">
                        <a href="javascript:void(0);" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#add_role"><i class="ti ti-plus me-1"></i>Add Role</a>
                    </div>
                </div>
                <!-- End Page Header -->

                <div class="table-responsive text-nowrap">
                    <table class="table">
                        <thead class="table-light">
                            <tr>
                                <th class="px-3 sortable" onclick="sortTable(0)">Sr No. <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(1)">Role <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(2)">Created on <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(3)">Status <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(4)">Permissions <i class="fas fa-sort"></i></th>
                                <th class="px-3 sortable" onclick="sortTable(5)">Actions <i class="fas fa-sort"></i></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Nurse</td>
                                <td>
                                    30 Apr 2025
                                </td>
                                <td><span class="badge badge-soft-success border border-success px-2 py-1 fs-13 fw-medium">Active</span></td>
                                <td><a href="permissions.php" class="btn btn-white border text-dark"><i class="ti ti-shield-half me-1"></i>Permissions</a></td>

                                <td class="px-2">
                                    <span class="btn text-success btn-sm" data-bs-toggle="modal" data-bs-target="#edit_role"><i class="fas fa-edit bg-success-subtle p-1 border border-success rounded-1 "></i></span>
                                    <span class="btn text-danger btn-sm" data-bs-toggle="modal" data-bs-target="#delete_role"><i class="fas fa-trash-alt bg-danger-subtle p-1 border border-danger rounded-1"></i></span>
                                </td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Receptionist</td>
                                <td>
                                    30 Apr 2025
                                </td>
                                <td><span class="badge badge-soft-success border border-success px-2 py-1 fs-13 fw-medium">Active</span></td>
                                <td><a href="permissions.php" class="btn btn-white border text-dark"><i class="ti ti-shield-half me-1"></i>Permissions</a></td>

                                <td class="px-2">
                                    <span class="btn text-success btn-sm" data-bs-toggle="modal" data-bs-target="#edit_role"><i class="fas fa-edit bg-success-subtle p-1 border border-success rounded-1 "></i></span>
                                    <span class="btn text-danger btn-sm" data-bs-toggle="modal" data-bs-target="#delete_role"><i class="fas fa-trash-alt bg-danger-subtle p-1 border border-danger rounded-1"></i></span>
                                </td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Lab Technician</td>
                                <td>
                                    30 Apr 2025
                                </td>
                                <td><span class="badge badge-soft-danger border border-danger px-2 py-1 fs-13 fw-medium">Inactive</span></td>
                                <td><a href="permissions.php" class="btn btn-white border text-dark"><i class="ti ti-shield-half me-1"></i>Permissions</a></td>

                                <td class="px-2">
                                    <span class="btn text-success btn-sm" data-bs-toggle="modal" data-bs-target="#edit_role"><i class="fas fa-edit bg-success-subtle p-1 border border-success rounded-1 "></i></span>
                                    <span class="btn text-danger btn-sm" data-bs-toggle="modal" data-bs-target="#delete_role"><i class="fas fa-trash-alt bg-danger-subtle p-1 border border-danger rounded-1"></i></span>
                                </td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Pharmacist</td>
                                <td>
                                    30 Apr 2025
                                </td>
                                <td><span class="badge badge-soft-success border border-success px-2 py-1 fs-13 fw-medium">Active</span></td>
                                <td><a href="permissions.php" class="btn btn-white border text-dark"><i class="ti ti-shield-half me-1"></i>Permissions</a></td>

                                <td class="px-2">
                                    <span class="btn text-success btn-sm" data-bs-toggle="modal" data-bs-target="#edit_role"><i class="fas fa-edit bg-success-subtle p-1 border border-success rounded-1 "></i></span>
                                    <span class="btn text-danger btn-sm" data-bs-toggle="modal" data-bs-target="#delete_role"><i class="fas fa-trash-alt bg-danger-subtle p-1 border border-danger rounded-1"></i></span>
                                </td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Accountant</td>
                                <td>
                                    30 Apr 2025
                                </td>
                                <td><span class="badge badge-soft-success border border-success px-2 py-1 fs-13 fw-medium">Active</span></td>
                                <td><a href="permissions.php" class="btn btn-white border text-dark"><i class="ti ti-shield-half me-1"></i>Permissions</a></td>

                                <td class="px-2">
                                    <span class="btn text-success btn-sm" data-bs-toggle="modal" data-bs-target="#edit_role"><i class="fas fa-edit bg-success-subtle p-1 border border-success rounded-1 "></i></span>
                                    <span class="btn text-danger btn-sm" data-bs-toggle="modal" data-bs-target="#delete_role"><i class="fas fa-trash-alt bg-danger-subtle p-1 border border-danger rounded-1"></i></span>
                                </td>
                            </tr>
                        </tbody>

                    </table>
                </div>

            </div>
            <!-- End Content -->

            <!-- Footer Start -->
            <?php include('assets/inc/footer.php'); ?>
            <!-- Footer End -->

        </div>

        <!-- ========================
			End Page Content
		========================= -->

        <!-- Start Add Modal -->
        <div id="add_role" class="modal fade">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header px-3">
                        <h4 class="text-white modal-title fw-bold">New Role</h4>
                        <button type="button" class="btn-close btn-close-modal custom-btn-close bg-white rounded-circle" data-bs-dismiss="modal" aria-label="Close"><i class="ti ti-x"></i></button>
                    </div>
                    <form action="">
                        <div class="modal-body">
                            <div class="mb-0">
                                <label class="form-label">Role<span class="text-danger ms-1">*</span></label>
                                <input type="text" class="form-control">
                            </div>
                        </div>
                        <div class="modal-footer d-flex align-items-center gap-1">
                            <button type="button" class="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Add New Role</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- End Add Modal -->

        <!-- Start Add Modal -->
        <div id="edit_role" class="modal fade">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="text-dark modal-title text-white fw-bold">Edit Role</h4>
                        <button type="button" class="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="ti ti-x"></i></button>
                    </div>
                    <form action="">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Role<span class="text-danger ms-1">*</span></label>
                                <input type="text" class="form-control" value="Doctor">
                            </div>
                            <div class="mb-0">
                                <label class="form-label">Status<span class="text-danger ms-1">*</span></label>
                                <select class="select">
                                    <option>Select</option>
                                    <option selected>Active</option>
                                    <option>Inactive</option>
                                </select>
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
        <!-- End Add Modal -->

        <!-- Start Delete Modal  -->
        <div class="modal fade" id="delete_role">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <div class="modal-body text-center position-relative z-1">
                        <img src="assets/img/bg/delete-modal-bg-01.png" alt="" class="img-fluid position-absolute top-0 start-0 z-n1">
                        <img src="assets/img/bg/delete-modal-bg-02.png" alt="" class="img-fluid position-absolute bottom-0 end-0 z-n1">
                        <div class="mb-3">
                            <span class="avatar avatar-lg bg-danger text-white"><i class="ti ti-trash fs-24"></i></span>
                        </div>
                        <h5 class="fw-bold mb-1 color-doctorrx">Delete Confirmation</h5>
                        <p class="mb-3">Are you sure want to delete?</p>
                        <div class="d-flex justify-content-center">
                            <a href="javascript:void(0);" class="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal">Cancel</a>
                            <a href="" class="btn btn-danger position-relative z-1">Yes, Delete</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- End Delete Modal  -->

    </div>
    <!-- End Wrapper -->

    <!-- jQuery -->
    <script src="assets/js/jquery-3.7.1.min.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <!-- Simplebar JS -->
    <script src="assets/plugins/simplebar/simplebar.min.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <!-- Bootstrap Tagsinput JS -->
    <script src="assets/plugins/bootstrap-tagsinput/bootstrap-tagsinput.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <!-- Datatable JS -->
    <script src="assets/js/jquery.dataTables.min.js" type="68062d13aed200912fb417ca-text/javascript"></script>
    <script src="assets/js/dataTables.bootstrap5.min.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <!-- Rangeslider JS -->
    <script src="assets/plugins/ion-rangeslider/js/ion.rangeSlider.js" type="68062d13aed200912fb417ca-text/javascript"></script>
    <script src="assets/plugins/ion-rangeslider/js/custom-rangeslider.js" type="68062d13aed200912fb417ca-text/javascript"></script>
    <script src="assets/plugins/ion-rangeslider/js/ion.rangeSlider.min.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/doctors.js" type="68062d13aed200912fb417ca-text/javascript"></script>
    <script src="assets/js/script.js" type="68062d13aed200912fb417ca-text/javascript"></script>

    <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="68062d13aed200912fb417ca-|49" defer></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fec1adc2951de","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>
</body>

</html>