<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Prescription</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!-- Favicon -->
    <link rel="shortcut icon" href="assets/img/logo.png">
    <!-- Theme Config Js -->
    <script src="assets/js/theme-script.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="assets/plugins/tabler-icons/tabler-icons.min.css">

    <!-- Daterangepikcer CSS -->
    <link rel="stylesheet" href="assets/plugins/daterangepicker/daterangepicker.css">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="assets/plugins/select2/css/select2.min.css">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="assets/plugins/simplebar/simplebar.min.css">

    <!-- Datatable CSS -->
    <link rel="stylesheet" href="assets/css/dataTables.bootstrap5.min.css">

    <!-- Main CSS -->
    <link rel="stylesheet" href="assets/css/style.css" id="app-style">


    <style>


        .prescription {
            border: 2px solid #094b9c;
            border-radius: 6px;
            padding: 30px;
            /* max-width: 950px; */
            background-color: #fff;
            margin-bottom: 30px;
            color: #000;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #094b9c;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }

        .header img {
            height: 60px;
        }

        .header h2 {
            color: #094b9c;
            font-size: 22px;
            margin: 0;
            text-align: right;
            line-height: 1.3;
        }

        .barcode-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .barcode-box {
            text-align: right;
        }

        .barcode-box img {
            height: 40px;
        }

        .info-table {
            width: 100%;
            margin-bottom: 20px;
        }

        .info-table td {
            padding: 4px 8px;
            vertical-align: top;
        }

        .section-title {
            color: #094b9c;
            font-weight: bold;
            font-size: 15px;
            margin-top: 25px;
            margin-bottom: 8px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2px;
        }

        .vitals-box,
        .instructions {
            border: 1px solid #ccc;
            padding: 8px;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .prescription-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-top: 10px;
        }

        .prescription-table th,
        .prescription-table td {
            border: 1px solid #094b9c;
            padding: 6px 8px;
            text-align: left;
        }

        .signature {
            text-align: right;
            margin-top: 40px;
        }

        .footer-note {
            font-size: 12px;
            text-align: center;
            color: #333;
            margin-top: 20px;
        }

        .highlight {
            background: #f1f9ff;
        }

        .footer-section {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 4px solid #00bef2;
            font-size: 10px;
            color: #000;
            font-family: 'Segoe UI', sans-serif;
        }

        .branches {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 20px;
        }

        /* .branches div {
            min-width: 180px;
            max-width: 230px;
            line-height: 1.4;
            } */

        .footer-bottom {
            margin-top: 15px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            font-size: 12px;
            color: #444;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 10px;
        }

        @page {
    size: A4;
    margin: 20mm 15mm 20mm 15mm; /* top right bottom left */
}

@media print {
    body {
        margin: 0;
        background: #fff;
    }

    .prescription {
        border: none;
        box-shadow: none;
        padding: 0;
        margin: 0;
        width: 100%;
        page-break-inside: avoid;
    }

    .footer-section {
        page-break-inside: avoid;
    }

    .barcode-section,
    .footer-note,
    .signature {
        page-break-inside: avoid;
    }

    .card-header {
        padding: 0 !important;
        margin: 0 !important;
    }

    .header img {
        height: 50px !important;
    }

    .prescription-table th,
    .prescription-table td {
        font-size: 12px;
        padding: 4px;
    }

    .footer-bottom {
        font-size: 10px;
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
            <div class="content pb-0">

                <!-- Page Header -->
                <div class="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4">
                    <div>
                        <h4 class="fw-bold mb-0">Prescription</h4>
                    </div>

                </div>
                <!-- End Page Header -->

                <div class="card-header ">
                    <div class="prescription">

                        <!-- Header with Logo and Hospital Name -->
                        <div class="header">
                            <img src="assets/img/main-logo.png" alt="Hospital Logo">
                            <h2>Skoracares<br><small style="font-size: 14px;">Gaur City 2, Gr. Noida West</small></h2>
                        </div>

                        <!-- Barcode and Date/ID Section -->
                        <div class="barcode-section">
                            <div><strong>Date:</strong> 27-02-2025 03:43 PM</div>
                            <div class="barcode-box">
                                <div><strong>ID:</strong> SHC046586</div>
                                <img src="assets/img/barcode.jpg" alt="Barcode" />
                            </div>
                        </div>

                        <!-- Patient Info -->
                        <table class="info-table">
                            <tr>
                                <td><strong>Patient Name:</strong> Mrs. Sakshi Garg</td>
                                <td><strong>Age/Gender:</strong> 32 Yrs / Female</td>
                            </tr>
                            <tr>
                                <td><strong>Mobile No:</strong> 8178891027</td>
                                <td><strong>Reg. No:</strong> OPD-SN24-25-177428</td>
                            </tr>
                            <tr>
                                <td><strong>Address:</strong> Tower-D106, Greater Noida West, UP, 201318</td>
                                <td><strong>Consultant:</strong> Dr. Astha Srivastava</td>
                            </tr>
                            <tr>
                                <td><strong>Category:</strong> Paying</td>
                                <td><strong>Department:</strong> Obstetrics and Gynaecology</td>
                            </tr>
                        </table>

                        <!-- Vitals -->
                        <div class="section-title">Vitals</div>
                        <div class="vitals-box">
                            BP: 100/70 mmHg | Temp: 97.1°F | Weight: 63 kg | SPO2: 96% | RR: 17/min | Pulse: 111/min
                        </div>

                        <!-- Complaints -->
                        <div class="section-title">Complaints</div>
                        <p>G2P1L1 36 Weeks 2 Days by Dates and Scan Prev LSCS</p>

                        <!-- Obstetric History -->
                        <div class="section-title">Obstetric History</div>
                        <p>Currently Pregnant with 1 Fetus<br>
                            GA by LMP (Calc.): 36W 0D | EDD: 27-03-2025<br>
                            LMP: 20-06-2024</p>

                        <div class="section-title">Previous Pregnancy</div>
                        <div class="table-responsive">
                        <table class="prescription-table">
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Outcome</th>
                                    <th>Type</th>
                                    <th>Indication</th>
                                    <th>Complication</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>2021</td>
                                    <td>Girl</td>
                                    <td>LSCS</td>
                                    <td>Placenta Privea, Rec’d 1 Unit PCV & Parenteral Iron</td>
                                    <td>—</td>
                                </tr>
                            </tbody>
                        </table>
                        </div>

                        <!-- General Exam -->
                        <div class="section-title">General Exam</div>
                        <p>P/A UTERUS TS CEPHALIC RELAXED FHS PLUS REGULAR</p>

                        <!-- Investigations -->
                        <div class="section-title">Investigations</div>
                        <p>CBC, LFT, KFT, PT INR APTT, HBsAg, HIV, Anti HCV</p>

                        <!-- Prescription -->
                        <div class="section-title">Prescription</div>
                        <div class="table-responsive">
                        <table class="prescription-table">
                            <thead>
                                <tr>
                                    <th>Medicine</th>
                                    <th>Dosage Instruction</th>
                                    <th>Duration</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Tab Livogen-XT</td>
                                    <td>1 TAB every Day before meal</td>
                                    <td>30 Days</td>
                                    <td>30</td>
                                </tr>
                                <tr>
                                    <td>Tab Supracal XT (1x15)</td>
                                    <td>1 TAB every Day after meal</td>
                                    <td>30 Days</td>
                                    <td>30</td>
                                </tr>
                                <tr>
                                    <td>Tab Zincovit</td>
                                    <td>1 TAB every Day after meal</td>
                                    <td>30 Days</td>
                                    <td>30</td>
                                </tr>
                            </tbody>
                        </table>
                        </div>

                        <!-- Instructions -->
                        <div class="section-title">Instructions</div>
                        <div class="instructions">
                            Daily Fetal Kick Count<br>
                            High Protein Diet<br>
                            Report in case of pain / bleeding / leaking / reduced movements
                        </div>

                        <!-- Signature -->
                        <div class="signature">
                            <p><strong>Dr. Astha Srivastava</strong></p>
                        </div>

                        <!-- Footer Note -->
                        <div class="footer-note">
                            Note: This prescription is valid for three days only, including today. Applicable for cash patients only.
                        </div>

                        <!-- Footer Section -->
                        <div class="footer-section">
                            <div class="branches">
                                <div><strong>Sarvodaya Hospital</strong><br>Greater Noida West<br>Ph: 1800 313 1414</div>
                                <div><strong>Sarvodaya Hospital</strong><br>Sec-8, Faridabad<br>Ph: 1800 313 1414</div>
                                <div><strong>Sarvodaya Hospital</strong><br>Sec-19, Krishnapuri<br>Ph: 0129-4194444</div>
                                <div><strong>Sarvodaya Medicentre</strong><br>B-7, GK Enclave 2, Delhi<br>Ph: 011-42060400</div>
                                <div><strong>Sarvodaya Imaging Centre</strong><br>Charak Palika Hospital, NDMC<br>Ph: 011-26111180</div>
                                <div><strong>Sarvodaya NRCH Imaging Centre</strong><br>Connaught Place, Delhi<br>Ph: 7669842442</div>
                                <div><strong>Sarvodaya Health Clinic</strong><br>Sec-67, Faridabad<br>Ph: 7838885553</div>
                            </div>

                            <div class="footer-bottom">
                                <div>
                                    E: info@sarvodayahospital.com | W: www.sarvodayahospital.com
                                </div>
                                <div>
                                    CIN No: U85110DL1997PLC088209 | PAN NO. AABCA3631R
                                </div>
                                <div>
                                    GST NO. 09AABCA3631R1ZD | STATE CODE: 201009
                                </div>
                            </div>
                        </div>

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
    <script src="assets/js/jquery-3.7.1.min.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>

    <!-- Bootstrap Core JS -->
    <script src="assets/js/bootstrap.bundle.min.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>

    <!-- Simplebar JS -->
    <script src="assets/plugins/simplebar/simplebar.min.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>

    <!-- Select2 JS -->
    <script src="assets/plugins/select2/js/select2.min.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>

    <!-- Daterangepikcer JS -->
    <script src="assets/js/moment.min.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>
    <script src="assets/plugins/daterangepicker/daterangepicker.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>

    <!-- Datatable JS -->
    <script src="assets/js/jquery.dataTables.min.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>
    <script src="assets/js/dataTables.bootstrap5.min.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>

    <!-- Main JS -->
    <script src="assets/js/script.js" type="51c1ce42e2b649c613e32d0a-text/javascript"></script>

    <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="51c1ce42e2b649c613e32d0a-|49" defer></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960feda0ad3951de","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script>

</body>

</html>