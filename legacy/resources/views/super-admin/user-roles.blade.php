<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>Super Admin || Roles & Permissions</title>
    @include('super-admin.inc.header-links')
    <style>
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
        #targetUserWrapper {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px dashed #ced4da;
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
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 class="mb-1" style="color: #0e606e;">Roles & Permissions</h4>
                                <p class="text-muted mb-0">Manage security levels and granular feature access for all users.</p>
                            </div>
                        </div>

                        <div class="row g-4">
                            @foreach($roles as $role)
                            <div class="col-xl-4 col-lg-6 col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <h5 class="mb-0 fw-bold">{{ $role->name }}</h5>
                                            <span class="badge bg-label-primary">{{ $role->permissions_count }} Permissions</span>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-end">
                                            <div class="role-heading">
                                                <a href="javascript:;" class="btn btn-sm btn-outline-primary" onclick="editRole({{ $role->id }}, '{{ $role->name }}')">
                                                   <i class="ri-settings-4-line me-1"></i> Manage Permissions
                                                </a>
                                            </div>
                                            <div class="avatar-group d-flex align-items-center">
                                                <div class="avatar avatar-sm">
                                                    <span class="avatar-initial rounded-circle bg-label-info"><i class="ri-shield-user-line"></i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            @endforeach
                            
                            <div class="col-xl-4 col-lg-6 col-md-6">
                                <div class="card h-100 border-dashed border-2" style="border-style: dashed !important; border-color: #dee2e6 !important; background: #fcfcfc;">
                                    <div class="card-body text-center d-flex flex-column align-items-center justify-content-center">
                                        <button class="btn btn-primary mb-2" onclick="prepareAddRole()">
                                            <i class="ri-add-circle-line me-1"></i> Add New Role
                                        </button>
                                        <small class="text-muted">Create custom role level</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    @include('super-admin.inc.footer')
                </div>
            </div>
        </div>
    </div>

    {{-- Enhanced Role Modal --}}
    <div class="modal fade" id="roleModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content p-3 p-md-4">
                <button type="button" class="btn-close btn-pinned" data-bs-dismiss="modal" aria-label="Close"></button>
                <div class="modal-body p-0">
                    <div class="text-center mb-4">
                        <h4 id="modalTitle" class="fw-bold">Manage Role Permissions</h4>
                        <p class="text-muted">Configure granular feature access for system modules</p>
                    </div>

                    <form id="roleForm">
                        <input type="hidden" id="roleId" name="id">
                        
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label fw-bold" for="roleName">Role Name</label>
                                <input type="text" id="roleName" name="name" class="form-control" placeholder="e.g. Sales Manager" required>
                            </div>
                            
                            {{-- Target Doctor Selection (Conditional) --}}
                            <div class="col-md-6" id="targetUserWrapper" style="display: none;">
                                <label class="form-label fw-bold text-primary">Apply To Specific User (Optional)</label>
                                <select id="targetUserSelect" name="target_user_id" class="form-select border-primary">
                                    <option value="">Apply to Role (All Users)</option>
                                    @foreach($doctors as $doctor)
                                        <option value="{{ $doctor->id }}">{{ $doctor->name }}</option>
                                    @endforeach
                                </select>
                                <small class="text-info d-block mt-1"><i class="ri-information-line"></i> Select a specific doctor to override only their permissions.</small>
                            </div>
                        </div>

                        <div class="d-flex align-items-center mb-4 pb-3 border-bottom justify-content-between">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="selectAll">
                                <label class="form-check-label fw-bold ms-1" for="selectAll" style="cursor:pointer">
                                    Enable All Permissions
                                </label>
                            </div>
                            <span class="badge bg-label-info" id="permCounter">0 selected</span>
                        </div>

                        <div class="row g-4" id="permissionsGrid">
                            {{-- Populated via JS --}}
                        </div>

                        <div class="col-12 text-center mt-5">
                            <button type="submit" class="btn btn-primary btn-lg me-3" id="saveRoleBtn">Save Changes</button>
                            <button type="button" class="btn btn-outline-secondary btn-lg" data-bs-dismiss="modal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    @include('super-admin.inc.footer-links')

    <script>
        const roleModal = new bootstrap.Modal(document.getElementById('roleModal'));
        let allPermissionsGroups = [];
        const csrfToken = '{{ csrf_token() }}';

        async function initPermissions() {
            const res = await fetch('{{ route("permissions.all") }}');
            allPermissionsGroups = await res.json();
        }

        function renderPermissionGrid(selectedNames = []) {
            let html = '';
            allPermissionsGroups.forEach(module => {
                const isModuleChecked = selectedNames.includes(module.name);
                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="perm-card">
                        <div class="perm-card-header">
                            <input type="checkbox" class="form-check-input parent-chk" 
                                   id="module_${module.id}" data-mid="${module.id}" 
                                   name="permissions[]" value="${module.name}"
                                   ${isModuleChecked ? 'checked' : ''}>
                            <label class="module-title ms-2" for="module_${module.id}">${module.name.replace(/-/g, ' ')}</label>
                        </div>
                        <div class="perm-card-body">
                            ${module.permissions.map(p => {
                                const isChecked = selectedNames.includes(p.name) ? 'checked' : '';
                                return `
                                <div class="perm-item-row">
                                    <input type="checkbox" class="form-check-input child-chk child-of-${module.id}" 
                                           id="p_${p.id}" data-pid="${p.id}" data-parent="${module.id}"
                                           name="permissions[]" value="${p.name}"
                                           ${isChecked ? 'checked' : ''}>
                                    <label for="p_${p.id}">${formatPermName(p.name, module.name)}</label>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>`;
            });
            document.getElementById('permissionsGrid').innerHTML = html;
            updateCounter();
            initCheckboxSync();
        }

        function formatPermName(name, module) {
            let n = name.replace(module + '-', '');
            return n.charAt(0).toUpperCase() + n.slice(1).replace(/-/g, ' ');
        }

        function initCheckboxSync() {
            // Select All Logic
            document.getElementById('selectAll').onclick = function() {
                document.querySelectorAll('#permissionsGrid .form-check-input').forEach(chk => {
                    chk.checked = this.checked;
                });
                updateCounter();
            };

            // Parent/Child Sync
            document.querySelectorAll('.parent-chk').forEach(parent => {
                parent.onchange = function() {
                    const mid = this.dataset.mid;
                    document.querySelectorAll(`.child-of-${mid}`).forEach(child => {
                        child.checked = this.checked;
                    });
                    updateCounter();
                };
            });

            document.querySelectorAll('.child-chk').forEach(child => {
                child.onchange = function() {
                    const mid = this.dataset.parent;
                    const parent = document.getElementById(`module_${mid}`);
                    if (this.checked) parent.checked = true;
                    updateCounter();
                };
            });
        }

        function updateCounter() {
            const checked = document.querySelectorAll('#permissionsGrid input[type="checkbox"]:checked').length;
            document.getElementById('permCounter').textContent = `${checked} selected`;
        }

        function prepareAddRole() {
            document.getElementById('modalTitle').textContent = 'Add New Role';
            document.getElementById('roleId').value = '';
            document.getElementById('roleName').value = '';
            document.getElementById('targetUserWrapper').style.display = 'none';
            document.getElementById('targetUserSelect').value = '';
            renderPermissionGrid([]);
            roleModal.show();
        }

        async function editRole(id, name) {
            document.getElementById('modalTitle').textContent = `Manage Permissions: ${name}`;
            document.getElementById('roleId').value = id;
            document.getElementById('roleName').value = name;
            
            // Show target user selection ONLY for Doctor role
            const wrapper = document.getElementById('targetUserWrapper');
            if (name === 'Doctor') {
                wrapper.style.display = 'block';
            } else {
                wrapper.style.display = 'none';
            }
            document.getElementById('targetUserSelect').value = '';

            const res = await fetch(`/roles/${id}`);
            const data = await res.json();
            renderPermissionGrid(data.permissions);
            roleModal.show();
        }

        // Handle Target User selection change
        document.getElementById('targetUserSelect').onchange = async function() {
            const userId = this.value;
            const roleId = document.getElementById('roleId').value;
            
            if (!userId) {
                // If reset to role, fetch role perms again
                const res = await fetch(`/roles/${roleId}`);
                const data = await res.json();
                renderPermissionGrid(data.permissions);
                return;
            }

            // Fetch specific doctor permissions
            permissionsGrid.innerHTML = '<div class="col-12 text-center py-5"><span class="spinner-border text-primary"></span><p class="mt-2">Loading user permissions...</p></div>';
            const res = await fetch(`/super-admin/doctor/${userId}/permissions`);
            const data = await res.json();
            if (data.success) {
                renderPermissionGrid(data.user.permissions);
            }
        };

        document.getElementById('roleForm').onsubmit = async function(e) {
            e.preventDefault();
            const id = document.getElementById('roleId').value;
            const url = id ? `/roles/${id}` : '{{ route("roles.store") }}';
            const method = id ? 'PUT' : 'POST';
            const btn = document.getElementById('saveRoleBtn');
            
            const perms = [];
            this.querySelectorAll('input[name="permissions[]"]:checked').forEach(c => perms.push(c.value));

            const data = {
                name: document.getElementById('roleName').value,
                target_user_id: document.getElementById('targetUserSelect').value,
                permissions: perms
            };

            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            btn.disabled = false;
            btn.textContent = 'Save Changes';

            if (result.success) {
                roleModal.hide();
                Swal.fire({ title: 'Success', text: result.message, icon: 'success' }).then(() => location.reload());
            } else {
                Swal.fire({ title: 'Error', text: result.message || 'Error occurred', icon: 'error' });
            }
        };

        document.addEventListener('DOMContentLoaded', initPermissions);
    </script>
</body>
</html>
