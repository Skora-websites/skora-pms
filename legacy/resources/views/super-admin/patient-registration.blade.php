<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact " dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Registration</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">

    <!-- links  -->
    @include('super-admin.inc.header-links')
    <!--  -->

</head>

<body>


    <!-- Layout wrapper -->
    <div class="layout-wrapper layout-content-navbar">
        <div class="layout-container">
            <!-- Menu -->
            @include('super-admin.inc.sidebar')
            <!-- / Menu -->

            <!-- Layout container -->
            <div class="layout-page">
                <!-- Navbar -->
                @include('super-admin.inc.header')
                <!-- / Navbar -->

                <!-- Content wrapper -->
                <div class="content-wrapper">
                    <!-- Content -->
                    <div class="container-xxl flex-grow-1 container-p-y">
                        <!-- Card -->
                        <div class="card mb-6">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Patient Registration</h5>
                            </div>
                            <div class="card-body">
                                <form id="patient-registration-form" action="{{ route('super-admin.user.store') }}" method="POST">
                                    @csrf
                                    <input type="hidden" name="role" value="patient">
                                    <input type="hidden" name="status" value="active">
                                    <div class="row">
                                        <!-- Patient Details -->
                                        <h6 class="fw-bold mb-3">Patient Details :</h6>

                                        <!-- Name -->
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-user-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" name="name" id="name" class="form-control" placeholder="Patient Name" required />
                                                    <label for="name">Patient Name</label>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Number -->
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-phone-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" name="phone" id="phone" class="form-control" placeholder="Contact Number" required />
                                                    <label for="phone">Number</label>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Email -->
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-mail-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="email" name="email" id="email" class="form-control" placeholder="Email ID" required/>
                                                    <label for="email">Email ID</label>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Password -->
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-lock-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="password" name="password" id="password" class="form-control" placeholder="Password" required />
                                                    <label for="password">Password</label>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="col-12 mt-2">
                                            <button type="submit" class="btn btn-primary">Register Patient</button>
                                        </div>

                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- / Content -->


    <!-- Footer-links -->
    @include('super-admin.inc.footer-links')
    <!-- / Footer-links -->
</body>

</html>