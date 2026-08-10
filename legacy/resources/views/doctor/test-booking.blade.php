<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctors | Test Booking</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">
    @include('doctor.inc.header-links')
    @include('doctor.inc.custom')
    <meta name="csrf-token" content="{{ csrf_token() }}">

    
</head>

<body>
    <!-- Begin Wrapper -->
    <div class="main-wrapper">
        <!-- Topbar Start -->
        @include('doctor.inc.header')

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
        
        <div class="page-wrapper">
            <div class="content">
                <div>
                    <h4 class="fw-bold mb-3 color-doctorrx">Total Test Booking</h4>
                </div>
                
                <!-- Filters Section -->
                <div class="row align-items-center">
                    <div class="col-lg-10 text-lg-end mb-3">
                        <div class="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                            <div class="d-flex align-items-center gap-2">
                                <div class="d-flex right-content align-items-center flex-wrap">
                                    <div class="input-icon-start position-relative">
                                        <span class="input-icon-addon text-dark">
                                            <i class="ti ti-calendar-event"></i>
                                        </span>
                                        <input type="text" class="form-control form-control-sm date-input bookingrange" value="Select Date Range">
                                    </div>
                                </div>
                                <div class="search-set">
                                    <div class="d-flex align-items-center flex-wrap gap-2">
                                        <div class="table-search d-flex align-items-center mb-0">
                                            <div class="search-input">
                                                <input type="text" id="searchName" class="form-control p-3" placeholder="Search by Name">
                                            </div>
                                            <div class="search-input ms-2">
                                                <input type="text" id="registration_id" name="registration_id" class="form-control p-3" placeholder="Type Registration ID..." autocomplete="off">
                                                <ul id="suggestion-box" class="suggestion-box list-group mt-1 position-absolute bg-white border shadow w-100 z-3" style="max-height: 200px; overflow-y: auto; z-index: 1000; display: none;"></ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side Buttons -->
                    <div class="col-lg-2 text-lg-end mb-3">
                        <div class="d-flex flex-wrap gap-2 justify-content-lg-end">
                            <a href="{{route('doctor-add-test-booking')}}" class="btn btn-outline-primary fs-13 p-2 btn-md">
                                <i class="ti ti-plus me-1"></i> Add Test Booking 
                            </a>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <ul class="nav nav-pills mb-1" id="statusTabs">
                        <li class="nav-item me-2">
                            <a class="nav-link active border border-primary-subtle fw-semibold shadow-sm" href="javascript:void(0);" data-status="all">
                                All Bookings
                            </a>
                        </li>
                        <li class="nav-item me-2">
                            <a class="nav-link border border-primary-subtle fw-semibold" href="javascript:void(0);" data-status="pending">
                                Pending
                            </a>
                        </li>
                        <li class="nav-item me-2">
                            <a class="nav-link border border-primary-subtle fw-semibold" href="javascript:void(0);" data-status="completed">
                                Completed
                            </a>
                        </li>
                        <li class="nav-item me-2">
                            <a class="nav-link border border-primary-subtle fw-semibold" href="javascript:void(0);" data-status="in-progress">
                                In Progress
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link border border-primary-subtle fw-semibold" href="javascript:void(0);" data-status="cancelled">
                                Cancelled
                            </a>
                        </li>
                    </ul>
                </div>


                <!-- Start Table -->
                <div class="card">
                    <table class="table booking-datatable table-nowrap">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="selectAll"></th>
                                <th class="no-sort">Date & Time</th>
                                <th>Patient</th>
                                <th>Test Name</th>
                                <th>Vendor</th>
                                <th>Report/Link</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="testBookingTableBody">
                            <!-- Data will be loaded dynamically -->
                            <tr>
                                <td colspan="8" class="text-center">
                                    <div class="loading-spinner">
                                        <i class="ti ti-loader spinner"></i>
                                        <p>Loading test bookings...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- End Table -->

                <!-- Pagination -->
                <div class="row">
                    <div class="col-md-6">
                        <div class="pagination-info" id="paginationInfo">
                            Showing 0 to 0 of 0 entries
                        </div>
                    </div>
                    <div class="col-md-6">
                        <nav aria-label="Page navigation">
                            <ul class="pagination justify-content-end" id="pagination">
                                <!-- Pagination will be loaded dynamically -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
            
            @include('doctor.inc.footer-links')
            @include('doctor.inc.footer')
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="deleteModalLabel">Confirm Delete</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    Are you sure you want to delete this test booking? This action cannot be undone.
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>


    <!-- View Booking Modal -->
<div class="modal fade viewBookingModal" id="viewBookingModal" tabindex="-1" aria-labelledby="viewBookingModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="viewBookingModalLabel">
                    <i class="ti ti-clipboard-text me-2"></i>
                    Test Booking Details
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="loading-spinner text-center py-4" id="modalLoading">
                    <i class="ti ti-loader spinner fs-48 text-primary"></i>
                    <p class="mt-2">Loading booking details...</p>
                </div>
                
                <div id="bookingDetails" style="display: none;">
                    <!-- Patient Details -->
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="card-title mb-0">
                                <i class="ti ti-user me-2 text-primary"></i>
                                Patient Information
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <strong>Name:</strong> <span id="patientName">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Registration ID:</strong> <span id="patientRegId">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Phone:</strong> <span id="patientPhone">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Email:</strong> <span id="patientEmail">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Gender:</strong> <span id="patientGender">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Age:</strong> <span id="patientAge">-</span>
                                </div>
                                <div class="col-md-12 mb-2">
                                    <strong>Date of Birth:</strong> <span id="patientDob">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vendor Details -->
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="card-title mb-0">
                                <i class="ti ti-building-store me-2 text-success"></i>
                                Vendor Information
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <strong>Vendor Name:</strong> <span id="vendorName">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Mobile:</strong> <span id="vendorMobile">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Email:</strong> <span id="vendorEmail">-</span>
                                </div>
                                <div class="col-md-12 mb-2">
                                    <strong>Address:</strong> <span id="vendorAddress">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Test Details -->
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="card-title mb-0">
                                <i class="ti ti-microscope me-2 text-info"></i>
                                Test Information
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered" id="testsTable">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Test Name</th>
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody id="testsTableBody">
                                        <!-- Tests will be populated here -->
                                    </tbody>
                                    <tfoot>
                                        <tr class="table-active">
                                            <td><strong>Total Amount</strong></td>
                                            <td><strong id="totalAmount">₹0.00</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Booking & Payment Details -->
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h6 class="card-title mb-0">
                                        <i class="ti ti-calendar me-2 text-warning"></i>
                                        Booking Details
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <strong>Booking Date:</strong> <span id="bookingDate">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Booking Time:</strong> <span id="bookingTime">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Status:</strong> 
                                        <span class="status-badge" id="bookingStatus">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Created On:</strong> <span id="createdAt">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h6 class="card-title mb-0">
                                        <i class="ti ti-currency-rupee me-2 text-danger"></i>
                                        Payment Details
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <strong>Payment Method:</strong> <span id="paymentMethod">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Payment Amount:</strong> <span id="paymentAmount">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Payment Date:</strong> <span id="paymentDate">-</span>
                                    </div>
                                    <div id="paymentExtraDetails">
                                        <!-- Additional payment details will be shown here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="printBookingDetails()">
                    <i class="ti ti-printer me-1"></i> Print
                </button>
            </div>
        </div>
    </div>
</div>



<!-- View Booking Modal -->
<div class="modal fade" id="viewBookingModal" tabindex="-1" aria-labelledby="viewBookingModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="viewBookingModalLabel">
                    <i class="ti ti-clipboard-text me-2"></i>
                    Test Booking Details
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="loading-spinner text-center py-4" id="modalLoading">
                    <i class="ti ti-loader spinner fs-48 text-primary"></i>
                    <p class="mt-2">Loading booking details...</p>
                </div>
                
                <div id="bookingDetails" style="display: none;">
                    <!-- Patient Details -->
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="card-title mb-0">
                                <i class="ti ti-user me-2 text-primary"></i>
                                Patient Information
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <strong>Name:</strong> <span id="patientName">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Registration ID:</strong> <span id="patientRegId">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Phone:</strong> <span id="patientPhone">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Email:</strong> <span id="patientEmail">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Gender:</strong> <span id="patientGender">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Age:</strong> <span id="patientAge">-</span>
                                </div>
                                <div class="col-md-12 mb-2">
                                    <strong>Date of Birth:</strong> <span id="patientDob">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vendor Details -->
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="card-title mb-0">
                                <i class="ti ti-building-store me-2 text-success"></i>
                                Vendor Information
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <strong>Vendor Name:</strong> <span id="vendorName">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Mobile:</strong> <span id="vendorMobile">-</span>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <strong>Email:</strong> <span id="vendorEmail">-</span>
                                </div>
                                <div class="col-md-12 mb-2">
                                    <strong>Address:</strong> <span id="vendorAddress">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Test Details -->
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="card-title mb-0">
                                <i class="ti ti-microscope me-2 text-info"></i>
                                Test Information
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered" id="testsTable">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Test Name</th>
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody id="testsTableBody">
                                        <!-- Tests will be populated here -->
                                    </tbody>
                                    <tfoot>
                                        <tr class="table-active">
                                            <td><strong>Total Amount</strong></td>
                                            <td><strong id="totalAmount">₹0.00</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Booking & Payment Details -->
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h6 class="card-title mb-0">
                                        <i class="ti ti-calendar me-2 text-warning"></i>
                                        Booking Details
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <strong>Booking Date:</strong> <span id="bookingDate">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Booking Time:</strong> <span id="bookingTime">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Status:</strong> 
                                        <span class="status-badge" id="bookingStatus">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Created On:</strong> <span id="createdAt">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h6 class="card-title mb-0">
                                        <i class="ti ti-currency-rupee me-2 text-danger"></i>
                                        Payment Details
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <strong>Payment Method:</strong> <span id="paymentMethod">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Payment Amount:</strong> <span id="paymentAmount">-</span>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Payment Date:</strong> <span id="paymentDate">-</span>
                                    </div>
                                    <div id="paymentExtraDetails">
                                        <!-- Additional payment details will be shown here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="printBookingDetails()">
                    <i class="ti ti-printer me-1"></i> Print
                </button>
            </div>
        </div>
    </div>
</div>



    <script>
        $(document).ready(function() {
            let currentStatus = 'all';
            let currentPage = 1;
            let selectedStartDate = null;
            let selectedEndDate = null;
            let deleteBookingId = null;

            // Initialize Date Range Picker
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
                    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                }
            }, function(start, end, label) {
                $('.bookingrange').val(start.format('DD MMM YYYY') + ' - ' + end.format('DD MMM YYYY'));
                selectedStartDate = start.format('YYYY-MM-DD');
                selectedEndDate = end.format('YYYY-MM-DD');
                currentPage = 1;
                loadTestBookings();
            });

            // Status Tabs
            $('#statusTabs .nav-link').click(function() {
                $('#statusTabs .nav-link').removeClass('active');
                $(this).addClass('active');
                currentStatus = $(this).data('status');
                currentPage = 1;
                loadTestBookings();
            });

            // Search Functionality
            let searchTimer;
            $('#searchName, #registration_id').on('keyup', function() {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    currentPage = 1;
                    loadTestBookings();
                }, 500);
            });

            // Registration ID Suggestions
            $('#registration_id').on('keyup', function() {
                let query = $(this).val();
                if (query.length > 1) {
                    $.ajax({
                        url: "{{ route('get.registration.suggestions') }}",
                        type: "GET",
                        data: { query: query },
                        success: function(data) {
                            $('#suggestion-box').empty().show();
                            if (data.length > 0) {
                                data.forEach(function(item) {
                                    $('#suggestion-box').append('<li data-mobile="' + item.phone + '" data-registration="' + item.registration_id + '">' + item.registration_id + '</li>');
                                });
                            } else {
                                $('#suggestion-box').append('<li class="text-muted">No match found</li>');
                            }
                        }
                    });
                } else {
                    $('#suggestion-box').empty().hide();
                }
            });

            // Select Registration ID from suggestions
            $(document).on('mousedown', '#suggestion-box li', function(e) {
                e.preventDefault();
                if ($(this).hasClass('text-muted')) return;
                
                const selectedReg = $(this).data('registration') || $(this).text().split(' --- ')[0];
                $('#registration_id').val(selectedReg).trigger('change');
                $('#suggestion-box').empty().hide();
                currentPage = 1;
                loadTestBookings();
            });

            // Hide suggestion box when clicking outside
            $(document).click(function(e) {
                if (!$(e.target).closest('#registration_id').length && !$(e.target).closest('#suggestion-box').length) {
                    $('#suggestion-box').hide();
                }
            });

            // Select All Checkbox
            $('#selectAll').change(function() {
                $('.row-checkbox').prop('checked', this.checked);
            });

            // Load Test Bookings
            function loadTestBookings() {
                let data = {
                    page: currentPage,
                    status: currentStatus,
                    name: $('#searchName').val().trim(),
                    registration_id: $('#registration_id').val().trim()
                };

                if (selectedStartDate && selectedEndDate) {
                    data.start_date = selectedStartDate;
                    data.end_date = selectedEndDate;
                }

                $('#testBookingTableBody').html(`
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="loading-spinner">
                                <i class="ti ti-loader spinner"></i>
                                <p>Loading test bookings...</p>
                            </div>
                        </td>
                    </tr>
                `);

                $.ajax({
                    url: '{{ route("doctor.test-bookings.filter") }}',
                    type: 'GET',
                    data: data,
                    success: function(response) {
                        if (response.success) {
                            renderTestBookings(response);
                        } else {
                            $('#testBookingTableBody').html(`
                                <tr>
                                    <td colspan="8" class="text-center text-muted">
                                        <i class="ti ti-alert-circle fs-48 mb-2"></i>
                                        <p>Error loading data</p>
                                    </td>
                                </tr>
                            `);
                        }
                    },
                    error: function(xhr) {
                        $('#testBookingTableBody').html(`
                            <tr>
                                <td colspan="8" class="text-center text-danger">
                                    <i class="ti ti-alert-circle fs-48 mb-2"></i>
                                    <p>Error loading data. Please try again.</p>
                                </td>
                            </tr>
                        `);
                    }
                });
            }

            // Render Test Bookings
            function renderTestBookings(response) {
                let html = '';
                
                if (response.data && response.data.length > 0) {
                    response.data.forEach(function(booking, index) {
                        const patientInitial = booking.patient_name ? booking.patient_name.charAt(0).toUpperCase() : 'U';
                        const colorClass = getColorClass(patientInitial);
                        
                        html += `
                            <tr>
                                <td><input type="checkbox" class="row-checkbox" value="${booking.id}"></td>
                                <td>
                                    <span class="fw-semibold d-block">${booking.booking_date}</span>
                                    <small class="text-muted">${booking.booking_time}</small>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar-initials ${colorClass} me-2">
                                            ${patientInitial}
                                        </div>
                                        <div>
                                            <span class="fw-semibold d-block">${booking.patient_name || 'N/A'}</span>
                                            <small class="text-muted">${booking.patient_phone || ''}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="text-body">${booking.test_names || 'N/A'}</span>
                                </td>
                                <td>
                                    <span class="text-body">${booking.vendor_name || 'N/A'}</span>
                                </td>
                                <td>
                                    ${booking.uploaded_file_path ? 
                                        `<a href="/storage/${booking.uploaded_file_path}" target="_blank" class="btn btn-sm btn-success"><i class="ti ti-eye me-1"></i> View Report</a>` : 
                                        `<button class="btn btn-sm btn-outline-primary copy-link-btn" data-link="/vendor/upload-test/${booking.upload_link_token}"><i class="ti ti-copy"></i> Copy Link</button>`
                                    }
                                </td>
                                <td>
                                    <select class="form-select form-select-sm status-select" data-id="${booking.id}" style="width: 130px;" onchange="updateBookingStatus(this)">
                                        <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="in-progress" ${booking.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                </td>
                                <td>
                                    <div class="dropdown">
                                        <a href="javascript:void(0);" data-bs-toggle="dropdown">
                                            <i class="ti ti-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu p-2">
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center viewBookingModal" data-id="${booking.id}">
                                                    <i class="ti ti-eye me-2"></i> View
                                                </a>
                                            </li>
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center edit-booking" data-id="${booking.id}">
                                                    <i class="ti ti-edit me-2"></i> Edit
                                                </a>
                                            </li>
                                            <li>                                               
                                                <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center text-danger delete-booking" data-id="${booking.id}">
                                                    <i class="ti ti-trash me-2"></i> Delete
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                } else {
                    html = `
                        <tr>
                            <td colspan="8" class="text-center">
                                <div class="py-5">
                                    <i class="ti ti-clipboard-text fs-48 text-muted mb-3"></i>
                                    <h5 class="text-muted">No Test Bookings Found</h5>
                                    <p class="text-muted">No test bookings match your current filters.</p>
                                    <a href="{{ route('doctor-add-test-booking') }}" class="btn btn-primary">
                                        <i class="ti ti-plus me-1"></i> Add New Booking
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                }
                
                $('#testBookingTableBody').html(html);
                updatePagination(response);
                updatePaginationInfo(response);
            }

            // Update Pagination
            function updatePagination(response) {
                let paginationHtml = '';
                
                if (response.links) {
                    response.links.forEach(function(link) {
                        const activeClass = link.active ? 'active' : '';
                        const disabledClass = link.url === null ? 'disabled' : '';
                        
                        paginationHtml += `
                            <li class="page-item ${activeClass} ${disabledClass}">
                                <a class="page-link" href="javascript:void(0);" 
                                   data-url="${link.url || '#'}" 
                                   onclick="handlePagination('${link.url || '#'}')">
                                    ${link.label}
                                </a>
                            </li>
                        `;
                    });
                }
                
                $('#pagination').html(paginationHtml);
            }

            // Copy Link Functionality
            $(document).on('click', '.copy-link-btn', function() {
                var copyText = window.location.origin + $(this).data('link');
                navigator.clipboard.writeText(copyText).then(() => {
                    $(this).html('<i class="ti ti-check"></i> Copied!');
                    $(this).removeClass('btn-outline-primary').addClass('btn-success text-white');
                    setTimeout(() => {
                        $(this).html('<i class="ti ti-copy"></i> Copy Link');
                        $(this).removeClass('btn-success text-white').addClass('btn-outline-primary');
                    }, 2000);
                });
            });

            // Status Update Functionality attached globally below
            
            // Handle Pagination Click
            window.handlePagination = function(url) {
                if (url && url !== '#') {
                    const pageMatch = url.match(/page=(\d+)/);
                    if (pageMatch) {
                        currentPage = pageMatch[1];
                        loadTestBookings();
                    }
                }
            };

            // Format Status
            function formatStatus(status) {
                const statusMap = {
                    'pending': 'Pending',
                    'completed': 'Completed',
                    'in-progress': 'In Progress',
                    'cancelled': 'Cancelled'
                };
                return statusMap[status] || status;
            }

            // Update Pagination Info
            function updatePaginationInfo(response) {
                const from = response.from || 0;
                const to = response.to || 0;
                const total = response.total || 0;
                
                $('#paginationInfo').text(`Showing ${from} to ${to} of ${total} entries`);
            }

            // Get Color Class for Initials
            function getColorClass(initial) {
                const colors = ['bg-primary1', 'bg-success1', 'bg-info1', 'bg-warning1', 'bg-danger1', 'bg-secondary1'];
                const index = initial.charCodeAt(0) % colors.length;
                return colors[index];
            }

            // Format Status
            function formatStatus(status) {
                const statusMap = {
                    'pending': 'Pending',
                    'completed': 'Completed',
                    'in-progress': 'In Progress',
                    'cancelled': 'Cancelled'
                };
                return statusMap[status] || status;
            }

            // Delete Booking
            $(document).on('click', '.delete-booking', function() {
                deleteBookingId = $(this).data('id');
                $('#deleteModal').modal('show');
            });

            $('#confirmDelete').click(function() {
                if (deleteBookingId) {
                    $.ajax({
                        url: '{{ route("doctor.test-bookings.delete") }}',
                        type: 'DELETE',
                        data: {
                            _token: '{{ csrf_token() }}',
                            id: deleteBookingId
                        },
                        success: function(response) {
                            if (response.success) {
                                $('#deleteModal').modal('hide');
                                loadTestBookings();
                                showNotification(response.message, 'success');
                            } else {
                                showNotification(response.message, 'error');
                            }
                        },
                        error: function(xhr) {
                            showNotification('Error deleting booking', 'error');
                        }
                    });
                }
            });

            // View Booking
            $(document).on('click', '.view-booking', function() {
                const bookingId = $(this).data('id');
                // Implement view functionality
                showNotification('View booking: ' + bookingId, 'info');
            });

            // Edit Booking
            $(document).on('click', '.edit-booking', function() {
                const bookingId = $(this).data('id');
                // Implement edit functionality
                showNotification('Edit booking: ' + bookingId, 'info');
            });

            // Show Notification
            function showNotification(message, type = 'info') {
                // You can integrate with toastr or use browser alert for now
                alert(`${type.toUpperCase()}: ${message}`);
            }

            // Initial Load
            loadTestBookings();
        });




// View Booking Details - FIXED EVENT HANDLER
$(document).on('click', '.viewBookingModal', function() {
    const bookingId = $(this).data('id');
    showBookingDetails(bookingId);
});

function showBookingDetails(bookingId) {
    // Show loading
    $('#modalLoading').show();
    $('#bookingDetails').hide();
    
    // Clear previous data
    clearModalData();
    
    // Fetch booking details
    $.ajax({
        url: `/show-test-bookings/${bookingId}`,
        type: 'GET',
        success: function(response) {
            $('#modalLoading').hide();
            
            if (response.success) {
                populateModalData(response.booking);
                $('#bookingDetails').show();
                $('#viewBookingModal').modal('show');
            } else {
                showNotification('Error loading booking details', 'error');
            }
        },
        error: function(xhr) {
            $('#modalLoading').hide();
            showNotification('Error loading booking details', 'error');
        }
    });
}

function populateModalData(booking) {
    // Patient Details
    $('#patientName').text(booking.patient.name);
    $('#patientRegId').text(booking.patient.registration_id);
    $('#patientPhone').text(booking.patient.phone);
    $('#patientEmail').text(booking.patient.email);
    $('#patientGender').text(booking.patient.gender);
    $('#patientAge').text(booking.patient.age);
    $('#patientDob').text(booking.patient.dob);

    // Vendor Details
    $('#vendorName').text(booking.vendor.name);
    $('#vendorMobile').text(booking.vendor.mobile);
    $('#vendorEmail').text(booking.vendor.email);
    $('#vendorAddress').text(booking.vendor.address);

    // Tests Details
    const testsTableBody = $('#testsTableBody');
    testsTableBody.empty();
    
    let totalAmount = 0;
    if (booking.tests && booking.tests.length > 0) {
        booking.tests.forEach(test => {
            const price = parseFloat(test.price) || 0;
            totalAmount += price;
            
            testsTableBody.append(`
                <tr>
                    <td>${test.name}</td>
                    <td>₹${price.toFixed(2)}</td>
                </tr>
            `);
        });
    } else {
        testsTableBody.append('<tr><td colspan="2" class="text-center text-muted">No tests found</td></tr>');
    }
    
    $('#totalAmount').text(`₹${totalAmount.toFixed(2)}`);

    // Booking Details
    $('#bookingDate').text(booking.booking_details.booking_date);
    $('#bookingTime').text(booking.booking_details.booking_time);
    $('#createdAt').text(booking.booking_details.created_at);
    
    // Status with badge
    const status = booking.booking_details.status;
    const statusText = formatStatus(status);
    const statusClass = `badge-${status}`;
    $('#bookingStatus').html(`<span class="status-badge ${statusClass}">${statusText}</span>`);

    // Payment Details
    $('#paymentMethod').text(formatPaymentMethod(booking.payment_details.method));
    $('#paymentAmount').text(`₹${parseFloat(booking.payment_details.amount).toFixed(2)}`);
    $('#paymentDate').text(booking.payment_details.date);
    
    // Additional Payment Details
    const paymentExtra = $('#paymentExtraDetails');
    paymentExtra.empty();
    
    if (booking.payment_details.details && Object.keys(booking.payment_details.details).length > 0) {
        let extraHtml = '';
        Object.entries(booking.payment_details.details).forEach(([key, value]) => {
            if (value) {
                const formattedKey = formatKey(key);
                extraHtml += `<div class="mb-1"><strong>${formattedKey}:</strong> ${value}</div>`;
            }
        });
        paymentExtra.html(extraHtml);
    }
}

function clearModalData() {
    // Clear all modal fields
    $('#patientName, #patientRegId, #patientPhone, #patientEmail, #patientGender, #patientAge, #patientDob').text('-');
    $('#vendorName, #vendorMobile, #vendorEmail, #vendorAddress').text('-');
    $('#testsTableBody').empty();
    $('#totalAmount').text('₹0.00');
    $('#bookingDate, #bookingTime, #createdAt').text('-');
    $('#bookingStatus').html('-');
    $('#paymentMethod, #paymentAmount, #paymentDate').text('-');
    $('#paymentExtraDetails').empty();
}



function formatPaymentMethod(method) {
    const methods = {
        'upi': 'UPI Payment',
        'cash': 'Cash',
        'card': 'Card',
        'netbanking': 'Net Banking'
    };
    return methods[method] || method;
}

function formatKey(key) {
    const keyMap = {
        'upi_id': 'UPI ID',
        'card_number': 'Card Number',
        'expiry': 'Expiry Date',
        'bank_name': 'Bank Name',
        'transaction_id': 'Transaction ID'
    };
    return keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Print functionality
function printBookingDetails() {
    const printContent = document.getElementById('bookingDetails').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Booking Details</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .card { border: 1px solid #ddd; margin-bottom: 20px; border-radius: 5px; }
                .card-header { background: #f8f9fa; padding: 10px 15px; border-bottom: 1px solid #ddd; }
                .card-body { padding: 15px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f8f9fa; }
                .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; }
                .badge-pending { background: #fff3cd; color: #856404; }
                .badge-in-progress { background: #d1edff; color: #004085; }
                .badge-completed { background: #d4edda; color: #155724; }
                .badge-cancelled { background: #f8d7da; color: #721c24; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h2 style="text-align: center; margin-bottom: 30px;">Test Booking Details</h2>
            ${printContent}
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
            </div>
        </body>
        </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    $('#viewBookingModal').modal('show');
}

        // Global Update Booking Status Function
        window.updateBookingStatus = function(selectElement) {
            let id = $(selectElement).data('id');
            let status = $(selectElement).val();
            
            $(selectElement).prop('disabled', true);
            
            $.ajax({
                url: "{{ route('doctor.test-bookings.update-status') }}",
                type: "POST",
                data: {
                    _token: "{{ csrf_token() }}",
                    id: id,
                    status: status
                },
                success: function(response) {
                    $(selectElement).prop('disabled', false);
                    if(response.success) {
                        toastAlert('success', response.message);
                    } else {
                        toastAlert('error', response.message);
                    }
                },
                error: function() {
                    $(selectElement).prop('disabled', false);
                    toastAlert('error', 'Something went wrong while updating status.');
                }
            });
        };
    </script>
    <script>
        $(document).ready(function() {
            if ($('.booking-datatable').length > 0) {
                $('.booking-datatable').DataTable({
                    "bFilter": true,
                    "sDom": 'fBtlpi',
                    "ordering": false,
                    "language": {
                        search: ' ',
                        searchPlaceholder: "Search",
                        sLengthMenu: 'Row Per Page _MENU_ Entries',
                        info: "_START_ - _END_ of _TOTAL_ items",
                        paginate: {
                            next: '<i class="ti ti-arrow-right"></i>',
                            previous: '<i class="ti ti-arrow-left"></i> '
                        },
                    },
                    "autoWidth": false,
                    "responsive": true
                });
            }
        });
    </script>
</body>
</html>