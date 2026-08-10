@extends('layouts.layout-doctor')
@section('title', 'Doctor || Transactions')
@section('content')
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<style>
    .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 20px;
}

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
    
    .total-amount-card {
        background: #0e606e21;
        border-radius: 8px;
        padding: 9px;
        box-shadow: 0 1px 1px rgb(11 114 127 / 86%);
        margin-bottom: 10px;
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

    /* Export Panel Styles */
    .export-panel {
     background: linear-gradient(135deg, #ffffff);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    color: white;
    box-shadow: 0 4px 10px rgb(0 0 0 / 11%);
    }
    
   
    .total-amount-card:hover {
        transform: translateY(-2px);
    }
    
    .total-amount-card.selected {
        background: rgb(14 96 110 / 34%)
    }
    
    .export-icon {
        font-size: 24px;
        margin-bottom: 10px;
        color: #0e606e;
    }
    
    .selection-info {
        background: #e8f4fd;
        border-radius: 8px;
        padding: 10px 15px;
        margin: 10px 0;
        color: #0e606e;
        font-weight: 500;
    }
    
    .checkbox-column {
        width: 40px;
        text-align: center;
    }
    
    .select-all-checkbox {
        cursor: pointer;
    }
    
    .row-checkbox {
        cursor: pointer;
    }
    
    .export-progress {
        display: none;
        margin-top: 15px;
    }
    
    .progress {
        height: 10px;
        border-radius: 5px;
    }
    
    .export-stats {
        font-size: 12px;
        margin-top: 5px;
        color: rgba(255,255,255,0.9);
    }
    
    .summary-badge {
        background: #0e606e;
        color: white;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 12px;
        margin-left: 10px;
    }
    
    .quick-export-btn {
        background: white;
        color: #0e606e;
        border: none;
        padding: 8px 15px;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .quick-export-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    @media (max-width: 767px) {
        .total-amount-card {
            padding: 8px 8px;
            border-radius: 8px;
        }
        .total-amount-card h6 {
            font-size: 11px;
            margin-bottom: 2px;
            white-space: nowrap;
        }
        .total-amount-card h3 {
            font-size: 14px;
            line-height: 1.1;
        }
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
    <div class="page-wrapper">
        <div class="content">
            <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-2 border-1 border-bottom">
                <div class="flex-grow-1">
                    <h4 class="fw-bold mb-0 text-primary">Transactions</h4>
                </div>
                <div class="text-end d-flex gap-2">
                    <button class="btn btn-success ms-2 fs-13 btn-md" onclick="showExportPanel()">
                        <i class="ti ti-file-export me-1"></i>Export
                    </button>
                    <a href="#" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#addIncomeModal">
                        <i class="ti ti-plus me-1"></i>Add Income
                    </a>
                    <a href="#" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#addExpenseModal">
                        <i class="ti ti-plus me-1"></i>Add Expense
                    </a>
                </div>
            </div>

            <!-- Export Panel (Initially Hidden) -->
            <div id="exportPanel" class="export-panel" style="display: none;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0"><i class="ti ti-file-export me-2"></i>Export Transactions</h5>
                    <button class="btn-close btn-close-white" onclick="hideExportPanel()"></button>
                </div>
                
                <div class="row">
                    <div class="col-md-4">
                        <div class="total-amount-card" onclick="selectExportOption('all')" id="exportOptionAll">
                            <div class="export-icon"><i class="ti ti-database"></i></div>
                            <h6 class="text-primary">All Transactions</h6>
                            <small class="text-primary">Export all data from current view</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="total-amount-card" onclick="selectExportOption('selected')" id="exportOptionSelected">
                            <div class="export-icon"><i class="ti ti-checkbox"></i></div>
                            <h6 class="text-primary">Selected Only</h6>
                            <small class="text-primary">Export only checked items</small>
                            <span id="selectedCountBadge" class="summary-badge">0 selected</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="total-amount-card" onclick="selectExportOption('filtered')" id="exportOptionFiltered">
                            <div class="export-icon"><i class="ti ti-filter"></i></div>
                            <h6 class="text-primary">Filtered Results</h6>
                            <small class="text-primary">Export current filtered data</small>
                        </div>
                    </div>
                </div>
                
                <div class="selection-info" id="selectionInfo">
                    <i class="ti ti-info-circle me-2"></i>
                    <span id="selectionInfoText">Select export option to continue</span>
                </div>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <label class="form-label text-primary">File Format</label>
                        <select class="form-select" id="exportFormat">
                            <option value="csv">CSV (.csv)</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-primary">Include Summary</label>
                        <select class="form-select" id="includeSummary">
                            <option value="yes">Yes - Include totals</option>
                            <option value="no">No - Data only</option>
                        </select>
                    </div>
                </div>
                
                <div class="export-progress" id="exportProgress">
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             id="exportProgressBar" style="width: 0%"></div>
                    </div>
                    <div class="export-stats" id="exportStats">
                        Preparing export...
                    </div>
                </div>
                
                <div class="text-end mt-3">
                    <button class="btn total-amount-card me-2" onclick="hideExportPanel()">Cancel</button>
                    <button class="btn total-amount-card" onclick="processExport()">
                        <i class="ti ti-download me-2"></i>Export Now
                    </button>
                </div>
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
               
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <div class="input-icon-start position-relative">
                        <span class="input-icon-addon text-dark">
                            <i class="ti ti-calendar-event"></i>
                        </span>
                        <input type="text" class="form-control form-control-sm date-input bookingrange" value="Select Date Range">
                    </div>

                    <div class="search-input">
                        <input type="text" id="amount" class="form-control form-control-sm" placeholder="Search by amount">
                    </div>

                    <button class="btn btn-outline-secondary btn-sm" onclick="clearFilters()">
                        <i class="ti ti-refresh me-1"></i>Clear Filters
                    </button>
                </div>

                 <ul class="nav nav-tabs" id="transactionTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="fw-bold nav-link total-amount-card bg-none border-0 active" id="income-tab" 
                                data-bs-toggle="tab" data-bs-target="#income" 
                                type="button" role="tab" onclick="switchTab('income')">
                            <i class="ti ti-arrow-up-right fs-16"></i> Income
                        </button>
                    </li>
                    <li class="nav-item ms-2" role="presentation">
                        <button class="fw-bold nav-link total-amount-card bg-transparent border-0" id="expense-tab" 
                                data-bs-toggle="tab" data-bs-target="#expense" 
                                type="button" role="tab" onclick="switchTab('expense')">
                            <i class="ti ti-arrow-down-left fs-16"></i> Expenses
                        </button>
                    </li>
                </ul>
            </div>

            <div class="tab-content" id="transactionTabsContent">
                <div class="tab-pane fade show active" id="income" role="tabpanel">
                    <div id="incomeTableWrapper">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2">Loading income data...</p>
                        </div>
                    </div>
                </div>
                
                <div class="tab-pane fade" id="expense" role="tabpanel">
                    <div id="expenseTableWrapper">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2">Loading expense data...</p>
                        </div>
                    </div>
                </div>
            </div>

         <div class="pagination-container">
            <div class="d-flex align-items-center gap-2">
                <span class="text-muted small">Show</span>
                <select id="perPageSelect" class="form-select form-select-sm w-auto">
                    <option value="10" selected>10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
                <span class="text-muted small">entries</span>
            </div>
            <div class="page-info" id="pageInfo">Showing 0 to 0 of 0 entries</div>
            <nav>
                <ul class="pagination mb-0" id="pagination"></ul>
            </nav>
        </div>
        </div>
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
<script>
let currentTab = 'income';
let currentPage = 1;
let perPage = 10;
let selectedStartDate = '';
let selectedEndDate = '';
let amountFilter = '';
let exportOption = 'all';
let selectedRowIds = new Set();

// ====================== LOADING HELPER FUNCTIONS ======================
function showButtonLoading(selector, loadingText = 'Processing...') {
    const btn = $(selector);
    if (btn.length === 0) return;
    
    btn.prop('disabled', true).addClass('disabled');
    btn.data('original-html', btn.html());
    btn.html(`
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        ${loadingText}
    `);
}

function hideButtonLoading(selector) {
    const btn = $(selector);
    if (btn.length === 0) return;
    
    btn.prop('disabled', false).removeClass('disabled');
    const original = btn.data('original-html');
    if (original) btn.html(original);
}
// ========================================================================

$(document).ready(function() {
    console.log('Document ready, initializing...');
    initializeDateRangePicker();
    loadTableData();
    updateTotalAmountsFromServer();

    $('#perPageSelect').on('change', function() {
        perPage = parseInt($(this).val());
        currentPage = 1;
        selectedRowIds.clear();
        loadTableData();
    });
});

function initializeDateRangePicker() {
    if (typeof $.fn.daterangepicker === 'undefined') {
        console.error('DateRangePicker not loaded');
        return;
    }
   
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
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            'Custom Range': []
        }
    }, function(start, end, label) {
        $('.bookingrange').val(start.format('DD MMM YYYY') + ' - ' + end.format('DD MMM YYYY'));
        selectedStartDate = start.format('YYYY-MM-DD');
        selectedEndDate = end.format('YYYY-MM-DD');
        currentPage = 1;
        loadTableData();
        updateTotalAmountsFromServer();
    });
}

function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    selectedRowIds.clear();
    loadTableData();
}

let filterTimer;
$('#amount').on('keyup', function() {
    clearTimeout(filterTimer);
    amountFilter = $(this).val();
    filterTimer = setTimeout(() => {
        currentPage = 1;
        loadTableData();
        updateTotalAmountsFromServer();
    }, 500);
});

function clearFilters() {
    selectedStartDate = '';
    selectedEndDate = '';
    amountFilter = '';
    $('.bookingrange').val('Select Date Range');
    $('#amount').val('');
    currentPage = 1;
    selectedRowIds.clear();
    loadTableData();
    updateTotalAmountsFromServer();
}

function loadTableData() {
    console.log("Loading:", currentTab);
    const params = {
        page: currentPage,
        per_page: perPage,
        type: currentTab
    };
    if (selectedStartDate && selectedEndDate) {
        params.start_date = selectedStartDate;
        params.end_date = selectedEndDate;
    }
    if (amountFilter) {
        params.amount = amountFilter;
    }

    $(`#${currentTab}TableWrapper`).html(`
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading data...</p>
        </div>
    `);

    $.ajax({
        url: '/transactions/data',
        type: 'GET',
        data: params,
        success: function(response) {
            if (response.data) {
                updateTable(response.data);
            } else {
                updateTable([]);
            }
           
            if (response.current_page && response.last_page && response.total) {
                updatePagination(response);
            }
           
            if (response.totals) {
                updateTotalAmounts(response.totals);
            }
        },
        error: function(error) {
            console.error('Error loading data:', error);
            $(`#${currentTab}TableWrapper`).html(`
                <div class="card-body text-center py-5">
                    <i class="ti ti-alert-circle fs-48 text-danger mb-3"></i>
                    <h5 class="text-danger">Error Loading Data</h5>
                    <p class="text-muted">Failed to load transaction data. Please try again.</p>
                </div>
            `);
            showAlert('Failed to load transaction data', 'error');
        }
    });
}

function updateTable(data) {
    const tableWrapperId = `#${currentTab}TableWrapper`;
   
    let html = '';
   
    if (!data || data.length === 0) {
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
                            <th class="checkbox-column">
                                <input type="checkbox" class="form-check-input select-all-checkbox" onchange="toggleSelectAll(this)"> select</th>
                            <th>S.No</th>
                            ${currentTab === 'income' ? `
                                <th>Income Name</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Received From</th>
                                <th>Status</th>
                                <th>Action</th>
                            ` : `
                                <th>Expense Name</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Subcategory</th>
                                <th>Status</th>
                                <th>Action</th>
                            `}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((item, index) => {
                            const typeName = item.income_type?.name || item.expense_type?.name || 'N/A';
                            const serialNo = ((currentPage - 1) * perPage) + index + 1;
                            const isChecked = selectedRowIds.has(item.id) ? 'checked' : '';
                            return `
                            <tr data-id="${item.id}">
                                <td class="checkbox-column">
                                    <input type="checkbox" class="form-check-input row-checkbox"
                                           value="${item.id}" ${isChecked} onchange="toggleRowSelection(${item.id}, this.checked)">
                                </td>
                                <td>${serialNo}</td>
                                <td>${typeName}</td>
                                <td>₹${parseFloat(item.amount).toFixed(2)}</td>
                                <td>${item.date}</td>
                                ${currentTab === 'income' ? `
                                    <td>${item.created_by || 'N/A'}</td>
                                    <td><span class="badge badge-soft-success">Received</span></td>
                                ` : `
                                    <td>${item.subcategory || 'N/A'}</td>
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
    updateSelectedCount();
}

function toggleSelectAll(checkbox) {
    const isChecked = checkbox.checked;
    $('.row-checkbox').each(function() {
        $(this).prop('checked', isChecked);
        const id = parseInt($(this).val());
        if (isChecked) {
            selectedRowIds.add(id);
        } else {
            selectedRowIds.delete(id);
        }
    });
    updateSelectedCount();
}

function toggleRowSelection(id, isChecked) {
    if (isChecked) {
        selectedRowIds.add(id);
    } else {
        selectedRowIds.delete(id);
    }
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = selectedRowIds.size;
    $('#selectedCountBadge').text(count + ' selected');
   
    const totalCheckboxes = $('.row-checkbox').length;
    const checkedCheckboxes = $('.row-checkbox:checked').length;
   
    if (totalCheckboxes > 0) {
        $('.select-all-checkbox').prop('checked', totalCheckboxes === checkedCheckboxes);
        $('.select-all-checkbox').prop('indeterminate', checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes);
    }
}

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
    if (response.current_page > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="javascript:void(0)" onclick="changePage(${response.current_page - 1})">
                    <i class="ti ti-chevron-left"></i>
                </a>
            </li>
        `;
    } else {
        paginationHtml += `
            <li class="page-item disabled">
                <a class="page-link" href="javascript:void(0)">
                    <i class="ti ti-chevron-left"></i>
                </a>
            </li>
        `;
    }
    for (let i = 1; i <= response.last_page; i++) {
        if (i === response.current_page) {
            paginationHtml += `<li class="page-item active"><a class="page-link" href="javascript:void(0)">${i}</a></li>`;
        } else {
            paginationHtml += `<li class="page-item"><a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a></li>`;
        }
    }
    if (response.current_page < response.last_page) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="javascript:void(0)" onclick="changePage(${response.current_page + 1})">
                    <i class="ti ti-chevron-right"></i>
                </a>
            </li>
        `;
    } else {
        paginationHtml += `
            <li class="page-item disabled">
                <a class="page-link" href="javascript:void(0)">
                    <i class="ti ti-chevron-right"></i>
                </a>
            </li>
        `;
    }
    pagination.html(paginationHtml);
}

function changePage(page) {
    currentPage = page;
    loadTableData();
}

function updateTotalAmounts(totals) {
    $('#totalIncome').text('₹' + parseFloat(totals.income || 0).toFixed(0));
    $('#totalExpense').text('₹' + parseFloat(totals.expense || 0).toFixed(0));
    const net = parseFloat(totals.income || 0) - parseFloat(totals.expense || 0);
    $('#totalIncomeExpense').text('₹' + net.toFixed(0));
    if (net >= 0) {
        $('#netIcon').removeClass('ti-arrow-down-left').addClass('ti-arrow-up-right');
    } else {
        $('#netIcon').removeClass('ti-arrow-up-right').addClass('ti-arrow-down-left');
    }
}

function updateTotalAmountsFromServer() {
    const params = {
        start_date: selectedStartDate,
        end_date: selectedEndDate,
        amount: amountFilter
    };
    $.ajax({
        url: '/transactions/totals',
        type: 'GET',
        data: params,
        success: function(response) {
            updateTotalAmounts(response);
        },
        error: function(error) {
            console.error('Error loading totals:', error);
        }
    });
}

function refreshTable(type) {
    if (type === currentTab) {
        loadTableData();
    }
    updateTotalAmountsFromServer();
}

function showExportPanel() {
    $('#exportPanel').slideDown();
    updateSelectedCount();
}

function hideExportPanel() {
    $('#exportPanel').slideUp();
    $('#exportProgress').hide();
    $('.total-amount-card').removeClass('selected');
    exportOption = 'all';
    $('#selectionInfoText').text('Select export option to continue');
}

function selectExportOption(option) {
    exportOption = option;
    $('.total-amount-card').removeClass('selected');
    $(`#exportOption${option.charAt(0).toUpperCase() + option.slice(1)}`).addClass('selected');
   
    let infoText = '';
    switch(option) {
        case 'all':
            infoText = 'All transactions from current view will be exported';
            break;
        case 'selected':
            infoText = `${selectedRowIds.size} selected transaction(s) will be exported`;
            break;
        case 'filtered':
            infoText = 'Current filtered results will be exported';
            break;
    }
    $('#selectionInfoText').text(infoText);
}

async function processExport() {
    const btnSelector = '#exportPanel button[onclick="processExport()"]';
    showButtonLoading(btnSelector, 'Exporting...');

    const format = $('#exportFormat').val();
    const includeSummary = $('#includeSummary').val() === 'yes';
   
    $('#exportProgress').show();
    $('#exportProgressBar').css('width', '0%');
    $('#exportStats').text('Fetching data...');
   
    try {
        let data = [];
       
        if (exportOption === 'selected') {
            if (selectedRowIds.size === 0) {
                showAlert('No items selected for export', 'warning');
                $('#exportProgress').hide();
                hideButtonLoading(btnSelector);
                return;
            }
            data = await fetchSelectedData(Array.from(selectedRowIds));
        } else {
            data = await fetchAllData(exportOption === 'filtered');
        }
       
        $('#exportProgressBar').css('width', '50%');
        $('#exportStats').text('Generating file...');
       
        if (format === 'excel') {
            generateExcel(data, includeSummary);
        } else {
            generateCSV(data, includeSummary);
        }
       
        $('#exportProgressBar').css('width', '100%');
        $('#exportStats').text('Export complete!');
       
        setTimeout(() => {
            hideExportPanel();
            hideButtonLoading(btnSelector);
        }, 1500);
       
        showAlert('Export completed successfully!', 'success');
       
    } catch (error) {
        console.error('Export error:', error);
        showAlert('Failed to export data', 'error');
        $('#exportProgress').hide();
        hideButtonLoading(btnSelector);
    }
}

async function fetchSelectedData(ids) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/transactions/export-selected',
            type: 'POST',
            data: {
                ids: ids,
                type: currentTab,
                _token: '{{ csrf_token() }}'
            },
            success: resolve,
            error: reject
        });
    });
}

async function fetchAllData(useFilters = false) {
    return new Promise((resolve, reject) => {
        const params = {
            type: currentTab,
            all: true
        };
       
        if (useFilters) {
            if (selectedStartDate && selectedEndDate) {
                params.start_date = selectedStartDate;
                params.end_date = selectedEndDate;
            }
            if (amountFilter) {
                params.amount = amountFilter;
            }
        }
       
        $.ajax({
            url: '/transactions/export-all',
            type: 'GET',
            data: params,
            success: resolve,
            error: reject
        });
    });
}

function generateExcel(data, includeSummary) {
    const wb = XLSX.utils.book_new();
    let worksheetData = [];
    const headers = ['S.No', 'Date', 'Type', 'Category', 'Amount (₹)', 'Description', 'Status'];
    worksheetData.push(headers);
   
    data.forEach((item, index) => {
        worksheetData.push([
            index + 1,
            item.date,
            item.type || (currentTab === 'income' ? 'Income' : 'Expense'),
            item.category_name || 'N/A',
            parseFloat(item.amount).toFixed(2),
            item.description || item.subcategory || item.created_by || 'N/A',
            item.status || (currentTab === 'income' ? 'Received' : 'Paid')
        ]);
    });
   
    if (includeSummary && data.length > 0) {
        worksheetData.push([]);
        worksheetData.push(['📊 SUMMARY']);
        worksheetData.push(['Total Records:', data.length]);
        const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        worksheetData.push(['Total Amount:', '₹' + totalAmount.toFixed(2)]);
        if (selectedStartDate && selectedEndDate) {
            worksheetData.push(['Date Range:', selectedStartDate + ' to ' + selectedEndDate]);
        }
        worksheetData.push(['Generated On:', new Date().toLocaleString()]);
        worksheetData.push(['Generated By:', '{{ auth()->user()->name }}']);
    }
   
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws['!cols'] = [{wch:8},{wch:12},{wch:10},{wch:20},{wch:15},{wch:25},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws, currentTab.charAt(0).toUpperCase() + currentTab.slice(1));
   
    const dateStr = moment().format('YYYY-MM-DD_HHmmss');
    XLSX.writeFile(wb, `${currentTab}_transactions_${dateStr}.xlsx`);
}

function generateCSV(data, includeSummary) {
    let csvContent = 'S.No,Date,Type,Category,Amount (₹),Description,Status\n';
   
    data.forEach((item, index) => {
        csvContent += `${index + 1},${item.date},${item.type || (currentTab === 'income' ? 'Income' : 'Expense')},${item.category_name || 'N/A'},${parseFloat(item.amount).toFixed(2)},${item.description || item.subcategory || item.created_by || 'N/A'},${item.status || (currentTab === 'income' ? 'Received' : 'Paid')}\n`;
    });
   
    if (includeSummary && data.length > 0) {
        csvContent += '\nSUMMARY\n';
        csvContent += `Total Records:,${data.length}\n`;
        const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        csvContent += `Total Amount:,₹${totalAmount.toFixed(2)}\n`;
        if (selectedStartDate && selectedEndDate) {
            csvContent += `Date Range:,${selectedStartDate} to ${selectedEndDate}\n`;
        }
        csvContent += `Generated On:,${new Date().toLocaleString()}\n`;
        csvContent += `Generated By:,{{ auth()->user()->name }}\n`;
    }
   
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = moment().format('YYYY-MM-DD_HHmmss');
    a.download = `${currentTab}_transactions_${dateStr}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ====================== SUBMIT FUNCTIONS WITH LOADING ======================

function submitIncome() {
    const btnSelector = '#addIncomeModal .btn-primary';
    showButtonLoading(btnSelector, 'Adding Income...');

    const formData = new FormData(document.getElementById('addIncomeForm'));
    formData.append('type', '1'); // TransactionType::Income

    $.ajax({
        url: '/transactions',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
        success: function(data) {
            hideButtonLoading(btnSelector);
            $('#addIncomeModal').modal('hide');
            showAlert('Income Added Successfully', 'success');
            document.getElementById('addIncomeForm').reset();
            refreshTable('income');
        },
        error: function(err) {
            hideButtonLoading(btnSelector);
            if (err.responseJSON && err.responseJSON.errors) {
                let errorMsg = '';
                Object.values(err.responseJSON.errors).forEach(fieldErrors => {
                    fieldErrors.forEach(msg => errorMsg += msg + '\n');
                });
                showAlert(errorMsg.trim() || 'Validation Error', 'error');
            } else {
                showAlert(err.responseJSON?.message || 'An unexpected error occurred.', 'error');
            }
        }
    });
}

function submitExpense() {
    const btnSelector = '#addExpenseModal .btn-primary';
    showButtonLoading(btnSelector, 'Adding Expense...');

    const form = document.getElementById('addExpenseForm');
    const formData = new FormData(form);
    formData.append('type', '2'); // TransactionType::Expense
    
    // Map subcategory text to description column
    const subcat = form.querySelector('[name="subcategory"]').value;
    formData.append('description', subcat);

    $.ajax({
        url: '/transactions',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
        success: function(data) {
            hideButtonLoading(btnSelector);
            $('#addExpenseModal').modal('hide');
            showAlert('Expense Added Successfully', 'success');
            document.getElementById('addExpenseForm').reset();
            refreshTable('expense');
        },
        error: function(err) {
            hideButtonLoading(btnSelector);
            if (err.responseJSON && err.responseJSON.errors) {
                let errorMsg = '';
                Object.values(err.responseJSON.errors).forEach(fieldErrors => {
                    fieldErrors.forEach(msg => errorMsg += msg + '\n');
                });
                showAlert(errorMsg.trim() || 'Validation Error', 'error');
            } else {
                showAlert(err.responseJSON?.message || 'An unexpected error occurred.', 'error');
            }
        }
    });
}

function editIncome(id) {
    $.ajax({
        url: `/transactions/${id}`,
        type: 'GET',
        success: function(response) {
            const data = response.transaction;
            $('#edit_income_id').val(data.id);
            $('#edit_income_date').val(data.date.split('T')[0]);
            $('#edit_income_type_select').val(data.income_type_id);
            $('#edit_income_created_by').val(data.created_by);
            $('#edit_income_amount').val(data.amount);
            $('#editIncomeModal').modal('show');
        },
        error: function() {
            showAlert('Failed to load income data.', 'error');
        }
    });
}

function updateIncome() {
    const btnSelector = '#editIncomeModal .btn-primary';
    showButtonLoading(btnSelector, 'Updating Income...');

    const id = $('#edit_income_id').val();
    const formData = new FormData(document.getElementById('editIncomeForm'));
    formData.append('_method', 'PUT');
    formData.append('type', '1');

    $.ajax({
        url: `/transactions/${id}`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
        success: function() {
            hideButtonLoading(btnSelector);
            $('#editIncomeModal').modal('hide');
            showAlert('Income Updated Successfully', 'success');
            refreshTable('income');
        },
        error: function(err) {
            hideButtonLoading(btnSelector);
            if (err.responseJSON && err.responseJSON.errors) {
                let errorMsg = '';
                Object.values(err.responseJSON.errors).forEach(fieldErrors => {
                    fieldErrors.forEach(msg => errorMsg += msg + '\n');
                });
                showAlert(errorMsg.trim() || 'Validation Error', 'error');
            } else {
                showAlert(err.responseJSON?.message || 'An unexpected error occurred.', 'error');
            }
        }
    });
}

function editExpense(id) {
    $.ajax({
        url: `/transactions/${id}`,
        type: 'GET',
        success: function(response) {
            const data = response.transaction;
            $('#edit_expense_id').val(data.id);
            $('#edit_expense_date').val(data.date.split('T')[0]);
            $('#edit_expense_type_select').val(data.expense_type_id);
            $('#edit_expense_subcategory').val(data.description);
            $('#edit_expense_created_by').val(data.created_by);
            $('#edit_expense_amount').val(data.amount);
            $('#editExpenseModal').modal('show');
        },
        error: function() {
            showAlert('Failed to load expense data.', 'error');
        }
    });
}

function updateExpense() {
    const btnSelector = '#editExpenseModal .btn-primary';
    showButtonLoading(btnSelector, 'Updating Expense...');

    const id = $('#edit_expense_id').val();
    const form = document.getElementById('editExpenseForm');
    const formData = new FormData(form);
    formData.append('_method', 'PUT');
    formData.append('type', '2');
    
    const subcat = form.querySelector('[name="subcategory"]').value;
    formData.append('description', subcat);

    $.ajax({
        url: `/transactions/${id}`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
        success: function() {
            hideButtonLoading(btnSelector);
            $('#editExpenseModal').modal('hide');
            showAlert('Expense Updated Successfully', 'success');
            refreshTable('expense');
        },
        error: function(err) {
            hideButtonLoading(btnSelector);
            if (err.responseJSON && err.responseJSON.errors) {
                let errorMsg = '';
                Object.values(err.responseJSON.errors).forEach(fieldErrors => {
                    fieldErrors.forEach(msg => errorMsg += msg + '\n');
                });
                showAlert(errorMsg.trim() || 'Validation Error', 'error');
            } else {
                showAlert(err.responseJSON?.message || 'An unexpected error occurred.', 'error');
            }
        }
    });
}

function addIncomeType() {
    const btnSelector = '#addIncomeTypeModal .btn-primary';
    showButtonLoading(btnSelector, 'Saving...');

    const name = $('#new_income_type_name').val().trim();
    if (!name) {
        hideButtonLoading(btnSelector);
        return showAlert('Type name is required.', 'error');
    }

    $.ajax({
        url: '/transaction-categories',
        type: 'POST',
        data: {name: name, type: 1, _token: '{{ csrf_token() }}'},
        success: function(response) {
            const data = response.category;
            hideButtonLoading(btnSelector);
            $('#income_type_select, #edit_income_type_select').append(`<option value="${data.id}">${data.name}</option>`);
            $('#addIncomeTypeModal').modal('hide');
            $('#new_income_type_name').val('');
            showAlert('Income Type Added Successfully', 'success');
        },
        error: function(err) {
            hideButtonLoading(btnSelector);
            showAlert(err.responseJSON?.message || 'Failed to add income type.', 'error');
        }
    });
}

function addExpenseType() {
    const btnSelector = '#addExpenseTypeModal .btn-primary';
    showButtonLoading(btnSelector, 'Saving...');

    const name = $('#new_expense_type_name').val().trim();
    if (!name) {
        hideButtonLoading(btnSelector);
        return showAlert('Type name is required.', 'error');
    }

    $.ajax({
        url: '/transaction-categories',
        type: 'POST',
        data: {name: name, type: 2, _token: '{{ csrf_token() }}'},
        success: function(response) {
            const data = response.category;
            hideButtonLoading(btnSelector);
            $('#expense_type_select, #edit_expense_type_select').append(`<option value="${data.id}">${data.name}</option>`);
            $('#addExpenseTypeModal').modal('hide');
            $('#new_expense_type_name').val('');
            showAlert('Expense Type Added Successfully', 'success');
        },
        error: function(err) {
            hideButtonLoading(btnSelector);
            showAlert(err.responseJSON?.message || 'Failed to add expense type.', 'error');
        }
    });
}

function deleteIncome(id) {
    $('#confirmDelete').off('click').on('click', function() {
        showButtonLoading('#confirmDelete', 'Deleting...');

        $.ajax({
            url: `/transactions/${id}`,
            type: 'DELETE',
            headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
            success: function() {
                hideButtonLoading('#confirmDelete');
                $('#delete_modal').modal('hide');
                showAlert('Income Deleted Successfully', 'success');
                selectedRowIds.delete(id);
                refreshTable('income');
            },
            error: function(xhr) {
                hideButtonLoading('#confirmDelete');
                const msg = xhr.responseJSON?.message || 'Failed to delete income.';
                showAlert(msg, 'error');
            }
        });
    });
    $('#delete_modal').modal('show');
}

function deleteExpense(id) {
    $('#confirmDelete').off('click').on('click', function() {
        showButtonLoading('#confirmDelete', 'Deleting...');

        $.ajax({
            url: `/transactions/${id}`,
            type: 'DELETE',
            headers: {'X-CSRF-TOKEN': '{{ csrf_token() }}'},
            success: function() {
                hideButtonLoading('#confirmDelete');
                $('#delete_modal').modal('hide');
                showAlert('Expense Deleted Successfully', 'success');
                selectedRowIds.delete(id);
                refreshTable('expense');
            },
            error: function(xhr) {
                hideButtonLoading('#confirmDelete');
                const msg = xhr.responseJSON?.message || 'Failed to delete expense.';
                showAlert(msg, 'error');
            }
        });
    });
    $('#delete_modal').modal('show');
}

function showAlert(msg, type = 'success') {
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