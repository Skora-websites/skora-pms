<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact " dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Notification</title>
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

                        <div class="row">
                           
                            <!--/ Shipment statistics -->
                            <!-- Delivery Performance -->
                            <div class="col-lg-6 col-xxl-4 mb-6">
                                <div class="card h-100">
                                    <div
                                        class="card-header d-flex align-items-center justify-content-between">
                                        <div class="card-title mb-0">
                                            <h5 class="m-0 me-2">Delivery Performance</h5>
                                            <span class="card-subtitle">12% increase in this month</span>
                                        </div>
                                        <div class="dropdown">
                                            <button
                                                class="btn p-0"
                                                type="button"
                                                id="deliveryPerformance"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false">
                                                <i class="ri-more-2-line ri-20px"></i>
                                            </button>
                                            <div
                                                class="dropdown-menu dropdown-menu-end"
                                                aria-labelledby="deliveryPerformance">
                                                <a class="dropdown-item" href="javascript:void(0);">Select All</a>
                                                <a class="dropdown-item" href="javascript:void(0);">Refresh</a>
                                                <a class="dropdown-item" href="javascript:void(0);">Share</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <ul class="p-0 m-0">
                                            <li class="d-flex mb-4 pb-1 align-items-center">
                                                <div class="avatar flex-shrink-0 me-4">
                                                    <span
                                                        class="avatar-initial rounded bg-label-primary"><i class="ri-gift-line ri-26px"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                                                    <div class="me-2">
                                                        <h6 class="mb-0 fw-normal">
                                                            Packages in transit
                                                        </h6>
                                                        <small class="text-success fw-normal d-block">
                                                            <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                                                            25.8%
                                                        </small>
                                                    </div>
                                                    <div class="user-progress">
                                                        <h6 class="mb-0">10k</h6>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="d-flex mb-4 pb-1 align-items-center">
                                                <div class="avatar flex-shrink-0 me-4">
                                                    <span class="avatar-initial rounded bg-label-info"><i class="ri-car-line ri-26px"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                                                    <div class="me-2">
                                                        <h6 class="mb-0 fw-normal">
                                                            Packages out for delivery
                                                        </h6>
                                                        <small class="text-success fw-normal d-block">
                                                            <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                                                            4.3%
                                                        </small>
                                                    </div>
                                                    <div class="user-progress">
                                                        <h6 class="mb-0">5k</h6>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="d-flex mb-4 pb-1 align-items-center">
                                                <div class="avatar flex-shrink-0 me-4">
                                                    <span
                                                        class="avatar-initial rounded bg-label-success"><i class="ri-check-line text-success ri-26px"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                                                    <div class="me-2">
                                                        <h6 class="mb-0 fw-normal">Packages delivered</h6>
                                                        <small class="text-danger fw-normal d-block">
                                                            <i
                                                                class="ri-arrow-down-s-line me-1 ri-24px"></i>
                                                            12.5
                                                        </small>
                                                    </div>
                                                    <div class="user-progress">
                                                        <h6 class="mb-0">15k</h6>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="d-flex mb-4 pb-1 align-items-center">
                                                <div class="avatar flex-shrink-0 me-4">
                                                    <span
                                                        class="avatar-initial rounded bg-label-warning"><i class="ri-home-6-line ri-26px"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                                                    <div class="me-2">
                                                        <h6 class="mb-0 fw-normal">
                                                            Delivery success rate
                                                        </h6>
                                                        <small class="text-success fw-normal d-block">
                                                            <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                                                            35.6%
                                                        </small>
                                                    </div>
                                                    <div class="user-progress">
                                                        <h6 class="mb-0">95%</h6>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="d-flex mb-4 pb-1 align-items-center">
                                                <div class="avatar flex-shrink-0 me-4">
                                                    <span
                                                        class="avatar-initial rounded bg-label-secondary"><i class="ri-time-line ri-26px"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                                                    <div class="me-2">
                                                        <h6 class="mb-0 fw-normal">
                                                            Average delivery time
                                                        </h6>
                                                        <small class="text-danger fw-normal d-block">
                                                            <i
                                                                class="ri-arrow-down-s-line me-1 ri-24px"></i>
                                                            2.15
                                                        </small>
                                                    </div>
                                                    <div class="user-progress">
                                                        <h6 class="mb-0">2.5 Days</h6>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="d-flex">
                                                <div class="avatar flex-shrink-0 me-4">
                                                    <span class="avatar-initial rounded bg-label-danger"><i class="ri-user-3-line ri-26px"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                                                    <div class="me-2">
                                                        <h6 class="mb-0 fw-normal">
                                                            Customer satisfaction
                                                        </h6>
                                                        <small class="text-success fw-normal d-block">
                                                            <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                                                            5.7%
                                                        </small>
                                                    </div>
                                                    <div class="user-progress">
                                                        <h6 class="mb-0">4.5/5</h6>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <!--/ Delivery Performance -->

                            <!-- On route vehicles Table -->
                            <div class="col-lg-6 col-xxl-8 ">
                                <div class="card">
                                    <div class="card-header border-bottom">
                                        <h6 class="card-title mb-0">Filters</h6>
                                    </div>
                                    <div class="table-responsive">
                                        <table class="table align-middle">
                                            <thead>
                                                <tr>
                                                    <th><input type="checkbox" id="selectAll" /></th>
                                                    <th>User</th>
                                                    <th>Email</th>
                                                    <th>Role</th>

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