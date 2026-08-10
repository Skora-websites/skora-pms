<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
  <title>Super Admin || Manage Users</title>
  <meta name="description" content="Manage all users - create, edit, activate/deactivate accounts" />
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
    .status-active { background: rgba(40, 199, 111, 0.12); color: #28c76f; }
    .status-inactive { background: rgba(234, 84, 85, 0.12); color: #ea5455; }
    .role-badge {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }
    .role-doctor { background: rgba(14, 96, 110, 0.12); color: #0e606e; }
    .role-patient { background: rgba(115, 103, 240, 0.12); color: #7367f0; }
    .role-receptionist { background: rgba(255, 159, 67, 0.12); color: #ff9f43; }
    .role-admin { background: rgba(0, 0, 0, 0.1); color: #333; }
    .action-btn {
      cursor: pointer; border: none; padding: 6px 12px;
      border-radius: 6px; font-size: 12px; font-weight: 600;
      transition: all 0.3s ease;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-deactivate { background: rgba(234, 84, 85, 0.12); color: #ea5455; }
    .btn-deactivate:hover { background: #ea5455; color: #fff; }
    .btn-activate { background: rgba(40, 199, 111, 0.12); color: #28c76f; }
    .btn-activate:hover { background: #28c76f; color: #fff; }
    .btn-edit { background: rgba(14, 96, 110, 0.12); color: #0e606e; margin-right: 5px; }
    .btn-edit:hover { background: #0e606e; color: #fff; }
    .user-avatar-placeholder {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 13px;
    }
    .card-border-shadow-Skoracares {
      border-color: #0e606e !important;
      box-shadow: 0 0.25rem 1rem rgba(14, 96, 110, 0.1);
    }
    .search-box { position: relative; }
    .search-box i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999; }
    .search-box input { padding-left: 36px; }
    .loading-overlay {
      display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.7); z-index: 10;
      align-items: center; justify-content: center;
    }
    .loading-overlay.show { display: flex; }
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
                <h4 class="mb-1" style="color: #0e606e;">Manage All Users</h4>
                <p class="text-muted mb-0">View, create, and edit accounts for Doctors, Patients, and Staff</p>
              </div>
              <button class="btn btn-primary" onclick="openCreateModal()">
                <i class="ri-user-add-line me-1"></i> Add New User
              </button>
            </div>

            {{-- Filters --}}
            <div class="card mb-4">
              <div class="card-body py-3">
                <div class="row g-3 align-items-center">
                  <div class="col-md-4">
                    <div class="search-box">
                      <i class="ri-search-line"></i>
                      <input type="text" id="searchInput" class="form-control" placeholder="Search by name, email, or phone...">
                    </div>
                  </div>
                  <div class="col-md-3">
                    <select id="roleFilter" class="form-select">
                      <option value="">All Roles</option>
                      <option value="doctor">Doctor</option>
                      <option value="patient">Patient</option>
                      <option value="receptionist">Staff / Receptionist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <select id="statusFilter" class="form-select">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div class="col-md-2 text-end">
                    <button class="btn btn-outline-secondary btn-sm" onclick="resetFilters()">
                      <i class="ri-refresh-line me-1"></i> Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {{-- Users Table --}}
            <div class="card position-relative">
              <div class="loading-overlay" id="loadingOverlay">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead style="background: rgba(14, 96, 110, 0.05);">
                    <tr>
                      <th style="width:5%">#</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Clinic / Doctor</th>
                      <th>Status</th>
                      <th style="width:20%" class="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody id="usersTableBody">
                    <tr>
                      <td colspan="6" class="text-center py-4 text-muted">
                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                        Loading users...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-footer d-flex justify-content-between align-items-center" id="paginationContainer">
                <small class="text-muted" id="paginationInfo"></small>
                <div id="paginationLinks"></div>
              </div>
            </div>

          </div>
          @include('super-admin.inc.footer')
        </div>
      </div>
    </div>

    {{-- User Modal --}}
    <div class="modal fade" id="userModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content p-3 p-md-5">
          <button type="button" class="btn-close btn-pinned" data-bs-dismiss="modal" aria-label="Close"></button>
          <div class="modal-body p-0">
            <div class="text-center mb-4">
              <h3 class="role-title mb-2" id="modalTitle">Add New User</h3>
              <p class="text-muted">Fill in the details to manage account access</p>
            </div>
            <form id="userForm" class="row g-3">
              <input type="hidden" id="userId" name="id">
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
                <label class="form-label" for="userPassword">Password <span class="text-danger" id="passRequiredStar">*</span></label>
                <input type="password" id="userPassword" name="password" class="form-control" placeholder="Minimum 6 characters">
                <small class="text-muted" id="passHint">Leave blank to keep current password</small>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="userRole">Assigned Role <span class="text-danger">*</span></label>
                <select id="userRole" name="role" class="form-select" required onchange="toggleExtraFields()">
                  <option value="doctor">Doctor</option>
                  <option value="patient">Patient</option>
                  <option value="receptionist">Receptionist / Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="userStatus">Account Status <span class="text-danger">*</span></label>
                <select id="userStatus" name="status" class="form-select" required>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              {{-- Doctor Extra Fields --}}
              <div class="col-12 col-md-6 extra-field doctor-only" style="display:none;">
                <label class="form-label" for="userQualification">Qualification</label>
                <input type="text" id="userQualification" name="qualification" class="form-control" placeholder="MBBS, MD">
              </div>
              <div class="col-12 col-md-6 extra-field doctor-only" style="display:none;">
                <label class="form-label" for="userRegNum">Registration Number</label>
                <input type="text" id="userRegNum" name="registration_number" class="form-control" placeholder="REG123456">
              </div>

              <div class="col-12 text-center mt-4">
                <button type="submit" class="btn btn-primary me-sm-3 me-1" id="saveBtn">Save User</button>
                <button type="reset" class="btn btn-outline-secondary" data-bs-dismiss="modal" aria-label="Close">Cancel</button>
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
    let currentPage = 1;

    function loadUsers(page = 1) {
      currentPage = page;
      const search = document.getElementById('searchInput').value;
      const role = document.getElementById('roleFilter').value;
      const status = document.getElementById('statusFilter').value;

      document.getElementById('loadingOverlay').classList.add('show');

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      params.append('page', page);

      fetch(`{{ route('super-admin.users.data') }}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' }
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById('loadingOverlay').classList.remove('show');
        if (data.success) {
          renderUsers(data.users, data.pagination);
        } else {
          document.getElementById('usersTableBody').innerHTML = `<tr><td colspan="6" class="text-center py-5 text-danger">Error: ${data.message || 'Could not load users'}</td></tr>`;
        }
      })
      .catch(err => {
        document.getElementById('loadingOverlay').classList.remove('show');
        console.error('Fetch Error:', err);
        document.getElementById('usersTableBody').innerHTML = `<tr><td colspan="6" class="text-center py-5 text-danger">Failed to connect to server. Please refresh.</td></tr>`;
      });
    }

    function renderUsers(users, pagination) {
      const tbody = document.getElementById('usersTableBody');
      if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5">No users found</td></tr>`;
        return;
      }

      let html = '';
      const startIndex = (pagination.current_page - 1) * 15;

      users.forEach((user, index) => {
        const roleClass = `role-${user.role}`;
        const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
        
        const doctorName = user.doctor ? user.doctor.name : '-';
        const doctorHtml = (user.role === 'patient' || user.role === 'receptionist') 
            ? `<div class="d-flex align-items-center gap-1">
                <i class="ri-hospital-line text-primary" style="font-size:14px;"></i>
                <span class="text-truncate" style="max-width:120px;" title="${doctorName}">${doctorName}</span>
               </div>`
            : '-';
        
        html += `<tr>
          <td>${startIndex + index + 1}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="user-avatar-placeholder" style="background:#0e606e;">${user.name.charAt(0).toUpperCase()}</div>
              <div>
                <strong>${user.name}</strong><br>
                <small class="text-muted">${user.registration_id || ''}</small>
              </div>
            </div>
          </td>
          <td>${user.email}</td>
          <td><span class="role-badge ${roleClass}">${user.role}</span></td>
          <td>${doctorHtml}</td>
          <td><span class="status-badge ${statusClass}">${user.status}</span></td>
          <td class="text-center">
            <button class="action-btn btn-edit" onclick="editUser(${user.id})" title="Edit User">
              <i class="ri-edit-line"></i>
            </button>
            <button class="action-btn ${user.status === 'active' ? 'btn-deactivate' : 'btn-activate'}" 
                    onclick="toggleStatus(${user.id}, '${user.name.replace(/'/g, "\\'")}')" 
                    title="${user.status === 'active' ? 'Deactivate' : 'Activate'}">
              <i class="ri-${user.status === 'active' ? 'forbid-line' : 'checkbox-circle-line'}"></i>
            </button>
          </td>
        </tr>`;
      });

      tbody.innerHTML = html;
      document.getElementById('paginationInfo').textContent = `Showing ${startIndex + 1} to ${startIndex + users.length} of ${pagination.total} entries`;
      document.getElementById('paginationLinks').innerHTML = pagination.links;
      
      document.querySelectorAll('#paginationLinks a').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const page = new URL(this.href).searchParams.get('page');
          if (page) loadUsers(page);
        });
      });
    }

    function openCreateModal() {
      document.getElementById('modalTitle').textContent = 'Add New User';
      document.getElementById('userForm').reset();
      document.getElementById('userId').value = '';
      document.getElementById('passRequiredStar').style.display = 'inline';
      document.getElementById('userPassword').required = true;
      document.getElementById('passHint').style.display = 'none';
      toggleExtraFields();
      userModal.show();
    }

    function editUser(id) {
      document.getElementById('loadingOverlay').classList.add('show');
      fetch(`/super-admin/user/${id}/details`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('loadingOverlay').classList.remove('show');
        if (data.success) {
          const user = data.user;
          document.getElementById('modalTitle').textContent = 'Edit User: ' + user.name;
          document.getElementById('userId').value = user.id;
          document.getElementById('userName').value = user.name;
          document.getElementById('userEmail').value = user.email;
          document.getElementById('userPhone').value = user.phone || '';
          document.getElementById('userRole').value = user.role;
          document.getElementById('userStatus').value = user.status;
          document.getElementById('userQualification').value = user.qualification || '';
          document.getElementById('userRegNum').value = user.registration_number || '';
          
          document.getElementById('passRequiredStar').style.display = 'none';
          document.getElementById('userPassword').required = false;
          document.getElementById('userPassword').value = '';
          document.getElementById('passHint').style.display = 'block';
          
          toggleExtraFields();
          userModal.show();
        }
      });
    }

    function toggleExtraFields() {
      const role = document.getElementById('userRole').value;
      const extra = document.querySelectorAll('.doctor-only');
      extra.forEach(el => el.style.display = (role === 'doctor' ? '' : 'none'));
    }

    document.getElementById('userForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const saveBtn = document.getElementById('saveBtn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

      const formData = new FormData(this);
      const isEdit = formData.get('id');
      const url = isEdit ? '{{ route("super-admin.user.update") }}' : '{{ route("super-admin.user.store") }}';

      fetch(url, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' },
        body: formData
      })
      .then(res => {
        // Log the raw status for debugging
        console.log('Server Status:', res.status);
        return res.json().catch(() => {
          throw new Error('Server returned an invalid response (not JSON)');
        });
      })
      .then(data => {
        console.log('Server Data:', data);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save User';

        if (data.success) {
          userModal.hide();
          loadUsers(currentPage);
          alert(data.message);
        } else {
          // If Laravel validation fails (422), errors are usually in data.errors
          let errorMessage = data.message || 'Validation failed';
          if (data.errors) {
            errorMessage += '\n' + Object.values(data.errors).flat().join('\n');
          }
          alert('Error: ' + errorMessage);
        }
      })
      .catch(err => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save User';
        console.error('Submit Error:', err);
        alert('Network or Server Error: ' + err.message);
      });
    });

    function toggleStatus(userId, userName) {
      if (!confirm(`Are you sure you want to change the status for ${userName}?`)) return;

      fetch('{{ route("super-admin.user.toggle-status") }}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ user_id: userId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          loadUsers(currentPage);
          alert(data.message);
        } else {
          alert(data.message);
        }
      });
    }

    document.getElementById('searchInput').addEventListener('input', () => loadUsers(1));
    document.getElementById('roleFilter').addEventListener('change', () => loadUsers(1));
    document.getElementById('statusFilter').addEventListener('change', () => loadUsers(1));

    function resetFilters() {
      document.getElementById('searchInput').value = '';
      document.getElementById('roleFilter').value = '';
      document.getElementById('statusFilter').value = '';
      loadUsers(1);
    }

    document.addEventListener('DOMContentLoaded', () => loadUsers(1));
  </script>
</body>
</html>
