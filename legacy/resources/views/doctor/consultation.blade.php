<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor Consultation Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    @include('doctor.inc.header-links')
    <link rel="stylesheet" href="{{ asset('assets-doctor/css/custom.css') }}" id="app-style">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    @include('doctor.inc.custom')
    <style>
        /* Voice Modal Fix */
        .voice-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        }

        .voice-modal.show {
            display: flex !important;
        }

        .voice-modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }

        .preview-pdf {
            font-family: 'Helvetica', Arial, sans-serif;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .preview-pdf .pdf-page {
            width: 100%;
            border: 2px solid #0e606e;
            padding: 15px;
            margin-bottom: 20px;
            position: relative;
            background: white;
        }

        .preview-pdf .watermark-preview {
            position: absolute;
            top: 40%;
            left: 20%;
            font-size: 40px;
            color: rgba(200, 200, 200, 0.2);
            transform: rotate(-45deg);
            font-weight: bold;
            pointer-events: none;
            z-index: 0;
        }

        .preview-pdf .header-preview {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
        }

        .preview-pdf .logo-preview {
            width: 90px;
            height: 90px;
            /* background: #f0f0f0; */
            display: flex;
            align-items: center;
            justify-content: center;
            /* border: 1px solid #ddd; */
        }

        .preview-pdf .clinic-info-preview {
            text-align: right;
        }

        .preview-pdf .doctor-name-preview {
            color: #0e606e;
            font-size: 18px;
            font-weight: bold;
        }

        .preview-pdf .patient-info-preview {
            background: #f8f9fa;
            padding: 10px;
            border: 1px solid #ddd;
            margin: 15px 0;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            font-size: 12px;
        }

        .preview-pdf .section-title-preview {
            background: #0e606e;
            color: white;
            padding: 5px 10px;
            margin: 15px 0 5px 0;
            font-size: 14px;
            font-weight: bold;
        }

        .preview-pdf .appointment-details-preview {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
        }

        .preview-pdf .appointment-item-preview {
            text-align: center;
        }

        .preview-pdf .appointment-label-preview {
            font-weight: bold;
            color: #0e606e;
            font-size: 11px;
            margin-bottom: 3px;
        }

        .preview-pdf .appointment-value-preview {
            font-size: 12px;
        }

        .preview-pdf table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 11px;
        }

        .preview-pdf th {
            background: #e9ecef;
            border: 1px solid #ccc;
            padding: 6px;
            text-align: center;
            font-weight: bold;
        }

        .preview-pdf td {
            border: 1px solid #ccc;
            padding: 6px;
            vertical-align: top;
        }

        .preview-pdf .medications-table th {
            background: #e9ecef;
        }

        .preview-pdf .footer-preview {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #666;
        }

        .submit-modal {
            display: none;
            position: fixed;
            top: 0;
            right: -100%;
            width: 95%;
            max-width: 1100px;
            height: 100vh;
            background: #fff;
            z-index: 1050;
            transition: right 0.3s ease;
            overflow: hidden;
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .submit-modal.show {
            right: 0;
            display: block;
        }

        @media (min-width: 768px) {
            .preview-section {
                height: 100vh;
                overflow-y: auto;
                padding: 20px !important;
            }

            .action-section {
                height: 100vh;
                overflow-y: auto;
                border-left: 1px solid #dee2e6;
            }
        }

        @media (max-width: 767px) {
            .submit-modal {
                width: 100%;
            }

            .preview-section {
                max-height: 60vh;
                overflow-y: auto;
            }

            .action-section {
                border-bottom: 1px solid #dee2e6;
            }

            .preview-pdf .patient-info-preview {
                grid-template-columns: repeat(2, 1fr);
            }

            .preview-pdf .appointment-details-preview {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        /* Animation for loading */
        .preview-loading {
            text-align: center;
            padding: 50px;
            color: #0e606e;
        }

        .no-data {
            color: #999;
            font-style: italic;
            padding: 10px;
            text-align: center;
        }

        /* Module & Follow-up Styles */
        .btn-soft-primary {
            background-color: #eef2ff;
            color: #4f46e5;
            border: none;
        }
        .btn-soft-primary:hover {
            background-color: #4f46e5;
            color: white;
        }
        .custom-module-card {
            transition: all 0.2s ease;
            border-radius: 10px;
            overflow: hidden;
        }
        .custom-module-card:hover {
            border-color: #0b727f !important;
            box-shadow: 0 4px 12px rgba(11, 114, 127, 0.1);
        }
        .module-table th {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
        }
        .bg-soft-light {
            background-color: #fcfaff;
        }

        /* Module Modal Side Slider */
        .module-modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            z-index: 1060;
            backdrop-filter: blur(2px);
        }
        .module-modal-overlay.show { display: block; }

        .module-modal {
            display: none;
            position: fixed;
            top: 0;
            right: -100%;
            width: 90%;
            max-width: 650px;
            height: 100vh;
            background: #fff;
            z-index: 1070;
            transition: right 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            box-shadow: -5px 0 25px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
        }
        .module-modal.show { right: 0; display: flex; }

        .module-modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
        }
        .module-modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
        }
        .module-modal-footer {
            padding: 1.25rem;
            border-top: 1px solid #f0f0f0;
            background: #fdfbff;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        /* Nav Tabs Custom */
        .modal-tabs {
            display: flex;
            border-bottom: 1px solid #eee;
            margin-bottom: 1.5rem;
        }
        .modal-tab-item {
            padding: 0.75rem 1.5rem;
            cursor: pointer;
            font-weight: 600;
            color: #777;
            border-bottom: 2px solid transparent;
            transition: 0.2s;
        }
        .modal-tab-item.active {
            color: #4f46e5;
            border-bottom-color: #4f46e5;
        }

        /* Config Columns Card Select */
        .config-col-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 1.5rem;
        }
        .config-col-card {
            border: 1.5px solid #eee;
            border-radius: 10px;
            padding: 12px 8px;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
            position: relative;
        }
        .config-col-card input {
            position: absolute;
            opacity: 0;
        }
        .config-col-card:hover { border-color: #0b727f; background: #e6f9f9; }
        .config-col-card.active {
            border-color: #4f46e5;
            background: #f5f4ff;
            color: #4f46e5;
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.1);
        }
        .config-col-card .col-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 1.5px solid #ccc;
            margin: 0 auto 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .config-col-card.active .col-dot {
            border-color: #4f46e5;
            background: #4f46e5;
        }
        .config-col-card.active .col-dot::after {
            content: '';
            width: 6px;
            height: 6px;
            background: #fff;
            border-radius: 50%;
        }
    </style>
</head>

<body>
    <div class="main-wrapper">
        @include('doctor.inc.header1')

        <!-- Billing Modal -->
        <div class="modal fade" id="BillingRecords" tabindex="-1" aria-labelledby="exampleModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header rounded border-0">
                        <h4 class="modal-title fw-bold d-flex align-items-center gap-2" id="addbillingdetailsLabel"
                            style="color: #0e606e; font-weight: 700;">
                            Save Billing Records
                        </h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="billingForm">
                            @csrf
                            <input type="hidden" id="selectedPatientId" name="patient_id"
                                value="{{ $patient->id ?? '' }}">
                            <input type="hidden" name="appointment_id" value="{{ $appointments->id ?? '' }}">
                            <input type="hidden" name="consultation_id" id="consultationIdInput" value="">

                            <!-- Billing form fields - same as before -->
                            <div class="row">
                                <div class="card mb-4 shadow-sm border-0 rounded-3">
                                    <div class="card-header">
                                        <h5 class="mb-0"><i class="fas fa-user me-2"></i> Patient Details</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <p><strong>Name:</strong> {{ $patient->name ?? 'N/A' }}
                                                    ({{ ucfirst($patient->gender ?? 'Male') }})</p>
                                                <p><strong>Registration ID:</strong>
                                                    {{ $patient->registration_id ?? 'N/A' }}</p>
                                            </div>
                                            <div class="col-md-6">
                                                <p><strong>Phone:</strong> {{ $patient->phone ?? 'N/A' }}</p>
                                                <p><strong>Age:</strong>
                                                    {{ \Carbon\Carbon::parse($patient->dob)->age ?? 'N/A' }} years</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-md-3">
                                    <div class="mb-3">
                                        <label class="form-label">Billing Type</label>
                                        <div class="input-group">
                                            <select class="form-select" id="billingTypeSelect" name="billing_type_id"
                                                required>
                                                <option value="">Select Billing Type ...</option>
                                                @foreach ($billingtype as $type)
                                                    <option value="{{ $type->id }}" data-default-amount="{{ $type->default_amount }}">{{ $type->name }}</option>
                                                @endforeach
                                            </select>
                                            <button type="button" class="btn btn-outline-primary" id="openAddBillingTypeModal" title="Add Billing Type">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="mb-3">
                                        <label class="form-label">Total Amount</label>
                                        <input type="number" id="totalAmount" name="total_amount" class="form-control"
                                            placeholder="Total Amount" step="0.01" required>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="mb-3">
                                        <label class="form-label">Received Amount</label>
                                        <input type="number" id="receivedAmount" name="received_amount"
                                            class="form-control" placeholder="Received Amount" step="0.01" required>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="mb-3">
                                        <label class="form-label">Pending Amount</label>
                                        <input type="number" id="pendingAmount" name="pending_amount"
                                            class="form-control" placeholder="Pending Amount" readonly>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="mb-3">
                                        <label class="form-label">Notes</label>
                                        <textarea name="notes" class="form-control" rows="3" placeholder="Additional notes (optional)"></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Payment Method Section -->
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
                                                        <input type="radio" id="paymentUpi" name="payment_method"
                                                            value="upi">
                                                        <i class="ti ti-brand-google-pay me-2"></i> UPI Payment
                                                    </div>
                                                </label>
                                                <label for="paymentCash" class="mb-0 w-100">
                                                    <div class="payment-option" onclick="selectPaymentMethod('cash')">
                                                        <input type="radio" id="paymentCash" name="payment_method"
                                                            value="cash">
                                                        <i class="ti ti-cash me-2"></i> Cash
                                                    </div>
                                                </label>
                                                <label for="paymentCard" class="mb-0 w-100">
                                                    <div class="payment-option" onclick="selectPaymentMethod('card')">
                                                        <input type="radio" id="paymentCard" name="payment_method"
                                                            value="card">
                                                        <i class="ti ti-credit-card me-2"></i> Card
                                                    </div>
                                                </label>
                                                <label for="paymentNetbanking" class="mb-0 w-100">
                                                    <div class="payment-option"
                                                        onclick="selectPaymentMethod('netbanking')">
                                                        <input type="radio" id="paymentNetbanking"
                                                            name="payment_method" value="netbanking">
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
                                                            <input type="text" class="form-control"
                                                                name="payment_details[upi_id]"
                                                                placeholder="Enter UPI ID">
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction Date</label>
                                                            <input type="date" class="form-control"
                                                                name="payment_details[transaction_date]">
                                                        </div>
                                                    </div>
                                                    <div id="cashFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Cash Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Payment Date</label>
                                                            <input type="date" class="form-control"
                                                                name="payment_details[payment_date]">
                                                        </div>
                                                    </div>
                                                    <div id="cardFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Card Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Card Number</label>
                                                            <input type="text" class="form-control"
                                                                name="payment_details[card_number]"
                                                                placeholder="Enter card number">
                                                        </div>
                                                        <div class="row mb-3">
                                                            <div class="col-md-6">
                                                                <label class="form-label">Expiry Date</label>
                                                                <input type="month" class="form-control"
                                                                    name="payment_details[expiry]">
                                                            </div>
                                                            <div class="col-md-6">
                                                                <label class="form-label">CVV</label>
                                                                <input type="text" class="form-control"
                                                                    name="payment_details[cvv]" placeholder="CVV">
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div id="netbankingFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Net Banking Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Bank Name</label>
                                                            <select class="form-select w-100"
                                                                name="payment_details[bank_name]">
                                                                <option value="">Select bank</option>
                                                                <option>State Bank of India</option>
                                                                <option>HDFC Bank</option>
                                                                <option>ICICI Bank</option>
                                                                <option>Axis Bank</option>
                                                            </select>
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction ID</label>
                                                            <input type="text" class="form-control"
                                                                name="payment_details[transaction_id]"
                                                                placeholder="Enter transaction ID">
                                                        </div>
                                                        <div class="mb-3">
                                                            <label class="form-label">Transaction Date</label>
                                                            <input type="date" class="form-control"
                                                                name="payment_details[transaction_date]">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer pt-1 pb-0">
                                <button type="submit" class="btn btn-outline-primary" id="submitBilling">Submit
                                    Bill</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Skip Billing
                                    (For Receptionist)</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Billing Type Modal -->
        <div class="modal fade" id="AddBillingTypeModal" tabindex="-1" aria-labelledby="AddBillingTypeModalLabel" aria-hidden="true" style="z-index: 1061;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header rounded border-0">
                        <h4 class="modal-title fw-bold" id="AddBillingTypeModalLabel" style="color: #0e606e; font-weight: 700;">Create New Billing Type</h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addBillingTypeForm">
                            @csrf
                            <div class="mb-3">
                                <label for="newBillingTypeName" class="form-label">Billing Type Name</label>
                                <input type="text" class="form-control" id="newBillingTypeName" name="name" required placeholder="e.g. Consultation, Blood Test, X-Ray">
                            </div>
                            <div class="mb-3">
                                <label for="newBillingTypeAmount" class="form-label">Default Amount (Optional)</label>
                                <input type="number" class="form-control" id="newBillingTypeAmount" name="default_amount" step="0.01" min="0" placeholder="0.00">
                            </div>
                            <div class="text-end">
                                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary" style="background-color: #0e606e; border-color: #0e606e; color: white;">Save Billing Type</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="container-fluid">
            <div class="row">
                <!-- Left Sidebar -->
                <div class="col-md-3 left-box">
                    <!-- Basic Info Card -->
                    <div class="card info-card">
                        <h5 class="section-title mt-1 ms-2">Basic Info</h5>
                        <table class="table table-bordered table-sm mb-0">
                            <tbody>
                                <tr>
                                    <th>Patient Registration ID</th>
                                    <td>{{ $patient->registration_id ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <th>Mobile</th>
                                    <td>{{ $patient->phone ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <th>Consultation for Patient</th>
                                    <td>{{ $patient->name ?? 'N/A' }} ({{ ucfirst($patient->gender ?? 'Male') }})</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Vitals Card -->
                    <div class="info-card mt-3 animate__animated animate__fadeIn"
                        style="margin-bottom: 13px !important;">
                        <h5><i class="fas fa-heartbeat me-2"></i>Vitals & Body Composition</h5>
                        <div class="row">
                            <div class="table-responsive">
                                <table class="table table-bordered table-sm">
                                    <tbody>
                                        <tr>
                                            <th>Blood Group</th>
                                            <td><input type="text" id="bloodGroup" class="form-control form-control-sm border-0 bg-transparent" value="{{ $appointments->blood_group ?? '' }}" placeholder="N/A"></td>
                                        </tr>
                                        <tr>
                                            <th>Weight (kg)</th>
                                            <td><input type="text" id="weight" class="form-control form-control-sm border-0 bg-transparent" value="{{ $appointments->weight ?? '' }}" placeholder="N/A"></td>
                                        </tr>
                                        <tr>
                                            <th>BP Level</th>
                                            <td><input type="text" id="bp" class="form-control form-control-sm border-0 bg-transparent" value="{{ $appointments->bp ?? '' }}" placeholder="N/A"></td>
                                        </tr>
                                        <tr>
                                            <th>Height</th>
                                            <td><input type="text" id="height" class="form-control form-control-sm border-0 bg-transparent" value="{{ $appointments->height ?? '' }}" placeholder="N/A"></td>
                                        </tr>
                                        <tr>
                                            <th>Age</th>
                                            <td class="ps-2">{{ \Carbon\Carbon::parse($patient->dob)->age ?? 'N/A' }} years</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Notes Cards -->
                    <div class="info-card animate__animated animate__fadeIn">
                        <h5><i class="fas fa-history me-2"></i>Medical History <i class="ti ti-microphone voice-mic"
                                data-target="medicalHistoryNotes"></i><span class="voice-indicator"></span></h5>
                        <textarea id="medicalHistoryNotes" class="form-control" rows="4" placeholder="Speak or type history..."></textarea>
                    </div>

                    <div class="info-card animate__animated animate__fadeIn">
                        <h5><i class="fas fa-sticky-note me-2"></i>Private Notes <i class="ti ti-microphone voice-mic"
                                data-target="privateNotes"></i><span class="voice-indicator"></span></h5>
                        <textarea id="privateNotes" class="form-control" rows="4" placeholder="Speak or type notes..."></textarea>
                    </div>

                    <div class="info-card animate__animated animate__fadeIn">
                        <h5><i class="fas fa-file-medical me-2"></i>Medical Records <i
                                class="ti ti-microphone voice-mic" data-target="medicalRecordsNotes"></i><span
                                class="voice-indicator"></span></h5>
                        <textarea id="medicalRecordsNotes" class="form-control"rows="4" placeholder="Speak or type records..."></textarea>
                    </div>

                    <div class="info-card animate__animated animate__fadeIn">
                        <h5><i class="fas fa-vial me-2"></i>Lab Results <i class="ti ti-microphone voice-mic"
                                data-target="labResultsNotes"></i><span class="voice-indicator"></span></h5>
                        <textarea id="labResultsNotes" class="form-control"rows="4" placeholder="Speak or type results..."></textarea>
                    </div>
                </div>

                <!-- Right Main Content -->
                <div class="col-md-9 right-box">
                    <div class="card">
                        <h5 class="section-title mt-3 mb-2 ms-2">Consultation Details</h5>

                        <!-- Symptoms -->
                        <div class="form-section">
                            <h5>Symptoms <i class="ti ti-microphone voice-mic" data-target="symptomsNote"></i><span
                                    class="voice-indicator"></span></h5>
                            <select id="symptoms" class="form-select" multiple>
                                @foreach ($Allsymptoms as $index => $symptoms)
                                    <option value="{{ $symptoms->name }}">{{ $symptoms->name }}</option>
                                @endforeach
                            </select>
                            <table id="symptomsTable" class="selection-table mt-2">
                                <thead>
                                    <tr>
                                        <th width="5%">Sr.</th>
                                        <th width="35%">Symptom</th>
                                        <th width="60%">Note</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                            <textarea id="symptomsNote" class="form-control mt-2" rows="3" placeholder="Speak symptoms..."></textarea>
                        </div>

                        <!-- Examination -->
                        <div class="form-section">
                            <h5>Examination <i class="ti ti-microphone voice-mic"
                                    data-target="examinationNote"></i><span class="voice-indicator"></span></h5>
                            <select id="examination" class="form-select" multiple>
                                @foreach ($Allexamination as $examination)
                                    <option value="{{ $examination->name }}">{{ $examination->name }}</option>
                                @endforeach
                            </select>
                            <table id="examinationTable" class="selection-table mt-2">
                                <thead>
                                    <tr>
                                        <th width="5%">Sr.</th>
                                        <th width="35%">Examination</th>
                                        <th width="60%">Note</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                            <textarea id="examinationNote" class="form-control mt-2" rows="3" placeholder="Speak examination findings..."></textarea>
                        </div>

                        <!-- Diagnosis -->
                        <div class="form-section">
                            <h5>Diagnosis <i class="ti ti-microphone voice-mic" data-target="diagnosisNote"></i><span
                                    class="voice-indicator"></span></h5>
                            <select id="diagnosis" class="form-select" multiple>
                                @foreach ($Alldignolisis as $dignolisis)
                                    <option value="{{ $dignolisis->name }}">{{ $dignolisis->name }}</option>
                                @endforeach
                            </select>
                            <table id="diagnosisTable" class="selection-table mt-2">
                                <thead>
                                    <tr>
                                        <th width="5%">Sr.</th>
                                        <th width="35%">Diagnosis</th>
                                        <th width="60%">Note</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                            <textarea id="diagnosisNote" class="form-control mt-2" rows="3" placeholder="Speak diagnosis..."></textarea>
                        </div>

                        <!-- Lab Tests -->
                        <div class="form-section">
                            <h5>Lab Tests <i class="ti ti-microphone voice-mic" data-target="labNote"></i><span
                                    class="voice-indicator"></span></h5>
                            <select id="labTests" class="form-select" multiple>
                                @foreach ($Alllabtest as $labtest)
                                    <option value="{{ $labtest->name }}">{{ $labtest->name }}</option>
                                @endforeach
                            </select>
                            <table id="labTestsTable" class="selection-table mt-2">
                                <thead>
                                    <tr>
                                        <th width="5%">Sr.</th>
                                        <th width="35%">Lab Test</th>
                                        <th width="60%">Note</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                            <textarea id="labNote" class="form-control mt-2" rows="4" placeholder="Speak lab tests..."></textarea>
                        </div>



                        <!-- Medications -->
                        <div class="form-section">
                            <div class="med-search-group mb-2 mt-2">
                                <div class="row align-items-center">
                                    <div class="col-md-6 col-12 mb-2 mb-md-0">
                                        <div class="medications-header d-flex align-items-center">
                                            <h5 class="me-3 mb-0">Medications</h5>
                                            <i class="ti ti-microphone voice-mic" data-target="medicationsNote"></i>
                                            <span class="voice-indicator"></span>
                                        </div>
                                    </div>
                                    <div class="col-md-6 col-12 text-md-end text-start">
                                        <div class="btn-group btn-group-sm">
                                            <button type="button"
                                                class="btn btn-skora btn-outline-primary border-light"
                                                id="loadPrevRx">
                                                ↻ Load common medicine
                                            </button>
                                            <button type="button"
                                                class="btn btn-skora btn-outline-primary border-light"
                                                id="clearMedications">
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row align-items-stretch mt-4">
                                <div class="col-md-6">
                                    <select id="medicines" class="form-select" multiple
                                        placeholder="Search || Select Medicines">
                                        <option value="">Select Medicine Or Search</option>
                                        @foreach ($Allmedicines as $medicine)
                                            <option value="{{ $medicine->name }}">{{ $medicine->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-5 offset-md-1">
                                    <div class="input-group">
                                        <input type="text" id="searchMedicines" class="form-control"
                                            placeholder="Print Medicines and Save Own Medicines Name">
                                        <button class="btn btn-skora btn-outline-primary ps-3 pe-3" type="button"
                                            id="addSearchedMedicine">
                                            <i class="ti ti-pill"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="table-responsive">
                                <table id="medicinesTable"
                                    class="selection-table table-bordered table-sm selection-table mt-2">
                                    <thead>
                                        <tr>
                                            <th width="7%"><i class="ti ti-grip-vertical"></i></th>
                                            <th width="5%">Sr.</th>
                                            <th width="22%">Medicine</th>
                                            <th width="10%">Unit/Dose</th>
                                            <th width="19%">Frequency</th>
                                            <th width="12%">When</th>
                                            <th width="12%">Duration</th>
                                            <th width="25%">Note</th>
                                            <th width="5%">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                            <textarea id="medicationsNote" class="form-control mt-2" rows="3"
                                placeholder="Speak or type additional medications instructions..."></textarea>
                        </div>

                        <!-- Follow-up & Additional Information (Moved here) -->
                        <div class="form-section border-top pt-4">
                            <div class="row g-4">
                                <div class="col-md-6 border-end">
                                    <div class="d-flex align-items-center mb-3">
                                        <h5 class="color-doctorrx mb-0"><i class="ti ti-calendar-time me-2"></i>Follow-up</h5>
                                    </div>
                                    <div class="d-flex flex-column gap-3">
                                        <div class="input-group">
                                            <input type="text" id="followUpText" class="form-control" placeholder="e.g. 1 week, next month, or specific date">
                                            <button type="button" class="btn btn-outline-secondary" id="followUpCalBtn"><i class="ti ti-calendar"></i></button>
                                        </div>
                                        <div class="d-flex flex-wrap gap-2">
                                            <button type="button" class="btn btn-sm btn-soft-primary quick-follow" data-val="Next visit if problem">Next visit</button>
                                            <button type="button" class="btn btn-sm btn-soft-primary quick-follow" data-val="After 2 Days">2 Days</button>
                                            <button type="button" class="btn btn-sm btn-soft-primary quick-follow" data-val="After 1 Week">1 Week</button>
                                            <button type="button" class="btn btn-sm btn-soft-primary quick-follow" data-val="After 2 Weeks">2 Weeks</button>
                                            <button type="button" class="btn btn-sm btn-soft-primary quick-follow" data-val="After 1 Month">1 Month</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="d-flex align-items-center mb-3">
                                        <h5 class="color-doctorrx mb-0"><i class="ti ti-notes me-2"></i>Additional Notes</h5>
                                    </div>
                                    <textarea id="additionalNotes" class="form-control" rows="3" placeholder="Enter any specific clinical notes or instructions..."></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Custom Modules (e.g. Diet Plan) -->
                        <div class="form-section border-top pt-4" id="customModulesContainer">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="color-doctorrx mb-0"><i class="ti ti-layers-intersect me-2"></i>Custom clinical Modules</h5>
                                <button type="button" class="btn btn-sm btn-outline-primary" id="openModuleModal">
                                    <i class="ti ti-plus"></i> Add Custom Module
                                </button>
                            </div>
                            <div id="activeModules" class="d-grid gap-4"></div>
                        </div>

                        <!-- Submit Button -->
                        <div class="text-center mb-4">
                            <button id="submitConsultation" class="btn btn-outline-primary w-50 p-2 fs-3">
                                <i class="fas fa-print"></i> Print & Save Consultation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @include('doctor.inc.footer')

    <!-- Module Selection Modal -->
    <div class="module-modal-overlay" id="moduleModalOverlay"></div>
    <div class="module-modal" id="moduleModal">
        <div class="module-modal-header d-flex align-items-center">
            <button type="button" class="btn btn-sm btn-link text-dark me-2" id="closeModuleModal"><i class="ti ti-arrow-left fs-4"></i></button>
            <h4 class="mb-0 fw-bold">Add Custom clinical Module</h4>
        </div>
        <div class="module-modal-body">
            <!-- Tabs -->
            <div class="modal-tabs">
                <div class="modal-tab-item active" data-tab="select">Select Existing Module</div>
                <div class="modal-tab-item" data-tab="create">Create New Module</div>
            </div>

            <!-- Select Existing Tab -->
            <div id="tab-select" class="tab-content">
                <div class="input-group mb-4 border rounded-pill overflow-hidden">
                    <span class="input-group-text bg-white border-0"><i class="ti ti-search text-muted"></i></span>
                    <input type="text" class="form-control border-0 px-1" placeholder="Search by Module Name/Creator..." id="moduleSearch">
                </div>
                
                <div id="commonModulesList" class="d-grid gap-3">
                    <!-- Example Data mapped to user design -->
                    <div class="card border rounded-3 p-3 shadow-none module-selection-card" data-title="Diet Plan" data-cols="1" data-l1="Diet Instructions">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="fw-bold mb-1">Diet Plan</h6>
                                <span class="badge bg-soft-primary text-primary px-2 py-1"><i class="ti ti-stethoscope small me-1"></i> Standard</span>
                                <span class="ms-2 text-muted small"><i class="ti ti-layout-columns small me-1"></i> 01 columns</span>
                            </div>
                            <button type="button" class="btn btn-outline-primary btn-sm rounded-pill add-this-module">
                                <i class="ti ti-plus me-1"></i> Add to Rx
                            </button>
                        </div>
                    </div>
                    <div class="card border rounded-3 p-3 shadow-none module-selection-card" data-title="Physical Exercise" data-cols="1" data-l1="Exercise Details">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="fw-bold mb-1">Physical Exercise</h6>
                                <span class="badge bg-soft-primary text-primary px-2 py-1"><i class="ti ti-stethoscope small me-1"></i> Standard</span>
                                <span class="ms-2 text-muted small"><i class="ti ti-layout-columns small me-1"></i> 01 columns</span>
                            </div>
                            <button type="button" class="btn btn-outline-primary btn-sm rounded-pill add-this-module">
                                <i class="ti ti-plus me-1"></i> Add to Rx
                            </button>
                        </div>
                    </div>
                    <div class="card border rounded-3 p-3 shadow-none module-selection-card" data-title="Special Precautions" data-cols="1" data-l1="Precaution Notes">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="fw-bold mb-1">Special Precautions</h6>
                                <span class="badge bg-soft-primary text-primary px-2 py-1"><i class="ti ti-stethoscope small me-1"></i> Standard</span>
                                <span class="ms-2 text-muted small"><i class="ti ti-layout-columns small me-1"></i> 01 columns</span>
                            </div>
                            <button type="button" class="btn btn-outline-primary btn-sm rounded-pill add-this-module">
                                <i class="ti ti-plus me-1"></i> Add to Rx
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Create New Tab -->
            <div id="tab-create" class="tab-content" style="display: none;">
                <div class="mb-4">
                    <label class="form-label fw-bold small text-uppercase text-muted">Module Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="newModuleName" placeholder="e.g. Physiotherapy Notes">
                </div>

                <div class="mb-4">
                    <label class="form-label fw-bold small text-uppercase text-muted">Configure Columns <span class="text-danger">*</span></label>
                    <div class="config-col-row">
                        <div class="config-col-card active" data-cols="1"><div class="col-dot"></div><span>01 Column</span></div>
                        <div class="config-col-card" data-cols="2"><div class="col-dot"></div><span>02 Columns</span></div>
                        <div class="config-col-card" data-cols="3"><div class="col-dot"></div><span>03 Columns</span></div>
                        <div class="config-col-card" data-cols="4"><div class="col-dot"></div><span>04 Columns</span></div>
                    </div>
                </div>

                <div id="columnLabelsContainer">
                    <div class="row g-3">
                        <div class="col-12 col-label-item" data-index="1">
                            <label class="form-label fw-bold small text-uppercase text-muted">Column 1 <span class="text-danger">*</span></label>
                            <input type="text" class="form-control col-label-input" value="Description / Items">
                        </div>
                    </div>
                </div>

                <div class="alert alert-info border-0 shadow-sm mt-4 py-3" style="background-color: #fcfaff; border-radius: 12px;">
                    <h6 class="fw-bold text-primary small mb-2"><i class="ti ti-info-circle me-1"></i> Things to know</h6>
                    <ul class="mb-0 small text-muted" style="padding-left: 1rem;">
                        <li>You can edit rows until you save the consultation.</li>
                        <li>Modules help keep your clinical notes organized.</li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="module-modal-footer">
            <button type="button" class="btn btn-light px-4" id="cancelModule">Cancel</button>
            <button type="button" class="btn btn-primary px-4 bg-primary" style="display: none;" id="createAddModule">Create & Add To Rx</button>
        </div>
    </div>

    <!-- Submit Modal with Preview -->
    <div class="modal-overlay" id="submitModalOverlay"></div>
    <div class="submit-modal" id="submitModal">
        <div class="container-fluid h-100">
            <div class="row h-100 flex-column flex-md-row">
                <!-- ACTION SECTION (Right Side) -->
                <div class="col-md-3 col-12 bg-light p-4 order-1 order-md-2 action-section">
                    <h5 class="fw-bold mb-4 text-dark">Consultation Actions</h5>
                    <div class="d-grid gap-3">
                        <button class="btn btn-lg fw-bold text-white shadow-sm d-flex align-items-center justify-content-center py-3 transition-all-hover" id="printPrescription" style="background-color: #3d7a82; border: none; border-radius: 12px;">
                            <i class="fas fa-print me-3 fs-5"></i> Print Prescription
                        </button>
                        <button class="btn btn-lg fw-bold text-white shadow-sm d-flex align-items-center justify-content-center py-3 transition-all-hover" id="saveContinue" style="background-color: #22c55e; border: none; border-radius: 12px;">
                            <i class="fas fa-save me-3 fs-5"></i> Save & Continue
                        </button>
                        <button class="btn btn-lg fw-bold text-white shadow-sm d-flex align-items-center justify-content-center py-3 transition-all-hover" id="generateBillBtn" data-bs-toggle="modal" data-bs-target="#BillingRecords" style="background-color: #3b82f6; border: none; border-radius: 12px;">
                            <i class="fas fa-file-invoice me-3 fs-5"></i> Generate Bill
                        </button>
                        <button class="btn btn-lg fw-bold text-white shadow-sm d-flex align-items-center justify-content-center py-3 transition-all-hover" id="closePreviewBtn" style="background-color: #1e293b; border: none; border-radius: 12px;">
                            <i class="fas fa-times me-3 fs-5"></i> Close Preview
                        </button>
                    </div>
                </div>

                <style>
                    .transition-all-hover { transition: all 0.3s ease; }
                    .transition-all-hover:hover { 
                        transform: translateY(-2px); 
                        filter: brightness(110%);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                    }
                </style>


                <!-- PREVIEW SECTION (Left Side) -->
                <div class="col-md-9 col-12 order-2 order-md-1 preview-section p-4">
                    <h5 class="mb-3">Print Preview <small class="text-muted">(What will be printed)</small></h5>
                    <div id="previewContainer" class="preview-pdf"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Voice Modal -->
    <div id="voiceModal" class="voice-modal">
        <div class="voice-modal-content">
            <h5>Voice Input Active <i class="fas fa-microphone"></i></h5>
            <div class="voice-animation">
                <div class="voice-wave"></div>
                <div class="voice-wave"></div>
                <div class="voice-wave"></div>
            </div>
            <p id="transcriptPreview">Listening... Speak now.</p>
            <button id="stopVoiceBtn">Stop Voice</button>
            <button id="closeModalBtn">Cancel</button>
        </div>
    </div>

    @include('doctor.inc.footer-links')
    <script src="{{ asset('assets-doctor/js/select2.min.js') }}"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        $(document).ready(function() {
            // Initialize Sortable for table rows
            const medicinesTable = document.getElementById('medicinesTable');
            if (medicinesTable) {
                new Sortable(medicinesTable.getElementsByTagName('tbody')[0], {
                    handle: '.drag-handle',
                    animation: 150,
                    onEnd: function() {
                        updateRowNumbers();
                        updatePreview(); // Update preview on reorder
                    }
                });
            }

            // Function to update row numbers
            function updateRowNumbers() {
                $('#medicinesTable tbody tr').each(function(index) {
                    $(this).find('td:eq(1)').text(index + 1);
                });
            }

            // Function to add medicine to table
            function addMedicineToTable(medicineName) {
                if (!medicineName || medicineName.trim() === '') {
                    showAlert('Please enter a medicine name', 'warning');
                    return;
                }

                let medicineExists = false;
                $('#medicinesTable tbody tr').each(function() {
                    const existingMedicine = $(this).find('td:eq(2)').text().trim();
                    if (existingMedicine === medicineName.trim()) {
                        medicineExists = true;
                        return false;
                    }
                });

                if (medicineExists) {
                    showAlert('This medicine is already added to the list!', 'warning');
                    return;
                }

                const rowCount = $('#medicinesTable tbody tr').length + 1;
                const newRow = `
                    <tr>
                        <td class="drag-handle">≡</td>
                        <td>${rowCount}</td>
                        <td>${medicineName}</td>
                        <td><input type="text" class="p-2 form-control form-control1 dose-input" placeholder="e.g. 1 Tablet"></td>
                        <td>
                            <select class="form-control form-control1 freq-select p-2">
                                <option value="">Select</option>
                                <option value="1-0-0">1-0-0 (Once daily)</option>
                                <option value="0-1-0">0-1-0 (Once daily)</option>
                                <option value="0-0-1">0-0-1 (Once daily)</option>
                                <option value="1-0-1">1-0-1 (Twice daily)</option>
                                <option value="1-1-1">1-1-1 (Thrice daily)</option>
                                <option value="SOS">SOS (When required)</option>
                            </select>
                        </td>
                        <td>
                            <select class="form-control form-control1 when-select p-2">
                                <option value="">Select</option>
                                <option value="Before Food">Before Food</option>
                                <option value="After Food">After Food</option>
                                <option value="With Food">With Food</option>
                                <option value="Empty Stomach">Empty Stomach</option>
                            </select>
                        </td>
                        <td>
                            <select class="form-control form-control1 dur-select p-2">
                                <option value="">Select</option>
                                <option value="1 Day">1 Day</option>
                                <option value="3 Days">3 Days</option>
                                <option value="5 Days">5 Days</option>
                                <option value="7 Days">7 Days</option>
                                <option value="10 Days">10 Days</option>
                                <option value="2 Weeks">2 Weeks</option>
                                <option value="1 Month">1 Month</option>
                                <option value="To Be Continued">To Be Continued</option>
                            </select>
                        </td>
                        <td><textarea class="form-control form-control1 p-2 note-input" rows="1" placeholder="Special instructions..."></textarea></td>
                        <td>
                            <button type="button" class="btn btn-sm btn-outline-danger delete-row">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;

                $('#medicinesTable tbody').append(newRow);
                updateRowNumbers();
                updatePreview(); // Update preview
                showAlert('Medicine added successfully!', 'success');
            }

            // Initialize medicines select2
            $('#medicines').select2({
                placeholder: 'Select medicines...',
                allowClear: true,
                closeOnSelect: false
            }).on('select2:select', function(e) {
                const value = e.params.data.id;
                addMedicineToTable(value);
            });

            // Add medicine from search input
            $('#addSearchedMedicine').on('click', function() {
                const medicineName = $('#searchMedicines').val().trim();
                if (medicineName) {
                    addMedicineToTable(medicineName);
                    $('#searchMedicines').val('');
                }
            });

            $('#searchMedicines').on('keypress', function(e) {
                if (e.which === 13) {
                    $('#addSearchedMedicine').click();
                }
            });

            // Delete row
            $(document).on('click', '.delete-row', function() {
                const medicineName = $(this).closest('tr').find('td:eq(2)').text();
                if (confirm(`Are you sure you want to remove "${medicineName}"?`)) {
                    $(this).closest('tr').remove();
                    updateRowNumbers();
                    updatePreview(); // Update preview
                    showAlert('Medicine removed!', 'warning');
                }
            });

            // Clear all medications
            $('#clearMedications').on('click', function() {
                if ($('#medicinesTable tbody tr').length > 0) {
                    if (confirm('Are you sure you want to clear all medications?')) {
                        $('#medicinesTable tbody').empty();
                        updatePreview(); // Update preview
                        showAlert('All medications cleared!', 'info');
                    }
                } else {
                    showAlert('No medications to clear!', 'warning');
                }
            });

            // Load common medicines
            $('#loadPrevRx').on('click', function() {
                const commonMeds = ['Paracetamol', 'Ibuprofen', 'Cetirizine', 'Amoxicillin', 'Metformin'];
                if (confirm('Load common medicines?')) {
                    commonMeds.forEach(med => addMedicineToTable(med));
                    showAlert('Common medicines loaded!', 'info');
                }
            });

            // Initialize other select2 elements
            $('.form-select').not('#medicines, #billingTypeSelect').select2({
                placeholder: 'Select or type new options...',
                allowClear: true,
                closeOnSelect: false,
                tags: true
            }).on('change', function() {
                const dropdownId = '#' + this.id;
                const tableId = dropdownId + 'Table';
                const selectedValues = $(this).val() || [];
                const tableBody = $(tableId + ' tbody');
                tableBody.empty();

                selectedValues.forEach((value, index) => {
                    const rowNumber = index + 1;
                    tableBody.append(`
                        <tr data-value="${value}">
                            <td>${rowNumber}</td>
                            <td>${value}</td>
                            <td><textarea class="form-control form-control1 note-input" rows="2" placeholder="Add note for ${value}..." autocomplete="off"></textarea></td>
                        </tr>
                    `);
                });

                updatePreview(); // Update preview when selections change
            });

            // Update preview on any input change
            $(document).on('input change keyup',
                '.note-input, .dose-input, .freq-select, .when-select, .dur-select, #symptomsNote, #examinationNote, #diagnosisNote, #labNote, #medicationsNote, #medicalHistoryNotes, #privateNotes, #medicalRecordsNotes, #labResultsNotes',
                function() {
                    updatePreview();
                });

            // Submit consultation button
            $('#submitConsultation').on('click', function() {
                updatePreview(); // Ensure preview is up to date
                $('#submitModal').addClass('show');
                $('#submitModalOverlay').addClass('show');
            });

            // Close modal
            $('#closeModal, #cancelAction, #submitModalOverlay, #closePreviewBtn').on('click', function() {
                $('#submitModal').removeClass('show');
                $('#submitModalOverlay').removeClass('show');
            });

            // Modal actions
            let consultationId = null;

            $('#printPrescription').on('click', function() {
                saveConsultation(function(response) {
                    const consultationId = response.consultation_id;
                    const pdfUrl = "{{ route('consultations.pdf', ':id') }}".replace(':id', consultationId);
                    window.open(pdfUrl, '_blank');
                    $('#submitModal').removeClass('show');
                    $('#submitModalOverlay').removeClass('show');
                });
            });

            $('#saveContinue').on('click', function() {
                saveConsultation(function() {
                    showAlert('Consultation saved successfully! Redirecting to dashboard...',
                        'success');
                    setTimeout(() => {
                        window.location.href = '{{ route('doctor.dashboard') }}';
                    }, 1000);
                });
            });

            $('#generateBillBtn').on('click', function() {
                saveConsultation(function(response) {
                    consultationId = response.consultation_id;
                    $('#consultationIdInput').val(consultationId);
                    // Modal will open automatically due to data-bs-toggle
                });
            });

            // Save consultation function
            function saveConsultation(callback) {
                const consultationData = {
                    patient_id: {{ $patient->id ?? 'null' }},
                    appointment_id: "{{ $appointments->id ?? '' }}",
                    height: $('#height').val(),
                    weight: $('#weight').val(),
                    bp: $('#bp').val(),
                    blood_group: $('#bloodGroup').val(),
                    symptoms_note: $('#symptomsNote').val(),
                    examination_note: $('#examinationNote').val(),
                    diagnosis_note: $('#diagnosisNote').val(),
                    lab_note: $('#labNote').val(),
                    medications_note: $('#medicationsNote').val(),
                    medical_history: $('#medicalHistoryNotes').val(),
                    private_notes: $('#privateNotes').val(),
                    medical_records: $('#medicalRecordsNotes').val(),
                    lab_results: $('#labResultsNotes').val(),
                    symptoms: getTableData('#symptomsTable'),
                    examination: getTableData('#examinationTable'),
                    diagnosis: getTableData('#diagnosisTable'),
                    lab_tests: getTableData('#labTestsTable'),
                    medications: getMedicationsData(),
                    additional_info: getDynamicFieldsData(),
                };

                $.ajax({
                    url: "{{ route('consultations.store') }}",
                    method: 'POST',
                    data: {
                        _token: '{{ csrf_token() }}',
                        ...consultationData
                    },
                    success: function(response) {
                        if (response.success) {
                            $('#consultationIdInput').val(response.consultation_id);
                            if (callback) callback(response);
                        } else {
                            showAlert('Error: ' + response.message, 'error');
                        }
                    },
                    error: function(xhr) {
                        console.error('Error saving consultation:', xhr);
                        showAlert('Error saving consultation. Please try again.', 'error');
                    }
                });
            }

            // Helper function to get table data
            function getTableData(tableSelector) {
                const data = [];
                $(`${tableSelector} tbody tr`).each(function() {
                    const item = $(this).find('td').eq(1).text().trim();
                    const note = $(this).find('.note-input').val() || '';
                    if(item) {
                        data.push({ item, note });
                    }
                });
                return data;
            }

            // Helper function to get medications data
            function getMedicationsData() {
                const medications = [];
                $('#medicinesTable tbody tr').each(function() {
                    const medicine = $(this).find('td:eq(2)').text().trim();
                    const dose = $(this).find('.dose-input').val() || '';
                    const frequency = $(this).find('.freq-select').val() || '';
                    const when = $(this).find('.when-select').val() || '';
                    const duration = $(this).find('.dur-select').val() || '';
                    const note = $(this).find('.note-input').val() || '';
                    if(medicine) {
                        medications.push({
                            medicine,
                            dose,
                            frequency,
                            when,
                            duration,
                            note
                        });
                    }
                });
                return medications;
            }


            // ==================== MODERN DYNAMIC MODULES & FOLLOW-UP ====================
            
            // 1. Follow-up & Modal Toggle
            $('.quick-follow').on('click', function() {
                $('#followUpText').val($(this).data('val'));
                updatePreview();
            });

            $('#openModuleModal').on('click', function() {
                $('#moduleModal, #moduleModalOverlay').addClass('show');
            });

            $('#closeModuleModal, #cancelModule, #moduleModalOverlay').on('click', function() {
                $('#moduleModal, #moduleModalOverlay').removeClass('show');
            });

            // 2. Tab Switching
            $('.modal-tab-item').on('click', function() {
                $('.modal-tab-item').removeClass('active');
                $(this).addClass('active');
                const tab = $(this).data('tab');
                $('.tab-content').hide();
                $(`#tab-${tab}`).show();
                if (tab === 'create') {
                    $('#createAddModule').show();
                } else {
                    $('#createAddModule').hide();
                }
            });

            // 3. Column Configuration
            $('.config-col-card').on('click', function() {
                $('.config-col-card').removeClass('active');
                $(this).addClass('active');
                const cols = $(this).data('cols');
                updateColumnLabelsUI(cols);
            });

            function updateColumnLabelsUI(count) {
                let html = '<div class="row g-3">';
                for (let i = 1; i <= count; i++) {
                    let defaultLabel = (i === 1) ? 'Description / Items' : `Col ${i} Label`;
                    html += `
                        <div class="col-${count > 1 ? '6' : '12'} col-label-item" data-index="${i}">
                            <label class="form-label fw-bold small text-uppercase text-muted">Column ${i} <span class="text-danger">*</span></label>
                            <input type="text" class="form-control col-label-input" value="${defaultLabel}">
                        </div>
                    `;
                }
                html += '</div>';
                $('#columnLabelsContainer').html(html);
            }

            // 4. Search Filter
            $('#moduleSearch').on('input', function() {
                const term = $(this).val().toLowerCase();
                $('.module-selection-card').each(function() {
                    const title = $(this).data('title').toLowerCase();
                    $(this).toggle(title.includes(term));
                });
            });

            // 5. Add Module Action
            $('.add-this-module').on('click', function() {
                const card = $(this).closest('.module-selection-card');
                const title = card.data('title');
                const cols = card.data('cols');
                const labels = [card.data('l1'), card.data('l2'), card.data('l3'), card.data('l4')].filter(Boolean);
                addModuleToUI(title, cols, labels);
                $('#moduleModal, #moduleModalOverlay').removeClass('show');
            });

            $('#createAddModule').on('click', function() {
                const title = $('#newModuleName').val().trim();
                if (!title) {
                    showAlert('Please enter a module name', 'warning');
                    return;
                }
                const cols = $('.config-col-card.active').data('cols');
                const labels = [];
                $('.col-label-input').each(function() {
                    labels.push($(this).val().trim() || 'Details');
                });
                addModuleToUI(title, cols, labels);
                $('#newModuleName').val(''); // Reset
                $('#moduleModal, #moduleModalOverlay').removeClass('show');
            });

            function addModuleToUI(title, cols = 1, labels = ['Description / Items']) {
                const moduleId = 'module-' + Date.now();
                let tableHeaderCols = '';
                labels.forEach(label => {
                    tableHeaderCols += `<th>${label}</th>`;
                });

                let rowInputs = '';
                for(let i=0; i<cols; i++) {
                    rowInputs += `<td><input type="text" class="form-control form-control-sm module-row-input" data-col="${i}" placeholder="Enter details..."></td>`;
                }

                const moduleHtml = `
                    <div class="card border shadow-none mb-0 custom-module-card" id="${moduleId}" data-title="${title}" data-cols="${cols}">
                        <div class="card-header bg-light d-flex justify-content-between align-items-center py-2">
                            <h6 class="mb-0 text-primary fw-bold"><i class="ti ti-box me-1"></i> ${title}</h6>
                            <button type="button" class="btn btn-sm btn-link text-danger p-0 remove-module" data-id="${moduleId}">
                                <i class="ti ti-trash"></i> Remove
                            </button>
                        </div>
                        <div class="card-body p-3">
                            <div class="table-responsive">
                                <table class="table table-sm table-bordered mb-2 module-table">
                                    <thead>
                                        <tr class="bg-soft-light">
                                            <th width="5%">#</th>
                                            ${tableHeaderCols}
                                            <th width="5%">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>1</td>
                                            ${rowInputs}
                                            <td class="text-center">---</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" class="btn btn-sm btn-soft-primary add-row-to-module" data-id="${moduleId}" data-cols="${cols}">
                                <i class="ti ti-plus me-1"></i> Add New Line
                            </button>
                        </div>
                    </div>
                `;
                $('#activeModules').append(moduleHtml);
                updatePreview();
            }

            // 6. Row Management inside Modules
            $(document).on('click', '.add-row-to-module', function() {
                const moduleId = $(this).data('id');
                const cols = $(this).data('cols');
                const tbody = $(`#${moduleId} .module-table tbody`);
                const rowCount = tbody.find('tr').length + 1;
                
                let rowInputs = '';
                for(let i=0; i<cols; i++) {
                    rowInputs += `<td><input type="text" class="form-control form-control-sm module-row-input" data-col="${i}" placeholder="Enter details..."></td>`;
                }

                const row = `
                    <tr>
                        <td>${rowCount}</td>
                        ${rowInputs}
                        <td class="text-center">
                            <button type="button" class="btn btn-sm text-danger p-0 remove-module-row"><i class="ti ti-x"></i></button>
                        </td>
                    </tr>
                `;
                tbody.append(row);
                updatePreview();
            });

            $(document).on('click', '.remove-module-row', function() {
                const tbody = $(this).closest('tbody');
                $(this).closest('tr').remove();
                tbody.find('tr').each(function(index) {
                    $(this).find('td:first').text(index + 1);
                });
                updatePreview();
            });

            $(document).on('click', '.remove-module', function() {
                const id = $(this).data('id');
                $(`#${id}`).fadeOut(300, function() { $(this).remove(); updatePreview(); });
            });

            $(document).on('input', '.module-row-input, #followUpText, #additionalNotes', function() {
                updatePreview();
            });

            function getDynamicFieldsData() {
                const modules = [];
                $('.custom-module-card').each(function() {
                    const title = $(this).data('title');
                    const cols = $(this).data('cols');
                    const moduleRows = [];
                    
                    $(this).find('.module-table tbody tr').each(function() {
                        const rowData = [];
                        $(this).find('.module-row-input').each(function() {
                            rowData.push($(this).val().trim());
                        });
                        if (rowData.some(val => val !== '')) {
                            moduleRows.push(rowData);
                        }
                    });

                    if (moduleRows.length > 0) {
                        modules.push({ title, cols, rows: moduleRows });
                    }
                });

                return {
                    follow_up: {
                        text: $('#followUpText').val(),
                        notes: $('#additionalNotes').val()
                    },
                    modules: modules
                };
            }

            // ==================== PREVIEW FUNCTION ====================
            function updatePreview() {
                const previewHtml = generatePreviewHTML();
                $('#previewContainer').html(previewHtml);
            }

            function generatePreviewHTML() {
                let rawDocName = "{{ auth()->user()->name ?? 'Doctor' }}";
                const doctorName = /^Dr\.?\s/i.test(rawDocName) ? rawDocName : 'Dr. ' + rawDocName;
                const doctorSpec = "{{ auth()->user()->specialization ?? 'Specialist' }}";
                const clinicName = "{{ current_clinic()->clinic_name ?? 'AK Clinic' }}";
                const clinicAddr = "{{ current_clinic()->address ?? 'Golden Eye, City' }}";
                const clinicLogo = "@php
                    $cLogo = asset('assets/img/Logo.PNG');
                    $clinic = current_clinic();
                    if ($clinic && $clinic->clinic_logo && file_exists(public_path($clinic->clinic_logo))) {
                        $cLogo = asset($clinic->clinic_logo);
                    } elseif (file_exists(public_path('uploads/profile/1776939557.jpg'))) {
                        $cLogo = asset('uploads/profile/1776939557.jpg');
                    }
                    echo $cLogo;
                @endphp";

                const patientRegId = "{{ $patient->registration_id ?? 'PAT12345' }}";
                const patientName = "{{ $patient->name ?? 'John Doe' }}";
                const patientAge = "{{ \Carbon\Carbon::parse($patient->dob)->age ?? '30' }}y";
                const patientGender = "{{ ucfirst($patient->gender ?? 'Male') }}";
                const patientPhone = "{{ $patient->phone ?? '+91 9876543210' }}";
                const patientAddr = "{{ $patient->address ?? '---' }}";

                const currentDate = new Date();
                const formattedDate = currentDate.toLocaleDateString('en-GB');
                const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

                // Get Vitals
                const bloodGroup = $('#bloodGroup').val() || '-';
                const weight = $('#weight').val() ? $('#weight').val() + ' kg' : '-';
                const bp = $('#bp').val() || '-';
                const height = $('#height').val() || '-';
                
                // Collect Findings
                const getItemsString = (selector, noteSelector) => {
                    const items = [];
                    $(`${selector} tbody tr`).each(function() {
                        const val = $(this).find('td').eq(1).text().trim();
                        const note = $(this).find('.note-input').val();
                        if (val) items.push(val + (note ? ` (${note})` : ''));
                    });
                    if (noteSelector) {
                        const additionalNote = $(noteSelector).val() ? $(noteSelector).val().trim() : '';
                        if (additionalNote) {
                            items.push(additionalNote);
                        }
                    }
                    return items.join(', ');
                };

                const symptomsStr = getItemsString('#symptomsTable', '#symptomsNote');
                const examsStr = getItemsString('#examinationTable', '#examinationNote');
                const diagStr = getItemsString('#diagnosisTable', '#diagnosisNote');
                const labTestsStr = getItemsString('#labTestsTable', '#labNote');

                // Medicines loop
                let medsRows = '';
                $('#medicinesTable tbody tr').each(function(index) {
                    medsRows += `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <strong>${$(this).find('td:eq(2)').text()}</strong>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${$(this).find('.dose-input').val() || '---'}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${$(this).find('.freq-select').val() || '---'}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${$(this).find('.dur-select').val() || '---'}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${$(this).find('.note-input').val() || '---'}</td>
                        </tr>
                    `;
                });

                // Modules rendering as Tables
                const dynamicDataResult = getDynamicFieldsData();
                let modulesHTML = '';
                if(dynamicDataResult.modules && dynamicDataResult.modules.length > 0) {
                    dynamicDataResult.modules.forEach(mod => {
                        let tableRows = '';
                        mod.rows.forEach((row, rIndex) => {
                            tableRows += `<tr><td style="padding: 6px; border: 1px solid #eee; text-align:center; width: 40px;">${rIndex + 1}</td>`;
                            row.forEach(cell => {
                                tableRows += `<td style="padding: 6px; border: 1px solid #eee;">${cell}</td>`;
                            });
                            tableRows += `</tr>`;
                        });

                        modulesHTML += `
                            <div style="margin-top: 20px;">
                                <div style="font-weight: bold; border-bottom: 2px solid #8e44ad; color: #8e44ad; padding-bottom: 4px; font-size: 14px; margin-bottom: 8px;">${mod.title}</div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #444; border: 1px solid #eee;">
                                    <tbody>
                                        ${tableRows}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    });
                }

                return `
                    <div style="padding: 20px; font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; border: 1px solid #ddd; position: relative; min-height: 600px;">
                        <!-- Header -->
                        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; align-items: center;">
                            <div style="width: 35%;">
                                <div style="color: #8e44ad; font-size: 16px; font-weight: bold;">${doctorName}</div>
                                <div style="font-size: 10px; color: #666; margin-top: 1px;">${doctorSpec}</div>
                                <div style="font-size: 10px; color: #666;">Mobile: ${patientPhone}</div>
                            </div>
                            <div style="width: 30%; text-align: center;">
                                ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 60px; max-width: 130px;" alt="Clinic Logo">` : ''}
                            </div>
                            <div style="width: 35%; text-align: right;">
                                <div style="color: #8e44ad; font-size: 15px; font-weight: bold;">${clinicName}</div>
                                <div style="font-size: 9px; color: #666; margin-top: 1px;">${clinicAddr}</div>
                            </div>
                        </div>

                        <!-- Patient Info Grid -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 15px; background: #fafafa; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                            <div><strong style="color:#444;">Patient Name & ID:</strong> ${patientName}, ${patientRegId}</div>
                            <div><strong style="color:#444;">Date & Time:</strong> ${formattedDate} ${formattedTime}</div>
                            <div><strong style="color:#444;">Age/Gender:</strong> ${patientAge}, ${patientGender}</div>
                            <div><strong style="color:#444;">Mobile No:</strong> ${patientPhone}</div>
                            <div><strong style="color:#444;">Height / Weight:</strong> ${height} / ${weight}</div>
                            <div><strong style="color:#444;">Blood Group:</strong> ${bloodGroup}</div>
                            <div style="grid-column: span 2;"><strong style="color:#444;">Address:</strong> ${patientAddr}</div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            ${symptomsStr ? `<div style="margin-bottom: 5px; font-size: 12px;"><strong style="color:#333; min-width: 90px; display: inline-block;">Symptoms:</strong> <span style="color: #666;">${symptomsStr}</span></div>` : ''}
                            ${examsStr ? `<div style="margin-bottom: 5px; font-size: 12px;"><strong style="color:#333; min-width: 90px; display: inline-block;">Examinations:</strong> <span style="color: #666;">${examsStr}</span></div>` : ''}
                            ${diagStr ? `<div style="margin-bottom: 5px; font-size: 12px;"><strong style="color:#333; min-width: 90px; display: inline-block;">Diagnosis:</strong> <span style="color: #666;">${diagStr}</span></div>` : ''}
                            ${labTestsStr ? `<div style="margin-bottom: 5px; font-size: 12px;"><strong style="color:#333; min-width: 90px; display: inline-block;">Lab Tests:</strong> <span style="color: #666;">${labTestsStr}</span></div>` : ''}
                        </div>

                        <!-- RX Table -->
                        <div style="margin-top: 5px; font-weight: bold; font-size: 13px; color: #8e44ad; border-bottom: 2px solid #8e44ad; padding-bottom: 3px;">Medication (Rx):</div>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; border: 1px solid #ddd; table-layout: auto;">
                            <thead style="background: #fdfbff;">
                                <tr>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 10px; color: #8e44ad;">S.NO</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 10px; color: #8e44ad;">MEDICINE</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 10px; color: #8e44ad;">DOSE</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 10px; color: #8e44ad;">FREQ</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 10px; color: #8e44ad;">DUR</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 10px; color: #8e44ad;">NOTES</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 10px; color: #444;">
                                ${medsRows || '<tr><td colspan="6" style="padding: 15px; text-align: center; color: #999; font-style: italic;">No medications prescribed</td></tr>'}
                            </tbody>
                        </table>

                        <!-- Additional Modules -->
                        ${modulesHTML}

                        <!-- Follow-up -->
                        ${dynamicDataResult.follow_up.text || dynamicDataResult.follow_up.notes ? `
                            <div style="margin-top: 20px; padding: 12px; background: #fffcf5; border: 1px dashed #f1d3a1; border-radius: 6px; font-size: 11px; color: #555;">
                                ${dynamicDataResult.follow_up.text ? `<div><strong style="color:#555;">Follow-up:</strong> ${dynamicDataResult.follow_up.text}</div>` : ''}
                                ${dynamicDataResult.follow_up.notes ? `<div style="margin-top: 3px;"><strong style="color:#555;">Clinical Notes:</strong> ${dynamicDataResult.follow_up.notes}</div>` : ''}
                            </div>
                        ` : ''}

                        <!-- Footer -->
                        <div style="margin-top: 50px; text-align: right; padding-bottom: 20px;">
                            <div style="font-weight: bold; margin-bottom: 40px; font-size: 11px; color: #333;">Authorized Signature</div>
                            <div style="font-weight: bold; font-size: 11px; color: #333; margin-bottom: 4px;">${doctorName}</div>
                            <div style="border-top: 1.5px solid #333; width: 160px; float: right;"></div>
                            <div style="clear: both;"></div>
<div style="text-align: right; font-size: 11px; color: #888; margin-top: 10px; font-style: italic;">
    Made by 
    <a href="https://www.skorasoft.com/" target="_blank" 
       style="color: #4CAF50; text-decoration: none;">
       Skorasoft
    </a>
</div>
                        </div>
                    </div>
                `;
            }

            // Initial preview update
            updatePreview();

            // ==================== PDF Generation Function ====================
            function generateOldJsPDF() {
                const {
                    jsPDF
                } = window.jspdf;
                const doc = new jsPDF();
                const pageHeight = 297; // A4 height in mm
                const margin = 10;
                const maxY = pageHeight - margin - 10; // Leave space for footer

                // Set border color #0e606e
                const borderColor = [14, 96, 110]; // RGB for #0e606e

                // Draw border on first page
                doc.setDrawColor(...borderColor);
                doc.setLineWidth(0.7);
                doc.rect(5, 5, 200, 287);

                // Function to add watermark on all pages
                function addWatermark(doc, pageCount) {
                    const doctorName = "{{ current_clinic()->clinic_name ?? 'AK Clinic' }}";
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setTextColor(200, 200, 200);
                        doc.setFontSize(30);
                        doc.setFont("helvetica", "bold");
                        doc.saveGraphicsState();
                        doc.setGState(new doc.GState({
                            opacity: 0.2
                        }));
                        doc.text(doctorName, 60, 180, {
                            angle: 45
                        });
                        doc.restoreGraphicsState();
                        doc.setTextColor(0);
                    }
                }

                // Helper function to estimate table height
                function estimateTableHeight(data, doc, maxWidth = 120) {
                    let height = 8; // Title
                    height += 8; // Header
                    data.forEach((row) => {
                        const noteText = row.note && row.note.trim() !== '' ? row.note : '---';
                        const lines = doc.splitTextToSize(noteText, maxWidth);
                        const rowHeight = Math.max(8, lines.length * 5);
                        height += rowHeight;
                    });
                    height += 10; // Padding
                    return height;
                }

                // Helper function to estimate text section height
                function estimateTextSectionHeight(title, text, doc, maxWidth = 190) {
                    let height = 8; // Title
                    if (text && text.trim() !== '') {
                        const lines = doc.splitTextToSize(text, maxWidth);
                        height += lines.length * 5 + 5; // Text + padding
                    }
                    return height;
                }

                // Helper function to draw a table
                function drawTable(data, title, startY, doc, maxWidth = 120) {
                    let yPos = startY;
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(15); // Updated to 15px
                    doc.text(title, 10, yPos);
                    yPos += 8;

                    if (data.length === 0) {
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(11);
                        doc.text("None", 10, yPos);
                        return yPos + 6;
                    }

                    doc.setFillColor(245, 245, 245);
                    doc.rect(10, yPos, 15, 8, 'F');
                    doc.rect(25, yPos, 45, 8, 'F');
                    doc.rect(70, yPos, maxWidth, 8, 'F');

                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.4);
                    doc.rect(10, yPos, 15, 8);
                    doc.rect(25, yPos, 45, 8);
                    doc.rect(70, yPos, maxWidth, 8);

                    doc.setFontSize(10);
                    doc.text("Sr.", 13, yPos + 6, {
                        align: 'center'
                    });
                    doc.text("Item", 47.5, yPos + 6, {
                        align: 'center'
                    });
                    doc.text("Note", 70 + maxWidth / 2, yPos + 6, {
                        align: 'center'
                    });

                    yPos += 8;
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(9);

                    data.forEach((row, index) => {
                        const noteText = row.note && row.note.trim() !== '' ? row.note : '---';
                        const lines = doc.splitTextToSize(noteText, maxWidth);
                        const rowHeight = Math.max(8, lines.length * 4.5);

                        doc.setDrawColor(200, 200, 200);
                        doc.setLineWidth(0.4);
                        doc.rect(10, yPos, 15, rowHeight);
                        doc.rect(25, yPos, 45, rowHeight);
                        doc.rect(70, yPos, maxWidth, rowHeight);

                        doc.text(`${index + 1}`, 17.5, yPos + (rowHeight / 2), {
                            align: 'center',
                            baseline: 'middle'
                        });

                        const itemLines = doc.splitTextToSize(row.item, 40);
                        doc.text(itemLines, 27, yPos + 4);
                        doc.text(lines, 72, yPos + 4);

                        yPos += rowHeight;
                    });

                    doc.setFontSize(11);
                    return yPos + 10;
                }

                // Helper function to draw Medications table
                function drawMedicationsTable(data, title, startY, doc) {
                    let yPos = startY;
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(15); // Updated to 15px
                    doc.text(title, 10, yPos);
                    yPos += 8;

                    if (data.length === 0) {
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(11);
                        doc.text("None", 10, yPos);
                        return yPos + 6;
                    }

                    doc.setFillColor(245, 245, 245);
                    doc.rect(10, yPos, 10, 8, 'F');
                    doc.rect(20, yPos, 40, 8, 'F');
                    doc.rect(60, yPos, 20, 8, 'F');
                    doc.rect(80, yPos, 25, 8, 'F');
                    doc.rect(105, yPos, 25, 8, 'F');
                    doc.rect(130, yPos, 25, 8, 'F');
                    doc.rect(155, yPos, 40, 8, 'F');

                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.4);
                    doc.rect(10, yPos, 10, 8);
                    doc.rect(20, yPos, 40, 8);
                    doc.rect(60, yPos, 20, 8);
                    doc.rect(80, yPos, 25, 8);
                    doc.rect(105, yPos, 25, 8);
                    doc.rect(130, yPos, 25, 8);
                    doc.rect(155, yPos, 40, 8);

                    doc.setFontSize(8);
                    doc.text("Sr.", 15, yPos + 6, {
                        align: 'center'
                    });
                    doc.text("Medicine", 40, yPos + 6, {
                        align: 'center'
                    });
                    doc.text("Dose", 70, yPos + 6, {
                        align: 'center'
                    });
                    doc.text("Frequency", 92.5, yPos + 6, {
                        align: 'center'
                    });
                    doc.text("When", 117.5, yPos + 6, {
                        align: 'center'
                    });
                    doc.text("Duration", 142.5, yPos + 6, {
                        align: 'center'
                    });
                    doc.text("Note", 175, yPos + 6, {
                        align: 'center'
                    });

                    yPos += 8;
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7);

                    data.forEach((row, index) => {
                        const medicineText = row.medicine || '---';
                        const doseText = row.dose || '---';
                        const frequencyText = row.frequency || '---';
                        const whenText = row.when || '---';
                        const durationText = row.duration || '---';
                        const noteText = row.note || '---';

                        const medicineLines = doc.splitTextToSize(medicineText, 35);
                        const noteLines = doc.splitTextToSize(noteText, 35);
                        const maxLines = Math.max(medicineLines.length, noteLines.length, 1);
                        const rowHeight = Math.max(8, maxLines * 4);

                        doc.setDrawColor(200, 200, 200);
                        doc.setLineWidth(0.4);
                        doc.rect(10, yPos, 10, rowHeight);
                        doc.rect(20, yPos, 40, rowHeight);
                        doc.rect(60, yPos, 20, rowHeight);
                        doc.rect(80, yPos, 25, rowHeight);
                        doc.rect(105, yPos, 25, rowHeight);
                        doc.rect(130, yPos, 25, rowHeight);
                        doc.rect(155, yPos, 40, rowHeight);

                        doc.text(`${index + 1}`, 15, yPos + (rowHeight / 2), {
                            align: 'center',
                            baseline: 'middle'
                        });

                        doc.text(medicineLines, 22, yPos + 4);
                        doc.text(doseText, 70, yPos + (rowHeight / 2), {
                            align: 'center',
                            baseline: 'middle'
                        });
                        doc.text(frequencyText, 92.5, yPos + (rowHeight / 2), {
                            align: 'center',
                            baseline: 'middle'
                        });
                        doc.text(whenText, 117.5, yPos + (rowHeight / 2), {
                            align: 'center',
                            baseline: 'middle'
                        });
                        doc.text(durationText, 142.5, yPos + (rowHeight / 2), {
                            align: 'center',
                            baseline: 'middle'
                        });
                        doc.text(noteLines, 157, yPos + 4);

                        yPos += rowHeight;
                    });

                    doc.setFontSize(11);
                    return yPos + 10;
                }

                // Helper function to draw Appointment Details - NEW VERSION (No Table)
                function drawAppointmentDetails(data, title, startY, doc) {
                    let yPos = startY;

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(14);
                    doc.setTextColor(14, 96, 110);
                    doc.text(title, 10, yPos);
                    yPos += 8;

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0);

                    // Background box
                    doc.setFillColor(248, 249, 250);
                    doc.rect(10, yPos, 190, 31, 'F');
                    doc.setDrawColor(222, 226, 230);
                    doc.setLineWidth(0.3);
                    doc.rect(10, yPos, 190, 31);

                    // Extract data from array
                    const bloodGroup = data.find(d => d.parameter === "Blood Group")?.value || 'N/A';
                    const weight = data.find(d => d.parameter === "Weight")?.value || 'N/A';
                    const bp = data.find(d => d.parameter === "BP Level")?.value || 'N/A';
                    const height = data.find(d => d.parameter === "Height")?.value || 'N/A';
                    const followUp = data.find(d => d.parameter === "Follow-up Date")?.value || 'N/A';
                    const temperature = data.find(d => d.parameter === "Temperature")?.value || 'N/A';
                    const pulseRate = data.find(d => d.parameter === "Pulse Rate")?.value || 'N/A';
                    const respRate = data.find(d => d.parameter === "Respiratory Rate")?.value || 'N/A';

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(9);
                    doc.text("Blood Group:", 15, yPos + 8);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text(bloodGroup, 55, yPos + 8);

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("Weight:", 95, yPos + 8);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text(weight, 120, yPos + 8);

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("BP Level:", 140, yPos + 8);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text(bp, 165, yPos + 8);

                    // Row 2 - Height, Temperature, Pulse
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("Height:", 15, yPos + 18);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text(height, 55, yPos + 18);

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("Temperature:", 95, yPos + 18);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text(temperature, 125, yPos + 18);

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("Pulse:", 140, yPos + 18);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text(pulseRate, 160, yPos + 18);

                    // Row 3 - Respiratory Rate, Follow-up
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("Resp. Rate:", 15, yPos + 28);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text(respRate, 55, yPos + 28);

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("Follow-up:", 95, yPos + 28);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text(followUp, 120, yPos + 28);

                    // Extra line for Age if needed
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text("Age:", 140, yPos + 28);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(14, 96, 110);
                    doc.text("{{ \Carbon\Carbon::parse($patient->dob)->age ?? '30' }} years", 155, yPos + 28);

                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(11);

                    return yPos + 40; // Return next Y position
                }

                // Helper function to draw text section
                function drawTextSection(title, text, startY, doc, maxWidth = 190) {
                    let yPos = startY;
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(15); // Updated to 15px
                    doc.text(title, 10, yPos);
                    yPos += 8;

                    if (text && text.trim() !== '') {
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(11);
                        const lines = doc.splitTextToSize(text, maxWidth);
                        doc.text(lines, 10, yPos);
                        yPos += lines.length * 5 + 5;
                    } else {
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(11);
                        doc.text("None", 10, yPos);
                        yPos += 6;
                    }

                    return yPos;
                }

                // PDF Generation
                const logoUrl =
                    "@php
                        $pdfLogo = asset('assets/img/Logo.PNG');
                        $clinic = current_clinic();
                        if ($clinic && $clinic->clinic_logo && file_exists(public_path($clinic->clinic_logo))) {
                            $pdfLogo = asset($clinic->clinic_logo);
                        } elseif (file_exists(public_path('uploads/profile/1776939557.jpg'))) {
                            $pdfLogo = asset('uploads/profile/1776939557.jpg');
                        }
                        echo $pdfLogo;
                    @endphp";

                fetch(logoUrl)
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onload = function() {
                            const imgData = reader.result;
                            doc.addImage(imgData, 'PNG', 10, 10, 30, 25);

                            doc.setTextColor(14, 96, 110);
                            doc.setFontSize(16);
                            doc.setFont("helvetica", "bold");
                            doc.text("{{ auth()->user()->name ?? 'Dr. Anil Kumar' }}", 10, 40);

                            doc.setTextColor(0);
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "normal");
                            doc.text("Cardiology | {{ auth()->user()->phone ?? 'N/A' }}", 10, 46);
                            doc.text("Mobile: {{ auth()->user()->phone ?? 'N/A' }}", 10, 52);
                            doc.text(
                                "Address: {{ auth()->user()->address ?? '123 Medical Center, City' }}",
                                10, 58);

                            // Patient Info
                            doc.setFont("helvetica", "bold");
                            doc.setFontSize(11);
                            doc.text("Patient Information", 150, 40);
                            doc.setFont("helvetica", "normal");
                            doc.setFontSize(10);
                            doc.text("ID: {{ $patient->registration_id ?? 'PAT12345' }}", 150, 46);
                            doc.text("Name: {{ $patient->name ?? 'John Doe' }}", 150, 52);
                            doc.text(
                                "Age/Gender: {{ \Carbon\Carbon::parse($patient->dob)->age ?? '30' }}y, {{ ucfirst($patient->gender ?? 'Male') }}",
                                150, 58);
                            doc.text("Mobile: {{ $patient->phone ?? '+91 9876543210' }}", 150, 64);

                            // Date and Time
                            const currentDate = new Date();
                            const formattedDate = currentDate.toLocaleDateString('en-GB');
                            const formattedTime = currentDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            }).toUpperCase();

                            doc.setFont("helvetica", "bold");
                            doc.setFontSize(10);
                            doc.text("Date: " + formattedDate + " / Time: " + formattedTime, 138, 11);

                            // Horizontal line
                            doc.setDrawColor(...borderColor);
                            doc.setLineWidth(0.7);
                            doc.line(10, 70, 200, 70);

                            // Collect all sections with data only
                            const appointmentData = [{
                                    parameter: "Blood Group",
                                    value: "{{ $appointments->blood_group ?? 'N/A' }}"
                                },
                                {
                                    parameter: "Weight",
                                    value: "{{ $appointments->weight ?? 'N/A' }} kg"
                                },
                                {
                                    parameter: "BP Level",
                                    value: "{{ $appointments->bp ?? 'N/A' }}"
                                },
                                {
                                    parameter: "Height",
                                    value: "{{ $appointments->height ?? 'N/A' }}"
                                },
                                {
                                    parameter: "Follow-up Date",
                                    value: "{{ $appointments->follow_up_date ?? 'N/A' }}"
                                },
                                {
                                    parameter: "Temperature",
                                    value: "{{ $appointments->temperature ?? 'N/A' }}"
                                },
                                {
                                    parameter: "Pulse Rate",
                                    value: "{{ $appointments->pulse_rate ?? '72 bpm' }}"
                                },
                                {
                                    parameter: "Respiratory Rate",
                                    value: "{{ $appointments->respiratory_rate ?? '16 breaths/min' }}"
                                }
                            ];

                            const medicationsData = getMedicationsData();
                            const medicationsNote = $('#medicationsNote').val() || '';
                            if (medicationsNote) {
                                medicationsData.push({
                                    medicine: 'Additional Instructions',
                                    dose: '',
                                    frequency: '',
                                    when: '',
                                    duration: '',
                                    note: medicationsNote
                                });
                            }

                            const symptomsData = [];
                            $('#symptomsTable tbody tr').each(function() {
                                const item = $(this).find('td').eq(1).text();
                                const note = $(this).find('.note-input').val() || '';
                                symptomsData.push({
                                    item,
                                    note
                                });
                            });
                            const symptomsNote = $('#symptomsNote').val() || '';
                            if (symptomsNote) {
                                symptomsData.push({
                                    item: 'Additional Note',
                                    note: symptomsNote
                                });
                            }

                            const examinationData = [];
                            $('#examinationTable tbody tr').each(function() {
                                const item = $(this).find('td').eq(1).text();
                                const note = $(this).find('.note-input').val() || '';
                                examinationData.push({
                                    item,
                                    note
                                });
                            });
                            const examinationNote = $('#examinationNote').val() || '';
                            if (examinationNote) {
                                examinationData.push({
                                    item: 'Additional Note',
                                    note: examinationNote
                                });
                            }

                            const diagnosisData = [];
                            $('#diagnosisTable tbody tr').each(function() {
                                const item = $(this).find('td').eq(1).text();
                                const note = $(this).find('.note-input').val() || '';
                                diagnosisData.push({
                                    item,
                                    note
                                });
                            });
                            const diagnosisNote = $('#diagnosisNote').val() || '';
                            if (diagnosisNote) {
                                diagnosisData.push({
                                    item: 'Additional Note',
                                    note: diagnosisNote
                                });
                            }

                            const labTestsData = [];
                            $('#labTestsTable tbody tr').each(function() {
                                const item = $(this).find('td').eq(1).text();
                                const note = $(this).find('.note-input').val() || '';
                                labTestsData.push({
                                    item,
                                    note
                                });
                            });
                            const labNote = $('#labNote').val() || '';
                            if (labNote) {
                                labTestsData.push({
                                    item: 'Additional Note',
                                    note: labNote
                                });
                            }

                            const medicalHistoryText = $('#medicalHistoryNotes').val() || '';
                            const privateNotesText = $('#privateNotes').val() || '';
                            const medicalRecordsText = $('#medicalRecordsNotes').val() || '';
                            const labResultsText = $('#labResultsNotes').val() || '';

                            // Only include sections with actual data
                            const sectionHeights = [];

                            if (appointmentData.length > 0) {
                                sectionHeights.push({
                                    type: 'table',
                                    data: appointmentData,
                                    title: "Appointment Details:",
                                    height: estimateTableHeight(appointmentData, doc, 90)
                                });
                            }

                            if (medicationsData.length > 0) {
                                sectionHeights.push({
                                    type: 'table',
                                    data: medicationsData,
                                    title: "Medications :",
                                    height: estimateTableHeight(medicationsData, doc, 40)
                                });
                            }

                            if (symptomsData.length > 0) {
                                sectionHeights.push({
                                    type: 'table',
                                    data: symptomsData,
                                    title: "Symptoms:",
                                    height: estimateTableHeight(symptomsData, doc)
                                });
                            }

                            if (examinationData.length > 0) {
                                sectionHeights.push({
                                    type: 'table',
                                    data: examinationData,
                                    title: "Examination:",
                                    height: estimateTableHeight(examinationData, doc)
                                });
                            }

                            if (diagnosisData.length > 0) {
                                sectionHeights.push({
                                    type: 'table',
                                    data: diagnosisData,
                                    title: "Diagnosis:",
                                    height: estimateTableHeight(diagnosisData, doc)
                                });
                            }

                            if (labTestsData.length > 0) {
                                sectionHeights.push({
                                    type: 'table',
                                    data: labTestsData,
                                    title: "Lab Investigation:",
                                    height: estimateTableHeight(labTestsData, doc)
                                });
                            }

                            if (medicalHistoryText) {
                                sectionHeights.push({
                                    type: 'text',
                                    title: "Medical History:",
                                    text: medicalHistoryText,
                                    height: estimateTextSectionHeight("Medical History:",
                                        medicalHistoryText, doc)
                                });
                            }

                            if (privateNotesText) {
                                sectionHeights.push({
                                    type: 'text',
                                    title: "Private Notes:",
                                    text: privateNotesText,
                                    height: estimateTextSectionHeight("Private Notes:",
                                        privateNotesText, doc)
                                });
                            }

                            if (medicalRecordsText) {
                                sectionHeights.push({
                                    type: 'text',
                                    title: "Medical Records:",
                                    text: medicalRecordsText,
                                    height: estimateTextSectionHeight("Medical Records:",
                                        medicalRecordsText, doc)
                                });
                            }

                            if (labResultsText) {
                                sectionHeights.push({
                                    type: 'text',
                                    title: "Lab Results:",
                                    text: labResultsText,
                                    height: estimateTextSectionHeight("Lab Results:",
                                        labResultsText, doc)
                                });
                            }

                            // Draw sections with space optimization
                            let yPos = 80;
                            let pageCount = 1;

                            sectionHeights.forEach((section) => {
                                // Check if section fits in remaining space
                                if (yPos + section.height > maxY) {
                                    doc.addPage();
                                    pageCount++;
                                    doc.setDrawColor(...borderColor);
                                    doc.setLineWidth(0.7);
                                    doc.rect(5, 5, 200, 287);
                                    yPos = 20;
                                }

                                if (section.type === 'table') {
                                    if (section.title === "Appointment Details:") {
                                        // New function call - NO TABLE
                                        yPos = drawAppointmentDetails(section.data, section.title,
                                            yPos, doc);
                                    } else if (section.title === "Medications:") {
                                        yPos = drawMedicationsTable(section.data, section.title,
                                            yPos, doc);
                                    } else {
                                        yPos = drawTable(section.data, section.title, yPos, doc);
                                    }
                                }
                            });

                            // Add watermark to all pages
                            addWatermark(doc, pageCount);

                            // Footer on last page
                            doc.setFontSize(10);
                            doc.setTextColor(150);
                            doc.text("AK Clinic | Confidential – For Medical Use Only", 105, 290, {
                                align: 'center'
                            });

                            window.open(doc.output('bloburl'), '_blank');
                        };

                        reader.readAsDataURL(blob);
                    })
                    .catch(error => {
                        console.error('Error loading logo:', error);
                        showAlert('PDF generation failed due to logo loading error. Please try again.',
                        'error');
                    });
            }

            // Print Billing Details as PDF
            window.printBilling = function(billingId) {
                $.ajax({
                    url: "{{ route('billings.show', ':id') }}".replace(':id', billingId),
                    type: 'GET',
                    success: function({
                        success,
                        billing,
                        message
                    }) {
                        if (success) {
                            const {
                                jsPDF
                            } = window.jspdf;
                            const doc = new jsPDF();
                            const pageWidth = 210;
                            const pageHeight = 297;
                            const margin = 12;
                            const contentWidth = pageWidth - (margin * 2);
                            const borderColor = [14, 96, 110];
                            const headerBgColor = [248, 249, 250];
                            const amountColor = [40, 40, 40];

                            let yPos = margin;
                            let pageCount = 1;

                            // Draw border on first page
                            doc.setDrawColor(...borderColor);
                            doc.setLineWidth(0.7);
                            doc.rect(5, 5, 200, 287);

                            function addWatermark() {
                                const doctorName =
                                    "{{ current_clinic()->clinic_name ?? 'AK Clinic' }}";
                                doc.setTextColor(200, 200, 200);
                                doc.setFontSize(30);
                                doc.setFont("helvetica", "bold");
                                doc.saveGraphicsState();
                                doc.setGState(new doc.GState({
                                    opacity: 0.2
                                }));
                                doc.text(doctorName, 60, 180, {
                                    angle: 45
                                });
                                doc.restoreGraphicsState();
                                doc.setTextColor(0);
                            }

                            addWatermark();

                            // Top Header
                            doc.setFillColor(...headerBgColor);
                            doc.rect(margin, yPos, contentWidth, 22, 'F');

                            try {
                                const logoUrl =
                                "{{ asset('assets-doctor/img/prescription.png') }}";
                                const img = new Image();
                                img.src = logoUrl;
                                doc.addImage(img, 'PNG', margin + 5, yPos + 2, 16, 16);
                            } catch (e) {}

                            doc.setFontSize(16);
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(...borderColor);
                            doc.text("MEDICAL BILL", pageWidth / 2, yPos + 8, {
                                align: 'center'
                            });

                            doc.setFontSize(9);
                            doc.setTextColor(80, 80, 80);
                            doc.text("Dr. {{ Auth::user()->name }}", pageWidth / 2, yPos + 14, {
                                align: 'center'
                            });
                            doc.text("MBBS, MD - Consultant Physician", pageWidth / 2, yPos + 18, {
                                align: 'center'
                            });

                            yPos += 40;

                            // Bill Information
                            doc.setFontSize(8);
                            doc.setTextColor(80, 80, 80);
                            doc.text("Bill No:", margin + 5, yPos);
                            doc.setFont(undefined, 'bold');
                            doc.text(billing.bill_number || 'N/A', margin + 18, yPos);
                            doc.setFont(undefined, 'normal');
                            doc.text("Bill Date:", margin + 60, yPos);
                            doc.text(new Date(billing.created_at).toLocaleDateString('en-IN'),
                                margin + 78, yPos);
                            doc.text("Patient ID:", pageWidth - margin - 35, yPos);
                            doc.setFont(undefined, 'bold');
                            doc.text(billing.patient.registration_id || 'N/A', pageWidth - margin -
                                5, yPos, {
                                    align: 'right'
                                });

                            yPos += 10;

                            // Patient Information
                            doc.setFontSize(9);
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(...borderColor);
                            doc.text("PATIENT INFORMATION", margin + 5, yPos);
                            yPos += 6;

                            const col1X = margin + 5;
                            const col2X = margin + contentWidth / 2 + 10;

                            doc.setFontSize(8);
                            doc.setFont(undefined, 'normal');
                            doc.setTextColor(0, 0, 0);
                            doc.text(`Name: ${billing.patient.name || '-'}`, col1X, yPos);
                            doc.text(`Mobile: ${billing.patient.phone || '-'}`, col1X, yPos + 4);
                            doc.text(`Email: ${billing.patient.email || '-'}`, col2X, yPos);
                            doc.text(`Patient ID: ${billing.patient.registration_id || '-'}`, col2X,
                                yPos + 4);

                            yPos += 14;

                            // Billing Summary
                            doc.setFontSize(10);
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(...borderColor);
                            doc.text("BILLING SUMMARY", margin + 5, yPos);
                            yPos += 7;

                            doc.setFillColor(...headerBgColor);
                            doc.rect(margin, yPos, contentWidth, 6, 'F');

                            doc.setFontSize(8);
                            doc.setTextColor(0, 0, 0);
                            doc.text("Description", margin + 5, yPos + 4);
                            doc.setCharSpace(-0.3);
                            doc.text("Amount (₹)", margin + contentWidth - 25, yPos + 4, {
                                align: 'right'
                            });

                            yPos += 6;

                            const billingType = billing.billing_type.name ||
                                'Medical Consultation & Services';
                            doc.text(billingType, margin + 5, yPos + 4);
                            doc.setFont(undefined, 'normal');
                            doc.setTextColor(...amountColor);
                            doc.text(`₹${parseFloat(billing.total_amount).toFixed(2)}`, margin +
                                contentWidth - 25, yPos + 4, {
                                    align: 'right'
                                });

                            yPos += 12;

                            doc.setDrawColor(200, 200, 200);
                            doc.setLineWidth(0.2);
                            doc.line(margin + 110, yPos, margin + contentWidth - 5, yPos);

                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(0, 0, 0);
                            doc.text("Total Amount:", margin + 115, yPos + 4);
                            doc.setCharSpace(-0.3);
                            doc.text(`₹${parseFloat(billing.total_amount).toFixed(2)}`, margin +
                                contentWidth - 25, yPos + 4, {
                                    align: 'right'
                                });
                            doc.setCharSpace(0);

                            yPos += 5;

                            doc.text("Received Amount:", margin + 115, yPos + 4);
                            doc.setCharSpace(-0.3);
                            doc.text(`₹${parseFloat(billing.received_amount).toFixed(2)}`, margin +
                                contentWidth - 25, yPos + 4, {
                                    align: 'right'
                                });
                            doc.setCharSpace(0);

                            yPos += 5;

                            doc.setTextColor(220, 53, 69);
                            doc.text("Pending Amount:", margin + 115, yPos + 4);
                            doc.setCharSpace(-0.3);
                            doc.text(`₹${parseFloat(billing.pending_amount).toFixed(2)}`, margin +
                                contentWidth - 25, yPos + 4, {
                                    align: 'right'
                                });
                            doc.setCharSpace(0);
                            doc.setTextColor(0, 0, 0);

                            yPos += 14;

                            // Payment Information
                            doc.setFontSize(9);
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(...borderColor);
                            doc.text("PAYMENT INFORMATION", margin + 5, yPos);
                            yPos += 6;

                            doc.setFontSize(8);
                            doc.setFont(undefined, 'normal');

                            const paymentMethod = billing.payment_method.charAt(0).toUpperCase() +
                                billing.payment_method.slice(1);
                            const status = billing.status.toUpperCase();
                            const statusColor = billing.status === 'paid' ? [40, 167, 69] :
                                billing.status === 'partial' ? [255, 193, 7] : [220, 53, 69];

                            doc.text(`Payment Method: ${paymentMethod}`, col1X, yPos);
                            doc.setTextColor(...statusColor);
                            doc.text(`Status: ${status}`, col2X, yPos);
                            doc.setTextColor(0, 0, 0);

                            yPos += 8;

                            const paymentDetails = billing.payment_details || {};

                            if (Object.keys(paymentDetails).length > 0) {
                                doc.setFillColor(...headerBgColor);
                                doc.rect(margin, yPos, contentWidth, 5, 'F');
                                doc.setFont(undefined, 'bold');
                                doc.text("Payment Details", margin + 5, yPos + 3.5);
                                yPos += 14;

                                doc.setFont(undefined, 'normal');

                                if (billing.payment_method === 'upi') {
                                    doc.text(`UPI ID: ${paymentDetails.upi_id || '-'}`, col1X,
                                    yPos);
                                    doc.text(`Date: ${paymentDetails.transaction_date || '-'}`,
                                        col2X, yPos);
                                } else if (billing.payment_method === 'cash') {
                                    doc.text(`Payment Date: ${paymentDetails.payment_date || '-'}`,
                                        col1X, yPos);
                                } else if (billing.payment_method === 'card') {
                                    doc.text(`Card: ${paymentDetails.card_number || '-'}`, col1X,
                                        yPos);
                                    yPos += 4;
                                    doc.text(`Expiry: ${paymentDetails.expiry || '-'}`, col1X,
                                    yPos);
                                } else if (billing.payment_method === 'netbanking') {
                                    doc.text(`Bank: ${paymentDetails.bank_name || '-'}`, col1X,
                                        yPos);
                                    yPos += 4;
                                    doc.text(`Txn ID: ${paymentDetails.transaction_id || '-'}`,
                                        col1X, yPos);
                                }

                                yPos += 8;
                            } else {
                                yPos += 4;
                            }

                            // Notes Section
                            if (billing.notes && billing.notes.trim() !== '') {
                                doc.setFontSize(9);
                                doc.setFont(undefined, 'bold');
                                doc.setTextColor(...borderColor);
                                doc.text("NOTES", margin + 5, yPos);
                                yPos += 5;

                                doc.setFontSize(8);
                                doc.setFont(undefined, 'normal');
                                doc.setTextColor(0, 0, 0);

                                const splitNotes = doc.splitTextToSize(billing.notes, contentWidth -
                                    10);
                                doc.text(splitNotes, margin + 5, yPos);
                                yPos += (splitNotes.length * 3) + 8;
                            }

                            // Footer
                            const footerStartY = pageHeight - margin - 30;

                            doc.setDrawColor(200, 200, 200);
                            doc.setLineWidth(0.3);
                            doc.line(margin, footerStartY, margin + contentWidth, footerStartY);

                            doc.setFontSize(7);
                            doc.setTextColor(100, 100, 100);
                            doc.text("Authorized Signature", margin + 5, footerStartY + 6);
                            doc.setFont(undefined, 'bold');
                            doc.text("Dr. {{ Auth::user()->name }}", margin + 5, footerStartY +
                            10);

                            const centerX = pageWidth / 2;

                            doc.setFont(undefined, 'normal');
                            doc.text("This is a computer generated bill", centerX, footerStartY +
                            6, {
                                align: 'center'
                            });
                            doc.text("No signature required", centerX, footerStartY + 10, {
                                align: 'center'
                            });
                            doc.text("For queries: +91-9876543210", centerX, footerStartY + 14, {
                                align: 'center'
                            });

                            const currentDate = new Date().toLocaleDateString('en-IN');
                            const currentTime = new Date().toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            doc.text(`Generated: ${currentDate}`, margin + contentWidth - 5,
                                footerStartY + 6, {
                                    align: 'right'
                                });
                            doc.text(`Time: ${currentTime}`, margin + contentWidth - 5,
                                footerStartY + 10, {
                                    align: 'right'
                                });

                            // Ensure border on all pages
                            doc.setDrawColor(...borderColor);
                            doc.setLineWidth(0.7);
                            doc.rect(5, 5, 200, 287);

                            const pdfBlob = doc.output('blob');
                            const pdfUrl = URL.createObjectURL(pdfBlob);
                            const printWindow = window.open(pdfUrl, '_blank');

                            if (printWindow) {
                                printWindow.onload = function() {
                                    printWindow.print();
                                };
                            }

                            showAlert('Opening PDF for printing...', 'success');
                        } else {
                            showAlert(message || 'Error fetching billing details!', 'error');
                        }
                    },
                    error: () => showAlert('Error fetching billing details!', 'error')
                });
            };

            // Submit billing form
            $('#submitBilling').on('click', function(e) {
                e.preventDefault();
                const formData = $('#billingForm').serialize();

                $.ajax({
                    url: "{{ route('billingsConsultpage.store') }}",
                    method: 'POST',
                    data: formData,
                    success: function(response) {
                        showAlert('Bill submitted successfully!', 'success');
                        $('#BillingRecords').modal('hide');
                        $('#submitModal').removeClass('show');
                        $('#submitModalOverlay').removeClass('show');
                        
                        setTimeout(() => {
                            window.location.href = "{{ route('doctors.appointment') }}";
                        }, 1500);
                    },
                    error: function(xhr) {
                        console.error('Billing submission error:', xhr.responseJSON);
                        showAlert('Error submitting bill: ' + (xhr.responseJSON?.message ||
                            'Unknown error. Please check console.'), 'error');
                    }
                });
            });

            // Payment method selection
            window.selectPaymentMethod = function(method) {
                $('.payment-fields').hide();
                $(`#${method}Fields`).show();
                $(`#payment${method.charAt(0).toUpperCase() + method.slice(1)}`).prop('checked', true);
                $(`input[name="payment_method"]`).not(
                    `#payment${method.charAt(0).toUpperCase() + method.slice(1)}`).prop('checked', false);
                $('.payment-fields').not(`#${method}Fields`).find('input, select').val('');
            };

            $('.payment-option').on('click', function() {
                const method = $(this).find('input').val();
                selectPaymentMethod(method);
            });

            // Calculate pending amount
            $('#totalAmount, #receivedAmount').on('input', function() {
                const total = parseFloat($('#totalAmount').val()) || 0;
                const received = parseFloat($('#receivedAmount').val()) || 0;
                const pending = total - received;
                $('#pendingAmount').val(pending >= 0 ? pending.toFixed(2) : 0);
            });

            // Open Add Billing Type Modal and handle backdrop/switching
            $('#openAddBillingTypeModal').on('click', function() {
                $('#BillingRecords').modal('hide');
                const addModal = new bootstrap.Modal(document.getElementById('AddBillingTypeModal'));
                addModal.show();
                
                // When Add Billing Type Modal is hidden, open BillingRecords back
                $('#AddBillingTypeModal').off('hidden.bs.modal').on('hidden.bs.modal', function() {
                    const billingModal = new bootstrap.Modal(document.getElementById('BillingRecords'));
                    billingModal.show();
                });
            });

            // Billing Type change event to auto-populate amount
            $('#billingTypeSelect').on('change', function() {
                const defaultAmount = $(this).find('option:selected').data('default-amount');
                if (defaultAmount !== undefined && defaultAmount !== null && defaultAmount !== '') {
                    $('#totalAmount').val(defaultAmount);
                    $('#totalAmount, #receivedAmount').trigger('input');
                }
            });

            // Submit new billing type via AJAX
            $('#addBillingTypeForm').on('submit', function(e) {
                e.preventDefault();
                const name = $('#newBillingTypeName').val().trim();
                const default_amount = $('#newBillingTypeAmount').val().trim();
                if (!name) {
                    showAlert('Billing type name is required!', 'warning');
                    return;
                }

                $.ajax({
                    url: "{{ route('billing-types.store') }}",
                    method: 'POST',
                    data: {
                        _token: "{{ csrf_token() }}",
                        name: name,
                        default_amount: default_amount
                    },
                    success: function(response) {
                        if (response.success) {
                            showAlert('Billing type created successfully!', 'success');
                            $('#AddBillingTypeModal').modal('hide');
                            $('#addBillingTypeForm')[0].reset();
                            
                            // Reload billing types list and select the newly created one
                            loadBillingTypes(response.billing_type.id);
                        } else {
                            showAlert(response.message || 'Error creating billing type!', 'error');
                        }
                    },
                    error: function(xhr) {
                        showAlert('Error creating billing type: ' + (xhr.responseJSON?.message || 'Unknown error'), 'error');
                    }
                });
            });

            // Helper function to reload billing types dynamically
            function loadBillingTypes(selectId = null) {
                $.ajax({
                    url: "{{ route('billing-types.get') }}",
                    method: 'GET',
                    success: function(data) {
                        const select = $('#billingTypeSelect').empty().append('<option value="">Select Billing Type ...</option>');
                        data.forEach(type => {
                            select.append(`<option value="${type.id}" data-default-amount="${type.default_amount}">${type.name}</option>`);
                        });
                        if (selectId) {
                            select.val(selectId).trigger('change');
                        }
                    },
                    error: function() {
                        showAlert('Error loading billing types!', 'error');
                    }
                });
            }

            // Real-time preview update when textareas are edited
            $('#symptomsNote, #examinationNote, #diagnosisNote, #labNote, #bloodGroup, #weight, #bp, #height, #medicationsNote, #additionalNotes, #followUpText').on('input change keyup', function() {
                updatePreview();
            });
        });

        // Welcome Modal
        document.addEventListener("DOMContentLoaded", function() {
            const pathParts = window.location.pathname.split('/');
            const consultationId = pathParts[pathParts.length - 1];
            const prescriptionsLink = document.querySelector('a[href*="doctor-upload-consultation-prescription"]');

            if (prescriptionsLink) {
                prescriptionsLink.href = `/doctor-upload-consultation-prescription/${consultationId}`;
            }

            setTimeout(function() {
                var myModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
                myModal.show();
            }, 100);

            const manuallyBtn = document.querySelector('[data-bs-dismiss="modal"]');
            if (manuallyBtn) {
                manuallyBtn.addEventListener('click', function() {});
            }
        });
    </script>

    <script>
        // Voice Recognition Code - FIXED WITH ACCUMULATION
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition;
        let currentTargetId = '';
        let fullTranscript = ''; // Poori transcript store karega
        let isListening = false;
        const voiceModal = $('#voiceModal');
        const transcriptPreview = $('#transcriptPreview');
        const stopBtn = $('#stopVoiceBtn');
        const closeBtn = $('#closeModalBtn');

        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = true; // Continuous listening
            recognition.interimResults = true; // Show interim results
            recognition.maxAlternatives = 1; // Take best result

            recognition.onstart = function() {
                isListening = true;
                console.log('Voice recognition started');
            };

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';

                // Sab results process karo
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;

                    if (event.results[i].isFinal) {
                        // Final result - accumulate
                        final += transcript + ' ';
                    } else {
                        // Interim result - show but don't store permanently
                        interim = transcript;
                    }
                }

                // Full transcript mein final result add karo
                if (final) {
                    fullTranscript += final;
                }

                // Current display text (final + interim)
                const displayText = fullTranscript + (interim ? ' ' + interim : '');

                // Update preview
                transcriptPreview.text(displayText || 'Listening... Speak now.');

                // Update target textarea
                $('#' + currentTargetId).val(displayText).trigger('input');

                // Auto-scroll textarea to bottom
                const textarea = $('#' + currentTargetId)[0];
                if (textarea) {
                    textarea.scrollTop = textarea.scrollHeight;
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                let errorMsg = '';

                if (event.error === 'no-speech') {
                    errorMsg = 'No speech detected. Speak louder or check mic.';
                } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    errorMsg = 'Microphone access denied. Please allow microphone access.';
                } else if (event.error === 'service-not-allowed') {
                    errorMsg = 'Speech service not allowed.';
                } else {
                    errorMsg = 'Error: ' + event.error + '. Try again.';
                }

                transcriptPreview.text(errorMsg);

                // Auto close after 3 seconds on error
                setTimeout(() => {
                    closeVoiceModal();
                }, 3000);
            };

            recognition.onend = () => {
                isListening = false;
                console.log('Voice recognition ended');

                // Agar manually stopped nahi hai aur modal still open hai to restart
                if (!stopBtn.data('stopped') && voiceModal.hasClass('show')) {
                    console.log('Restarting recognition...');
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Restart failed, might already be running');
                    }
                }
            };

            // Voice mic click handler
            $('.voice-mic').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const newTargetId = $(this).data('target');

                // Agar same target hai aur already listening hai to append karo
                if (currentTargetId === newTargetId && isListening) {
                    // Continue listening - same target
                    console.log('Continuing on same target');
                } else {
                    // Naya target - reset karo
                    currentTargetId = newTargetId;

                    // Purana transcript le lo agar already kuch likha hai
                    const existingText = $('#' + currentTargetId).val();
                    fullTranscript = existingText ? existingText + ' ' : '';
                }

                transcriptPreview.text(fullTranscript || 'Listening... Speak now.');

                // Show modal
                voiceModal.addClass('show');
                voiceModal.css('display', 'flex');

                stopBtn.data('stopped', false);

                // Start recognition
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Recognition start error:', e);
                    // Agar already running hai to continue
                    if (e.message.includes('started')) {
                        console.log('Recognition already started');
                    } else {
                        transcriptPreview.text('Error starting microphone. Please try again.');
                    }
                }
            });

            // Stop button
            stopBtn.on('click', function() {
                $(this).data('stopped', true);
                try {
                    recognition.stop();
                } catch (e) {}
                closeVoiceModal();
            });

            // Close button
            closeBtn.on('click', function() {
                try {
                    recognition.stop();
                } catch (e) {}
                closeVoiceModal();
            });

            // Click outside to close
            voiceModal.on('click', function(e) {
                if ($(e.target).is(voiceModal)) {
                    try {
                        recognition.stop();
                    } catch (e) {}
                    closeVoiceModal();
                }
            });

            function closeVoiceModal() {
                voiceModal.removeClass('show');
                voiceModal.css('display', 'none');
                $(`.voice-mic[data-target="${currentTargetId}"]`).siblings('.voice-indicator').text('');
                currentTargetId = '';
                fullTranscript = '';
                stopBtn.data('stopped', true);
                isListening = false;
            }
        } else {
            $('.voice-mic').hide();
            showAlert('Speech Recognition not supported in this browser. Please use Chrome or Edge.', 'error');
        }
    </script>
</body>

</html>
