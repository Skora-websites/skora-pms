@extends('layouts.layout-doctor')
@section('title', 'Doctor || Transactions')
@section('content')

   
    <div class="main-wrapper">
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
        <div class="page-wrapper">
            <div class="content">
                <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-2 border-1 border-bottom">
                    <div class="flex-grow-1">
                        <h4 class="fw-bold mb-0 text-primary">Transactions</h4>
                    </div>
                    <div class="text-end d-flex">
                        <a href="#" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#addIncomeModal">
                            <i class="ti ti-plus me-1"></i>Add Income
                        </a>
                        <a href="#" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#addExpenseModal">
                            <i class="ti ti-plus me-1"></i>Add Expense
                        </a>
                    </div>
                </div>

                <div class="row">
                    <div class="col-4">
                        <div class="total-amount-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Total Income</h6>
                                    <h5 class="mb-0 text-primary" id="totalIncome">₹0.00</h5>
                                </div>
                                <i class="ti ti-arrow-up-right fs-48 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="total-amount-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Total Expense</h6>
                                    <h5 class="mb-0 text-primary" id="totalExpense">₹0.00</h5>
                                </div>
                                <i class="ti ti-arrow-down-left fs-48 opacity-50"></i>
                            </div>
                        </div>
                    </div>

                      <div class="col-4">
                        <div class="total-amount-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Total Balance</h6>
                                    <h5 class="mb-0 text-primary" id="totalIncomeExpense">₹0.00</h5>
                                </div>
                                <i id="netIcon" class="ti ti-scale fs-48 opacity-50"></i>
                            </div>
                        </div>
                    </div>

                </div>

              <!-- Filters + Tabs + Cards Row -->
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                    <!-- Tabs -->
                    <ul class="nav nav-tabs" id="transactionTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="fw-bold nav-link total-amount-card bg-none border-0 active" id="income-tab" 
                                    data-bs-toggle="tab" data-bs-target="#income" 
                                    type="button" role="tab" onclick="switchTab('income')">
                           <i class="ti ti-arrow-up-right fs-16"></i>     Income
                            </button>
                        </li>
                        <li class="nav-item ms-2 " role="presentation">
                            <button class="fw-bold nav-link total-amount-card bg-transparent border-0" id="expense-tab" 
                                    data-bs-toggle="tab" data-bs-target="#expense" 
                                    type="button" role="tab" onclick="switchTab('expense')">
                           <i class="ti ti-arrow-down-left fs-16"></i>  Expenses
                            </button>
                        </li>
                    </ul>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <div class="input-icon-start position-relative">
                            <span class="input-icon-addon text-dark">
                                <i class="ti ti-calendar-event"></i>
                            </span>
                            <input type="text" class="form-control form-control-sm date-input bookingrange" value="Select Date Range">
                        </div>

                        <div class="search-input ">
                            <input type="text" id="amount" class="form-control form-control-sm" placeholder="Search by amount">
                        </div>

                        <button class="btn btn-outline-secondary btn-sm" onclick="clearFilters()">
                            <i class="ti ti-refresh me-1"></i>Clear Filters
                        </button>
                    </div>

                   
                </div>


                <div class="tab-content" id="transactionTabsContent">
                    <div class="tab-pane fade show active" id="income" role="tabpanel">
                        <div id="incomeTableWrapper">
                        </div>
                    </div>
                    
                    <div class="tab-pane fade" id="expense" role="tabpanel">
                        <div id="expenseTableWrapper">
                        </div>
                    </div>
                </div>

                <div class="pagination-container">
                    <div class="page-info" id="pageInfo">Showing 0 to 0 of 0 entries</div>
                    <nav>
                        <ul class="pagination mb-0" id="pagination">
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </div>

   
  

    <!-- Add Income Type Modal -->
    <div class="modal fade" id="addIncomeTypeModal">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add Income Type</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-plus"></i></div>
                        <input type="text" id="new_income_type_name" class="form-control" placeholder="Type Name">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="addIncomeType()">Save</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Expense Type Modal -->
    <div class="modal fade" id="addExpenseTypeModal">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add Expense Type</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <div class="input-group-text"><i class="ti ti-plus"></i></div>
                        <input type="text" id="new_expense_type_name" class="form-control" placeholder="Type Name">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="addExpenseType()">Save</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="delete_modal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="deleteModalLabel">Confirm Deletion</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    Are you sure you want to delete this transaction?
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>

    {{-- Session-based Notifications --}}
    @if(session('success') || session('error') || $errors->any())
        <div class="custom-alert-box notification-sidebar position-fixed top-2 mt-3 shadow-lg rounded" id="alertContainer">
            @if(session('success'))
                <div class="alert-success p-custom">
                    <i class="fas fa-check-circle text-success icon"></i>
                    {{ session('success') }}
                    <button type="button" class="close-btn" onclick="closeAlert()">&times;</button>
                </div>
            @endif
            @if(session('error'))
                <div class="alert-error p-custom">
                    <i class="fas fa-exclamation-circle text-danger icon"></i>
                    {{ session('error') }}
                    <button type="button" class="close-btn" onclick="closeAlert()">&times;</button>
                </div>
            @endif
            @if ($errors->any())
                <div class="alert-error p-custom">
                    <ul class="list-unstyled mb-0">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                    <button type="button" class="close-btn" onclick="closeAlert()">&times;</button>
                </div>
            @endif
        </div>
        <script>
            document.addEventListener("DOMContentLoaded", function () {
                let alertBox = document.getElementById("alertContainer");
                if (alertBox) {
                    alertBox.classList.add("show-notification");
                    setTimeout(() => closeAlert(), 7000);
                }
            });
            function closeAlert() {
                let alertBox = document.getElementById("alertContainer");
                if (alertBox) {
                    alertBox.style.transition = "right 0.5s ease-in-out, opacity 0.5s ease";
                    alertBox.style.opacity = "0";
                    setTimeout(() => alertBox.style.display = "none", 500);
                }
            }
        </script>
    @endif

    <script>
        // Global variables
        let currentTab = 'income';
        let currentPage = 1;
        let perPage = 10;
        let selectedStartDate = '';
        let selectedEndDate = '';
        let amountFilter = '';

        // Initialize when page loads
        $(document).ready(function() {
            loadTableData();
            initializeDateRangePicker();
        });

        // Date Range Picker
        function initializeDateRangePicker() {
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
                loadTableData();
            });
        }

        // Tab switch
        function switchTab(tab) {
            currentTab = tab;
            currentPage = 1;
            loadTableData();
        }

        // Amount filter with debounce
        let filterTimer;
        $('#amount').on('keyup', function() {
            clearTimeout(filterTimer);
            amountFilter = $(this).val();
            filterTimer = setTimeout(() => {
                currentPage = 1;
                loadTableData();
            }, 500);
        });

        // Clear all filters
        function clearFilters() {
            selectedStartDate = '';
            selectedEndDate = '';
            amountFilter = '';
            $('.bookingrange').val('Select Date Range');
            $('#amount').val('');
            currentPage = 1;
            loadTableData();
        }

        function loadTableData() {
            const params = {
                page: currentPage,
                per_page: perPage,
                start_date: selectedStartDate,
                end_date: selectedEndDate,
                amount: amountFilter,
                type: currentTab
            };

            $.get(`/transactions/data`, params, function(response) {
                updateTable(response.data);
                updatePagination(response);
                updateTotalAmounts(response.totals);
            }).fail(function(xhr) {
                showNotification('Error loading data', 'error');
            });
        }

        // Update table with data
        function updateTable(data) {
            const tableWrapperId = `#${currentTab}TableWrapper`;
            
            let html = '';
            
            if (data.length === 0) {
                html = `
                    <div class="card-body text-center py-5">
                        <i class="ti ti-wallet-off fs-48 text-muted mb-3"></i>
                        <h5 class="text-muted">No ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Found</h5>
                        <p class="text-muted">No transactions found matching your criteria.</p>
                    </div>
                `;
            } else {
                html = `
                    <div class="table-responsive">
                        <table class="table table-nowrap datatable" id="${currentTab}Table">
                            <thead>
                                <tr>
                                    ${currentTab === 'income' ? `
                                        <th>Income Name</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Received From</th>
                                        <th>Payment Method</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    ` : `
                                        <th>Expense Name</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Subcategory</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    `}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(item => {
                                    const typeName = item.income_type?.name || item.expense_type?.name || 'N/A';
                                    return `
                                    <tr data-id="${item.id}">
                                        <td>${typeName}</td>
                                        <td>₹${parseFloat(item.amount).toFixed(2)}</td>
                                        <td>${item.date}</td>
                                        ${currentTab === 'income' ? `
                                            <td>${item.created_by}</td>
                                            <td>PayPal</td>
                                            <td><span class="badge badge-soft-success">Received</span></td>
                                        ` : `
                                            <td>${typeName}</td>
                                            <td>${item.subcategory}</td>
                                            <td><span class="badge badge-soft-danger">Paid</span></td>
                                        `}
                                        <td class="action-item">
                                            <button class="btn btn-sm btn-outline-primary me-1" onclick="edit${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}(${item.id})">
                                                <i class="ti ti-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="delete${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}(${item.id})">
                                                <i class="ti ti-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            $(tableWrapperId).html(html);
        }

        // Update pagination
        function updatePagination(response) {
            const pagination = $('#pagination');
            const pageInfo = $('#pageInfo');
            
            if (response.total === 0) {
                pageInfo.text('Showing 0 to 0 of 0 entries');
                pagination.empty();
                return;
            }

            const from = ((response.current_page - 1) * response.per_page) + 1;
            const to = Math.min(response.current_page * response.per_page, response.total);
            
            pageInfo.text(`Showing ${from} to ${to} of ${response.total} entries`);

            let paginationHtml = '';
            
            // Previous button
            if (response.current_page > 1) {
                paginationHtml += `
                    <li class="page-item">
                        <a class="page-link" href="javascript:void(0)" onclick="changePage(${response.current_page - 1})">
                            <i class="ti ti-chevron-left"></i>
                        </a>
                    </li>
                `;
            }

            // Page numbers
            for (let i = 1; i <= response.last_page; i++) {
                if (i === response.current_page) {
                    paginationHtml += `<li class="page-item active"><a class="page-link" href="javascript:void(0)">${i}</a></li>`;
                } else {
                    paginationHtml += `<li class="page-item"><a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a></li>`;
                }
            }

            // Next button
            if (response.current_page < response.last_page) {
                paginationHtml += `
                    <li class="page-item">
                        <a class="page-link" href="javascript:void(0)" onclick="changePage(${response.current_page + 1})">
                            <i class="ti ti-chevron-right"></i>
                        </a>
                    </li>
                `;
            }

            pagination.html(paginationHtml);
        }

        // Change page
        function changePage(page) {
            currentPage = page;
            loadTableData();
        }

        // Update total amounts
        function updateTotalAmounts(totals) {
            $('#totalIncome').text('₹' + parseFloat(totals.income || 0).toFixed(0));
            $('#totalExpense').text('₹' + parseFloat(totals.expense || 0).toFixed(0));
            const net = parseFloat(totals.income || 0) - parseFloat(totals.expense || 0);
            $('#totalIncomeExpense').text('₹' + net.toFixed(0));

            $('#totalIncomeExpense').text('₹' + net.toFixed(2));
           if (net >= 0) {
            $('#netIcon').removeClass('ti-arrow-down-left').addClass('ti-arrow-up-right');
            } else {
                $('#netIcon').removeClass('ti-arrow-up-right').addClass('ti-arrow-down-left');
            }
        }
        function refreshTable(type) {
            if (type === currentTab) {
                loadTableData();
            }
            updateTotalAmountsFromServer();
        }

        // Update totals from server
        function updateTotalAmountsFromServer() {
            const params = {
                start_date: selectedStartDate,
                end_date: selectedEndDate,
                amount: amountFilter
            };

            $.get('/transactions/totals', params, function(response) {
                updateTotalAmounts(response);
            });
        }

        // Income Functions
        function submitIncome() {
            const formData = new FormData(document.getElementById('addIncomeForm'));
            
            $.ajax({
                url: '/incomes',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
                success: function(data) {
                    $('#addIncomeModal').modal('hide');
                    showNotification('Income Added Successfully', 'success');
                    document.getElementById('addIncomeForm').reset();
                    refreshTable('income');
                },
                error: function(err) {
                    if (err.responseJSON && err.responseJSON.errors) {
                        let errorMsg = '';
                        Object.values(err.responseJSON.errors).forEach(fieldErrors => {
                            fieldErrors.forEach(msg => errorMsg += msg + '\n');
                        });
                        showNotification(errorMsg.trim() || 'Validation Error', 'error');
                    } else {
                        showNotification(err.responseJSON?.message || 'An unexpected error occurred.', 'error');
                    }
                }
            });
        }

        function editIncome(id) {
            $.ajax({
                url: `/incomes/${id}`,
                type: 'GET',
                success: function(data) {
                    $('#edit_income_id').val(data.id);
                    $('#edit_income_date').val(data.date);
                    $('#edit_income_type_select').val(data.income_type_id);
                    $('#edit_income_created_by').val(data.created_by);
                    $('#edit_income_amount').val(data.amount);
                    $('#editIncomeModal').modal('show');
                },
                error: function(err) {
                    showNotification('Failed to load income data.', 'error');
                }
            });
        }

        function updateIncome() {
            const id = $('#edit_income_id').val();
            const formData = new FormData(document.getElementById('editIncomeForm'));
            
            // Add _method for PUT request
            formData.append('_method', 'PUT');
            
            $.ajax({
                url: `/incomes/${id}`,
                type: 'POST', // Use POST for FormData with _method
                data: formData,
                processData: false,
                contentType: false,
                headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
                success: function(data) {
                    $('#editIncomeModal').modal('hide');
                    showNotification('Income Updated Successfully', 'success');
                    refreshTable('income');
                },
                error: function(err) {
                    if (err.responseJSON && err.responseJSON.errors) {
                        let errorMsg = '';
                        Object.values(err.responseJSON.errors).forEach(fieldErrors => {
                            fieldErrors.forEach(msg => errorMsg += msg + '\n');
                        });
                        showNotification(errorMsg.trim() || 'Validation Error', 'error');
                    } else {
                        showNotification(err.responseJSON?.message || 'An unexpected error occurred.', 'error');
                    }
                }
            });
        }

        // Expense Functions
        function submitExpense() {
            const formData = new FormData(document.getElementById('addExpenseForm'));
            
            $.ajax({
                url: '/expenses',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
                success: function(data) {
                    $('#addExpenseModal').modal('hide');
                    showNotification('Expense Added Successfully', 'success');
                    document.getElementById('addExpenseForm').reset();
                    refreshTable('expense');
                },
                error: function(err) {
                    if (err.responseJSON && err.responseJSON.errors) {
                        let errorMsg = '';
                        Object.values(err.responseJSON.errors).forEach(fieldErrors => {
                            fieldErrors.forEach(msg => errorMsg += msg + '\n');
                        });
                        showNotification(errorMsg.trim() || 'Validation Error', 'error');
                    } else {
                        showNotification(err.responseJSON?.message || 'An unexpected error occurred.', 'error');
                    }
                }
            });
        }

        function editExpense(id) {
            $.ajax({
                url: `/expenses/${id}`,
                type: 'GET',
                success: function(data) {
                    $('#edit_expense_id').val(data.id);
                    $('#edit_expense_date').val(data.date);
                    $('#edit_expense_type_select').val(data.expense_type_id);
                    $('#edit_expense_subcategory').val(data.subcategory);
                    $('#edit_expense_created_by').val(data.created_by);
                    $('#edit_expense_amount').val(data.amount);
                    $('#editExpenseModal').modal('show');
                },
                error: function(err) {
                    showNotification('Failed to load expense data.', 'error');
                }
            });
        }

        function updateExpense() {
            const id = $('#edit_expense_id').val();
            const formData = new FormData(document.getElementById('editExpenseForm'));
            
            // Add _method for PUT request
            formData.append('_method', 'PUT');
            
            $.ajax({
                url: `/expenses/${id}`,
                type: 'POST', // Use POST for FormData with _method
                data: formData,
                processData: false,
                contentType: false,
                headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
                success: function(data) {
                    $('#editExpenseModal').modal('hide');
                    showNotification('Expense Updated Successfully', 'success');
                    refreshTable('expense');
                },
                error: function(err) {
                    if (err.responseJSON && err.responseJSON.errors) {
                        let errorMsg = '';
                        Object.values(err.responseJSON.errors).forEach(fieldErrors => {
                            fieldErrors.forEach(msg => errorMsg += msg + '\n');
                        });
                        showNotification(errorMsg.trim() || 'Validation Error', 'error');
                    } else {
                        showNotification(err.responseJSON?.message || 'An unexpected error occurred.', 'error');
                    }
                }
            });
        }

        // Type Management Functions
        function addIncomeType() {
            const name = $('#new_income_type_name').val().trim();
            if (!name) return showNotification('Type name is required.', 'error');
            $.ajax({
                url: '/income-types',
                type: 'POST',
                data: {name: name, _token: '{{ csrf_token() }}'},
                success: function(data) {
                    $('#income_type_select').append(`<option value="${data.id}">${data.name}</option>`);
                    $('#edit_income_type_select').append(`<option value="${data.id}">${data.name}</option>`);
                    $('#addIncomeTypeModal').modal('hide');
                    $('#new_income_type_name').val('');
                    showNotification('Income Type Added Successfully', 'success');
                },
                error: function(err) {
                    showNotification(err.responseJSON?.message || 'Failed to add income type.', 'error');
                }
            });
        }

        function addExpenseType() {
            const name = $('#new_expense_type_name').val().trim();
            if (!name) return showNotification('Type name is required.', 'error');
            $.ajax({
                url: '/expense-types',
                type: 'POST',
                data: {name: name, _token: '{{ csrf_token() }}'},
                success: function(data) {
                    $('#expense_type_select').append(`<option value="${data.id}">${data.name}</option>`);
                    $('#edit_expense_type_select').append(`<option value="${data.id}">${data.name}</option>`);
                    $('#addExpenseTypeModal').modal('hide');
                    $('#new_expense_type_name').val('');
                    showNotification('Expense Type Added Successfully', 'success');
                },
                error: function(err) {
                    showNotification(err.responseJSON?.message || 'Failed to add expense type.', 'error');
                }
            });
        }

        // Delete Functions
        function deleteIncome(id) {
            $('#confirmDelete').off('click').on('click', function() {
                $.ajax({
                    url: `/incomes/${id}`,
                    type: 'DELETE',
                    headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
                    success: function() {
                        $('#delete_modal').modal('hide');
                        showNotification('Income Deleted Successfully', 'success');
                        refreshTable('income');
                    },
                    error: function(err) {
                        showNotification('Failed to delete income.', 'error');
                    }
                });
            });
            $('#delete_modal').modal('show');
        }

        function deleteExpense(id) {
            $('#confirmDelete').off('click').on('click', function() {
                $.ajax({
                    url: `/expenses/${id}`,
                    type: 'DELETE',
                    headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
                    success: function() {
                        $('#delete_modal').modal('hide');
                        showNotification('Expense Deleted Successfully', 'success');
                        refreshTable('expense');
                    },
                    error: function(err) {
                        showNotification('Failed to delete expense.', 'error');
                    }
                });
            });
            $('#delete_modal').modal('show');
        }

        // Notification function
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
                </div>
            `;
            document.body.appendChild(alertBox);
            setTimeout(() => {
                alertBox.style.transition = "right 0.5s ease-in-out, opacity 0.5s ease";
                alertBox.style.opacity = "0";
                setTimeout(() => alertBox.remove(), 500);
            }, 8000);
        }
    </script>


    @endsection
