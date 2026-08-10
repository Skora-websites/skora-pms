@extends('layouts.layout-doctor')

@section('title', 'Doctor || Roles & Permissions')

@section('content')
<style>
.role-card-wrapper {
    border: 1px solid #e8e8e8;
    border-radius: 14px;
    background: #fff;
    overflow: hidden;
}
.role-row {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.15s;
}
.role-row:last-child {
    border-bottom: none;
}
.role-row:hover {
    background: #fafbfc;
}
.role-name {
    font-weight: 600;
    font-size: 15px;
    color: #222;
}
.system-badge {
    display: inline-block;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 20px;
    background: #fff3cd;
    color: #856404;
    margin-left: 8px;
}
.perm-count {
    display: inline-block;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
    background: #e8f4fd;
    color: #0d6efd;
}
.page-header-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 20px;
}
.btn-add-role {
    background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
    border: none;
    color: #fff;
    padding: 10px 24px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(13, 110, 253, 0.25);
}
.btn-add-role:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(13, 110, 253, 0.35);
    color: #fff;
}
.action-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e0e0e0;
    background: #fff;
    color: #555;
    transition: all 0.2s;
    cursor: pointer;
    font-size: 16px;
}
.action-btn:hover {
    background: #f0f2f5;
    color: #222;
}
.action-btn.danger:hover {
    background: #fee;
    color: #dc3545;
    border-color: #f5c6cb;
}
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #888;
}
.empty-state i {
    font-size: 48px;
    color: #ddd;
    margin-bottom: 12px;
}
</style>

<div class="main-wrapper">
    <div class="page-wrapper">
        <div class="content">

            {{-- Header --}}
            <div class="page-header-card d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <h4 class="fw-bold text-dark mb-1">
                        <i class="ti ti-shield-lock me-2 text-primary"></i>Roles & Permissions
                    </h4>
                    <small class="text-muted">Create roles and assign module-level permissions to your staff.</small>
                </div>
                <a href="{{ route('roles.create') }}" class="btn btn-add-role">
                    <i class="ti ti-plus me-1"></i> Add Role
                </a>
            </div>

            {{-- Success/Error Messages --}}
            @if(session('success'))
            <div class="alert alert-success alert-dismissible fade show" role="alert" style="border-radius:10px;">
                <i class="ti ti-circle-check me-1"></i> {{ session('success') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
            @endif

            {{-- Roles List --}}
            <div class="role-card-wrapper">
                {{-- Header Row --}}
                <div class="role-row" style="background: #f8f9fb; font-weight: 600; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
                    <div style="flex: 1;">Role Name</div>
                    <div style="width: 150px; text-align: center;">Permissions</div>
                    <div style="width: 120px; text-align: center;">Actions</div>
                </div>

                @forelse($roles as $role)
                <div class="role-row">
                    <div style="flex: 1;">
                        <span class="role-name">{{ $role->name }}</span>
                        @if(in_array($role->name, ['Super Admin', 'Doctor']))
                            <span class="system-badge">System Role</span>
                        @endif
                    </div>
                    <div style="width: 150px; text-align: center;">
                        <span class="perm-count">{{ $role->permissions_count }} Permissions</span>
                    </div>
                    <div style="width: 120px; text-align: center;">
                        @if(!in_array($role->name, ['Super Admin', 'Doctor']) && !(auth()->user()->hasRole($role->name) && auth()->user()->role !== 'super_admin'))
                        <a href="{{ route('roles.edit', $role->id) }}" class="action-btn" title="Edit Role">
                            <i class="ti ti-edit"></i>
                        </a>
                        <button class="action-btn danger ms-1" onclick="deleteRole({{ $role->id }}, '{{ $role->name }}')" title="Delete Role">
                            <i class="ti ti-trash"></i>
                        </button>
                        @else
                        <span class="text-muted" style="font-size: 12px;">—</span>
                        @endif
                    </div>
                </div>
                @empty
                <div class="empty-state">
                    <i class="ti ti-shield-off d-block"></i>
                    <p class="mb-0">No roles found. Click <strong>"+ Add Role"</strong> to get started.</p>
                </div>
                @endforelse
            </div>

        </div>
    </div>
</div>

<script>
function deleteRole(id, name) {
    Swal.fire({
        title: 'Delete Role?',
        text: `Are you sure you want to delete the role "${name}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6e7d88',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            var formData = new FormData();
            formData.append('_token', '{{ csrf_token() }}');
            formData.append('_method', 'DELETE');

            fetch('{{ url("roles") }}/' + id, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(function(res) { return res.json(); })
            .then(function(res) {
                if (res.success) {
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Role has been removed.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire('Error!', res.message || 'Error deleting role', 'error');
                }
            })
            .catch(function(err) {
                console.error(err);
                Swal.fire('Error!', 'Something went wrong.', 'error');
            });
        }
    });
}
</script>
@endsection