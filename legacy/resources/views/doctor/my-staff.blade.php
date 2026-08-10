@extends('layouts.layout-doctor')

@section('title', 'Doctor || Staff Management & Attendance')

@section('content')
<style>
/* Modern styling overrides */
.custom-pills {
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: #f8fafc !important;
    padding: 6px;
    border-radius: 12px;
}
.custom-pills .nav-link {
    color: #64748b;
    border: 1px solid transparent;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 0.95rem;
}
.custom-pills .nav-link.active {
    background-color: #0c4843 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 14px 0 rgba(12, 72, 67, 0.4);
    transform: translateY(-1px);
}
.custom-pills .nav-link:hover:not(.active) {
    color: #0c4843;
    background: rgba(12, 72, 67, 0.08);
}
.glass-card {
    background: #ffffff;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
}
.glass-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
}
.staff-avatar-initials {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 1.2rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.status-btn {
    border: 1px solid;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.2s ease;
    cursor: pointer;
    text-align: center;
    background: transparent;
    flex: 1;
}
.status-present {
    border-color: #10b981;
    color: #10b981;
}
.status-present:hover, .status-btn.active.status-present {
    background: #10b981 !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
.status-absent {
    border-color: #ef4444;
    color: #ef4444;
}
.status-absent:hover, .status-btn.active.status-absent {
    background: #ef4444 !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.status-halfday {
    border-color: #f59e0b;
    color: #f59e0b;
}
.status-halfday:hover, .status-btn.active.status-halfday {
    background: #f59e0b !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
.status-leave {
    border-color: #3b82f6;
    color: #3b82f6;
}
.status-leave:hover, .status-btn.active.status-leave {
    background: #3b82f6 !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.report-matrix {
    max-height: 550px;
    overflow-x: auto;
    overflow-y: auto;
}
.report-matrix table {
    min-width: 1200px;
}
.matrix-cell {
    width: 38px;
    height: 38px;
    text-align: center;
    vertical-align: middle;
    padding: 4px !important;
}
.matrix-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}
.matrix-dot:hover {
    transform: scale(1.15);
}
.matrix-dot.present {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
}
.matrix-dot.absent {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
}
.matrix-dot.half_day {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
}
.matrix-dot.leave {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
}
.matrix-dot.empty {
    background: #f1f5f9;
    color: #94a3b8;
}
.summary-card {
    border-radius: 12px;
    border: none;
    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}
.summary-card .icon-wrapper {
    width: 46px;
    height: 46px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
}
.bg-brand-light { background-color: rgba(12, 72, 67, 0.1); color: #0c4843; }
.bg-success-light { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.bg-danger-light { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.bg-warning-light { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.bg-info-light { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.staff-row {
    transition: background-color 0.2s ease;
}
.staff-row:hover {
    background-color: rgba(12, 72, 67, 0.04) !important;
}
.calendar-dot-clickable {
    cursor: pointer;
    transition: all 0.2s ease;
}
.calendar-dot-clickable:hover {
    transform: scale(1.2) !important;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15) !important;
    z-index: 10;
}
</style>

<div class="main-wrapper">
    <div class="page-wrapper">
        <div class="content">

            <!-- Title Header -->
            <div class="card shadow-sm mb-4">
                <div class="card-body py-3 d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="fw-bold text-primary mb-1">Staff Management & Attendance</h4>
                        <small class="text-muted">Manage staff profiles and track their attendance records.</small>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation & Action Button -->
            <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <ul class="nav nav-pills custom-pills d-inline-flex border" id="staffTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active px-4 py-2 fw-semibold d-flex align-items-center gap-2" 
                                id="directory-tab" data-bs-toggle="pill" data-bs-target="#directory" 
                                type="button" role="tab" aria-controls="directory" aria-selected="true">
                            <i class="ti ti-users"></i> Staff Directory
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link px-4 py-2 fw-semibold d-flex align-items-center gap-2" 
                                id="attendance-tab" data-bs-toggle="pill" data-bs-target="#attendance" 
                                type="button" role="tab" aria-controls="attendance" aria-selected="false">
                            <i class="ti ti-calendar-event"></i> Mark Attendance
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link px-4 py-2 fw-semibold d-flex align-items-center gap-2" 
                                id="reports-tab" data-bs-toggle="pill" data-bs-target="#reports" 
                                type="button" role="tab" aria-controls="reports" aria-selected="false">
                            <i class="ti ti-chart-bar"></i> Attendance Reports
                        </button>
                    </li>
                </ul>
                
                <button class="btn btn-primary px-4 py-2 fw-semibold shadow-sm" id="addStaffBtn" onclick="openStaffModal()">
                    <i class="ti ti-plus me-1"></i> Add Staff
                </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content" id="staffTabsContent">
                
                <!-- Tab 1: Staff Directory -->
                <div class="tab-pane fade show active" id="directory" role="tabpanel" aria-labelledby="directory-tab">
                    <div class="card shadow-sm border-0">
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle table-hover mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="ps-4">Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Role</th>
                                            <th width="150" class="pe-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @forelse($staffMembers as $staff)
                                        <tr class="staff-row" data-id="{{ $staff->id }}" data-name="{{ $staff->name }}" data-email="{{ $staff->email }}" data-phone="{{ $staff->phone ?? 'N/A' }}" data-role="{{ $staff->roles->first()->name ?? 'No Role' }}" data-joined="{{ $staff->created_at ? $staff->created_at->format('d M Y') : 'N/A' }}" style="cursor: pointer;">
                                            <td class="ps-4">
                                                <div class="d-flex align-items-center gap-3">
                                                    <div class="staff-avatar-initials" style="background: linear-gradient(135deg, #0c4843, #0b727f)">
                                                        {{ strtoupper(substr($staff->name, 0, 1)) }}
                                                    </div>
                                                    <div>
                                                        <strong class="text-dark">{{ $staff->name }}</strong>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{{ $staff->email }}</td>
                                            <td>{{ $staff->phone ?? 'N/A' }}</td>
                                            <td>
                                                @foreach($staff->roles as $role)
                                                    <span class="badge bg-brand-light px-2 py-1.5">{{ $role->name }}</span>
                                                @endforeach
                                                @if($staff->roles->isEmpty())
                                                    <span class="badge bg-secondary px-2 py-1.5">No Role</span>
                                                @endif
                                            </td>
                                            <td class="pe-4">
                                                <button class="btn btn-sm btn-outline-primary me-1" 
                                                    onclick="editStaff({{ $staff->id }}, '{{ $staff->name }}', '{{ $staff->email }}', '{{ $staff->phone }}', '{{ $staff->roles->first()->name ?? '' }}')">
                                                    <i class="ti ti-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" 
                                                    onclick="deleteStaff({{ $staff->id }})">
                                                    <i class="ti ti-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        @empty
                                        <tr>
                                            <td colspan="5" class="text-center py-5 text-muted">No staff members found. Add some using the button above.</td>
                                        </tr>
                                        @endforelse
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 2: Mark Attendance -->
                <div class="tab-pane fade" id="attendance" role="tabpanel" aria-labelledby="attendance-tab">
                    <!-- Date Selection Filter -->
                    <div class="card shadow-sm mb-4 border-0">
                        <div class="card-body d-flex align-items-center gap-3 flex-wrap py-3">
                            <div class="d-flex align-items-center gap-2">
                                <label for="attendanceDate" class="form-label mb-0 fw-semibold text-muted text-nowrap">Select Date:</label>
                                <input type="date" class="form-control form-control-sm" id="attendanceDate" value="{{ date('Y-m-d') }}" max="{{ date('Y-m-d') }}" style="max-width: 180px;">
                            </div>
                            <button class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" onclick="setAttendanceToday()">
                                <i class="ti ti-calendar"></i> Set Today
                            </button>
                            <span class="text-muted ms-2 d-none d-md-inline">|</span>
                            <div class="small text-muted" id="markedCounter">Loading staff details...</div>
                        </div>
                    </div>

                    <!-- Attendance Marking Grid -->
                    <div id="attendanceGrid" class="row g-4">
                        <!-- Loaded dynamically via JS -->
                    </div>

                    <!-- Actions -->
                    <div class="d-flex justify-content-end mt-4 p-2 bg-light rounded-3 border">
                        <button class="btn btn-primary px-5 py-2.5 fw-bold d-flex align-items-center gap-2" id="saveAttendanceBtn" onclick="saveMarkedAttendance()">
                            <i class="ti ti-device-floppy"></i> Save All Attendance
                        </button>
                    </div>
                </div>

                <!-- Tab 3: Attendance Reports -->
                <div class="tab-pane fade" id="reports" role="tabpanel" aria-labelledby="reports-tab">
                    <!-- Filters -->
                    <div class="card shadow-sm mb-4 border-0">
                        <div class="card-body py-3">
                            <div class="row g-3 align-items-end">
                                <div class="col-md-3">
                                    <label class="form-label fw-semibold text-muted small">Select Month</label>
                                    <select class="form-select form-select-sm" id="filterMonth">
                                        @for ($m = 1; $m <= 12; $m++)
                                            <option value="{{ $m }}" {{ $m == date('n') ? 'selected' : '' }}>
                                                {{ date('F', mktime(0, 0, 0, $m, 1)) }}
                                            </option>
                                        @endfor
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label fw-semibold text-muted small">Select Year</label>
                                    <select class="form-select form-select-sm" id="filterYear">
                                        @for ($y = date('Y') - 1; $y <= date('Y') + 1; $y++)
                                            <option value="{{ $y }}" {{ $y == date('Y') ? 'selected' : '' }}>
                                                {{ $y }}
                                            </option>
                                        @endfor
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-semibold text-muted small">Filter by Staff Member</label>
                                    <select class="form-select form-select-sm" id="filterStaff">
                                        <option value="">All Staff Members</option>
                                        @foreach($staffMembers as $staff)
                                            <option value="{{ $staff->id }}">{{ $staff->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <button class="btn btn-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold" onclick="loadAttendanceReport()">
                                        <i class="ti ti-filter"></i> Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Statistics Summary row -->
                    <div class="row g-3 mb-4" id="reportSummaryContainer">
                        <!-- Loaded dynamically via JS -->
                    </div>

                    <!-- Report Table/Matrix -->
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                            <h6 class="card-title mb-0 fw-bold text-dark"><i class="ti ti-grid-dots me-1 text-primary"></i>Monthly Status Matrix</h6>
                            <div class="d-flex gap-2 text-muted small flex-wrap">
                                <div><span class="badge bg-success-light px-2 py-1">P</span> Present</div>
                                <div><span class="badge bg-danger-light px-2 py-1">A</span> Absent</div>
                                <div><span class="badge bg-warning-light px-2 py-1">H</span> Half Day</div>
                                <div><span class="badge bg-info-light px-2 py-1">L</span> Leave</div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive report-matrix">
                                <table class="table align-middle table-hover mb-0 text-center" id="matrixTable">
                                    <!-- Dynamic content -->
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    </div>
</div>

<!-- Add/Edit Staff Modal (Preserved original modal) -->
<div class="modal fade" id="staffModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow-lg">
            <form id="staffForm" onsubmit="saveStaff(event)">
                <div class="modal-header bg-light">
                    <h5 class="modal-title fw-bold" id="staffModalTitle">Add Staff</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="staffId">
                    
                    <div class="mb-3">
                        <label class="form-label fw-semibold small text-muted">Full Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="staffName" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-semibold small text-muted">Email <span class="text-danger">*</span></label>
                        <input type="email" class="form-control" id="staffEmail" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold small text-muted">Phone Number</label>
                        <input type="text" class="form-control" id="staffPhone">
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold small text-muted">Password <span class="text-danger auth-required">*</span></label>
                        <input type="password" class="form-control" id="staffPassword" minlength="8">
                        <small class="text-muted edit-hint d-none">Leave blank to keep current password</small>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold small text-muted">Assign Role <span class="text-danger">*</span></label>
                        <select class="form-select" id="staffRole" required>
                            <option value="">Select Role</option>
                            @foreach($roles as $role)
                                <option value="{{ $role->name }}">{{ $role->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary px-4">Save Staff</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Staff Details Modal -->
<div class="modal fade" id="staffDetailsModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg overflow-hidden">
            <!-- Header with Gradient Background -->
            <div class="modal-header border-0 text-white p-4" style="background: linear-gradient(135deg, #0c4843, #0b727f); position: relative;">
                <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
                <div class="d-flex align-items-center gap-4 w-100 mt-2">
                    <div id="detailStaffAvatar" class="staff-avatar-initials fs-1 shadow-sm border border-2 border-white-50" style="width: 72px; height: 72px; font-weight: 700;">
                        JD
                    </div>
                    <div>
                        <h4 id="detailStaffName" class="fw-bold mb-1 text-white">John Doe</h4>
                        <span id="detailStaffRole" class="badge bg-white text-dark px-3 py-2 fw-semibold fs-13 shadow-sm">Receptionist</span>
                    </div>
                </div>
            </div>
            
            <div class="modal-body p-4 bg-light">
                <div class="row g-4">
                    <!-- Column 1: Info Cards -->
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm rounded-3 h-100">
                            <div class="card-body p-4">
                                <h6 class="fw-bold text-primary mb-3 border-bottom pb-2">
                                    <i class="ti ti-id me-1"></i> Personal Profile
                                </h6>
                                <div class="mb-3">
                                    <label class="text-muted small fw-semibold d-block mb-1">Email Address</label>
                                    <div class="fw-bold text-dark" id="detailStaffEmail">john.doe@example.com</div>
                                </div>
                                <div class="mb-3">
                                    <label class="text-muted small fw-semibold d-block mb-1">Phone Number</label>
                                    <div class="fw-bold text-dark" id="detailStaffPhone">+1234567890</div>
                                </div>
                                <div class="mb-3">
                                    <label class="text-muted small fw-semibold d-block mb-1">System Base Role</label>
                                    <div class="fw-bold text-dark"><span class="badge bg-brand-light">Receptionist</span></div>
                                </div>
                                <div class="mb-0">
                                    <label class="text-muted small fw-semibold d-block mb-1">Date Joined</label>
                                    <div class="fw-bold text-dark" id="detailStaffJoined">15 May 2026</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Column 2: Attendance Stats -->
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm rounded-3 h-100">
                            <div class="card-body p-4 d-flex flex-column justify-content-between">
                                <div>
                                    <h6 class="fw-bold text-success mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
                                        <span><i class="ti ti-chart-pie me-1"></i> Attendance Stats</span>
                                        <span class="small text-muted font-monospace" id="detailAttendanceMonth">June 2026</span>
                                    </h6>
                                    
                                    <div id="detailStatsLoading" class="text-center py-4">
                                        <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                                        <span class="ms-2 text-muted small">Loading summary...</span>
                                    </div>
                                    
                                    <div id="detailStatsContainer" style="display: none;">
                                        <div class="row g-2 mb-3">
                                            <div class="col-6">
                                                <div class="p-2 border rounded text-center bg-success-light">
                                                    <span class="d-block small text-muted">Present</span>
                                                    <h5 class="fw-bold mb-0 text-success" id="statPresent">0</h5>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="p-2 border rounded text-center bg-danger-light">
                                                    <span class="d-block small text-muted">Absent</span>
                                                    <h5 class="fw-bold mb-0 text-danger" id="statAbsent">0</h5>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="p-2 border rounded text-center bg-warning-light">
                                                    <span class="d-block small text-muted">Half Day</span>
                                                    <h5 class="fw-bold mb-0 text-warning" id="statHalfDay">0</h5>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="p-2 border rounded text-center bg-info-light">
                                                    <span class="d-block small text-muted">Leave</span>
                                                    <h5 class="fw-bold mb-0 text-primary" id="statLeave">0</h5>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Progress bar -->
                                        <div>
                                            <div class="d-flex justify-content-between align-items-center mb-1">
                                                <span class="small text-muted fw-semibold">Attendance Rate</span>
                                                <span class="small fw-bold text-dark" id="statRate">0%</span>
                                            </div>
                                            <div class="progress" style="height: 8px;">
                                                <div id="statProgressBar" class="progress-bar bg-success" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Detailed log calendar section -->
                <div class="card border-0 shadow-sm rounded-3 mt-4">
                    <div class="card-body p-4">
                        <h6 class="fw-bold text-dark mb-3 border-bottom pb-2">
                            <i class="ti ti-calendar me-1 text-primary"></i> Attendance Sheet (This Month)
                        </h6>
                        <div id="detailCalendarLoading" class="text-center py-4">
                            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                            <span class="ms-2 text-muted small">Loading log history...</span>
                        </div>
                        <div class="d-flex flex-wrap gap-2 justify-content-start" id="detailCalendarContainer" style="display: none;">
                            <!-- Dots filled via JS -->
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer bg-light border-top-0 p-3">
                <button type="button" class="btn btn-outline-secondary px-4 fw-semibold" data-bs-dismiss="modal">Close Details</button>
            </div>
        </div>
    </div>
</div>

<!-- Quick Attendance Update Modal -->
<div class="modal fade" id="quickAttendanceModal" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header bg-light border-0 py-3">
                <h6 class="modal-title fw-bold text-dark"><i class="ti ti-calendar-event me-1 text-primary"></i> Update Attendance</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3 text-center">
                    <span class="badge bg-brand-light text-primary px-3 py-1.5 fw-semibold" id="quickAttDateLabel">05 June 2026</span>
                </div>
                
                <input type="hidden" id="quickAttStaffId">
                <input type="hidden" id="quickAttDate">
                
                <!-- Status Buttons -->
                <label class="form-label small fw-semibold text-muted d-block text-center mb-2">Select Status</label>
                <div class="d-flex justify-content-between gap-2 mb-4">
                    <button type="button" class="status-btn status-present py-2" onclick="selectQuickStatus('present')">P</button>
                    <button type="button" class="status-btn status-absent py-2" onclick="selectQuickStatus('absent')">A</button>
                    <button type="button" class="status-btn status-halfday py-2" onclick="selectQuickStatus('half_day')">H</button>
                    <button type="button" class="status-btn status-leave py-2" onclick="selectQuickStatus('leave')">L</button>
                </div>
                
                <!-- Time inputs -->
                <div id="quickAttTimePanel" style="display: none;">
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <label class="small text-muted fw-semibold mb-1">Check-in</label>
                            <input type="time" class="form-control form-control-sm" id="quickAttCheckIn" value="09:00">
                        </div>
                        <div class="col-6">
                            <label class="small text-muted fw-semibold mb-1">Check-out</label>
                            <input type="time" class="form-control form-control-sm" id="quickAttCheckOut" value="18:00">
                        </div>
                    </div>
                </div>
                
                <!-- Notes -->
                <div class="mb-3">
                    <label class="small text-muted fw-semibold mb-1" id="quickAttNotesLabel">Notes</label>
                    <input type="text" class="form-control form-control-sm" id="quickAttNotes" placeholder="Add optional details...">
                </div>
            </div>
            <div class="modal-footer bg-light border-0 py-2">
                <button type="button" class="btn btn-sm btn-outline-secondary px-3" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-sm btn-primary px-4 fw-bold" id="saveQuickAttBtn" onclick="saveQuickAttendance()">Save Changes</button>
            </div>
        </div>
    </div>
</div>

<script>
// Tab changes visibility logic for "Add Staff" button
document.addEventListener('DOMContentLoaded', function () {
    const triggerTabList = [].slice.call(document.querySelectorAll('#staffTabs button'));
    triggerTabList.forEach(function (triggerEl) {
        const tabTrigger = new bootstrap.Tab(triggerEl);
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();
        });
    });

    $('button[data-bs-toggle="pill"]').on('shown.bs.tab', function (e) {
        if (e.target.id === 'directory-tab') {
            $('#addStaffBtn').show();
        } else {
            $('#addStaffBtn').hide();
        }
        
        // Lazy load views when tab switches
        if (e.target.id === 'attendance-tab') {
            loadAttendanceData();
        } else if (e.target.id === 'reports-tab') {
            loadAttendanceReport();
        }
    });

    // Handle date change in attendance marker
    $('#attendanceDate').on('change', function() {
        loadAttendanceData();
    });

    // Make staff table rows clickable (excluding actions column)
    $(document).on('click', '.staff-row', function(e) {
        if ($(e.target).closest('button, a, input, select, .btn').length) {
            return;
        }
        
        const staffId = $(this).data('id');
        const name = $(this).data('name');
        const email = $(this).data('email');
        const phone = $(this).data('phone');
        const role = $(this).data('role');
        const joined = $(this).data('joined');
        
        showStaffDetails(staffId, name, email, phone, role, joined);
    });

    // Make calendar dots clickable inside the details modal
    $(document).on('click', '.calendar-dot-clickable', function() {
        // Hide existing tooltip for this dot
        const tooltip = bootstrap.Tooltip.getInstance(this);
        if (tooltip) tooltip.hide();

        const staffId = $('#staffDetailsModal').data('staff-id');
        const day = $(this).data('day');
        const dateStr = $(this).data('date');
        const status = $(this).data('status');
        const checkin = $(this).data('checkin');
        const checkout = $(this).data('checkout');
        const notes = $(this).data('notes');
        
        // Format date label
        const dateObj = new Date(dateStr);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const dateLabel = dateObj.toLocaleDateString('en-US', options);
        
        // Set form fields
        $('#quickAttStaffId').val(staffId);
        $('#quickAttDate').val(dateStr);
        $('#quickAttDateLabel').text(dateLabel);
        $('#quickAttCheckIn').val(checkin || '09:00');
        $('#quickAttCheckOut').val(checkout || '18:00');
        $('#quickAttNotes').val(notes || '');
        
        // Select status button
        selectQuickStatus(status);
        
        // Show modal
        $('#quickAttendanceModal').modal('show');
    });

    // Handle nested modal backdrops
    $(document).on('show.bs.modal', '#quickAttendanceModal', function () {
        setTimeout(function() {
            $('.modal-backdrop').last().css('z-index', 1059);
        }, 0);
    });
    
    $(document).on('hidden.bs.modal', '#quickAttendanceModal', function () {
        if ($('#staffDetailsModal').hasClass('show')) {
            $('body').addClass('modal-open');
        }
    });
});

// Original Modal open/edit functions
function openStaffModal() {
    $('#staffForm')[0].reset();
    $('#staffId').val('');
    $('#staffModalTitle').text('Add Staff');
    $('.auth-required').show();
    $('#staffPassword').attr('required', true);
    $('.edit-hint').addClass('d-none');
    $('#staffModal').modal('show');
}

function editStaff(id, name, email, phone, role) {
    $('#staffId').val(id);
    $('#staffName').val(name);
    $('#staffEmail').val(email);
    $('#staffPhone').val(phone);
    $('#staffRole').val(role);
    
    $('#staffModalTitle').text('Edit Staff');
    $('.auth-required').hide();
    $('#staffPassword').removeAttr('required').val('');
    $('.edit-hint').removeClass('d-none');
    
    $('#staffModal').modal('show');
}

function saveStaff(e) {
    e.preventDefault();
    
    const id = $('#staffId').val();
    const isEdit = !!id;
    const url = isEdit ? `{{ url('my-staff') }}/${id}` : `{{ url('my-staff') }}`;
    const method = isEdit ? 'PUT' : 'POST';
    
    const data = {
        name: $('#staffName').val(),
        email: $('#staffEmail').val(),
        phone: $('#staffPhone').val(),
        role_name: $('#staffRole').val(),
        password: $('#staffPassword').val(),
        _token: '{{ csrf_token() }}'
    };

    $.ajax({
        url: url,
        method: method,
        data: data,
        success: function(res) {
            if(res.success) {
                Swal.fire({
                    title: 'Success!',
                    text: isEdit ? 'Staff updated successfully.' : 'Staff added successfully.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    location.reload();
                });
            } else {
                Swal.fire('Error!', res.message, 'error');
            }
        },
        error: function(err) {
            let errorMsg = 'An error occurred';
            if (err.responseJSON && err.responseJSON.message) {
                errorMsg = err.responseJSON.message;
            }
            Swal.fire('Error!', errorMsg, 'error');
        }
    });
}

function deleteStaff(id) {
    Swal.fire({
        title: 'Remove Staff?',
        text: "Are you sure you want to remove this staff member?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6e7d88',
        confirmButtonText: 'Yes, remove them!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `{{ url('my-staff') }}/${id}`,
                method: 'DELETE',
                data: { _token: '{{ csrf_token() }}' },
                success: function(res) {
                    if(res.success) {
                        Swal.fire({
                            title: 'Removed!',
                            text: 'Staff member has been removed.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            location.reload();
                        });
                    } else {
                        Swal.fire('Error!', res.message, 'error');
                    }
                }
            });
        }
    });
}

function showStaffDetails(id, name, email, phone, role, joined) {
    $('#staffDetailsModal').data('staff-id', id);
    // Set static text
    $('#detailStaffName').text(name);
    $('#detailStaffEmail').text(email);
    $('#detailStaffPhone').text(phone);
    $('#detailStaffRole').text(role);
    $('#detailStaffJoined').text(joined);
    
    // Set avatar
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarBg = getAvatarColor(id);
    $('#detailStaffAvatar').text(initials).css('background', avatarBg);
    
    // Set current month/year text
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[now.getMonth()];
    const year = now.getFullYear();
    $('#detailAttendanceMonth').text(`${monthName} ${year}`);
    
    // Reset loading states
    $('#detailStatsLoading').show();
    $('#detailStatsContainer').hide();
    $('#detailCalendarLoading').show();
    $('#detailCalendarContainer').hide().empty();
    
    // Open the modal
    $('#staffDetailsModal').modal('show');
    
    // Fetch detailed stats via AJAX
    $.ajax({
        url: `{{ route('my-staff.attendance.report') }}`,
        method: 'GET',
        data: {
            month: now.getMonth() + 1,
            year: year,
            staff_id: id
        },
        success: function(res) {
            if (res.success && res.data.report && res.data.report.length > 0) {
                const staffData = res.data.report[0];
                const summary = staffData.summary;
                
                // Update stats
                $('#statPresent').text(summary.present);
                $('#statAbsent').text(summary.absent);
                $('#statHalfDay').text(summary.half_day);
                $('#statLeave').text(summary.leave);
                
                // Attendance percentage
                let presenceRate = 0;
                if (summary.total_marked > 0) {
                    presenceRate = Math.round(((summary.present + (summary.half_day * 0.5)) / summary.total_marked) * 100);
                }
                $('#statRate').text(`${presenceRate}%`);
                $('#statProgressBar').css('width', `${presenceRate}%`).attr('aria-valuenow', presenceRate);
                
                // Render calendar dots
                const calendarContainer = $('#detailCalendarContainer');
                const daysInMonth = res.data.days_in_month;
                
                for (let d = 1; d <= daysInMonth; d++) {
                    const dayRecord = staffData.days[d];
                    let dotClass = 'empty';
                    let letter = '-';
                    let title = `Day ${d}: No attendance marked`;
                    
                    if (dayRecord) {
                        const status = dayRecord.status;
                        if (status === 'present') {
                            dotClass = 'present';
                            letter = 'P';
                            title = `Day ${d}: Present`;
                        } else if (status === 'absent') {
                            dotClass = 'absent';
                            letter = 'A';
                            title = `Day ${d}: Absent`;
                        } else if (status === 'half_day') {
                            dotClass = 'half_day';
                            letter = 'H';
                            title = `Day ${d}: Half Day`;
                        } else if (status === 'leave') {
                            dotClass = 'leave';
                            letter = 'L';
                            title = `Day ${d}: Approved Leave`;
                        }
                        
                        if (dayRecord.check_in || dayRecord.check_out) {
                            title += `\nTime: ${dayRecord.check_in || '--:--'} - ${dayRecord.check_out || '--:--'}`;
                        }
                        if (dayRecord.notes) {
                            title += `\nNotes: ${dayRecord.notes}`;
                        }
                    }
                    
                    const dotHtml = `<span class="matrix-dot ${dotClass} calendar-dot-clickable" 
                                           style="width: 34px; height: 34px; font-size: 11px; margin: 2px; cursor: pointer;"
                                           data-day="${d}"
                                           data-date="${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}"
                                           data-status="${dayRecord ? dayRecord.status : ''}"
                                           data-checkin="${dayRecord ? dayRecord.check_in || '09:00' : '09:00'}"
                                           data-checkout="${dayRecord ? dayRecord.check_out || '18:00' : '18:00'}"
                                           data-notes="${dayRecord ? dayRecord.notes || '' : ''}"
                                           data-bs-toggle="tooltip" 
                                           data-bs-placement="top" 
                                           title="${title.replace(/"/g, '&quot;')}">
                                        ${letter}
                                     </span>`;
                    calendarContainer.append(dotHtml);
                }
                
                // Initialize tooltips in the details modal
                var tooltipTriggerList = [].slice.call(calendarContainer[0].querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.forEach(function (tooltipTriggerEl) {
                    new bootstrap.Tooltip(tooltipTriggerEl);
                });
                
                // Hide loading indicators, show content
                $('#detailStatsLoading').hide();
                $('#detailStatsContainer').fadeIn();
                $('#detailCalendarLoading').hide();
                $('#detailCalendarContainer').fadeIn();
            } else {
                $('#detailStatsLoading').hide();
                $('#detailStatsContainer').html('<div class="text-center text-muted small">No attendance data found for this month.</div>').show();
                $('#detailCalendarLoading').hide();
                $('#detailCalendarContainer').html('<div class="text-center text-muted small w-100">No logs marked.</div>').show();
            }
        },
        error: function() {
            $('#detailStatsLoading').hide();
            $('#detailStatsContainer').html('<div class="text-center text-danger small">Failed to load statistics.</div>').show();
            $('#detailCalendarLoading').hide();
            $('#detailCalendarContainer').html('<div class="text-center text-danger small w-100">Failed to load logs.</div>').show();
        }
    });
}

let selectedQuickStatus = '';

function selectQuickStatus(status) {
    selectedQuickStatus = status;
    const modal = $('#quickAttendanceModal');
    
    // Clear active status on buttons
    modal.find('.status-btn').removeClass('active');
    
    if (status) {
        modal.find(`.status-${status.replace('_', '')}`).addClass('active');
    }
    
    // Show/hide time panel
    if (status === 'present' || status === 'half_day') {
        $('#quickAttTimePanel').slideDown(200);
    } else {
        $('#quickAttTimePanel').slideUp(200);
    }
    
    // Set notes placeholder
    const notesInput = $('#quickAttNotes');
    if (status === 'leave') {
        notesInput.attr('placeholder', 'Reason for leave...');
        $('#quickAttNotesLabel').text('Reason for Leave');
    } else if (status === 'absent') {
        notesInput.attr('placeholder', 'Absent explanation...');
        $('#quickAttNotesLabel').text('Absent Explanation');
    } else {
        notesInput.attr('placeholder', 'Add optional notes...');
        $('#quickAttNotesLabel').text('Notes');
    }
}

function saveQuickAttendance() {
    const staffId = $('#quickAttStaffId').val();
    const date = $('#quickAttDate').val();
    const status = selectedQuickStatus;
    
    if (!status) {
        Swal.fire({
            title: 'Select Status!',
            text: 'Please select a status (P, A, H, or L) before saving.',
            icon: 'warning',
            confirmButtonColor: '#0c4843'
        });
        return;
    }
    
    const checkIn = $('#quickAttCheckIn').val() || null;
    const checkOut = $('#quickAttCheckOut').val() || null;
    const notes = $('#quickAttNotes').val() || null;
    
    const btn = $('#saveQuickAttBtn');
    btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');
    
    $.ajax({
        url: `{{ route('my-staff.attendance.save') }}`,
        method: 'POST',
        data: {
            _token: '{{ csrf_token() }}',
            date: date,
            attendance: [{
                staff_id: staffId,
                status: status,
                check_in: status === 'present' || status === 'half_day' ? checkIn : null,
                check_out: status === 'present' || status === 'half_day' ? checkOut : null,
                notes: notes
            }]
        },
        success: function(res) {
            btn.prop('disabled', false).html('Save Changes');
            if (res.success) {
                // Close quick modal
                $('#quickAttendanceModal').modal('hide');
                
                // Show success toast
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Attendance updated successfully.',
                    showConfirmButton: false,
                    timer: 2000
                });
                
                // Refresh details modal data dynamically!
                const name = $('#detailStaffName').text();
                const email = $('#detailStaffEmail').text();
                const phone = $('#detailStaffPhone').text();
                const role = $('#detailStaffRole').text();
                const joined = $('#detailStaffJoined').text();
                showStaffDetails(staffId, name, email, phone, role, joined);
                
                // If reports tab is loaded, reload it in the background
                if ($('#reports-tab').hasClass('active')) {
                    loadAttendanceReport();
                }
                // If attendance tab is loaded, reload it in the background
                if ($('#attendance-tab').hasClass('active')) {
                    loadAttendanceData();
                }
            } else {
                Swal.fire('Error!', res.message, 'error');
            }
        },
        error: function() {
            btn.prop('disabled', false).html('Save Changes');
            Swal.fire('Error!', 'An error occurred while saving attendance.', 'error');
        }
    });
}

// -------------------------------------------------------------
// NEW ATTENDANCE MODULE SCRIPTS
// -------------------------------------------------------------
const AVATAR_COLORS = [
    'linear-gradient(135deg, #10b981, #059669)', // Emerald
    'linear-gradient(135deg, #3b82f6, #2563eb)', // Blue
    'linear-gradient(135deg, #0c4843, #0b727f)', // Brand Teal/Dark
    'linear-gradient(135deg, #f59e0b, #d97706)', // Amber
    'linear-gradient(135deg, #ef4444, #dc2626)', // Red
    'linear-gradient(135deg, #ec4899, #db2777)'  // Pink
];

function getAvatarColor(id) {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function setAttendanceToday() {
    const today = new Date().toISOString().split('T')[0];
    $('#attendanceDate').val(today).trigger('change');
}

// Fetch staff details & daily attendance records
function loadAttendanceData() {
    const date = $('#attendanceDate').val();
    $('#attendanceGrid').html(`
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <div class="mt-2 text-muted">Fetching staff and attendance logs...</div>
        </div>
    `);

    $.ajax({
        url: `{{ route('my-staff.attendance.data') }}`,
        method: 'GET',
        data: { date: date },
        success: function(res) {
            if (res.success) {
                renderAttendanceCards(res.data);
            } else {
                $('#attendanceGrid').html(`<div class="col-12 text-center text-danger py-4">Failed to fetch data: ${res.message}</div>`);
            }
        },
        error: function() {
            $('#attendanceGrid').html('<div class="col-12 text-center text-danger py-4">An error occurred while loading attendance.</div>');
        }
    });
}

// Dynamically render staff attendance cards
function renderAttendanceCards(staffList) {
    const grid = $('#attendanceGrid');
    grid.empty();
    
    if (staffList.length === 0) {
        grid.html(`
            <div class="col-12 text-center py-5">
                <i class="ti ti-users text-muted" style="font-size: 3rem;"></i>
                <h5 class="mt-3 text-dark fw-semibold">No staff found</h5>
                <p class="text-muted small">Add staff members in the Directory tab to manage their attendance.</p>
            </div>
        `);
        $('#markedCounter').text('No staff registered.');
        return;
    }

    let markedCount = 0;

    staffList.forEach(staff => {
        const hasAtt = !!staff.attendance;
        const status = hasAtt ? staff.attendance.status : '';
        const checkIn = hasAtt && staff.attendance.check_in ? staff.attendance.check_in : '09:00';
        const checkOut = hasAtt && staff.attendance.check_out ? staff.attendance.check_out : '18:00';
        const notes = hasAtt && staff.attendance.notes ? staff.attendance.notes : '';

        if (hasAtt) markedCount++;

        const initials = staff.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        const avatarBg = getAvatarColor(staff.id);
        
        const cardHtml = `
            <div class="col-lg-6 col-xl-4 staff-att-card" data-staff-id="${staff.id}">
                <div class="card glass-card h-100 border-0">
                    <div class="card-body d-flex flex-column justify-content-between p-4">
                        
                        <!-- Staff Info Header -->
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div class="staff-avatar-initials" style="background: ${avatarBg}">
                                ${initials}
                            </div>
                            <div>
                                <h6 class="fw-bold mb-0 text-dark">${staff.name}</h6>
                                <span class="badge bg-light text-secondary border px-2 py-1 mt-1">${staff.role}</span>
                            </div>
                        </div>

                        <!-- Status Selector Buttons -->
                        <div class="d-flex justify-content-between gap-2 mb-3 mt-1">
                            <button type="button" class="status-btn status-present ${status === 'present' ? 'active' : ''}" 
                                onclick="selectStatus(${staff.id}, 'present')">P</button>
                            <button type="button" class="status-btn status-absent ${status === 'absent' ? 'active' : ''}" 
                                onclick="selectStatus(${staff.id}, 'absent')">A</button>
                            <button type="button" class="status-btn status-halfday ${status === 'half_day' ? 'active' : ''}" 
                                onclick="selectStatus(${staff.id}, 'half_day')">H</button>
                            <button type="button" class="status-btn status-leave ${status === 'leave' ? 'active' : ''}" 
                                onclick="selectStatus(${staff.id}, 'leave')">L</button>
                        </div>

                        <!-- Check-in / Out & Notes fields (visible conditionally) -->
                        <div class="attendance-details-panel-${staff.id}" style="display: ${status === 'present' || status === 'half_day' ? 'block' : 'none'};">
                            <div class="row g-2 mb-2">
                                <div class="col-6">
                                    <label class="small text-muted fw-semibold mb-1">Check-in</label>
                                    <input type="time" class="form-control form-control-sm check-in-input" value="${checkIn}">
                                </div>
                                <div class="col-6">
                                    <label class="small text-muted fw-semibold mb-1">Check-out</label>
                                    <input type="time" class="form-control form-control-sm check-out-input" value="${checkOut}">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Notes / Leave reason (Always toggleable) -->
                        <div class="mt-2">
                            <input type="text" class="form-control form-control-sm notes-input" 
                                placeholder="${status === 'leave' ? 'Reason for leave...' : 'Add notes (e.g. late arrival)...'}" 
                                value="${notes}">
                        </div>

                    </div>
                </div>
            </div>
        `;
        grid.append(cardHtml);
    });

    $('#markedCounter').html(`
        <span class="badge bg-success-light text-success px-2.5 py-1.5 fw-bold">${markedCount} / ${staffList.length} Marked</span>
    `);
}

// Click listener to toggle active statuses on buttons
function selectStatus(staffId, status) {
    const card = $(`.staff-att-card[data-staff-id="${staffId}"]`);
    
    // Toggle active classes on buttons
    card.find('.status-btn').removeClass('active');
    card.find(`.status-${status.replace('_', '')}`).addClass('active');

    // Show check-in/out panel for present/half_day, hide otherwise
    const panel = card.find(`.attendance-details-panel-${staffId}`);
    if (status === 'present' || status === 'half_day') {
        panel.slideDown(200);
    } else {
        panel.slideUp(200);
    }

    // Dynamic placeholder for notes
    const notesInput = card.find('.notes-input');
    if (status === 'leave') {
        notesInput.attr('placeholder', 'Reason for leave...');
    } else if (status === 'absent') {
        notesInput.attr('placeholder', 'Absent explanation...');
    } else {
        notesInput.attr('placeholder', 'Add notes (e.g. late arrival)...');
    }
}

// Collect marking results and post to DB
function saveMarkedAttendance() {
    const date = $('#attendanceDate').val();
    const btn = $('#saveAttendanceBtn');
    
    const attendance = [];
    let allMarked = true;

    $('.staff-att-card').each(function() {
        const staffId = $(this).data('staff-id');
        const activeBtn = $(this).find('.status-btn.active');
        
        if (activeBtn.length === 0) {
            allMarked = false;
            return;
        }

        let status = '';
        if (activeBtn.hasClass('status-present')) status = 'present';
        else if (activeBtn.hasClass('status-absent')) status = 'absent';
        else if (activeBtn.hasClass('status-halfday')) status = 'half_day';
        else if (activeBtn.hasClass('status-leave')) status = 'leave';

        const checkIn = $(this).find('.check-in-input').val() || null;
        const checkOut = $(this).find('.check-out-input').val() || null;
        const notes = $(this).find('.notes-input').val() || null;

        attendance.push({
            staff_id: staffId,
            status: status,
            check_in: status === 'present' || status === 'half_day' ? checkIn : null,
            check_out: status === 'present' || status === 'half_day' ? checkOut : null,
            notes: notes
        });
    });

    if (!allMarked) {
        Swal.fire({
            title: 'Incomplete Marking!',
            text: 'Please choose a status (P, A, H, or L) for all staff members before saving.',
            icon: 'warning',
            confirmButtonColor: '#0c4843'
        });
        return;
    }

    // Disable button & show spinner
    btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Saving Logs...');

    $.ajax({
        url: `{{ route('my-staff.attendance.save') }}`,
        method: 'POST',
        data: {
            _token: '{{ csrf_token() }}',
            date: date,
            attendance: attendance
        },
        success: function(res) {
            btn.prop('disabled', false).html('<i class="ti ti-device-floppy"></i> Save All Attendance');
            if (res.success) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Attendance saved successfully.',
                    showConfirmButton: false,
                    timer: 2000
                });
                loadAttendanceData();
            } else {
                Swal.fire('Error!', res.message, 'error');
            }
        },
        error: function() {
            btn.prop('disabled', false).html('<i class="ti ti-device-floppy"></i> Save All Attendance');
            Swal.fire('Error!', 'An error occurred while saving attendance.', 'error');
        }
    });
}

// -------------------------------------------------------------
// ATTENDANCE REPORTS MODULE SCRIPTS
// -------------------------------------------------------------
function loadAttendanceReport() {
    const month = $('#filterMonth').val();
    const year = $('#filterYear').val();
    const staffId = $('#filterStaff').val();
    const container = $('#reportSummaryContainer');
    const table = $('#matrixTable');

    container.html(`
        <div class="col-12 text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            <span class="ms-2 text-muted">Calculating monthly summaries...</span>
        </div>
    `);

    table.html(`
        <tbody>
            <tr>
                <td class="py-5 text-muted">Loading calendar sheet...</td>
            </tr>
        </tbody>
    `);

    $.ajax({
        url: `{{ route('my-staff.attendance.report') }}`,
        method: 'GET',
        data: { month: month, year: year, staff_id: staffId },
        success: function(res) {
            if (res.success) {
                renderReportStats(res.data);
                renderReportMatrix(res.data);
                // Initialize Bootstrap tooltips for details hover
                setTimeout(() => {
                    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
                        new bootstrap.Tooltip(tooltipTriggerEl);
                    });
                }, 300);
            } else {
                container.html(`<div class="col-12 text-danger text-center py-3">Report Error: ${res.message}</div>`);
            }
        },
        error: function() {
            container.html('<div class="col-12 text-danger text-center py-3">Could not load monthly reports.</div>');
        }
    });
}

// Render report summaries cards
function renderReportStats(data) {
    const container = $('#reportSummaryContainer');
    container.empty();

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHalfDay = 0;
    let totalLeave = 0;
    let totalLogs = 0;
    
    data.report.forEach(staff => {
        totalPresent += staff.summary.present;
        totalAbsent += staff.summary.absent;
        totalHalfDay += staff.summary.half_day;
        totalLeave += staff.summary.leave;
        totalLogs += staff.summary.total_marked;
    });

    const activeStaffCount = data.report.length;
    const workingDays = data.days_in_month;
    
    // Average presence rate
    let presenceRate = 0;
    if (totalLogs > 0) {
        presenceRate = Math.round(((totalPresent + (totalHalfDay * 0.5)) / totalLogs) * 100);
    }

    const cardsHtml = `
        <!-- Total Staff -->
        <div class="col-sm-6 col-md-3 col-xl-2.4">
            <div class="card summary-card bg-white border p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="small text-muted fw-bold text-uppercase d-block mb-1">Active Staff</span>
                        <h4 class="mb-0 fw-bold text-dark">${activeStaffCount}</h4>
                    </div>
                    <div class="icon-wrapper bg-brand-light">
                        <i class="ti ti-users"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Presence rate -->
        <div class="col-sm-6 col-md-3 col-xl-2.4">
            <div class="card summary-card bg-white border p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="small text-muted fw-bold text-uppercase d-block mb-1">Presence %</span>
                        <h4 class="mb-0 fw-bold text-success">${presenceRate}%</h4>
                    </div>
                    <div class="icon-wrapper bg-success-light">
                        <i class="ti ti-activity"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Absents -->
        <div class="col-sm-6 col-md-3 col-xl-2.4">
            <div class="card summary-card bg-white border p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="small text-muted fw-bold text-uppercase d-block mb-1">Total Absents</span>
                        <h4 class="mb-0 fw-bold text-danger">${totalAbsent}</h4>
                    </div>
                    <div class="icon-wrapper bg-danger-light">
                        <i class="ti ti-user-x"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Half Days -->
        <div class="col-sm-6 col-md-3 col-xl-2.4">
            <div class="card summary-card bg-white border p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="small text-muted fw-bold text-uppercase d-block mb-1">Half Days</span>
                        <h4 class="mb-0 fw-bold text-warning">${totalHalfDay}</h4>
                    </div>
                    <div class="icon-wrapper bg-warning-light">
                        <i class="ti ti-clock"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Leaves -->
        <div class="col-sm-6 col-md-3 col-xl-2.4">
            <div class="card summary-card bg-white border p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="small text-muted fw-bold text-uppercase d-block mb-1">Leaves Taken</span>
                        <h4 class="mb-0 fw-bold text-primary">${totalLeave}</h4>
                    </div>
                    <div class="icon-wrapper bg-info-light">
                        <i class="ti ti-plane-departure"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.html(cardsHtml);
}

// Render the 1-31 table matrix view
function renderReportMatrix(data) {
    const table = $('#matrixTable');
    table.empty();

    // 1. Build Header
    let theadHtml = `
        <thead class="table-light text-center align-middle border-bottom">
            <tr>
                <th class="text-start ps-3" style="min-width: 180px;">Staff Member</th>
    `;
    
    for (let d = 1; d <= data.days_in_month; d++) {
        theadHtml += `<th class="px-1 small fw-bold">${d}</th>`;
    }
    theadHtml += `<th class="pe-3" style="min-width: 160px;">Month Stats</th></tr></thead>`;
    table.append(theadHtml);

    // 2. Build Body
    let tbodyHtml = '<tbody>';
    
    if (data.report.length === 0) {
        tbodyHtml += `
            <tr>
                <td colspan="${data.days_in_month + 2}" class="py-5 text-center text-muted">
                    No staff reports match the current filters.
                </td>
            </tr>
        `;
    } else {
        data.report.forEach(staff => {
            tbodyHtml += `
                <tr class="border-bottom">
                    <td class="text-start ps-3 py-3">
                        <div class="fw-bold text-dark mb-0">${staff.name}</div>
                        <small class="text-muted small">${staff.email}</small>
                    </td>
            `;

            for (let d = 1; d <= data.days_in_month; d++) {
                const dayRecord = staff.days[d];
                let cellHtml = '';
                
                if (dayRecord) {
                    const status = dayRecord.status;
                    let letter = 'P';
                    let dotClass = 'present';
                    let tooltipTitle = `Date: ${d}-${data.month}-${data.year} | Status: Present`;

                    if (status === 'absent') {
                        letter = 'A';
                        dotClass = 'absent';
                        tooltipTitle = `Date: ${d}-${data.month}-${data.year} | Status: Absent`;
                    } else if (status === 'half_day') {
                        letter = 'H';
                        dotClass = 'half_day';
                        tooltipTitle = `Date: ${d}-${data.month}-${data.year} | Status: Half Day`;
                    } else if (status === 'leave') {
                        letter = 'L';
                        dotClass = 'leave';
                        tooltipTitle = `Date: ${d}-${data.month}-${data.year} | Status: Approved Leave`;
                    }

                    if (dayRecord.check_in || dayRecord.check_out) {
                        tooltipTitle += `\nTiming: ${dayRecord.check_in || '--:--'} to ${dayRecord.check_out || '--:--'}`;
                    }
                    if (dayRecord.notes) {
                        tooltipTitle += `\nNotes: ${dayRecord.notes}`;
                    }

                    cellHtml = `
                        <span class="matrix-dot ${dotClass}" 
                              data-bs-toggle="tooltip" 
                              data-bs-placement="top" 
                              data-bs-html="true" 
                              title="${tooltipTitle.replace(/"/g, '&quot;')}">
                            ${letter}
                        </span>
                    `;
                } else {
                    cellHtml = `<span class="matrix-dot empty" data-bs-toggle="tooltip" title="Not Marked">-</span>`;
                }

                tbodyHtml += `<td class="matrix-cell">${cellHtml}</td>`;
            }

            // Stats summaries column
            const s = staff.summary;
            tbodyHtml += `
                <td class="pe-3 text-center">
                    <span class="badge bg-success-light px-1.5 py-1" title="Present">P: ${s.present}</span>
                    <span class="badge bg-danger-light px-1.5 py-1" title="Absent">A: ${s.absent}</span>
                    <span class="badge bg-warning-light px-1.5 py-1" title="Half Day">H: ${s.half_day}</span>
                    <span class="badge bg-info-light px-1.5 py-1" title="Leave">L: ${s.leave}</span>
                </td>
            </tr>`;
        });
    }

    tbodyHtml += '</tbody>';
    table.append(tbodyHtml);
}
</script>
@endsection
