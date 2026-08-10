@if($clinics->isEmpty())
<div class="col-12">
    <div class="card">
        <div class="card-body text-center py-5">
            <i class="ti ti-building-hospital fs-48 text-muted mb-3"></i>
            <h5 class="text-muted">No Clinics Found</h5>
            <p class="text-muted">Add your first clinic to start managing schedules.</p>
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addClinicModal">
                <i class="ti ti-plus me-1"></i> Add First Clinic
            </button>
        </div>
    </div>
</div>
@else
@foreach($clinics as $clinic)
<div class="card clinic-card mb-4">
    <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex align-items-center gap-2">
                <h5 class="card-title fw-bold text-dark mb-0">{{ $clinic->clinic_name }}</h5>
                <button class="btn btn-sm btn-link p-0 text-info clinic-help-btn" 
                        data-clinic-name="{{ $clinic->clinic_name }}"
                        data-bs-toggle="modal" 
                        data-bs-target="#helpGuideModal"
                        title="इस क्लिनिक के लिए मदद / Help for this clinic">
                    <i class="ti ti-help-circle fs-5"></i>
                </button>
            </div>
            <div class="dropdown">
                <button class="btn btn-sm btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="ti ti-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu">
                    <li>
                        <a class="dropdown-item edit-clinic" href="#" data-id="{{ $clinic->id }}">
                            <i class="ti ti-edit me-2"></i>Edit Clinic
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item text-danger delete-clinic" href="#" data-id="{{ $clinic->id }}">
                            <i class="ti ti-trash me-2"></i>Delete Clinic
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-2">
                <a href="javascript:void(0);" class="avatar avatar-xxxl patient-avatar me-2 flex-shrink-0">
                    @if(!empty($clinic->clinic_logo) && file_exists(public_path($clinic->clinic_logo)))
                        <img src="{{ asset($clinic->clinic_logo) }}" class="img-fluid rounded" style="max-height:120px;" alt="Clinic Logo">
                    @else
                        @php
                            $initials = strtoupper(substr($clinic->clinic_name, 0, 1) . (strpos($clinic->clinic_name, ' ') ? substr(strstr($clinic->clinic_name, ' '), 1, 1) : ''));
                        @endphp
                        <div class="rounded bg-light text-dark d-flex align-items-center justify-content-center" 
                            style="width:120px; height:120px; font-size:36px; font-weight:bold;">
                            {{ $initials }}
                        </div>
                    @endif
                </a>
            </div>
            
            <div class="col-md-8 ">
                <p class="text-black mb-2">
                    <i class="ti ti-map-pin me-2"></i>
                    @if(str_contains($clinic->address, 'Map Location:'))
                        Location: {{ $clinic->clinic_name }}
                    @else
                        {{ Str::limit($clinic->address, 50) }}
                    @endif
                </p>
                <p class="text-black mb-2">
                    <i class="ti ti-phone me-2"></i>{{ $clinic->phone }}
                </p>
                <p class="text-black mb-3">
                    <i class="ti ti-currency-rupee me-2"></i>Fee: ₹{{ $clinic->consultation_fee }}
                </p>

                <div class="availability-section">
                    <h6 class="fw-semibold mb-2">Weekly Availability</h6>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        @php
                            $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                            $dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        @endphp
                        @foreach($days as $index => $day)
                            @php
                                $hasSchedule = $clinic->schedules->where('day_of_week', $day)->where('is_active', true)->count() > 0;
                            @endphp
                            <div class="text-center">
                                <span class="d-block availability-dot {{ $hasSchedule ? 'available' : 'unavailable' }}"></span>
                                <small class="text-muted">{{ $dayLabels[$index] }}</small>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>

            <div class="col-md-2">
                <div class="d-flex flex-column gap-2">
                    <button class="btn btn-outline-primary view-clinic w-100" data-id="{{ $clinic->id }}">
                        <i class="ti ti-eye me-1"></i> View Schedule
                    </button>
                    {{-- <button class="btn btn-outline-success add-schedule w-100" data-bs-toggle="modal" data-bs-target="#addScheduleModal">
                        <i class="ti ti-plus me-1"></i> Add Schedule
                    </button> --}}
                </div>

                @if($clinic->schedules->count() > 0)
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="ti ti-calendar me-1"></i>
                        {{ $clinic->schedules->where('is_active', true)->count() }} active schedule(s)
                    </small>
                </div>
                @endif
            </div>
        </div>
        
        @if($clinic->schedules->where('is_active', true)->count() > 0)
        <div class="mt-3 pt-3 border-top">
            <h6 class="fw-semibold mb-2">Weekly Schedule</h6>
            <div class="d-flex flex-wrap gap-2">
                @php
                    $allSchedules = $clinic->schedules->where('is_active', true)->sortBy('day_of_week');
                    $dayOrder = ['monday' => 1, 'tuesday' => 2, 'wednesday' => 3, 'thursday' => 4, 'friday' => 5, 'saturday' => 6, 'sunday' => 7];
                    $allSchedules = $allSchedules->sortBy(function($item) use ($dayOrder) {
                        return $dayOrder[$item->day_of_week];
                    });
                    
                    $dayShort = [
                        'monday' => 'Mon',
                        'tuesday' => 'Tue',
                        'wednesday' => 'Wed',
                        'thursday' => 'Thu',
                        'friday' => 'Fri',
                        'saturday' => 'Sat',
                        'sunday' => 'Sun'
                    ];
                @endphp
                
                @foreach($allSchedules as $schedule)
                    <span class="badge bg-light text-dark p-2 d-inline-flex align-items-center gap-1" style="font-size: 12px;">
                        <span class="fw-bold">{{ $dayShort[$schedule->day_of_week] }}:</span>
                        @if($schedule->is_24_hours)
                            <span class="text-success">24 Hours</span>
                        @else
                            <span>{{ $schedule->start_time }} – {{ $schedule->end_time }}</span>
                        @endif
                        <button class="btn btn-sm p-0 ms-1 edit-schedule" data-id="{{ $schedule->id }}" title="Edit">
                            <i class="ti ti-edit text-success" style="font-size: 14px;"></i>
                        </button>
                    </span>
                @endforeach
            </div>
        </div>
        @else
        <div class="mt-3 pt-3 border-top">
            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-danger rounded-pill px-3 py-2">
                    <i class="ti ti-calendar-off me-1"></i>
                    No Schedules Added
                </span>
                <small class="text-muted">Click Add Schedule to create</small>
            </div>
        </div>
        @endif
    </div>
</div>
@endforeach
@endif

<script>
$(document).ready(function() {
    $(document).on('click', '.view-clinic', function() {
        const clinicId = $(this).data('id');
        
        $.ajax({
            url: '/schedule/' + clinicId,
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    showDetailedSchedule(response);
                }
            },
            error: function() {
                showAlert('Error loading schedule details', 'error');
            }
        });
    });
    
    function showDetailedSchedule(response) {
        const clinic = response.clinic;
        const schedules = response.schedules || {};
        
        let html = `
            <div class="modal fade" id="detailedScheduleModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="ti ti-calendar-stats me-2"></i>
                                ${clinic.clinic_name} - Complete Schedule
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
        `;
        
        let totalSchedules = 0;
        let totalHours = 0;
        let totalMinutes = 0;
        
        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = {'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'};
        const dayShort = {'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed', 'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun'};
        
        daysOrder.forEach(function(day) {
            const daySchedules = schedules[day] || [];
            if (daySchedules.length > 0) {
                totalSchedules += daySchedules.length;
                
                html += `<h6 class="fw-bold mt-3 mb-2 text-primary">${dayNames[day]}</h6>`;
                
                daySchedules.forEach(function(schedule) {
                    totalHours += schedule.duration_hours;
                    totalMinutes += schedule.duration_minutes;
                    
                    const sessionClass = schedule.session_type;
                    html += `
                        <div class="d-flex align-items-center mb-2 p-2 bg-light rounded">
                            <span class="fw-bold" style="min-width: 45px;">${dayShort[day]}:</span>
                            <span class="mx-2">
                                ${schedule.is_24_hours ? 
                                    '<span class="badge bg-success">24 Hours</span>' : 
                                    `${schedule.start_time} – ${schedule.end_time}`}
                            </span>
                            <span class="text-muted small ms-2">(${schedule.duration_hours}h ${schedule.duration_minutes}m)</span>
                            <span class="badge ms-2 
                                ${sessionClass === 'morning' ? 'bg-warning text-dark' : 
                                  sessionClass === 'afternoon' ? 'bg-orange text-white' :
                                  sessionClass === 'evening' ? 'bg-info text-white' :
                                  'bg-dark text-white'}">
                                ${schedule.session_type}
                            </span>
                            <div class="ms-auto">
                                <button class="btn btn-sm p-0 me-2 edit-schedule" data-id="${schedule.id}" title="Edit">
                                    <i class="ti ti-edit text-success"></i>
                                </button>
                                <button class="btn btn-sm p-0 delete-schedule" data-id="${schedule.id}" title="Delete">
                                    <i class="ti ti-trash text-danger"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
        });
        
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;
        html += `
            <div class="mt-4 p-3 bg-light rounded">
                <div class="row">
                    <div class="col-md-4">
                        <div class="text-center">
                            <small class="text-muted">Total Schedules</small>
                            <h3 class="text-primary mb-0">${totalSchedules}</h3>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center">
                            <small class="text-muted">Total Hours</small>
                            <h3 class="text-success mb-0">${totalHours}h ${totalMinutes}m</h3>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center">
                            <small class="text-muted">Working Days</small>
                            <h3 class="text-info mb-0">${Object.keys(schedules).length}</h3>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        html += `
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="window.print()">
                                <i class="ti ti-printer me-1"></i> Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#detailedScheduleModal').remove();
        $('body').append(html);
        $('#detailedScheduleModal').modal('show');
    }
});
</script>