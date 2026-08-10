
    @extends('layouts.layout-doctor')
    @section('title', 'Doctor || Transactions')
    @section('content')

    <style>
        .custom-alert-box {
            right: -400px;
            z-index: 9999;
            transition: right 0.5s ease-in-out;
        }
        .custom-alert-box.show-notification {
            right: 20px;
        }
        .p-custom {
            padding: 15px 20px;
            border-radius: 8px;
            position: relative;
            display: flex;
            align-items: center;
        }
        .icon {
            margin-right: 10px;
            font-size: 20px;
        }
        .close-btn {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
        }
        .alert-success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }

        .nav-tabs .nav-link.active, .nav-tabs .nav-item.show .nav-link {
               background: #0e606e82 !important;
                color: white;
        }

        .alert-error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        /* New styles for filters and totals */
        .total-amount-card {
           background: #0e606e21;
            border-radius: 8px;
            padding: 9px;
            box-shadow: 0 1px 1px rgb(11 114 127 / 86%);
            margin-bottom: 10px;
                }
        .filter-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .pagination-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
        }
        .page-info {
            font-weight: 500;
            color: #6c757d;
        }
        .input-icon-start {
            position: relative;
        }
        .input-icon-addon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
        }
        .input-icon-start .form-control {
            padding-left: 35px;
        }

        /* Mobile devices only */
@media (max-width: 767px) {

    /* Card padding */
    .total-amount-card {
        padding: 8px 8px;
        border-radius: 8px;
    }

    /* Title text */
    .total-amount-card h6 {
        font-size: 11px;
        margin-bottom: 2px;
        white-space: nowrap;
    }

    /* Amount text */
    .total-amount-card h3 {
        font-size: 14px;
        line-height: 1.1;
    }

    /* Icon size */
    .total-amount-card i {
        font-size: 20px !important;
    }
}


.input-icon-addon {
    top: 18px;
    left: 5px;
    padding: 0 5px 0 4px;
}


    </style>

    <div class="main-wrapper">
        {{-- @include('doctor.inc.header') --}}
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
        {{-- @include('doctor.inc.sidebar') --}}
        <div class="page-wrapper">
                        <div class="content">
                        <div class="text-end d-flex mb-2 mt-2">
                <a href="#" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#addIncomeModal">
                    <i class="ti ti-plus me-1"></i>Add Income
                </a>
                <a href="#" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#addExpenseModal">
                    <i class="ti ti-plus me-1"></i>Add Expense
                </a>
                <!-- Voice Assistant Button - UPDATED -->
                <button class="btn btn-info ms-2 fs-13 btn-md" onclick="voiceAssistant.startListening()">
                    <i class="ti ti-microphone me-1"></i>बोलिए
                </button>
            </div>
                <!-- Total Amount Cards -->
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
                    <!-- Income Tab -->
                    <div class="tab-pane fade show active" id="income" role="tabpanel">
                        <div id="incomeTableWrapper">
                            <!-- Income table will be loaded here -->
                        </div>
                    </div>
                    
                    <!-- Expense Tab -->
                    <div class="tab-pane fade" id="expense" role="tabpanel">
                        <div id="expenseTableWrapper">
                            <!-- Expense table will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div class="pagination-container">
                    <div class="page-info" id="pageInfo">Showing 0 to 0 of 0 entries</div>
                    <nav>
                        <ul class="pagination mb-0" id="pagination">
                            <!-- Pagination will be generated here -->
                        </ul>
                    </nav>
                </div>
            </div>
            <!-- Footer Start -->
        </div>
    </div>

    <!-- Add Income Modal -->
    <div class="modal fade" id="addIncomeModal" data-bs-backdrop="static" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header form-bg px-3">
                    <h5 class="modal-title fw-bold">Add Income</h5>
                    <button type="button" class="btn-close bg-white rounded-circle" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addIncomeForm" enctype="multipart/form-data">
                        @csrf
                        <input type="hidden" name="user_id" value="{{ auth()->id() }}">
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Date<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-calendar"></i></div>
                                    <input type="date" class="form-control border-0 border-info shadow" name="date" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Income Type<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-wallet"></i></div>
                                    <select class="form-select border-0 border-info shadow" id="income_type_select" name="income_type_id" required>
                                        <option value="" selected disabled>Select Type</option>
                                        @foreach(App\Models\IncomeType::where('user_id', auth()->id())->get() as $type)
                                            <option value="{{ $type->id }}">{{ $type->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <button type="button" class="btn btn-outline-primary mt-2" data-bs-toggle="modal" data-bs-target="#addIncomeTypeModal">Add New Type</button>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Created By<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-user"></i></div>
                                    <input type="text" class="form-control border-0 border-info shadow" name="created_by" value="{{ auth()->user()->name }}" readonly required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Amount<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-currency-rupee"></i></div>
                                    <input type="number" step="0.01" class="form-control border-0 border-info shadow" name="amount" placeholder="Amount" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Upload File</label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-upload"></i></div>
                                    <input type="file" class="form-control border-0 border-info shadow" name="file">
                                </div>
                            </div>
                            <div class="col-12">
                                <button type="button" class="btn btn-primary btn-sm" onclick="submitIncome()">Submit Income</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Expense Modal -->
    <div class="modal fade" id="addExpenseModal" data-bs-backdrop="static" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header form-bg px-3">
                    <h5 class="modal-title fw-bold">Add Expense</h5>
                    <button type="button" class="btn-close bg-white rounded-circle" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addExpenseForm" enctype="multipart/form-data">
                        @csrf
                        <input type="hidden" name="user_id" value="{{ auth()->id() }}">
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Date<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-calendar"></i></div>
                                    <input type="date" class="form-control border-0 border-info shadow" name="date" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Expense Type<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-category"></i></div>
                                    <select class="form-select border-0 border-info shadow" id="expense_type_select" name="expense_type_id" required>
                                        <option value="" selected disabled>Select Type</option>
                                        @foreach(App\Models\ExpenseType::where('user_id', auth()->id())->get() as $type)
                                            <option value="{{ $type->id }}">{{ $type->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <button type="button" class="btn btn-outline-primary mt-2" data-bs-toggle="modal" data-bs-target="#addExpenseTypeModal">Add New Type</button>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Subcategory<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-subtask"></i></div>
                                    <input type="text" class="form-control border-0 border-info shadow" name="subcategory" placeholder="Subcategory" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Created By<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-user"></i></div>
                                    <input type="text" class="form-control border-0 border-info shadow" name="created_by" value="{{ auth()->user()->name }}" readonly required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Amount<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-currency-rupee"></i></div>
                                    <input type="number" step="0.01" class="form-control border-0 border-info shadow" name="amount" placeholder="Amount" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Upload File</label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-upload"></i></div>
                                    <input type="file" class="form-control border-0 border-info shadow" name="file">
                                </div>
                            </div>
                            <div class="col-12">
                                <button type="button" class="btn btn-primary btn-sm" onclick="submitExpense()">Submit Expense</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Income Modal -->
    <div class="modal fade" id="editIncomeModal" data-bs-backdrop="static" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header form-bg px-3">
                    <h5 class="modal-title fw-bold">Edit Income</h5>
                    <button type="button" class="btn-close bg-white rounded-circle" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="editIncomeForm" enctype="multipart/form-data">
                        @csrf
                        @method('PUT')
                        <input type="hidden" id="edit_income_id" name="id">
                        <input type="hidden" name="user_id" value="{{ auth()->id() }}">
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Date<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-calendar"></i></div>
                                    <input type="date" class="form-control border-0 border-info shadow" id="edit_income_date" name="date" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Income Type<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-wallet"></i></div>
                                    <select class="form-select border-0 border-info shadow" id="edit_income_type_select" name="income_type_id" required>
                                        <option value="" selected disabled>Select Type</option>
                                        @foreach(App\Models\IncomeType::where('user_id', auth()->id())->get() as $type)
                                            <option value="{{ $type->id }}">{{ $type->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Created By<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-user"></i></div>
                                    <input type="text" class="form-control border-0 border-info shadow" id="edit_income_created_by" name="created_by" value="{{ auth()->user()->name }}" readonly required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Amount<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-currency-rupee"></i></div>
                                    <input type="number" step="0.01" class="form-control border-0 border-info shadow" id="edit_income_amount" name="amount" placeholder="Amount" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Upload File</label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-upload"></i></div>
                                    <input type="file" class="form-control border-0 border-info shadow" name="file">
                                </div>
                            </div>
                            <div class="col-12">
                                <button type="button" class="btn btn-primary btn-sm" onclick="updateIncome()">Update Income</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Expense Modal -->
    <div class="modal fade" id="editExpenseModal" data-bs-backdrop="static" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header form-bg px-3">
                    <h5 class="modal-title fw-bold">Edit Expense</h5>
                    <button type="button" class="btn-close bg-white rounded-circle" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="editExpenseForm" enctype="multipart/form-data">
                        @csrf
                        @method('PUT')
                        <input type="hidden" id="edit_expense_id" name="id">
                        <input type="hidden" name="user_id" value="{{ auth()->id() }}">
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Date<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-calendar"></i></div>
                                    <input type="date" class="form-control border-0 border-info shadow" id="edit_expense_date" name="date" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Expense Type<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-category"></i></div>
                                    <select class="form-select border-0 border-info shadow" id="edit_expense_type_select" name="expense_type_id" required>
                                        <option value="" selected disabled>Select Type</option>
                                        @foreach(App\Models\ExpenseType::where('user_id', auth()->id())->get() as $type)
                                            <option value="{{ $type->id }}">{{ $type->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Subcategory<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-subtask"></i></div>
                                    <input type="text" class="form-control border-0 border-info shadow" id="edit_expense_subcategory" name="subcategory" placeholder="Subcategory" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Created By<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-user"></i></div>
                                    <input type="text" class="form-control border-0 border-info shadow" id="edit_expense_created_by" name="created_by" value="{{ auth()->user()->name }}" readonly required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Amount<span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-currency-rupee"></i></div>
                                    <input type="number" step="0.01" class="form-control border-0 border-info shadow" id="edit_expense_amount" name="amount" placeholder="Amount" required>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label text-dark fw-bold">Upload File</label>
                                <div class="input-group">
                                    <div class="input-group-text"><i class="ti ti-upload"></i></div>
                                    <input type="file" class="form-control border-0 border-info shadow" name="file">
                                </div>
                            </div>
                            <div class="col-12">
                                <button type="button" class="btn btn-primary btn-sm" onclick="updateExpense()">Update Expense</button>
                            </div>
                        </div>
                    </form>
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

        // Load table data with filters and pagination
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









<script>
class VoiceAssistant {
    constructor() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.log('Browser mein voice support nahi hai');
            return;
        }
        
        // Speech Recognition setup
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'hi-IN'; // Hindi primary, English bhi detect karega
        
        // Speech Synthesis setup
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.assistantEnabled = false;
        this.currentTab = 'income';
        
        // User data
        this.csrfToken = '{{ csrf_token() }}';
        this.userId = {{ auth()->id() }};
        this.userName = "{{ auth()->user()->name }}";
        
        // Available commands list
        this.commands = {
            income: ['income', 'aamdani', 'आमदनी', 'add income', 'income add karo', 'paisa aaya'],
            expense: ['expense', 'kharcha', 'खर्चा', 'add expense', 'kharcha add karo', 'paisa gaya'],
            summary: ['total', 'batao', 'summary', 'kitna', 'balance', 'baki', 'dikhao', 'show', 'कितना', 'बताओ'],
            showIncome: ['income dikhao', 'income show', 'aamdani dikhao', 'आमदनी दिखाओ'],
            showExpense: ['expense dikhao', 'kharcha dikhao', 'खर्चा दिखाओ'],
            clear: ['clear', 'saaf karo', 'साफ करो', 'reset'],
            help: ['help', 'madad', 'सहायता', 'kya kar sakte ho']
        };
        
        // Bind events
        this.bindEvents();
        
        // Welcome message on initialization
        setTimeout(() => {
            if (this.assistantEnabled) {
                this.welcomeMessage();
            }
        }, 2000);
    }
    
    bindEvents() {
        this.recognition.onresult = (e) => this.handleResult(e);
        
        this.recognition.onend = () => {
            this.isListening = false;
            // Don't auto-restart unless explicitly toggled
        };
        
        this.recognition.onerror = (e) => {
            console.log('Error:', e.error);
            this.isListening = false;
            this.updateIconStatus('idle');
            
            if (e.error === 'no-speech') {
                this.speak("Kuch sunayi nahi diya, microphone check karein.");
            } else if (e.error === 'not-allowed') {
                this.speak("Microphone access nahi hai. Kripya permission dein.");
            }
        };
    }
    
    // Welcome message
    welcomeMessage() {
        const message = "Namaste! Main Scoracare assistant hoon. Main income aur expense module mein aapki madad kar sakta hoon. Aap kya karna chahenge? Jaise: 500 income add karo, 300 kharcha add karo, ya total batao.";
        this.speak(message);
        this.showIcon(true, 'idle');
    }
    
    // Toggle assistant on/off
    toggleAssistant() {
        this.assistantEnabled = !this.assistantEnabled;
        
        if (this.assistantEnabled) {
            this.welcomeMessage();
            this.showIcon(true, 'idle');
        } else {
            this.speak("Voice assistant band ho gaya.");
            this.showIcon(false);
            if (this.isListening) {
                this.recognition.abort();
                this.isListening = false;
            }
        }
    }
    
    // Start listening
    startListening() {
        if (!this.assistantEnabled) {
            this.toggleAssistant();
            return;
        }
        
        if (this.isListening) {
            this.speak("Main sun raha hoon...");
            return;
        }
        
        this.isListening = true;
        this.updateIconStatus('listening');
        this.speak("Boliye...");
        
        try {
            this.recognition.start();
        } catch(e) {
            console.log('Recognition error:', e);
            this.isListening = false;
            this.updateIconStatus('idle');
        }
    }
    
    // Handle voice result
    handleResult(event) {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        console.log('User said:', command);
        
        // Process command
        this.processCommand(command);
    }
    
    // Main command processor
    processCommand(command) {
        // Check for help
        if (this.matchCommand(command, this.commands.help)) {
            this.speak("Main ye commands samajh sakta hoon: income add karo, expense add karo, total batao, income dikhao, expense dikhao. Amount ke saath command bolein jaise: 500 income, 300 kharcha");
            return;
        }
        
        // Extract amount from command
        const amountMatch = command.match(/(\d+(?:\.\d+)?)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
        
        // Extract description/subcategory
        let description = this.extractDescription(command);
        
        // Check for summary/total
        if (this.matchCommand(command, this.commands.summary)) {
            this.getSummary();
            return;
        }
        
        // Check for show income tab
        if (this.matchCommand(command, this.commands.showIncome)) {
            this.switchToTab('income');
            return;
        }
        
        // Check for show expense tab
        if (this.matchCommand(command, this.commands.showExpense)) {
            this.switchToTab('expense');
            return;
        }
        
        // Check for clear filters
        if (this.matchCommand(command, this.commands.clear)) {
            this.clearAllFilters();
            return;
        }
        
        // Check for income with amount
        if (amount && this.matchCommand(command, this.commands.income)) {
            this.addIncome(amount, description || 'General Income');
            return;
        }
        
        // Check for expense with amount
        if (amount && this.matchCommand(command, this.commands.expense)) {
            this.addExpense(amount, description || 'General Expense');
            return;
        }
        
        // If only amount mentioned without type, use current tab
        if (amount) {
            if (this.currentTab === 'income') {
                this.addIncome(amount, description || 'General Income');
            } else {
                this.addExpense(amount, description || 'General Expense');
            }
            return;
        }
        
        // If no command matched
        this.speak("Mujhe samajh nahi aaya. Kripya saaf commands bolein jaise: 500 income, 300 kharcha, ya total batao. Help ke liye 'help' bolein.");
    }
    
    // Match command against array of keywords
    matchCommand(command, keywords) {
        return keywords.some(keyword => command.includes(keyword));
    }
    
    // Extract description from command
    extractDescription(command) {
        // Common description words
        const commonWords = ['income', 'expense', 'aamdani', 'kharcha', 'add', 'karo', 'bolein', 'hai', 'ka', 'ki', 'ke', 'mein', 'main', 'aur'];
        const words = command.split(' ');
        
        // Filter out common words and numbers
        const descriptionWords = words.filter(word => 
            !commonWords.includes(word) && 
            !word.match(/^\d+$/) &&
            word.length > 2
        );
        
        return descriptionWords.length > 0 ? descriptionWords.join(' ') : '';
    }
    
    // Add income
    addIncome(amount, description) {
        this.speak(`${amount} rupaye income add kar raha hoon...`);
        
        // Get or create income type
        this.getOrCreateIncomeType(description, (typeId) => {
            $.ajax({
                url: '/incomes',
                type: 'POST',
                data: {
                    _token: this.csrfToken,
                    user_id: this.userId,
                    date: new Date().toISOString().split('T')[0],
                    income_type_id: typeId,
                    amount: amount,
                    created_by: this.userName
                },
                success: (data) => {
                    this.speak(`${amount} rupaye income add ho gaya.`);
                    if (typeof refreshTable === 'function') refreshTable('income');
                    this.getSummary(); // Show updated summary
                    
                    // Show success notification
                    if (typeof showNotification === 'function') {
                        showNotification(`₹${amount} Income Added`, 'success');
                    }
                },
                error: (err) => {
                    console.error('Add income error:', err);
                    this.speak("Income add nahi ho paya. Kripya manual entry karein.");
                    
                    // Open modal with pre-filled amount
                    this.openIncomeModal(amount);
                }
            });
        });
    }
    
    // Add expense
    addExpense(amount, subcategory) {
        this.speak(`${amount} rupaye kharcha add kar raha hoon...`);
        
        // Get or create expense type
        this.getOrCreateExpenseType(subcategory, (typeId) => {
            $.ajax({
                url: '/expenses',
                type: 'POST',
                data: {
                    _token: this.csrfToken,
                    user_id: this.userId,
                    date: new Date().toISOString().split('T')[0],
                    expense_type_id: typeId,
                    subcategory: subcategory,
                    amount: amount,
                    created_by: this.userName
                },
                success: (data) => {
                    this.speak(`${amount} rupaye kharcha add ho gaya.`);
                    if (typeof refreshTable === 'function') refreshTable('expense');
                    this.getSummary(); // Show updated summary
                    
                    // Show success notification
                    if (typeof showNotification === 'function') {
                        showNotification(`₹${amount} Expense Added`, 'success');
                    }
                },
                error: (err) => {
                    console.error('Add expense error:', err);
                    this.speak("Kharcha add nahi ho paya. Kripya manual entry karein.");
                    
                    // Open modal with pre-filled amount
                    this.openExpenseModal(amount, subcategory);
                }
            });
        });
    }
    
    // Get or create income type
    getOrCreateIncomeType(name, callback) {
        // First try to find existing type
        $.ajax({
            url: '/income-types/search',
            type: 'GET',
            data: { name: name },
            success: (types) => {
                if (types && types.length > 0) {
                    callback(types[0].id);
                } else {
                    // Create new type
                    $.ajax({
                        url: '/income-types',
                        type: 'POST',
                        data: {
                            _token: this.csrfToken,
                            name: name || 'General Income'
                        },
                        success: (newType) => {
                            callback(newType.id);
                        },
                        error: () => {
                            callback(1); // Default ID
                        }
                    });
                }
            },
            error: () => {
                callback(1); // Default ID
            }
        });
    }
    
    // Get or create expense type
    getOrCreateExpenseType(name, callback) {
        // First try to find existing type
        $.ajax({
            url: '/expense-types/search',
            type: 'GET',
            data: { name: name },
            success: (types) => {
                if (types && types.length > 0) {
                    callback(types[0].id);
                } else {
                    // Create new type
                    $.ajax({
                        url: '/expense-types',
                        type: 'POST',
                        data: {
                            _token: this.csrfToken,
                            name: name || 'General Expense'
                        },
                        success: (newType) => {
                            callback(newType.id);
                        },
                        error: () => {
                            callback(1); // Default ID
                        }
                    });
                }
            },
            error: () => {
                callback(1); // Default ID
            }
        });
    }
    
    // Get summary
    getSummary() {
        this.speak("Total calculate kar raha hoon...");
        
        $.ajax({
            url: '/transactions/totals',
            type: 'GET',
            data: {},
            success: (response) => {
                const income = parseFloat(response.income || 0).toFixed(2);
                const expense = parseFloat(response.expense || 0).toFixed(2);
                const balance = (income - expense).toFixed(2);
                
                let message = `Total income ${income} rupaye, total kharcha ${expense} rupaye, aur balance ${balance} rupaye hai.`;
                
                if (balance > 0) {
                    message += " Aap profit mein hain.";
                } else if (balance < 0) {
                    message += " Aap loss mein hain.";
                }
                
                this.speak(message);
                
                // Update UI totals
                if (typeof updateTotalAmounts === 'function') {
                    updateTotalAmounts(response);
                }
            },
            error: (err) => {
                console.error('Summary error:', err);
                this.speak("Total calculate nahi ho paya. Baad mein try karein.");
            }
        });
    }
    
    // Switch to specific tab
    switchToTab(tab) {
        this.currentTab = tab;
        
        if (typeof switchTab === 'function') {
            switchTab(tab);
        } else {
            // Manual tab switch
            if (tab === 'income') {
                $('#income-tab').tab('show');
            } else {
                $('#expense-tab').tab('show');
            }
        }
        
        this.speak(`${tab === 'income' ? 'Income' : 'Expense'} tab open ho gaya.`);
    }
    
    // Clear all filters
    clearAllFilters() {
        if (typeof clearFilters === 'function') {
            clearFilters();
            this.speak("Saare filters clear ho gaye.");
        } else {
            // Manual clear
            selectedStartDate = '';
            selectedEndDate = '';
            amountFilter = '';
            $('.bookingrange').val('Select Date Range');
            $('#amount').val('');
            if (typeof loadTableData === 'function') loadTableData();
            this.speak("Filters clear ho gaye.");
        }
    }
    
    // Open income modal with pre-filled amount
    openIncomeModal(amount) {
        // Click add income button
        $('[data-bs-target="#addIncomeModal"]').click();
        
        // Set amount after modal opens
        setTimeout(() => {
            $('#addIncomeModal input[name="amount"]').val(amount);
            $('#addIncomeModal input[name="date"]').val(new Date().toISOString().split('T')[0]);
            
            // Focus on amount field
            $('#addIncomeModal input[name="amount"]').focus();
            
            this.speak("Income form open ho gaya. Aap manually details bhar sakte hain.");
        }, 500);
    }
    
    // Open expense modal with pre-filled amount
    openExpenseModal(amount, subcategory) {
        // Click add expense button
        $('[data-bs-target="#addExpenseModal"]').click();
        
        // Set values after modal opens
        setTimeout(() => {
            $('#addExpenseModal input[name="amount"]').val(amount);
            $('#addExpenseModal input[name="date"]').val(new Date().toISOString().split('T')[0]);
            if (subcategory) {
                $('#addExpenseModal input[name="subcategory"]').val(subcategory);
            }
            
            // Focus on amount field
            $('#addExpenseModal input[name="amount"]').focus();
            
            this.speak("Expense form open ho gaya. Aap manually details bhar sakte hain.");
        }, 500);
    }
    
    // Speak text
    speak(text) {
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Try to get Hindi voice
        const voices = this.synthesis.getVoices();
        const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('hin'));
        if (hindiVoice) {
            utterance.voice = hindiVoice;
        }
        
        this.synthesis.speak(utterance);
    }
    
    // Update icon status
    updateIconStatus(status) {
        const icon = document.getElementById('voice-assistant-icon');
        if (!icon) return;
        
        if (status === 'listening') {
            icon.innerHTML = '🎤';
            icon.style.background = '#e74c3c';
            icon.style.animation = 'pulse 1.5s infinite';
            icon.style.transform = 'scale(1.1)';
        } else {
            icon.innerHTML = '🗣️';
            icon.style.background = '#0e606e';
            icon.style.animation = 'none';
            icon.style.transform = 'scale(1)';
        }
    }
    
    // Show/hide icon
    showIcon(show, status = 'idle') {
        let icon = document.getElementById('voice-assistant-icon');
        
        if (show) {
            if (!icon) {
                icon = document.createElement('div');
                icon.id = 'voice-assistant-icon';
                icon.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 100px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    color: white;
                    cursor: pointer;
                    z-index: 10001;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                    background: #0e606e;
                `;
                
                // Add hover effect
                icon.onmouseover = () => {
                    icon.style.transform = 'scale(1.1)';
                    icon.style.boxShadow = '0 6px 25px rgba(14,96,110,0.5)';
                };
                
                icon.onmouseout = () => {
                    icon.style.transform = status === 'listening' ? 'scale(1.1)' : 'scale(1)';
                    icon.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                };
                
                icon.onclick = () => this.startListening();
                
                document.body.appendChild(icon);
            }
            
            this.updateIconStatus(status);
        } else if (icon) {
            icon.remove();
        }
    }
}

// Add pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { 
            transform: scale(1.1);
            box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
        }
        50% { 
            transform: scale(1.2);
            box-shadow: 0 0 0 15px rgba(231, 76, 60, 0);
        }
    }
`;
document.head.appendChild(style);

// Initialize voice assistant
window.voiceAssistant = new VoiceAssistant();

// Make functions globally available
window.startVoiceAssistant = function() {
    window.voiceAssistant.toggleAssistant();
};

// Auto-initialize on page load
$(document).ready(() => {
    // Small delay to ensure everything is loaded
    setTimeout(() => {
        window.voiceAssistant.toggleAssistant();
    }, 2000);
});

// Add keyboard shortcut (Alt+V) to toggle assistant
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'v') {
        e.preventDefault();
        window.voiceAssistant.toggleAssistant();
    }
});
</script>

<!-- Add tooltip for voice button -->
<style>
.btn-info {
    position: relative;
    overflow: hidden;
}

.btn-info i.ti-microphone {
    animation: subtle-pulse 2s infinite;
}

@keyframes subtle-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Voice assistant floating tooltip */
.voice-tooltip {
    position: absolute;
    bottom: 85px;
    right: 100px;
    background: #0e606e;
    color: white;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 13px;
    white-space: nowrap;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: fadeInOut 5s ease-in-out;
}

@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(10px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>



@endsection
