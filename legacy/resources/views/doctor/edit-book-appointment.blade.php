@extends('layouts.layout-doctor')
@section('title', 'Doctor || Edit Appointment')
<link rel="stylesheet" href="{{ asset('assets-doctor/css/book-appointmet.css') }}">

@section('content')
<style>
    .nav-tabs .nav-link.active, .nav-tabs .nav-item.show .nav-link {
            color: #ff8c43;
     }
    .nav-tabs .nav-link {
            white-space: nowrap;
    }
    .session-section .session-title small {
            font-size: 0.8rem;
            color: #6c757d;
    }
</style>
<div class="main-wrapper">
    <div class="page-wrapper">
        <div class="content card">
            <div class="card p-2">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="fw-bold mb-0 color-doctorrx"> 
                        <i class="ti ti-edit"></i> Edit an Appointment Slot
                    </h4>
                    <div>
                        <select id="doctorSelect" class="form-select w-auto">
                            <option selected>{{ Auth::user()->name }}</option>
                        </select>
                    </div>
                </div>

                <div class="calendar-container">
                    <div class="calendar-header">
                        <button id="prevMonth" class="btn btn-sm btn-outline-primary">&larr; Prev</button>
                        <h5 id="monthYear" class="text-center"></h5>
                        <button id="nextMonth" class="btn btn-sm btn-outline-primary">Next &rarr;</button>
                    </div>
                    <div class="date-selector" id="dateSelector"></div>
                </div>
            </div>

            <div class="container card">
                    <h5 class="mb-0"> <i class="ti ti-calendar-time"></i> Available Slots</h5>
                    <div class="slot-interval d-none">
                        <select id="slotInterval" class="form-select d-inline-block w-auto">
                            <option value="20" selected>20</option>
                        </select>
                    </div>
                </div>
                <div id="unifiedSlotsContainer" class="p-3">
                    <div id="slotSessionTabs" class="nav nav-tabs overflow-auto mb-3" role="tablist"></div>
                    <div id="slotSessionContent" class="tab-content"></div>
        </div>
    </div>

    <!-- ==================== EDIT MODAL ==================== -->
    <div class="modal fade" id="appointmentModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title fw-bold" style="color:#0e606e">Update Appointment</h4>
                    <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="appointmentForm">
                        <input type="hidden" id="editAppointmentId" value="{{ $appointment->id }}">
                        <input type="hidden" name="appointment_id" value="{{ $encryptedId }}">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">Doctor</label>
                                <input type="text" class="form-control" id="modalDoctorName" value="{{ Auth::user()->name }}" readonly>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Date & Time</label>
                                <input type="text" class="form-control" id="modalDateTime" readonly>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Visit Type</label>
                                <select class="form-select" id="caseType">
                                    <option value="clinical_visit" {{ $appointment->case_type=='clinical_visit'?'selected':'' }}>Clinical Visit</option>
                                    <option value="home_visit" {{ $appointment->case_type=='home_visit'?'selected':'' }}>Home Visit</option>
                                    <option value="online_visit" {{ $appointment->case_type=='online_visit'?'selected':'' }}>Online Visit</option>
                                    <option value="on_call_visit" {{ $appointment->case_type=='on_call_visit'?'selected':'' }}>On Call Visit</option>
                                </select>
                            </div>

                            <div class="col-md-9">
                                <label class="form-label">Patient Name / Mobile</label>
                                <input type="text" class="form-control" id="patientSearch" 
                                       value="{{ $appointment->patient->name ?? $appointment->patient_string }} - Phone: {{ $appointment->patient->phone ?? $appointment->mobile_number ?? '' }}">
                                <div class="patient-dropdown" id="patientDropdown" style="display:none"></div>
                                <input type="hidden" id="patientId" value="{{ $appointment->patient_id }}">
                            </div>

                            <div class="col-md-3">
                                <label class="form-label">Blood Group</label>
                                <select class="form-select" id="bloodGroup">
                                    <option value="">Select</option>
                                    @foreach(['A+','A-','B+','B-','AB+','AB-','O+','O-'] as $bg)
                                        <option value="{{ $bg }}" {{ $appointment->blood_group == $bg ? 'selected' : '' }}>{{ $bg }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <div class="col-md-4"><label>BP</label><input type="text" class="form-control" id="bp" value="{{ $appointment->bp }}"></div>
                            <div class="col-md-4"><label>Weight (kg)</label><input type="number" class="form-control" id="weight" value="{{ $appointment->weight }}"></div>
                            <div class="col-md-4"><label>Height (cm)</label><input type="number" class="form-control" id="height" value="{{ $appointment->height }}"></div>

                            <div class="col-12">
                                <label class="form-label">Remarks</label>
                                <textarea class="form-control" id="remarks" rows="3">{{ $appointment->remarks }}</textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="submitAppointment">Update Appointment</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div id="notificationContainer" style="position:fixed;top:20px;right:20px;z-index:9999"></div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
    $(document).ready(function(){
        const IST_OFFSET = '+05:30';
        const ymdFormatter = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'});
        const weekdayFormatter = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',weekday:'short'});
        const monthFormatter = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',month:'long'});
        const timeFormatter = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'numeric',hour12:true});

        const periods = {
            morning: { start: '05:00', end: '12:00', container: 'morningSlots', info: 'morningInfo', display: '05:00 AM - 12:00 PM' },
            afternoon: { start: '12:00', end: '17:00', container: 'afternoonSlots', info: 'afternoonInfo', display: '12:00 PM - 05:00 PM' },
            evening: { start: '17:00', end: '21:00', container: 'eveningSlots', info: 'eveningInfo', display: '05:00 PM - 09:00 PM' },
            night: { start: '21:00', end: '23:59', container: 'nightSlots', info: 'nightInfo', display: '09:00 PM - 12:00 AM' }
        };

        let slotInterval = 15;
        let selectedDate = null;
        let selectedSlot = null;
        let bookedTimes = [];
        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth();
        let editAppointmentId = $('#editAppointmentId').val();
        let currentAppointment = @json($appointment);
        const patients = @json($patient_details);

        function formatTime(date) {
            const tParts = timeFormatter.formatToParts(date);
            const hour = tParts.find(p => p.type === 'hour').value.padStart(2, '0');
            const minute = tParts.find(p => p.type === 'minute').value;
            const period = tParts.find(p => p.type === 'dayPeriod') ? tParts.find(p => p.type === 'dayPeriod').value.toUpperCase() : '';
            return `${hour}:${minute} ${period}`;
        }

        // ==================== ALL FUNCTIONS (Updated with dynamic schedules) ====================
        function parseTimeToDate(timeStr) {
            const base = selectedDate || ymdFormatter.format(new Date());
            if (!timeStr) return new Date();
            if (!timeStr.includes(':')) return new Date(`${base}T${timeStr}:00${IST_OFFSET}`);
            
            const parts = timeStr.trim().split(' ');
            let [hours, minutes] = parts[0].split(':');
            let modifier = parts.length > 1 ? parts[1].toUpperCase() : null;
            
            if (modifier) {
                if (hours === '12') hours = '00';
                if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            }
            return new Date(`${base}T${String(hours).padStart(2,'0')}:${minutes}:00${IST_OFFSET}`);
        }

        let currentSlotRequest = null;

        function formatTime(date) {
            const tParts = timeFormatter.formatToParts(date);
            const hour = tParts.find(p => p.type === 'hour').value.padStart(2, '0');
            const minute = tParts.find(p => p.type === 'minute').value;
            const period = tParts.find(p => p.type === 'dayPeriod') ? tParts.find(p => p.type === 'dayPeriod').value.toUpperCase() : '';
            return `${hour}:${minute} ${period}`;
        }

        function parseTimeToDate(timeStr) {
            const base = selectedDate || ymdFormatter.format(new Date());
            if (!timeStr) return new Date();
            if (!timeStr.includes(':')) {
                // Handle cases like "05:00" or "12"
                return new Date(`${base}T${timeStr.padStart(5, '0').includes(':') ? timeStr : timeStr + ':00'}:00${IST_OFFSET}`);
            }
            
            const parts = timeStr.trim().split(' ');
            let timePart = parts[0];
            let modifier = parts.length > 1 ? parts[1].toUpperCase() : null;
            
            let [hours, minutes] = timePart.split(':');
            
            if (modifier) {
                if (hours === '12') hours = '00';
                if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            }
            
            return new Date(`${base}T${String(hours).padStart(2,'0')}:${minutes || '00'}:00${IST_OFFSET}`);
        }

        function openModal(btn, slotTime) {
            $('.time-slot').css('border', '1px solid #6f42c1');
            btn.css('border', '2px solid #ffc107');
            selectedSlot = slotTime;
            $('#modalDateTime').val(`${selectedDate} ${slotTime}`);
            $('#appointmentModal').modal('show');
        }

        async function loadAllSlots() {
            if (!selectedDate) return;
            
            const sessionOrder = {
                morning: 0,
                afternoon: 1,
                evening: 2,
                night: 3,
                full_day: 4
            };

            function getSessionLabel(sch) {
                if (sch.is_24_hours || sch.session_type === 'full_day') {
                    return '24 Hours Open';
                }
                return sch.session_type ? sch.session_type.charAt(0).toUpperCase() + sch.session_type.slice(1) : 'Session';
            }

            function getSessionKey(sch, index) {
                const type = sch.session_type || 'full_day';
                return `${type}-${index}`;
            }

            try {
                if (currentSlotRequest) currentSlotRequest.abort();
                
                $('#slotSessionTabs').html('');
                $('#slotSessionContent').html('');
                $('#combinedSlotsList').html('');
                $('#loadingSlots').show();

                currentSlotRequest = $.get('{{ route("doctors.appointment.booked_times") }}', { 
                    date: selectedDate,
                    exclude_id: editAppointmentId,
                    clinic_id: currentAppointment.clinic_id
                });
                
                const response = await currentSlotRequest;
                currentSlotRequest = null;
                
                bookedTimes = response.booked_times || [];
                const schedules = (response.schedules || []).slice().sort((a, b) => {
                    const keyA = a.session_type || 'full_day';
                    const keyB = b.session_type || 'full_day';
                    return (sessionOrder[keyA] ?? 99) - (sessionOrder[keyB] ?? 99);
                });
                $('#loadingSlots').hide();
                
                if (schedules.length > 0) {
                    const groupedSchedules = {};
                    schedules.forEach(sch => {
                        let originalLabel = getSessionLabel(sch);
                        let normalizedLabel = originalLabel.trim().toLowerCase();
                        
                        // Force categories based on keywords to handle variations like "Morning session" or "morning "
                        if (normalizedLabel.includes('morning')) normalizedLabel = 'Morning';
                        else if (normalizedLabel.includes('afternoon')) normalizedLabel = 'Afternoon';
                        else if (normalizedLabel.includes('evening')) normalizedLabel = 'Evening';
                        else if (normalizedLabel.includes('night')) normalizedLabel = 'Night';
                        else if (normalizedLabel.includes('24 hours') || normalizedLabel.includes('full day')) normalizedLabel = '24 Hours Open';
                        else normalizedLabel = normalizedLabel.charAt(0).toUpperCase() + normalizedLabel.slice(1);

                        if (!groupedSchedules[normalizedLabel]) groupedSchedules[normalizedLabel] = [];
                        groupedSchedules[normalizedLabel].push(sch);
                    });

                    let firstTab = true;
                    Object.keys(groupedSchedules).forEach((sessionLabel) => {
                        const sessionSchedules = groupedSchedules[sessionLabel];
                        const sessionKey = 'session-' + sessionLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        
                        const tab = $(`<button class="nav-link" type="button">${sessionLabel}</button>`);
                        const section = $(`<div class="tab-pane session-pane" id="${sessionKey}"></div>`);
                        let hasAnySlots = false;

                        const allSlots = [];
                        let sessionDuration = 0;
                        let sessionGap = 0;

                        sessionSchedules.forEach((sch) => {
                            const sDuration = parseInt(sch.slot_duration) || slotInterval;
                            const sGap = parseInt(sch.gap_duration) || 0;
                            // Track first non-zero duration as default
                            if (sessionDuration === 0) sessionDuration = sDuration;

                            let currentMs = parseTimeToDate(sch.start_time).getTime();
                            let endMs = parseTimeToDate(sch.end_time).getTime();
                            if (endMs <= currentMs) endMs += 24 * 60 * 60 * 1000;

                            const nowMs = Date.now();
                            const isToday = selectedDate === ymdFormatter.format(new Date());

                            while (currentMs + (sDuration * 60 * 1000) <= endMs) {
                                const startTimeStr = formatTime(new Date(currentMs));
                                const endTimeStr = formatTime(new Date(currentMs + (sDuration * 60 * 1000)));
                                const isBooked = bookedTimes.includes(startTimeStr);
                                const isPast = isToday && currentMs < (nowMs - 2 * 60 * 1000);

                                allSlots.push({
                                    startTimeStr,
                                    endTimeStr,
                                    isBooked,
                                    isPast,
                                    ms: currentMs
                                });

                                currentMs += (sDuration + sGap) * 60 * 1000;
                                if (sDuration === 0) break;
                            }
                        });

                        if (allSlots.length > 0) {
                            // Deduplicate by start time (in case of duplicate overlapping sessions)
                            const uniqueSlotsMap = new Map();
                            allSlots.sort((a, b) => a.ms - b.ms).forEach(s => {
                                if (!uniqueSlotsMap.has(s.startTimeStr)) {
                                    uniqueSlotsMap.set(s.startTimeStr, s);
                                }
                            });

                            const sortedUniqueSlots = Array.from(uniqueSlotsMap.values()).filter(s => !s.isPast);
                            
                            if (sortedUniqueSlots.length > 0) {
                                const subSection = $(
                                    `<div class="session-section mb-4">
                                        <h6 class="session-title border-bottom pb-2 d-flex align-items-center gap-2">
                                            <i class="ti ti-clock text-primary"></i> ${sessionLabel}
                                        </h6>
                                        <div class="time-slots d-flex flex-wrap gap-2 mt-2"></div>
                                    </div>`
                                );

                                const con = subSection.find('.time-slots');
                                sortedUniqueSlots.forEach(s => {
                                    const btn = $('<button>').addClass('time-slot').text(`${s.startTimeStr} - ${s.endTimeStr}`);
                                    if (s.isPast || s.isBooked) {
                                        btn.addClass(s.isBooked ? 'booked' : 'disabled').prop('disabled', true);
                                    } else {
                                        btn.on('click', function() { openModal($(this), s.startTimeStr); });
                                    }
                                    con.append(btn);
                                });

                                section.append(subSection);
                                hasAnySlots = true;
                            }
                        }

                        if (hasAnySlots) {
                            if (firstTab) {
                                tab.addClass('active');
                                section.addClass('show active');
                                firstTab = false;
                            }

                            tab.on('click', function() {
                                $('#slotSessionTabs .nav-link').removeClass('active');
                                $(this).addClass('active');
                                $('.session-pane').removeClass('show active');
                                section.addClass('show active');
                            });

                            $('#slotSessionTabs').append($('<li class="nav-item me-2"></li>').append(tab));
                            $('#slotSessionContent').append(section);
                        }
                    });

                    if ($('#slotSessionTabs .nav-link').length === 0) {
                        $('#combinedSlotsList').html('<div class="alert alert-warning text-center mt-3"><i class="ti ti-info-circle"></i> No slots are available for the selected date.</div>');
                    }
                } else {
                    $('#combinedSlotsList').html('<div class="alert alert-warning text-center mt-3"><i class="ti ti-info-circle"></i> No active schedule found for this date.</div>');
                }
            } catch (error) {
                if (error.statusText === 'abort') return;
                console.error("Error loading slots:", error);
                $('#loadingSlots').hide();
                $('#combinedSlotsList').html('<div class="alert alert-danger text-center mt-3">Error loading schedule data. Please try again.</div>');
            }
        }

        function generateMonthDates(year, month) {
            const dates = [];
            const todayStr = ymdFormatter.format(new Date());
            const lastDay = new Date(year, month + 1, 0).getDate();

            for (let day = 1; day <= lastDay; day++) {
                const dateObj = new Date(Date.UTC(year, month, day, 12, 0, 0));
                const fullDate = ymdFormatter.format(dateObj);
                const weekday = weekdayFormatter.format(dateObj);
                const isDisabled = fullDate < todayStr;

                dates.push({ day, weekday, fullDate, isDisabled });
            }
            return dates;
        }

        function renderDates(year, month) {
            const selector = $('#dateSelector');
            selector.html('');
            const dates = generateMonthDates(year, month);

            dates.forEach(date => {
                const item = $(`<div class="date-item" data-date="${date.fullDate}"></div>`).html(`
                    <div class="date-square">${date.day}</div>
                    <small>${date.weekday}</small>
                `);

                if (date.isDisabled) {
                    item.addClass('disabled');
                } else {
                    item.on('click', function() {
                        $('.date-item').removeClass('active');
                        $(this).addClass('active');
                        selectedDate = date.fullDate;
                        loadAllSlots();
                    });
                }
                selector.append(item);

                // Auto select current appointment date
                if (date.fullDate === currentAppointment.date) {
                    setTimeout(() => item.click(), 300);
                }
            });

            $('#monthYear').text(`${monthFormatter.format(new Date(year, month))} ${year}`);
        }

        // ==================== PATIENT SEARCH (exact same) ====================
        function updateDropdown(query) {
            const filtered = patients.filter(p => 
                p.name.toLowerCase().includes(query) || 
                (p.phone && p.phone.includes(query))
            );
            const dropdown = $('#patientDropdown');
            dropdown.html('');
            if (filtered.length) {
                filtered.forEach(p => {
                    const div = $('<div class="patient-item">').html(`
                <div class="patient-name"> <span class="bg-light rounded-circle d-inline-flex justify-content-center align-items-center" 
      style="width: 34px; height: 34px;">
            <i class="fa-solid fa-user-circle text-primary"></i>
        </span>
        ${p.name}</div>
                <div class="patient-details">Phone: ${p.phone} | ID: ${p.registration_id} | Gender: ${p.gender}</div>
            `);
                    div.on('click', () => {
                        // $('#patientSearch').val(`${p.name} - Phone: ${p.phone}`);
                        $('#patientSearch').val(`${p.name} - Phone: ${p.phone} - ID: ${p.registration_id} - Gender: ${p.gender}`);
                        $('#patientId').val(p.id);
                        dropdown.hide();
                    });
                    dropdown.append(div);
                });
            }
            dropdown.show();
        }

        $('#patientSearch').on('focus input', function() {
            updateDropdown($(this).val().toLowerCase());
        });

        // ==================== SUBMIT UPDATE ====================
        $('#submitAppointment').on('click', function() {
            const formData = new FormData();
            formData.append('_token', '{{ csrf_token() }}');
            formData.append('appointment_id', editAppointmentId);
            formData.append('patient_id', $('#patientId').val());
            formData.append('patient_string', $('#patientSearch').val());
            formData.append('date', selectedDate);
            formData.append('time', selectedSlot);
            formData.append('case_type', $('#caseType').val());
            formData.append('blood_group', $('#bloodGroup').val());
            formData.append('bp', $('#bp').val());
            formData.append('weight', $('#weight').val());
            formData.append('height', $('#height').val());
            formData.append('remarks', $('#remarks').val());

            const $btn = $(this);
            $btn.prop('disabled', true).html('Updating...');

            $.ajax({
                url: '{{ route("update-book-appointment") }}',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
               success: function(res) {
                    if (res.success) {
                        showAlert(res.message, 'success');
                        
                        setTimeout(() => {
                            window.location.href = res.redirect || '{{ route("doctors.appointment") }}';
                        }, 500);
                    } else {
                        showAlert(res.message || 'Something went wrong!', 'error');
                    }
                },
                error: () => showAlert('Server Error', 'error')
            }).always(() => $btn.prop('disabled', false).html('Update Appointment'));
        });

        // ==================== INIT ====================
        $('#slotInterval').val(slotInterval).on('change', function(){
            slotInterval = parseInt($(this).val());
            loadAllSlots();
        });

        renderDates(currentYear, currentMonth);
    });
    </script>
@endsection