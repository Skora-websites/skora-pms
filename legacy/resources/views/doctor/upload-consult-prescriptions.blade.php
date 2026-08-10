<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor Consultation Upload Prescriptions</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    @include('doctor.inc.header-links')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
        :root {
            --primary-color: #0e606e;
            --primary-light: #e3f2f5;
        }

        @media print {
            .submit-modal, 
            .navbar, 
            .sidebar, 
            .footer, 
            .btn, 
            .modal-backdrop, 
            #showActionsBtn,
            #cancelAction,
            .modal-header button,
            .upload-area,
            .remove-file {
                display: none !important;
            }
            body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .card {
                border: none !important;
                box-shadow: none !important;
            }
            .main-content {
                margin: 0 !important;
                padding: 0 !important;
            }
        }

         .form-selects {
        display: block;
        padding: 0.33rem 1.31rem 0.33rem 0.47rem;
        font-size: 0.95rem;
        font-weight: 400;
        line-height: 1.5;
        color: #6c7688a8;
        appearance: none;
        background-color: var(--pr-secondary-bg);
        background-image: var(--pr-form-select-bg-img), var(--pr-form-select-bg-icon, none);
        background-repeat: no-repeat;
        background-position: right 0.77rem center;
        background-size: 14px 10px;
        border: var(--pr-border-width) solid var(--pr-border-color);
        border-radius: 0.4rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
     }
           .payment-option {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            border: 1px solid #d1e7f5;
            border-radius: 6px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .payment-option:hover {
            border-color: var(--secondary);
        }
        
        .payment-option.selected {
            border-color: var(--secondary);
            background-color: var(--light-blue);
        }
        
        .payment-option input {
            margin-right: 10px;
        }
        .upload-container {
            border: 2px dashed #dee2e6;
            border-radius: 10px;
            padding: 20px;
            background: #f8f9fa;
            transition: all 0.3s ease;
        }

        .upload-container:hover {
            border-color: var(--primary-color);
            background: white;
        }

        .upload-area {
            cursor: pointer;
            text-align: center;
            padding: 30px;
        }

        .upload-area i {
            font-size: 48px;
            color: var(--primary-color);
            margin-bottom: 10px;
        }

        .preview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }

        .preview-item {
            position: relative;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            background: white;
        }

        .preview-item img,
        .pdf-preview {
            width: 100%;
            height: 100px;
            object-fit: cover;
        }

        .pdf-preview {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            color: var(--primary-color);
        }

        .preview-item .file-name {
            font-size: 11px;
            padding: 5px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            background: #f8f9fa;
        }

        .remove-file {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #dc3545;
            color: white;
            border: none;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
        }

        .preview-item:hover .remove-file {
            opacity: 1;
        }

        .notes-section {
            background: var(--primary-light);
            border-left: 4px solid var(--primary-color);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }

        .submit-modal {
            display: none;
            position: fixed;
            top: 0;
            right: -400px;
            width: 380px;
            height: 100%;
            background: white;
            box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
            z-index: 1050;
            transition: right 0.3s ease;
        }

        .submit-modal.show {
            right: 0;
            display: block;
        }

        .action-btn {
            width: 100%;
            padding: 15px;
            margin-bottom: 12px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .action-btn:hover {
            transform: translateX(-5px);
            box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Notification */
        .notification-sidebar {
            position: fixed;
            top: 45px;
            right: -320px;
            z-index: 99999;
            transition: right 0.5s ease-in-out, opacity 0.5s ease;
        }

        .notification-sidebar.show-notification {
            right: 10px;
        }

        .custom-alert-box {
            background: white;
            border-radius: 10px;
            border-left: 5px solid #28a745;
            overflow: hidden;
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .custom-alert-box.alert-success {
            border-left-color: #28a745;
            background: #edfff3;
        }

        .custom-alert-box.alert-error {
            border-left-color: #dc3545;
            background: #ffebed;
        }

        .custom-alert-box.alert-info {
            border-left-color: #17a2b8;
            background: #e6f7f9;
        }

        .custom-alert-box.alert-warning {
            border-left-color: #ffc107;
            background: #fffbeb;
        }

        .p-custom {
            padding: 2px 44px 3px 16px;
        }

        .close-btn {
            background: none;
            border: none;
            color: #333;
            font-size: 20px;
            cursor: pointer;
            position: absolute;
            right: 10px;
            top: 8px;
        }
    </style>
</head>

<body>
    <div class="main-wrapper">
        @include('doctor.inc.header1')


        <!-- ====================== BILLING MODAL (FULL FEATURED) ====================== -->
        <div class="modal fade" id="BillingRecords" tabindex="-1">
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
                                            <select class="form-selects" id="billingTypeSelect" name="billing_type_id"
                                                required>
                                                <option value="">Select Billing Type ...</option>
                                                @foreach ($billingtype as $type)
                                                    <option value="{{ $type->id }}">{{ $type->name }}</option>
                                                @endforeach
                                            </select>
                                            <a href="{{ route('doctor-billing') }}" class="btn btn-outline-primary"
                                                title="Add Billing Type">
                                                <i class="fas fa-arrow-right"></i>
                                                <i class="fas fa-user-plus"></i>
                                            </a>
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
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="card-title color-doctorrx mb-0">Select Payment Method</h6>
                                </div>
                                <div class="card-body">
                                    <div class="payment-method-card">
                                        <div class="row">
                                            <!-- Left Side - Payment Options -->
                                            <div class="col-md-5">
                                                <label for="paymentUpi" class="mb-0 w-100">
                                                    <div class="payment-option">
                                                        <input type="radio" id="paymentUpi" name="payment_method"
                                                            value="upi" checked>
                                                        <i class="ti ti-brand-google-pay me-2"></i> UPI Payment
                                                    </div>
                                                </label>

                                                <label for="paymentCash" class="mb-0 w-100">
                                                    <div class="payment-option">
                                                        <input type="radio" id="paymentCash" name="payment_method"
                                                            value="cash">
                                                        <i class="ti ti-cash me-2"></i> Cash
                                                    </div>
                                                </label>

                                                <label for="paymentCard" class="mb-0 w-100">
                                                    <div class="payment-option">
                                                        <input type="radio" id="paymentCard" name="payment_method"
                                                            value="card">
                                                        <i class="ti ti-credit-card me-2"></i> Card
                                                    </div>
                                                </label>

                                                <label for="paymentNetbanking" class="mb-0 w-100">
                                                    <div class="payment-option">
                                                        <input type="radio" id="paymentNetbanking"
                                                            name="payment_method" value="netbanking">
                                                        <i class="ti ti-building-bank me-2"></i> Net Banking
                                                    </div>
                                                </label>
                                            </div>

                                            <!-- Right Side - Dynamic Fields -->
                                            <div class="col-md-7">
                                                <div id="paymentFieldsContainer">
                                                    <!-- UPI Fields -->
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

                                                    <!-- Cash Fields -->
                                                    <div id="cashFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Cash Payment Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Payment Date</label>
                                                            <input type="date" class="form-control"
                                                                name="payment_details[payment_date]">
                                                        </div>
                                                    </div>

                                                    <!-- Card Fields -->
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
                                                                    name="payment_details[cvv]" placeholder="CVV"
                                                                    maxlength="4">
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Net Banking Fields -->
                                                    <div id="netbankingFields" class="payment-fields">
                                                        <h6 class="color-doctorrx mb-3">Net Banking Details</h6>
                                                        <div class="mb-3">
                                                            <label class="form-label">Bank Name</label>
                                                            <select class="form-select w-100"
                                                                name="payment_details[bank_name]">
                                                                <option value="">Select Bank</option>
                                                                <option>State Bank of India</option>
                                                                <option>HDFC Bank</option>
                                                                <option>ICICI Bank</option>
                                                                <option>Axis Bank</option>
                                                                <option>Kotak Mahindra Bank</option>
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
                                <button type="submit" class="btn btn-outline-primary"id="submitBilling">Submit
                                    Bill</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====================== RIGHT SIDE ACTION MODAL ====================== -->
        <div class="submit-modal shadow-lg" id="submitModal" style="border-radius: 20px 0 0 20px;">
            <div class="modal-header border-0 p-4 pb-0">
                <h5 class="modal-title fw-bold text-dark">Consultation Actions</h5>
                <button type="button" class="btn-close shadow-sm bg-white p-2 rounded-circle"
                    data-bs-dismiss="modal" aria-label="Close" id="closeModal" style="font-size: 10px;"></button>
            </div>
            <div class="p-4">
                <div class="modal-body p-0">
                    <p class="text-muted mb-4">Choose an action for the current consultation:</p>
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
                <div class="modal-footer border-0 mt-4 p-0">
                    <button class="btn btn-outline-secondary w-100 py-2 fw-semibold" id="cancelAction" style="border-radius: 10px;">Cancel</button>
                </div>
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


        <!-- ====================== MAIN CONTENT ====================== -->
        <div class="container-fluid">
            <div class="row mt-2">
                <!-- Left Column -->
                <div class="col-md-3">
                    <div class="card info-card">
                        <div class="card-header fw-bold">
                            <i class="ti ti-user-circle me-2"></i>Basic Info
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tr>
                                    <th>Patient ID</th>
                                    <td>{{ $patient->registration_id ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <th>Mobile</th>
                                    <td>{{ $patient->phone ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <th>Name</th>
                                    <td>{{ $patient->name ?? 'N/A' }} ({{ ucfirst($patient->gender ?? 'Male') }})</td>
                                </tr>
                                <tr>
                                    <th>Blood Group</th>
                                    <td>{{ $appointments->blood_group ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <th>Weight / BP</th>
                                    <td>{{ $appointments->weight ?? 'N/A' }} kg | {{ $appointments->bp ?? 'N/A' }}
                                    </td>
                                </tr>
                                <tr>
                                    <th>Age</th>
                                    <td>{{ isset($patient->dob) ? \Carbon\Carbon::parse($patient->dob)->age : 'N/A' }}
                                        years</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="col-md-9">
                    <div class="card mb-3">
                        <div class="card-header fw-bold">
                            <i class="ti ti-upload me-2"></i>Upload Prescriptions/Reports
                        </div>
                        <div class="card-body">
                            <form id="consultationForm">
                                @csrf
                                <input type="hidden" name="patient_id" value="{{ $patient->id ?? '' }}">

                                <div class="upload-container">
                                    <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                                        <i class="ti ti-cloud-upload"></i>
                                        <h6>Click to upload or drag & drop</h6>
                                        <p class="text-muted small">PDF, Images (Max 10 files)</p>
                                        <input type="file" id="fileInput" name="files[]" multiple
                                            accept=".pdf,image/*" style="display:none;">
                                    </div>
                                    <div id="previewContainer" class="preview-grid"></div>
                                </div>

                                <div class="notes-section mt-3">
                                    <label class="fw-bold mb-2"><i class="ti ti-notes me-2"></i>Additional
                                        Notes</label>
                                    <textarea id="consultationNotes" name="notes" class="form-control" rows="4"
                                        placeholder="Type your notes here..."></textarea>
                                </div>

                                <button type="button" id="showActionsBtn" class="btn btn-lg w-100 mt-3"
                                    style="background:var(--primary-color);color:white;">
                                    <i class="ti ti-arrow-right-circle me-2"></i> Proceed to Actions
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @include('doctor.inc.footer-links')
    @include('doctor.inc.footer')

    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        $(document).ready(function() {
            $('.payment-fields').addClass('d-none');

            $('#paymentUpi').prop('checked', true);

            function selectPaymentMethod(method) {
                $('.payment-fields').addClass('d-none');
                $(`#${method}Fields`).removeClass('d-none');
            }

            $('input[name="payment_method"]').on('change', function() {
                const method = $(this).val(); // upi, cash, card, netbanking
                selectPaymentMethod(method);
            });

            $('input[name="payment_method"]:checked').trigger('change');

            // ====================== FILE UPLOAD ======================
            let uploadedFiles = [];
            const fileInput = document.getElementById('fileInput');
            const previewContainer = document.getElementById('previewContainer');

            function handleFiles(files) {
                const valid = Array.from(files).filter(f => f.type.startsWith('image/') || f.type ===
                    'application/pdf');
                if (uploadedFiles.length + valid.length > 10) {
                    showNotification('Maximum 10 files allowed!', 'warning');
                    return;
                }
                uploadedFiles = [...uploadedFiles, ...valid];
                renderPreviews();
            }

            function renderPreviews() {
                previewContainer.innerHTML = '';
                uploadedFiles.forEach((file, i) => {
                    const div = document.createElement('div');
                    div.className = 'preview-item';

                    if (file.type.startsWith('image/')) {
                        const img = document.createElement('img');
                        const reader = new FileReader();
                        reader.onload = e => img.src = e.target.result;
                        reader.readAsDataURL(file);
                        div.appendChild(img);
                    } else {
                        div.innerHTML =
                            `<div class="pdf-preview"><i class="ti ti-file-pdf"></i><small>PDF</small></div>`;
                    }

                    const name = document.createElement('div');
                    name.className = 'file-name';
                    name.textContent = file.name.length > 18 ? file.name.substring(0, 15) + '...' : file
                        .name;
                    div.appendChild(name);

                    const remove = document.createElement('button');
                    remove.className = 'remove-file';
                    remove.innerHTML = '×';
                    remove.onclick = () => {
                        uploadedFiles.splice(i, 1);
                        renderPreviews();
                    };
                    div.appendChild(remove);
                    previewContainer.appendChild(div);
                });
            }

            fileInput.addEventListener('change', e => handleFiles(e.target.files));
            // Drag & Drop
            const uploadArea = document.querySelector('.upload-area');
            uploadArea.addEventListener('dragover', e => {
                e.preventDefault();
                uploadArea.style.background = 'var(--primary-light)';
            });
            uploadArea.addEventListener('dragleave', () => uploadArea.style.background = '');
            uploadArea.addEventListener('drop', e => {
                e.preventDefault();
                uploadArea.style.background = '';
                handleFiles(e.dataTransfer.files);
            });

            // ====================== ACTION MODAL ======================
            const submitModal = document.getElementById('submitModal');

            document.getElementById('showActionsBtn').addEventListener('click', () => {
                submitModal.classList.add('show'); // Slide in the sidebar
            });

            document.getElementById('cancelAction').addEventListener('click', () => {
                submitModal.classList.remove('show'); // Slide out
            });

            document.getElementById('closeModal').addEventListener('click', () => {
                submitModal.classList.remove('show'); // Slide out
            });

            document.getElementById('saveContinue').addEventListener('click', () => {
                saveConsultation('continue');
            });

            document.getElementById('printPrescription').addEventListener('click', () => {
                window.print();
            });

            document.getElementById('closePreviewBtn').addEventListener('click', () => {
                window.location.href = "{{ route('doctors.appointment') }}";
            });


            function saveConsultation(action, callback = null) {
                if (uploadedFiles.length === 0 && !callback) {
                    showNotification('Please upload at least one prescription file.', 'warning');
                    return;
                }

                const formData = new FormData();
                formData.append('appointment_id', "{{ $appointments->id ?? '' }}");
                uploadedFiles.forEach((file, i) => formData.append(`files[${i}]`, file));
                
                // Add notes
                formData.append('notes', document.getElementById('consultationNotes').value);
                
                // Add CSRF token
                formData.append('_token', "{{ csrf_token() }}");

                if (!callback) showNotification('Saving consultation...', 'info');

                $.ajax({
                    url: "{{ route('doctor.appointment.upload_prescription') }}",
                    method: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        if (callback) {
                            callback();
                        } else {
                            showNotification('Prescription uploaded successfully!', 'success');
                            setTimeout(() => {
                                window.location.href = "{{ route('doctors.appointment') }}";
                            }, 1500);
                        }
                    },
                    error: function(xhr) {
                        const msg = xhr.responseJSON?.message || 'Error saving consultation!';
                        showNotification(msg, 'error');
                    }
                });
            }

            // ====================== BILLING ======================
            // Auto pending amount
            $('#totalAmount, #receivedAmount').on('input', function() {
                const total = parseFloat($('#totalAmount').val()) || 0;
                const received = parseFloat($('#receivedAmount').val()) || 0;
                $('#pendingAmount').val(Math.max(0, total - received).toFixed(2));
            });

            function selectPaymentMethod(method) {
                $('.payment-fields').addClass('d-none');
                $(`#${method}Fields`).removeClass('d-none');
                $(`#pay${method.charAt(0).toUpperCase() + method.slice(1)}`).prop('checked', true);
            }

            // Submit Billing
            $('#submitBilling').on('click', function(e) {
                e.preventDefault();
                const billingFormData = $('#billingForm').serialize();

                // First save the consultation data (files/notes)
                saveConsultation(null, function() {
                    // Then save the billing data
                    $.ajax({
                        url: "{{ route('billingsConsultpage.store') }}",
                        method: 'POST',
                        data: billingFormData,
                        success: function() {
                            showNotification('Consultation and Bill submitted successfully!', 'success');
                            $('#BillingRecords').modal('hide');
                            submitModal.classList.remove('show');
                            
                            setTimeout(() => {
                                window.location.href = "{{ route('doctors.appointment') }}";
                            }, 1000);
                        },
                        error: function() {
                            showNotification('Error submitting bill!', 'error');
                        }
                    });
                });
            });

        });

        // ====================== NOTIFICATION FUNCTION ======================
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
            }

            var alertBox = document.createElement("div");
            alertBox.className =
                `custom-alert-box ${alertClass} notification-sidebar position-fixed show-notification mt-3 shadow-lg rounded`;
            alertBox.innerHTML = `
            <div class="${textClass} p-custom">
                <i class="${iconClass} icon"></i>
                ${msg}
                <button type="button" class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
            document.body.appendChild(alertBox);

            setTimeout(() => {
                alertBox.style.opacity = "0";
                setTimeout(() => alertBox.remove(), 600);
            }, 8000);
        }
    </script>
</body>

</html>
