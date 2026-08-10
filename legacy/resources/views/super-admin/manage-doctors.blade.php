<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
  <title>Super Admin || Manage Doctors</title>
  <meta name="description" content="Manage all doctors - activate/deactivate accounts" />
  @include('super-admin.inc.header-links')

  <style>
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-active {
      background: rgba(40, 199, 111, 0.12);
      color: #28c76f;
    }
    .status-inactive {
      background: rgba(234, 84, 85, 0.12);
      color: #ea5455;
    }
    .toggle-status-btn {
      cursor: pointer;
      border: none;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .btn-deactivate {
      background: rgba(234, 84, 85, 0.12);
      color: #ea5455;
    }
    .btn-deactivate:hover {
      background: #ea5455;
      color: #fff;
    }
    .btn-activate {
      background: rgba(40, 199, 111, 0.12);
      color: #28c76f;
    }
    .btn-activate:hover {
      background: #28c76f;
      color: #fff;
    }
    .doctor-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e9ecef;
    }
    .doctor-avatar-placeholder {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0e606e 0%, #1a8a9c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 14px;
    }
    .card-border-shadow-Skoracares {
      border-color: #0e606e !important;
      box-shadow: 0 0.25rem 1rem rgba(14, 96, 110, 0.1);
    }
    .search-box {
      position: relative;
    }
    .search-box i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
    }
    .search-box input {
      padding-left: 36px;
    }

    /* Permission Matrix Styles */
    .perm-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        height: 100%;
        transition: all 0.2s ease;
    }
    .perm-card:hover {
        border-color: #0e606e;
        box-shadow: 0 4px 12px rgba(14, 96, 110, 0.08);
    }
    .perm-card-header {
        padding: 12px 16px;
        background: rgba(14, 96, 110, 0.03);
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
    }
    .module-title {
        font-weight: 700;
        color: #1e293b;
        font-size: 14px;
        text-transform: capitalize;
    }
    .perm-card-body {
        padding: 12px 16px;
    }
    .perm-item-row {
        display: flex;
        align-items: center;
        padding: 6px 0;
        gap: 10px;
    }
    .perm-item-row label {
        font-size: 13px;
        color: #475569;
        cursor: pointer;
        margin-bottom: 0;
    }
    .status-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 600;
    }
    .status-badge.checked {
        background: #dcfce7;
        color: #166534;
    }
    .status-badge.unchecked {
        background: #f1f5f9;
        color: #64748b;
    }
  </style>
</head>

<body>
  <div class="layout-wrapper layout-content-navbar">
    <div class="layout-container">
      @include('super-admin.inc.sidebar')
      <div class="layout-page">
        @include('super-admin.inc.header')
        <div class="content-wrapper">
          <div class="container-xxl flex-grow-1 container-p-y">
            
            {{-- Page Header --}}
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 class="mb-1" style="color: #0e606e;">Manage Doctors</h4>
                <p class="text-muted mb-0">View, activate, and deactivate doctor accounts</p>
              </div>
            </div>

            {{-- Stats Cards --}}
            <div class="row mb-4">
              <div class="col-sm-6 col-lg-4 mb-3">
                <div class="card card-border-shadow-Skoracares h-100">
                  <div class="card-body d-flex align-items-center gap-3 p-3">
                    <div class="doctor-avatar-placeholder" style="width:48px;height:48px;font-size:20px;">
                      <i class="ri-stethoscope-line"></i>
                    </div>
                    <div>
                      <h4 class="mb-0" id="stat-total">{{ $doctors->count() }}</h4>
                      <small class="text-muted">Total Doctors</small>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-sm-6 col-lg-4 mb-3">
                <div class="card h-100" style="border-left: 3px solid #28c76f;">
                  <div class="card-body d-flex align-items-center gap-3 p-3">
                    <div style="width:48px;height:48px;border-radius:50%;background:rgba(40,199,111,0.12);display:flex;align-items:center;justify-content:center;">
                      <i class="ri-checkbox-circle-line" style="font-size:22px;color:#28c76f;"></i>
                    </div>
                    <div>
                      <h4 class="mb-0" id="stat-active">{{ $doctors->where('status', 'active')->count() }}</h4>
                      <small class="text-muted">Active Doctors</small>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-sm-6 col-lg-4 mb-3">
                <div class="card h-100" style="border-left: 3px solid #ea5455;">
                  <div class="card-body d-flex align-items-center gap-3 p-3">
                    <div style="width:48px;height:48px;border-radius:50%;background:rgba(234,84,85,0.12);display:flex;align-items:center;justify-content:center;">
                      <i class="ri-close-circle-line" style="font-size:22px;color:#ea5455;"></i>
                    </div>
                    <div>
                      <h4 class="mb-0" id="stat-inactive">{{ $doctors->where('status', 'inactive')->count() }}</h4>
                      <small class="text-muted">Inactive Doctors</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {{-- Filters --}}
            <div class="card mb-4">
              <div class="card-body py-3">
                <div class="row g-3 align-items-center">
                  <div class="col-md-6">
                    <div class="search-box">
                      <i class="ri-search-line"></i>
                      <input type="text" id="searchInput" class="form-control" placeholder="Search by name, email, or phone...">
                    </div>
                  </div>
                  <div class="col-md-3">
                    <select id="statusFilter" class="form-select">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div class="col-md-3 text-end">
                    <button class="btn btn-outline-secondary" onclick="resetFilters()">
                      <i class="ri-refresh-line me-1"></i> Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {{-- Doctors Table --}}
            <div class="card">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead style="background: rgba(14, 96, 110, 0.05);">
                    <tr>
                      <th style="width:5%">#</th>
                      <th>Doctor</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Registered</th>
                      <th>Status</th>
                      <th style="width:20%" class="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody id="doctorsTableBody">
                    @forelse($doctors as $index => $doctor)
                    <tr id="doctor-row-{{ $doctor->id }}">
                      <td>{{ $index + 1 }}</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          @if($doctor->profile_photo_path)
                            <img src="{{ asset($doctor->profile_photo_path) }}" alt="{{ $doctor->name }}" class="doctor-avatar">
                          @else
                            <div class="doctor-avatar-placeholder">{{ strtoupper(substr($doctor->name, 0, 1)) }}</div>
                          @endif
                          <div>
                            <strong>{{ $doctor->name }}</strong>
                            @if($doctor->qualification)
                              <br><small class="text-muted">{{ $doctor->qualification }}</small>
                            @endif
                            @if($doctor->trial_ends_at)
                              @if(\Carbon\Carbon::now()->gt($doctor->trial_ends_at))
                                <br><span class="badge bg-label-danger fs-11 py-1 px-2 mt-1"><i class="ri-alert-line me-1"></i>Expired ({{ \Carbon\Carbon::parse($doctor->trial_ends_at)->format('d M Y') }})</span>
                              @else
                                <br><span class="badge bg-label-success fs-11 py-1 px-2 mt-1"><i class="ri-checkbox-circle-line me-1"></i>Active till {{ \Carbon\Carbon::parse($doctor->trial_ends_at)->format('d M Y') }}</span>
                              @endif
                            @else
                              <br><small class="text-muted"><i class="ri-information-line me-1"></i>No trial set</small>
                            @endif
                          </div>
                        </div>
                      </td>
                      <td>{{ $doctor->email ?? '-' }}</td>
                      <td>{{ $doctor->phone ?? '-' }}</td>
                      <td>{{ $doctor->created_at ? $doctor->created_at->format('d M Y') : '-' }}</td>
                      <td>
                        <span class="status-badge {{ $doctor->status === 'active' ? 'status-active' : 'status-inactive' }}" id="status-badge-{{ $doctor->id }}">
                          {{ $doctor->status ?? 'active' }}
                        </span>
                      </td>
                      <td class="text-center">
                        <div class="d-flex justify-content-center gap-1">
                          <button class="btn btn-sm btn-icon btn-label-primary" onclick="managePermissions({{ $doctor->id }})" title="Manage Features">
                            <i class="ri-shield-keyhole-line"></i>
                          </button>
                          <button class="btn btn-sm btn-icon btn-label-info" onclick="editUser({{ $doctor->id }})" title="Edit Doctor">
                            <i class="ri-edit-line"></i>
                          </button>
                          <button class="toggle-status-btn {{ ($doctor->status ?? 'active') === 'active' ? 'btn-deactivate' : 'btn-activate' }}"
                                  id="toggle-btn-{{ $doctor->id }}"
                                  onclick="toggleStatus({{ $doctor->id }}, '{{ $doctor->name }}')">
                            <i class="ri-{{ ($doctor->status ?? 'active') === 'active' ? 'forbid-line' : 'checkbox-circle-line' }} me-1"></i>
                            {{ ($doctor->status ?? 'active') === 'active' ? 'Deactivate' : 'Activate' }}
                          </button>
                        </div>
                      </td>
                    </tr>
                    @empty
                    <tr>
                      <td colspan="7" class="text-center py-5 text-muted">
                        <i class="ri-stethoscope-line" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                        No doctors found
                      </td>
                    </tr>
                    @endforelse
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          @include('super-admin.inc.footer')
        </div>
      </div>
    </div>

    {{-- Doctor Edit Modal --}}
    <div class="modal fade" id="userModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content p-3 p-md-5">
          <button type="button" class="btn-close btn-pinned" data-bs-dismiss="modal" aria-label="Close"></button>
          <div class="modal-body p-0">
            <div class="text-center mb-4">
              <h3 class="role-title mb-2" id="modalTitle">Edit Doctor Profile</h3>
              <p class="text-muted">Update professional details and credentials</p>
            </div>
            <form id="userForm" class="row g-3">
              <input type="hidden" id="userId" name="id">
              <input type="hidden" id="userRole" name="role" value="doctor">
              <div class="col-12 col-md-6">
                <label class="form-label" for="userName">Full Name <span class="text-danger">*</span></label>
                <input type="text" id="userName" name="name" class="form-control" placeholder="John Doe" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="userEmail">Email Address <span class="text-danger">*</span></label>
                <input type="email" id="userEmail" name="email" class="form-control" placeholder="john@example.com" required>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="userPhone">Phone Number</label>
                <input type="text" id="userPhone" name="phone" class="form-control" placeholder="+91 9876543210">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="userPassword">Password</label>
                <input type="password" id="userPassword" name="password" class="form-control" placeholder="Leave blank to keep current">
                <small class="text-muted">Minimum 6 characters</small>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="userStatus">Account Status <span class="text-danger">*</span></label>
                <select id="userStatus" name="status" class="form-select" required>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="userQualification">Qualification</label>
                <input type="text" id="userQualification" name="qualification" class="form-control" placeholder="MBBS, MD">
              </div>
              <div class="col-12 col-md-12">
                <label class="form-label" for="userRegNum">Registration Number</label>
                <input type="text" id="userRegNum" name="registration_number" class="form-control" placeholder="REG123456">
              </div>
              <div class="col-12 col-md-12">
                <label class="form-label" for="userTrialEndsAt">Trial / Subscription Ends At</label>
                <input type="date" id="userTrialEndsAt" name="trial_ends_at" class="form-control">
              </div>

              <div class="col-12 text-center mt-4">
                <button type="submit" class="btn btn-primary me-sm-3 me-1" id="saveBtn">Update Doctor</button>
                <button type="reset" class="btn btn-outline-secondary" data-bs-dismiss="modal" aria-label="Close">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    {{-- Doctor Permissions Modal --}}
    <div class="modal fade" id="permissionsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content p-3 p-md-4">
          <button type="button" class="btn-close btn-pinned" data-bs-dismiss="modal" aria-label="Close"></button>
          <div class="modal-body p-0">
            <div class="text-center mb-4">
              <h3 class="mb-2">Clinic Feature Access</h3>
              <p class="text-muted" id="permDoctorName">Manage modules for Doctor</p>
            </div>
            
            <div class="alert alert-info d-flex align-items-center mb-4" role="alert">
                <i class="ri-information-line me-2"></i>
                <div>
                    Enable or disable entire modules for this clinic. Only enabled features will be visible in the doctor's sidebar.
                </div>
            </div>

            <form id="permissionsForm">
              <input type="hidden" id="permDoctorId" name="doctor_id">
              
              <div class="d-flex align-items-center mb-4 pb-3 border-bottom">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" id="bulkSelectPerms">
                  <label class="form-check-label fw-bold ms-1" for="bulkSelectPerms" style="cursor:pointer">
                    Enable All Features
                  </label>
                </div>
                <span class="ms-auto badge bg-label-primary" id="bulkPermCounter">0 selected</span>
              </div>

              <div class="row g-4" id="permissionsGrid">
                 {{-- Dynamic Content --}}
              </div>

              <div class="col-12 text-center mt-5">
                <button type="submit" class="btn btn-primary btn-lg me-sm-3 me-1" id="savePermsBtn">Save Clinic Features</button>
                <button type="button" class="btn btn-outline-secondary btn-lg" data-bs-dismiss="modal">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="layout-overlay layout-menu-toggle"></div>
    <div class="drag-target"></div>
  </div>

  @include('super-admin.inc.footer-links')

  <script>
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));

    function editUser(id) {
       document.querySelectorAll('.row-spinner')?.forEach(s => s.style.display = 'inline-block');
       fetch(`/super-admin/user/${id}/details`)
       .then(res => res.json())
       .then(data => {
         if (data.success) {
           const user = data.user;
           document.getElementById('userId').value = user.id;
           document.getElementById('userName').value = user.name;
           document.getElementById('userEmail').value = user.email;
           document.getElementById('userPhone').value = user.phone || '';
           document.getElementById('userStatus').value = user.status;
           document.getElementById('userQualification').value = user.qualification || '';
           document.getElementById('userRegNum').value = user.registration_number || '';
           if (user.trial_ends_at) {
             document.getElementById('userTrialEndsAt').value = user.trial_ends_at.substring(0, 10);
           } else {
             document.getElementById('userTrialEndsAt').value = '';
           }
           document.getElementById('userPassword').value = '';
           userModal.show();
         }
       });
    }

    document.getElementById('userForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const saveBtn = document.getElementById('saveBtn');
      const formData = new FormData(this);
      
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Updating...';

      fetch('{{ route("super-admin.user.update") }}', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' },
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Update Doctor';
        if (data.success) {
          userModal.hide();
          location.reload(); // Simple reload to refresh table and stats
        } else {
          alert('Error: ' + (data.message || 'Validation failed'));
        }
      })
      .catch(err => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Update Doctor';
        alert('Network Error: ' + err.message);
      });
    });

    function toggleStatus(userId, userName) {
      const action = document.getElementById(`toggle-btn-${userId}`).textContent.trim().toLowerCase();
      const confirmMsg = action === 'deactivate' 
        ? `Are you sure you want to DEACTIVATE ${userName}? They will not be able to login.`
        : `Are you sure you want to ACTIVATE ${userName}? They will be able to login again.`;

      if (!confirm(confirmMsg)) return;

      fetch('{{ route("super-admin.user.toggle-status") }}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Update badge
          const badge = document.getElementById(`status-badge-${userId}`);
          badge.className = `status-badge ${data.new_status === 'active' ? 'status-active' : 'status-inactive'}`;
          badge.textContent = data.new_status;

          // Update button
          const btn = document.getElementById(`toggle-btn-${userId}`);
          if (data.new_status === 'active') {
            btn.className = 'toggle-status-btn btn-deactivate';
            btn.innerHTML = '<i class="ri-forbid-line me-1"></i> Deactivate';
          } else {
            btn.className = 'toggle-status-btn btn-activate';
            btn.innerHTML = '<i class="ri-checkbox-circle-line me-1"></i> Activate';
          }

          // Update stats
          updateStats();

          alert(data.message);
        } else {
          alert(data.message || 'Something went wrong');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Network error. Please try again.');
      });
    }

    function updateStats() {
      const rows = document.querySelectorAll('#doctorsTableBody tr[id^="doctor-row-"]');
      let active = 0, inactive = 0;
      rows.forEach(row => {
        const badge = row.querySelector('.status-badge');
        if (badge && badge.textContent.trim() === 'active') active++;
        else inactive++;
      });
      document.getElementById('stat-total').textContent = rows.length;
      document.getElementById('stat-active').textContent = active;
      document.getElementById('stat-inactive').textContent = inactive;
    }

    // =============================================
    // Permissions Management JS
    // =============================================
    const permissionsModal = new bootstrap.Modal(document.getElementById('permissionsModal'));
    const permissionsGrid = document.getElementById('permissionsGrid');
    const bulkSelect = document.getElementById('bulkSelectPerms');

    function managePermissions(id) {
        // Show loading or reset grid
        permissionsGrid.innerHTML = '<div class="col-12 text-center py-5"><span class="spinner-border text-primary"></span><p class="mt-2 text-muted">Loading permissions...</p></div>';
        permissionsModal.show();

        fetch(`/super-admin/doctor/${id}/permissions`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('permDoctorId').value = data.user.id;
                document.getElementById('permDoctorName').textContent = `Manage modules for ${data.user.name}`;
                renderPermissionGrid(data.modules, data.user.permissions);
            } else {
                alert('Failed to load permissions');
            }
        });
    }

    function renderPermissionGrid(modules, userPerms) {
        let html = '';
        modules.forEach(module => {
            const hasModule = userPerms.includes(module.name);
            html += `
            <div class="col-md-6 col-lg-4">
                <div class="perm-card">
                    <div class="perm-card-header">
                        <input type="checkbox" class="form-check-input parent-chk" 
                               id="module_${module.id}" data-mid="${module.id}" 
                               name="permissions[]" value="${module.name}"
                               ${hasModule ? 'checked' : ''}>
                        <label class="module-title ms-2" for="module_${module.id}">${module.name.replace(/-/g, ' ')}</label>
                    </div>
                    <div class="perm-card-body">
                        ${module.permissions.map(p => {
                            const hasP = userPerms.includes(p.name);
                            return `
                            <div class="perm-item-row">
                                <input type="checkbox" class="form-check-input child-chk child-of-${module.id}" 
                                       id="p_${p.id}" data-pid="${p.id}" data-parent="${module.id}"
                                       name="permissions[]" value="${p.name}"
                                       ${hasP ? 'checked' : ''}>
                                <label for="p_${p.id}">${formatPermName(p.name, module.name)}</label>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
        });
        permissionsGrid.innerHTML = html;
        updateBulkCounter();
        initCheckboxLogic();
    }

    function formatPermName(name, module) {
        let n = name.replace(module + '-', '');
        return n.charAt(0).toUpperCase() + n.slice(1).replace(/-/g, ' ');
    }

    function initCheckboxLogic() {
        // Parent/Child Sync
        document.querySelectorAll('.parent-chk').forEach(parent => {
            parent.addEventListener('change', function() {
                const mid = this.dataset.mid;
                document.querySelectorAll(`.child-of-${mid}`).forEach(child => {
                    child.checked = this.checked;
                });
                updateBulkCounter();
            });
        });

        document.querySelectorAll('.child-chk').forEach(child => {
            child.addEventListener('change', function() {
                const mid = this.dataset.parent;
                const parent = document.getElementById(`module_${mid}`);
                const children = document.querySelectorAll(`.child-of-${mid}`);
                const checked = document.querySelectorAll(`.child-of-${mid}:checked`);
                
                // If ANY child is checked, the parent should be too? 
                // No, follow the system rule: if list/view is checked
                if (this.checked) {
                    parent.checked = true;
                }
                updateBulkCounter();
            });
        });
    }

    function updateBulkCounter() {
        const total = document.querySelectorAll('#permissionsGrid input[type="checkbox"]').length;
        const checked = document.querySelectorAll('#permissionsGrid input[type="checkbox"]:checked').length;
        document.getElementById('bulkPermCounter').textContent = `${checked} selected`;
        bulkSelect.checked = checked > 0 && checked === total;
    }

    bulkSelect.addEventListener('change', function() {
        document.querySelectorAll('#permissionsGrid input[type="checkbox"]').forEach(chk => {
            chk.checked = this.checked;
        });
        updateBulkCounter();
    });

    document.getElementById('permissionsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = document.getElementById('savePermsBtn');
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
            if (key === 'permissions[]') {
                if (!data.permissions) data.permissions = [];
                data.permissions.push(value);
            } else {
                data[key] = value;
            }
        });

        // FormData.getAll alternative for permissions
        const perms = [];
        this.querySelectorAll('input[name="permissions[]"]:checked').forEach(c => perms.push(c.value));

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

        fetch('{{ route("super-admin.doctor.permissions.sync") }}', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken, 
                'Accept': 'application/json' 
            },
            body: JSON.stringify({
                doctor_id: document.getElementById('permDoctorId').value,
                permissions: perms
            })
        })
        .then(res => res.json())
        .then(data => {
            btn.disabled = false;
            btn.textContent = 'Save Clinic Features';
            if (data.success) {
                permissionsModal.hide();
                Swal.fire({ title: 'Success', text: data.message, icon: 'success', customClass: { confirmButton: 'btn btn-primary' } });
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.textContent = 'Save Clinic Features';
            console.error(err);
        });
    });
  </script>
</body>
</html>
