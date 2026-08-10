@extends('layouts.layout-doctor')
@section('title', 'Doctor || Follow Ups')
@section('content')
    <div class="main-wrapper">
        <div class="page-wrapper">
            <div class="content">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="fw-bold color-doctorrx mb-0">Follow-up Patients</h4>
                    <div class="d-flex gap-2">
                        <div class="d-flex align-items-center me-2">
                            <span class="text-muted small me-2">Filter by Follow-up Date:</span>
                            <input type="date" id="filterDate" class="form-control form-control-sm"
                                value="{{ request('date') }}" style="width: 150px;">
                        </div>
                        <button id="filterBtn" class="btn btn-primary btn-sm px-3">Filter</button>
                        @if(request('date'))
                            <a href="{{ route('doctor.follow-ups', ['status' => $status]) }}" class="btn btn-outline-secondary btn-sm px-3">Clear</a>
                        @endif
                    </div>
                </div>

                {{-- Tab Navigation --}}
                <ul class="nav nav-tabs nav-tabs-solid nav-justified mb-4 border-0 bg-light p-1 rounded-3">
                    <li class="nav-item">
                        <a class="nav-link {{ $status == 'pending' ? 'active shadow-sm' : 'text-muted' }} rounded-3 fw-bold" 
                           href="{{ route('doctor.follow-ups', ['status' => 'pending', 'date' => request('date')]) }}">
                            <i class="ti ti-clock me-1"></i> Active Follow-ups
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link {{ $status == 'addressed' ? 'active shadow-sm' : 'text-muted' }} rounded-3 fw-bold" 
                           href="{{ route('doctor.follow-ups', ['status' => 'addressed', 'date' => request('date')]) }}">
                            <i class="ti ti-checks me-1"></i> Addressed Patients
                        </a>
                    </li>
                </ul>

                <div class="card shadow-sm border-0">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover table-center mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Sr.</th>
                                        <th>Patient Name</th>
                                        <th>Contact</th>
                                        <th>Target Date</th>
                                        <th>Instructions & Comments</th>
                                        <th>Follow-up Notes</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @forelse($followUps as $index => $consult)
                                        @php
                                            $rawFollowUp = $consult->follow_up_date;
                                            $calculatedDate = '---';
                                            $instructionText = $rawFollowUp;

                                            if (preg_match('/\((.*?)\)/', $rawFollowUp, $matches)) {
                                                $calculatedDate = \Carbon\Carbon::parse($matches[1])->format('d M Y');
                                                $instructionText = trim(str_replace($matches[0], '', $rawFollowUp));
                                            } else {
                                                if (stripos($rawFollowUp, '1 Week') !== false) {
                                                    $calculatedDate = $consult->created_at->addWeek()->format('d M Y');
                                                } elseif (stripos($rawFollowUp, '2 Days') !== false) {
                                                    $calculatedDate = $consult->created_at->addDays(2)->format('d M Y');
                                                } elseif (stripos($rawFollowUp, '2 Weeks') !== false) {
                                                    $calculatedDate = $consult->created_at->addWeeks(2)->format('d M Y');
                                                } elseif (stripos($rawFollowUp, '1 Month') !== false) {
                                                    $calculatedDate = $consult->created_at->addMonth()->format('d M Y');
                                                }
                                            }
                                        @endphp
                                        <tr>
                                            <td>{{ $followUps->firstItem() + $index }}</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="avatar avatar-sm me-2">
                                                        <img src="{{ $consult->patient->profile_image ? asset('storage/' . $consult->patient->profile_image) : asset('assets-doctor/img/profiles/avatar-01.jpg') }}"
                                                            class="rounded-circle" alt="User Image">
                                                    </div>
                                                    <div>
                                                        <h6 class="text-dark fw-bold mb-0">
                                                            {{ $consult->patient->name ?? 'N/A' }}</h6>
                                                        <small class="text-muted">ID:
                                                            {{ $consult->patient->registration_id ?? '---' }}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="d-flex flex-column">
                                                    <span><i class="ti ti-phone me-1"></i>
                                                        {{ $consult->patient->phone ?? 'N/A' }}</span>
                                                    @if($consult->patient->phone)
                                                        <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $consult->patient->phone) }}"
                                                            target="_blank" class="text-success small fw-bold">
                                                            <i class="fab fa-whatsapp me-1"></i> WhatsApp
                                                        </a>
                                                    @endif
                                                </div>
                                            </td>
                                            <td>
                                                <div class="badge bg-soft-info text-info fs-12 p-2">
                                                    <i class="ti ti-calendar me-1"></i> {{ $calculatedDate }}
                                                </div>
                                                <div class="mt-1 small text-muted">Last consulted: {{ $consult->created_at->format('d M Y') }}</div>
                                            </td>
                                            <td style="max-width: 250px; white-space: normal;">
                                                <div class="d-flex flex-column">
                                                    <span class="small text-primary fw-bold mb-1">
                                                        <i class="ti ti-info-circle me-1"></i>{{ $instructionText }}
                                                    </span>
                                                    @if($consult->follow_up_comment)
                                                        <div class="bg-light p-2 rounded small" style="border-left: 3px solid #198754;">
                                                            <strong>Update:</strong> {{ $consult->follow_up_comment }}
                                                        </div>
                                                    @endif
                                                </div>
                                            </td>
                                            <td style="max-width: 200px; white-space: normal;">
                                                <small class="text-muted">{{ $consult->additional_notes ?? '---' }}</small>
                                            </td>
                                            <td>
                                                <div class="d-flex gap-1">
                                                    @can('appointments-create')
                                                        <a href="{{ route('book-appointment', ['patient_id' => $consult->patient_id]) }}" class="btn btn-sm btn-outline-primary" title="Book Appointment">
                                                            <i class="ti ti-calendar-plus"></i>
                                                        </a>
                                                    @endcan
                                                    @if($status == 'pending')
                                                        @can('follow-up-status-update')
                                                            <button class="btn btn-sm btn-outline-success mark-addressed"
                                                                data-id="{{ $consult->id }}" title="Mark Addressed">
                                                                <i class="ti ti-check"></i>
                                                            </button>
                                                        @endcan
                                                    @else
                                                        <span class="badge bg-success py-2"><i class="ti ti-check me-1"></i> Addressed</span>
                                                    @endif
                                                </div>
                                            </td>
                                        </tr>
                                    @empty
                                        <tr>
                                            <td colspan="7" class="text-center py-5 text-muted">
                                                <i class="ti ti-calendar-off fs-40 mb-2"></i>
                                                <p>No records found in this category.</p>
                                            </td>
                                        </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>
                    </div>
                    @if($followUps->hasPages())
                        <div class="card-footer bg-white">
                            {{ $followUps->appends(['status' => $status, 'date' => request('date')])->links() }}
                        </div>
                    @endif
                </div>
            </div>
        </div>
        @include('doctor.inc.footer')
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        $(document).ready(function () {
            $('#filterBtn').on('click', function () {
                const date = $('#filterDate').val();
                let url = "{{ route('doctor.follow-ups') }}?status={{ $status }}";
                if(date) url += "&date=" + date;
                window.location.href = url;
            });

            $('.mark-addressed').on('click', function () {
                const id = $(this).data('id');
                const btn = $(this);

                Swal.fire({
                    title: 'Mark as Addressed',
                    text: 'Add any follow-up notes or comments (Optional):',
                    input: 'textarea',
                    inputPlaceholder: 'e.g., Patient called, coming for visit tomorrow...',
                    showCancelButton: true,
                    confirmButtonText: '<i class="ti ti-check me-1"></i> Mark Addressed',
                    confirmButtonColor: '#0c4843',
                    cancelButtonColor: '#6e7d88',
                    showLoaderOnConfirm: true,
                    preConfirm: (comment) => {
                        return $.ajax({
                            url: "{{ url('follow-ups') }}/" + id + "/status",
                            type: 'POST',
                            data: {
                                _token: "{{ csrf_token() }}",
                                status: 'addressed',
                                comment: comment
                            }
                        }).catch(error => {
                            Swal.showValidationMessage(`Request failed: ${error.statusText}`);
                        });
                    },
                    allowOutsideClick: () => !Swal.isLoading()
                }).then((result) => {
                    if (result.isConfirmed && result.value.success) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Patient marked as addressed.',
                            icon: 'success',
                            confirmButtonColor: '#0c4843',
                            timer: 2000
                        });
                        btn.closest('tr').fadeOut(500, function () {
                            $(this).remove();
                        });
                    }
                });
            });
        });
    </script>
@endsection