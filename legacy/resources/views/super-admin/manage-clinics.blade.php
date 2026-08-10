<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
  <title>Super Admin || Manage Clinics</title>
  <meta name="description" content="View and manage all registered clinics" />
  @include('super-admin.inc.header-links')

  <style>
    .clinic-logo {
      width: 40px; height: 40px; border-radius: 8px; object-fit: cover;
      background: #f8f9fa; border: 1px solid #eee;
    }
    .clinic-badge {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .status-active { background: rgba(40, 199, 111, 0.12); color: #28c76f; }
    .card-border-shadow-Skoracares {
      border-color: #0e606e !important;
      box-shadow: 0 0.25rem 1rem rgba(14, 96, 110, 0.1);
    }
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
            
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 class="mb-1" style="color: #0e606e;">Global Clinics Directory</h4>
                <p class="text-muted mb-0">Overview of all medical facilities registered by doctors</p>
              </div>
              <button class="btn btn-primary" onclick="openCreateModal()">
                <i class="ri-add-line me-1"></i> Add New Clinic
              </button>
            </div>

            <div class="card mb-4">
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-8">
                    <div class="input-group input-group-merge">
                      <span class="input-group-text"><i class="ri-search-line"></i></span>
                      <input type="text" id="clinicSearch" class="form-control" placeholder="Search by clinic name, doctor, or phone...">
                    </div>
                  </div>
                  <div class="col-md-4 text-end">
                    <button class="btn btn-outline-secondary" onclick="loadClinics(1)">
                      <i class="ri-refresh-line me-1"></i> Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="card position-relative">
              <div class="loading-overlay" id="loadingOverlay">
                <div class="spinner-border text-primary" role="status"></div>
              </div>
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead style="background: rgba(14, 96, 110, 0.05);">
                    <tr>
                      <th style="width:5%">#</th>
                      <th>Clinic Info</th>
                      <th>Owned By (Doctor)</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Fee</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="clinicsTableBody">
                    <tr>
                      <td colspan="6" class="text-center py-5 text-muted">
                        <div class="spinner-border spinner-border-sm me-2"></div> Loading clinics...
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
  </div>

  @include('super-admin.inc.footer-links')

  {{-- Clinic Modal --}}
  <div class="modal fade" id="clinicModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content p-3 p-md-5">
        <button type="button" class="btn-close btn-pinned" data-bs-dismiss="modal" aria-label="Close"></button>
        <div class="modal-body p-0">
          <div class="text-center mb-4">
            <h3 id="modalTitle">Register New Clinic</h3>
            <p class="text-muted">Setup a new medical facility for a doctor</p>
          </div>
          <form id="clinicForm" class="row g-3">
            <input type="hidden" id="clinicId" name="id">
            
            <div class="col-12 col-md-6">
              <label class="form-label" for="clinicName">Clinic Name <span class="text-danger">*</span></label>
              <input type="text" id="clinicName" name="clinic_name" class="form-control" placeholder="City Medical Center" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label" for="doctor_id">Owner (Doctor) <span class="text-danger">*</span></label>
              <select id="doctor_id" name="doctor_id" class="form-select" required>
                <option value="">Select Doctor</option>
                @foreach($doctors as $doctor)
                  <option value="{{ $doctor->id }}">{{ $doctor->name }}</option>
                @endforeach
              </select>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label" for="phone">Phone Number</label>
              <input type="text" id="phone" name="phone" class="form-control" placeholder="+91 9876543210">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label" for="consultation_fee">Consultation Fee (₹) <span class="text-danger">*</span></label>
              <input type="number" id="consultation_fee" name="consultation_fee" class="form-control" placeholder="500" required>
            </div>

            <div class="col-12">
              <label class="form-label" for="address">Full Address <span class="text-danger">*</span></label>
              <textarea id="address" name="address" class="form-control" rows="2" placeholder="Street, City, State, Country" required></textarea>
            </div>

            <div class="col-12 col-md-12">
              <label class="form-label" for="clinic_logo">Clinic Logo</label>
              <input type="file" id="clinic_logo" name="clinic_logo" class="form-control" accept="image/*">
            </div>

            <div class="col-12 text-center mt-4">
              <button type="submit" class="btn btn-primary me-sm-3 me-1" id="saveBtn">Save Clinic</button>
              <button type="reset" class="btn btn-outline-secondary" data-bs-dismiss="modal" aria-label="Close">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script>
    const clinicModal = new bootstrap.Modal(document.getElementById('clinicModal'));
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    function openCreateModal() {
      document.getElementById('modalTitle').textContent = 'Register New Clinic';
      document.getElementById('clinicForm').reset();
      document.getElementById('clinicId').value = '';
      clinicModal.show();
    }

    function editClinic(id) {
      document.getElementById('loadingOverlay').classList.add('show');
      fetch(`/super-admin/manage-clinics/${id}/details`)
        .then(res => res.json())
        .then(data => {
          document.getElementById('loadingOverlay').classList.remove('show');
          if (data.success) {
            const clinic = data.clinic;
            document.getElementById('modalTitle').textContent = 'Edit Clinic: ' + clinic.clinic_name;
            document.getElementById('clinicId').value = clinic.id;
            document.getElementById('clinicName').value = clinic.clinic_name;
            document.getElementById('doctor_id').value = clinic.doctor_id;
            document.getElementById('phone').value = clinic.phone || '';
            document.getElementById('consultation_fee').value = clinic.consultation_fee;
            document.getElementById('address').value = clinic.address;
            clinicModal.show();
          }
        });
    }

    document.getElementById('clinicForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const saveBtn = document.getElementById('saveBtn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing...';

      const formData = new FormData(this);
      const isEdit = formData.get('id');
      const url = isEdit ? '{{ route("super-admin.clinic.update") }}' : '{{ route("super-admin.clinic.store") }}';

      fetch(url, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' },
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Clinic';
        if (data.success) {
          clinicModal.hide();
          loadClinics(1);
          Swal.fire('Success!', data.message, 'success');
        } else {
          Swal.fire('Error!', data.message || 'Something went wrong', 'error');
        }
      })
      .catch(err => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Clinic';
        Swal.fire('Error!', 'System error occurred', 'error');
      });
    });

    function deleteClinic(id) {
      Swal.fire({
        title: 'Are you sure?',
        text: "This will delete the clinic and all its settings!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ea5455',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`/super-admin/manage-clinics/${id}/delete`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' }
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              loadClinics(1);
              Swal.fire('Deleted!', data.message, 'success');
            } else {
              Swal.fire('Error!', data.message, 'error');
            }
          });
        }
      });
    }

    function loadClinics(page = 1) {
      const search = document.getElementById('clinicSearch').value;
      const overlay = document.getElementById('loadingOverlay');
      overlay.classList.add('show');

      fetch(`{{ route('super-admin.clinics.data') }}?page=${page}&search=${search}`)
        .then(res => res.json())
        .then(data => {
          overlay.classList.remove('show');
          if (data.success) {
            renderClinics(data.clinics, data.pagination);
          }
        })
        .catch(err => {
          overlay.classList.remove('show');
          console.error(err);
        });
    }

    function renderClinics(clinics, pagination) {
      const tbody = document.getElementById('clinicsTableBody');
      if (!clinics || clinics.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5">No clinics found</td></tr>`;
        return;
      }

      const startIndex = (pagination.current_page - 1) * 15;
      let html = '';
      clinics.forEach((clinic, index) => {
        html += `<tr>
          <td>${startIndex + index + 1}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img src="${clinic.clinic_logo ? '/'+clinic.clinic_logo : 'https://placehold.co/40x40?text=C'}" class="clinic-logo">
              <div>
                <strong class="text-primary">${clinic.clinic_name}</strong><br>
                <small class="text-muted">${clinic.address_type || 'Main'}</small>
              </div>
            </div>
          </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div style="width:30px;height:30px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">
                ${clinic.doctor ? clinic.doctor.name.charAt(0) : '?'}
              </div>
              <span>${clinic.doctor ? clinic.doctor.name : 'Unknown'}</span>
            </div>
          </td>
          <td>${clinic.phone || '-'}</td>
          <td><small title="${clinic.address || ''}">${clinic.address ? clinic.address.substring(0, 30) + '...' : '-'}</small></td>
          <td><span class="fw-bold text-success">₹${clinic.consultation_fee || '0'}</span></td>
          <td class="text-center">
            <div class="d-flex justify-content-center gap-2">
              <button class="btn btn-sm btn-icon btn-label-primary" onclick="editClinic(${clinic.id})" title="Edit Clinic">
                <i class="ri-edit-2-line"></i>
              </button>
              <button class="btn btn-sm btn-icon btn-label-danger" onclick="deleteClinic(${clinic.id})" title="Delete Clinic">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>`;
      });

      tbody.innerHTML = html;
      document.getElementById('paginationInfo').textContent = `Showing ${startIndex + 1} to ${startIndex + clinics.length} of ${pagination.total} entries`;
      document.getElementById('paginationLinks').innerHTML = pagination.links;

      document.querySelectorAll('#paginationLinks a').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const page = new URL(this.href).searchParams.get('page');
          if (page) loadClinics(page);
        });
      });
    }

    let searchTimer;
    document.getElementById('clinicSearch').addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadClinics(1), 500);
    });
    
    document.addEventListener('DOMContentLoaded', () => loadClinics(1));
  </script>
</body>
</html>
