<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Home Visit</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="assets/img/favicon.png.png">

    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Font Awosome Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="assets/plugins/fontawesome/css/all.min.css">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="assets/plugins/select2/css/select2.min.css">

    <!-- Daterangepikcer CSS -->
    <link rel="stylesheet" href="assets/plugins/daterangepicker/daterangepicker.css">

    <!-- Datetimepicker CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap-datetimepicker.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets/plugins/simplebar/simplebar.min.css">

    <!-- Datatable CSS -->
    <link rel="stylesheet" href="assets/css/dataTables.bootstrap5.min.css">

    <!-- Main CSS -->
    <link rel="stylesheet" href="assets/css/style.css" id="app-style">

    <style>
        /* body {
            background-color: #f5f7fb;
            font-family: 'Inter', sans-serif;
            color: #333;
        } */
        /* .form-container {
            max-width: 900px;
            margin: 40px auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        } */
        h5 {
            color: #094a99;
            font-weight: 600;
            background-color: #e7f9ffff;
            border-radius: 5px;
            border-bottom: 2px solid #00bef2;
            padding-bottom: 12px;
            margin-bottom: 20px;
            padding-top: 12px;
        }

        .form-label {
            color: #094a99;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .input-group-text {
            background-color: #e7f9ffff;
            color: #000;
            border-top: 3px solid #00bef2;
            border-radius: 8px 0 0 8px;
        }

        .form-control,
        .form-control:focus {
            /* border: 1px solid #00bef2; */
            border-radius: 0 5px 5px 0;
            border-top: 3px solid #00bef2;
            box-shadow: 0 0 8px rgba(0, 190, 242, 0.2);
            transition: all 0.3s ease;
        }

        .form-control:focus {
            border-color: #094a99;
            box-shadow: 0 0 8px rgba(0, 190, 242, 0.3);
        }

        textarea.form-control {
            resize: vertical;
            /* min-height: 50px; */
        }


        .image-preview {
            max-width: 100px;
            max-height: 100px;
            object-fit: contain;
            border-radius: 8px;
            margin-top: 10px;
            display: none;
        }

        @media (max-width: 576px) {
            .form-container {
                padding: 20px;
                margin: 20px;
            }

            .input-group-text {
                padding: 8px;
            }
        }
    </style>

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

                <!-- Start Page Header -->
                <div>
                    <h4 class="fw-bold mb-3 color-doctorrx">Setting</h4>
                </div>
                <!-- End Page Header -->
                <div class="card mb-6">
                    <div class="card-body">
                        <form>
                            <!-- Company Info -->
                            <div class="row">
                                <h5>Company Information</h5>

                                <!-- Full Name -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Full Name</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-building"></i></div>
                                        <input type="text" class="form-control" placeholder="Full Name" name="company_name" id="company-name" required>
                                    </div>
                                </div>

                                <!-- Short Name -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Short Name</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-edit"></i></div>
                                        <input type="text" class="form-control" placeholder="Short Name" name="company_short_name" id="company_short_name" required>
                                    </div>
                                </div>

                                <!-- Tagline -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Tagline</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-flag"></i></div>
                                        <input type="text" class="form-control" placeholder="Tagline" name="company_tagline" id="company-tagline">
                                    </div>
                                </div>

                                <!-- Description -->
                                <div class="col-12 mb-3">
                                    <label class="form-label">Description</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-file-text"></i></div>
                                        <textarea class="form-control" placeholder="Description" name="company_description" id="company-description" rows="2"></textarea>
                                    </div>
                                </div>

                                <!-- Address 1 -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Address 1</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-map-pin"></i></div>
                                        <textarea class="form-control" placeholder="Address 1" name="company_address1" id="company_address1" rows="2"></textarea>
                                    </div>
                                </div>

                                <!-- Address 2 -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Address 2</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-map-pin"></i></div>
                                        <textarea class="form-control" placeholder="Address 2" name="company_address2" id="company_address2" rows="2"></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Contact & Social Media -->
                            <div class="row">
                                <h5 class="my-3">Contact & Social Media</h5>

                                <!-- Email 1 -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Email 1</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-mail"></i></div>
                                        <input type="email" class="form-control" placeholder="Email 1" name="company_email1" id="company_email1">
                                    </div>
                                </div>

                                <!-- Email 2 -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Email 2</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-mail"></i></div>
                                        <input type="email" class="form-control" placeholder="Email 2" name="company_email2" id="company_email2">
                                    </div>
                                </div>

                                <!-- Mobile No. 1 -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Mobile No. 1</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-phone"></i></div>
                                        <input type="text" class="form-control" placeholder="Mobile No. 1" name="company_mobile1" id="company_mobile1">
                                    </div>
                                </div>

                                <!-- Mobile No. 2 -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Mobile No. 2</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-device-mobile"></i></div>
                                        <input type="text" class="form-control" placeholder="Mobile No. 2" name="company_mobile2" id="company_mobile2">
                                    </div>
                                </div>

                                <!-- WhatsApp No. 1 -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">WhatsApp No. 1</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-brand-whatsapp"></i></div>
                                        <input type="text" class="form-control" placeholder="WhatsApp No. 1" name="company_whatsapp1" id="company_whatsapp1">
                                    </div>
                                </div>

                                <!-- WhatsApp No. 2 -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">WhatsApp No. 2</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-brand-whatsapp"></i></div>
                                        <input type="text" class="form-control" placeholder="WhatsApp No. 2" name="company_whatsapp2" id="company_whatsapp2">
                                    </div>
                                </div>

                                <!-- Facebook -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">Facebook</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-brand-facebook"></i></div>
                                        <input type="url" class="form-control" placeholder="Facebook" name="facebook" id="facebook">
                                    </div>
                                </div>

                                <!-- Twitter -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">Twitter</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-brand-twitter"></i></div>
                                        <input type="url" class="form-control" placeholder="Twitter" name="twitter" id="twitter">
                                    </div>
                                </div>

                                <!-- YouTube -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">YouTube</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-brand-youtube"></i></div>
                                        <input type="url" class="form-control" placeholder="YouTube" name="linkedin" id="linkedin">
                                    </div>
                                </div>

                                <!-- Instagram -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">Instagram</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-brand-instagram"></i></div>
                                        <input type="url" class="form-control" placeholder="Instagram" name="instagram" id="instagram">
                                    </div>
                                </div>

                                <!-- Pinterest -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">Pinterest</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-brand-pinterest"></i></div>
                                        <input type="url" class="form-control" placeholder="Pinterest" name="pintrest" id="pintrest">
                                    </div>
                                </div>

                                <!-- Google Map -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">Google</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-map"></i></div>
                                        <input type="url" class="form-control" placeholder="Google" name="map" id="google">
                                    </div>
                                </div>
                            </div>

                            <!-- Logos & Currency -->
                            <div class="row">
                                <h5 class="my-3">Logos & Currency</h5>

                                <!-- Full Logo -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">Full Logo</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-photo"></i></div>
                                        <input type="file" class="form-control" name="light_logo" id="light-logo">
                                    </div>
                                    <img id="show-lightlogo" class="image-preview" src="" alt="Light Logo">
                                </div>

                                <!-- Half Logo -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">Half Logo</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-photo"></i></div>
                                        <input type="file" class="form-control" name="dark_logo" id="dark-logo">
                                    </div>
                                    <img id="show-darklogo" class="image-preview" src="" alt="Dark Logo">
                                </div>

                                <!-- Favicon -->
                                <div class="col-12 col-lg-4 mb-3">
                                    <label class="form-label">Favicon</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-photo"></i></div>
                                        <input type="file" class="form-control" name="favicon" id="favicon">
                                    </div>
                                    <img id="show-favicon" class="image-preview" src="" alt="Favicon">
                                </div>

                                <!-- Currency Name -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Currency Name</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-currency-dollar"></i></div>
                                        <input type="text" class="form-control" placeholder="Currency Name" name="currency_name" id="currency_name">
                                    </div>
                                </div>

                                <!-- Currency Symbol -->
                                <div class="col-12 col-lg-6 mb-3">
                                    <label class="form-label">Currency Symbol</label>
                                    <div class="input-group">
                                        <div class="input-group-text"><i class="ti ti-currency"></i></div>
                                        <input type="text" class="form-control" placeholder="Currency Symbol" name="currency_symbol" id="currency_symbol">
                                    </div>
                                </div>

                                <!-- Hidden Fields -->
                                <input type="hidden" name="oldlight_logo" id="oldlight_logo">
                                <input type="hidden" name="olddark_logo" id="olddark_logo">
                                <input type="hidden" name="oldfavicon" id="oldfavicon">
                            </div>

                            <!-- Navigation -->
                            <div class="col-12 mt-4">
                                <button type="submit" class="btn btn-primary">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>


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
    <script src="assets/js/jquery-3.7.1.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Simplebar JS -->
    <script src="assets/plugins/simplebar/simplebar.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Daterangepikcer JS -->
    <script src="assets/js/moment.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>
    <script src="assets/plugins/daterangepicker/daterangepicker.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Datetimepicker JS -->
    <script src="assets/js/moment.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>
    <script src="assets/js/bootstrap-datetimepicker.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Datatable JS -->
    <script src="assets/js/jquery.dataTables.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>
    <script src="assets/js/dataTables.bootstrap5.min.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

    <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="d7ab00c85387527fb6389a9e-|49" defer></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960fed9b69ddf04f","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>

</body>

</html>


<!-- // JavaScript for image preview -->
<!-- <script>
    function previewImage(input, previewId) {
        const file = input.files[0];
        const preview = document.getElementById(previewId);
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    document.getElementById('light-logo').addEventListener('change', function() {
        previewImage(this, 'show-lightlogo');
    });
    document.getElementById('dark-logo').addEventListener('change', function() {
        previewImage(this, 'show-darklogo');
    });
    document.getElementById('favicon').addEventListener('change', function() {
        previewImage(this, 'show-favicon');
    });
</script> -->