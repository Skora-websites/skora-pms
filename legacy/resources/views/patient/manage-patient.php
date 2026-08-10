<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact " dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Manage Patient</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">

    <!-- links  -->
    <?php include('inc/header-links.php'); ?>
    <!--  -->

    <style>
        th input[type="checkbox"],
        td input[type="checkbox"] {
            margin: 0;
            transform: scale(1.2);
        }
    </style>
</head>

<body>
    <!-- ?PROD Only: Google Tag Manager (noscript) (Default ThemeSelection: GTM-5DDHKGP, PixInvent: GTM-5J3LMKC) -->
    <noscript><iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5DDHKGP"
            height="0"
            width="0"
            style="display: none; visibility: hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->

    <!-- Layout wrapper -->
    <div class="layout-wrapper layout-content-navbar">
        <div class="layout-container">

            <!-- Menu -->
            <?php include('inc/sidebar.php'); ?>
            <!-- / Menu -->

            <!-- Layout container -->
            <div class="layout-page">
                <!-- Navbar -->
                <?php include('inc/header.php'); ?>
                <!-- / Navbar -->

                <!-- Content wrapper -->
                <div class="content-wrapper">
                    <!-- Content -->
                    <div class="container-xxl flex-grow-1 container-p-y">
                        <!-- Card Border Shadow -->
                        <div class="row">
                            <div class="col-sm-6 col-lg-3 mb-6">
                                <div class="card card-border-shadow-primary h-100">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="avatar me-4">
                                                <span class="avatar-initial rounded bg-label-primary"><i class="ri-car-line ri-24px"></i></span>
                                            </div>
                                            <h4 class="mb-0">42</h4>
                                        </div>
                                        <h6 class="mb-0 fw-normal">On route vehicles</h6>
                                        <p class="mb-0">
                                            <span class="me-1 fw-medium">+18.2%</span>
                                            <small class="text-muted">than last week</small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6 col-lg-3 mb-6">
                                <div class="card card-border-shadow-warning h-100">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="avatar me-4">
                                                <span class="avatar-initial rounded bg-label-warning"><i class="ri-alert-line ri-24px"></i></span>
                                            </div>
                                            <h4 class="mb-0">8</h4>
                                        </div>
                                        <h6 class="mb-0 fw-normal">Vehicles with errors</h6>
                                        <p class="mb-0">
                                            <span class="me-1 fw-medium">-8.7%</span>
                                            <small class="text-muted">than last week</small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6 col-lg-3 mb-6">
                                <div class="card card-border-shadow-danger h-100">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="avatar me-4">
                                                <span class="avatar-initial rounded bg-label-danger"><i class="ri-route-line ri-24px"></i></span>
                                            </div>
                                            <h4 class="mb-0">27</h4>
                                        </div>
                                        <h6 class="mb-0 fw-normal">Deviated from route</h6>
                                        <p class="mb-0">
                                            <span class="me-1 fw-medium">+4.3%</span>
                                            <small class="text-muted">than last week</small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6 col-lg-3 mb-6">
                                <div class="card card-border-shadow-info h-100">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="avatar me-4">
                                                <span class="avatar-initial rounded bg-label-info"><i class="ri-time-line ri-24px"></i></span>
                                            </div>
                                            <h4 class="mb-0">13</h4>
                                        </div>
                                        <h6 class="mb-0 fw-normal">Late vehicles</h6>
                                        <p class="mb-0">
                                            <span class="me-1 fw-medium">-2.5%</span>
                                            <small class="text-muted">than last week</small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--/ Card Border Shadow -->
                        <div class="row">
                            <!-- On route vehicles Table -->
                            <div class="col-12 order-5">
                                <div class="card">
                                    <div class="card-header border-bottom">
                                        <h6 class="card-title mb-0">Filters</h6>
                                    </div>

                                    <div class="row m-2 my-0 mt-0 d-flex justify-content-between">
                                        <div class="d-md-flex justify-content-between align-items-center dt-layout-start col-md-auto me-auto mt-md-0 mt-5">
                                            <div class="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 justify-content-center">
                                                <div class="btn-group">
                                                    <button class="btn btn-outline-secondary dropdown-toggle waves-effect" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                        <span class="d-flex align-items-center gap-2">
                                                            <i class="icon-base ri ri-download-line icon-16px me-sm-1"></i>
                                                            <span class="d-none d-sm-inline-block">Export</span>
                                                        </span>
                                                    </button>
                                                    <ul class="dropdown-menu">
                                                        <li><a class="dropdown-item" href="#">CSV</a></li>
                                                        <li><a class="dropdown-item" href="#">Print</a></li>
                                                        <!-- You can add more options here -->
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="d-md-flex d-flex align-items-center dt-layout-end col-md-auto ms-auto  gap-md-4 justify-content-md-between justify-content-center gap-md-2 flex-wrap ">
                                            <div class="dt-search mt-5"><input type="search" class="form-control form-control-sm" id="dt-search-0" placeholder="Search User" aria-controls="DataTables_Table_0"><label for="dt-search-0"></label></div>
                                            <div class="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 mb-md-0 mb-5 justify-content-center" mt-0><button class="btn add-new btn-primary" tabindex="0" aria-controls="DataTables_Table_0" type="button" data-bs-toggle="modal" data-bs-target="#staticBackdrop"><span><i class="icon-base ri ri-add-line icon-sm me-0 me-sm-2 d-sm-none d-inline-block"></i><span class="d-none d-sm-inline-block">Add New User</span></span></button> </div>
                                        </div>
                                    </div>

                                    <div class="table-responsive">
                                        <table class="table align-middle">
                                            <thead>
                                                <tr>

                                                    <th><input type="checkbox" id="selectAll" /></th>
                                                    <th>User</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Stock</th>
                                                    <th>Plan</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>

                                                    <td><input type="checkbox" class="row-checkbox" /></td>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="avatar avatar-sm me-3">
                                                                <img src="assets/img/avatars/1.png" alt="Avatar" class="rounded-circle" />
                                                            </div>
                                                            <div>
                                                                <h6 class="mb-0 text-truncate">Jordan Stevenson</h6>
                                                                <small class="text-muted">@amiccoo</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="text-truncate">susanna.Lind57@gmail.com</td>
                                                    <td class="text-truncate">
                                                        <div class="d-flex align-items-center">
                                                            <i class="ri-vip-crown-line ri-22px text-primary me-2"></i>
                                                            <span>Admin</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div class="form-check form-switch">
                                                            <input class="form-check-input" type="checkbox" value="" id="checkNativeSwitch" switch>
                                                            <label class="form-check-label" for="checkNativeSwitch">
                                                            </label>
                                                        </div>
                                                    </td>

                                                    <td><span class="badge bg-label-warning rounded-pill">Pro</span></td>
                                                    <td>
                                                        <!-- Status Badge -->
                                                        <span class="badge bg-success-subtle text-dark">Active</span>
                                                        <!-- Options: bg-success (Active), bg-warning (Pending), bg-danger (Inactive) -->
                                                    </td>
                                                    <td>
                                                        <!-- Action Buttons -->
                                                        <div class="d-flex gap-2">
                                                            <button class="btn btn-sm btn-primary" title="View">
                                                                <i class="ri-eye-line"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-warning" title="Edit">
                                                                <i class="ri-edit-line"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-danger" title="Delete">
                                                                <i class="ri-delete-bin-line"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                <!-- 🔁 More rows can be added similarly -->
                                                <tr>
                                                    <td><input type="checkbox" class="row-checkbox" /></td>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="avatar avatar-sm me-3">
                                                                <img src="assets/img/avatars/1.png" alt="Avatar" class="rounded-circle" />
                                                            </div>
                                                            <div>
                                                                <h6 class="mb-0 text-truncate">Jordan Stevenson</h6>
                                                                <small class="text-muted">@amiccoo</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="text-truncate">susanna.Lind57@gmail.com</td>
                                                    <td class="text-truncate">
                                                        <div class="d-flex align-items-center">
                                                            <i class="ri-vip-crown-line ri-22px text-primary me-2"></i>
                                                            <span>Admin</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div class="form-check form-switch">
                                                            <input class="form-check-input" type="checkbox" value="" id="checkNativeSwitch" switch>
                                                            <label class="form-check-label" for="checkNativeSwitch">
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td><span class="badge bg-label-warning rounded-pill">Pro</span></td>
                                                    <td>
                                                        <!-- Status Badge -->
                                                        <span class="badge bg-success-subtle text-dark">Active</span>
                                                        <!-- Options: bg-success (Active), bg-warning (Pending), bg-danger (Inactive) -->
                                                    </td>
                                                    <td>
                                                        <!-- Action Buttons -->
                                                        <div class="d-flex gap-2">
                                                            <button class="btn btn-sm btn-primary" title="View">
                                                                <i class="ri-eye-line"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-warning" title="Edit">
                                                                <i class="ri-edit-line"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-danger" title="Delete">
                                                                <i class="ri-delete-bin-line"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            </div>
                        </div>
                        <!--/ On route vehicles Table -->
                    </div>
                    <!-- / Content -->

                    <!-- Footer -->
                    <?php include('inc/footer.php'); ?>
                    <!-- / Footer--->

                    <div class="content-backdrop fade"></div>
                </div>
                <!-- Content wrapper -->

            </div>
            <!-- / Layout page -->
        </div>

        <!-- Overlay -->
        <div class="layout-overlay layout-menu-toggle"></div>

        <!-- Drag Target Area To SlideIn Menu On Small Screens -->
        <div class="drag-target"></div>
    </div>
    <!-- / Layout wrapper -->

    <div class="buy-now">
        <a
            href="https://themeselection.com/item/materio-bootstrap-html-admin-template/"
            target="_blank"
            class="btn btn-danger btn-buy-now">Buy Now</a>
    </div>

    <!-- Footer-links -->
    <?php include('inc/footer-links.php'); ?>
    <!-- / Footer-links -->

</body>

</html>

<!-- checkbox js  -->
<script>
    // Select All Checkbox Script
    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
</script>



<!-- add patient modal  -->

<!-- Modal -->
<div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="staticBackdropLabel">Patient Info</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="card mb-6">
                    <div class="card-body">
                        <form>
                            <div class="row">
                            <!-- Full Name -->
                             <div class="col-6">
                            <div class=" input-group input-group-merge mb-6">
                                <span id="basic-icon-default-fullname2" class="input-group-text"><i class="ri-user-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" class="form-control " id="basic-icon-default-fullname" placeholder="John Doe" aria-label="John Doe" aria-describedby="basic-icon-default-fullname2" />
                                    <label for="basic-icon-default-fullname">Full Name</label>
                                </div>
                            </div>
                             </div>
                            <!-- Email -->
                          <div class="col-6">
                                <div class=" input-group input-group-merge mb-6">
                                    <span class="input-group-text"><i class="ri-mail-line ri-20px"></i></span>
                                    <div class="form-floating form-floating-outline">
                                        <input type="text" id="basic-icon-default-email" class="form-control" placeholder="john.doe" aria-label="john.doe" aria-describedby="basic-icon-default-email2" />
                                        <label for="basic-icon-default-email">Email</label>
                                    </div>
                                    <!-- <span id="basic-icon-default-email2" class="input-group-text">@example.com</span> -->
                                </div>
                                <!-- <div class="form-text">You can use letters, numbers & periods</div> -->
                          </div>
                            <!-- Phone -->
                             <div class="col-6">
                            <div class=" input-group input-group-merge mb-6">
                                <span id="basic-icon-default-phone2" class="input-group-text"><i class="ri-phone-fill ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" id="basic-icon-default-phone" class="form-control phone-mask" placeholder="658 799 8941" aria-label="658 799 8941" aria-describedby="basic-icon-default-phone2" />
                                    <label for="basic-icon-default-phone">Phone No</label>
                                </div>
                            </div>
                             </div>

                            <!-- Address -->
                             <div class="col-6">
                            <div class=" input-group input-group-merge mb-6">
                                <span class="input-group-text"><i class="ri-map-pin-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" class="form-control" placeholder="Address" />
                                    <label>Address</label>
                                </div>
                            </div>
                             </div>

                            <!-- Visit Type -->
                             <div class="col-6">
                            <div class=" input-group input-group-merge mb-6">
                                <span class="input-group-text"><i class="ri-repeat-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <select class="form-select">
                                        <option value="">Select</option>
                                        <option value="single">Single</option>
                                        <option value="repeated">Repeated</option>
                                    </select>
                                    <label>Visit Type</label>
                                </div>
                            </div>
                             </div>

                            <!-- BP (Optional) -->
                             <div class="col-6">
                            <div class=" input-group input-group-merge mb-6">
                                <span class="input-group-text"><i class="ri-heart-pulse-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" class="form-control" placeholder="BP (Optional)" />
                                    <label>BP (Optional)</label>
                                </div>
                            </div>
                             </div>

                            <!-- Weight (Optional) -->
                             <div class="col-6">
                            <div class=" input-group input-group-merge mb-6">
                                <span class="input-group-text"><i class="ri-weight-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" class="form-control" placeholder="Weight (kg)" />
                                    <label>Weight (Optional)</label>
                                </div>
                            </div>
                             </div>

                            <!-- Height (Optional) -->
                             <div class="col-6">
                            <div class=" input-group input-group-merge mb-6">
                                <span class="input-group-text"><i class="ri-ruler-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" class="form-control" placeholder="Height (cm)" />
                                    <label>Height (Optional)</label>
                                </div>
                            </div>
                             </div>

                            <!-- Doctor Name (Auto-filled) -->
                            <div class="input-group input-group-merge mb-6">
                                <span class="input-group-text"><i class="ri-stethoscope-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" class="form-control" value="Dr. A.K. Sharma" readonly />
                                    <label>Doctor Name</label>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-auto">Send</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>