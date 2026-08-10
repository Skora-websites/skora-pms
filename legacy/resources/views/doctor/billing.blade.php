<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Billing Management</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @include('doctor.inc.header-links')
    @include('doctor.inc.custom')
</head>
<body>
    <div class="main-wrapper">
        @include('doctor.inc.header')
        @include('doctor.inc.sidebar')
        <div class="page-wrapper">
            <div class="content">
                <div class="border-bottom">
                    <h4 class="fw-bold color-doctorrx">Manage  Billing</h4>
                </div>
                <!-- Patient Search Section -->
                <div class="card">
                    <div class="row p-2">
                        <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
                            <h5 class="fw-bold color-doctorrx mb-0">Search patient for add Bill</h5>
                            <a href="javascript:void(0);" class="btn btn-outline-primary fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#addbillingtype">
                                <i class="ti ti-plus me-1"></i> Add Bill type
                            </a>
                        </div>
                        <div class="row align-items-end">
                            <div class="col-md-4">
                                <div class="mb-3 position-relative">
                                    <input type="text" id="registration_id" name="registration_id" class="form-control" placeholder="Enter Or Type Registration ID..." autocomplete="off">
                                    <ul id="suggestion-box" class="suggestion-box list-group mt-1 position-absolute bg-white border shadow w-100 z-3"></ul>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3 position-relative">
                                    <input type="text" id="mobile" name="mobile" class="form-control" placeholder="Enter Mobile number will auto-fill" autocomplete="off" minlength="10" maxlength="10">
                                    <ul id="suggestion-box-mobile" class="suggestion-box list-group mt-1 position-absolute bg-white border shadow w-100 z-3"></ul>
                                </div>
                            </div>
                            <div class="col-md-4 d-flex justify-content-end">
                                <div class="mb-3"></div>
                            </div>
                        </div>
                        <!-- Patient Details Section -->
                        <div class="mt-2" id="patientDetailsCard" style="display: none;">
                            <div class="card-body px-4 py-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h5 class="fw-bold color-doctorrx mb-0">Patient Detail</h5>
                                    <a href="javascript:void(0);" class="btn btn-outline-primary fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#addbillingdetails" id="addBillBtn">
                                        <i class="ti ti-plus me-1"></i> Add New Bill
                                    </a>
                                </div>
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
                    </div>
                </div>
                <!-- Show Total Billing Section -->
                <div class="card mt-3">
                    <h5 class="ps-3 fw-bold mt-4 color-doctorrx">Show Total Billing</h5>
                    <div class="p-3 d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                        <div class="d-flex align-items-center gap-2">
                            <div class="d-flex right-content align-items-center flex-wrap">
                                <div class="input-icon-start position-relative">
                                    <span class="input-icon-addon text-dark">
                                        <i class="ti ti-calendar-event"></i>
                                    </span>
                                    <input type="text" class="form-control form-control-sm date-input bookingrange" placeholder="Select Date Range">
                                </div>
                            </div>
                            <div class="search-set">
                                <div class="d-flex align-items-center flex-wrap gap-2">
                                    <div class="table-search d-flex align-items-center mb-0">
                                        <div class="search-input">
                                            <input type="text" id="searchName" class="form-control p-3" placeholder="Search by Name">
                                        </div>
                                        <div class="search-input ms-2">
                                            <input type="text" id="searchPhone" class="form-control p-3" placeholder="Search by Phone">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-end d-flex">
                            <div class="dropdown me-1">
                                <a href="javascript:void(0);" class="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center" data-bs-toggle="dropdown" style="padding: 7px 19px;">
                                    Export<i class="ti ti-chevron-down ms-2"></i>
                                </a>
                                <ul class="dropdown-menu p-2">
                                    <li><a class="dropdown-item" href="#" id="exportExcel">Download as Excel</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                        <table class="table datatable">
                            <thead class="table-light">
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Patient</th>
                                    <th>Billing Type</th>
                                    <th>Total Amount</th>
                                    <th>Received</th>
                                    <th>Pending</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="billingTableBody"></tbody>
                        </table>
                        <div class="d-flex justify-content-end mt-4" id="pagination"></div>
                </div>
            </div>
            @include('doctor.inc.footer')
        </div>
        <div class="modal fade" id="addbillingtype" tabindex="-1" aria-labelledby="addbillingtypeLabel" aria-hidden="true">
            <div class="modal-dialog modal-md">
                <div class="modal-content">
                    <div class="modal-header rounded border-0">
                        <h4 class="modal-title fw-bold d-flex align-items-center gap-2" id="addbillingtypeLabel" style="color: #0e606e; font-weight: 700;">
                            Create New Billing type
                        </h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="billtypeForm">
                            @csrf
                            <div class="row">
                                <div class="mb-3">
                                    <label class="form-label">Billing Type Name</label>
                                    <input type="text" name="name" class="form-control" placeholder="Enter billing type name" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Default Amount(Optional)</label>
                                    <input type="number" name="default_amount" class="form-control" placeholder="Enter default amount" step="0.01">
                                </div>
                            </div>
                            <div class="modal-footer pt-1 pb-0">
                                <button type="button" class="btn btn-outline-primary" id="submitBillingType">Save Billing Type</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <!-- Add Billing Details Modal -->
        <div class="modal fade" id="addbillingdetails" tabindex="-1" aria-labelledby="addbillingdetailsLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header rounded border-0">
                        <h4 class="modal-title fw-bold d-flex align-items-center gap-2" id="addbillingdetailsLabel" style="color: #0e606e; font-weight: 700;">
                            Billing Records
                        </h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="billingForm">
                            @csrf
                            <input type="hidden" id="selectedPatientId" name="patient_id">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Billing Type</label>
                                        <select class="form-select" id="billingTypeSelect" name="billing_type_id" required>
                                            <option value="">Select Billing Type ...</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="mb-3">
                                        <label class="form-label">Total Amount</label>
                                        <input type="number" id="totalAmount" name="total_amount" class="form-control" placeholder="Total Amount" step="0.01" required>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="mb-3">
                                        <label class="form-label">Received Amount</label>
                                        <input type="number" id="receivedAmount" name="received_amount" class="form-control" placeholder="Received Amount" step="0.01" required>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="mb-3">
                                        <label class="form-label">Pending Amount</label>
                                        <input type="text" id="pendingAmount" name="pending_amount" class="form-control" placeholder="Pending Amount" readonly>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="mb-3">
                                        <label class="form-label">Notes</label>
                                        <textarea name="notes" class="form-control" rows="3" placeholder="Additional notes (optional)"></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="card-title color-doctorrx mb-0">Select Payment Method</h6>
                                </div>
                                <div class="card-body">
                                    <div class="payment-method-card">
                                        <div class="row">
                                            <div class="col-md-5">
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
                                            <div class="col-md-7">
                                                <div id="paymentFieldsContainer">
                                                    <div id="upiFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">UPI Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">UPI ID</label>
                                                            <input type="text" class="form-control" name="payment_details[upi_id]" placeholder="Enter UPI ID">
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction Date</label>
                                                            <input type="date" class="form-control" name="payment_details[transaction_date]">
                                                        </div>
                                                    </div>
                                                    <div id="cashFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Cash Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Payment Date</label>
                                                            <input type="date" class="form-control" name="payment_details[payment_date]">
                                                        </div>
                                                    </div>
                                                    <div id="cardFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Card Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Card Number</label>
                                                            <input type="text" class="form-control" name="payment_details[card_number]" placeholder="Enter card number">
                                                        </div>
                                                        <div class="row mb-3">
                                                            <div class="col-md-6">
                                                                <label class="form-label">Expiry Date</label>
                                                                <input type="month" class="form-control" name="payment_details[expiry]">
                                                            </div>
                                                            <div class="col-md-6">
                                                                <label class="form-label">CVV</label>
                                                                <input type="text" class="form-control" name="payment_details[cvv]" placeholder="CVV">
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div id="netbankingFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Net Banking Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Bank Name</label>
                                                            <select class="form-select" name="payment_details[bank_name]">
                                                                <option value="">Select bank</option>
                                                                <option>State Bank of India</option>
                                                                <option>HDFC Bank</option>
                                                                <option>ICICI Bank</option>
                                                                <option>Axis Bank</option>
                                                            </select>
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction ID</label>
                                                            <input type="text" class="form-control" name="payment_details[transaction_id]" placeholder="Enter transaction ID">
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction Date</label>
                                                            <input type="date" class="form-control" name="payment_details[transaction_date]">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer pt-1 pb-0">
                                <button type="button" class="btn btn-outline-primary" id="submitBilling">Submit Bill</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <!-- View Billing Details Modal -->
        <div class="modal fade" id="viewBillingDetails" tabindex="-1" aria-labelledby="viewBillingDetailsLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header rounded border-0">
                        <h4 class="modal-title fw-bold d-flex align-items-center gap-2 color-doctorrx" id="viewBillingDetailsLabel">
                            <i class="ti ti-file-invoice me-1"></i> Billing Details
                        </h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row gy-2">
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-user text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Patient Name:</span>
                                    <span id="viewPatientName">-</span>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-user text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Patient ID:</span>
                                    <span id="viewPatientId">-</span>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-phone text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Mobile No.:</span>
                                    <span id="viewPatientMobile">-</span>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-file-invoice text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Billing Type:</span>
                                    <span id="viewBillingType">-</span>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-currency-rupee text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Total Amount:</span>
                                    <span id="viewTotalAmount">-</span>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-currency-rupee text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Received Amount:</span>
                                    <span id="viewReceivedAmount">-</span>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-currency-rupee text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Pending Amount:</span>
                                    <span id="viewPendingAmount">-</span>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-credit-card text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Payment Method:</span>
                                    <span id="viewPaymentMethod">-</span>
                                </div>
                            </div>
                            <div class="col-lg-12">
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <h6 class="card-title color-doctorrx mb-0">Payment Details</h6>
                                    </div>
                                    <div class="card-body" id="viewPaymentDetails"></div>
                                </div>
                            </div>
                            <div class="col-lg-12">
                                <div class="d-flex align-items-start">
                                    <i class="ti ti-note text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Notes:</span>
                                    <span id="viewNotes" style="white-space: pre-wrap;">-</span>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="d-flex align-items-center">
                                    <i class="ti ti-calendar text-info me-2"></i>
                                    <span class="fw-semibold me-1" style="color: #172c75;">Created At:</span>
                                    <span id="viewCreatedAt">-</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer pt-1 pb-0">
                        <button type="button" class="btn btn-outline-primary btn-md fs-13" data-bs-dismiss="modal">
                            <i class="ti ti-x me-1"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Edit Billing Details Modal -->
        <div class="modal fade" id="editBillingDetails" tabindex="-1" aria-labelledby="editBillingDetailsLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header rounded border-0">
                        <h4 class="modal-title fw-bold d-flex align-items-center gap-2 color-doctorrx" id="editBillingDetailsLabel">
                            <i class="ti ti-edit me-1"></i> Edit Billing Records
                        </h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editBillingForm">
                            @csrf
                            <input type="hidden" id="editBillingId" name="billing_id">
                            <input type="hidden" id="editPatientId" name="patient_id">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Billing Type</label>
                                        <select class="form-select" id="editBillingTypeSelect" name="billing_type_id" required>
                                            <option value="">Select Billing Type ...</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="mb-3">
                                        <label class="form-label">Total Amount</label>
                                        <input type="number" id="editTotalAmount" name="total_amount" class="form-control" placeholder="Total Amount" step="0.01" required>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="mb-3">
                                        <label class="form-label">Received Amount</label>
                                        <input type="number" id="editReceivedAmount" name="received_amount" class="form-control" placeholder="Received Amount" step="0.01" required>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="mb-3">
                                        <label class="form-label">Pending Amount</label>
                                        <input type="text" id="editPendingAmount" name="pending_amount" class="form-control" placeholder="Pending Amount" readonly>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="mb-3">
                                        <label class="form-label">Notes</label>
                                        <textarea name="notes" id="editNotes" class="form-control" rows="3" placeholder="Additional notes (optional)"></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="card-title color-doctorrx mb-0">Select Payment Method</h6>
                                </div>
                                <div class="card-body">
                                    <div class="payment-method-card">
                                        <div class="row">
                                            <div class="col-md-5">
                                                <label for="editPaymentUpi" class="mb-0 w-100">
                                                    <div class="payment-option" onclick="selectEditPaymentMethod('upi')">
                                                        <input type="radio" id="editPaymentUpi" name="editPaymentMethod" value="upi">
                                                        <i class="ti ti-brand-google-pay me-2"></i> UPI Payment
                                                    </div>
                                                </label>
                                                <label for="editPaymentCash" class="mb-0 w-100">
                                                    <div class="payment-option" onclick="selectEditPaymentMethod('cash')">
                                                        <input type="radio" id="editPaymentCash" name="editPaymentMethod" value="cash">
                                                        <i class="ti ti-cash me-2"></i> Cash
                                                    </div>
                                                </label>
                                                <label for="editPaymentCard" class="mb-0 w-100">
                                                    <div class="payment-option" onclick="selectEditPaymentMethod('card')">
                                                        <input type="radio" id="editPaymentCard" name="editPaymentMethod" value="card">
                                                        <i class="ti ti-credit-card me-2"></i> Card
                                                    </div>
                                                </label>
                                                <label for="editPaymentNetbanking" class="mb-0 w-100">
                                                    <div class="payment-option" onclick="selectEditPaymentMethod('netbanking')">
                                                        <input type="radio" id="editPaymentNetbanking" name="editPaymentMethod" value="netbanking">
                                                        <i class="ti ti-building-bank me-2"></i> Net Banking
                                                    </div>
                                                </label>
                                            </div>
                                            <div class="col-md-7">
                                                <div id="editPaymentFieldsContainer">
                                                    <div id="editUpiFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">UPI Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">UPI ID</label>
                                                            <input type="text" class="form-control" id="editUpiId" name="payment_details[upi_id]" placeholder="Enter UPI ID">
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction Date</label>
                                                            <input type="date" class="form-control" id="editUpiTransactionDate" name="payment_details[transaction_date]">
                                                        </div>
                                                    </div>
                                                    <div id="editCashFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Cash Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Payment Date</label>
                                                            <input type="date" class="form-control" id="editCashPaymentDate" name="payment_details[payment_date]">
                                                        </div>
                                                    </div>
                                                    <div id="editCardFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Card Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Card Number</label>
                                                            <input type="text" class="form-control" id="editCardNumber" name="payment_details[card_number]" placeholder="Enter card number">
                                                        </div>
                                                        <div class="row mb-3">
                                                            <div class="col-md-6">
                                                                <label class="form-label">Expiry Date</label>
                                                                <input type="month" class="form-control" id="editCardExpiry" name="payment_details[expiry]">
                                                            </div>
                                                            <div class="col-md-6">
                                                                <label class="form-label">CVV</label>
                                                                <input type="text" class="form-control" id="editCardCvv" name="payment_details[cvv]" placeholder="CVV">
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div id="editNetbankingFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Net Banking Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Bank Name</label>
                                                            <select class="form-select" id="editBankName" name="payment_details[bank_name]">
                                                                <option value="">Select bank</option>
                                                                <option>State Bank of India</option>
                                                                <option>HDFC Bank</option>
                                                                <option>ICICI Bank</option>
                                                                <option>Axis Bank</option>
                                                            </select>
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction ID</label>
                                                            <input type="text" class="form-control" id="editTransactionId" name="payment_details[transaction_id]" placeholder="Enter transaction ID">
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction Date</label>
                                                            <input type="date" class="form-control" id="editNetbankingTransactionDate" name="payment_details[transaction_date]">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer pt-1 pb-0">
                                <button type="button" class="btn btn-outline-primary btn-md fs-13" id="submitEditBilling">
                                    <i class="ti ti-check me-1"></i> Update Bill
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <!-- Delete Confirmation Modal -->
        <div class="modal fade" id="deleteBillingConfirm" tabindex="-1" aria-labelledby="deleteBillingConfirmLabel" aria-hidden="true">
            <div class="modal-dialog modal-md">
                <div class="modal-content">
                    <div class="modal-header rounded border-0">
                        <h4 class="modal-title fw-bold d-flex align-items-center gap-2 color-doctorrx" id="deleteBillingConfirmLabel">
                            <i class="ti ti-trash me-1"></i> Confirm Deletion
                        </h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this billing record? This action cannot be undone.</p>
                        <input type="hidden" id="deleteBillingId">
                    </div>
                    <div class="modal-footer pt-1 pb-0">
                        <button type="button" class="btn btn-outline-secondary btn-md fs-13" data-bs-dismiss="modal">
                            <i class="ti ti-x me-1"></i> Cancel
                        </button>
                        <button type="button" class="btn btn-danger btn-md fs-13" id="confirmDeleteBilling">
                            <i class="ti ti-trash me-1"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Toast Container for Notifications -->
    <div class="toast-container" id="toastContainer"></div>
    @include('doctor.inc.footer-links')
    <script>
        $(document).ready(function () {
            // Initialize variables
            let selectedPatient = null;
            let currentPage = 1;
            let selectedStartDate = null;
            let selectedEndDate = null;
            const csrfToken = $('meta[name="csrf-token"]').attr('content');
 
            // Helper to format pending amount with + for overpayments
            function formatPendingAmount(amount) {
                amount = parseFloat(amount);
                if (isNaN(amount)) return '₹0.00';
                if (amount < 0) {
                    return `₹+${Math.abs(amount).toFixed(2)}`;
                }
                return `₹${amount.toFixed(2)}`;
            }

            // Load initial data
            loadBillingTypes();
            loadBillings();

            // Debounce utility
            function debounce(func, wait) {
                let timeout;
                return function (...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            }

            // DateRangePicker Configuration
            $('.bookingrange').daterangepicker({
                opens: 'right',
                autoApply: false,
                alwaysShowCalendars: true,
                showDropdowns: true,
                locale: {
                    format: 'DD MMM YYYY'
                },
                ranges: {
                    'Till Date': [moment("2000-01-01"), moment()],
                    'Today': [moment(), moment()],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                    'Custom Range': []
                }
            }, function(start, end, label) {
                $('.bookingrange').val(start.format('DD MMM YYYY') + ' - ' + end.format('DD MMM YYYY'));
                selectedStartDate = start.format('YYYY-MM-DD');
                selectedEndDate = end.format('YYYY-MM-DD');
                currentPage = 1;
                loadBillings();
            });

            // Patient Search Handlers
            $('#registration_id').on('keyup', debounce(function () {
                const query = $(this).val().trim();
                if (query.length < 2) {
                    $('#suggestion-box').empty().hide();
                    return;
                }
                $.ajax({
                    url: "{{ route('get.registration.suggestions') }}",
                    type: 'GET',
                    data: { query },
                    success: function (data) {
                        $('#suggestion-box').empty();
                        if (data?.length) {
                            data.forEach(item => {
                                const phone = item.phone || '';
                                const registration_id = item.registration_id || '';
                                const name = item.name || 'Unknown';
                                if (registration_id) {
                                    $('#suggestion-box').append(
                                        `<li class="list-group-item" data-mobile="${phone}" data-registration="${registration_id}">
                                            ${registration_id} --- ${name}
                                        </li>`
                                    );
                                }
                            });
                        } else {
                            $('#suggestion-box').append('<li class="list-group-item text-muted">No match found</li>');
                        }
                        $('#suggestion-box').show();
                    },
                    error: () => showNotification('Error fetching suggestions!', 'error')
                });
            }, 300));

            $('#mobile').on('keyup', debounce(function () {
                const query = $(this).val().trim();
                if (query.length < 2) {
                    $('#suggestion-box-mobile').empty().hide();
                    return;
                }
                $.ajax({
                    url: "{{ route('get.mobile.suggestions') }}",
                    type: 'GET',
                    data: { query },
                    success: function (data) {
                        $('#suggestion-box-mobile').empty();
                        if (data?.length) {
                            data.forEach(item => {
                                const phone = item.phone || '';
                                const registration_id = item.registration_id || '';
                                const name = item.name || 'Unknown';
                                if (phone && registration_id) {
                                    $('#suggestion-box-mobile').append(
                                        `<li class="list-group-item" data-mobile="${phone}" data-registration="${registration_id}">
                                            ${phone} --- ${name}
                                        </li>`
                                    );
                                }
                            });
                        } else {
                            $('#suggestion-box-mobile').append('<li class="list-group-item text-muted">No match found</li>');
                        }
                        $('#suggestion-box-mobile').show();
                    },
                    error: () => showNotification('Error fetching mobile suggestions!', 'error')
                });
            }, 300));

            // Select Suggestion Handlers
            $(document).on('mousedown', '#suggestion-box li', function (e) {
            e.preventDefault();
            if ($(this).hasClass('text-muted')) return;
            
            const registration = $(this).data('registration') || $(this).text().split(' --- ')[0];
            const mobile = $(this).data('mobile');
            
            $('#registration_id').val(registration).trigger('change');
            $('#mobile').val(mobile).trigger('change');
            $('#suggestion-box').empty().hide();
            
            fetchPatientDetails('registration_id', registration);
        });

        $(document).on('mousedown', function (e) {
            if (!$(e.target).closest('#registration_id, #suggestion-box, #mobile').length) {
                $('#suggestion-box').empty().hide();
            }
        });

            $(document).on('mousedown', '#suggestion-box-mobile li', function (e) {
                e.preventDefault();
                if ($(this).hasClass('text-muted')) return;
                const mobile = $(this).data('mobile');
                const registration = $(this).data('registration');
                $('#mobile').val(mobile);
                $('#registration_id').val(registration);
                $('#suggestion-box-mobile').empty().hide();
                fetchPatientDetails('mobile', mobile);
            });

            // Fetch Patient Details
            function fetchPatientDetails(type, value) {
                $.ajax({
                    url: "{{ route('get.patient.details') }}",
                    type: 'GET',
                    data: { type, value },
                    success: function ({ success, patient, message }) {
                        if (success) {
                            $('#patientName').text(patient.name || '-');
                            $('#patientId').text(patient.patient_id || '-');
                            $('#patientMobile').text(patient.mobile || '-');
                            $('#patientEmail').text(patient.email || '-');
                            $('#patientGender').text(patient.gender || '-');
                            $('#patientAge').text(patient.age || '-');
                            $('#patientDob').text(patient.dob || '-');
                            $('#selectedPatientId').val(patient.id);
                            $('#patientDetailsCard').show();
                            selectedPatient = patient;
                        } else {
                            $('#patientDetailsCard').hide();
                            showNotification(message || 'Patient not found!', 'error');
                        }
                    },
                    error: () => showNotification('Error fetching patient details!', 'error')
                });
            }

            // Payment Method Handlers
            $('input[name="paymentMethod"]').on('change', function () {
                selectPaymentMethod($(this).val());
            });

            $('input[name="editPaymentMethod"]').on('change', function () {
                selectEditPaymentMethod($(this).val());
            });

            // Amount Calculation
            $('#totalAmount, #receivedAmount').on('input', function () {
                const total = parseFloat($('#totalAmount').val()) || 0;
                const received = parseFloat($('#receivedAmount').val()) || 0;
                const pending = total - received;
                $('#pendingAmount').val(pending < 0 ? `+${Math.abs(pending).toFixed(2)}` : pending.toFixed(2));
            });
 
            $('#editTotalAmount, #editReceivedAmount').on('input', function () {
                const total = parseFloat($('#editTotalAmount').val()) || 0;
                const received = parseFloat($('#editReceivedAmount').val()) || 0;
                const pending = total - received;
                $('#editPendingAmount').val(pending < 0 ? `+${Math.abs(pending).toFixed(2)}` : pending.toFixed(2));
            });

            // Billing Type Change Handler
            $('#billingTypeSelect').on('change', function () {
                const defaultAmount = $(this).find('option:selected').data('default-amount');
                if (defaultAmount) {
                    $('#totalAmount').val(defaultAmount);
                    $('#totalAmount, #receivedAmount').trigger('input');
                }
            });

            $('#editBillingTypeSelect').on('change', function () {
                const defaultAmount = $(this).find('option:selected').data('default-amount');
                if (defaultAmount) {
                    $('#editTotalAmount').val(defaultAmount);
                    $('#editTotalAmount, #editReceivedAmount').trigger('input');
                }
            });

            // Form Submission Handlers
            $('#submitBillingType').on('click', function () {
                const name = $('input[name="name"]').val().trim();
                const default_amount = $('input[name="default_amount"]').val().trim();
                if (!name) return showNotification('Billing type name is required!', 'error');
                if (default_amount && default_amount < 0) return showNotification('Valid default amount is required!', 'error');

                const formData = new FormData();
                formData.append('_token', csrfToken);
                formData.append('name', name);
                if (default_amount) formData.append('default_amount', default_amount);

                $.ajax({
                    url: "{{ route('billing-types.store') }}",
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function ({ success, message }) {
                        if (success) {
                            $('#addbillingtype').modal('hide');
                            $('#billtypeForm')[0].reset();
                            loadBillingTypes();
                            showNotification(message, 'success');
                        } else {
                            showNotification(message || 'Error creating billing type!', 'error');
                        }
                    },
                    error: ({ responseJSON }) => showNotification(responseJSON?.message || 'Error creating billing type!', 'error')
                });
            });

            $('#submitBilling').on('click', function () {
                if (!selectedPatient) return showNotification('Please select a patient!', 'error');

                const billingTypeId = $('#billingTypeSelect').val();
                const totalAmount = parseFloat($('#totalAmount').val()) || 0;
                const receivedAmount = parseFloat($('#receivedAmount').val()) || 0;
                const paymentMethod = $('input[name="paymentMethod"]:checked').val();

                if (!billingTypeId) return showNotification('Please select billing type!', 'error');
                if (totalAmount <= 0) return showNotification('Please enter valid total amount!', 'error');
                if (receivedAmount < 0) return showNotification('Please enter valid received amount!', 'error');
                if (!paymentMethod) return showNotification('Please select payment method!', 'error');

                const paymentFields = $(`#${paymentMethod}Fields`);
                let paymentDetails = {};
                let isValid = true;
                paymentFields.find('input, select').each(function () {
                    const fieldName = $(this).attr('name')?.replace('payment_details[', '').replace(']', '');
                    const fieldValue = $(this).val();
                    if ($(this).prop('required') && !fieldValue) {
                        isValid = false;
                        $(this).addClass('is-invalid');
                    } else if (fieldValue) {
                        $(this).removeClass('is-invalid');
                        paymentDetails[fieldName] = fieldValue;
                    }
                });

                if (!isValid) return showNotification('Please fill all required payment details!', 'error');
                if (Object.keys(paymentDetails).length === 0) return showNotification('Please provide payment details!', 'error');

                const formData = new FormData();
                formData.append('_token', csrfToken);
                formData.append('patient_id', $('#selectedPatientId').val());
                formData.append('billing_type_id', billingTypeId);
                formData.append('total_amount', totalAmount);
                formData.append('received_amount', receivedAmount);
                formData.append('payment_method', paymentMethod);
                formData.append('payment_details', JSON.stringify(paymentDetails));
                formData.append('notes', $('textarea[name="notes"]').val());

                $.ajax({
                    url: "{{ route('billings.store') }}",
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function ({ success, message }) {
                        if (success) {
                            $('#addbillingdetails').modal('hide');
                            $('#billingForm')[0].reset();
                            $('.payment-fields').removeClass('active');
                            $('.payment-option').removeClass('selected');
                            $('input[name="paymentMethod"]').prop('checked', false);
                            loadBillings();
                            showNotification(message, 'success');
                        } else {
                            showNotification(message || 'Error creating bill!', 'error');
                        }
                    },
                    error: ({ responseJSON }) => showNotification(responseJSON?.message || 'Error creating bill!', 'error')
                });
            });

            $('#submitEditBilling').on('click', function () {
                const billingId = $('#editBillingId').val();
                const billingTypeId = $('#editBillingTypeSelect').val();
                const totalAmount = parseFloat($('#editTotalAmount').val()) || 0;
                const receivedAmount = parseFloat($('#editReceivedAmount').val()) || 0;
                const paymentMethod = $('input[name="editPaymentMethod"]:checked').val();

                if (!billingTypeId) return showNotification('Please select billing type!', 'error');
                if (totalAmount <= 0) return showNotification('Please enter valid total amount!', 'error');
                if (receivedAmount < 0) return showNotification('Please enter valid received amount!', 'error');
                if (!paymentMethod) return showNotification('Please select payment method!', 'error');

                const paymentFields = $(`#edit${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}Fields`);
                let paymentDetails = {};
                let isValid = true;
                paymentFields.find('input, select').each(function () {
                    const fieldName = $(this).attr('name')?.replace('payment_details[', '').replace(']', '');
                    const fieldValue = $(this).val();
                    if ($(this).prop('required') && !fieldValue) {
                        isValid = false;
                        $(this).addClass('is-invalid');
                    } else if (fieldValue) {
                        $(this).removeClass('is-invalid');
                        paymentDetails[fieldName] = fieldValue;
                    }
                });

                if (!isValid) return showNotification('Please fill all required payment details!', 'error');
                if (Object.keys(paymentDetails).length === 0) return showNotification('Please provide payment details!', 'error');

                const formData = new FormData();
                formData.append('_token', csrfToken);
                formData.append('_method', 'PUT');
                formData.append('patient_id', $('#editPatientId').val());
                formData.append('billing_type_id', billingTypeId);
                formData.append('total_amount', totalAmount);
                formData.append('received_amount', receivedAmount);
                formData.append('payment_method', paymentMethod);
                formData.append('payment_details', JSON.stringify(paymentDetails));
                formData.append('notes', $('#editNotes').val());

                $.ajax({
                    url: "{{ route('billings.update', ':id') }}".replace(':id', billingId),
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function ({ success, message }) {
                        if (success) {
                            $('#editBillingDetails').modal('hide');
                            $('#editBillingForm')[0].reset();
                            $('.payment-fields').removeClass('active');
                            $('.payment-option').removeClass('selected');
                            $('input[name="editPaymentMethod"]').prop('checked', false);
                            loadBillings();
                            showNotification(message, 'success');
                        } else {
                            showNotification(message || 'Error updating bill!', 'error');
                        }
                    },
                    error: ({ responseJSON }) => showNotification(responseJSON?.message || 'Error updating bill!', 'error')
                });
            });

            $('#confirmDeleteBilling').on('click', function () {
                const billingId = $('#deleteBillingId').val();
                $.ajax({
                    url: "{{ route('billings.destroy', ':id') }}".replace(':id', billingId),
                    type: 'DELETE',
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                    success: function ({ success, message }) {
                        if (success) {
                            $('#deleteBillingConfirm').modal('hide');
                            loadBillings();
                            showNotification(message, 'success');
                        } else {
                            showNotification(message || 'Error deleting bill!', 'error');
                        }
                    },
                    error: ({ responseJSON }) => showNotification(responseJSON?.message || 'Error deleting bill!', 'error')
                });
            });

            // Billing Table Search and Filter
            $('#searchName, #searchPhone').on('keyup', debounce(() => {
                currentPage = 1;
                loadBillings();
            }, 300));

            // Load Billing Types
            function loadBillingTypes() {
                $.ajax({
                    url: "{{ route('billing-types.get') }}",
                    type: 'GET',
                    success: function (data) {
                        const select = $('#billingTypeSelect, #editBillingTypeSelect').empty().append('<option value="">Select Billing Type ...</option>');
                        data.forEach(type => {
                            select.append(`<option value="${type.id}" data-default-amount="${type.default_amount}">${type.name}</option>`);
                        });
                    },
                    error: () => showNotification('Error loading billing types!', 'error')
                });
            }

            // Load Billings
            function loadBillings() {
                const filters = {
                    search_name: $('#searchName').val().trim(),
                    search_phone: $('#searchPhone').val().trim(),
                    page: currentPage
                };
                if (selectedStartDate && selectedEndDate) {
                    filters.start_date = selectedStartDate;
                    filters.end_date = selectedEndDate;
                }

                $.ajax({
                    url: "{{ route('billings.get') }}",
                    type: 'GET',
                    data: filters,
                    success: function ({ success, data, pagination }) {
                        if (success) {
                            updateBillingTable(data);
                            updatePagination(pagination);
                        } else {
                            showNotification('Error loading billings!', 'error');
                        }
                    },
                    error: () => showNotification('Error loading billings!', 'error')
                });
            }

            // Update Billing Table
            function updateBillingTable(billings) {
                const tbody = $('#billingTableBody').empty();
                if (!billings.length) {
                    tbody.append(`
                        <tr>
                            <td colspan="10">
                                <div class="card-body text-center py-5">
                                    <i class="ti ti-calendar-x fs-48 text-muted mb-3"></i>
                                    <h5 class="text-muted">No Billing Records Found</h5>
                                    <p class="text-muted">You don’t have any billing records yet.</p>
                                    <a href="javascript:void(0);" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addbillingdetails">
                                        <i class="ti ti-plus me-1"></i> Create First Bill
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `);
                    return;
                }

                billings.forEach(billing => {
                    const statusClass = {
                        paid: 'badge-success',
                        partial: 'badge-warning',
                        pending: 'badge-danger'
                    }[billing.status];
                    const row = `
                        <tr>
                            <td>${new Date(billing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(billing.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="avatar avatar-md me-2">
                                        <img src="${billing.patient.profile_image ? '/storage/' + billing.patient.profile_image : '/assets-doctor/img/profiles/avatar-01.jpg'}" 
                                             alt="${billing.patient.name}" class="rounded-circle">
                                    </div>
                                    <div>
                                        <div class="fw-semibold">${billing.patient.name}</div>
                                        <small class="text-muted">${billing.patient.phone}</small>
                                    </div>
                                </div>
                            </td>
                            <td>${billing.billing_type.name}</td>
                            <td>₹${parseFloat(billing.total_amount).toFixed(2)}</td>
                            <td>₹${parseFloat(billing.received_amount).toFixed(2)}</td>
                            <td><span class="${parseFloat(billing.pending_amount) < 0 ? 'text-success fw-bold' : ''}">${formatPendingAmount(billing.pending_amount)}</span></td>
                            <td><span class="badge ${statusClass}">${billing.status.toUpperCase()}</span></td>
                           
                           
                            <td>
                                <div class="dropdown">
                                    <a href="#" class="text-muted" role="button" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="#" onclick="viewBilling(${billing.id})"><i class="ti ti-eye me-1"></i> View</a></li>
    <li><a class="dropdown-item" href="#" onclick="editBilling(${billing.id})"><i class="ti ti-edit me-1"></i> Edit</a></li>
    <li><a class="dropdown-item" href="#" onclick="printBilling(${billing.id})"><i class="ti ti-printer me-1"></i> Print</a></li>
    <li><a class="dropdown-item text-danger" href="#" onclick="deleteBilling(${billing.id})"><i class="ti ti-trash me-1"></i> Delete</a></li>
</ul>
                                </div>
                            </td>

                          

                        </tr>
                    `;
                    tbody.append(row);
                });
            }

            // Update Pagination
            function updatePagination({ current_page, last_page, total }) {
                const container = $('#pagination').empty();
                if (total <= 10) return;

                let html = '<nav><ul class="pagination">';
                if (current_page > 1) {
                    html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${current_page - 1})">Previous</a></li>`;
                }
                for (let i = 1; i <= last_page; i++) {
                    html += `<li class="page-item ${i === current_page ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                    </li>`;
                }
                if (current_page < last_page) {
                    html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${current_page + 1})">Next</a></li>`;
                }
                html += '</ul></nav>';
                container.html(html);
            }

            // Pagination Handler
            window.changePage = page => {
                currentPage = page;
                loadBillings();
            };

            // View Billing Details
            window.viewBilling = function(billingId) {
                $.ajax({
                    url: "{{ route('billings.show', ':id') }}".replace(':id', billingId),
                    type: 'GET',
                    success: function ({ success, billing, message }) {
                        if (success) {
                            $('#viewPatientName').text(billing.patient.name || '-');
                            $('#viewPatientId').text(billing.patient.registration_id || '-');
                            $('#viewPatientMobile').text(billing.patient.phone || '-');
                            $('#viewBillingType').text(billing.billing_type.name || '-');
                            $('#viewTotalAmount').text('₹' + parseFloat(billing.total_amount).toFixed(2));
                            $('#viewReceivedAmount').text('₹' + parseFloat(billing.received_amount).toFixed(2));
                            $('#viewPendingAmount').text(formatPendingAmount(billing.pending_amount));
                            $('#viewPaymentMethod').text(billing.payment_method.charAt(0).toUpperCase() + billing.payment_method.slice(1));
                            $('#viewNotes').text(billing.notes || '-');
                            $('#viewCreatedAt').text(new Date(billing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' - ' + new Date(billing.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));

                            const paymentDetailsContainer = $('#viewPaymentDetails').empty();
                            const paymentDetails = billing.payment_details || {};
                            if (billing.payment_method === 'upi') {
                                paymentDetailsContainer.append(`
                                    <div class="mb-2"><strong>UPI ID:</strong> ${paymentDetails.upi_id || '-'}</div>
                                    <div><strong>Transaction Date:</strong> ${paymentDetails.transaction_date || '-'}</div>
                                `);
                            } else if (billing.payment_method === 'cash') {
                                paymentDetailsContainer.append(`
                                    <div><strong>Payment Date:</strong> ${paymentDetails.payment_date || '-'}</div>
                                `);
                            } else if (billing.payment_method === 'card') {
                                paymentDetailsContainer.append(`
                                    <div class="mb-2"><strong>Card Number:</strong> ${paymentDetails.card_number || '-'}</div>
                                    <div class="mb-2"><strong>Expiry Date:</strong> ${paymentDetails.expiry || '-'}</div>
                                    <div><strong>CVV:</strong> ${'***'}</div>
                                `);
                            } else if (billing.payment_method === 'netbanking') {
                                paymentDetailsContainer.append(`
                                    <div class="mb-2"><strong>Bank Name:</strong> ${paymentDetails.bank_name || '-'}</div>
                                    <div class="mb-2"><strong>Transaction ID:</strong> ${paymentDetails.transaction_id || '-'}</div>
                                    <div><strong>Transaction Date:</strong> ${paymentDetails.transaction_date || '-'}</div>
                                `);
                            }

                            $('#viewBillingDetails').modal('show');
                        } else {
                            showNotification(message || 'Error fetching billing details!', 'error');
                        }
                    },
                    error: () => showNotification('Error fetching billing details!', 'error')
                });
            };

            // Edit Billing Details
            window.editBilling = function(billingId) {
                $.ajax({
                    url: "{{ route('billings.show', ':id') }}".replace(':id', billingId),
                    type: 'GET',
                    success: function ({ success, billing, message }) {
                        if (success) {
                            $('#editBillingId').val(billing.id);
                            $('#editPatientId').val(billing.patient_id);
                            $('#editBillingTypeSelect').val(billing.billing_type_id);
                            $('#editTotalAmount').val(billing.total_amount);
                            $('#editReceivedAmount').val(billing.received_amount);
                            const pending = billing.total_amount - billing.received_amount;
                            $('#editPendingAmount').val(pending < 0 ? `+${Math.abs(pending).toFixed(2)}` : pending.toFixed(2));
                            $('#editNotes').val(billing.notes || '');

                            const paymentMethod = billing.payment_method;
                            $(`#editPayment${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`).prop('checked', true);
                            selectEditPaymentMethod(paymentMethod);

                            const paymentDetails = billing.payment_details || {};
                            $('#editPaymentFieldsContainer').find('input, select').val(''); // Clear all fields
                            if (paymentMethod === 'upi') {
                                $('#editUpiId').val(paymentDetails.upi_id || '');
                                $('#editUpiTransactionDate').val(paymentDetails.transaction_date || '');
                                $('#editUpiFields input').prop('required', true);
                                $('#editCashFields input, #editCardFields input, #editNetbankingFields input, #editNetbankingFields select').prop('required', false);
                            } else if (paymentMethod === 'cash') {
                                $('#editCashPaymentDate').val(paymentDetails.payment_date || '');
                                $('#editCashFields input').prop('required', true);
                                $('#editUpiFields input, #editCardFields input, #editNetbankingFields input, #editNetbankingFields select').prop('required', false);
                            } else if (paymentMethod === 'card') {
                                $('#editCardNumber').val(paymentDetails.card_number || '');
                                $('#editCardExpiry').val(paymentDetails.expiry || '');
                                $('#editCardCvv').val(paymentDetails.cvv || '');
                                $('#editCardFields input').prop('required', true);
                                $('#editUpiFields input, #editCashFields input, #editNetbankingFields input, #editNetbankingFields select').prop('required', false);
                            } else if (paymentMethod === 'netbanking') {
                                $('#editBankName').val(paymentDetails.bank_name || '');
                                $('#editTransactionId').val(paymentDetails.transaction_id || '');
                                $('#editNetbankingTransactionDate').val(paymentDetails.transaction_date || '');
                                $('#editNetbankingFields input, #editNetbankingFields select').prop('required', true);
                                $('#editUpiFields input, #editCashFields input, #editCardFields input').prop('required', false);
                            }

                            $('#editBillingDetails').modal('show');
                        } else {
                            showNotification(message || 'Error fetching billing details!', 'error');
                        }
                    },
                    error: () => showNotification('Error fetching billing details!', 'error')
                });
            };

            // Delete Billing
            window.deleteBilling = function(billingId) {
                $('#deleteBillingId').val(billingId);
                $('#deleteBillingConfirm').modal('show');
            };

            // Hide Suggestions on Outside Click
            $(document).on('click', e => {
                if (!$(e.target).closest('#registration_id, #suggestion-box').length) {
                    $('#suggestion-box').empty().hide();
                }
                if (!$(e.target).closest('#mobile, #suggestion-box-mobile').length) {
                    $('#suggestion-box-mobile').empty().hide();
                }
            });

            // Payment Method Selection
            function selectPaymentMethod(method) {
                $('.payment-option').removeClass('selected');
                $(`input[name="paymentMethod"][value="${method}"]`).closest('.payment-option').addClass('selected');
                $('.payment-fields').removeClass('active');
                $(`#${method}Fields`).addClass('active');
                $('#paymentFieldsContainer').find('input, select').prop('required', false);
                $(`#${method}Fields`).find('input, select').prop('required', true);
            }

            function selectEditPaymentMethod(method) {
                $('.payment-option').removeClass('selected');
                $(`input[name="editPaymentMethod"][value="${method}"]`).closest('.payment-option').addClass('selected');
                $('.payment-fields').removeClass('active');
                $(`#edit${method.charAt(0).toUpperCase() + method.slice(1)}Fields`).addClass('active');
                $('#editPaymentFieldsContainer').find('input, select').prop('required', false);
                $(`#edit${method.charAt(0).toUpperCase() + method.slice(1)}Fields`).find('input, select').prop('required', true);
            }

            // Custom Notification Function
            function showNotification(msg, type = 'success') {
                const alertClass = `alert-${type}`;
                const iconClass = {
                    success: 'fas fa-check-circle text-success',
                    error: 'fas fa-exclamation-circle text-danger',
                    info: 'fas fa-info-circle text-info',
                    warning: 'fas fa-exclamation-triangle text-warning'
                }[type] || 'fas fa-check-circle text-success';

                const alertBox = $(`
                    <div class="custom-alert-box ${alertClass} notification-sidebar position-fixed top-2 show-notification mt-3 shadow-lg rounded">
                        <div class="p-custom">
                            <i class="${iconClass} icon"></i>
                            ${msg}
                            <button type="button" class="close-btn">&times;</button>
                        </div>
                    </div>
                `);

                $('#toastContainer').append(alertBox);
                setTimeout(() => {
                    alertBox.css({ transition: 'right 0.5s ease-in-out, opacity 0.5s ease', right: '-350px', opacity: '0' });
                    setTimeout(() => alertBox.remove(), 500);
                }, 5000);

                alertBox.find('.close-btn').on('click', function () {
                    $(this).closest('.custom-alert-box').remove();
                });
            }
        });





// Print Billing Details as PDF - Optimized A4 Design
window.printBilling = function(billingId) {
    $.ajax({
        url: "{{ route('billings.show', ':id') }}".replace(':id', billingId),
        type: 'GET',
        success: function ({ success, billing, message }) {
            if (success) {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // A4 Page dimensions: 210mm x 297mm
                const pageWidth = 210;
                const pageHeight = 297;
                const margin = 12;
                const contentWidth = pageWidth - (margin * 2);
                
                // Colors
                const primaryColor = [135, 76, 245]; // Purple
                const borderColor = [200, 200, 200];
                const headerBgColor = [248, 249, 250];
                const amountColor = [40, 40, 40]; // Dark for amounts
                
                let yPos = margin;

                function generatePDF() {
                    // Top Header Section - Doctor Information
                    doc.setFillColor(...headerBgColor);
                    doc.rect(margin, yPos, contentWidth, 22, 'F');
                    
                    // Try to add logo
                    try {
                        const logoUrl = "{{ asset('assets-doctor/img/prescription.png') }}";
                        const img = new Image();
                        img.src = logoUrl;
                        doc.addImage(img, 'PNG', margin + 5, yPos + 2, 16, 16);
                    } catch (e) {
                        // Continue without logo
                    }
                    
                    // Doctor Information - Centered
                    doc.setFontSize(16);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...primaryColor);
                    doc.text("MEDICAL BILL", pageWidth / 2, yPos + 8, { align: 'center' });
                    
                    doc.setFontSize(9);
                    doc.setTextColor(80, 80, 80);
                    doc.text("Dr. {{ Auth::user()->name }}", pageWidth / 2, yPos + 14, { align: 'center' });
                    doc.text("MBBS, MD - Consultant Physician", pageWidth / 2, yPos + 18, { align: 'center' });
                    
                    yPos += 40; // Increased space after doctor info

                    // Bill Information - Compact Row
                    doc.setFontSize(8);
                    doc.setTextColor(80, 80, 80);
                    
                    // Left aligned items
                    doc.text("Bill No:", margin + 5, yPos);
                    doc.setFont(undefined, 'bold');
                    doc.text(billing.bill_number || 'N/A', margin + 18, yPos);
                    
                    doc.setFont(undefined, 'normal');
                    doc.text("Bill Date:", margin + 60, yPos);
                    doc.text(new Date(billing.created_at).toLocaleDateString('en-IN'), margin + 78, yPos);
                    
                    // Right aligned items
                    doc.text("Patient ID:", pageWidth - margin - 35, yPos);
                    doc.setFont(undefined, 'bold');
                    doc.text(billing.patient.registration_id || 'N/A', pageWidth - margin - 5, yPos, { align: 'right' });
                    
                    yPos += 10;

                    // Patient Information Section - Optimized
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...primaryColor);
                    doc.text("PATIENT INFORMATION", margin + 5, yPos);
                    
                    yPos += 6;
                    
                    const col1X = margin + 5;
                    const col2X = margin + contentWidth / 2 + 10;
                    
                    doc.setFontSize(8);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(0, 0, 0);
                    
                    // Column 1 - Essential Patient Info
                    doc.text(`Name: ${billing.patient.name || '-'}`, col1X, yPos);
                    doc.text(`Mobile: ${billing.patient.phone || '-'}`, col1X, yPos + 4);
                    
                    // Column 2 - Additional Info
                    doc.text(`Email: ${billing.patient.email || '-'}`, col2X, yPos);
                    doc.text(`Patient ID: ${billing.patient.registration_id || '-'}`, col2X, yPos + 4);
                    
                    yPos += 14;

                    // Billing Summary Section - Professional Table
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...primaryColor);
                    doc.text("BILLING SUMMARY", margin + 5, yPos);
                    
                    yPos += 7;
                    
                    // Table Header with proper spacing
                    doc.setFillColor(...headerBgColor);
                    doc.rect(margin, yPos, contentWidth, 6, 'F');
                    
                    doc.setFontSize(8);
                    doc.setTextColor(0, 0, 0);
                    
                    // Properly spaced columns
                    doc.text("Description", margin + 5, yPos + 4);
                    doc.setCharSpace(-0.3);
                    doc.text("Amount (₹)", margin + contentWidth - 25, yPos + 4, { align: 'right' });
                    yPos += 6;
                    
               // Billing Item - Single line for main service
                    doc.setCharSpace(-0.1);

                const billingType = billing.billing_type.name || 'Medical Consultation & Services';
                doc.text(billingType, margin + 5, yPos + 4);

                // Amount with normal font and focus
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...amountColor);
                doc.text(`₹${parseFloat(billing.total_amount).toFixed(2)}`, margin + contentWidth - 25, yPos + 4, { align: 'right' });
                yPos += 12;

                // Amount Summary - Clear and well-spaced with reduced space
                doc.setDrawColor(...borderColor);
                doc.setLineWidth(0.2);
                doc.line(margin + 110, yPos, margin + contentWidth - 5, yPos);

                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);

                // --- Total Amount ---
                doc.text("Total Amount:", margin + 115, yPos + 4);

                // ↓↓↓ spacing kam sirf amount ke liye ↓↓↓
                doc.setCharSpace(-0.3);
                doc.text(`₹${parseFloat(billing.total_amount).toFixed(2)}`, margin + contentWidth - 25, yPos + 4, { align: 'right' });
                doc.setCharSpace(0); // wapas default

                yPos += 5;

                // --- Received Amount ---
                doc.text("Received Amount:", margin + 115, yPos + 4);
                doc.setCharSpace(-0.3);
                doc.text(`₹${parseFloat(billing.received_amount).toFixed(2)}`, margin + contentWidth - 25, yPos + 4, { align: 'right' });
                doc.setCharSpace(0);

                yPos += 5;

                // --- Pending Amount ---
                doc.setTextColor(220, 53, 69); // Red for pending
                doc.text("Pending Amount:", margin + 115, yPos + 4);
                doc.setCharSpace(-0.3);
                doc.text(`₹${parseFloat(billing.pending_amount).toFixed(2)}`, margin + contentWidth - 25, yPos + 4, { align: 'right' });
                doc.setCharSpace(0);

                doc.setTextColor(0, 0, 0);
                yPos += 14;


                    // Payment Information - Compact
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...primaryColor);
                    doc.text("PAYMENT INFORMATION", margin + 5, yPos);
                    
                    yPos += 6;
                    
                    doc.setFontSize(8);
                    doc.setFont(undefined, 'normal');
                    
                    const paymentMethod = billing.payment_method.charAt(0).toUpperCase() + billing.payment_method.slice(1);
                    const status = billing.status.toUpperCase();
                    const statusColor = billing.status === 'paid' ? [40, 167, 69] : 
                                      billing.status === 'partial' ? [255, 193, 7] : [220, 53, 69];
                    
                    doc.text(`Payment Method: ${paymentMethod}`, col1X, yPos);
                    doc.setTextColor(...statusColor);
                    doc.text(`Status: ${status}`, col2X, yPos);
                    doc.setTextColor(0, 0, 0);
                    
                    yPos += 8;
                    
                    // Payment Details - Only if available
                    const paymentDetails = billing.payment_details || {};
                    if (Object.keys(paymentDetails).length > 0) {
                        doc.setFillColor(...headerBgColor);
                        doc.rect(margin, yPos, contentWidth, 5, 'F');
                        doc.setFont(undefined, 'bold');
                        doc.text("Payment Details", margin + 5, yPos + 3.5);
                        yPos += 14;
                        
                        doc.setFont(undefined, 'normal');
                        
                        if (billing.payment_method === 'upi') {
                            doc.text(`UPI ID: ${paymentDetails.upi_id || '-'}`, col1X, yPos);
                            doc.text(`Date: ${paymentDetails.transaction_date || '-'}`, col2X, yPos);
                        } else if (billing.payment_method === 'cash') {
                            doc.text(`Payment Date: ${paymentDetails.payment_date || '-'}`, col1X, yPos);
                        } else if (billing.payment_method === 'card') {
                            doc.text(`Card: ${paymentDetails.card_number || '-'}`, col1X, yPos);
                            yPos += 4;
                            doc.text(`Expiry: ${paymentDetails.expiry || '-'}`, col1X, yPos);
                        } else if (billing.payment_method === 'netbanking') {
                            doc.text(`Bank: ${paymentDetails.bank_name || '-'}`, col1X, yPos);
                            yPos += 4;
                            doc.text(`Txn ID: ${paymentDetails.transaction_id || '-'}`, col1X, yPos);
                        }
                        
                        yPos += 8;
                    } else {
                        yPos += 4;
                    }

                    // Notes Section - Only if available
                    if (billing.notes && billing.notes.trim() !== '') {
                        doc.setFontSize(9);
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(...primaryColor);
                        doc.text("NOTES", margin + 5, yPos);
                        
                        yPos += 5;
                        
                        doc.setFontSize(8);
                        doc.setFont(undefined, 'normal');
                        doc.setTextColor(0, 0, 0);
                        
                        const splitNotes = doc.splitTextToSize(billing.notes, contentWidth - 10);
                        doc.text(splitNotes, margin + 5, yPos);
                        yPos += (splitNotes.length * 3) + 8;
                    }

                    // Footer Section - Professional with 30px from bottom
                    const footerStartY = pageHeight - margin - 30; // 30px from bottom
                    
                    doc.setDrawColor(...borderColor);
                    doc.setLineWidth(0.3);
                    doc.line(margin, footerStartY, margin + contentWidth, footerStartY);
                    
                    doc.setFontSize(7);
                    doc.setTextColor(100, 100, 100);
                    
                    // Left - Doctor signature area
                    doc.text("Authorized Signature", margin + 5, footerStartY + 6);
                    doc.setFont(undefined, 'bold');
                    doc.text("Dr. {{ Auth::user()->name }}", margin + 5, footerStartY + 10);
                    
                    // Center - Important notes
                    doc.setFont(undefined, 'normal');
                    const centerX = pageWidth / 2;
                    doc.text("This is a computer generated bill", centerX, footerStartY + 6, { align: 'center' });
                    doc.text("No signature required", centerX, footerStartY + 10, { align: 'center' });
                    doc.text("For queries: +91-9876543210", centerX, footerStartY + 14, { align: 'center' });
                    
                    // Right - Generation info
                    const currentDate = new Date().toLocaleDateString('en-IN');
                    const currentTime = new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
                    doc.text(`Generated: ${currentDate}`, margin + contentWidth - 5, footerStartY + 6, { align: 'right' });
                    doc.text(`Time: ${currentTime}`, margin + contentWidth - 5, footerStartY + 10, { align: 'right' });

                    // Page Border
                    doc.setDrawColor(...borderColor);
                    doc.setLineWidth(0.5);
                    doc.rect(margin-2, margin-2, pageWidth - (margin-2)*2, pageHeight - (margin-2)*2);

                    // Show PDF in new tab for printing instead of immediate download
                    const pdfBlob = doc.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    
                    // Open in new window for printing
                    const printWindow = window.open(pdfUrl, '_blank');
                    
                    // Auto-print after PDF loads
                    if (printWindow) {
                        printWindow.onload = function() {
                            printWindow.print();
                        };
                    }
                    
                    showNotification('Opening PDF for printing...', 'success');
                }

                generatePDF();
            } else {
                showNotification(message || 'Error fetching billing details!', 'error');
            }
        },
        error: () => showNotification('Error fetching billing details!', 'error')
    });
};
    </script>
</body>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</html>


