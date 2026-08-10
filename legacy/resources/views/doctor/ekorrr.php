<!DOCTYPE html>
<html lang="en">

<head>

    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Prescription</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

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


    <!-- CSS for Dropdown Styling -->
    <style>
        #patientComplaintList {
            margin: 0;
            padding: 0.5rem;
        }

        #patientComplaintList li {
            padding: 0.5rem;
            cursor: pointer;
        }

        #patientComplaintList li:hover {
            background-color: #f8f9fa;
        }


        /* image preview css  */
        .or-divider .border-top {
            border-top: 2px dashed #00bef2;
        }

        .upload-section .btn-outline-primary {
            border-color: #00bef2;
            color: #172c75;
        }

        .upload-section .btn-outline-primary:hover {
            background-color: #00bef2;
            color: #fff;
        }

        #imagePreview img {
            border-radius: 0.5rem;
        }

        /*  */
    </style>

    <style>
        /* Ensure responsiveness for tables */
        .selected-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .selected-items-table th,
        .selected-items-table .table-cell {
            border: 1px solid #dee2e6;
            padding: 8px;
            text-align: left;
        }

        .selected-items-table th {
            background-color: #f8f9fa;
        }

        /* Wrapper for scrolling tbody */
        .table-scroll-wrapper {
            max-height: 160px;
            /* Approx 40px per row * 4 rows */
            overflow-y: auto;
            display: block;
        }

        #medicineTable,
        #testTable {
            width: 100%;
        }

        #medicineTable thead,
        #testTable thead {
            display: table;
            width: 100%;
            table-layout: fixed;
        }

        #medicineTable tbody,
        #testTable tbody {
            display: block;
            width: 100%;
        }

        #medicineTable tr,
        #testTable tr {
            display: table;
            width: 100%;
            table-layout: fixed;
        }

        @media (max-width: 576px) {

            .selected-items-table th,
            .selected-items-table .table-cell {
                font-size: 14px;
                padding: 6px;
            }

            .input-group {
                flex-wrap: wrap;
            }

            .input-group .form-control,
            .input-group .btn {
                width: 100%;
            }

            .input-group .btn {
                margin-top: 5px;
            }

            .table-scroll-wrapper {
                max-height: 120px;
                /* Adjust for smaller screens */
            }
        }

        /* Ensure checklist styling is consistent and user-friendly */
        #medicineList,
        #testList {
            max-height: 200px;
            overflow-y: auto;
            background-color: #fff;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 5px;
            z-index: 1000;
            /* Ensure dropdowns are above other elements */
        }

        #medicineList li,
        #testList li {
            padding: 5px 0;
        }

        table tbody tr td {
            padding: 3px 17px 8px 15px !important;
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
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <a href="" class="btn btn-primary d-inline-flex align-items-center">Assesment</a>
                        <a href="" class="btn btn-outline-white bg-white d-inline-flex align-items-center"><i class="ti ti-calendar-time me-1"></i>print</a>
                        <a href="billing.php" class="btn btn-primary d-inline-flex align-items-center">Billing</a>
                    </div>
                </div>
                <!-- End Page Header -->

                <!-- card start -->
                <div class="card">
                    <div class="row align-items-end p-3">
                        <div class="col-xl-9 col-lg-8">
                            <div class="d-sm-flex align-items-center position-relative z-0 overflow-hidden">
                                <img src="assets/img/icons/shape-01.svg" alt="img" class="z-n1 position-absolute end-0 top-0 d-none d-lg-flex">
                                <a href="javascript:void(0);" class="avatar avatar-xxxl patient-avatar me-2 flex-shrink-0">
                                    <img src="assets/img/users/user-08.jpg" alt="product" class="rounded">
                                </a>
                                <div>
                                    <p class="text-primary">#PT0025</p>
                                    <h5 class=""><a href="javascript:void(0);" class="fw-bold">Alberto Ripley</a></h5>
                                    <div class="d-flex align-items-center flex-wrap mb-1">
                                        <p class="mb-0 d-inline-flex align-items-center"><i class="ti ti-gender-bigender me-1 text-dark"></i><b>Gender :</b> <span class="text-dark ms-1">Male</span></p>
                                        <span class="mx-2 text-light">|</span>
                                        <p class="mb-0 d-inline-flex align-items-center"><i class="ti ti-calendar me-1 text-dark"></i><b>Age :</b> <span class="text-dark ms-1">28</span></p>
                                    </div>
                                    <div class="d-flex align-items-center flex-wrap mb-1">
                                        <p class="mb-0 d-inline-flex align-items-center"><i class="ti ti-phone me-1 text-dark"></i><b>Phone :</b> <span class="text-dark ms-1">+1 54546 45648</span></p>
                                        <span class="mx-2 text-light">|</span>
                                        <p class="mb-0 d-inline-flex align-items-center"><i class="ti ti-calendar-time me-1 text-dark"></i><b>Last Visited :</b> <span class="text-dark ms-1">30 Apr 2025</span></p>
                                    </div>
                                    <div>
                                        <p class="mb-0 d-inline-flex align-items-center"><i class="ti ti-tag me-1 text-dark"></i><b>Token No. :</b> <span class="text-dark ms-1">1478523690</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-lg-4">
                            <div class="text-lg-end mb-2">
                                <span class="fw-semibold text-muted small">Registration No:</span>
                                <span class="text-dark fw-bold small bg-light rounded px-2 py-1 text-break">
                                    789654123032879
                                </span>
                            </div>
                            <div class=" text-lg-end">
                                <div class="mb-4">
                                    <a href="javascript:void(0);" class="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14 me-2"><i class="ti ti-phone"></i></a>
                                    <a href="javascript:void(0);" class="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14 me-2"><i class="ti ti-message-circle"></i></a>
                                    <a href="javascript:void(0);" class="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14"><i class="ti ti-video"></i></a>
                                </div>
                                <a href="" class="btn btn-primary"><i class="ti ti-calendar-event me-1"></i>3 Visit</a>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- card end -->

                <!-- <div class="card rounded-3 shadow-sm border-0">
                    <div class="card-header bg-white border-bottom py-3 px-3 px-md-4">
                        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">

                            <h5 class="mb-0 text-primary fw-semibold d-flex align-items-center">
                                <i class="ti ti-user fs-3 me-2 text-primary"></i>
                                <span style="color: #172c75;">Patient Details</span>
                            </h5>


                            <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-1 gap-sm-2">
                                <span class="fw-semibold text-muted small">Registration No:</span>
                                <span class="text-dark fw-bold small bg-light rounded px-2 py-1 text-break">
                                    789654123032879
                                </span>
                            </div>
                        </div>
                    </div>



                    <div class="card-body px-4 py-3" style="background-color: #f9fcfe;">
                        <div class="row gy-4">
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-user text-info me-2 fs-3"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Name:</span> Ashish
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-gender-bigender text-info me-2 fs-3"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Gender:</span> Male
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-calendar text-info me-2 fs-3"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Age:</span> 28
                                </div>
                            </div>
                            <div class="col-lg-6 ">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-tag text-info me-2 fs-3"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Token:</span> 1478523690
                                </div>
                            </div>
                        </div>
                    </div>
                </div> -->

                <div class="card-header border-bottom py-3  mb-3">
                    <div class="">
                        <!-- Title -->
                        <h5 class="mb-0 text-primary fw-semibold d-flex align-items-center">
                            <i class="ti ti-user fs-3 me-2 text-primary"></i>
                            <span style="color: #172c75;">Upload Prescription Document</span>
                        </h5>
                        <div class="accordion accordion-flush" id="accordionFlushExample">

                            <!-- Accordion: Upload Image or PDF -->
                            <div class="accordion-item mt-3">
                                <h2 class="accordion-header d-flex justify-content-center">
                                    <button class="accordion-button collapsed shadow btn btn-lg btn-outline-light py-3 px-4 fw-semibold border rounded-2 w-auto d-flex justify-content-between align-items-center gap-2 w-100"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#flush-collapseTwo"
                                        aria-expanded="false"
                                        aria-controls="flush-collapseTwo"
                                        style="min-width: 280px;">
                                        <span>Choose Image or PDF</span>
                                        <i class="ti ti-chevron-down"></i>
                                    </button>
                                </h2>
                                <div id="flush-collapseTwo" class="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                                    <div class="accordion-body">
                                        <div class="upload-section mt-3 text-center">

                                            <!-- Image Preview -->
                                            <div id="imagePreview" class="mb-3 d-none">
                                                <img id="previewImg" class="img-thumbnail" style="max-width: 200px;" />
                                            </div>

                                            <!-- PDF Preview -->
                                            <div id="pdfPreview" class="mb-3 d-none">
                                                <div class="d-flex justify-content-center align-items-center gap-2">
                                                    <i class="ti ti-file-text fs-3 text-danger"></i>
                                                    <a id="pdfLink" href="#" target="_blank" class="fw-semibold text-decoration-none">View PDF</a>
                                                </div>
                                            </div>

                                            <!-- Upload Button -->
                                            <div class="d-flex align-items-center justify-content-center">
                                                <div>
                                                    <label for="fileInput" class="btn btn-lg btn-outline-primary px-4 py-2">
                                                        <i class="ti ti-upload me-1"></i> Choose Image or PDF
                                                    </label>
                                                    <input type="file" id="fileInput" class="d-none" accept="image/*,.pdf">
                                                </div>
                                                <div class="ms-3">
                                                    <button type="submit" class="btn btn-secondary">Submit</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <!-- OR Divider -->
                            <div class="or-divider d-flex align-items-center my-3">
                                <div class="flex-grow-1 border-top border-dashed" style="border-top: 2px dashed #00bef2;"></div>
                                <div class="mx-3 text-muted fw-semibold">OR</div>
                                <div class="flex-grow-1 border-top border-dashed" style="border-top: 2px dashed #00bef2;"></div>
                            </div>


                            <div class="accordion accordion-flush" id="accordionFlushExample">
                                <div class="accordion-item mt-3">
                                    <h2 class="accordion-header d-flex justify-content-center">
                                        <button class="accordion-button collapsed shadow btn btn-lg btn-outline-light py-3 px-4 fw-semibold border rounded-2 w-auto d-flex justify-content-between align-items-center gap-2 w-100"
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target="#flush-collapseOne"
                                            aria-expanded="false"
                                            aria-controls="flush-collapseOne"
                                            style="min-width: 280px;">
                                            <span>Choose Custom Prescription</span>
                                            <i class="ti ti-chevron-down"></i>
                                        </button>
                                    </h2>

                                    <div id="flush-collapseOne" class="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                                        <div class="accordion-body">
                                            <!-- row start -->
                                            <div class="row">
                                                <!-- col start -->
                                                <div class="col-xl-6 d-flex">
                                                    <div class="card shadow-sm flex-fill w-100" style="border-top: 4px solid #00bef2;">
                                                        <div class="card-body">
                                                            <h3 class="fw-bold mb-2">Diagnosis</h3>

                                                            <!-- Patient Complaints -->
                                                            <div class="mb-2">

                                                                <div class="row my-3">
                                                                    <div class="col-lg-5">
                                                                        <h5 class="fw-bold">Patient Complaints</h5>
                                                                    </div>
                                                                    <div class="col-lg-7">
                                                                        <div class="input-group">
                                                                            <input type="text" class="form-control py-1" id="newComplaint" placeholder="Add new complaint">
                                                                            <button class="btn btn-primary" type="button" onclick="addComplaint()">Add</button>
                                                                        </div>
                                                                    </div>
                                                                </div>


                                                                <!-- <label class="fw-bold text-dark mb-1" for="">Patient Complaints</label>
                                                                <div class="d-flex align-items-center justify-content-between mb-2">
                                                                    <div class="w-100 me-2">
                                                                        <div class="input-group mb-1">
                                                                            <input type="text" class="form-control py-1" id="newComplaint" placeholder="Add new complaint">
                                                                            <button class="btn btn-primary" type="button" onclick="addComplaint()">Add</button>
                                                                        </div>
                                                                    </div>
                                                                </div> -->
                                                                <div class="input-group mb-2">
                                                                    <div class="input-group-text"><i class="ti ti-search"></i></div>
                                                                    <input type="text" class="form-control" id="complaintSearch" placeholder="Search patient complaints">
                                                                </div>
                                                                <ul class="mb-3 list-style-none" id="patientComplaintList" style="display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); width: calc(100% - 2rem); max-height: 200px; overflow-y: auto;">
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" data-complaint="Fever" onchange="updateComplaintTable()"> Fever
                                                                        </label>
                                                                    </li>
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" data-complaint="Headache" onchange="updateComplaintTable()"> Headache
                                                                        </label>
                                                                    </li>
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" data-complaint="Cough" onchange="updateComplaintTable()"> Cough
                                                                        </label>
                                                                    </li>
                                                                </ul>
                                                                <div class="table-scroll-wrapper">
                                                                    <table class="selected-items-table" id="complaintTable" style="display: none;">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Selected Complaints</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody id="complaintTableBody"></tbody>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            <!-- Select Treatment -->
                                                            <div class="mb-2">

                                                                <div class="row my-3">
                                                                    <div class="col-lg-5">
                                                                        <h5 class="fw-bold">Select Treatment</h5>
                                                                    </div>
                                                                    <div class="col-lg-7">
                                                                        <div class="input-group">
                                                                            <input type="text" class="form-control py-1" id="newTreatment" placeholder="Add new treatment">
                                                                            <button class="btn btn-primary" type="button" onclick="addTreatment()">Add</button>
                                                                        </div>
                                                                    </div>
                                                                </div>


                                                                <!-- <label class="fw-bold text-dark mb-1" for="">Select Treatment</label>
                                                                <div class="d-flex align-items-center justify-content-between mb-2">
                                                                    <div class="w-100 me-2">
                                                                        <div class="input-group mb-2">
                                                                            <input type="text" class="form-control py-1" id="newTreatment" placeholder="Add new treatment">
                                                                            <button class="btn btn-primary" type="button" onclick="addTreatment()">Add</button>
                                                                        </div>
                                                                    </div>
                                                                </div> -->
                                                                <div class="input-group mb-2">
                                                                    <div class="input-group-text"><i class="ti ti-search"></i></div>
                                                                    <input type="text" class="form-control" id="treatmentSearch" placeholder="Search treatments">
                                                                </div>
                                                                <ul class="mb-3 list-style-none p-3" id="treatmentList" style="display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); width: calc(100% - 2rem); max-height: 200px; overflow-y: auto;">
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center mb-2">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Ultrasound" onchange="updateTreatmentTable()"> Ultrasound Therapy
                                                                        </label>
                                                                    </li>
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center mb-2">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Estim" onchange="updateTreatmentTable()"> E-STIM
                                                                        </label>
                                                                    </li>
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center mb-2">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Tens" onchange="updateTreatmentTable()"> TENS
                                                                        </label>
                                                                    </li>
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center mb-2">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Ift" onchange="updateTreatmentTable()"> IFT
                                                                        </label>
                                                                    </li>
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center mb-2">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="Laser" onchange="updateTreatmentTable()"> Laser therapy
                                                                        </label>
                                                                    </li>
                                                                </ul>
                                                                <div class="table-scroll-wrapper">
                                                                    <table class="selected-items-table" id="treatmentTable" style="display: none;">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Selected Treatments</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody id="treatmentTableBody"></tbody>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            <!-- Description -->
                                                            <div class="mb-3">
                                                                <label>Description:</label>
                                                                <textarea name="content" id="content" class="form-control"></textarea>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- col end -->

                                                <!-- Medicines -->
                                                <div class="col-xl-6 d-flex">
                                                    <div class="card shadow-sm flex-fill w-100" style="border-top: 4px solid #00bef2;">
                                                        <div class="card-body">
                                                            <h3 class="fw-bold mb-2">Medication</h3>
                                                            <div class="row my-3">
                                                                <div class="col-4">
                                                                    <h5 class="fw-bold ">Medicines</h5>
                                                                </div>
                                                                <div class="col-6">
                                                                    <div class="input-group ">
                                                                        <input type="text" class="form-control py-1" id="newMedicine" placeholder="Add new medicine">
                                                                        <button class="btn btn-primary" type="button" onclick="addMedicine()">Add</button>
                                                                    </div>
                                                                </div>
                                                                <!-- Medicine Button trigger modal -->
                                                                <div class="col-2">
                                                                    <button type="button" class="btn btn-primary py-1" data-bs-toggle="modal" data-bs-target="#medication">
                                                                        Medication
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div class="mb-3">
                                                                <div class="input-group mb-2">
                                                                    <div class="input-group-text"><i class="ti ti-search"></i></div>
                                                                    <input type="text" class="form-control" id="medicineSearch" placeholder="Search medicines">
                                                                </div>
                                                                <ul class="mb-3 list-style-none" id="medicineList" style="display: none;">
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateMedicineTable()"> Paracetamol
                                                                        </label>
                                                                    </li>
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateMedicineTable()"> Ibuprofen
                                                                        </label>
                                                                    </li>
                                                                    <li>
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateMedicineTable()"> Amoxicillin
                                                                        </label>
                                                                    </li>
                                                                </ul>

                                                                <div class="table-scroll-wrapper">
                                                                    <table class="selected-items-table" id="medicineTable" style="display: none;">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Selected Medicines</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody id="medicineTableBody"></tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Test -->
                                                <div class="col-xl-6 d-flex">
                                                    <div class="card shadow-sm flex-fill w-100" style="border-top: 4px solid #00bef2;">
                                                        <div class="card-body">
                                                            <h3 class="fw-bold mb-2">Test Assesment</h3>
                                                            <div class="row my-3">
                                                                <div class="col-4">
                                                                    <h5 class="fw-bold mb-2">Test</h5>
                                                                </div>
                                                                <div class="col-8">
                                                                    <div class=" input-group ">
                                                                        <input type="text" class="form-control py-1" id="newTest" placeholder="Add new test">
                                                                        <button class="btn btn-primary" type="button" onclick="addTest()">Add</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="mb-3">
                                                                <div class="input-group mb-2">
                                                                    <div class="input-group-text"><i class="ti ti-search"></i></div>
                                                                    <input type="text" class="form-control" id="testSearch" placeholder="Search tests">
                                                                </div>
                                                                <ul class="mb-3 list-style-none bg-white shadow" id="testList" style="display: none;">
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateTestTable()"> Blood Test
                                                                        </label>
                                                                    </li>
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateTestTable()"> X-Ray
                                                                        </label>
                                                                    </li>
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateTestTable()"> MRI Scan
                                                                        </label>
                                                                    </li>
                                                                </ul>

                                                                <div class="table-scroll-wrapper">
                                                                    <table class="selected-items-table" id="testTable" style="display: none;">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Selected Tests</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody id="testTableBody"></tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Treatment Plan -->
                                                <div class="col-xl-6 d-flex">
                                                    <div class="card shadow-sm flex-fill w-100" style="border-top: 4px solid #00bef2;">
                                                        <div class="card-body">
                                                            <h3 class="fw-bold mb-2">Treatment Plan</h3>

                                                            <!-- Disease Management -->
                                                            <div class="mb-3">
                                                                <div class="row my-3">
                                                                    <div class="col-lg-5">
                                                                        <h5 class="fw-bold mb-2">Disease</h5>
                                                                    </div>
                                                                    <div class="col-lg-7">
                                                                        <div class="input-group">
                                                                            <input type="text" class="form-control py-1" id="newDisease" placeholder="Add new disease">
                                                                            <button class="btn btn-primary" type="button" onclick="addDisease()">Add</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="input-group mb-2">
                                                                    <div class="input-group-text"><i class="ti ti-search"></i></div>
                                                                    <input type="text" class="form-control" id="diseaseSearch" placeholder="Search diseases">
                                                                </div>
                                                                <ul class="mb-3 list-style-none bg-white shadow p-3" id="diseaseList" style="display: none;">
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateDiseaseTable()"> Diabetes
                                                                        </label>
                                                                    </li>
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateDiseaseTable()"> Hypertension
                                                                        </label>
                                                                    </li>
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateDiseaseTable()"> Asthma
                                                                        </label>
                                                                    </li>
                                                                </ul>
                                                                <div class="table-scroll-wrapper">
                                                                    <table class="selected-items-table" id="diseaseTable" style="display: none;">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Selected Diseases</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody id="diseaseTableBody"></tbody>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            <!-- Treatment Cycle -->
                                                            <div class="mb-3">
                                                                <div class="row my-3">
                                                                    <div class="col-lg-5">
                                                                        <h5 class="fw-bold mb-2">Treatment Cycle</h5>
                                                                    </div>
                                                                    <div class="col-lg-7">
                                                                        <div class="input-group">
                                                                            <input type="text" class="form-control py-1" id="newTreatmentCycle" placeholder="Add new treatment cycle">
                                                                            <button class="btn btn-primary" type="button" onclick="addTreatmentCycle()">Add</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="input-group mb-2">
                                                                    <div class="input-group-text"><i class="ti ti-search"></i></div>
                                                                    <input type="text" class="form-control" id="treatmentCycleSearch" placeholder="Search treatment cycles">
                                                                </div>
                                                                <ul class="mb-3 list-style-none bg-white shadow p-3" id="treatmentCycleList" style="display: none;">
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateTreatmentCycleTable()"> Weekly Checkup
                                                                        </label>
                                                                    </li>
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateTreatmentCycleTable()"> Monthly Therapy
                                                                        </label>
                                                                    </li>
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateTreatmentCycleTable()"> Daily Medication
                                                                        </label>
                                                                    </li>
                                                                </ul>
                                                                <div class="table-scroll-wrapper">
                                                                    <table class="selected-items-table" id="treatmentCycleTable" style="display: none;">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Selected Treatment Cycles</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody id="treatmentCycleTableBody"></tbody>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            <!-- Occur Condition -->
                                                            <div class="mb-3">
                                                                <div class="row my-3">
                                                                    <div class="col-lg-5">
                                                                        <h5 class="fw-bold mb-2">Occur Condition</h5>
                                                                    </div>
                                                                    <div class="col-lg-7">
                                                                        <div class="input-group">
                                                                            <input type="text" class="form-control py-1" id="newOccurCondition" placeholder="Add new occur condition">
                                                                            <button class="btn btn-primary" type="button" onclick="addOccurCondition()">Add</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="input-group mb-2">
                                                                    <div class="input-group-text"><i class="ti ti-search"></i></div>
                                                                    <input type="text" class="form-control" id="occurConditionSearch" placeholder="Search occur conditions">
                                                                </div>
                                                                <ul class="mb-3 list-style-none bg-white shadow p-3" id="occurConditionList" style="display: none;">
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateOccurConditionTable()"> Fever
                                                                        </label>
                                                                    </li>
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateOccurConditionTable()"> Cough
                                                                        </label>
                                                                    </li>
                                                                    <li class="mb-1">
                                                                        <label class="px-2 d-flex align-items-center">
                                                                            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateOccurConditionTable()"> Fatigue
                                                                        </label>
                                                                    </li>
                                                                </ul>
                                                                <div class="table-scroll-wrapper">
                                                                    <table class="selected-items-table" id="occurConditionTable" style="display: none;">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Selected Occur Conditions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody id="occurConditionTableBody"></tbody>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            <!-- Treatment Details -->
                                                            <div class="mb-3">
                                                                <label>Treatment Details:</label>
                                                                <textarea name="treatmentDetails" id="treatmentDetails" class="form-control "></textarea>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>



                                            </div>
                                            <!-- row end -->
                                        </div>
                                    </div>
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



<!-- build:js assets/vendor/js/core.js -->
<script src="tiny/vendor/tinymce/tinymce.min.js"></script>

<script>
    const useDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isSmallScreen = window.matchMedia('(max-width: 1023.5px)').matches;
    tinymce.init({
        selector: 'textarea.tinymce-editor',
        plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
        editimage_cors_hosts: ['picsum.photos'],
        menubar: 'file edit view insert format tools table help',
        toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
        toolbar_sticky: true,
        forced_root_block: "",
        force_br_newlines: true,
        force_p_newlines: false,
        convert_newlines_to_brs: true,
        toolbar_sticky_offset: isSmallScreen ? 102 : 108,
        autosave_ask_before_unload: true,
        autosave_interval: '30s',
        autosave_prefix: '{path}{query}-{id}-',
        autosave_restore_when_empty: false,
        autosave_retention: '2m',
        image_advtab: true,
        link_list: [{
                title: 'My page 1',
                value: 'https://www.tiny.cloud'
            },
            {
                title: 'My page 2',
                value: 'http://www.moxiecode.com'
            }
        ],
        image_list: [{
                title: 'My page 1',
                value: 'https://www.tiny.cloud'
            },
            {
                title: 'My page 2',
                value: 'http://www.moxiecode.com'
            }
        ],
        image_class_list: [{
                title: 'None',
                value: ''
            },
            {
                title: 'Some class',
                value: 'class-name'
            }
        ],
        importcss_append: true,
        file_picker_callback: (callback, value, meta) => {
            if (meta.filetype === 'file') {
                callback('https://www.google.com/logos/google.jpg', {
                    text: 'My text'
                });
            }

            if (meta.filetype === 'image') {
                callback('https://www.google.com/logos/google.jpg', {
                    alt: 'My alt text'
                });
            }

            if (meta.filetype === 'media') {
                callback('movie.mp4', {
                    source2: 'alt.ogg',
                    poster: 'https://www.google.com/logos/google.jpg'
                });
            }
        },
        templates: [{
                title: 'New Table',
                content: 'creates a new table',
                content: '<div class="mceTmpl"><table width="98%%"  border="0" cellspacing="0" cellpadding="0"><tr><th scope="col"> </th><th scope="col"> </th></tr><tr><td> </td><td> </td></tr></table></div>'
            },
            {
                title: 'Starting my story',
                content: 'A cure for writers block',
                content: 'Once upon a time...'
            },
            {
                title: 'New list with dates',
                content: 'New List with dates',
                content: '<div class="mceTmpl"><span class="cdate">cdate</span><br><span class="mdate">mdate</span><h2>My List</h2><ul><li></li><li></li></ul></div>'
            }
        ],
        template_cdate_format: '[Date Created (CDATE): %m/%d/%Y : %H:%M:%S]',
        template_mdate_format: '[Date Modified (MDATE): %m/%d/%Y : %H:%M:%S]',
        image_caption: true,
        quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
        noneditable_class: 'mceNonEditable',
        toolbar_mode: 'sliding',
        contextmenu: 'link image table',
        skin: useDarkMode ? 'oxide-dark' : 'oxide',
        content_css: useDarkMode ? 'dark' : 'default',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }'
    });
</script>

<script>
    $(document).ready(function() {
        // Remove any existing editors before showing modal
        $('#addbox').on('show.bs.modal', function() {
            tinymce.remove();
        });

        // Initialize TinyMCE after modal is fully shown
        $('#addbox').on('shown.bs.modal', function() {
            initTinyMCE();
        });

        // Clean up when modal is hidden
        $('#addbox').on('hidden.bs.modal', function() {
            tinymce.remove();
        });
    });

    function initTinyMCE() {
        const useDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isSmallScreen = window.matchMedia('(max-width: 1023.5px)').matches;

        tinymce.init({
            selector: 'textarea.tinymce-editor',
            plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount',
                'emoticons quickbars'
            ],
            toolbar: 'undo redo | formatselect | bold italic backcolor | ' +
                'alignleft aligncenter alignright alignjustify | ' +
                'bullist numlist outdent indent | removeformat | help | ' +
                'image media table emoticons',
            toolbar_sticky: true,
            height: 500,
            menubar: true,
            branding: false,
            skin: useDarkMode ? 'oxide-dark' : 'oxide',
            content_css: useDarkMode ? 'dark' : 'default',
            // Ensure proper z-index for dropdowns
            setup: function(editor) {
                editor.on('init', function() {
                    document.querySelectorAll('.tox-tinymce-aux').forEach(function(el) {
                        el.style.zIndex = '999999';
                    });
                });
            },
            // Other configuration options from your original setup
            image_advtab: true,
            link_list: [{
                title: 'My page 2',
                value: 'http://www.moxiecode.com'
            }],
            image_list: [{
                title: 'My page 2',
                value: 'http://www.moxiecode.com'
            }],
            file_picker_callback: function(callback, value, meta) {
                // Your file picker implementation
            },
            templates: [
                // Your templates
            ]
        });
    }
</script>


<!-- image preview js  -->
<script>
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        const imagePreview = document.getElementById('imagePreview');
        const pdfPreview = document.getElementById('pdfPreview');
        const previewImg = document.getElementById('previewImg');
        const pdfLink = document.getElementById('pdfLink');

        // Reset previews
        imagePreview.classList.add('d-none');
        pdfPreview.classList.add('d-none');

        if (!file) return;

        const fileType = file.type;

        // If it's an image
        if (fileType.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                imagePreview.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        }
        // If it's a PDF
        else if (fileType === 'application/pdf') {
            const fileURL = URL.createObjectURL(file);
            pdfLink.href = fileURL;
            pdfLink.textContent = file.name;
            pdfPreview.classList.remove('d-none');
        }
    });
</script>


<!-- Diagnosis search js  -->
<script>
    // Patient Complaints
    function addComplaint() {
        const complaintInput = document.getElementById('newComplaint');
        const complaintName = complaintInput.value.trim();
        if (complaintName) {
            const li = document.createElement('li');
            li.innerHTML = `<label class="px-2 d-flex align-items-center">
            <input class="form-check-input m-0 me-2" type="checkbox" data-complaint="${complaintName}" onchange="updateComplaintTable()"> ${complaintName}
        </label>`;
            document.getElementById('patientComplaintList').appendChild(li);
            complaintInput.value = '';
            document.getElementById('patientComplaintList').style.display = 'none';
            updateComplaintTable();
        }
    }

    document.getElementById('complaintSearch').addEventListener('focus', function() {
        document.getElementById('patientComplaintList').style.display = 'block';
        filterComplaints();
    });

    document.getElementById('complaintSearch').addEventListener('input', function() {
        filterComplaints();
    });

    function filterComplaints() {
        const searchTerm = document.getElementById('complaintSearch').value.toLowerCase();
        const complaintItems = document.getElementById('patientComplaintList').getElementsByTagName('li');
        Array.from(complaintItems).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    function updateComplaintTable() {
        const selectedComplaints = Array.from(document.querySelectorAll('#patientComplaintList input[type="checkbox"]:checked'))
            .map(input => input.parentElement.textContent.trim());
        const table = document.getElementById('complaintTable');
        const tableBody = document.getElementById('complaintTableBody');
        tableBody.innerHTML = '';
        if (selectedComplaints.length > 0) {
            selectedComplaints.forEach(complaint => {
                const row = document.createElement('tr');
                row.innerHTML = `<td class="table-cell">${complaint}</td>`;
                tableBody.appendChild(row);
            });
            table.style.display = 'table';
        } else {
            table.style.display = 'none';
        }
    }

    // Select Treatment
    function addTreatment() {
        const treatmentInput = document.getElementById('newTreatment');
        const treatmentName = treatmentInput.value.trim();
        if (treatmentName) {
            const li = document.createElement('li');
            li.innerHTML = `<label class="px-2 d-flex align-items-center mb-2">
            <input class="form-check-input m-0 me-2" type="checkbox" data-treatment="${treatmentName}" onchange="updateTreatmentTable()"> ${treatmentName}
        </label>`;
            document.getElementById('treatmentList').appendChild(li);
            treatmentInput.value = '';
            document.getElementById('treatmentList').style.display = 'none';
            updateTreatmentTable();
        }
    }

    document.getElementById('treatmentSearch').addEventListener('focus', function() {
        document.getElementById('treatmentList').style.display = 'block';
        filterTreatments();
    });

    document.getElementById('treatmentSearch').addEventListener('input', function() {
        filterTreatments();
    });

    function filterTreatments() {
        const searchTerm = document.getElementById('treatmentSearch').value.toLowerCase();
        const treatmentItems = document.getElementById('treatmentList').getElementsByTagName('li');
        Array.from(treatmentItems).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    function updateTreatmentTable() {
        const selectedTreatments = Array.from(document.querySelectorAll('#treatmentList input[type="checkbox"]:checked'))
            .map(input => input.parentElement.textContent.trim());
        const table = document.getElementById('treatmentTable');
        const tableBody = document.getElementById('treatmentTableBody');
        tableBody.innerHTML = '';
        if (selectedTreatments.length > 0) {
            selectedTreatments.forEach(treatment => {
                const row = document.createElement('tr');
                row.innerHTML = `<td class="table-cell">${treatment}</td>`;
                tableBody.appendChild(row);
            });
            table.style.display = 'table';
        } else {
            table.style.display = 'none';
        }
    }

    // Update the click outside event listener to include complaint and treatment dropdowns
    document.addEventListener('click', function(event) {
        const medicineList = document.getElementById('medicineList');
        const medicineSearch = document.getElementById('medicineSearch');
        const testList = document.getElementById('testList');
        const testSearch = document.getElementById('testSearch');
        const diseaseList = document.getElementById('diseaseList');
        const diseaseSearch = document.getElementById('diseaseSearch');
        const treatmentCycleList = document.getElementById('treatmentCycleList');
        const treatmentCycleSearch = document.getElementById('treatmentCycleSearch');
        const occurConditionList = document.getElementById('occurConditionList');
        const occurConditionSearch = document.getElementById('occurConditionSearch');
        const complaintList = document.getElementById('patientComplaintList');
        const complaintSearch = document.getElementById('complaintSearch');
        const treatmentList = document.getElementById('treatmentList');
        const treatmentSearch = document.getElementById('treatmentSearch');

        if (!medicineSearch.contains(event.target) && !medicineList.contains(event.target)) {
            medicineList.style.display = 'none';
        }
        if (!testSearch.contains(event.target) && !testList.contains(event.target)) {
            testList.style.display = 'none';
        }
        if (!diseaseSearch.contains(event.target) && !diseaseList.contains(event.target)) {
            diseaseList.style.display = 'none';
        }
        if (!treatmentCycleSearch.contains(event.target) && !treatmentCycleList.contains(event.target)) {
            treatmentCycleList.style.display = 'none';
        }
        if (!occurConditionSearch.contains(event.target) && !occurConditionList.contains(event.target)) {
            occurConditionList.style.display = 'none';
        }
        if (!complaintSearch.contains(event.target) && !complaintList.contains(event.target)) {
            complaintList.style.display = 'none';
        }
        if (!treatmentSearch.contains(event.target) && !treatmentList.contains(event.target)) {
            treatmentList.style.display = 'none';
        }
    });
</script>

<!-- Medication Search js  -->
<script>
    // Medicine Search and Add
    function addMedicine() {
        const medicineInput = document.getElementById('newMedicine');
        const medicineName = medicineInput.value.trim();
        if (medicineName) {
            const li = document.createElement('li');
            li.innerHTML = `<label class="px-2 d-flex align-items-center">
                <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateMedicineTable()"> ${medicineName}
            </label>`;
            document.getElementById('medicineList').appendChild(li);
            medicineInput.value = '';
            document.getElementById('medicineList').style.display = 'none';
            updateMedicineTable();
        }
    }

    document.getElementById('medicineSearch').addEventListener('focus', function() {
        document.getElementById('medicineList').style.display = 'block';
        filterMedicines();
    });

    document.getElementById('medicineSearch').addEventListener('input', function() {
        filterMedicines();
    });

    function filterMedicines() {
        const searchTerm = document.getElementById('medicineSearch').value.toLowerCase();
        const medicineItems = document.getElementById('medicineList').getElementsByTagName('li');
        Array.from(medicineItems).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    function updateMedicineTable() {
        const selectedMedicines = Array.from(document.querySelectorAll('#medicineList input[type="checkbox"]:checked'))
            .map(input => input.parentElement.textContent.trim());
        const table = document.getElementById('medicineTable');
        const tableBody = document.getElementById('medicineTableBody');
        tableBody.innerHTML = '';
        if (selectedMedicines.length > 0) {
            selectedMedicines.forEach(medicine => {
                const row = document.createElement('tr');
                row.innerHTML = `<td class="table-cell">${medicine}</td>`;
                tableBody.appendChild(row);
            });
            table.style.display = 'table';
        } else {
            table.style.display = 'none';
        }
    }

    // Test Search and Add
    function addTest() {
        const testInput = document.getElementById('newTest');
        const testName = testInput.value.trim();
        if (testName) {
            const li = document.createElement('li');
            li.innerHTML = `<label class="px-2 d-flex align-items-center">
                <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateTestTable()"> ${testName}
            </label>`;
            document.getElementById('testList').appendChild(li);
            testInput.value = '';
            document.getElementById('testList').style.display = 'none';
            updateTestTable();
        }
    }

    document.getElementById('testSearch').addEventListener('focus', function() {
        document.getElementById('testList').style.display = 'block';
        filterTests();
    });

    document.getElementById('testSearch').addEventListener('input', function() {
        filterTests();
    });

    function filterTests() {
        const searchTerm = document.getElementById('testSearch').value.toLowerCase();
        const testItems = document.getElementById('testList').getElementsByTagName('li');
        Array.from(testItems).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    function updateTestTable() {
        const selectedTests = Array.from(document.querySelectorAll('#testList input[type="checkbox"]:checked'))
            .map(input => input.parentElement.textContent.trim());
        const table = document.getElementById('testTable');
        const tableBody = document.getElementById('testTableBody');
        tableBody.innerHTML = '';
        if (selectedTests.length > 0) {
            selectedTests.forEach(test => {
                const row = document.createElement('tr');
                row.innerHTML = `<td class="table-cell">${test}</td>`;
                tableBody.appendChild(row);
            });
            table.style.display = 'table';
        } else {
            table.style.display = 'none';
        }
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const medicineList = document.getElementById('medicineList');
        const medicineSearch = document.getElementById('medicineSearch');
        const testList = document.getElementById('testList');
        const testSearch = document.getElementById('testSearch');

        if (!medicineSearch.contains(event.target) && !medicineList.contains(event.target)) {
            medicineList.style.display = 'none';
        }

        if (!testSearch.contains(event.target) && !testList.contains(event.target)) {
            testList.style.display = 'none';
        }
    });
</script>

<!-- treatment plan and search  -->
<script>
    document.ge // Disease Management
    function addDisease() {
        const diseaseInput = document.getElementById('newDisease');
        const diseaseName = diseaseInput.value.trim();
        if (diseaseName) {
            const li = document.createElement('li');
            li.innerHTML = `<label class="px-2 d-flex align-items-center">
            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateDiseaseTable()"> ${diseaseName}
        </label>`;
            document.getElementById('diseaseList').appendChild(li);
            diseaseInput.value = '';
            document.getElementById('diseaseList').style.display = 'none';
            updateDiseaseTable();
        }
    }

    document.getElementById('diseaseSearch').addEventListener('focus', function() {
        document.getElementById('diseaseList').style.display = 'block';
        filterDiseases();
    });

    document.getElementById('diseaseSearch').addEventListener('input', function() {
        filterDiseases();
    });

    function filterDiseases() {
        const searchTerm = document.getElementById('diseaseSearch').value.toLowerCase();
        const diseaseItems = document.getElementById('diseaseList').getElementsByTagName('li');
        Array.from(diseaseItems).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    function updateDiseaseTable() {
        const selectedDiseases = Array.from(document.querySelectorAll('#diseaseList input[type="checkbox"]:checked'))
            .map(input => input.parentElement.textContent.trim());
        const table = document.getElementById('diseaseTable');
        const tableBody = document.getElementById('diseaseTableBody');
        tableBody.innerHTML = '';
        if (selectedDiseases.length > 0) {
            selectedDiseases.forEach(disease => {
                const row = document.createElement('tr');
                row.innerHTML = `<td class="table-cell">${disease}</td>`;
                tableBody.appendChild(row);
            });
            table.style.display = 'table';
        } else {
            table.style.display = 'none';
        }
    }

    // Treatment Cycle
    function addTreatmentCycle() {
        const treatmentCycleInput = document.getElementById('newTreatmentCycle');
        const treatmentCycleName = treatmentCycleInput.value.trim();
        if (treatmentCycleName) {
            const li = document.createElement('li');
            li.innerHTML = `<label class="px-2 d-flex align-items-center">
            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateTreatmentCycleTable()"> ${treatmentCycleName}
        </label>`;
            document.getElementById('treatmentCycleList').appendChild(li);
            treatmentCycleInput.value = '';
            document.getElementById('treatmentCycleList').style.display = 'none';
            updateTreatmentCycleTable();
        }
    }

    document.getElementById('treatmentCycleSearch').addEventListener('focus', function() {
        document.getElementById('treatmentCycleList').style.display = 'block';
        filterTreatmentCycles();
    });

    document.getElementById('treatmentCycleSearch').addEventListener('input', function() {
        filterTreatmentCycles();
    });

    function filterTreatmentCycles() {
        const searchTerm = document.getElementById('treatmentCycleSearch').value.toLowerCase();
        const treatmentCycleItems = document.getElementById('treatmentCycleList').getElementsByTagName('li');
        Array.from(treatmentCycleItems).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    function updateTreatmentCycleTable() {
        const selectedTreatmentCycles = Array.from(document.querySelectorAll('#treatmentCycleList input[type="checkbox"]:checked'))
            .map(input => input.parentElement.textContent.trim());
        const table = document.getElementById('treatmentCycleTable');
        const tableBody = document.getElementById('treatmentCycleTableBody');
        tableBody.innerHTML = '';
        if (selectedTreatmentCycles.length > 0) {
            selectedTreatmentCycles.forEach(treatmentCycle => {
                const row = document.createElement('tr');
                row.innerHTML = `<td class="table-cell">${treatmentCycle}</td>`;
                tableBody.appendChild(row);
            });
            table.style.display = 'table';
        } else {
            table.style.display = 'none';
        }
    }

    // Occur Condition
    function addOccurCondition() {
        const occurConditionInput = document.getElementById('newOccurCondition');
        const occurConditionName = occurConditionInput.value.trim();
        if (occurConditionName) {
            const li = document.createElement('li');
            li.innerHTML = `<label class="px-2 d-flex align-items-center">
            <input class="form-check-input m-0 me-2" type="checkbox" onchange="updateOccurConditionTable()"> ${occurConditionName}
        </label>`;
            document.getElementById('occurConditionList').appendChild(li);
            occurConditionInput.value = '';
            document.getElementById('occurConditionList').style.display = 'none';
            updateOccurConditionTable();
        }
    }

    document.getElementById('occurConditionSearch').addEventListener('focus', function() {
        document.getElementById('occurConditionList').style.display = 'block';
        filterOccurConditions();
    });

    document.getElementById('occurConditionSearch').addEventListener('input', function() {
        filterOccurConditions();
    });

    function filterOccurConditions() {
        const searchTerm = document.getElementById('occurConditionSearch').value.toLowerCase();
        const occurConditionItems = document.getElementById('occurConditionList').getElementsByTagName('li');
        Array.from(occurConditionItems).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    function updateOccurConditionTable() {
        const selectedOccurConditions = Array.from(document.querySelectorAll('#occurConditionList input[type="checkbox"]:checked'))
            .map(input => input.parentElement.textContent.trim());
        const table = document.getElementById('occurConditionTable');
        const tableBody = document.getElementById('occurConditionTableBody');
        tableBody.innerHTML = '';
        if (selectedOccurConditions.length > 0) {
            selectedOccurConditions.forEach(occurCondition => {
                const row = document.createElement('tr');
                row.innerHTML = `<td class="table-cell">${occurCondition}</td>`;
                tableBody.appendChild(row);
            });
            table.style.display = 'table';
        } else {
            table.style.display = 'none';
        }
    }

    // Update the click outside event listener to include new dropdowns
    document.addEventListener('click', function(event) {
        const medicineList = document.getElementById('medicineList');
        const medicineSearch = document.getElementById('medicineSearch');
        const testList = document.getElementById('testList');
        const testSearch = document.getElementById('testSearch');
        const diseaseList = document.getElementById('diseaseList');
        const diseaseSearch = document.getElementById('diseaseSearch');
        const treatmentCycleList = document.getElementById('treatmentCycleList');
        const treatmentCycleSearch = document.getElementById('treatmentCycleSearch');
        const occurConditionList = document.getElementById('occurConditionList');
        const occurConditionSearch = document.getElementById('occurConditionSearch');

        if (!medicineSearch.contains(event.target) && !medicineList.contains(event.target)) {
            medicineList.style.display = 'none';
        }
        if (!testSearch.contains(event.target) && !testList.contains(event.target)) {
            testList.style.display = 'none';
        }
        if (!diseaseSearch.contains(event.target) && !diseaseList.contains(event.target)) {
            diseaseList.style.display = 'none';
        }
        if (!treatmentCycleSearch.contains(event.target) && !treatmentCycleList.contains(event.target)) {
            treatmentCycleList.style.display = 'none';
        }
        if (!occurConditionSearch.contains(event.target) && !occurConditionList.contains(event.target)) {
            occurConditionList.style.display = 'none';
        }
    });
</script>




<!--Medication  Modal -->
<div class="modal fade" id="medication" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header bg-info-subtle px-3">
                <h4 class="modal-title" id="staticBackdropLabel">Modal title</h4>
                <button type="button" class="btn-close bg-white rounded-circle" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Start Medication -->
                <div class="card rounded-0">
                    <div class="card-header">
                        <h5 class="m-0 fw-bold"> Medications </h5>
                    </div> <!-- end card header -->

                    <div class="card-body pb-0">
                        <div class="medication-list">

                            <!-- start row -->
                            <div class="row medication-list-item">
                                <div class="col-lg-11">
                                    <!-- start row-->
                                    <div class="row">
                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Medicine Name</label>
                                                <select class="select form-control rounded">
                                                    <option>Select</option>
                                                    <option>General Medicine</option>
                                                    <option>Axer 90MG Tab</option>
                                                    <option>Ramistar XL 2.5</option>
                                                </select>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Dosage</label>
                                                <div class="input-group">
                                                    <input type="text" class="form-control">
                                                    <span class="input-group-text bg-transparent text-dark fs-14">mg</span>
                                                </div>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Dosage</label>
                                                <div class="input-group">
                                                    <input type="text" class="form-control">
                                                    <span class="input-group-text bg-transparent text-dark fs-14">m</span>
                                                </div>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Frequency</label>
                                                <select class="select form-control rounded">
                                                    <option>Select</option>
                                                    <option>0-0-1</option>
                                                    <option>1-0-0</option>
                                                    <option>0-1-0</option>
                                                </select>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Timing</label>
                                                <select class="select form-control rounded">
                                                    <option>Select</option>
                                                    <option>Before Meal</option>
                                                    <option>After Meal</option>
                                                </select>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Instruction</label>
                                                <div class="input-group">
                                                    <input type="text" class="form-control">
                                                </div>
                                            </div>
                                        </div> <!-- end col -->
                                    </div>
                                    <!-- end row -->
                                </div>
                                <div class="col-lg-1 px-xxl-3">
                                    <label class="form-label mb-1 text-dark fs-14 fw-medium"></label>
                                    <a href="#" class="remove-medication ms-3 p-2 bg-light text-danger rounded d-flex align-items-center justify-content-center"><i class="ti ti-trash fs-16"></i></a>
                                </div>
                            </div>
                            <!-- end row -->

                            <!-- start row -->
                            <div class="row medication-list-item">
                                <div class="col-lg-11">
                                    <!-- start row-->
                                    <div class="row">
                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Medicine Name</label>
                                                <select class="select form-control rounded">
                                                    <option>Select</option>
                                                    <option selected>General Medicine</option>
                                                    <option>Axer 90MG Tab</option>
                                                    <option>Ramistar XL 2.5</option>
                                                </select>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Dosage</label>
                                                <div class="input-group">
                                                    <input type="text" class="form-control">
                                                    <span class="input-group-text bg-transparent text-dark fs-14">mg</span>
                                                </div>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Dosage</label>
                                                <div class="input-group">
                                                    <input type="text" class="form-control">
                                                    <span class="input-group-text bg-transparent text-dark fs-14">m</span>
                                                </div>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Frequency</label>
                                                <select class="select form-control rounded">
                                                    <option>0-0-1</option>
                                                    <option>1-0-0</option>
                                                    <option>0-1-0</option>
                                                </select>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Timing</label>
                                                <select class="select form-control rounded">
                                                    <option>Before Meal</option>
                                                    <option>After Meal</option>
                                                </select>
                                            </div>
                                        </div> <!-- end col -->

                                        <div class="col-lg-2">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Instruction</label>
                                                <div class="input-group">
                                                    <input type="text" class="form-control" value="After Food">
                                                </div>
                                            </div>
                                        </div> <!-- end col -->
                                    </div>
                                    <!-- end row -->
                                </div>
                                <div class="col-lg-1 px-xxl-3">
                                    <label class="form-label mb-1 text-dark fs-14 fw-medium"></label>
                                    <a href="#" class="add-medication ms-3 p-2 mt-1 bg-light text-dark rounded d-flex align-items-center justify-content-center"><i class="ti ti-plus fs-16"></i></a>
                                </div>
                            </div>
                            <!-- end row -->

                        </div>
                    </div> <!-- end card-body -->
                </div> <!-- end card-body -->
                <!-- End Medications -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary">Done</button>
            </div>
        </div>
    </div>
</div>