<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Patient Registration</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">
    @include('doctor.inc.header-links')
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    @include('doctor.inc.custom')
    <style>
        .pdf-preview-modal .modal-dialog {
            max-width: 95%;
            height: 95vh;
        }
        
        .pdf-preview-container {
            display: flex;
            height: 100%;
        }
        
        .pdf-sidebar {
                padding: 20px;
                height: 100%;
                overflow-y: auto;
                position: relative;
                top: 7px;
        }
        
        .pdf-preview {
            padding: 20px;
            height: 100%;
            overflow-y: auto;
            background: white;
        }
        
        .invoice-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 0 auto;
            border: 1px solid #dee2e6;
        }
        
        .invoice-header {
            border-bottom: 2px solid #f3f3f3;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        
        .invoice-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        
        .invoice-table th {
            background-color: #0e606e;
            color: white !important;
            padding: 12px;
            text-align: left;
        }
        
        .invoice-table td {
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .total-row {
            font-weight: bold;
            background-color: #f8f9fa;
        }
        
        .payment-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        
        .payment-option {
            padding: 10px;
            border: 2px solid #dee2e6;
            border-radius: 5px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .payment-option.selected {
            background-color: #e7f1ff;
            border-color: #172c75;
        }
        
        .payment-fields {
            display: none;
        }
        
        .payment-fields.active {
            display: block;
        }

        .clinic-logo {
            max-width: 150px;
            height: auto;
        }

        /* Custom Notification Styles */
        .custom-alert-box {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            min-width: 300px;
            max-width: 400px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow: hidden;
            animation: slideInRight 0.5s ease-out;
        }

        .notification-sidebar {
            background: white;
            border-left: 4px solid;
        }

        .alert-success {
            border-left-color: #28a745;
        }

        .alert-error {
            border-left-color: #dc3545;
        }

        .alert-warning {
            border-left-color: #ffc107;
        }

        .alert-info {
            border-left-color: #17a2b8;
        }

        .p-custom {
            padding: 15px 20px;
            display: flex;
            align-items: center;
            position: relative;
        }

        .text-success { color: #28a745; }
        .text-danger { color: #dc3545; }
        .text-warning { color: #856404; }
        .text-info { color: #17a2b8; }

        .icon {
            font-size: 20px;
            margin-right: 12px;
            flex-shrink: 0;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            margin-left: auto;
            color: #6c757d;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .close-btn:hover {
            color: #495057;
        }

        .progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: currentColor;
            width: 100%;
            animation: progressBar 6s linear forwards;
            opacity: 0.6;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes progressBar {
            from {
                width: 100%;
            }
            to {
                width: 0%;
            }
        }

        /* Loader Styles */
        .loader-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999999;
        }

        .loader-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #172c75;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .loader-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .loader-text {
            margin-top: 15px;
            color: #172c75;
            font-weight: 600;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .pdf-preview-container {
                flex-direction: column;
            }
            
            .pdf-sidebar {
                height: auto;
                border-right: none;
                border-bottom: 1px solid #dee2e6;
            }

            .custom-alert-box {
                min-width: 280px;
                max-width: 320px;
                right: 10px;
                top: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="main-wrapper">
        @include('doctor.inc.header')
       
        @include('doctor.inc.sidebar')
       
        <div class="page-wrapper">
            <div class="content">
                <div class="border-bottom">
                    <h4 class="fw-bold color-doctorrx">Add New Test Booking</h4>
                </div>
               
                <div class="row mt-4">
                    <div class="row align-items-end">
                        <div class="col-md-4">
                            <div class="mb-3 position-relative">
                                <label for="registration_id" class="form-label fw-semibold mb-1">Search OR Select Registration ID</label>
                                <input type="text" id="registration_id" name="registration_id" class="form-control"
                                    placeholder="Type Registration ID..." autocomplete="off">
                                <ul id="suggestion-box" class="suggestion-box list-group mt-1 position-absolute bg-white border shadow w-100 z-3" style="max-height: 200px; overflow-y: auto; z-index: 1000"></ul>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3 position-relative">
                                <label for="mobile" class="form-label fw-semibold mb-1">Mobile Number</label>
                                <input type="text" id="mobile" name="mobile" class="form-control" placeholder="Mobile number will auto-fill" autocomplete="off" minlength="10" maxlength="10">
                                <ul id="suggestion-box-mobile" class="suggestion-box list-group mt-1 position-absolute bg-white border shadow w-100 z-3" style="max-height: 200px; overflow-y: auto; z-index: 1000"></ul>
                            </div>
                        </div>
                        <div class="col-md-4 d-flex justify-content-end">
                            <div class="mb-3"></div>
                        </div>
                    </div>
                    
                    <div class="card patient-details-card mt-3" id="patientDetailsCard" style="display: none;">
                        <div class="card-body px-4 py-3">
                            <div class="row gy-2">
                                <div class="col-lg-6">
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-user text-info me-2"></i>
                                        <span class="fw-semibold me-1" style="color: #172c75;">Name:</span>
                                        <span id="patientName">-</span>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-user text-info me-2"></i>
                                        <span class="fw-semibold me-1" style="color: #172c75;">Patient ID:</span>
                                        <span id="patientId">-</span>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-phone text-info me-2"></i>
                                        <span class="fw-semibold me-1" style="color: #172c75;">Mobile No.:</span>
                                        <span id="patientMobile">-</span>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-mail text-info me-2"></i>
                                        <span class="fw-semibold me-1" style="color: #172c75;">Email:</span>
                                        <span id="patientEmail">-</span>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-gender-bigender text-info me-2"></i>
                                        <span class="fw-semibold me-1" style="color: #172c75;">Gender:</span>
                                        <span id="patientGender">-</span>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-calendar text-info me-2"></i>
                                        <span class="fw-semibold me-1" style="color: #172c75;">Age:</span>
                                        <span id="patientAge">-</span>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-cake text-info me-2"></i>
                                        <span class="fw-semibold me-1" style="color: #172c75;">DOB:</span>
                                        <span id="patientDob">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card flex-fill w-100">
                        <div class="card-body">
                            <h5 class="fw-bold mb-2 text-primary">Add new Vender & Search Vendor for Assessment</h5>
                            <div class="row">
                                <div class="col-lg-8">
                                    <div class="mb-3">
                                        <label for="vendorSelect" class="text-dark fw-bold mb-2 text-primary">Search Vendor Name</label>
                                        <select id="vendorSelect" class="form-control select2" data-placeholder="Search vendor...">
                                            <option value=""></option>
                                        </select>
                                    </div>
                                    <div class="mt-3 table-responsive">
                                        <table class="table table-bordered table-striped table-hover table-sm no-datatable" 
                                            id="vendorDetailsTable" style="display: none;">
                                            <thead class="table-light">
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Number</th>
                                                    <th>Email</th>
                                                    <th>Address</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody id="vendorDetailsBody">
                                                <tr>
                                                    <td id="vendorName"></td>
                                                    <td id="vendorNumber"></td>
                                                    <td id="vendorEmail"></td>
                                                    <td id="vendorAddress"></td>
                                                    <td id="vendorAction"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col-lg-2"></div>
                                <div class="col-lg-2 mt-4">
                                    <a href="#" class="btn btn-outline-primary fs-15 btn-md" onclick="prepareAddVendor()">
                                        <i class="ti ti-user-plus"></i> &nbsp; Add Vendor
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card flex-fill w-100">
                        <div class="card-body">
                            <h5 class="fw-bold mb-2 text-primary">Add new Own Test Name & Search Test for Assessment</h5>
                            <div class="row">
                                <div class="col-lg-8">
                                    <div class="mb-3">
                                        <label for="testSelect" class="text-dark fw-bold mb-2 text-primary">Search Test Name</label>
                                        <select id="testSelect" class="form-control select2" data-placeholder="Search tests...">
                                            <option value=""></option>
                                        </select>
                                    </div>
                                    <div class="table-scroll-wrapper mt-1">
                                        <table class="table table-bordered selected-items-table no-datatable" id="testTable" style="display: none;">
                                            <thead>
                                                <tr>
                                                    <th>Test Name</th>
                                                    <th>Amounts</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody id="testTableBody"></tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col-lg-2"></div>
                                <div class="col-lg-2 mt-4">
                                    <button type="button" class="btn btn-outline-primary w-100 py-2 fw-semibold" onclick="prepareAddTest()">
                                        Add Our Test
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card mb-1">
                        <div class="card-header">
                            <h5 class="card-title mb-0 color-doctorrx">Payment Method</h5>
                        </div>
                        <div class="card-body">
                            <div class="payment-method-card">
                                <div class="row">
                                    <div class="col-md-3">
                                        <h6 class="color-doctorrx mb-3 fw-semibold">Select Payment Method</h6>
                                        <label for="paymentUpi" class="mb-0 w-100">
                                            <div class="payment-option" onclick="selectPaymentMethod('upi')">
                                                <input type="radio" id="paymentUpi" name="paymentMethod" value="upi">
                                                <i class="ti ti-brand-google-pay me-2"></i> UPI Payment
                                            </div>
                                        </label>
                                        <label for="paymentCash" class="mb-0 w-100">
                                            <div class="payment-option" onclick="selectPaymentMethod('cash')">
                                                <input type="radio" id="paymentCash" name="paymentMethod" value="cash">
                                                <i class="ti ti-cash me-2"></i> Cash
                                            </div>
                                        </label>
                                        <label for="paymentCard" class="mb-0 w-100">
                                            <div class="payment-option" onclick="selectPaymentMethod('card')">
                                                <input type="radio" id="paymentCard" name="paymentMethod" value="card">
                                                <i class="ti ti-credit-card me-2"></i> Card
                                            </div>
                                        </label>
                                        <label for="paymentNetbanking" class="mb-0 w-100">
                                            <div class="payment-option" onclick="selectPaymentMethod('netbanking')">
                                                <input type="radio" id="paymentNetbanking" name="paymentMethod" value="netbanking">
                                                <i class="ti ti-building-bank me-2"></i> Net Banking
                                            </div>
                                        </label>
                                    </div>
                                    <div class="col-md-9">
                                        <div id="paymentFieldsContainer">
                                            <div id="upiFields" class="payment-fields">
                                                <h6 class="color-doctorrx mb-3">UPI Payment Details</h6>
                                                <div class="mb-3">
                                                    <label class="form-label">UPI ID</label>
                                                    <input type="text" class="form-control" name="upi_id" placeholder="Enter UPI ID">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Amount</label>
                                                    <input type="number" class="form-control" name="amount" placeholder="Enter amount">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Transaction Date</label>
                                                    <input type="date" class="form-control" name="transaction_date">
                                                </div>
                                            </div>
                                            <div id="cashFields" class="payment-fields">
                                                <h6 class="color-doctorrx mb-3">Cash Payment Details</h6>
                                                <div class="mb-3">
                                                    <label class="form-label">Amount</label>
                                                    <input type="number" class="form-control" name="amount" placeholder="Enter amount">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Payment Date</label>
                                                    <input type="date" class="form-control" name="payment_date">
                                                </div>
                                            </div>
                                            <div id="cardFields" class="payment-fields">
                                                <h6 class="color-doctorrx mb-3">Card Payment Details</h6>
                                                <div class="mb-3">
                                                    <label class="form-label">Card Number</label>
                                                    <input type="text" class="form-control" name="card_number" placeholder="Enter card number">
                                                </div>
                                                <div class="row mb-3">
                                                    <div class="col-md-6">
                                                        <label class="form-label">Expiry Date</label>
                                                        <input type="month" class="form-control" name="expiry">
                                                    </div>
                                                    <div class="col-md-6">
                                                        <label class="form-label">CVV</label>
                                                        <input type="text" class="form-control" name="cvv" placeholder="CVV">
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Amount</label>
                                                    <input type="number" class="form-control" name="amount" placeholder="Enter amount">
                                                </div>
                                            </div>
                                            <div id="netbankingFields" class="payment-fields">
                                                <h6 class="color-doctorrx mb-3">Net Banking Details</h6>
                                                <div class="mb-3">
                                                    <label class="form-label">Bank Name</label>
                                                    <select class="form-select" name="bank_name">
                                                        <option selected disabled>Select bank</option>
                                                        <option>State Bank of India</option>
                                                        <option>HDFC Bank</option>
                                                        <option>ICICI Bank</option>
                                                        <option>Axis Bank</option>
                                                    </select>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Transaction ID</label>
                                                    <input type="text" class="form-control" name="transaction_id" placeholder="Enter transaction ID">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Amount</label>
                                                    <input type="number" class="form-control" name="amount" placeholder="Enter amount">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Transaction Date</label>
                                                    <input type="date" class="form-control" name="transaction_date">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="p-2 modal-footer mt-2 d-flex justify-content-end gap-3">
                            <button type="button" class="btn btn-outline-primary btn-md ps-3 pe-3 pb-2 pt-2 fs-16" onclick="validateAndShowPreview()">
                                Submit 
                            </button>
                        </div>
                    </div>
                </div>
            </div>
           
            @include('doctor.inc.footer-links')
            @include('doctor.inc.footer')
        </div>
    </div>
    
    <!-- Add Vendor Modal -->
    <div class="modal fade" id="addVendorModal" tabindex="-1" aria-labelledby="addVendorModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header" style="background-color: var(--light-blue);">
                    <h5 class="modal-title color-doctorrx" id="addVendorModalLabel">Add New Vendor</h5>
                    <button type="button" class="btn btn-sm btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-3 z-3" style="width: 25px; height: 25px; display: flex; align-items: center; justify-content: center;" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-xbox-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="addVendorForm">
                        <input type="hidden" id="vendorIdInput">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Vendor Name</label>
                                <input type="text" class="form-control" id="vendorNameInput" placeholder="Enter vendor name" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Mobile</label>
                                <input type="number" class="form-control" id="vendorMobileInput" placeholder="Enter vendor mobile" minlength="10" maxlength="10" pattern="[0-9]{10}" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0,10);" required>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="vendorEmailInput" placeholder="Enter vendor email" required>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label class="form-label">Address</label>
                                <textarea class="form-control" id="vendorAddressInput" rows="3" placeholder="Enter vendor address" required></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" id="addVendorBtn" class="btn btn-outline-primary btn-ms" onclick="addNewVendor()">Add Vendor</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Add Test Modal -->
    <div class="modal fade" id="addTestModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header d-flex justify-content-between align-items-center px-3 bg-info-subtle">
                    <h6 class="modal-title text-dark fw-bold mb-0" id="staticBackdropLabel">Add Our Test</h6>
                    <button type="button" class="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 25px; height: 25px;" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-xbox-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="testIdInput">
                    <div class="mb-3">
                        <label for="testNameInput" class="form-label">Test Name</label>
                        <input type="text" class="form-control" id="testNameInput" placeholder="Enter test name" required>
                    </div>
                    <div class="mb-3 d-none">
                        <label for="testDescriptionInput" class="form-label">Description</label>
                        <textarea class="form-control" id="testDescriptionInput" rows="3" placeholder="Enter test description"></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="testPriceInput" class="form-label">Price</label>
                        <input type="number" class="form-control" id="testPriceInput" placeholder="Enter test price" step="0.01" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-primary" id="saveTestBtn" onclick="saveTest()">Add Test</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- PDF Preview Modal -->
    <div class="modal fade pdf-preview-modal" id="pdfPreviewModal" tabindex="-1" aria-labelledby="pdfPreviewModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header" style="background-color: var(--light-blue);">
                    <h5 class="modal-title color-doctorrx" id="pdfPreviewModalLabel">Test Booking Invoice</h5>
                    <button type="button" class="btn btn-sm btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-3 z-3" style="width: 25px; height: 25px; display: flex; align-items: center; justify-content: center;" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-xbox-x"></i>
                    </button>
                </div>
                <div class="modal-body p-0">
                    <div class="pdf-preview-container">
                        <div class="col-md-3 pdf-sidebar">
                            <div class="d-grid gap-2">
                                <button type="button" class="btn btn-outline-primary" onclick="saveAndContinue()">
                                    <i class="ti ti-check me-2"></i> Save & Continue
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="downloadPDF()">
                                    <i class="ti ti-download me-2"></i> Download Bill
                                </button>
                                {{-- <button type="button" class="btn btn-outline-info" onclick="printInvoice()">
                                    <i class="ti ti-printer me-2"></i> Print
                                </button> --}}
                                <button type="button" class="btn btn-outline-dark" data-bs-dismiss="modal">
                                    <i class="ti ti-x me-2"></i> Close
                                </button>
                            </div>
                        </div>
                        <div class="col-md-9 pdf-preview" id="pdfPreviewContent"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loader Overlay -->
    <div class="loader-overlay" id="loaderOverlay" style="display: none;">
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <div class="loader-text" id="loaderText">Processing...</div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    @php
        $currentDoctor = auth()->user();
        $currentClinic = \App\Models\DoctorClinic::where('doctor_id', $currentDoctor->getDoctorIdContext())->first();
    @endphp
    
    <script>
        // Doctor and Clinic Info for Invoice
        const doctorInfo = {
            name: "{{ $currentDoctor->name }}",
            salutation: "{{ $currentDoctor->salutation }}",
            qualification: "{{ $currentDoctor->qualification ?? 'MBBS, MD' }}",
            email: "{{ $currentDoctor->email }}",
            phone: "{{ $currentDoctor->phone }}"
        };
        
        const clinicInfo = {
            name: "{{ $currentClinic->clinic_name ?? 'SkoraCares' }}",
            address: "{{ $currentClinic->address ?? 'N/A' }}",
            phone: "{{ $currentClinic->phone ?? 'N/A' }}",
            logo: "@php
                $clinicLogo = asset('assets/img/Logo.PNG');
                if ($currentClinic && $currentClinic->clinic_logo && file_exists(public_path($currentClinic->clinic_logo))) {
                    $clinicLogo = asset($currentClinic->clinic_logo);
                } elseif (file_exists(public_path('uploads/profile/1776939557.jpg'))) {
                    $clinicLogo = asset('uploads/profile/1776939557.jpg');
                }
                echo $clinicLogo;
            @endphp"
        };

        // Global variables
        let selectedVendor = null;
        let selectedTests = [];
        let bookingData = null;
        let isDataSaved = false;
        let vendors = [];
        let tests = [];

        // CSRF Token setup for AJAX
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });

        // Document Ready
        $(document).ready(function() {
            $('.payment-fields').hide();
            fetchInitialData();
        });

        function fetchInitialData() {
            // Disable selects while loading
            $('#vendorSelect, #testSelect').prop('disabled', true);
            
            // Use jQuery's native $.when for parallel AJAX calls for better compatibility
            $.when(
                $.ajax({
                    url: "{{ route('doctor.vendors') }}",
                    type: "GET",
                    dataType: "json"
                }),
                $.ajax({
                    url: "{{ route('doctor.tests') }}",
                    type: "GET",
                    dataType: "json"
                })
            ).done(function(vendorsResponse, testsResponse) {
                // In $.when with multiple promises, each argument is [data, status, xhr]
                vendors = vendorsResponse[0];
                tests = testsResponse[0];
                
                console.log('Data loaded successfully:', vendors.length, 'vendors,', tests.length, 'tests');
                populateSelects();
            }).fail(function(xhr, status, error) {
                console.error("Initial data load failed:", xhr);
                const statusCode = xhr.status || '0';
                const errorMsg = xhr.responseJSON?.message || error || xhr.statusText || 'Connection failed';
                
                // Don't show error if it's just a page reload/abort (status 0)
                if (statusCode !== 0 && statusCode !== '0') {
                    showNotification(`Error loading vendors or tests (Status: ${statusCode}): ${errorMsg}`, 'error');
                }
            }).always(function() {
                $('#vendorSelect, #testSelect').prop('disabled', false);
            });
        }

        function populateSelects() {
            const vendorSelect = $('#vendorSelect');
            const testSelect = $('#testSelect');
            
            // Remember current selection
            const currentVendorId = selectedVendor ? selectedVendor.id : null;

            // Populate Vendor Select
            vendorSelect.empty().append('<option value=""></option>');
            if (Array.isArray(vendors)) {
                vendors.forEach(v => {
                    vendorSelect.append(new Option(v.name, v.id));
                });
            }

            // Populate Test Select
            testSelect.empty().append('<option value=""></option>');
            if (Array.isArray(tests)) {
                tests.forEach(t => {
                    testSelect.append(new Option(`${t.name} - ₹${t.price}`, t.id, false, false));
                });
            }

            // Initialize/Re-initialize Select2
            vendorSelect.select2({
                placeholder: 'Search vendor...',
                allowClear: true,
                width: '100%',
                minimumInputLength: 1,
                language: {
                    inputTooShort: function() { return 'Please enter vendor name...'; }
                }
            }).off('change').on('change', function() {
                const id = $(this).val();
                if (id) {
                    const vendor = vendors.find(v => v.id == id);
                    if (vendor) {
                        selectVendor(vendor);
                    }
                } else {
                    selectedVendor = null;
                    $('#vendorDetailsTable').hide();
                }
            });

            // Restore vendor selection if it still exists
            if (currentVendorId) {
                vendorSelect.val(currentVendorId).trigger('change.select2');
            }

            testSelect.select2({
                placeholder: 'Search tests...',
                allowClear: true,
                width: '100%',
                minimumInputLength: 1,
                language: {
                    inputTooShort: function() { return 'Please enter test name...'; }
                }
            }).off('select2:select').on('select2:select', function (e) {
                const data = e.params.data;
                const test = tests.find(t => t.id == data.id);
                if (test) {
                    addTestToSelected(test);
                    $(this).val(null).trigger('change');
                }
            });
        }

        function selectVendor(vendor) {
            if (!vendor) return;
            selectedVendor = vendor;
            console.log('Vendor selected:', vendor.id, vendor.name);
            
            $('#vendorName').text(vendor.name);
            $('#vendorNumber').text(vendor.mobile);
            $('#vendorEmail').text(vendor.email);
            $('#vendorAddress').text(vendor.address);
            
            // Add edit/delete icons in the action column
            
            $('#vendorAction').html(`
                <div class="d-flex gap-2">
                    <i class="ti ti-edit text-info" style="cursor: pointer;" onclick="editVendorById(${vendor.id})" title="Edit Vendor"></i>
                    <i class="ti ti-trash text-danger" style="cursor: pointer;" onclick="deleteVendorById(${vendor.id})" title="Delete Vendor"></i>
                </div>
            `);
            $('#vendorDetailsTable').show();
        }

        function editVendorById(id) {
            const vendor = vendors.find(v => v.id == id);
            if (vendor) {
                openEditVendorModal(vendor);
            }
        }

        function prepareAddVendor() {
            $('#addVendorForm')[0].reset();
            $('#vendorIdInput').val('');
            $('#addVendorModalLabel').text('Add New Vendor');
            $('#addVendorBtn').text('Add Vendor');
            $('#addVendorModal').modal('show');
        }

        function openEditVendorModal(vendor) {
            $('#addVendorForm')[0].reset();
            $('#vendorIdInput').val(vendor.id);
            $('#vendorNameInput').val(vendor.name);
            $('#vendorMobileInput').val(vendor.mobile);
            $('#vendorEmailInput').val(vendor.email);
            $('#vendorAddressInput').val(vendor.address);
            $('#addVendorModalLabel').text('Edit Vendor');
            $('#addVendorBtn').text('Update Vendor').attr('onclick', 'updateExistingVendor()');
            $('#addVendorModal').modal('show');
        }

        function updateExistingVendor() {
            const id = $('#vendorIdInput').val();
            const data = {
                name: $('#vendorNameInput').val().trim(),
                mobile: $('#vendorMobileInput').val().trim(),
                email: $('#vendorEmailInput').val().trim(),
                address: $('#vendorAddressInput').val().trim(),
                _token: $('meta[name="csrf-token"]').attr('content')
            };
            
            $.ajax({
                url: "{{ url('doctor/vendors') }}/" + id,
                type: "PUT",
                data: data,
                success: function(response) {
                    if (response.success) {
                        $('#addVendorModal').modal('hide');
                        fetchInitialData();
                        showNotification('Vendor updated successfully!', 'success');
                    }
                },
                error: function(xhr) {
                    showNotification('Error updating vendor', 'error');
                }
            });
        }

        function addTestToSelected(test) {
            if (selectedTests.some(t => t.id === test.id)) {
                showNotification('Test already selected', 'warning');
                return;
            }
            selectedTests.push({
                id: test.id,
                name: test.name,
                price: test.price
            });
            updateTestTable();
        }

        function updateTestTable() {
            const tableBody = $('#testTableBody');
            tableBody.empty();
           
            if (selectedTests.length > 0) {
                selectedTests.forEach((test, index) => {
                    const row = `<tr>
                        <td>${test.name}</td>
                        <td>
                            <div class="input-group input-group-sm" style="width: 120px;">
                                <span class="input-group-text">₹</span>
                                <input type="number" class="form-control test-price-input" 
                                    data-index="${index}" value="${test.price}" min="0" step="0.01"
                                    onchange="updateTestPrice(${index}, this.value)">
                            </div>
                        </td>
                        <td>
                            <div class="d-flex gap-2">
                                <i class="ti ti-edit text-info" style="cursor: pointer;" onclick="editTestById(${test.id})"></i>
                                <i class="ti ti-trash text-danger" style="cursor: pointer;" onclick="removeTest(${test.id})"></i>
                            </div>
                        </td>
                    </tr>`;
                    tableBody.append(row);
                });
                $('#testTable').show();
            } else {
                $('#testTable').hide();
            }
        }

        function updateTestPrice(index, newPrice) {
            if (selectedTests[index]) {
                selectedTests[index].price = parseFloat(newPrice) || 0;
            }
        }

        function removeTest(testId) {
            selectedTests = selectedTests.filter(t => t.id !== testId);
            updateTestTable();
        }

        // Advanced Notification Script
        function showNotification(msg, type = 'success') {
            let alertClass = 'alert-' + type;
            let iconClass = '';
            let textClass = '';

            switch (type) {
                case 'success':
                    iconClass = 'fas fa-check-circle text-success';
                    textClass = 'text-success';
                    break;
                case 'error':
                    iconClass = 'fas fa-exclamation-circle text-danger';
                    textClass = 'text-danger';
                    break;
                case 'info':
                    iconClass = 'fas fa-info-circle text-info';
                    textClass = 'text-info';
                    break;
                case 'warning':
                    iconClass = 'fas fa-exclamation-triangle text-warning';
                    textClass = 'text-warning';
                    break;
                default:
                    iconClass = 'fas fa-check-circle text-success';
                    textClass = 'text-success';
            }

            var alertBox = document.createElement("div");
            alertBox.className = `custom-alert-box ${alertClass} notification-sidebar position-fixed top-2 show-notification mt-3 shadow-lg rounded`;
            alertBox.innerHTML = `
                <div class="${textClass} p-custom">
                    <i class="${iconClass} icon"></i>
                    ${msg}
                    <button type="button" class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <div class="progress-bar"></div>
                </div>
            `;
            document.body.appendChild(alertBox);
            setTimeout(() => {
                alertBox.style.transition = "right 0.5s ease-in-out, opacity 0.5s ease";
                alertBox.style.opacity = "0";
                setTimeout(() => alertBox.remove(), 500);
            }, 6000); // 6 seconds total
        }

        // Loader Functions
        function showLoader(text = 'Processing...') {
            document.getElementById('loaderText').textContent = text;
            document.getElementById('loaderOverlay').style.display = 'flex';
        }

        function hideLoader() {
            document.getElementById('loaderOverlay').style.display = 'none';
        }

        // Payment method selection
        function selectPaymentMethod(method) {
            $('.payment-option').removeClass('selected');
            $(event.currentTarget).addClass('selected');
            
            $('.payment-fields').hide().removeClass('active');
            $(`#${method}Fields`).show().addClass('active');
        }

        // Validate and Show Preview
        function validateAndShowPreview() {
            const registration_id = $('#registration_id').val();
            const mobile = $('#mobile').val();

            if (!registration_id || !mobile) {
                showNotification('Please select a patient!', 'warning');
                return;
            }

            if (!selectedVendor) {
                showNotification('Please select a vendor!', 'warning');
                return;
            }

            if (selectedTests.length === 0) {
                showNotification('Please select at least one test!', 'warning');
                return;
            }

            const paymentMethod = $('input[name="paymentMethod"]:checked').val();
            if (!paymentMethod) {
                showNotification('Please select a payment method!', 'warning');
                return;
            }

            // Get payment details based on selected method
            let paymentData = {};
            const fieldsDiv = $(`#${paymentMethod}Fields`);
            
            switch (paymentMethod) {
                case 'upi':
                    paymentData = {
                        payment_method: 'upi',
                        upi_id: fieldsDiv.find('input[name="upi_id"]').val(),
                        amount: fieldsDiv.find('input[name="amount"]').val(),
                        transaction_date: fieldsDiv.find('input[name="transaction_date"]').val()
                    };
                    break;
                case 'cash':
                    paymentData = {
                        payment_method: 'cash',
                        amount: fieldsDiv.find('input[name="amount"]').val(),
                        payment_date: fieldsDiv.find('input[name="payment_date"]').val()
                    };
                    break;
                case 'card':
                    paymentData = {
                        payment_method: 'card',
                        card_number: fieldsDiv.find('input[name="card_number"]').val(),
                        expiry: fieldsDiv.find('input[name="expiry"]').val(),
                        cvv: fieldsDiv.find('input[name="cvv"]').val(),
                        amount: fieldsDiv.find('input[name="amount"]').val()
                    };
                    break;
                case 'netbanking':
                    paymentData = {
                        payment_method: 'netbanking',
                        bank_name: fieldsDiv.find('select[name="bank_name"]').val(),
                        transaction_id: fieldsDiv.find('input[name="transaction_id"]').val(),
                        amount: fieldsDiv.find('input[name="amount"]').val(),
                        transaction_date: fieldsDiv.find('input[name="transaction_date"]').val()
                    };
                    break;
            }

            // Validate payment data
            for (let key in paymentData) {
                if (!paymentData[key] && key !== 'cvv') {
                    showNotification(`Please fill all ${paymentMethod} payment fields!`, 'warning');
                    return;
                }
            }

            // Prepare booking data
            bookingData = {
                registration_id: $('#patientId').text(),
                mobile: mobile,
                vendor_id: selectedVendor.id,
                tests: selectedTests,
                ...paymentData,
                patient_name: $('#patientName').text(),
                patient_id: $('#patientId').text(),
                patient_mobile: $('#patientMobile').text(),
                patient_email: $('#patientEmail').text(),
                patient_gender: $('#patientGender').text(),
                patient_age: $('#patientAge').text(),
                patient_dob: $('#patientDob').text(),
                vendor_name: selectedVendor.name,
                vendor_number: selectedVendor.mobile,
                vendor_email: selectedVendor.email,
                vendor_address: selectedVendor.address,
                _token: $('meta[name="csrf-token"]').attr('content')
            };

            console.log('Booking data prepared:', bookingData);
            isDataSaved = false;

            // Show the preview modal
            generatePDFPreview();
            $('#pdfPreviewModal').modal('show');
        }

        // Save and Continue - Save to Database
        function saveAndContinue() {
            if (!bookingData) {
                showNotification('No data to save!', 'error');
                return;
            }

            if (isDataSaved) {
                showNotification('Data already saved!', 'info');
                return;
            }

            showLoader('Saving booking data...');

            $.ajax({
                url: "{{ route('doctor.test-bookings.store') }}",
                type: "POST",
                data: bookingData,
                success: function(response) {
                    hideLoader();
                    if (response.success) {
                        isDataSaved = true;
                        showNotification('Test booking saved successfully! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = "{{ route('doctor-test-booking') }}";
                        }, 1000);
                    } else {
                        showNotification('Failed to save booking: ' + response.message, 'error');
                    }
                },
                error: function(xhr) {
                    hideLoader();
                    console.error('Error:', xhr);
                    if (xhr.status === 419) {
                        showNotification('CSRF token mismatch. Please refresh the page and try again.', 'error');
                    } else {
                        showNotification('Error: ' + (xhr.responseJSON?.message || 'Unknown error'), 'error');
                    }
                }
            });
        }

        // Generate PDF Preview with Logo and Doctor Details
        function generatePDFPreview() {
            if (!bookingData) return;
            
            // Calculate total test amount
            const totalTestAmount = bookingData.tests.reduce((sum, test) => sum + parseFloat(test.price), 0);
            
            // Format payment method display
            let paymentMethodDisplay = '';
            let paymentDetails = '';
            
            switch(bookingData.payment_method) {
                case 'upi':
                    paymentMethodDisplay = 'UPI Payment';
                    paymentDetails = `UPI ID: ${bookingData.upi_id}<br>Transaction Date: ${bookingData.transaction_date}`;
                    break;
                case 'cash':
                    paymentMethodDisplay = 'Cash Payment';
                    paymentDetails = `Payment Date: ${bookingData.payment_date}`;
                    break;
                case 'card':
                    paymentMethodDisplay = 'Card Payment';
                    paymentDetails = `Card: ****${bookingData.card_number?.slice(-4) || ''}<br>Expiry: ${bookingData.expiry}`;
                    break;
                case 'netbanking':
                    paymentMethodDisplay = 'Net Banking';
                    paymentDetails = `Bank: ${bookingData.bank_name}<br>Transaction ID: ${bookingData.transaction_id}<br>Transaction Date: ${bookingData.transaction_date}`;
                    break;
            }
            
            // Generate HTML for PDF preview with logo and doctor details
            const pdfHTML = `
                <div class="invoice-container">
                    <div class="invoice-header">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <img src="${clinicInfo.logo}" alt="Clinic Logo" class="clinic-logo">
                            </div>
                            <div class="col-md-8 text-center">
                                <h2 class="color-doctorrx mb-1">${clinicInfo.name}</h2>
                                <h5 class="text-muted mb-1">${doctorInfo.salutation ? doctorInfo.salutation + ' ' : ''}${doctorInfo.name}</h5>
                                <p class="mb-1"><strong>${doctorInfo.qualification}</strong></p>
                                <p class="mb-0">${clinicInfo.address}</p>
                                <p class="mb-0">Phone: ${clinicInfo.phone} | Email: ${doctorInfo.email}</p>
                            </div>
                            <div class="col-md-2 text-end">
                                <p class="mb-0"><strong>Invoice #:</strong> INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                <p class="mb-0"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h5 class="color-doctorrx border-bottom pb-2">Patient Details</h5>
                            <p class="mb-1"><strong>Name:</strong> ${bookingData.patient_name}</p>
                            <p class="mb-1"><strong>Patient ID:</strong> ${bookingData.patient_id}</p>
                            <p class="mb-1"><strong>Mobile:</strong> ${bookingData.patient_mobile}</p>
                            <p class="mb-1"><strong>Email:</strong> ${bookingData.patient_email}</p>
                            <p class="mb-1"><strong>Gender:</strong> ${bookingData.patient_gender}</p>
                            <p class="mb-1"><strong>Age:</strong> ${bookingData.patient_age}</p>
                            <p class="mb-0"><strong>DOB:</strong> ${bookingData.patient_dob}</p>
                        </div>
                        <div class="col-md-6">
                            <h5 class="color-doctorrx border-bottom pb-2">Vendor Details</h5>
                            <p class="mb-1"><strong>Name:</strong> ${bookingData.vendor_name}</p>
                            <p class="mb-1"><strong>Contact:</strong> ${bookingData.vendor_number}</p>
                            <p class="mb-1"><strong>Email:</strong> ${bookingData.vendor_email}</p>
                            <p class="mb-0"><strong>Address:</strong> ${bookingData.vendor_address}</p>
                        </div>
                    </div>
                    
                    <h5 class="color-doctorrx border-bottom pb-2">Test Details</h5>
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th style="text-align: right;">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookingData.tests.map(test => `
                                <tr>
                                    <td>${test.name}</td>
                                    <td style="text-align: right;">₹${parseFloat(test.price).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td><strong>Total Amount</strong></td>
                                <td style="text-align: right;"><strong>₹${totalTestAmount.toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="payment-details">
                        <h5 class="color-doctorrx border-bottom pb-2">Payment Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Payment Method:</strong> ${paymentMethodDisplay}</p>
                                <p class="mb-1"><strong>Amount Paid:</strong> ₹${bookingData.amount}</p>
                            </div>
                            <div class="col-md-6">
                                ${paymentDetails}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 text-center">
                        <p class="text-muted mb-1">Thank you for choosing our services</p>
                        <p class="text-muted small mb-0">This is a computer generated invoice</p>
                        <p class="text-muted small mb-0">For any queries, contact: ${clinicInfo.phone}</p>
                    </div>

                    <div class="row mt-4 pt-3 border-top">
                        <div class="col-md-6 text-center">
                            <p class="mb-1">_________________________</p>
                            <p class="mb-0"><strong>Patient Signature</strong></p>
                        </div>
                        <div class="col-md-6 text-center">
                            <p class="mb-1">_________________________</p>
                            <p class="mb-0"><strong>Doctor's Signature</strong></p>
                        </div>
                    </div>
                </div>
            `;
            
            $('#pdfPreviewContent').html(pdfHTML);
        }

        // Download PDF - Only download, no save
        function downloadPDF() {
            showLoader('Generating PDF...');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const pdfContent = document.getElementById('pdfPreviewContent');
            
            // Ensure images are loaded before generating PDF
            const images = pdfContent.getElementsByTagName('img');
            const promises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            });

            Promise.all(promises).then(() => {
                html2canvas(pdfContent, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false
                }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = canvas.height * imgWidth / canvas.width;
                
                doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                doc.save(`Medical_Test_Invoice_${bookingData.registration_id}.pdf`);
                hideLoader();
                showNotification('PDF downloaded successfully!', 'success');
            }).catch(error => {
                hideLoader();
                console.error('Error generating PDF:', error);
                showNotification('Error generating PDF!', 'error');
            });
        });
    }

        // Print Invoice - Only print, no save
        function printInvoice() {
            showLoader('Preparing for print...');
            
            setTimeout(() => {
                const printContent = document.getElementById('pdfPreviewContent').innerHTML;
                const originalContent = document.body.innerHTML;
                
                document.body.innerHTML = printContent;
                window.print();
                document.body.innerHTML = originalContent;
                hideLoader();
                showNotification('Printing initiated!', 'info');
            }, 1000);
        }

        // Patient Search Functionality
        $('#registration_id').on('keyup', function() {
            let query = $(this).val();
            if (query.length > 1) {
                $.ajax({
                    url: "{{ route('get.registration.suggestions') }}",
                    type: "GET",
                    data: { query: query },
                    success: function(data) {
                        $('#suggestion-box').empty();
                        if (data && data.length > 0) {
                            data.forEach(function(item) {
                                const phone = item.phone || '';
                                const registration_id = item.registration_id || '';
                                const name = item.name || 'Unknown';
                                if (registration_id) {
                                    $('#suggestion-box').append(
                                        '<li class="list-group-item" data-mobile="' + phone + '" data-registration="' + registration_id + '">' + 
                                        registration_id + ' --- ' + name + 
                                        '</li>'
                                    );
                                }
                            });
                        } else {
                            $('#suggestion-box').append('<li class="list-group-item text-muted">No match found</li>');
                        }
                        $('#suggestion-box').show();
                    },
                    error: function(xhr) {
                        showNotification('Error fetching suggestions!', 'error');
                    }
                });
            } else {
                $('#suggestion-box').empty().hide();
            }
        });

        // Mobile Search Functionality
        $('#mobile').on('keyup', function() {
            let query = $(this).val();
            if (query.length > 1) {
                $.ajax({
                    url: "{{ route('get.mobile.suggestions') }}",
                    type: "GET",
                    data: { query: query },
                    success: function(data) {
                        $('#suggestion-box-mobile').empty();
                        if (data && data.length > 0) {
                            data.forEach(function(item) {
                                const phone = item.phone || '';
                                const name = item.name || 'Unknown';
                                const registration_id = item.registration_id || '';
                                if (phone && registration_id) {
                                    $('#suggestion-box-mobile').append(
                                        '<li class="list-group-item" data-mobile="' + phone + '" data-registration="' + registration_id + '">' + 
                                        phone + ' --- ' + name + 
                                        '</li>'
                                    );
                                }
                            });
                        } else {
                            $('#suggestion-box-mobile').append('<li class="list-group-item text-muted">No match found</li>');
                        }
                        $('#suggestion-box-mobile').show();
                    },
                    error: function(xhr) {
                        showNotification('Error fetching mobile suggestions!', 'error');
                    }
                });
            } else {
                $('#suggestion-box-mobile').empty().hide();
            }
        });

        // Select Registration ID
        $(document).on('mousedown', '#suggestion-box li', function(e) {
            e.preventDefault();
            if ($(this).hasClass('text-muted')) return;
            const selectedReg = $(this).data('registration');
            const mobileNumber = $(this).data('mobile');
            $('#registration_id').val(selectedReg);
            $('#mobile').val(mobileNumber);
            $('#suggestion-box').empty().hide();
            fetchPatientDetails('registration_id', selectedReg);
        });

        // Select Mobile Number
        $(document).on('mousedown', '#suggestion-box-mobile li', function(e) {
            e.preventDefault();
            if ($(this).hasClass('text-muted')) return;
            const selectedMobile = $(this).data('mobile');
            const selectedReg = $(this).data('registration');
            $('#mobile').val(selectedMobile);
            $('#registration_id').val(selectedReg);
            $('#suggestion-box-mobile').empty().hide();
            fetchPatientDetails('mobile', selectedMobile);
        });

        // Fetch Patient Details
        function fetchPatientDetails(type, value) {
            $.ajax({
                url: "{{ route('get.patient.details') }}",
                type: "GET",
                data: { type: type, value: value },
                success: function(response) {
                    if (response.success) {
                        const patient = response.patient;
                        $('#patientName').text(patient.name || '-');
                        $('#patientId').text(patient.patient_id || '-');
                        $('#patientMobile').text(patient.mobile || '-');
                        $('#patientEmail').text(patient.email || '-');
                        $('#patientGender').text(patient.gender || '-');
                        $('#patientAge').text(patient.age || '-');
                        $('#patientDob').text(patient.dob || '-');
                        $('#patientDetailsCard').show();
                    } else {
                        $('#patientDetailsCard').hide();
                        showNotification('Patient not found!', 'error');
                    }
                },
                error: function() {
                    showNotification('Error fetching patient details!', 'error');
                }
            });
        }

        function addNewVendor() {
            const id = $('#vendorIdInput').val();
            const name = $('#vendorNameInput').val().trim();
            const mobile = $('#vendorMobileInput').val().trim();
            const email = $('#vendorEmailInput').val().trim();
            const address = $('#vendorAddressInput').val().trim();
            
            if (!name || !mobile || !email || !address) {
                showNotification('Please fill all fields!', 'warning');
                return;
            }

            const url = id ? `{{ url('doctor/vendors') }}/${id}` : "{{ route('doctor.vendors.add') }}";
            const type = id ? "PUT" : "POST";

            $.ajax({
                url: url,
                type: type,
                data: {
                    name: name,
                    mobile: mobile,
                    email: email,
                    address: address,
                    _token: $('meta[name="csrf-token"]').attr('content')
                },
                success: function(response) {
                    if (response.success) {
                        $('#addVendorModal').modal('hide');
                        $('#addVendorForm')[0].reset();
                        fetchInitialData(); // Refresh data
                        if (id && selectedVendor && selectedVendor.id == id) {
                            // Update selected vendor display if it was edited
                            selectedVendor = { ...selectedVendor, name, mobile, email, address };
                            displayVendorDetails(selectedVendor);
                        }
                        showNotification(response.message, 'success');
                    } else {
                        showNotification('Failed to save vendor!', 'error');
                    }
                },
                error: function(xhr) {
                    showNotification('Error saving vendor: ' + (xhr.responseJSON?.message || 'Unknown error'), 'error');
                }
            });
        }
        function deleteVendorById(id) {
            if (confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
                $.ajax({
                    url: `{{ url('doctor/vendors') }}/${id}`,
                    type: "DELETE",
                    data: {
                        _token: $('meta[name="csrf-token"]').attr('content')
                    },
                    success: function(response) {
                        if (response.success) {
                            showNotification(response.message, 'success');
                            selectedVendor = null;
                            $('#vendorName').text('-');
                            $('#vendorNumber').text('-');
                            $('#vendorEmail').text('-');
                            $('#vendorAddress').text('-');
                            $('#vendorAction').empty();
                            $('#vendorDetailsTable').hide();
                            $('#vendorSelect').val(null).trigger('change');
                            fetchInitialData();
                        } else {
                            showNotification('Failed to delete vendor!', 'error');
                        }
                    },
                    error: function(xhr) {
                        showNotification('Error deleting vendor: ' + (xhr.responseJSON?.message || 'Unknown error'), 'error');
                    }
                });
            }
        }

        function prepareAddTest() {
            $('#testIdInput').val('');
            $('#testNameInput').val('');
            $('#testDescriptionInput').val('');
            $('#testPriceInput').val('');
            $('#staticBackdropLabel').text('Add Our Test');
            $('#saveTestBtn').text('Add Test');
            $('#addTestModal').modal('show');
        }

        function editTestById(id) {
            const test = tests.find(t => t.id == id);
            if (test) {
                $('#testIdInput').val(test.id);
                $('#testNameInput').val(test.name);
                $('#testDescriptionInput').val(test.description || '');
                $('#testPriceInput').val(test.price);
                $('#staticBackdropLabel').text('Edit Test');
                $('#saveTestBtn').text('Update Test');
                $('#addTestModal').modal('show');
            }
        }

        function saveTest() {
            const id = $('#testIdInput').val();
            const name = $('#testNameInput').val().trim();
            const description = $('#testDescriptionInput').val().trim();
            const price = $('#testPriceInput').val().trim();
            
            if (!name || !price) {
                showNotification('Please fill all required fields!', 'warning');
                return;
            }

            const url = id ? `{{ url('doctor/tests') }}/${id}` : "{{ route('doctor.tests.add') }}";
            const type = id ? "PUT" : "POST";

            $.ajax({
                url: url,
                type: type,
                data: {
                    name: name,
                    description: description,
                    price: price,
                    _token: $('meta[name="csrf-token"]').attr('content')
                },
                success: function(response) {
                    if (response.success) {
                        $('#addTestModal').modal('hide');
                        fetchInitialData(); // Refresh data
                        
                        // If it was an edit, update any occurrences in the selected tests table
                        if (id) {
                            selectedTests = selectedTests.map(t => {
                                if (t.id == id) {
                                    return { ...t, name, price };
                                }
                                return t;
                            });
                            updateTestTable();
                        }
                        
                        showNotification(response.message, 'success');
                    } else {
                        showNotification('Failed to save test!', 'error');
                    }
                },
                error: function(xhr) {
                    showNotification('Error saving test: ' + (xhr.responseJSON?.message || 'Unknown error'), 'error');
                }
            });
        }
        // Hide dropdowns when clicking outside
        $(document).click(function(e) {
            if (!$(e.target).closest('#registration_id, #suggestion-box').length) {
                $('#suggestion-box').empty().hide();
            }
            if (!$(e.target).closest('#mobile, #suggestion-box-mobile').length) {
                $('#suggestion-box-mobile').empty().hide();
            }
        });
    </script>
</body>
</html>