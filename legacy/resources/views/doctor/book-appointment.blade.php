@extends('layouts.layout-doctor')
@section('title', 'Doctor || Book Appointments')
<link rel="stylesheet" href="{{ asset('assets-doctor/css/book-appointmet.css') }}">
@section('content')
    <div class="main-wrapper">
        <div class="page-wrapper">
            <div class="content card">
                <div class="card p-2">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="fw-bold mb-0 color-doctorrx"> <i class="ti ti-calendar-plus"></i> Select an Appointment
                            Slot</h4>
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
                    <div class="mt-2 d-flex justify-content-between align-items-center mb-3">
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
                        <div id="loadingSlots" class="text-center p-4" style="display:none">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-muted">Loading appointments...</p>
                        </div>
                        <div id="combinedSlotsList"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Modal -->
        <div class="modal fade" id="appointmentModal" tabindex="-1" aria-labelledby="appointmentModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header rounded border-0">
                        <h4 class="modal-title fw-bold d-flex align-items-center gap-2" id="appointmentModalLabel"
                            style="color:#0e606e;font-weight:700;">Confirm Appointment</h4>
                        <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="appointmentForm">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3"><label class="form-label">Doctor Name</label><input type="text"
                                            class="form-control" id="modalDoctorName" readonly></div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3"><label class="form-label">Date & Time</label><input type="text"
                                            class="form-control" id="modalDateTime" readonly></div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3"><label class="form-label">Visit type</label><select
                                            class="form-select" id="caseType">
                                            <option value="clinical_visit">Clinical visit</option>
                                            <option value="home_visit">Home visit</option>
                                            <option value="online_visit">Online visit</option>
                                            <option value="on_call_visit">On Call visit</option>
                                        </select></div>
                                </div>

                                <div class="col-md-9">
                                    <div class="mb-3 patient-search-container">
                                        <label class="form-label">Patient Name, Mobile No</label>
                                        <div class="input-group">
                                            <div class="input-group-text"><i class="fa-solid fa-user"></i></div>
                                            <input type="text" class="form-control" id="patientSearch"
                                                placeholder="Search by name, mobile" autocomplete="off">
                                        </div>
                                        <input type="hidden" id="patientId">
                                        <div class="patient-dropdown" id="patientDropdown"></div>
                                    </div>
                                </div>

                                <div class="col-md-3">
                                    <div class="mb-3"><label class="form-label">Blood Group</label><select
                                            class="form-select" id="bloodGroup">
                                            <option value="">Select Blood ...</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select></div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3"><label class="form-label">BP Level(e.g., 120/80)</label><input
                                            type="text" class="form-control" id="bp" placeholder="e.g., 120/80"></div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3"><label class="form-label">Weight (kg)</label><input type="number"
                                            class="form-control" id="weight" placeholder="e.g., 70"></div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3"><label class="form-label">Height (cm)</label><input type="number"
                                            class="form-control" id="height" placeholder="e.g., 170"></div>
                                </div>
                                <div class="col-md-12">
                                    <div class="mb-3"><label class="form-label">Remarks for Receptionist</label><textarea
                                            class="form-control" id="remarks" placeholder="Remarks for Receptionist"
                                            rows="3"></textarea></div>
                                </div>

                                <div class="col-12 mb-3"><span type="button"
                                        class="btn-link text-decoration-underline toggle-address-details">Consent
                                        Form</span></div>
                                <div class="col-md-12 m-auto p-2 mb-3 details address-details" style="display:none;">
                                    <div class="card p-3">
                                        <div class="row">
                                            <h5 class="mb-3">Consent Form</h5>
                                            <div class="col-md-3">
                                                <div class="form-check mb-2">
                                                    <input class="form-check-input" type="radio" name="consent" id="consentRadio" value="consent" checked>
                                                    <label class="form-check-label" for="consentRadio">Send Consent</label>
                                                </div>
                                                {{-- <div class="form-check mb-2">
                                                    <input class="form-check-input" type="radio" name="consent" id="otpRadio" value="otp">
                                                    <label class="form-check-label" for="otpRadio">Send message</label>
                                                </div> --}}
                                                <!-- <div class="form-check mb-2"><input class="form-check-input" type="radio" name="consent" id="emailRadio" value="email"><label class="form-check-label" for="emailRadio">Send Email</label></div> -->
                                                <div class="form-check mb-2"><input class="form-check-input" type="radio"
                                                        name="consent" id="uploadRadio" value="upload"><label
                                                        class="form-check-label" for="uploadRadio">Upload Image</label>
                                                </div>
                                                <div class="form-check mb-2"><input class="form-check-input" type="radio"
                                                        name="consent" id="skipRadio" value="skip"><label
                                                        class="form-check-label" for="skipRadio">Skip Consent Form</label>
                                                </div>
                                            </div>
                                            <div class="col-md-9" id="dynamicField"></div>
                                        </div>
                                    </div>
                                </div>
                                <input type="hidden" id="consentSent" value=""><input type="hidden" id="consentId"
                                    value=""><input type="hidden" id="messageSent" value="">
                            </div>
                            <div class="modal-footer pt-1 pb-0">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" id="submitAppointment">Book
                                    Appointment</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Skip Consent Warning -->
        <div class="modal fade" id="consentWarningModal" tabindex="-1" aria-labelledby="consentWarningLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-warning">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title" id="consentWarningLabel">Consent Warning</h5><button type="button"
                            class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-dark">Would you like to book the appointment without filling out the
                        <b>Consent Form</b>?</div>
                    <div class="modal-footer"><button type="button" class="btn btn-secondary"
                            data-bs-dismiss="modal">No</button><button type="button" id="confirmWithoutConsent"
                            class="btn btn-warning">Yes, Continue</button></div>
                </div>
            </div>
        </div>

        <div id="notificationContainer" style="position:fixed;top:20px;right:20px;z-index:1050;"></div>

        @include('doctor.inc.footer-links')
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

        <style>
            /* Loading spinner styles */
            .loading-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, .3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
                margin-right: 8px;
                vertical-align: middle;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            .btn-loading {
                opacity: 0.8;
                cursor: not-allowed;
                pointer-events: none;
            }

            /* Consent status styles */
            .consent-success {
                color: #28a745;
                font-weight: 500;
            }

            .consent-error {
                color: #dc3545;
                font-weight: 500;
            }

            .consent-warning {
                color: #ffc107;
                font-weight: 500;
            }

            .nav-tabs .nav-link {
                white-space: nowrap;
            }

            .session-section .session-title small {
                font-size: 0.8rem;
                color: #6c757d;
            }
        </style>

        <script>
            const searchPatientsRoute = '{{ route("doctor.appointments.search-patients") }}';
            const csrfToken = '{{ csrf_token() }}';
            const generateConsentRoute = '{{ route("doctor.generate-consent-link") }}';
            const sendWhatsAppRoute = '{{ route("doctor.send-whatsapp") }}';
            const storeAppointmentRoute = '{{ route("doctor.appointments.store") }}';
            const bookedTimesRoute = '{{ route("doctor.appointments.booked_times") }}';
            const checkConsentRoute = '{{ route("doctor.check-consent-before-booking") }}';

            $(document).ready(function () {
                // Flag to prevent multiple submissions
                let isSubmitting = false;

                const IST_OFFSET = '+05:30';
                const ymdFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
                const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
                const monthFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'long' });
                const timeFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: true });

                let slotInterval = parseInt(localStorage.getItem('slotInterval')) || 10;
                let selectedDate = null;
                let selectedSlot = null;
                let bookedTimes = [];
                let currentYear, currentMonth;
                let currentConsentType = 'otp';
                let mobileNumber = null;
                let currentSlotRequest = null; // To handle concurrent requests

                function formatTime(date) {
                    const tParts = timeFormatter.formatToParts(date);
                    const hour = tParts.find(p => p.type === 'hour').value.padStart(2, '0');
                    const minute = tParts.find(p => p.type === 'minute').value;
                    const period = tParts.find(p => p.type === 'dayPeriod') ? tParts.find(p => p.type === 'dayPeriod').value.toUpperCase() : '';
                    return `${hour}:${minute} ${period}`;
                }

                // --- PRESELECTED PATIENT LOGIC ---
                @if(isset($preselectedPatient))
                    $('#patientSearch').val('{{ $preselectedPatient->name }} - {{ $preselectedPatient->phone }} - {{ $preselectedPatient->registration_id }}');
                    $('#patientId').val('{{ $preselectedPatient->id }}');
                    mobileNumber = '{{ $preselectedPatient->phone }}';
                @endif
                    // ---------------------------------

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

                        return new Date(`${base}T${String(hours).padStart(2, '0')}:${minutes || '00'}:00${IST_OFFSET}`);
                    }

                function openModal(btn, time) {
                    $('.time-slot').css('border', '1px solid #6f42c1');
                    btn.css('border', '2px solid #ffc107');
                    selectedSlot = time;
                    $('#modalDoctorName').val($('#doctorSelect').val());
                    $('#modalDateTime').val(`${selectedDate} ${time}`);

                    // Clear only vitals and remarks, keep patient if preselected
                    $('#remarks, #bloodGroup, #bp, #weight, #height').val('');

                    @if(!isset($preselectedPatient))
                        $('#patientSearch, #patientId').val('');
                        mobileNumber = null;
                    @endif

                    $('#caseType').val('clinical_visit');
                    $('#patientDropdown').hide();
                    $('#dynamicField').html('');
                    $('#consentSent, #consentId, #messageSent').val('');
                    currentConsentType = 'consent';
                    // mobileNumber = null; // Removed from here, handled above
                    $('input[name="consent"][value="consent"]').prop('checked', true);
                    toggleConsent('consent');
                    $('#appointmentModal').modal('show');
                }

                function selectDate(item, date) {
                    $('.date-item').removeClass('active');
                    item.addClass('active');
                    selectedDate = date;
                    loadAllSlots();
                    item[0].scrollIntoView({ behavior: 'smooth', inline: 'center' });
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

                        currentSlotRequest = $.get(bookedTimesRoute, {
                            date: selectedDate,
                            clinic_id: '{{ $clinic->id ?? "" }}'
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
                                                btn.on('click', function () { openModal($(this), s.startTimeStr); });
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

                                    tab.on('click', function () {
                                        $('#slotSessionTabs .nav-link').removeClass('active');
                                        $(this).addClass('active');
                                        $('.session-pane').removeClass('show active');
                                        section.addClass('show active');
                                    });

                                    $('#slotSessionTabs').append($('<div class="nav-item me-2"></div>').append(tab));
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

                function generateMonthDates(y, m) {
                    const dates = [];
                    const today = ymdFormatter.format(new Date());
                    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getDate();

                    for (let d = 1; d <= lastDay; d++) {
                        const dt = new Date(Date.UTC(y, m, d, 12));
                        const fullDate = ymdFormatter.format(dt);
                        dates.push({
                            day: d,
                            weekday: weekdayFormatter.format(dt),
                            fullDate: fullDate,
                            disabled: fullDate < today
                        });
                    }
                    return dates;
                }

                function renderDates(y, m) {
                    const sel = $('#dateSelector');
                    sel.html('');
                    const dates = generateMonthDates(y, m);

                    $.each(dates, function (i, d) {
                        const el = $('<div>').addClass('date-item').html(`
                        <div class="date-square">${d.day}</div>
                        <small>${d.weekday}</small>
                    `);

                        if (d.disabled) {
                            el.addClass('disabled').css({ pointerEvents: 'none', opacity: 0.5 });
                        } else {
                            el.on('click', function () {
                                selectDate($(this), d.fullDate);
                            });
                        }

                        sel.append(el);

                        // Select preselected or today's date
                        @if(isset($preselectedDate))
                            if (d.fullDate === '{{ $preselectedDate }}') {
                                selectDate(el, d.fullDate);
                            }
                        @else
                            if (d.fullDate === ymdFormatter.format(new Date()) && !selectedDate) {
                                    selectDate(el, d.fullDate);
                                }
                        @endif
                });

                    const firstDayOfMonth = new Date(Date.UTC(y, m, 1, 12));
                    $('#monthYear').text(`${monthFormatter.format(firstDayOfMonth)} ${y}`);
                }

                // Initialize calendar
                const now = new Date();
                currentYear = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(now));
                currentMonth = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'numeric' }).format(now)) - 1;
                renderDates(currentYear, currentMonth);

                // Month navigation
                $('#prevMonth').on('click', function () {
                    currentMonth--;
                    if (currentMonth < 0) {
                        currentMonth = 11;
                        currentYear--;
                    }
                    selectedDate = null;
                    renderDates(currentYear, currentMonth);
                });

                $('#nextMonth').on('click', function () {
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                    selectedDate = null;
                    renderDates(currentYear, currentMonth);
                });

                // Slot interval change
                $('#slotInterval').val(slotInterval).on('change', function () {
                    slotInterval = parseInt($(this).val());
                    localStorage.setItem('slotInterval', slotInterval);
                    if (selectedDate) {
                        loadAllSlots();
                    }
                });

                $('#doctorSelect').on('change', function () {
                    if (selectedDate) {
                        loadAllSlots();
                    }
                });

                // Patient Search
                const pSearch = $('#patientSearch');
                const pDrop = $('#patientDropdown');
                let searchTimeout;

                function updateDropdown(q) {
                    const searchTerm = q.trim().toLowerCase();

                    // Clear previous results but show "Add New Patient" button
                    const addNewBtnHtml = `
                    <div class="p-2 border-bottom text-center">
                        <a href="{{route('doctor.patient-registration')}}?register=true&redirect_to=book-appointment&date=${selectedDate}&time=${encodeURIComponent(selectedSlot)}" class="btn btn-primary btn-sm w-100 py-2">
                            <i class="ti ti-plus"></i> Add New Patient
                        </a>
                    </div>
                `;

                    pDrop.html(addNewBtnHtml + '<div id="search-results-list"></div>');
                    const resultsList = $('#search-results-list');

                    if (searchTerm.length === 0) {
                        return;
                    }

                    resultsList.html('<div class="p-3 text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span> Searching...</div>');

                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        $.ajax({
                            url: searchPatientsRoute,
                            method: 'GET',
                            data: { q: searchTerm },
                            success: function (patients) {
                                resultsList.html('');
                                if (patients && patients.length > 0) {
                                    $.each(patients, function (i, p) {
                                        const div = $('<div>').addClass('patient-item').html(`
                                        <div class="patient-name d-flex align-items-center">
                                            <span class="avatar avatar-sm rounded-circle bg-light d-inline-flex justify-content-center align-items-center me-2" style="width:34px;height:34px;">
                                                <i class="fa-solid fa-user text-primary" style="font-size: 18px;"></i>
                                            </span>
                                            <div class="text-dark fw-bold mb-0">${p.name}</div>
                                        </div>
                                        <div class="patient-details fs-12 text-muted mt-1">
                                            <span class="me-2 text-nowrap"><i class="fa-solid fa-phone me-1" style="font-size: 11px;"></i>${p.phone}</span>
                                            <span class="me-2 text-nowrap"><i class="fa-solid fa-id-card me-1" style="font-size: 11px;"></i>${p.registration_id}</span>
                                            <span class="text-nowrap"><i class="fa-solid fa-venus-mars me-1" style="font-size: 11px;"></i>${p.gender}</span>
                                        </div>
                                    `);

                                        div.on('mousedown', function () {
                                            pSearch.val(`${p.name} - ${p.phone} - ${p.registration_id}`);
                                            $('#patientId').val(p.id);
                                            mobileNumber = p.phone;
                                            pDrop.hide();
                                        });

                                        resultsList.append(div);
                                    });
                                } else {
                                    resultsList.html('<div class="p-3 text-center text-muted">No matching patients found.</div>');
                                }
                            },
                            error: function () {
                                resultsList.html('<div class="p-3 text-center text-danger">Search failed. Please try again.</div>');
                            }
                        });
                    }, 300);
                }

                pSearch.on('focus input', function () {
                    updateDropdown($(this).val());
                    pDrop.show();
                });

                pSearch.on('blur', function () {
                    // Delay hide to allow mousedown on results
                    setTimeout(() => pDrop.hide(), 250);
                });

                // ============== CONSENT FORM FUNCTIONS (YOUR ORIGINAL CODE) ==============

                window.toggleConsent = function (type) {
                    currentConsentType = type;
                    const field = $('#dynamicField').html('');

                    if (type === 'otp') {
                        field.html(`
                        <div class="mb-3">
                            <label class="form-label"><i class="ti ti-message"></i> Send WhatsApp Message</label>
                            <div class="input-group">
                                <input type="tel" class="form-control" id="mobileNumber" maxlength="10" value="${mobileNumber || ''}">
                                <button type="button" class="btn btn-success" id="sendMessageBtn"><i class="ti ti-send"></i> Send</button>
                            </div>
                            <div class="mt-2">
                                <textarea class="form-control" id="messageText" rows="3">Hello, I am Dr. ${$('#modalDoctorName').val()}. I'm booking your appointment. Please reply 'YES' to this message to confirm your consent.</textarea>
                            </div>
                            <div id="messageStatus"></div>
                        </div>
                    `);
                        $('#sendMessageBtn').off().on('click', sendMessage);

                    } else if (type === 'consent') {
                        field.html(`
                        <div class="mb-3">
                            <div class="d-flex align-items-center gap-2 mb-3">
                                <span class="badge bg-primary rounded-circle p-2" style="width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;">1</span>
                                <label class="form-label mb-0 fw-bold">Generate Link</label>
                            </div>
                            <div id="consentActionArea">
                                <button type="button" class="btn btn-outline-primary w-100 py-2" id="generateConsentBtn">
                                    <i class="ti ti-link"></i> Generate Consultation Link
                                </button>
                            </div>
                            <div id="consentEditArea" style="display:none;" class="mt-3">
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <span class="badge bg-primary rounded-circle p-2" style="width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;">2</span>
                                    <label class="form-label mb-0 fw-bold">Preview & Send</label>
                                </div>
                                <div class="card bg-light border-0 p-2 mb-3">
                                    <textarea class="form-control border-0 bg-transparent" id="consentMessageText" rows="5" style="resize:none;font-size:13px;"></textarea>
                                    <div class="p-2 border-top mt-2">
                                        <label class="form-label fs-11 text-muted mb-1 uppercase">Locked Consultation URL</label>
                                        <input type="text" class="form-control form-control-sm bg-white border-dashed" id="consentLinkDisplay" readonly style="font-size:12px;">
                                    </div>
                                </div>
                                <button type="button" class="btn btn-success w-100 py-2 fw-bold" id="sendConsentManualBtn">
                                    <i class="ti ti-brand-whatsapp"></i> Send to WhatsApp
                                </button>
                                <div id="consentStatus" class="mt-2"></div>

                                <div class="d-flex align-items-center gap-2 mt-4 mb-2" id="bookStepLabel" style="opacity:0.5;">
                                    <span class="badge bg-secondary rounded-circle p-2" style="width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;">3</span>
                                    <label class="form-label mb-0 fw-bold">Ready to Book Appointment</label>
                                </div>
                            </div>
                        </div>
                    `);
                        $('#generateConsentBtn').off().on('click', sendConsent);
                        $('#sendConsentManualBtn').off().on('click', sendConsentManual);
                    } else if (type === 'upload') {
                        field.html(`
                        <div class="mb-3">
                            <label class="form-label"><i class="ti ti-file-upload"></i> Upload Image/PDF</label>
                            <input type="file" class="form-control" id="consentFile" accept="image/*,application/pdf">
                            <div id="filePreview" class="mt-2"></div>
                        </div>
                    `);
                        $('#consentFile').off().on('change', previewFile);

                    } else if (type === 'email') {
                        field.html(`
                        <div class="alert alert-info mb-0">
                            <i class="ti ti-mail"></i> An email with the consent link will automatically be sent to the patient's registered email address upon booking.
                        </div>
                    `);
                    } else if (type === 'skip') {
                        field.html(`
                        <div class="alert alert-warning mb-0">
                            <i class="ti ti-alert-triangle"></i> You have chosen to proceed without filling out the consent form. A confirmation will be required before booking.
                        </div>
                    `);
                    }
                };

                function sendConsent() {
                    const mob = ($('#mobileNumberConsent').length ? $('#mobileNumberConsent').val() : null) || mobileNumber;
                    if (!mob || mob.length !== 10) {
                        showAlert('Enter valid 10-digit mobile', 'error');
                        return;
                    }

                    const pid = $('#patientId').val();
                    if (!pid) {
                        showAlert('Select patient first', 'error');
                        return;
                    }

                    const $btn = $('#generateConsentBtn');
                    const originalText = $btn.html();
                    $btn.html('<span class="loading-spinner"></span> Generating Link...').prop('disabled', true);

                    $.post(generateConsentRoute, {
                        _token: csrfToken,
                        patient_id: pid,
                        mobile: mob
                    }, function (r) {
                        $btn.html(originalText).prop('disabled', false);

                        if (r.success) {
                            $('#consentSent').val('sent');
                            $('#consentId').val(r.consent_id);

                            const doctorName = $('#modalDoctorName').val();
                            const consentLink = r.consent_link;
                            
                            const greeting = `🏥 *SkoraCares Consultation Form*\n\nHello,\n\nDr. ${doctorName} has sent you a Consultation Form.\nPlease click on the link below to read and accept the form:\n\n📋 *Consultation Form Link:*`;
                            const footer = `\n\n✅ *Appointment will be booked only after you accept the form*\n\nThank you,\nTeam SkoraCares`;
                            
                            $('#consentActionArea').hide();
                            $('#consentEditArea').show();
                            $('#consentMessageText').val(greeting);
                            $('#consentLinkDisplay').val(consentLink);
                            
                            showAlert('Consent link generated!', 'success');
                        } else {
                            showAlert(r.message || 'Failed', 'error');
                        }
                    }).fail(function () {
                        $btn.html(originalText).prop('disabled', false);
                        showAlert('Failed to generate consent link', 'error');
                    });
                }

                function sendConsentManual() {
                    const mob = mobileNumber; // Use the patient's phone number
                    if (!mob || mob.length !== 10) {
                        showAlert('Patient mobile number missing or invalid', 'error');
                        return;
                    }
                    
                    const message = $('#consentMessageText').val();
                    const link = $('#consentLinkDisplay').val();
                    const footer = `\n\n✅ *Appointment will be booked only after you accept the form*\n\nThank you,\nTeam SkoraCares`;
                    
                    const fullMessage = `${message}\n${link}${footer}`;
                    const waUrl = `https://wa.me/91${mob}?text=${encodeURIComponent(fullMessage)}`;
                    
                    window.open(waUrl, '_blank');
                    
                    // Mark as manually sent to enable booking
                    $('#messageSent').val('sent');
                    $('#bookStepLabel').css('opacity', '1').find('.badge').removeClass('bg-secondary').addClass('bg-primary');
                    
                    $('#consentStatus').html('<div class="alert alert-success py-2 fs-13"><i class="ti ti-check"></i> WhatsApp opened. You can now book the appointment.</div>');
                    showAlert('WhatsApp opened!', 'success');
                }

                function sendMessage() {
                    const mob = $('#mobileNumber').val();
                    if (!mob || mob.length !== 10) {
                        showAlert('Enter valid 10-digit mobile', 'error');
                        return;
                    }

                    const message = $('#messageText').val();
                    const waUrl = `https://wa.me/91${mob}?text=${encodeURIComponent(message)}`;

                    // Jump to WhatsApp
                    window.open(waUrl, '_blank');

                    $('#messageStatus').html('<div class="alert alert-success"><i class="ti ti-check"></i> WhatsApp window opened.</div>');
                    $('#messageSent').val('sent');
                    mobileNumber = mob;
                    showAlert('WhatsApp window opened', 'success');
                }

                function previewFile(e) {
                    const file = e.target.files[0];
                    const preview = $('#filePreview').html('');

                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function (ev) {
                            preview.html(`<img src="${ev.target.result}" class="img-fluid rounded" style="max-height:180px">`);
                        };
                        reader.readAsDataURL(file);
                    } else if (file && file.type === 'application/pdf') {
                        preview.html(`<embed src="${URL.createObjectURL(file)}" width="100%" height="200" type="application/pdf">`);
                    }
                }

                // ============== APPOINTMENT SUBMISSION WITH LOADING AND PREVENT MULTIPLE ==============

                $('#submitAppointment').on('click', function (e) {
                    e.preventDefault();

                    // Prevent multiple submissions
                    if (isSubmitting) {
                        console.log('Already submitting, please wait...');
                        return;
                    }

                    // Basic validation
                    if (!$('#patientId').val() || !$('#patientSearch').val()) {
                        showAlert('Please select a patient', 'error');
                        return;
                    }

                    if (!$('#caseType').val()) {
                        showAlert('Please select visit type', 'error');
                        return;
                    }

                    if (!selectedDate || !selectedSlot) {
                        showAlert('Please select date & time', 'error');
                        return;
                    }

                    // Consent validation based on type
                    if (currentConsentType === 'skip') {
                        $('#consentWarningModal').modal('show');
                        return;
                    }

                    if (currentConsentType === 'consent') {
                        if (!$('#consentId').val() || $('#consentSent').val() !== 'sent') {
                            showAlert('Please generate the consent link first', 'error');
                            return;
                        }
                        
                        if ($('#messageSent').val() !== 'sent') {
                            showAlert('Please click "Send to WhatsApp" first to deliver the link', 'warning');
                            return;
                        }
                        
                        // Proceed with booking
                        submitAppointmentForm();
                        return;
                    }

                    if (currentConsentType === 'otp' && $('#messageSent').val() !== 'sent') {
                        showAlert('Please send message first', 'error');
                        return;
                    }

                    if (currentConsentType === 'upload' && !$('#consentFile')[0].files[0]) {
                        showAlert('Upload file first', 'error');
                        return;
                    }

                    // If all validation passes, submit
                    submitAppointmentForm();
                });

                $('#confirmWithoutConsent').on('click', function () {
                    $('#consentWarningModal').modal('hide');
                    currentConsentType = 'skipped';
                    submitAppointmentForm();
                });

                function submitAppointmentForm() {
                    // Set submitting flag to prevent multiple submissions
                    isSubmitting = true;

                    const $btn = $('#submitAppointment');
                    const originalText = $btn.html();

                    // Show loading state
                    $btn.html('<span class="loading-spinner"></span> Booking...').addClass('btn-loading').prop('disabled', true);

                    const fd = new FormData();
                    fd.append('_token', csrfToken);
                    fd.append('doctor_id', '{{Auth::id()}}');
                    fd.append('patient_id', $('#patientId').val());
                    fd.append('patient_string', $('#patientSearch').val());
                    fd.append('date', selectedDate);
                    fd.append('time', selectedSlot);
                    fd.append('case_type', $('#caseType').val());
                    fd.append('blood_group', $('#bloodGroup').val() || '');
                    fd.append('bp', $('#bp').val() || '');
                    fd.append('weight', $('#weight').val() || '');
                    fd.append('height', $('#height').val() || '');
                    fd.append('remarks', $('#remarks').val() || '');
                    fd.append('consent_type', currentConsentType);

                    if (currentConsentType === 'consent') {
                        fd.append('consent_id', $('#consentId').val());
                    }

                    if (currentConsentType === 'upload' && $('#consentFile')[0].files[0]) {
                        fd.append('consent_file', $('#consentFile')[0].files[0]);
                    }

                    if (mobileNumber) {
                        fd.append('mobile_number', mobileNumber);
                    }

                    console.log('Submitting appointment...');

                    $.ajax({
                        url: storeAppointmentRoute,
                        method: 'POST',
                        data: fd,
                        processData: false,
                        contentType: false,
                        success: function (response) {
                            // Reset submitting flag
                            isSubmitting = false;

                            // Restore button
                            $btn.html(originalText).removeClass('btn-loading').prop('disabled', false);

                            if (response.success) {
                                $('#appointmentModal').modal('hide');
                                showAlert(response.message || 'Appointment booked successfully!', 'success');

                                // If WhatsApp consent was chosen, and manual sending is desired, the window is already opened by Send button
                                // But if the doctor just clicked Book Appointment, we can open it again if they didn't send it?
                                // Actually, it's better to let them send it via the Send button first.
                                // If they forgot, the server sends it anyway.

                                // Redirect to appointments list after a short delay
                                setTimeout(() => {
                                    window.location.href = "{{ route('doctors.appointment') }}";
                                }, 2000);

                                // Reset selected slot and reload slots
                                selectedSlot = null;
                                loadAllSlots();

                                // Reset form
                                resetForm();
                            } else {
                                showAlert(response.message || 'Failed to book appointment', 'error');
                            }
                        },
                        error: function (xhr) {
                            isSubmitting = false;

                            $btn.html(originalText).removeClass('btn-loading').prop('disabled', false);

                            const error = xhr.responseJSON;
                            let errorMsg = 'Error booking appointment';

                            if (error) {
                                if (error.message) errorMsg = error.message;
                                else if (error.errors) {
                                    errorMsg = Object.values(error.errors).flat().join(', ');
                                }
                            }

                            showAlert(errorMsg, 'error');
                            console.error('Submission error:', error);
                        }
                    });
                }

                function resetForm() {
                    $('#patientSearch, #patientId, #remarks, #bloodGroup, #bp, #weight, #height').val('');
                    $('#consentSent, #consentId, #messageSent').val('');
                    $('#dynamicField').html('');
                    $('input[name="consent"][value="otp"]').prop('checked', true);
                    toggleConsent('otp');
                    mobileNumber = null;
                    isSubmitting = false; // Reset submitting flag
                }

                $(".toggle-address-details").on("click", function () {
                    $(".address-details").slideToggle();
                });

                $('input[name="consent"]').on('change', function () {
                    toggleConsent($(this).val());
                });

                // --- URL PARAMETER HANDLING (AUTO-OPEN MODAL) ---
                @if(isset($preselectedDate))
                    const preDate = '{{ $preselectedDate }}';
                    const preTime = '{{ $preselectedTime }}';

                    // Wait for slots to load before clicking the preselected slot
                    const checkAndOpenSlot = setInterval(() => {
                        const $slot = $(`.time-slot`).filter(function () {
                            return $(this).text().startsWith(preTime);
                        });

                        if ($slot.length > 0) {
                            clearInterval(checkAndOpenSlot);
                            openModal($slot, preTime);
                        }
                    }, 500);

                    // Stop trying after 5 seconds to prevent infinite loop
                    setTimeout(() => clearInterval(checkAndOpenSlot), 5000);
                @endif
                // ------------------------------------------------

                $('#appointmentModal').on('hide.bs.modal', function (e) {
                    if (isSubmitting) {
                        e.preventDefault();
                        e.stopPropagation();
                        showAlert('Please wait, appointment is being booked...', 'warning');
                        return false;
                    }
                });
                toggleConsent('consent');
                loadAllSlots();
            });
        </script>
    </div>
@endsection