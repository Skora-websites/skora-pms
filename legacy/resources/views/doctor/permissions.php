<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Permissions</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="1b04bb3517e1c58e55a5e95a-text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Fontawesome CSS -->
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/all.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets/plugins/simplebar/simplebar.min.css">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="assets/plugins/select2/css/select2.min.css">

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

                <h6 class="fs-14 mb-3"><a href="roles-permission.php"><i class="ti ti-chevron-left me-1"></i>Roles</a></h6>

                <!-- Start Page Header -->
                <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
                    <div class="flex-grow-1">
                        <h4 class="fw-bold mb-0">Nurse</h4>
                    </div>
                    <div class="text-end d-flex">
                        <div class="dropdown">
                            <a href="javascript:void(0);" class="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                                <span class="text-body me-1">Role : </span> Nurse
                            </a>
                            <ul class="dropdown-menu  dropdown-menu-end p-2">
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">Nurse</a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" class="dropdown-item rounded-1">User</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <!-- End Page Header -->

                <div class="card mb-3">
                    <div class="card-header">
                        <div class="d-flex align-items-center justify-content-between">
                            <h6 class="fw-bold mb-0">Nurse</h6>
                            <div class="form-check form-check-md">
                                <input class="form-check-input" type="checkbox" id="select-all">
                                <label for="select-all">Allow All</label>
                            </div>
                        </div>
                    </div><!-- end card header -->
                    <div class="card-body">
    <div class="table-responsive border text-nowrap">
        <table class="table table-nowrap">
            <thead class="table-light">
                <tr>
                    <th class="px-3 sortable" onclick="sortTable(0)">MODULE <i class="fas fa-sort"></i></th>
                    <th class="px-3 sortable" onclick="sortTable(1)">CREATE <i class="fas fa-sort"></i></th>
                    <th class="px-3 sortable" onclick="sortTable(2)">EDIT <i class="fas fa-sort"></i></th>
                    <th class="px-3 sortable" onclick="sortTable(3)">DELETE <i class="fas fa-sort"></i></th>
                    <th class="px-3 sortable" onclick="sortTable(4)">VIEW <i class="fas fa-sort"></i></th>
                    <th class="px-3 sortable" onclick="sortTable(9)">ALLOW ALL <i class="fas fa-sort"></i></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><p class="fw-medium text-dark">Doctors</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
                <tr>
                    <td><p class="fw-medium text-dark">Patients</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
                <tr>
                    <td><p class="fw-medium text-dark">Appointments</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
                <tr>
                    <td><p class="fw-medium text-dark">Locations</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
                <tr>
                    <td><p class="fw-medium text-dark">Visits</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
                <tr>
                    <td><p class="fw-medium text-dark">Services</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
                <tr>
                    <td><p class="fw-medium text-dark">Designations</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
                <tr>
                    <td><p class="fw-medium text-dark">Departments</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
                <tr>
                    <td><p class="fw-medium text-dark">Activities</p></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input create" type="checkbox" checked></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input edit" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input delete" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input view" type="checkbox"></div></td>
                    <td><div class="form-check form-check-md"><input class="form-check-input allow-all" type="checkbox" onchange="toggleRow(this)"></div></td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
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
    <script src="assets/js/jquery-3.7.1.min.js" type="1b04bb3517e1c58e55a5e95a-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="1b04bb3517e1c58e55a5e95a-text/javascript"></script>

    <!-- Simplebar JS -->
    <script src="assets/plugins/simplebar/simplebar.min.js" type="1b04bb3517e1c58e55a5e95a-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="1b04bb3517e1c58e55a5e95a-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/doctors.js" type="1b04bb3517e1c58e55a5e95a-text/javascript"></script>
    <script src="assets/js/script.js" type="1b04bb3517e1c58e55a5e95a-text/javascript"></script>

    <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="1b04bb3517e1c58e55a5e95a-|49" defer></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fef9b9b3451de","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>
</body>


</html>

<!-- select row  js  -->
 <script>
function toggleRow(checkbox) {
    const row = checkbox.closest('tr');
    const checkboxes = row.querySelectorAll('.form-check-input:not(.allow-all)');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}
</script>