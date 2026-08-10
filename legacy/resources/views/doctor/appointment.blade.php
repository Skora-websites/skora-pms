@extends('layouts.layout-doctor')
@section('title', 'Doctor || Appointments')
@section('content')
    @include('doctor.inc.custom')

    <div class="main-wrapper">
        <!-- Search Modal -->
        <div class="modal fade" id="searchModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content bg-transparent">
                    <div class="card shadow-none mb-0">
                        <div class="px-3 py-2 d-flex flex-row align-items-center" id="search-top">
                            <i class="ti ti-search fs-22"></i>
                            <input type="search" class="form-control border-0" placeholder="Search">
                            <button type="button" class="btn p-0" data-bs-dismiss="modal" aria-label="Close">
                                <i class="ti ti-x fs-22"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="page-wrapper">
            <div class="content">
                <div>
                    <h4 class="fw-bold mb-3 color-doctorrx">Manage Appointments</h4>
                </div>

                <!-- Filters -->
                <div class="mobile-horizontal-scroll mb-3">
                    <div class="d-flex align-items-center gap-2 flex-nowrap">
                        <div class="input-icon-start position-relative">
                            <span class="input-icon-addon text-dark">
                                <i class="ti ti-calendar-event"></i>
                            </span>
                            <input type="text" class="form-control form-control-sm date-input bookingrange"
                                value="Select Date Range" style="min-width: 180px;">
                        </div>

                        <input type="text" id="searchName" class="form-control form-control-sm"
                            placeholder="Search by Name" style="min-width: 180px;">

                        <input type="text" id="searchPhone" class="form-control form-control-sm"
                            placeholder="Search by Phone" style="min-width: 180px;">
                        <button id="todayFilterBtn" class="btn btn-outline-primary btn-sm ms-2">Today</button>
                    </div>
                </div>
                <div class="mobile-horizontal-scroll">
                    <div class="d-flex justify-content-between align-items-center flex-wrap flex-lg-nowrap mb-3">

                        <!-- Tabs -->
                        <ul class="nav nav-tabs flex-nowrap overflow-auto mb-2 mb-lg-0 pb-3 pe-2" id="statusTabs">
                            {{-- <li class="nav-item me-2 ">
                                <a class="nav-link  rounded border border-primary-subtle fw-semibold px-3"
                                    data-status="pending">
                                    Pending
                                </a>
                            </li>

                            <li class="nav-item me-2">
                                <a class="nav-link rounded border border-primary-subtle fw-semibold px-3"
                                    data-status="pending_consent">
                                    Consent Pending
                                </a>
                            </li> --}}

                            <li class="nav-item me-2">
                                <a class="nav-link active rounded border border-primary-subtle fw-semibold px-3"
                                    data-status="confirmed">
                                    Confirmed
                                </a>
                            </li>

                            <li class="nav-item me-2">
                                <a class="nav-link rounded border border-primary-subtle fw-semibold px-3"
                                    data-status="completed">
                                    Completed
                                </a>
                            </li>

                            <li class="nav-item">
                                <a class="nav-link rounded border border-primary-subtle fw-semibold px-3"
                                    data-status="cancelled">
                                    Cancelled
                                </a>
                            </li>
                        </ul>

                        <!-- Button -->
                        <div class="d-flex align-items-center flex-nowrap mt-2 mt-lg-0">
                            @can('appointments-create')
                            <a href="{{ route('book-appointment') }}"
                                class="btn btn-outline-primary btn-sm d-inline-flex align-items-center text-nowrap">
                                <i class="ti ti-plus me-1"></i> Book Appointment
                            </a>
                            @endcan
                        </div>

                    </div>
                </div>

                <!-- Today's Counts -->
                <span class="fw-semibold text-primary mb-0">Today Clinical Visit = <span id="today-clinical-visit"
                        class="fw-semibold text-danger">0</span></span> &nbsp;&nbsp;
                <span class="fw-semibold text-primary mb-0">Today Home Visit = <span id="today-home-visit"
                        class="fw-semibold text-danger">0</span></span>
                <p class="d-none fw-semibold text-primary mb-0">Today Online Visit = <span id="today-online-visit"
                        class="fw-semibold text-danger">0</span></p>
                <p class="d-none fw-semibold text-primary mb-0">Today Call Visit = <span id="today-call-visit"
                        class="fw-semibold text-danger">0</span></p>

                <!-- Appointments Table -->
                <div class="tab-content card mt-3">
                    <div id="appointmentTable" class="tab-pane active table datatable table-responsive text-nowrap">
                        <table class="table table-hover table-center mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Sr.</th>
                                    <th>Patient Name</th>
                                    <th>Contact</th>
                                    <th>Patient ID</th>
                                    <th>Visit Type</th>
                                    <th>Consent Status</th>
                                    <th>Slot Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="appointmentTableBody">
                                <tr>
                                    <td colspan="9" class="text-center py-4">
                                        <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                                        <p class="mt-2">Loading appointments...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div id="pagination" class="mt-3"></div>
                    </div>
                </div>
            </div>
        </div>
        @include('doctor.inc.footer')
    </div>

    <!-- View Appointment Modal -->
    <div class="modal fade" id="viewModal" tabindex="-1" aria-labelledby="viewModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-gradient-primary text-white">
                    <div class="d-flex align-items-center">
                        <h5 class="modal-title mb-0" id="viewModalLabel">Appointment Details</h5>
                    </div>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="patient-profile-section bg-light p-3">
                        <div class="row align-items-center">
                            <div class="col-md-3 text-center">
                                <div class="profile-image-container position-relative d-inline-block">
                                    <img id="modal-profile-image" src="" class="img-fluid rounded-circle shadow"
                                        alt="Patient Profile" style="width: 120px; height: 120px; object-fit: cover;">
                                </div>
                            </div>
                            <div class="col-md-9">
                                <h4 id="modal-name" class="mb-1 fw-bold text-dark"></h4>
                                <p class="text-muted mb-2" id="modal-patient-id"></p>
                                <div class="d-flex flex-wrap gap-3">
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-user me-2 text-primary"></i>
                                        <span id="modal-age"></span> years
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-gender-male me-2 text-primary"></i>
                                        <span id="modal-gender"></span>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <i class="ti ti-droplet me-2 text-primary"></i>
                                        <span id="modal-blood-group"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="details-section p-4">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="section-title text-uppercase text-muted mb-3 fw-semibold">Appointment
                                    Information</h6>
                                <div class="info-item mb-3">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="ti ti-calendar me-2 text-primary bg-light p-2 rounded"></i>
                                        <span class="fw-medium">Date & Time</span>
                                    </div>
                                    <div class="ms-4">
                                        <span id="modal-date"></span> at <span id="modal-time"></span>
                                    </div>
                                </div>
                                <div class="info-item mb-3">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="ti ti-stethoscope me-2 text-primary bg-light p-2 rounded"></i>
                                        <span class="fw-medium">Visit Type</span>
                                    </div>
                                    <div class="ms-4">
                                        <span id="modal-visit-type"></span>
                                    </div>
                                </div>
                                <div class="info-item mb-3">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="ti ti-status-change me-2 text-primary bg-light p-2 rounded"></i>
                                        <span class="fw-medium">Status</span>
                                    </div>
                                    <div class="ms-4">
                                        <span id="modal-status" class="badge"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="section-title text-uppercase text-muted mb-3 fw-semibold">Medical Information
                                </h6>
                                <div class="info-item mb-3">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="ti ti-heartbeat me-2 text-primary bg-light p-2 rounded"></i>
                                        <span class="fw-medium">Blood Pressure</span>
                                    </div>
                                    <div class="ms-4">
                                        <span id="modal-bp"></span>
                                    </div>
                                </div>
                                <div class="info-item mb-3">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="ti ti-weight me-2 text-primary bg-light p-2 rounded"></i>
                                        <span class="fw-medium">Weight & Height</span>
                                    </div>
                                    <div class="ms-4">
                                        <span id="modal-weight"></span> kg / <span id="modal-height"></span> cm
                                    </div>
                                </div>
                                <div class="info-item mb-3">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="ti ti-phone me-2 text-primary bg-light p-2 rounded"></i>
                                        <span class="fw-medium">Contact</span>
                                    </div>
                                    <div class="ms-4">
                                        <span id="modal-phone"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <h6 class="section-title text-uppercase text-muted mb-3 fw-semibold">Remarks</h6>
                                <p id="modal-remarks"></p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="section-title text-uppercase text-muted mb-3 fw-semibold">Note</h6>
                                <p id="modal-note"></p>
                            </div>
                        </div>
                        <div class="row mt-3" id="consentSection" style="display: none;">
                            <div class="col-12">
                                <h6 class="section-title text-uppercase text-muted mb-3 fw-semibold">Consent Information
                                </h6>
                                <div class="info-item mb-3">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="ti ti-file-text me-2 text-primary bg-light p-2 rounded"></i>
                                        <span class="fw-medium">Consent Type</span>
                                    </div>
                                    <div class="ms-4">
                                        <span id="modal-consent-type"></span>
                                    </div>
                                </div>
                                <div class="info-item mb-3" id="consentFileSection" style="display: none;">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="ti ti-download me-2 text-primary bg-light p-2 rounded"></i>
                                        <span class="fw-medium">Consent File</span>
                                    </div>
                                    <div class="ms-4">
                                        <a id="consent-file-link" href="#" target="_blank"
                                            class="btn btn-sm btn-outline-primary">View Consent File</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Cancel Appointment Modal -->
    <div class="modal fade" id="cancelAppointmentModal" tabindex="-1" aria-labelledby="cancelModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-danger">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title text-white" id="cancelModalLabel">
                        <i class="ti ti-alert-triangle me-2"></i> Cancel Appointment
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>
                <div class="modal-body text-dark">
                    <p class="fw-bold mb-3">Are you sure you want to cancel this appointment?</p>

                    <div class="patient-info bg-light p-3 rounded mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-user me-2 text-primary"></i>
                            <strong id="cancelPatientName"></strong>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-phone me-2 text-primary"></i>
                            <span id="cancelPatientPhone"></span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="ti ti-calendar me-2 text-primary"></i>
                            <span id="cancelDateTime"></span>
                        </div>
                    </div>

                    <div class="alert alert-warning mb-0">
                        <strong>Warning:</strong> This action cannot be undone.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No, Keep</button>
                    <button type="button" id="confirmCancelBtn" class="btn btn-danger">Yes, Cancel</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Complete Appointment Modal -->
    <div class="modal fade" id="completeAppointmentModal" tabindex="-1" aria-labelledby="completeModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-success">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title text-white" id="completeModalLabel">
                        <i class="ti ti-check-circle me-2"></i> Complete Appointment
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>
                <div class="modal-body text-dark">
                    <p class="fw-bold mb-3">Mark this appointment as completed?</p>

                    <div class="patient-info bg-light p-3 rounded mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-user me-2 text-primary"></i>
                            <strong id="completePatientName"></strong>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" id="confirmCompleteBtn" class="btn btn-success">Yes, Complete</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Appointment Modal -->
    <div class="modal fade" id="deleteAppointmentModal" tabindex="-1" aria-labelledby="deleteModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-danger">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title text-white" id="deleteModalLabel">
                        <i class="ti ti-trash me-2"></i> Delete Appointment
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>
                <div class="modal-body text-dark">
                    <div class="text-center mb-4">
                        <i class="ti ti-alert-triangle fs-48 text-danger mb-3"></i>
                        <h5 class="fw-bold">Are you sure?</h5>
                        <p class="text-muted">This action cannot be undone.</p>
                    </div>

                    <div class="patient-info bg-light p-3 rounded mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-user me-2 text-primary"></i>
                            <strong id="deletePatientName"></strong>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-phone me-2 text-primary"></i>
                            <span id="deletePatientPhone"></span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="ti ti-calendar me-2 text-primary"></i>
                            <span id="deleteDateTime"></span>
                        </div>
                    </div>

                    <div class="alert alert-warning mb-0">
                        <strong>Warning:</strong> This will permanently remove the appointment from the system.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" id="confirmDeleteBtn" class="btn btn-danger">Yes, Delete</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Restore Confirmation Modal -->
    <div class="modal fade" id="restoreAppointmentModal" tabindex="-1" aria-labelledby="restoreModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-success">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title text-white" id="restoreModalLabel">
                        <i class="ti ti-restore me-2"></i> Restore Appointment
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>
                <div class="modal-body text-dark">
                    <p class="fw-bold mb-3">Restore this appointment?</p>

                    <div class="patient-info bg-light p-3 rounded mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-user me-2 text-primary"></i>
                            <strong id="restorePatientName"></strong>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-calendar me-2 text-primary"></i>
                            <span id="restoreDateTime"></span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" id="confirmRestoreBtn" class="btn btn-success">Yes, Restore</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Force Delete Modal -->
    <div class="modal fade" id="forceDeleteModal" tabindex="-1" aria-labelledby="forceDeleteModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-dark">
                <div class="modal-header bg-dark text-white">
                    <h5 class="modal-title text-white" id="forceDeleteModalLabel">
                        <i class="ti ti-trash-off me-2"></i> Permanent Delete
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>
                <div class="modal-body text-dark">
                    <div class="text-center mb-4">
                        <i class="ti ti-alert-triangle fs-48 text-danger mb-3"></i>
                        <h5 class="fw-bold text-danger">Permanent Deletion</h5>
                        <p class="text-muted">This will permanently delete the appointment. This action cannot be undone.
                        </p>
                    </div>

                    <div class="patient-info bg-light p-3 rounded mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-user me-2 text-primary"></i>
                            <strong id="forceDeletePatientName"></strong>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" id="confirmForceDeleteBtn" class="btn btn-dark">Permanently Delete</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Consult Now Quick Modal -->
    <div class="modal fade" id="consultNowModal" tabindex="-1" aria-labelledby="consultNowModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 15px; overflow: hidden;">
                <div class="modal-header text-white" style="background: #a855f7 !important; border: none;">
                    <h5 class="modal-title text-white fw-bold" id="consultNowModalLabel">
                        <i class="ti ti-stethoscope me-2"></i> Consultation Options
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="patient-banner p-3 rounded-4 mb-4" style="background: #f3e8ff; border-left: 4px solid #a855f7;">
                        <div class="d-flex align-items-center">
                            <div class="bg-white rounded-circle p-2 me-3 shadow-sm">
                                <i class="ti ti-user-circle fs-32" style="color: #a855f7;"></i>
                            </div>
                            <div>
                                <p class="text-muted small mb-0 fw-semibold">Patient Name</p>
                                <h5 class="fw-bold mb-0" id="consultModalPatientName" style="color: #581c87;"></h5>
                            </div>
                        </div>
                    </div>

                    <div class="row g-4">
                        <div class="col-md-6">
                            <div class="consult-opt-box border-0 rounded-4 p-4 text-center h-100 cursor-pointer shadow-sm transition-all" id="manualConsultBtn" style="background: #f8fafc; border: 2px solid transparent !important;">
                                <div class="icon-wrapper mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle" style="width: 70px; height: 70px; background: #e0f2fe;">
                                    <i class="ti ti-edit-circle fs-40" style="color: #0ea5e9;"></i>
                                </div>
                                <h6 class="fw-bold mb-2">Manual Consultation</h6>
                                <p class="small text-muted mb-0">Full consultation form with prescriptions, notes, and records.</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="consult-opt-box border-0 rounded-4 p-4 text-center h-100 cursor-pointer shadow-sm transition-all" id="uploadOptionBtn" style="background: #f8fafc; border: 2px solid transparent !important;">
                                <div class="icon-wrapper mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle" style="width: 70px; height: 70px; background: #dcfce7;">
                                    <i class="ti ti-file-upload fs-40" style="color: #22c55e;"></i>
                                </div>
                                <h6 class="fw-bold mb-2">Upload Prescription</h6>
                                <p class="small text-muted mb-0">Quickly upload an image or PDF of a receipt/prescription.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 pb-4 justify-content-center">
                    <button type="button" class="btn btn-link text-muted fw-semibold text-decoration-none" data-bs-dismiss="modal">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    
    <style>
        .status-dropdown {
            border-radius: 6px;
            padding: 4px 8px;
            transition: all 0.3s ease;
        }
        .status-confirmed { background-color: #d1f7ec !important; color: #0e7a5c !important; border-color: #a7e9d7 !important; }
        .status-completed { background-color: #e0f2fe !important; color: #0369a1 !important; border-color: #bae6fd !important; }
        .status-cancelled { background-color: #fee2e2 !important; color: #b91c1c !important; border-color: #fecaca !important; }
        .status-pending   { background-color: #fef3c7 !important; color: #92400e !important; border-color: #fde68a !important; }
        
        .consult-opt-box:hover {
            border-color: #a855f7 !important;
            background-color: #f5f3ff !important;
            transform: translateY(-5px);
        }
        .transition-all { transition: all 0.3s ease; }
        .cursor-pointer { cursor: pointer; }
        .hover-shadow:hover { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
        .rounded-4 { border-radius: 1rem !important; }
    </style>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css" />

    <script>
        $(document).ready(function() {
            // State variables
            let currentStatus = 'confirmed';
            let currentPage = 1;
            let selectedStartDate = null;
            let selectedEndDate = null;
            let currentCancelId = null;
            let currentCompleteId = null;
            let currentDeleteId = null;
            let currentRestoreId = null;
            let currentForceDeleteId = null;

            // Initialize date range picker
            $('.bookingrange').daterangepicker({
                opens: 'right',
                autoApply: false,
                alwaysShowCalendars: true,
                showDropdowns: true,
                locale: {
                    format: 'DD MMM YYYY'
                },
                ranges: {
                    'Today': [moment(), moment()],
                    'Tomorrow': [moment().add(1, 'days'), moment().add(1, 'days')],
                    'This Week': [moment().startOf('week'), moment().endOf('week')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                    'Next Month': [moment().add(1, 'month').startOf('month'), moment().add(1, 'month')
                        .endOf('month')
                    ]
                }
            }, function(start, end) {
                $('.bookingrange').val(start.format('DD MMM YYYY') + ' - ' + end.format('DD MMM YYYY'));
                selectedStartDate = start.format('YYYY-MM-DD');
                selectedEndDate = end.format('YYYY-MM-DD');
                currentPage = 1;
                filterData();
            });

            // Clear date range
            $('.bookingrange').on('cancel.daterangepicker', function() {
                $(this).val('Select Date Range');
                selectedStartDate = null;
                selectedEndDate = null;
                currentPage = 1;
                filterData();
            });

            // Tab switching
            $('#statusTabs .nav-link').click(function() {
                $('#statusTabs .nav-link').removeClass('active');
                $(this).addClass('active');
                currentStatus = $(this).data('status');
                currentPage = 1;
                filterData();
            });

            // Search with debounce
            let searchTimer;
            $('#searchName, #searchPhone').on('keyup', function() {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    currentPage = 1;
                    filterData();
                }, 500);
            });

            // Filter data function
            function filterData() {
                let data = {
                    page: currentPage,
                    status: currentStatus,
                    name: $('#searchName').val().trim(),
                    phone: $('#searchPhone').val().trim()
                };

                if (selectedStartDate && selectedEndDate) {
                    data.start_date = selectedStartDate;
                    data.end_date = selectedEndDate;
                }

                $('#appointmentTableBody').html(`
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                    <p class="mt-2">Loading appointments...</p>
                </td>
            </tr>
        `);

                $.ajax({
                    url: '{{ route('doctor.filter_patients_appointments') }}',
                    type: 'GET',
                    data: data,
                    success: function(response) {
                        if (response.success) {
                            renderTable(response);
                            updateCounts(response);
                        } else {
                            showError('Failed to load appointments');
                        }
                    },
                    error: function(xhr) {
                        showError('Error loading data: ' + (xhr.responseJSON?.message ||
                            'Unknown error'));
                    }
                });
            }
// Render table
function renderTable(response) {
                // Ensure action HTML variables are defined to prevent JS errors
                let editHtml = '';
                let completeHtml = '';
                let cancelHtml = '';
                let deleteHtml = '';
    let html = '';

    if (response.appointments && response.appointments.length > 0) {
        response.appointments.forEach(function(appointment) {
            const patient = appointment.patient || {};
            const profileImage = patient.profile_image ?
                '{{ asset('storage/') }}' + patient.profile_image :
                '{{ asset('assets-doctor/img/profiles/avatar-01.jpg') }}';

            const apptDatetime = moment(appointment.date + ' ' + appointment.time,
                'YYYY-MM-DD hh:mm A');
            const isFuture = apptDatetime.isAfter(moment());

            // Status Badge/Dropdown Logic
            let statusClass = '';
            if (appointment.status === 'confirmed') statusClass = 'status-confirmed';
            else if (appointment.status === 'completed') statusClass = 'status-completed';
            else if (appointment.status === 'cancelled') statusClass = 'status-cancelled';
            else statusClass = 'status-pending';

            let statusHtml = `
                <select class="form-select form-select-sm status-dropdown ${statusClass}" data-id="${appointment.id}" style="width: 120px; font-weight: 600;">
                    <option value="confirmed" ${appointment.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${appointment.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${appointment.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            `;

            // --- FIX: Define consentStatusHtml before using it ---

            let consentStatusHtml = '';
            let consultNowHtml = '';
            // Consent status badge and label above button
            if (appointment.consult_consent) {
                if (appointment.consult_consent.is_accepted) {
                    consentStatusHtml = '<span class="badge bg-success mb-1 d-inline-flex align-items-center"><i class="ti ti-circle-check me-1"></i> Accepted</span>';
                } else {
                    consentStatusHtml = '<span class="badge bg-warning text-dark mb-1 d-inline-flex align-items-center"><i class="ti ti-clock-hour-4 me-1"></i> Pending</span>';
                }
            } else if (appointment.consent_type === 'upload') {
                consentStatusHtml = '<span class="badge bg-info mb-1 d-inline-flex align-items-center"><i class="ti ti-file-upload me-1"></i> File Uploaded</span>';
            } else if (appointment.consent_type === 'otp') {
                consentStatusHtml = '<span class="badge bg-primary mb-1 d-inline-flex align-items-center"><i class="ti ti-message-dots me-1"></i> OTP</span>';
            } else if (appointment.consent_type === 'skipped') {
                consentStatusHtml = '<span class="badge bg-warning text-dark mb-1 d-inline-flex align-items-center"><i class="ti ti-player-skip-forward me-1"></i> Skipped</span>';
            } else if (appointment.consent_type === 'consent') {
                consentStatusHtml = '<span class="badge bg-warning text-dark mb-1 d-inline-flex align-items-center"><i class="ti ti-file-pencil me-1"></i> Consent</span>';
            } else {
                consentStatusHtml = '<span class="badge bg-secondary mb-1">N/A</span>';
            }

            // Always show Consult Now button for confirmed
            if (appointment.status === 'confirmed') {
                consultNowHtml = `<button class="btn btn-sm btn-outline-primary mt-1 py-1 px-2 fs-12 consult-now-btn" data-id="${appointment.id}" data-patient-id="${appointment.patient_id}" data-name="${patient.name || appointment.patient_string}" style="font-size: 11px; font-weight: 600;">Consult Now</button>`;
            }

            // ...existing code for editHtml, completeHtml, cancelHtml, deleteHtml...

            html += `
                <tr>
                    <td>${appointment.index}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${profileImage}" class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
                            <div>
                                <a href="/doctors-patient-details/${patient.id}" class="fw-bold text-decoration-underline text-primary patient-link" style="cursor:pointer;">${patient.name || appointment.patient_string}</a><br>
                                <small>${patient.gender || ''} ${patient.age || ''}y</small>
                            </div>
                        </div>
                    </td>
                    <td>${patient.phone || appointment.mobile_number || 'N/A'}</td>
                    <td>${patient.registration_id || ''}</td>
                    <td>
                        <span class="badge ${getVisitTypeClass(appointment.case_type)}">
                            ${appointment.case_type ? appointment.case_type.replace('_', ' ') : 'N/A'}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex flex-column" style="width: 115px;">
                            ${consentStatusHtml}
                            ${consultNowHtml}
                        </div>
                    </td>
                    <td>
                        ${moment(appointment.date).format('DD MMM YYYY')}<br>
                        <small>${appointment.time}</small>
                    </td>
                    <td>
                        ${statusHtml}
                    </td>
                    <td>
                        <div class="dropdown">
                            <a href="#" class="text-muted" data-bs-toggle="dropdown">
                                <i class="ti ti-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item view-appointment" href="#" data-id="${appointment.id}">View Details</a></li>
                                ${editHtml}
                                ${completeHtml}
                                ${cancelHtml}
                                ${deleteHtml}
                            </ul>
                        </div>
                    </td>
                </tr>`;
                // Today filter button logic
                $('#todayFilterBtn').on('click', function() {
                    const today = moment().format('YYYY-MM-DD');
                    selectedStartDate = today;
                    selectedEndDate = today;
                    $('.bookingrange').val(moment().format('DD MMM YYYY') + ' - ' + moment().format('DD MMM YYYY'));
                    currentPage = 1;
                    filterData();
                });
        });
    } else {
        html = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <i class="ti ti-calendar-x fs-48 text-muted mb-3"></i>
                    <h5 class="text-muted">No appointments found</h5>
                    <a href="{{ route('book-appointment') }}" class="btn btn-primary mt-2">Book New Appointment</a>
                </td>
            </tr>`;
    }

    $('#appointmentTableBody').html(html);
    $('#pagination').html(response.pagination?.links || '');
}
            // Helper functions
            function getVisitTypeClass(type) {
                const classes = {
                    'clinical_visit': 'bg-primary',
                    'home_visit': 'bg-success',
                    'online_visit': 'bg-info',
                    'on_call_visit': 'bg-secondary'
                };
                return classes[type] || 'bg-secondary';
            }

            function getStatusBadgeClass(status) {
                const classes = {
                    'pending': 'bg-warning text-dark',
                    'pending_consent': 'bg-warning text-dark',
                    'confirmed': 'bg-primary',
                    'completed': 'bg-success',
                    'cancelled': 'bg-danger'
                };
                return classes[status] || 'bg-secondary';
            }

            function updateCounts(data) {
                $('#today-clinical-visit').text(data.todayclinical_visit_count || 0);
                $('#today-home-visit').text(data.todayhome_visit_count || 0);
                $('#today-online-visit').text(data.todayonline_visit_count || 0);
                $('#today-call-visit').text(data.todaycall_visit_count || 0);
            }

            function showError(message) {
                $('#appointmentTableBody').html(`
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    <i class="ti ti-alert-circle fs-48 mb-3"></i>
                    <p>${message}</p>
                    <button class="btn btn-primary btn-sm" onclick="filterData()">Retry</button>
                </td>
            </tr>
        `);
            }

            function showAlert(message, type) {
                if (typeof window.showAlert === 'function') {
                    window.showAlert(message, type);
                } else {
                    alert(message);
                }
            }

            // Pagination
            $(document).on('click', '.pagination a', function(e) {
                e.preventDefault();
                let url = new URL($(this).attr('href'));
                currentPage = url.searchParams.get('page') || 1;
                filterData();
            });

            // View appointment
            $(document).on('click', '.view-appointment', function(e) {
                e.preventDefault();
                let id = $(this).data('id');

                $.ajax({
                    url: '/doctor-appointment/' + id,
                    type: 'GET',
                    success: function(response) {
                        if (response.success) {
                            let appt = response.appointment;
                            let patient = appt.patient || {};

                            $('#modal-profile-image').attr('src',
                                patient.profile_image ?
                                '{{ asset('storage/') }}' + patient.profile_image :
                                '{{ asset('assets-doctor/img/profiles/avatar-01.jpg') }}'
                            );
                            $('#modal-name').text(patient.name || appt.patient_string);
                            $('#modal-patient-id').text('ID: ' + (patient.registration_id ||
                                'N/A'));
                            $('#modal-age').text(patient.age || 'N/A');
                            $('#modal-gender').text(patient.gender || 'N/A');
                            $('#modal-phone').text(patient.phone || appt.mobile_number ||
                                'N/A');
                            $('#modal-blood-group').text(appt.blood_group || 'N/A');
                            $('#modal-date').text(moment(appt.date).format('DD MMM YYYY'));
                            $('#modal-time').text(appt.time || 'N/A');
                            $('#modal-visit-type').text(appt.case_type ? appt.case_type.replace(
                                '_', ' ') : 'N/A');

                            let statusClass = getStatusBadgeClass(appt.status);
                            $('#modal-status').text(appt.status.replace('_', ' ')).removeClass()
                                .addClass(`badge ${statusClass}`);

                            $('#modal-bp').text(appt.bp || 'N/A');
                            $('#modal-weight').text(appt.weight || 'N/A');
                            $('#modal-height').text(appt.height || 'N/A');
                            $('#modal-remarks').text(appt.remarks || 'No remarks');
                            $('#modal-note').text(appt.note || 'No notes');

                            // Consent information (Enhanced for auto-generated PDF)
                            let consentFilePath = appt.consent_file || (appt.consult_consent ? appt.consult_consent.consent_file : null);
                            
                            if (appt.consent_type) {
                                $('#consentSection').show();
                                $('#modal-consent-type').text(appt.consent_type.toUpperCase());

                                if (consentFilePath) {
                                    $('#consentFileSection').show();
                                    
                                    // Use storage asset path
                                    let fullPath = '{{ asset('storage/') }}/' + consentFilePath;
                                    $('#consent-file-link').attr('href', fullPath);
                                    
                                    // Make button more descriptive if it's the auto-generated one
                                    if (appt.consent_type === 'email' || appt.consent_type === 'consent') {
                                        $('#consent-file-link').html('<i class="ti ti-file-certificate me-1"></i> View Signed Consent (PDF)');
                                    } else {
                                        $('#consent-file-link').html('<i class="ti ti-file-text me-1"></i> View Consent File');
                                    }
                                } else {
                                    $('#consentFileSection').hide();
                                }
                            } else {
                                $('#consentSection').hide();
                            }

                            $('#viewModal').modal('show');
                        }
                    },
                    error: function() {
                        showAlert('Failed to load appointment details', 'error');
                    }
                });
            });

            // Cancel appointment
            $(document).on('click', '.cancel-appointment', function(e) {
                e.preventDefault();
                currentCancelId = $(this).data('id');

                $('#cancelPatientName').text($(this).data('name'));
                $('#cancelPatientPhone').text($(this).data('phone') || 'N/A');

                let date = $(this).data('date');
                let time = $(this).data('time');
                $('#cancelDateTime').text(moment(date).format('DD MMM YYYY') + ' at ' + time);

                $('#cancelAppointmentModal').modal('show');
            });

            $('#confirmCancelBtn').on('click', function() {
                if (!currentCancelId) return;

                const $btn = $(this).prop('disabled', true).html(
                    '<i class="fas fa-spinner fa-spin"></i> Cancelling...');

                $.ajax({
                    url: '{{ route('doctor.appointment.cancel') }}',
                    method: 'POST',
                    data: {
                        _token: '{{ csrf_token() }}',
                        appointment_id: currentCancelId
                    },
                    success: function(res) {
                        if (res.success) {
                            $('#cancelAppointmentModal').modal('hide');
                            showAlert(res.message, 'success');
                            filterData();
                        } else {
                            showAlert(res.message, 'error');
                        }
                    },
                    error: function(xhr) {
                        let message = xhr.responseJSON?.message ||
                            'Error cancelling appointment';
                        showAlert(message, 'error');
                    },
                    complete: function() {
                        $btn.prop('disabled', false).html('Yes, Cancel');
                        currentCancelId = null;
                    }
                });
            });

            // Complete appointment
            $(document).on('click', '.complete-appointment', function(e) {
                e.preventDefault();
                currentCompleteId = $(this).data('id');
                $('#completePatientName').text($(this).data('name'));
                $('#completeAppointmentModal').modal('show');
            });

            $('#confirmCompleteBtn').on('click', function() {
                if (!currentCompleteId) return;

                const $btn = $(this).prop('disabled', true).html(
                    '<i class="fas fa-spinner fa-spin"></i> Processing...');

                $.ajax({
                    url: '{{ route('doctor.appointment.complete') }}',
                    method: 'POST',
                    data: {
                        _token: '{{ csrf_token() }}',
                        appointment_id: currentCompleteId
                    },
                    success: function(res) {
                        if (res.success) {
                            $('#completeAppointmentModal').modal('hide');
                            showAlert(res.message, 'success');
                            filterData();
                        } else {
                            showAlert(res.message, 'error');
                        }
                    },
                    error: function(xhr) {
                        let message = xhr.responseJSON?.message ||
                            'Error completing appointment';
                        showAlert(message, 'error');
                    },
                    complete: function() {
                        $btn.prop('disabled', false).html('Yes, Complete');
                        currentCompleteId = null;
                    }
                });
            });

            // Delete appointment
            $(document).on('click', '.delete-appointment', function(e) {
                e.preventDefault();
                currentDeleteId = $(this).data('id');

                $('#deletePatientName').text($(this).data('name'));
                $('#deletePatientPhone').text($(this).data('phone') || 'N/A');

                let date = $(this).data('date');
                let time = $(this).data('time');
                $('#deleteDateTime').text(moment(date).format('DD MMM YYYY') + ' at ' + time);

                $('#deleteAppointmentModal').modal('show');
            });

            $('#confirmDeleteBtn').on('click', function() {
                if (!currentDeleteId) return;

                const $btn = $(this).prop('disabled', true).html(
                    '<i class="fas fa-spinner fa-spin"></i> Deleting...');

                $.ajax({
                    url: '{{ route('doctor.appointment.delete') }}',
                    method: 'POST',
                    data: {
                        _token: '{{ csrf_token() }}',
                        appointment_id: currentDeleteId
                    },
                    success: function(res) {
                        if (res.success) {
                            $('#deleteAppointmentModal').modal('hide');
                            showAlert(res.message, 'success');
                            filterData();
                        } else {
                            showAlert(res.message, 'error');
                        }
                    },
                    error: function(xhr) {
                        let message = xhr.responseJSON?.message || 'Error deleting appointment';
                        showAlert(message, 'error');
                    },
                    complete: function() {
                        $btn.prop('disabled', false).html('Yes, Delete');
                        currentDeleteId = null;
                    }
                });
            });

            // Clear modal data on hide
            $('#cancelAppointmentModal').on('hidden.bs.modal', function() {
                currentCancelId = null;
            });

            $('#completeAppointmentModal').on('hidden.bs.modal', function() {
                currentCompleteId = null;
            });

            $('#deleteAppointmentModal').on('hidden.bs.modal', function() {
                currentDeleteId = null;
            });

            // Status dropdown change
            $(document).on('change', '.status-dropdown', function() {
                const id = $(this).data('id');
                const status = $(this).val();
                const $this = $(this);
                
                // Update local styling immediately
                $this.removeClass('status-confirmed status-completed status-cancelled status-pending');
                if (status === 'confirmed') $this.addClass('status-confirmed');
                else if (status === 'completed') $this.addClass('status-completed');
                else if (status === 'cancelled') $this.addClass('status-cancelled');
                else $this.addClass('status-pending');

                $.ajax({
                    url: "{{ route('doctor.appointment.update_status') }}",
                    type: 'POST',
                    data: {
                        _token: "{{ csrf_token() }}",
                        appointment_id: id,
                        status: status
                    },
                    success: function(response) {
                        if (response.success) {
                            if (typeof showAlert === 'function') {
                                showAlert(response.message, 'success');
                            }
                            filterData();
                        } else {
                            if (typeof showAlert === 'function') {
                                showAlert(response.message, 'error');
                            }
                            filterData();
                        }
                    },
                    error: function(xhr) {
                        const msg = xhr.responseJSON?.message || 'Error updating status';
                        if (typeof showAlert === 'function') {
                            showAlert(msg, 'error');
                        }
                        filterData();
                    }
                });
            });

            // Consult Now Modal Logic
            let activeAppointmentId = null;
            let activePatientId = null;

            $(document).on('click', '.consult-now-btn', function() {
                activeAppointmentId = $(this).data('id');
                activePatientId = $(this).data('patient-id');
                const patientName = $(this).data('name');

                $('#consultModalPatientName').text(patientName);
                $('#consultNowModal').modal('show');
            });

            // Manual Consultation Click
            $('#manualConsultBtn').on('click', function() {
                if (activeAppointmentId) {
                    window.location.href = `/doctor-consultation/${activeAppointmentId}`;
                }
            });

            // Upload Option Click (Redirect to separate upload page)
            $('#uploadOptionBtn').on('click', function() {
                if (activeAppointmentId) {
                    window.location.href = `/doctor-upload-consultation-prescription/${activeAppointmentId}`;
                }
            });


            // Initial load
            filterData();

            // Auto refresh every 5 minutes
            setInterval(filterData, 300000);
        });

        // Mobile menu toggle
        document.addEventListener('DOMContentLoaded', function() {
            const menuToggles = document.querySelectorAll('.menu-toggle');
            menuToggles.forEach(toggle => {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const menuItem = this.parentElement;
                    const subMenu = menuItem.querySelector('.menu-sub');
                    menuItem.classList.toggle('open');
                    if (subMenu) {
                        subMenu.style.display = menuItem.classList.contains('open') ? 'block' :
                            'none';
                    }
                });
            });
        });
    </script>

@endsection
