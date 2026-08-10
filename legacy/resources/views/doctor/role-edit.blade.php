@extends('layouts.layout-doctor')

@section('title', 'Doctor || ' . ($role->id ? 'Edit Role' : 'Create Role'))

@section('content')
<style>
.perm-card {
    border: 1px solid #eaedf1;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    transition: all 0.3s ease;
    overflow: hidden;
    height: 100%;
}
.perm-card:hover {
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    border-color: #d1d9e6;
    transform: translateY(-3px);
}
.perm-card-header {
    background: #f8fafc;
    padding: 16px 20px;
    border-bottom: 1px solid #eaedf1;
    display: flex;
    align-items: center;
    gap: 12px;
}
/* Enhanced Custom Checkboxes */
.form-check-input {
    width: 22px;
    height: 22px;
    border-radius: 6px !important;
    border: 2px solid #cbd5e1;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: none !important;
    margin-top: 0;
}
.form-check-input:checked {
    background-color: #0ea5e9;
    border-color: #0ea5e9;
}
.form-check-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 0.25rem rgba(14, 165, 233, 0.25) !important;
}

.perm-card-header .module-title {
    font-weight: 700;
    font-size: 16px;
    color: #0f172a;
    text-transform: capitalize;
    margin-bottom: 0;
    cursor: pointer;
}
.perm-card-body {
    padding: 16px 20px;
}
.perm-item-row {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    border-radius: 10px;
    margin-bottom: 6px;
    transition: all 0.2s ease;
    cursor: pointer;
    border: 1px solid transparent;
}
.perm-item-row:hover {
    background: #f1f5f9;
    border-color: #e2e8f0;
}
.perm-item-row label {
    cursor: pointer;
    margin-left: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #475569;
    text-transform: capitalize;
    width: 100%;
    margin-bottom: 0;
}
.page-top-bar {
    background: #fff;
    border: 1px solid #eaedf1;
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}
.page-top-bar h4 {
    font-weight: 800;
    color: #0f172a;
    margin: 0;
}
.page-top-bar .breadcrumb-text {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
}
.btn-save-role {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    border: none;
    color: #fff;
    padding: 12px 30px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
}
.btn-save-role:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4);
    color: #fff;
}
.btn-back {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #475569;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.3s ease;
}
.btn-back:hover {
    background: #e2e8f0;
    color: #0f172a;
}
.select-all-bar {
    background: #ffffff;
    border: 1px solid #eaedf1;
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    transition: all 0.3s ease;
}
.select-all-bar:hover {
    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
    border-color: #d1d9e6;
}
.status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 14px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.status-badge.checked {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
}
.status-badge.unchecked {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
}
</style>

<div class="main-wrapper">
    <div class="page-wrapper">
        <div class="content">

            <form id="roleForm" method="POST" action="{{ $role->id ? '/roles/' . $role->id : '/roles' }}">
                @csrf
                @if($role->id)
                    @method('PUT')
                @endif

                {{-- Top Bar --}}
                <div class="page-top-bar d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h4><i class="ti ti-shield-lock me-2 text-primary"></i>{{ $role->id ? 'Edit Role' : 'Create New Role' }}</h4>
                        <span class="breadcrumb-text">
                            <a href="{{ route('roles-permission') }}" class="text-primary text-decoration-none">Roles & Permissions</a>
                            &nbsp;/&nbsp; {{ $role->id ? $role->name : 'New Role' }}
                        </span>
                    </div>
                    <div class="d-flex gap-2">
                        <a href="{{ route('roles-permission') }}" class="btn btn-back">
                            <i class="ti ti-arrow-left me-1"></i> Back
                        </a>
                        <button type="submit" class="btn btn-save-role">
                            <i class="ti ti-device-floppy me-1"></i> Save Role
                        </button>
                    </div>
                </div>

                {{-- Role Name --}}
                <div class="page-top-bar" style="padding: 16px 24px;">
                    <label class="form-label fw-bold mb-1">Role Name <span class="text-danger">*</span></label>
                    <input type="text" name="name" class="form-control form-control-lg bg-light" 
                           value="{{ old('name', $role->name) }}" 
                           placeholder="e.g. Receptionist, Nurse, Lab Assistant" required
                           {{ $role->id ? 'readonly' : '' }}
                           style="border-radius: 10px; font-size: 15px;">
                </div>

                {{-- Select All --}}
                <div class="select-all-bar">
                    <input type="checkbox" class="form-check-input" id="selectAllPerms">
                    <label for="selectAllPerms" class="fw-bold mb-0" style="cursor:pointer; font-size: 15px; color: #0f172a;">
                        Select / Deselect All Permissions
                    </label>
                    <span class="ms-auto status-badge unchecked" id="permCounter">0 selected</span>
                </div>

                {{-- Permissions Grid --}}
                <div class="row g-4">
                    @foreach($modules as $module)
                    <div class="col-lg-6 col-xl-4">
                        <div class="perm-card">
                            <div class="perm-card-header">
                                <input type="checkbox" class="form-check-input parent-perm" 
                                       id="parent_{{ $module['id'] }}"
                                       data-module="{{ $module['id'] }}"
                                       name="permissions[]" 
                                       value="{{ $module['name'] }}"
                                       {{ in_array($module['name'], $rolePermissions) ? 'checked' : '' }}>
                                <label for="parent_{{ $module['id'] }}" class="module-title mb-0">
                                    <i class="ti ti-{{ $module['icon'] ?? 'apps' }} me-1 text-primary"></i>
                                    {{ str_replace('-', ' ', $module['name']) }}
                                </label>
                                <span class="ms-auto status-badge {{ in_array($module['name'], $rolePermissions) ? 'checked' : 'unchecked' }}" 
                                      id="badge_{{ $module['id'] }}">
                                    {{ in_array($module['name'], $rolePermissions) ? '✓' : '—' }}
                                </span>
                            </div>
                            <div class="perm-card-body">
                                @foreach($module['permissions'] as $perm)
                                <div class="perm-item-row">
                                    <input type="checkbox" class="form-check-input child-perm child-of-{{ $module['id'] }}" 
                                           id="perm_{{ $perm['id'] }}"
                                           data-parent="{{ $module['id'] }}"
                                           name="permissions[]" 
                                           value="{{ $perm['name'] }}"
                                           {{ in_array($perm['name'], $rolePermissions) ? 'checked' : '' }}>
                                    <label for="perm_{{ $perm['id'] }}">
                                        @php
                                            $permName = $perm['name'];
                                            $prefix = $module['name'] . '-';
                                            if (str_starts_with($permName, $prefix)) {
                                                $permName = substr($permName, strlen($prefix));
                                            }
                                            echo ucwords(str_replace('-', ' ', $permName));
                                        @endphp
                                    </label>
                                </div>
                                @endforeach
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>

                {{-- Bottom Save --}}
                <div class="d-flex justify-content-end gap-2 mt-3 mb-4">
                    <a href="{{ route('roles-permission') }}" class="btn btn-back">
                        <i class="ti ti-arrow-left me-1"></i> Back
                    </a>
                    <button type="submit" class="btn btn-save-role">
                        <i class="ti ti-device-floppy me-1"></i> Save Role
                    </button>
                </div>

            </form>

        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {

    updateCounter();

    // Parent checkbox logic
    document.querySelectorAll('.parent-perm').forEach(function(el) {
        el.addEventListener('change', function() {
            var moduleId = this.getAttribute('data-module');
            document.querySelectorAll('.child-of-' + moduleId).forEach(function(child) {
                child.checked = el.checked;
            });
            updateBadge(moduleId, el.checked);
            updateCounter();
        });
    });

    // Child checkbox logic
    document.querySelectorAll('.child-perm').forEach(function(el) {
        el.addEventListener('change', function() {
            var parentId = this.getAttribute('data-parent');
            var anyChecked = document.querySelectorAll('.child-of-' + parentId + ':checked').length > 0;
            var parentEl = document.querySelector('#parent_' + parentId);
            if (parentEl) parentEl.checked = anyChecked;
            updateBadge(parentId, anyChecked);
            updateCounter();
        });
    });

    // Select All
    document.getElementById('selectAllPerms').addEventListener('change', function() {
        var checked = this.checked;
        document.querySelectorAll('.parent-perm, .child-perm').forEach(function(el) {
            el.checked = checked;
        });
        document.querySelectorAll('.parent-perm').forEach(function(el) {
            updateBadge(el.getAttribute('data-module'), checked);
        });
        updateCounter();
    });

    // Form submit via fetch
    document.getElementById('roleForm').addEventListener('submit', function(e) {
        e.preventDefault();
        var form = this;
        var formData = new FormData(form);
        
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
        .then(function(res) { 
            if (!res.ok) {
                return res.json().then(data => { throw new Error(data.message || 'Server error'); });
            }
            return res.json(); 
        })
        .then(function(res) {
            if (res.success) {
                window.location.href = '/roles-permission';
            } else {
                alert(res.message || 'Error saving role');
            }
        })
        .catch(function(err) {
            console.error(err);
            alert('Error saving role: ' + err.message);
        });
    });
});

function updateBadge(moduleId, isChecked) {
    var badge = document.getElementById('badge_' + moduleId);
    if (badge) {
        badge.textContent = isChecked ? '✓' : '—';
        badge.className = 'ms-auto status-badge ' + (isChecked ? 'checked' : 'unchecked');
    }
}

function updateCounter() {
    var total = document.querySelectorAll('.perm-checkbox, .parent-perm, .child-perm').length;
    var checked = document.querySelectorAll('.parent-perm:checked, .child-perm:checked').length;
    var counter = document.getElementById('permCounter');
    if (counter) {
        counter.textContent = checked + ' selected';
        counter.className = 'ms-auto status-badge ' + (checked > 0 ? 'checked' : 'unchecked');
    }
    
    // Update select-all checkbox
    var selectAll = document.getElementById('selectAllPerms');
    if (selectAll) {
        var allPerms = document.querySelectorAll('.parent-perm, .child-perm');
        var allChecked = document.querySelectorAll('.parent-perm:checked, .child-perm:checked');
        selectAll.checked = allPerms.length === allChecked.length && allPerms.length > 0;
    }
}
</script>
@endsection
