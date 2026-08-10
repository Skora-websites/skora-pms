<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>Super Admin || Support Tickets</title>
    @include('super-admin.inc.header-links')
    <style>
        .page-header-color { color: #0e606e; }
        .ticket-card { transition: all 0.2s ease; border-radius: 12px; }
        .ticket-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(14, 96, 110, 0.1); border-color: #0e606e; }
        .badge-open { background-color: #e8fadf; color: #71dd37; }
        .badge-closed { background-color: #ffe0e0; color: #ff3e1d; }
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
                                <h4 class="mb-1 page-header-color fw-bold">Support Tickets</h4>
                                <p class="text-muted mb-0">Manage and reply to support requests from all users.</p>
                            </div>
                        </div>

                        @if(session('success'))
                            <div class="alert alert-success alert-dismissible" role="alert">
                                {{ session('success') }}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        @endif

                        <div class="card">
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Ticket ID</th>
                                                <th>User Name</th>
                                                <th>Subject</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @forelse($tickets as $ticket)
                                                <tr>
                                                    <td><strong>#{{ str_pad($ticket->id, 5, '0', STR_PAD_LEFT) }}</strong></td>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <div class="avatar avatar-sm me-2">
                                                                <span class="avatar-initial rounded-circle bg-label-primary"><i class="ri-user-line"></i></span>
                                                            </div>
                                                            <span class="fw-medium">{{ $ticket->user->name ?? 'Unknown' }}</span>
                                                        </div>
                                                    </td>
                                                    <td>{{ Str::limit($ticket->subject, 40) }}</td>
                                                    <td>
                                                        <span class="badge rounded-pill {{ $ticket->status === 'open' ? 'badge-open' : 'badge-closed' }}">
                                                            {{ ucfirst($ticket->status) }}
                                                        </span>
                                                    </td>
                                                    <td>{{ $ticket->created_at->format('M d, Y') }}</td>
                                                    <td>
                                                        <a href="{{ route('super-admin.supports.show', $ticket->id) }}" class="btn btn-sm btn-primary rounded-pill">
                                                            <i class="ri-eye-line me-1"></i> View Ticket
                                                        </a>
                                                    </td>
                                                </tr>
                                            @empty
                                                <tr>
                                                    <td colspan="6" class="text-center py-4 text-muted">
                                                        <i class="ri-inbox-archive-line fs-2 mb-2 d-block"></i>
                                                        No support tickets found.
                                                    </td>
                                                </tr>
                                            @endforelse
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                    @include('super-admin.inc.footer')
                </div>
            </div>
        </div>
    </div>
    @include('super-admin.inc.footer-links')
</body>
</html>
