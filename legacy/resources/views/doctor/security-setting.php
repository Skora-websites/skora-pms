
<!DOCTYPE html>
<html lang="en">
<head>

	<!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Security Settings</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="author" content="Dreams Technologies">
	
    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

     <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="ed0de46d5e39fb0de61271be-text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets/plugins/simplebar/simplebar.min.css">

    <!-- Fontawesome CSS -->
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/all.min.css">

    <!-- Bootstrap Tagsinput CSS -->
    <link rel="stylesheet" href="assets/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css">

	<!-- intltelinput CSS -->
    <link rel="stylesheet" href="assets/plugins/intltelinput/css/intlTelInput.css">
    <link rel="stylesheet" href="assets/plugins/intltelinput/css/demo.css">

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
            <div class="content" id="profilePage">

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
                                    <div class="d-flex">
                                        <h5 class="fw-bold">Security</h5>
                                    </div>
                                </div>
                                <div class="card-body px-0 mx-3">

                                    <!-- start row -->
                                    <div class="row">
                                        <div class="col-lg-8">
                                            <div>
                                                <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                                                    <div class="d-flex align-items-center">
                                                        <div>
                                                            <h5 class="fs-16 fw-semibold mb-1">Password</h5>
                                                            <p class="fs-14">Set a unique password to secure the account</p>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex align-items-center">
                                                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#change_password"><span class="btn btn-md btn-light p-1 shadow-sm border"><i class="ti ti-edit"></i></span></a>
                                                    </div>
                                                </div>
                                                <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                                                    <div class="d-flex align-items-center">
                                                        <div>
                                                            <h5 class="fs-16 fw-semibold mb-1">Two Factor Authentication</h5>
                                                            <p class="fs-14">Use your mobile phone to receive security PIN.</p>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex align-items-center">
                                                        <label class="d-flex align-items-center form-switch ps-3">
                                                            <input class="form-check-input m-0 me-2" type="checkbox" checked>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">										
                                                    <div class="d-flex align-items-center">
                                                        <div>
                                                            <h5 class="fs-16 fw-semibold mb-1">Google Authentication</h5>
                                                            <p class="fs-14">Connect to Google</p>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex align-items-center">
                                                        <label class="d-flex align-items-center form-switch ps-3">
                                                            <input class="form-check-input m-0 me-2" type="checkbox" checked>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                                                    <div class="d-flex align-items-center">
                                                        <div>
                                                            <h5 class="fs-16 fw-semibold mb-1">Phone Number</h5>
                                                            <p class="fs-14">Phone Number associated with the account</p>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex align-items-center">
                                                        <a href="javascript:void(0);" class="me-3" data-bs-toggle="modal" data-bs-target="#phone_verification"><span class="btn btn-md btn-light border shadow-sm p-1"><i class="ti ti-edit"></i></span></a>
                                                        <a href="javascript:void(0);"><span class="btn btn-md btn-light border shadow-sm p-1"><i class="ti ti-trash"></i></span></a>
                                                    </div>
                                                </div>
                                                <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                                                    <div class="d-flex align-items-center">
                                                        <div>
                                                            <h5 class="fs-16 fw-semibold mb-1">Email Address</h5>
                                                            <p class="fs-14">Email Address associated with the account</p>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex align-items-center">
                                                        <a href="javascript:void(0);" class="me-3" data-bs-toggle="modal" data-bs-target="#email_verification"><span class="btn btn-md btn-light border shadow-sm p-1"><i class="ti ti-edit"></i></span></a>
                                                        <a href="javascript:void(0);"><span class="btn btn-md btn-light border shadow-sm p-1"><i class="ti ti-trash"></i></span></a>
                                                    </div>
                                                </div>
                                                <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                                                    <div class="d-flex align-items-center">
                                                        <div>
                                                            <h5 class="fs-16 fw-semibold mb-1">Deactivate Account</h5>
                                                            <p class="fs-14">​Your account will be deactivated and reactivated upon signing in again.</p>
                                                        </div>
                                                    </div>
                                                    <a href="javascript:void(0);"><span class="btn btn-md btn-light border shadow-sm p-1"><i class="ti ti-ban"></i></span></a>
                                                </div>
                                                <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                                                    <div class="d-flex align-items-center">
                                                        <div>
                                                            <h5 class="fs-16 fw-semibold mb-1">Delete Account</h5>
                                                            <p class="fs-14">Your account will be permanently deleted</p>
                                                        </div>
                                                    </div>
                                                    <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal"><span class="btn btn-md btn-light border shadow-sm p-1"><i class="ti ti-trash"></i></span></a>
                                                </div>
                                            </div>
                                        </div><!-- end col -->
                                        <div class="col-lg-4">
                                            <div class="card bg-light">
                                                <div class="card-body">
                                                    <div class="mb-3">
                                                        <h6 class="fs-14 fw-semibold">Browsers & Devices</h6>
                                                        <p class="mb-1">The associated browsers & devices </p>
                                                        <a href="javascript:void(0);" class="btn btn-primary"><i class="ti ti-logout me-1"></i>Sign out from all</a>
                                                    </div>
                                                    <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                                                        <div>
                                                            <h6 class="fs-14 fw-semibold">Chrome - Windows</h6>
                                                            <span class="fs-13">30 Apr 2025, 11:15 AM</span>
                                                        </div>
                                                        <a href="javascript:void(0);" class="btn btn-md bg-white border shadow-sm p-1"><i class="ti ti-logout"></i></a>
                                                    </div>
                                                    <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                                                        <div>
                                                            <h6 class="fs-14 fw-semibold">Safari Macos</h6>
                                                            <span class="fs-13">30 Apr 2025, 11:15 AM</span>
                                                        </div>
                                                        <a href="javascript:void(0);" class="btn btn-md bg-white border shadow-sm p-1"><i class="ti ti-logout"></i></a>
                                                    </div>
                                                    <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                                                        <div>
                                                            <h6 class="fs-14 fw-semibold">Chrome - Windows</h6>
                                                            <span class="fs-13">30 Apr 2025, 11:15 AM</span>
                                                        </div>
                                                        <a href="javascript:void(0);" class="btn btn-md bg-white border shadow-sm p-1"><i class="ti ti-logout"></i></a>
                                                    </div>
                                                    <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                                                        <div>
                                                            <h6 class="fs-14 fw-semibold">Chrome - Windows</h6>
                                                            <span class="fs-13">19 Mar 2025, 02:50 PM</span>
                                                        </div>
                                                        <a href="javascript:void(0);" class="btn btn-md bg-white border shadow-sm p-1"><i class="ti ti-logout"></i></a>
                                                    </div>
                                                    <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                                                        <div>
                                                            <h6 class="fs-14 fw-semibold">Firefox Windows</h6>
                                                            <span class="fs-13">20 Feb 2025, 06:20 PM</span>
                                                        </div>
                                                        <a href="javascript:void(0);" class="btn btn-md bg-white border shadow-sm p-1"><i class="ti ti-logout"></i></a>
                                                    </div>
                                                    <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                                                        <div>
                                                            <h6 class="fs-14 fw-semibold">Chrome - Windows</h6>
                                                            <span class="fs-13">18 Jan 2025, 03:15 PM</span>
                                                        </div>
                                                        <a href="javascript:void(0);" class="btn btn-md bg-white border shadow-sm p-1"><i class="ti ti-logout"></i></a>
                                                    </div>
                                                    <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                                                        <div>
                                                            <h6 class="fs-14 fw-semibold">Safari Macos</h6>
                                                            <span class="fs-13">02 Jan 2025, 09:30 AM</span>
                                                        </div>
                                                        <a href="javascript:void(0);" class="btn btn-md bg-white border shadow-sm p-1"><i class="ti ti-logout"></i></a>
                                                    </div>
                                                    <div class="d-flex align-items-center justify-content-between p-2">
                                                        <div>
                                                            <h6 class="fs-14 fw-semibold">Firefox Windows</h6>
                                                            <span class="fs-13">28 Dec 2024, 05:40 PM</span>
                                                        </div>
                                                        <a href="javascript:void(0);" class="btn btn-md bg-white border shadow-sm p-1"><i class="ti ti-logout"></i></a>
                                                    </div>
                                                </div><!-- end card -->
                                            </div><!-- end card -->
                                        </div><!-- end col -->
                                    </div>
                                    <!-- end row -->

                                </div><!-- end card body -->
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


        		<div id="change_password" class="modal fade">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<h4 class="modal-title fw-bold">Change Password</h4>
						<button type="button" class="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="fa-solid fa-x"></i></button>
					</div>
					<form action="https://preclinic.dreamstechnologies.com/html/template/security-settings.html">
						<div class="modal-body">
							<div class="mb-3">
								<label class="form-label">Current Password<span class="text-danger ms-1">*</span></label>
								<div class="position-relative">
                                    <div class="pass-group input-group position-relative border rounded">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti ti-lock text-dark fs-14"></i>
                                        </span>
                                        <input type="password" class="pass-input form-control ps-0 border-0" placeholder="****************">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti toggle-password ti-eye-off text-dark fs-14"></i>
                                        </span>
                                    </div>
                                </div>
							</div>
							<div class="mb-3">
								<label class="form-label">New Password<span class="text-danger ms-1">*</span></label>
								<div class="position-relative">
                                    <div class="pass-group input-group position-relative border rounded">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti ti-lock text-dark fs-14"></i>
                                        </span>
                                        <input type="password" class="pass-inputs form-control ps-0 border-0" placeholder="****************">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti toggle-passwords ti-eye-off text-dark fs-14"></i>
                                        </span>
                                    </div>
                                </div>
								<div class="password-strength d-flex" id="passwordStrength">
									<span id="poor"></span>
									<span id="weak"></span>
									<span id="strong"></span>
									<span id="heavy"></span>
								</div>
								<div id="passwordInfo" class="mb-2"></div>
								<p class="text-gray-5">Use 8 or more characters with a mix of letters, numbers & symbols.</p>
							</div>
							<div>
								<label class="form-label">Confirm Password<span class="text-danger ms-1">*</span></label>
								<div class="position-relative">
                                    <div class="pass-group input-group position-relative border rounded">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti ti-lock text-dark fs-14"></i>
                                        </span>
                                        <input type="password" class="pass-inputa form-control ps-0 border-0" placeholder="****************">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti toggle-passworda ti-eye-off text-dark fs-14"></i>
                                        </span>
                                    </div>
                                </div>
							</div>
						</div>
						<div class="modal-footer d-flex align-items-center justify-content-between gap-1">
							<button type="button" class="btn btn-outline-white" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" class="btn btn-primary">Save Changes</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div id="phone_verification" class="modal fade">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<h4 class="modal-title fw-bold">Change Phone Number</h4>
						<button type="button" class="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="fa-solid fa-x"></i></button>
					</div>
					<form action="https://preclinic.dreamstechnologies.com/html/template/security-settings.html">
						<div class="modal-body">
							<div class="mb-3">
								<label class="form-label">Current Phone Number<span class="text-danger ms-1">*</span></label>
								<input type="text" class="form-control" id="phone">
							</div>
							<div class="mb-3">
								<label class="form-label">New Phone Number<span class="text-danger ms-1">*</span></label>
								<input type="text" class="form-control" id="phone2">
								<p class="mt-2 d-inline-flex align-items-center"><i class="ti ti-info-circle me-1"></i>New phone number only updated once you verified </p>
							</div>
							<div>
								<label class="form-label">Current Password<span class="text-danger ms-1">*</span></label>
								<div class="position-relative">
                                    <div class="pass-group input-group position-relative border rounded">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti ti-lock text-dark fs-14"></i>
                                        </span>
                                        <input type="password" class="pass-inputb form-control ps-0 border-0" placeholder="****************">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti toggle-passwordb ti-eye-off text-dark fs-14"></i>
                                        </span>
                                    </div>
                                </div>
							</div>								
						</div>
						<div class="modal-footer d-flex align-items-center justify-content-between gap-1">
							<button type="button" class="btn btn-outline-white" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" class="btn btn-primary">Save Changes</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div id="email_verification" class="modal fade">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<h4 class="modal-title fw-bold">Change Email Address</h4>
						<button type="button" class="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="fa-solid fa-x"></i></button>
					</div>
					<form action="https://preclinic.dreamstechnologies.com/html/template/security-settings.html">
						<div class="modal-body">
							<div class="mb-3">
								<label class="form-label">Current Email Address<span class="text-danger ms-1">*</span></label>
								<input type="email" class="form-control">
							</div>
							<div class="mb-3">
								<label class="form-label">New Email Address<span class="text-danger ms-1">*</span></label>
								<input type="email" class="form-control">
								<p class="mt-2 d-inline-flex align-items-center"><i class="ti ti-info-circle me-1"></i>New email address only updated once you verified </p>
							</div>
							<div>
								<label class="form-label">Current Password<span class="text-danger ms-1">*</span></label>
								<div class="position-relative">
                                    <div class="pass-group input-group position-relative border rounded">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti ti-lock text-dark fs-14"></i>
                                        </span>
                                        <input type="password" class="pass-inputc form-control ps-0 border-0" placeholder="****************">
                                        <span class="input-group-text bg-white border-0">
                                            <i class="ti toggle-passwordc ti-eye-off text-dark fs-14"></i>
                                        </span>
                                    </div>
                                </div>
							</div>								
						</div>
						<div class="modal-footer d-flex align-items-center justify-content-end gap-1">
							<button type="button" class="btn btn-outline-white" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" class="btn btn-primary">Save Changes</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div id="two-factor" class="modal fade">
			<div class="modal-dialog modal-dialog-centered modal-md">
				<div class="modal-content">
					<div class="modal-header">
						<h4 class="modal-title fw-bold">SMS Two Factor Authentication</h4>
						<button type="button" class="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="fa-solid fa-x"></i></button>
					</div>
					<form action="https://preclinic.dreamstechnologies.com/html/template/security-settings.html">
						<div class="modal-body">
							<div class="mb-3">
								<label class="form-label">Phone Number<span class="text-danger ms-1">*</span></label>
								<input type="text" class="form-control" id="phone3">
							</div>
							<p class="fs-13 mb-0">By providing your phone number, you agree to receive text messages from Figma to enable two-factor authentication when you log in. </p>							
						</div>
						<div class="modal-footer d-flex align-items-center justify-content-between gap-1">
							<button type="button" class="btn btn-outline-white" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" class="btn btn-primary">Verify</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div id="delete_modal" class="modal fade">
			<div class="modal-dialog modal-dialog-centered modal-md">
				<div class="modal-content">
					<div class="modal-header">
						<h4 class="modal-title fw-bold">Delete Account</h4>
						<button type="button" class="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="fa-solid fa-x"></i></button>
					</div>
					<form action="https://preclinic.dreamstechnologies.com/html/template/security-settings.html">
						<div class="modal-body">
							<div class="mb-3">
								<p class="text-dark fw-semibold mb-0">Why Are You Deleting Your Account?</p>
								<p class="fs-13">We're sorry to see you go! To help us improve, please let us know your reason for deleting your account</p>
							</div>
							<div>
								<div class="form-check mb-3 d-flex align-items-center">
									<input class="form-check-input" type="radio" name="Radio-2" id="Radio-sm-1">
									<div class="ms-2">
										<p class="text-dark fw-semibold mb-0">No longer using the service</p>
										<label class="form-check-label fs-13" for="Radio-sm-1">
											I no longer need this service and won’t be using it in the future.
										</label>
									</div>
								</div>
								<div class="form-check mb-3 d-flex align-items-center">
									<input class="form-check-input" type="radio" name="Radio-2" id="Radio-sm-2">
									<div class="ms-2">
										<p class="text-dark fw-semibold mb-0">Privacy concerns</p>
										<label class="form-check-label fs-13" for="Radio-sm-2">
											I am concerned about how my data is handled and want to remove
										</label>
									</div>
								</div>
								<div class="form-check mb-3 d-flex align-items-center">
									<input class="form-check-input" type="radio" name="Radio-2" id="Radio-sm-3">
									<div class="ms-2">
										<p class="text-dark fw-semibold mb-0">Too many notifications/emails</p>
										<label class="form-check-label fs-13" for="Radio-sm-3">
											I’m overwhelmed by the volume of notifications or emails
										</label>
									</div>
								</div>
								<div class="form-check mb-3 d-flex align-items-center">
									<input class="form-check-input" type="radio" name="Radio-2" id="Radio-sm-4">
									<div class="ms-2">
										<p class="text-dark fw-semibold mb-0">Poor user experience</p>
										<label class="form-check-label fs-13" for="Radio-sm-4">
											I’ve had difficulty using the platform, and it didn’t meet my expectations
										</label>
									</div>
								</div>
								<div class="form-check mb-3">
									<input class="form-check-input" type="radio" name="Radio-2" id="Radio-sm-5" checked>
									<label class="form-check-label text-dark fw-semibold" for="Radio-sm-5">
										Other (Please specify)
									</label>
								</div>
							</div>	
							<div>
								<label class="form-label">Reason<span class="text-danger ms-1">*</span></label>
								<textarea class="form-control" rows="3"></textarea>
							</div>					
						</div>
						<div class="modal-footer d-flex align-items-center justify-content-between gap-1">
							<button type="button" class="btn btn-outline-white" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" class="btn btn-primary">Confirm & Delete</button>
						</div>
					</form>
				</div>
			</div>
		</div>


    </div>
    <!-- End Wrapper -->

    <!-- jQuery -->
    <script src="assets/js/jquery-3.7.1.min.js" type="ed0de46d5e39fb0de61271be-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="ed0de46d5e39fb0de61271be-text/javascript"></script>    

	<!-- Simplebar JS -->
	<script src="assets/plugins/simplebar/simplebar.min.js" type="ed0de46d5e39fb0de61271be-text/javascript"></script>

    <!-- Bootstrap Tagsinput JS -->
    <script src="assets/plugins/bootstrap-tagsinput/bootstrap-tagsinput.js" type="ed0de46d5e39fb0de61271be-text/javascript"></script>

    <!-- intel Input -->
    <script src="assets/plugins/intltelinput/js/intlTelInput.js" type="ed0de46d5e39fb0de61271be-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="ed0de46d5e39fb0de61271be-text/javascript"></script>

<script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="ed0de46d5e39fb0de61271be-|49" defer></script><script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fec628f3ef04f","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>
</body>
</html>