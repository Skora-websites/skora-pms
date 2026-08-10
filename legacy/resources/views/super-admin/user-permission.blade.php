<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact " dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">

    <!-- links  -->
    <?php include('inc/header-links.php'); ?>
    <!--  -->
</head>

<body>

    <!-- ?PROD Only: Google Tag Manager (noscript) (Default ThemeSelection: GTM-5DDHKGP, PixInvent: GTM-5J3LMKC) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5DDHKGP" height="0" width="0" style="display: none; visibility: hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->

    <!-- Layout wrapper -->
    <div class="layout-wrapper layout-content-navbar  ">
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

                        <!-- Permission Table -->
                        <div class="card">
                            <div class="card-datatable table-responsive">
                                <table class="datatables-permissions table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th></th>
                                            <th>Name</th>
                                            <th>Assigned To</th>
                                            <th>Created Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                        <!--/ Permission Table -->


                        <!-- Modal -->
                        <!-- Add Permission Modal -->
                        <div class="modal fade" id="addPermissionModal" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered modal-simple">
                                <div class="modal-content">
                                    <div class="modal-body p-0">
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        <div class="text-center mb-6">
                                            <h4 class="mb-2">Add New Permission</h4>
                                            <p>Permissions you may use and assign to your users.</p>
                                        </div>
                                        <form id="addPermissionForm" class="row" onsubmit="return false">
                                            <div class="col-12 mb-4">
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" id="modalPermissionName" name="modalPermissionName" class="form-control" placeholder="Permission Name" autofocus />
                                                    <label for="modalPermissionName">Permission Name</label>
                                                </div>
                                            </div>
                                            <div class="col-12 mb-2">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="corePermission" />
                                                    <label class="form-check-label" for="corePermission">
                                                        Set as core permission
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="col-12 text-center demo-vertical-spacing">
                                                <button type="submit" class="btn btn-primary me-3">Create Permission</button>
                                                <button type="reset" class="btn btn-outline-secondary" data-bs-dismiss="modal" aria-label="Close">Discard</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--/ Add Permission Modal -->

                        <!-- Edit Permission Modal -->
                        <div class="modal fade" id="editPermissionModal" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog modal-simple modal-dialog-centered">
                                <div class="modal-content">
                                    <div class="modal-body p-0">
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        <div class="text-center mb-6">
                                            <h4 class="mb-2">Edit Permission</h4>
                                            <p>Edit permission as per your requirements.</p>
                                        </div>
                                        <div class="alert alert-warning d-flex align-items-start" role="alert">
                                            <span class="alert-icon me-4 rounded-2"><i class="ri-alert-line ri-22px"></i></span>
                                            <span>
                                                <h5 class="alert-heading mb-1">Warning</h5>
                                                <p class="mb-0">By editing the permission name, you might break the system permissions functionality. Please ensure you're absolutely certain before proceeding.</p>
                                            </span>
                                        </div>
                                        <form id="editPermissionForm" class="row pt-2 gx-4" onsubmit="return false">
                                            <div class="col-sm-9 mb-4">
                                                <input type="text" id="editPermissionName" name="editPermissionName" class="form-control form-control-sm" placeholder="Permission Name" tabindex="-1" />
                                            </div>
                                            <div class="col-sm-3 mb-4">
                                                <button type="submit" class="btn btn-primary mt-1 mt-sm-0">Update</button>
                                            </div>
                                            <div class="col-12">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="editCorePermission" />
                                                    <label class="form-check-label" for="editCorePermission">
                                                        Set as core permission
                                                    </label>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--/ Edit Permission Modal -->

                        <!-- /Modal -->
                    </div>
                    <!-- / Content -->

                    <!-- Footer -->
                    <?php include('inc/footer.php'); ?>
                    <!-- / Footer -->


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
        <a href="https://themeselection.com/item/materio-bootstrap-html-admin-template/" target="_blank" class="btn btn-danger btn-buy-now">Buy Now</a>
    </div>


    <!-- Footer-links -->
    <?php include('inc/footer-links.php'); ?>
    <!-- / Footer-links -->
</body>

</html>