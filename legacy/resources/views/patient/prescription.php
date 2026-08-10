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
        /* <!-- CSS for Dropdown Styling --> */
        .list-style-none {
            margin: 0;
            padding: 0.5rem;
            display: none;
            position: absolute;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            width: calc(100% - 2rem);
            max-height: 200px;
            overflow-y: auto;

        }

        .list-style-none li {
            padding: 0.5rem;
            cursor: pointer;
        }

        .list-style-none li:hover {
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

        /* medicine modal css  */
        .medicine-modal-content {
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .medicine-modal-header {
            position: sticky;
            top: 0;
            z-index: 1050;
            flex-shrink: 0;
        }

        .medicine-modal-body {
            flex: 1 1 auto;
            overflow-y: auto;
            padding: 1rem;
        }

        .medicine-modal-footer {
            position: sticky;
            bottom: 0;
            z-index: 1050;
            flex-shrink: 0;
            background-color: #fff;
        }

        /* Style for medicine search list */
        .medicine-search-list {
            position: absolute;
            top: 100%;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
            padding: 0;
            margin: 0;
            list-style: none;
        }

        .medicine-search-list li {
            padding: 8px;
            cursor: pointer;
        }

        .medicine-search-list li:hover {
            background-color: #f8f9fa;
        }

        /* Ensure input group is positioned to allow downward list */
        .input-group.position-relative {
            position: relative;
        }
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

        /* selected checkbox table for scrolling tbody */
        .table-scroll-wrapper {
            max-height: 160px;
            overflow-y: auto;
            display: block;
        }


        @media (max-width: 576px) {

            .selected-items-table th,
            .selected-items-table .table-cell {
                font-size: 14px;
                padding: 6px;
            }

            .table-scroll-wrapper {
                max-height: 120px;
            }
        }

        /* table tbody tr td {
            padding: 3px 17px 8px 15px !important;
        } */
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
                <div class="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-2">
                    <div>
                        <h4 class="fw-bold mb-0">Prescription</h4>
                    </div>
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <a href="" class="btn btn-primary d-inline-flex align-items-center">Assesment</a>
                        <!-- <a href="" class="btn btn-outline-white bg-white d-inline-flex align-items-center"><i class="ti ti-calendar-time me-1"></i>print</a> -->
                        <a href="billing.php" class="btn btn-primary d-inline-flex align-items-center">Billing</a>
                    </div>
                </div>
                <!-- End Page Header -->

                <div class="container my-3">
                    <div class="row">
                        <!-- Search Name -->
                        <div class="col-12 col-lg-4 mb-2 position-relative">
                            <label class="form-label fs-14 fw-bold">Name</label>
                            <div class="input-group">
                                <div class="input-group-text"><i class="ti ti-search"></i></div>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="nameInput"
                                    name="nameRadio"
                                    placeholder="Search Name"
                                    oninput="filterNameList()"
                                    onfocus="showNameList()"
                                    onblur="hideNameList()">
                            </div>
                            <div id="nameList" class="shadow bg-white border rounded mt-1 position-absolute z-3 p-2 w-100" style="display: none; max-height: 150px; overflow-y: auto;">
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="nameRadio" id="name1" value="John Doe">
                                    <label class="form-check-label cursor-pointer" for="name1">John Doe</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="nameRadio" id="name2" value="Jane Smith">
                                    <label class="form-check-label cursor-pointer" for="name2">Jane Smith</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="nameRadio" id="name3" value="Alice Johnson">
                                    <label class="form-check-label cursor-pointer" for="name3">Alice Johnson</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="nameRadio" id="name4" value="Bob Wilson">
                                    <label class="form-check-label cursor-pointer" for="name4">Bob Wilson</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="nameRadio" id="name5" value="Emma Brown">
                                    <label class="form-check-label cursor-pointer" for="name5">Emma Brown</label>
                                </div>
                            </div>
                        </div>

                        <!-- Search Registration ID -->
                        <div class="col-12 col-lg-4 mb-2 position-relative">
                            <label class="form-label fs-14 fw-bold">Registration ID</label>
                            <div class="input-group">
                                <div class="input-group-text"><i class="ti ti-search"></i></div>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="regIdInput"
                                    name="regIdRadio"
                                    placeholder="Search Registration ID"
                                    oninput="filterRegIdList()"
                                    onfocus="showRegIdList()"
                                    onblur="hideRegIdList()">
                            </div>
                            <div id="regIdList" class="shadow bg-white border rounded mt-1 position-absolute z-3 p-2 w-100" style="display: none; max-height: 150px; overflow-y: auto;">
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="regIdRadio" id="reg1" value="REG1001">
                                    <label class="form-check-label cursor-pointer" for="reg1">REG1001</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="regIdRadio" id="reg2" value="REG1002">
                                    <label class="form-check-label cursor-pointer" for="reg2">REG1002</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="regIdRadio" id="reg3" value="REG1003">
                                    <label class="form-check-label cursor-pointer" for="reg3">REG1003</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="regIdRadio" id="reg4" value="REG1004">
                                    <label class="form-check-label cursor-pointer" for="reg4">REG1004</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="regIdRadio" id="reg5" value="REG1005">
                                    <label class="form-check-label cursor-pointer" for="reg5">REG1005</label>
                                </div>
                            </div>
                        </div>

                        <!-- Search Mobile Number -->
                        <div class="col-12 col-lg-4 mb-2 position-relative">
                            <label class="form-label fs-14 fw-bold">Mobile Number</label>
                            <div class="input-group">
                                <div class="input-group-text"><i class="ti ti-search"></i></div>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="mobileInput"
                                    name="mobileRadio"
                                    placeholder="Search Mobile Number"
                                    oninput="filterMobileList()"
                                    onfocus="showMobileList()"
                                    onblur="hideMobileList()">
                            </div>
                            <div id="mobileList" class="shadow bg-white border rounded mt-1 position-absolute z-3 p-2 w-100" style="display: none; max-height: 150px; overflow-y: auto;">
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="mobileRadio" id="mobile1" value="9876543210">
                                    <label class="form-check-label cursor-pointer" for="mobile1">9876543210</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="mobileRadio" id="mobile2" value="9123456789">
                                    <label class="form-check-label cursor-pointer" for="mobile2">9123456789</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="mobileRadio" id="mobile3" value="9988776655">
                                    <label class="form-check-label cursor-pointer" for="mobile3">9988776655</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="mobileRadio" id="mobile4" value="9012345678">
                                    <label class="form-check-label cursor-pointer" for="mobile4">9012345678</label>
                                </div>
                                <div class="form-check px-3 py-2">
                                    <input class="form-check-input" type="radio" name="mobileRadio" id="mobile5" value="9456781234">
                                    <label class="form-check-label cursor-pointer" for="mobile5">9456781234</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
                                                                    <div class="col-12 col-lg-5">
                                                                        <h5 class="fw-bold">Patient Complaints</h5>
                                                                    </div>
                                                                    <div class="col-12 col-lg-7">
                                                                        <div class="input-group">
                                                                            <input type="text" class="form-control py-1" id="newComplaint" placeholder="Add new complaint">
                                                                            <button class="btn btn-primary" type="button" onclick="addComplaint()">Add</button>
                                                                        </div>
                                                                    </div>
                                                                </div>


                                                                <div class="row">
                                                                    <div class="col-12">
                                                                        <div class="input-group mb-2 ">
                                                                            <div class="input-group-text"><i class="ti ti-search"></i></div>
                                                                            <input type="text" class="form-control" id="complaintSearch" placeholder="Search patient complaints">
                                                                        </div>
                                                                        <ul class="mb-3 list-style-none" id="patientComplaintList">
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


                                                <!-- Medicines Section -->
                                                <div class="col-xl-6 d-flex">
                                                    <div class="card shadow-sm flex-fill w-100" style="border-top: 4px solid #00bef2;">
                                                        <div class="card-body">
                                                            <h3 class="fw-bold mb-2">Medication</h3>
                                                            <div class="row my-3">
                                                                <div class="col-lg-6">
                                                                    <h5 class="fw-bold">Medicines</h5>
                                                                </div>
                                                                <div class="col-lg-6">
                                                                    <button type="button" class="btn btn-primary py-1" data-bs-toggle="modal" data-bs-target="#medication">
                                                                        Medication
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <!-- <div class="table-responsive">
                                                                <table class="table table-bordered" id="medicineTable" style="display: none;">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Medicine Name</th>
                                                                            <th>Dosage (mg)</th>
                                                                            <th>Dosage (m)</th>
                                                                            <th>Frequency</th>
                                                                            <th>Timing</th>
                                                                            <th>Instruction</th>
                                                                            <th>Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody id="medicineTableBody"></tbody>
                                                                </table>
                                                            </div> -->


                                                            <div class="col-lg-12">
                                                                <div class="table-responsive text-nowrap">
                                                                    <table class="table" id="medicineTable">
                                                                        <thead class="table-light">
                                                                            <tr>
                                                                                <th class="px-3 sortable" onclick="sortTable(0)">Medicine Name <i class="fas fa-sort"></i></th>
                                                                                <th class="px-3 sortable" onclick="sortTable(1)">Dosage (mg) <i class="fas fa-sort"></i></th>
                                                                                <th class="px-3 sortable" onclick="sortTable(2)">Dosage (m) <i class="fas fa-sort"></i></th>
                                                                                <th class="px-3 sortable" onclick="sortTable(3)">Frequency <i class="fas fa-sort"></i></th>
                                                                                <th class="px-3 sortable" onclick="sortTable(4)">Timing <i class="fas fa-sort"></i></th>
                                                                                <th class="px-3 sortable" onclick="sortTable(5)">Instruction <i class="fas fa-sort"></i></th>
                                                                                <!-- <th class="px-3 sortable" onclick="sortTable(6)">Action <i class="fas fa-sort"></i></th> -->

                                                                            </tr>
                                                                        </thead>
                                                                        <tbody id="medicineTableBody">
                                                                        </tbody>

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

                                                <div class="text-end">
                                                    <a href="prescription-pdf.php" class="btn btn-outline-white shadow bg-white d-inline-flex align-items-center px-3"><i class="ti ti-calendar-time"></i>print</a>
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

<!-- Choose custom Prescription medicine js  -->
<script>
    function createCategoryHandler(category) {
        const config = {
            complaint: {
                inputId: 'newComplaint',
                listId: 'patientComplaintList',
                searchId: 'complaintSearch',
                tableId: 'complaintTable',
                tableBodyId: 'complaintTableBody',
                dataAttr: 'data-complaint'
            },
            treatment: {
                inputId: 'newTreatment',
                listId: 'treatmentList',
                searchId: 'treatmentSearch',
                tableId: 'treatmentTable',
                tableBodyId: 'treatmentTableBody',
                dataAttr: 'data-treatment'
            },
            test: {
                inputId: 'newTest',
                listId: 'testList',
                searchId: 'testSearch',
                tableId: 'testTable',
                tableBodyId: 'testTableBody',
                dataAttr: 'data-test'
            },
            disease: {
                inputId: 'newDisease',
                listId: 'diseaseList',
                searchId: 'diseaseSearch',
                tableId: 'diseaseTable',
                tableBodyId: 'diseaseTableBody',
                dataAttr: 'data-disease'
            },
            treatmentCycle: {
                inputId: 'newTreatmentCycle',
                listId: 'treatmentCycleList',
                searchId: 'treatmentCycleSearch',
                tableId: 'treatmentCycleTable',
                tableBodyId: 'treatmentCycleTableBody',
                dataAttr: 'data-treatment-cycle'
            },
            occurCondition: {
                inputId: 'newOccurCondition',
                listId: 'occurConditionList',
                searchId: 'occurConditionSearch',
                tableId: 'occurConditionTable',
                tableBodyId: 'occurConditionTableBody',
                dataAttr: 'data-occur-condition'
            }
        } [category];

        if (!config) return;

        // Add new item
        window[`add${category.charAt(0).toUpperCase() + category.slice(1)}`] = function() {
            const input = document.getElementById(config.inputId);
            const name = input.value.trim();
            if (name) {
                const li = document.createElement('li');
                li.innerHTML = `<label class="px-2 d-flex align-items-center mb-2">
                <input class="form-check-input m-0 me-2" type="checkbox" ${config.dataAttr}="${name}" onchange="update${category.charAt(0).toUpperCase() + category.slice(1)}Table()"> ${name}
            </label>`;
                document.getElementById(config.listId).appendChild(li);
                input.value = '';
                document.getElementById(config.listId).style.display = 'none';
                window[`update${category.charAt(0).toUpperCase() + category.slice(1)}Table`]();
            }
        };

        // Show dropdown on focus and filter
        document.getElementById(config.searchId).addEventListener('focus', function() {
            document.getElementById(config.listId).style.display = 'block';
            window[`filter${category.charAt(0).toUpperCase() + category.slice(1)}s`]();
        });

        // Filter items on input
        document.getElementById(config.searchId).addEventListener('input', function() {
            window[`filter${category.charAt(0).toUpperCase() + category.slice(1)}s`]();
        });

        // Filter function
        window[`filter${category.charAt(0).toUpperCase() + category.slice(1)}s`] = function() {
            const searchTerm = document.getElementById(config.searchId).value.toLowerCase();
            const items = document.getElementById(config.listId).getElementsByTagName('li');
            Array.from(items).forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        };

        // Update table function
        window[`update${category.charAt(0).toUpperCase() + category.slice(1)}Table`] = function() {
            const selectedItems = Array.from(document.querySelectorAll(`#${config.listId} input[type="checkbox"]:checked`))
                .map(input => input.parentElement.textContent.trim());
            const table = document.getElementById(config.tableId);
            const tableBody = document.getElementById(config.tableBodyId);
            tableBody.innerHTML = '';
            if (selectedItems.length > 0) {
                selectedItems.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td class="table-cell">${item}</td>`;
                    tableBody.appendChild(row);
                });
                table.style.display = 'table';
            } else {
                table.style.display = 'none';
            }
        };
    }

    // Initialize handlers for each category
    ['complaint', 'treatment', 'test', 'disease', 'treatmentCycle', 'occurCondition'].forEach(createCategoryHandler);

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const categories = [{
                listId: 'patientComplaintList',
                searchId: 'complaintSearch'
            },
            {
                listId: 'treatmentList',
                searchId: 'treatmentSearch'
            },
            {
                listId: 'testList',
                searchId: 'testSearch'
            },
            {
                listId: 'diseaseList',
                searchId: 'diseaseSearch'
            },
            {
                listId: 'treatmentCycleList',
                searchId: 'treatmentCycleSearch'
            },
            {
                listId: 'occurConditionList',
                searchId: 'occurConditionSearch'
            }
        ];

        categories.forEach(({
            listId,
            searchId
        }) => {
            const list = document.getElementById(listId);
            const search = document.getElementById(searchId);
            if (!search.contains(event.target) && !list.contains(event.target)) {
                list.style.display = 'none';
            }
        });
    });
</script>



<!-- Medication Modal -->
<div class="modal fade" id="medication" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content medicine-modal-content">
            <div class="modal-header medicine-modal-header bg-info-subtle px-3">
                <h4 class="modal-title fw-bold" id="staticBackdropLabel">Add Medicines</h4>
                <button type="button" class="btn-close bg-white rounded-circle" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body medicine-modal-body">
                <div class="card rounded-0 border-0">
                    <div class="row card-header border-0">
                        <div class="col-lg-7">
                            <h5 class="fw-bold">Medicines</h5>
                        </div>
                        <div class="col-lg-5">
                            <div class="input-group">
                                <input type="text" class="form-control py-1" id="newMedicine" placeholder="Add new medicine">
                                <button class="btn btn-primary" type="button" onclick="addMedicine()">Add</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body pb-0">
                        <div class="medication-list" id="medicationList">
                            <div class="row medication-list-item d-flex align-items-center shadow p-3 border-0 border-top border-info border-4 rounded-4 mb-3">
                                <div class="col-lg-11">
                                    <div class="row">
                                        <div class="col-lg-6">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Medicine Name</label>
                                                <div class="input-group mb-2 position-relative">
                                                    <div class="d-flex w-100 ">
                                                        <div class="input-group-text rounded-end-0"><i class="ti ti-search"></i></div>
                                                        <input type="text" class="form-control medicine-name rounded-start-0" placeholder="Search medicines">
                                                    </div>
                                                    <ul class="mb-3 list-style-none medicine-search-list" style="display: none;">
                                                        <li>
                                                            <label class="px-2 d-flex align-items-center">
                                                                <input class="form-check-input m-0 me-2" type="checkbox" onchange="selectMedicine(this, 'General Medicine')"> General Medicine
                                                            </label>
                                                        </li>
                                                        <li>
                                                            <label class="px-2 d-flex align-items-center">
                                                                <input class="form-check-input m-0 me-2" type="checkbox" onchange="selectMedicine(this, 'Axer 90MG Tab')"> Axer 90MG Tab
                                                            </label>
                                                        </li>
                                                        <li>
                                                            <label class="px-2 d-flex align-items-center">
                                                                <input class="form-check-input m-0 me-2" type="checkbox" onchange="selectMedicine(this, 'Ramistar XL 2.5')"> Ramistar XL 2.5
                                                            </label>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-3">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Dosage</label>
                                                <div class="input-group">
                                                    <input type="text" class="form-control dosage-mg">
                                                    <span class="input-group-text bg-transparent text-dark fs-14">mg</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-3">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Dosage</label>
                                                <div class="input-group">
                                                    <input type="text" class="form-control dosage-m">
                                                    <span class="input-group-text bg-transparent text-dark fs-14">m</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-3">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Frequency</label>
                                                <select class="form-control rounded frequency">
                                                    <option value="Select">Select</option>
                                                    <option value="0-0-1">0-0-1</option>
                                                    <option value="1-0-0">1-0-0</option>
                                                    <option value="0-1-0">0-1-0</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-lg-3">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Timing</label>
                                                <select class="form-control rounded timing">
                                                    <option value="Select">Select</option>
                                                    <option value="Before Meal">Before Meal</option>
                                                    <option value="After Meal">After Meal</option>
                                                    <option value="Morning">Morning</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="mb-3">
                                                <label class="form-label mb-1 text-dark fs-14 fw-medium">Instruction</label>
                                                <input type="text" class="form-control instruction">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-1">
                                    <div class="row">
                                        <div class="col-lg-6">
                                            <button type="button" class="btn btn-danger remove-medication-row"><i class="ti ti-trash"></i></button>
                                        </div>
                                        <div class="col-lg-6">
                                            <button type="button" class="btn btn-primary add-medication-row"><i class="ti ti-plus"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer medicine-modal-footer">
                <button type="button" class="btn btn-primary" id="saveMedication">Done</button>
            </div>
        </div>
    </div>
</div>

<script>
    let medications = [];
    let medicineList = ['General Medicine', 'Axer 90MG Tab', 'Ramistar XL 2.5'];

    // Select medicine from search list
    function selectMedicine(checkbox, medicineName) {
        const row = checkbox.closest('.medication-list-item');
        const searchInput = row.querySelector('.medicine-name');
        const searchList = row.querySelector('.medicine-search-list');
        if (checkbox.checked) {
            searchInput.value = medicineName;
            searchList.style.display = 'none';
        } else {
            searchInput.value = '';
        }
        row.querySelectorAll('.medicine-search-list li input').forEach(cb => {
            if (cb !== checkbox) cb.checked = false;
        });
    }

    // Add new medication row
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-medication-row')) {
            const medicationList = document.getElementById('medicationList');
            const newRow = document.querySelector('.medication-list-item').cloneNode(true);
            // Reset all inputs and selects
            newRow.querySelectorAll('input, select').forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else if (input.tagName === 'SELECT') {
                    input.value = 'Select';
                } else {
                    input.value = '';
                }
            });
            // Update search list in new row
            const searchList = newRow.querySelector('.medicine-search-list');
            searchList.innerHTML = '';
            medicineList.forEach(medicine => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <label class="px-2 d-flex align-items-center">
                        <input class="form-check-input m-0 me-2" type="checkbox" onchange="selectMedicine(this, '${medicine}')"> ${medicine}
                    </label>
                `;
                searchList.appendChild(li);
            });
            searchList.style.display = 'none';
            medicationList.appendChild(newRow);
        }
    });

    // Remove medication row
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-medication-row')) {
            const row = e.target.closest('.medication-list-item');
            if (document.querySelectorAll('.medication-list-item').length > 1) {
                row.remove();
            }
        }
    });

    // Save medications
    document.getElementById('saveMedication').addEventListener('click', function() {
        medications = [];
        document.querySelectorAll('.medication-list-item').forEach(row => {
            const medicine = {
                name: row.querySelector('.medicine-name').value.trim(),
                dosageMg: row.querySelector('.dosage-mg').value.trim(),
                dosageM: row.querySelector('.dosage-m').value.trim(),
                frequency: row.querySelector('.frequency').value,
                timing: row.querySelector('.timing').value,
                instruction: row.querySelector('.instruction').value.trim()
            };
            if (medicine.name && medicine.name !== 'Select') {
                medications.push(medicine);
            }
        });
        updateMedicineTable();
        bootstrap.Modal.getInstance(document.getElementById('medication')).hide();
    });

    // Update medicine table
    function updateMedicineTable() {
        const tableBody = document.getElementById('medicineTableBody');
        tableBody.innerHTML = '';
        medications.forEach((med, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${med.name}</td>
                <td>${med.dosageMg}</td>
                <td>${med.dosageM}</td>
                <td>${med.frequency}</td>
                <td>${med.timing}</td>
                <td>${med.instruction}</td>
                <td><button class="btn btn-danger btn-sm delete-medication" onclick="removeMedicine(${index})"><i class="ti ti-trash"></button></td>
            `;
            tableBody.appendChild(row);
        });
        document.getElementById('medicineTable').style.display = medications.length ? 'table' : 'none';
    }

    // Remove medicine from table
    function removeMedicine(index) {
        medications.splice(index, 1);
        updateMedicineTable();
    }

    // Add medicine to checklist
    function addMedicine() {
        const input = document.getElementById('newMedicine');
        const name = input.value.trim();
        if (name && !medicineList.includes(name)) {
            // Add to global medicine list
            medicineList.push(name);
            // Update search lists in all existing rows
            document.querySelectorAll('.medication-list-item').forEach(row => {
                const searchList = row.querySelector('.medicine-search-list');
                const li = document.createElement('li');
                li.innerHTML = `
                    <label class="px-2 d-flex align-items-center">
                        <input class="form-check-input m-0 me-2" type="checkbox" onchange="selectMedicine(this, '${name}')"> ${name}
                    </label>
                `;
                searchList.appendChild(li);
            });
            input.value = '';
        }
    }

    // Search medicines: Show list on focus/click and filter on input
    document.addEventListener('focusin', function(e) {
        if (e.target.classList.contains('medicine-name')) {
            const row = e.target.closest('.medication-list-item');
            const searchList = row.querySelector('.medicine-search-list');
            searchList.style.display = 'block';
            // Filter based on current input
            const searchTerm = e.target.value.toLowerCase();
            row.querySelectorAll('.medicine-search-list li').forEach(li => {
                const text = li.textContent.toLowerCase();
                li.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        }
    });

    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('medicine-name')) {
            const row = e.target.closest('.medication-list-item');
            const searchList = row.querySelector('.medicine-search-list');
            const searchTerm = e.target.value.toLowerCase();
            searchList.style.display = 'block';
            row.querySelectorAll('.medicine-search-list li').forEach(li => {
                const text = li.textContent.toLowerCase();
                li.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        }
    });

    // Hide search list when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.medicine-name') && !e.target.closest('.medicine-search-list')) {
            document.querySelectorAll('.medicine-search-list').forEach(list => {
                list.style.display = 'none';
            });
        }
    });
</script>

<!-- search monile , name and registration id js  -->
 <!-- JavaScript for Search Functionality -->
<script>
    // Name functions
    function showNameList() {
        document.getElementById("nameList").style.display = "block";
    }

    function hideNameList() {
        setTimeout(() => {
            document.getElementById("nameList").style.display = "none";
        }, 300);
    }

    function filterNameList() {
        const inputVal = document.getElementById("nameInput").value.toLowerCase();
        const radios = document.querySelectorAll("#nameList .form-check");

        radios.forEach(item => {
            const label = item.querySelector("label").textContent.toLowerCase();
            item.style.display = label.includes(inputVal) ? "block" : "none";
        });

        const matchingRadio = Array.from(document.querySelectorAll("#nameList input[type='radio']"))
            .find(radio => radio.value.toLowerCase() === inputVal);
        if (matchingRadio) {
            matchingRadio.checked = true;
        }
    }

    document.getElementById("nameList").addEventListener("click", function(e) {
        const input = document.getElementById("nameInput");
        let selectedValue = null;

        if (e.target.matches("input[type='radio']")) {
            selectedValue = e.target.value;
        }

        if (e.target.matches("label")) {
            const forId = e.target.getAttribute("for");
            const linkedRadio = document.getElementById(forId);
            if (linkedRadio) {
                selectedValue = linkedRadio.value;
                linkedRadio.checked = true;
            }
        }

        if (selectedValue) {
            input.value = selectedValue;
            document.getElementById("nameList").style.display = "none";
        }
    });

    document.getElementById("nameInput").addEventListener("focus", function() {
        const selectedRadio = document.querySelector("#nameList input[type='radio']:checked");
        if (selectedRadio) {
            this.value = selectedRadio.value;
        }
        showNameList();
    });

    // Registration ID functions
    function showRegIdList() {
        document.getElementById("regIdList").style.display = "block";
    }

    function hideRegIdList() {
        setTimeout(() => {
            document.getElementById("regIdList").style.display = "none";
        }, 300);
    }

    function filterRegIdList() {
        const inputVal = document.getElementById("regIdInput").value.toLowerCase();
        const radios = document.querySelectorAll("#regIdList .form-check");

        radios.forEach(item => {
            const label = item.querySelector("label").textContent.toLowerCase();
            item.style.display = label.includes(inputVal) ? "block" : "none";
        });

        const matchingRadio = Array.from(document.querySelectorAll("#regIdList input[type='radio']"))
            .find(radio => radio.value.toLowerCase() === inputVal);
        if (matchingRadio) {
            matchingRadio.checked = true;
        }
    }

    document.getElementById("regIdList").addEventListener("click", function(e) {
        const input = document.getElementById("regIdInput");
        let selectedValue = null;

        if (e.target.matches("input[type='radio']")) {
            selectedValue = e.target.value;
        }

        if (e.target.matches("label")) {
            const forId = e.target.getAttribute("for");
            const linkedRadio = document.getElementById(forId);
            if (linkedRadio) {
                selectedValue = linkedRadio.value;
                linkedRadio.checked = true;
            }
        }

        if (selectedValue) {
            input.value = selectedValue;
            document.getElementById("regIdList").style.display = "none";
        }
    });

    document.getElementById("regIdInput").addEventListener("focus", function() {
        const selectedRadio = document.querySelector("#regIdList input[type='radio']:checked");
        if (selectedRadio) {
            this.value = selectedRadio.value;
        }
        showRegIdList();
    });

    // Mobile Number functions
    function showMobileList() {
        document.getElementById("mobileList").style.display = "block";
    }

    function hideMobileList() {
        setTimeout(() => {
            document.getElementById("mobileList").style.display = "none";
        }, 300);
    }

    function filterMobileList() {
        const inputVal = document.getElementById("mobileInput").value.toLowerCase();
        const radios = document.querySelectorAll("#mobileList .form-check");

        radios.forEach(item => {
            const label = item.querySelector("label").textContent.toLowerCase();
            item.style.display = label.includes(inputVal) ? "block" : "none";
        });

        const matchingRadio = Array.from(document.querySelectorAll("#mobileList input[type='radio']"))
            .find(radio => radio.value === inputVal);
        if (matchingRadio) {
            matchingRadio.checked = true;
        }
    }

    document.getElementById("mobileList").addEventListener("click", function(e) {
        const input = document.getElementById("mobileInput");
        let selectedValue = null;

        if (e.target.matches("input[type='radio']")) {
            selectedValue = e.target.value;
        }

        if (e.target.matches("label")) {
            const forId = e.target.getAttribute("for");
            const linkedRadio = document.getElementById(forId);
            if (linkedRadio) {
                selectedValue = linkedRadio.value;
                linkedRadio.checked = true;
            }
        }

        if (selectedValue) {
            input.value = selectedValue;
            document.getElementById("mobileList").style.display = "none";
        }
    });

    document.getElementById("mobileInput").addEventListener("focus", function() {
        const selectedRadio = document.querySelector("#mobileList input[type='radio']:checked");
        if (selectedRadio) {
            this.value = selectedRadio.value;
        }
        showMobileList();
    });
</script>