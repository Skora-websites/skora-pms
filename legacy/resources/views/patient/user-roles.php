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

                        <h4 class="mb-1">Roles List</h4>
                        <p class="mb-6">A role provided access to predefined menus and features so that depending on assigned role an administrator can have access to what user needs.</p>
                        <!-- Role cards -->
                        <div class="row g-6">
                            <div class="col-xl-4 col-lg-6 col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-4">
                                            <p class="mb-0">Total 4 users</p>
                                            <ul class="list-unstyled d-flex align-items-center avatar-group mb-0">
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Vinnie Mostowy" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/5.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Allen Rieske" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/12.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Julee Rossignol" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/6.png" alt="Avatar" />
                                                </li>
                                                <li class="avatar">
                                                    <span class="avatar-initial rounded-circle pull-up text-body" data-bs-toggle="tooltip" data-bs-placement="bottom" title="3 more">+3</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="role-heading">
                                                <h5 class="mb-1">Administrator</h5>
                                                <a href="javascript:;" data-bs-toggle="modal" data-bs-target="#addRoleModal" class="role-edit-modal">
                                                    <p class="mb-0">Edit Role</p>
                                                </a>
                                            </div>
                                            <a href="javascript:void(0);" class="text-secondary"><i class="icon-base ri ri-file-copy-line icon-22px"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xl-4 col-lg-6 col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-4">
                                            <p class="mb-0">Total 7 users</p>
                                            <ul class="list-unstyled d-flex align-items-center avatar-group mb-0">
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Jimmy Ressula" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/4.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="John Doe" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/1.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Kristi Lawker" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/2.png" alt="Avatar" />
                                                </li>
                                                <li class="avatar">
                                                    <span class="avatar-initial rounded-circle pull-up text-body" data-bs-toggle="tooltip" data-bs-placement="bottom" title="3 more">+3</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="role-heading">
                                                <h5 class="mb-1">Editor</h5>
                                                <a href="javascript:;" data-bs-toggle="modal" data-bs-target="#addRoleModal" class="role-edit-modal">
                                                    <p class="mb-0">Edit Role</p>
                                                </a>
                                            </div>
                                            <a href="javascript:void(0);" class="text-secondary"><i class="icon-base ri ri-file-copy-line icon-22px"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xl-4 col-lg-6 col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-4">
                                            <p class="mb-0">Total 5 users</p>
                                            <ul class="list-unstyled d-flex align-items-center avatar-group mb-0">
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Andrew Tye" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/6.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Rishi Swaat" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/9.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Rossie Kim" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/12.png" alt="Avatar" />
                                                </li>
                                                <li class="avatar">
                                                    <span class="avatar-initial rounded-circle pull-up text-body" data-bs-toggle="tooltip" data-bs-placement="bottom" title="3 more">+3</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="role-heading">
                                                <h5 class="mb-1">Users</h5>
                                                <a href="javascript:;" data-bs-toggle="modal" data-bs-target="#addRoleModal" class="role-edit-modal">
                                                    <p class="mb-0">Edit Role</p>
                                                </a>
                                            </div>
                                            <a href="javascript:void(0);" class="text-secondary"><i class="icon-base ri ri-file-copy-line icon-22px"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xl-4 col-lg-6 col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-4">
                                            <p class="mb-0">Total 3 users</p>
                                            <ul class="list-unstyled d-flex align-items-center avatar-group mb-0">
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Kim Karlos" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/3.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Katy Turner" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/9.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Peter Adward" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/15.png" alt="Avatar" />
                                                </li>
                                                <li class="avatar">
                                                    <span class="avatar-initial rounded-circle pull-up text-body" data-bs-toggle="tooltip" data-bs-placement="bottom" title="3 more">+3</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="role-heading">
                                                <h5 class="mb-1">Support</h5>
                                                <a href="javascript:;" data-bs-toggle="modal" data-bs-target="#addRoleModal" class="role-edit-modal">
                                                    <p class="mb-0">Edit Role</p>
                                                </a>
                                            </div>
                                            <a href="javascript:void(0);" class="text-secondary"><i class="icon-base ri ri-file-copy-line icon-22px"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xl-4 col-lg-6 col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-4">
                                            <p class="mb-0">Total 2 users</p>
                                            <ul class="list-unstyled d-flex align-items-center avatar-group mb-0">
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Kim Merchent" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/10.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Sam D'souza" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/13.png" alt="Avatar" />
                                                </li>
                                                <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="Nurvi Karlos" class="avatar pull-up">
                                                    <img class="rounded-circle" src="  assets/img/avatars/15.png" alt="Avatar" />
                                                </li>
                                                <li class="avatar">
                                                    <span class="avatar-initial rounded-circle pull-up text-body" data-bs-toggle="tooltip" data-bs-placement="bottom" title="3 more">+3</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="role-heading">
                                                <h5 class="mb-1">Restricted User</h5>
                                                <a href="javascript:;" data-bs-toggle="modal" data-bs-target="#addRoleModal" class="role-edit-modal">
                                                    <p class="mb-0">Edit Role</p>
                                                </a>
                                            </div>
                                            <a href="javascript:void(0);" class="text-secondary"><i class="icon-base ri ri-file-copy-line icon-22px"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xl-4 col-lg-6 col-md-6">
                                <div class="card h-100">
                                    <div class="row h-100">
                                        <div class="col-5">
                                            <div class="d-flex align-items-end h-100 justify-content-center">
                                                <img src="  assets/img/illustrations/illustration-3.png" class="img-fluid" alt="Image" width="80" />
                                            </div>
                                        </div>
                                        <div class="col-7">
                                            <div class="card-body text-sm-end text-center ps-sm-0">
                                                <button data-bs-target="#addRoleModal" data-bs-toggle="modal" class="btn btn-sm btn-primary mb-4 text-nowrap add-new-role">Add New Role</button>
                                                <p class="mb-0">Add role, if it does not exist</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <h4 class="mt-6 mb-1">Total users with their roles</h4>
                                <p class="mb-0">Find all of your company’s administrator accounts and their associate roles.</p>
                            </div>
                            <div class="col-12">
                                <!-- Role Table -->
                                <div class="card">
                                    <div class="card-datatable table-responsive datatable-roles">
                                        <table class="datatables-users table">
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    <th></th>
                                                    <th>User</th>
                                                    <th>email</th>
                                                    <th>Role</th>
                                                    <th>Plan</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>
                                </div>
                                <!--/ Role Table -->
                            </div>
                        </div>
                        <!--/ Role cards -->

                        <!--  Modal -->
                        <!-- Add Role Modal -->
                        <div class="modal fade" id="addRoleModal" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog modal-lg modal-simple modal-dialog-centered modal-add-new-role">
                                <div class="modal-content">
                                    <div class="modal-body p-0">
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        <div class="text-center mb-6">
                                            <h4 class="role-title mb-2 pb-0">Add New Role</h4>
                                            <p>Set role permissions</p>
                                        </div>
                                        <!-- Add role form -->
                                        <form id="addRoleForm" class="row g-3" onsubmit="return false">
                                            <div class="col-12 form-control-validation mb-3">
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" id="modalRoleName" name="modalRoleName" class="form-control" placeholder="Enter a role name" tabindex="-1" />
                                                    <label for="modalRoleName">Role Name</label>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <h5>Role Permissions</h5>
                                                <!-- Permission table -->
                                                <div class="table-responsive">
                                                    <table class="table table-flush-spacing">
                                                        <tbody>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">Administrator Access <i class="icon-base ri ri-information-line" data-bs-toggle="tooltip" data-bs-placement="top" title="Allows a full access to the system"></i></td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="selectAll" />
                                                                            <label class="form-check-label" for="selectAll"> Select All </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">User Management</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="userManagementRead" />
                                                                            <label class="form-check-label" for="userManagementRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="userManagementWrite" />
                                                                            <label class="form-check-label" for="userManagementWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="userManagementCreate" />
                                                                            <label class="form-check-label" for="userManagementCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">Content Management</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="contentManagementRead" />
                                                                            <label class="form-check-label" for="contentManagementRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="contentManagementWrite" />
                                                                            <label class="form-check-label" for="contentManagementWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="contentManagementCreate" />
                                                                            <label class="form-check-label" for="contentManagementCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">Disputes Management</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="dispManagementRead" />
                                                                            <label class="form-check-label" for="dispManagementRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="dispManagementWrite" />
                                                                            <label class="form-check-label" for="dispManagementWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="dispManagementCreate" />
                                                                            <label class="form-check-label" for="dispManagementCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">Database Management</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="dbManagementRead" />
                                                                            <label class="form-check-label" for="dbManagementRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="dbManagementWrite" />
                                                                            <label class="form-check-label" for="dbManagementWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="dbManagementCreate" />
                                                                            <label class="form-check-label" for="dbManagementCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">Financial Management</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="finManagementRead" />
                                                                            <label class="form-check-label" for="finManagementRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="finManagementWrite" />
                                                                            <label class="form-check-label" for="finManagementWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="finManagementCreate" />
                                                                            <label class="form-check-label" for="finManagementCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">Reporting</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="reportingRead" />
                                                                            <label class="form-check-label" for="reportingRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="reportingWrite" />
                                                                            <label class="form-check-label" for="reportingWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="reportingCreate" />
                                                                            <label class="form-check-label" for="reportingCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">API Control</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="apiRead" />
                                                                            <label class="form-check-label" for="apiRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="apiWrite" />
                                                                            <label class="form-check-label" for="apiWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="apiCreate" />
                                                                            <label class="form-check-label" for="apiCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">Repository Management</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="repoRead" />
                                                                            <label class="form-check-label" for="repoRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="repoWrite" />
                                                                            <label class="form-check-label" for="repoWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="repoCreate" />
                                                                            <label class="form-check-label" for="repoCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="text-nowrap fw-medium">Payroll</td>
                                                                <td>
                                                                    <div class="d-flex justify-content-end">
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="payrollRead" />
                                                                            <label class="form-check-label" for="payrollRead"> Read </label>
                                                                        </div>
                                                                        <div class="form-check me-4 me-lg-12">
                                                                            <input class="form-check-input" type="checkbox" id="payrollWrite" />
                                                                            <label class="form-check-label" for="payrollWrite"> Write </label>
                                                                        </div>
                                                                        <div class="form-check">
                                                                            <input class="form-check-input" type="checkbox" id="payrollCreate" />
                                                                            <label class="form-check-label" for="payrollCreate"> Create </label>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <!-- Permission table -->
                                            </div>
                                            <div class="col-12 text-center">
                                                <button type="submit" class="btn btn-primary me-3">Submit</button>
                                                <button type="reset" class="btn btn-outline-secondary" data-bs-dismiss="modal" aria-label="Close">Cancel</button>
                                            </div>
                                        </form>
                                        <!--/ Add role form -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--/ Add Role Modal -->

                        <!-- Edit User Modal -->
                        <div class="modal fade" id="editUser" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog modal-lg modal-simple modal-edit-user">
                                <div class="modal-content">
                                    <div class="modal-body p-0">
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        <div class="text-center mb-6">
                                            <h4 class="mb-2">Edit User Information</h4>
                                            <p class="mb-6">Updating user details will receive a privacy audit.</p>
                                        </div>
                                        <form id="editUserForm" class="row g-5" onsubmit="return false">
                                            <div class="col-12 col-md-6">
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" id="modalEditUserFirstName" name="modalEditUserFirstName" class="form-control" value="Oliver" placeholder="Oliver" />
                                                    <label for="modalEditUserFirstName">First Name</label>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" id="modalEditUserLastName" name="modalEditUserLastName" class="form-control" value="Queen" placeholder="Queen" />
                                                    <label for="modalEditUserLastName">Last Name</label>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" id="modalEditUserName" name="modalEditUserName" class="form-control" value="oliver.queen" placeholder="oliver.queen" />
                                                    <label for="modalEditUserName">Username</label>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" id="modalEditUserEmail" name="modalEditUserEmail" class="form-control" value="oliverqueen@gmail.com" placeholder="oliverqueen@gmail.com" />
                                                    <label for="modalEditUserEmail">Email</label>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="form-floating form-floating-outline">
                                                    <select id="modalEditUserStatus" name="modalEditUserStatus" class="form-select" aria-label="Default select example">
                                                        <option value="1" selected>Active</option>
                                                        <option value="2">Inactive</option>
                                                        <option value="3">Suspended</option>
                                                    </select>
                                                    <label for="modalEditUserStatus">Status</label>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" id="modalEditTaxID" name="modalEditTaxID" class="form-control modal-edit-tax-id" placeholder="123 456 7890" />
                                                    <label for="modalEditTaxID">Tax ID</label>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="input-group input-group-merge">
                                                    <span class="input-group-text">US (+1)</span>
                                                    <div class="form-floating form-floating-outline">
                                                        <input type="text" id="modalEditUserPhone" name="modalEditUserPhone" class="form-control phone-number-mask" value="+1 609 933 4422" placeholder="+1 609 933 4422" />
                                                        <label for="modalEditUserPhone">Phone Number</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="form-floating form-floating-outline">
                                                    <select id="modalEditUserLanguage" name="modalEditUserLanguage" class="select2 form-select" multiple>
                                                        <option value="">Select</option>
                                                        <option value="english" selected>English</option>
                                                        <option value="spanish">Spanish</option>
                                                        <option value="french">French</option>
                                                        <option value="german">German</option>
                                                        <option value="dutch">Dutch</option>
                                                        <option value="hebrew">Hebrew</option>
                                                        <option value="sanskrit">Sanskrit</option>
                                                        <option value="hindi">Hindi</option>
                                                    </select>
                                                    <label for="modalEditUserLanguage">Language</label>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="form-floating form-floating-outline">
                                                    <select id="modalEditUserCountry" name="modalEditUserCountry" class="select2 form-select" data-allow-clear="true">
                                                        <option value="">Select</option>
                                                        <option value="Australia">Australia</option>
                                                        <option value="Bangladesh">Bangladesh</option>
                                                        <option value="Belarus">Belarus</option>
                                                        <option value="Brazil">Brazil</option>
                                                        <option value="Canada">Canada</option>
                                                        <option value="China">China</option>
                                                        <option value="France">France</option>
                                                        <option value="Germany">Germany</option>
                                                        <option value="India" selected>India</option>
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
                                                        <option value="United Arab Emirates">United Arab Emirates</option>
                                                        <option value="United Kingdom">United Kingdom</option>
                                                        <option value="United States">United States</option>
                                                    </select>
                                                    <label for="modalEditUserCountry">Country</label>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" class="form-check-input" id="editBillingAddress" />
                                                    <label for="editBillingAddress" class="text-heading">Use as a billing address?</label>
                                                </div>
                                            </div>
                                            <div class="col-12 text-center">
                                                <button type="submit" class="btn btn-primary me-3">Submit</button>
                                                <button type="reset" class="btn btn-outline-secondary" data-bs-dismiss="modal" aria-label="Close">Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--/ Edit User Modal -->

                        <!-- /  Modal -->
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