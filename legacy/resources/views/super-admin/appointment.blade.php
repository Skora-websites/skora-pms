<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact " dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Appointment</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">

    <!-- links  -->
    <?php include('inc/header-links.php'); ?>
    <!--  -->

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
                        <!-- <div class="container-xxl"> -->
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

                                                <div class=" user_role"><select id="" class="form-select py-2">
                                                        <option value="">Select Visit</option>
                                                        <option value="Admin">Clinic Visit</option>
                                                        <option value="Author">Home Visit</option>
                                                        <option value="Editor">Tele Appointment</option>
                                                        <option value="Maintainer">Video Appointment</option>
                                                    </select>
                                                </div>

                                            </div>
                                        </div>

                                        <div class="d-md-flex d-flex align-items-center dt-layout-end col-md-auto ms-auto  gap-md-4 justify-content-md-between justify-content-center gap-md-2 flex-wrap ">
                                            <div class="dt-search mt-5"><input type="search" class="form-control form-control-sm" id="dt-search-0" placeholder="Search User" aria-controls="DataTables_Table_0"><label for="dt-search-0"></label></div>
                                            <div class="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 mb-md-0 mb-5 justify-content-center" mt-0><button class="btn add-new btn-primary" tabindex="0" aria-controls="DataTables_Table_0" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasAddUser"><span><i class="icon-base ri ri-add-line icon-sm me-0 me-sm-2 d-sm-none d-inline-block"></i><span class="d-none d-sm-inline-block">New Appointment</span></span></button> </div>
                                        </div>
                                    </div>
                                

                                    <div class="table-responsive">
                                        <table class="table align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Date & Time</th>
                                                    <th>patient</th>
                                                    <th>Mode</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td class="text-truncate">17 Apr 2025 - 09:30 AM </td>

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



                                                    <td><span class="badge bg-label-warning rounded-pill ">In-person</span></td>
                                                    <td>
                                                        <!-- Status Badge -->
                                                        <span class="badge bg-danger-subtle text-danger ">Cancelled</span>
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
                                                    <td class="text-truncate">17 Apr 2025 - 09:30 AM </td>

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

                                                    <td><span class="badge bg-label-success rounded-pill">online</span></td>
                                                    <td>
                                                        <!-- Status Badge -->
                                                        <span class="badge bg-success-subtle text-success">Confirmed</span>
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

                                    <!-- Offcanvas to add new user -->
                                    <div
                                        class="offcanvas offcanvas-end"
                                        tabindex="-1"
                                        id="offcanvasAddUser"
                                        aria-labelledby="offcanvasAddUserLabel">
                                        <div class="offcanvas-header border-bottom">
                                            <h5 id="" class="offcanvas-title">
                                                Add User
                                            </h5>
                                            <button
                                                type="button"
                                                class="btn-close text-reset"
                                                data-bs-dismiss="offcanvas"
                                                aria-label="Close"></button>
                                        </div>
                                        <div class="offcanvas-body mx-0 flex-grow-0 h-100">
                                            <form
                                                class="add-new-user pt-0"
                                                id=""
                                                onsubmit="return false">
                                                <div class="form-floating form-floating-outline mb-5">
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        id=""
                                                        placeholder="John Doe"
                                                        name="userFullname"
                                                        aria-label="" />
                                                    <label for="add-user-fullname">Appointment ID</label>
                                                </div>
                                                <div class="form-floating form-floating-outline mb-5">
                                                    <select id="" class="form-select">
                                                        <option value="basic">Select</option>
                                                        <option value="enterprise">Emily </option>
                                                        <option value="company">Jemily</option>
                                                        <option value="team">femily</option>
                                                    </select>
                                                    <label for="user-plan">Patient</label>
                                                </div>
                                                <div class="form-floating form-floating-outline mb-5">
                                                    <select id="" class="form-select">
                                                        <option value="basic">Select</option>
                                                        <option value="enterprise">In-person </option>
                                                        <option value="company">Online</option>
                                                    </select>
                                                    <label for="user-plan">Appointment Type</label>
                                                </div>
                                                <div class="form-floating form-floating-outline mb-5">
                                                    <input class="form-control" type="date" id="html5-date-input" />
                                                    <label for="html5-date-input">Date of Appointment</label>
                                                </div>
                                                <div class="form-floating form-floating-outline mb-6">
                                                    <input class="form-control" type="time" id="html5-time-input" />
                                                    <label for="html5-time-input">Time</label>
                                                </div>

                                                    <div class="form-floating form-floating-outline mb-5">
                                                        <textarea name="appointment-reason" id="company_address1" class="form-control" placeholder="" style="height: 80px"></textarea>
                                                        <label for="user-plan">Appointment Reason</label>
                                                    </div>

                                                <div class="form-floating form-floating-outline mb-5">
                                                    <select id="" class="form-select">
                                                        <option value="select">Select</option>
                                                        <option value="checked-out">Checked Out</option>
                                                        <option value="checked-in">Checked In</option>
                                                        <option value="cancelled">Cancelled</option>
                                                        <option value="schedule">Schedule</option>

                                                    </select>
                                                    <label for="user-plan">Status</label>
                                                </div>
                                                <button
                                                    type="submit"
                                                    class="btn btn-primary me-sm-3 me-1 data-submit">
                                                    Create Appointment
                                                </button>
                                                <button
                                                    type="reset"
                                                    class="btn btn-outline-danger"
                                                    data-bs-dismiss="offcanvas">
                                                    Cancel
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                        <!-- </div> -->
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