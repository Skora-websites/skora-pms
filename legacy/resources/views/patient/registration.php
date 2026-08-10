<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact " dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Registration</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">

    <!-- links  -->
    <?php include('inc/header-links.php'); ?>
    <!--  -->

</head>

<body>


    <!-- Layout wrapper -->

    <!-- Content -->
    <div class="col-md-10 container-xxl flex-grow-1 container-p-y">
        <!-- <div class="container-xxl"> -->
        <div class="card mb-6">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Basic Layout</h5>
            </div>
            <div class="card-body">
                <form id="company-settings-form" enctype="multipart/form-data">
                    <div class="row">
                        <!-- Doctor Details -->
                        <h6 class="fw-bold mb-3">Doctor Details :</h6>

                        <!-- Dr. Name -->
                        <div class="col-md-6 mb-4">
                            <div class="input-group input-group-merge">
                                <span class="input-group-text"><i class="ri-user-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" name="doctor_name" id="doctor_name" class="form-control" placeholder="Dr. Name" required />
                                    <label for="doctor_name">Dr. Name</label>
                                </div>
                            </div>
                        </div>

                        <!-- Number -->
                        <div class="col-md-6 mb-4">
                            <div class="input-group input-group-merge">
                                <span class="input-group-text"><i class="ri-phone-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" name="doctor_number" id="doctor_number" class="form-control" placeholder="Contact Number" required />
                                    <label for="doctor_number">Number</label>
                                </div>
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="col-md-6 mb-4">
                            <div class="input-group input-group-merge">
                                <span class="input-group-text"><i class="ri-mail-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="email" name="doctor_email" id="doctor_email" class="form-control" placeholder="Email ID" />
                                    <label for="doctor_email">Email ID (if any)</label>
                                </div>
                            </div>
                        </div>

                        <!-- Degree (Checklist) -->
                        <div class="col-md-6 mb-4">
                            <label class="form-label d-block mb-2">Degree (Select all that apply)</label>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" name="degree[]" id="mbbs" value="MBBS">
                                <label class="form-check-label" for="mbbs">MBBS</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" name="degree[]" id="md" value="MD">
                                <label class="form-check-label" for="md">MD</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" name="degree[]" id="bds" value="BDS">
                                <label class="form-check-label" for="bds">BDS</label>
                            </div>
                            <!-- Add more as needed -->
                        </div>

                        <!-- Area of Specialization (Multiple Select) -->
                        <div class="col-md-6 mb-4">
                            <div class="form-floating form-floating-outline">
                                <select name="specialization[]" id="specialization" class="form-select">
                                    <option value="Select">Select</option>
                                    <option value="Cardiology">Cardiology</option>
                                    <option value="Dermatology">Dermatology</option>
                                    <option value="Gynecology">Gynecology</option>
                                    <option value="Orthopedics">Orthopedics</option>
                                    <!-- Add more as needed -->
                                </select>
                                <label for="specialization">Area of Specialization</label>
                            </div>
                        </div>

                        <!-- Registration Certificate or Number -->
                        <div class="col-md-6 mb-4">
                            <div class="input-group input-group-merge">
                                <span class="input-group-text"><i class="ri-file-check-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" name="registration_no" id="registration_no" class="form-control" placeholder="Registration No." required />
                                    <label for="registration_no">Registration Certificate / Number</label>
                                </div>
                            </div>
                        </div>

                        <!-- Clinic Name -->
                        <div class="col-md-6 mb-4">
                            <div class="input-group input-group-merge">
                                <span class="input-group-text"><i class="ri-hospital-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" name="clinic_name" id="clinic_name" class="form-control" placeholder="Clinic Name" />
                                    <label for="clinic_name">Clinic Name (if any)</label>
                                </div>
                            </div>
                        </div>
                        <!-- City -->
                        <div class="col-md-6 mb-4">
                            <div class="form-floating form-floating-outline">
                                <input type="text" name="city" id="city" class="form-control" placeholder="City" />
                                <label for="city">City</label>
                            </div>
                        </div>

                        <!-- Address (Manual "Add More" by duplicating fields) -->
                        <div class="col-md-6 mb-4">
                            <div class="form-floating form-floating-outline">
                                <textarea name="doctor_address[]" class="form-control" placeholder="Address" style="height: 80px"></textarea>
                                <label>Address 1</label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-4">
                            <div class="form-floating form-floating-outline">
                                <textarea name="doctor_address[]" class="form-control" placeholder="Address" style="height: 80px"></textarea>
                                <label>Address 2</label>
                            </div>
                        </div>
                        <!-- You can duplicate the above block as needed manually -->

                        

                        <!-- State -->
                        <div class="col-md-6 mb-4">
                            <div class="form-floating form-floating-outline">
                                <input type="text" name="state" id="state" class="form-control" placeholder="State" />
                                <label for="state">State</label>
                            </div>
                        </div>

                        <!-- Country -->
                        <div class="col-md-6 mb-4">
                            <div class="form-floating form-floating-outline">
                                <input type="text" name="country" id="country" class="form-control" placeholder="Country" />
                                <label for="country">Country</label>
                            </div>
                        </div>

                        <!-- Create User ID -->
                        <div class="col-md-6 mb-4">
                            <div class="input-group input-group-merge">
                                <span class="input-group-text"><i class="ri-user-line ri-20px"></i></span>
                                <div class="form-floating form-floating-outline">
                                    <input type="text" name="user_id" id="user_id" class="form-control" placeholder="User ID" required />
                                    <label for="user_id">Create User ID</label>
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

                    </div>
                </form>
            </div>
        </div>
        <!-- </div> -->
    </div>
    <!-- / Content -->


    <!-- / Layout wrapper -->


    <!-- Footer-links -->
    <?php include('inc/footer-links.php'); ?>
    <!-- / Footer-links -->
</body>

</html>