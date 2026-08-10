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
                        <div class="row g-6 mb-6">
                            <div class="col-sm-6 col-xl-3">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between">
                                            <div class="me-1">
                                                <p class="text-heading mb-1">Session</p>
                                                <div class="d-flex align-items-center">
                                                    <h4 class="mb-1 me-2">21,459</h4>
                                                    <p class="text-success mb-1">(+29%)</p>
                                                </div>
                                                <small class="mb-0">Total Users</small>
                                            </div>
                                            <div class="avatar">
                                                <div class="avatar-initial bg-label-primary rounded">
                                                    <div class="ri-group-line ri-26px"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6 col-xl-3">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between">
                                            <div class="me-1">
                                                <p class="text-heading mb-1">Paid Users</p>
                                                <div class="d-flex align-items-center">
                                                    <h4 class="mb-1 me-2">4,567</h4>
                                                    <p class="text-success mb-1">(+18%)</p>
                                                </div>
                                                <small class="mb-0">Last week analytics</small>
                                            </div>
                                            <div class="avatar">
                                                <div class="avatar-initial bg-label-danger rounded">
                                                    <div
                                                        class="ri-user-add-line ri-26px scaleX-n1"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6 col-xl-3">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between">
                                            <div class="me-1">
                                                <p class="text-heading mb-1">Active Users</p>
                                                <div class="d-flex align-items-center">
                                                    <h4 class="mb-1 me-2">19,860</h4>
                                                    <p class="text-danger mb-1">(-14%)</p>
                                                </div>
                                                <small class="mb-0">Last week analytics</small>
                                            </div>
                                            <div class="avatar">
                                                <div class="avatar-initial bg-label-success rounded">
                                                    <div class="ri-user-follow-line ri-26px"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6 col-xl-3">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between">
                                            <div class="me-1">
                                                <p class="text-heading mb-1">Pending Users</p>
                                                <div class="d-flex align-items-center">
                                                    <h4 class="mb-1 me-2">237</h4>
                                                    <p class="text-success mb-1">(+42%)</p>
                                                </div>
                                                <small class="mb-0">Last week analytics</small>
                                            </div>
                                            <div class="avatar">
                                                <div class="avatar-initial bg-label-warning rounded">
                                                    <div class="ri-user-search-line ri-26px"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Users List Table -->
                        <div class="card">
                            <div class="card-header border-bottom">
                                <h6 class="card-title mb-0">Filters</h6>
                                <div class="d-flex justify-content-between align-items-center row pt-4 pb-2 gap-4 gap-md-0 gx-5">
                                    <div class="col-md-4 user_role"><select id="" class="form-select text-capitalize">
                                            <option value="">Select Role</option>
                                            <option value="Admin">Admin</option>
                                            <option value="Author">Author</option>
                                            <option value="Editor">Editor</option>
                                            <option value="Maintainer">Maintainer</option>
                                            <option value="Subscriber">Subscriber</option>
                                        </select></div>
                                    <div class="col-md-4 user_plan"><select id="" class="form-select text-capitalize">
                                            <option value="">Select Plan</option>
                                            <option value="Basic">Basic</option>
                                            <option value="Company">Company</option>
                                            <option value="Enterprise">Enterprise</option>
                                            <option value="Team">Team</option>
                                        </select></div>
                                    <div class="col-md-4 user_status"><select id="" class="form-select text-capitalize">
                                            <option value="">Select Status</option>
                                            <option value="Pending" class="text-capitalize">Pending</option>
                                            <option value="Active" class="text-capitalize">Active</option>
                                            <option value="Inactive" class="text-capitalize">Inactive</option>
                                        </select>
                                    </div>
                                </div>
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
                                    <div class="dt-buttons btn-group flex-wrap d-md-flex d-block gap-4 mb-md-0 mb-5 justify-content-center" mt-0><button class="btn add-new btn-primary" tabindex="0" aria-controls="DataTables_Table_0" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasAddUser"><span><i class="icon-base ri ri-add-line icon-sm me-0 me-sm-2 d-sm-none d-inline-block"></i><span class="d-none d-sm-inline-block">Add New User</span></span></button> </div>
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
                                            <td><span class="badge bg-label-warning rounded-pill">Pro</span></td>
                                            <td>
                                                <!-- Status Badge -->
                                                <span class="badge bg-success">Active</span>
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
                                            <td><span class="badge bg-label-warning rounded-pill">Pro</span></td>
                                            <td>
                                                <!-- Status Badge -->
                                                <span class="badge bg-success">Active</span>
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
                                                aria-label="John Doe" />
                                            <label for="add-user-fullname">Full Name</label>
                                        </div>
                                        <div class="form-floating form-floating-outline mb-5">
                                            <input
                                                type="text"
                                                id=""
                                                class="form-control"
                                                placeholder="john.doe@example.com"
                                                aria-label="john.doe@example.com"
                                                name="userEmail" />
                                            <label for="add-user-email">Email</label>
                                        </div>
                                        <div class="form-floating form-floating-outline mb-5">
                                            <input
                                                type="text"
                                                id=""
                                                class="form-control phone-mask"
                                                placeholder="+1 (609) 988-44-11"
                                                aria-label="john.doe@example.com"
                                                name="userContact" />
                                            <label for="add-user-contact">Contact</label>
                                        </div>
                                        <div class="form-floating form-floating-outline mb-5">
                                            <input
                                                type="text"
                                                id=""
                                                class="form-control"
                                                placeholder="Web Developer"
                                                aria-label="jdoe1"
                                                name="companyName" />
                                            <label for="add-user-company">Company</label>
                                        </div>
                                        <div class="form-floating form-floating-outline mb-5">
                                            <select id="" class="select2 form-select">
                                                <option value="">Select</option>
                                                <option value="Australia">Australia</option>
                                                <option value="Bangladesh">Bangladesh</option>
                                                <option value="Belarus">Belarus</option>
                                                <option value="Brazil">Brazil</option>
                                                <option value="Canada">Canada</option>
                                                <option value="China">China</option>
                                                <option value="France">France</option>
                                                <option value="Germany">Germany</option>
                                                <option value="India">India</option>
                                                <option value="Indonesia">Indonesia</option>
                                                <option value="Israel">Israel</option>
                                                <option value="Italy">Italy</option>
                                                <option value="Japan">Japan</option>
                                                <option value="Korea">Korea, Republic of</option>
                                                <option value="Mexico">Mexico</option>
                                                <option value="Philippines">Philippines</option>
                                                <option value="Russia">Russian Federation</option>
                                                <option value="South Africa">South Africa</option>
                                                <option value="Thailand">Thailand</option>
                                                <option value="Turkey">Turkey</option>
                                                <option value="Ukraine">Ukraine</option>
                                                <option value="United Arab Emirates">
                                                    United Arab Emirates
                                                </option>
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="United States">United States</option>
                                            </select>
                                            <label for="country">Country</label>
                                        </div>
                                        <div class="form-floating form-floating-outline mb-5">
                                            <select id="" class="form-select">
                                                <option value="subscriber">Subscriber</option>
                                                <option value="editor">Editor</option>
                                                <option value="maintainer">Maintainer</option>
                                                <option value="author">Author</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <label for="user-role">User Role</label>
                                        </div>
                                        <div class="form-floating form-floating-outline mb-5">
                                            <select id="" class="form-select">
                                                <option value="basic">Basic</option>
                                                <option value="enterprise">Enterprise</option>
                                                <option value="company">Company</option>
                                                <option value="team">Team</option>
                                            </select>
                                            <label for="user-plan">Select Plan</label>
                                        </div>
                                        <button
                                            type="submit"
                                            class="btn btn-primary me-sm-3 me-1 data-submit">
                                            Submit
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