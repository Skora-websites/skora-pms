from pathlib import Path
path = Path(r'c:\xampp\htdocs\skoracare\resources\views\doctor\book-appointment.blade.php')
text = path.read_text(encoding='utf-8')
start = '        async function loadAllSlots() {'
end = '        function generateMonthDates(y, m) {'
idx = text.find(start)
if idx == -1:
    raise SystemExit('start marker not found')
idx2 = text.find(end, idx)
if idx2 == -1:
    raise SystemExit('end marker not found')
replacement = '''        async function loadAllSlots() {
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
                $('#slotSessionTabs').html('');
                $('#slotSessionContent').html('');
                $('#combinedSlotsList').html('');
                $('#loadingSlots').show();

                const response = await $.get(bookedTimesRoute, { date: selectedDate });
                
                bookedTimes = response.booked_times || [];
                const schedules = (response.schedules || []).slice().sort((a, b) => {
                    const keyA = a.session_type || 'full_day';
                    const keyB = b.session_type || 'full_day';
                    return (sessionOrder[keyA] ?? 99) - (sessionOrder[keyB] ?? 99);
                });
                $('#loadingSlots').hide();
                
                if (schedules.length > 0) {
                    schedules.forEach((sch, index) => {
                        const sessionLabel = getSessionLabel(sch);
                        const sessionKey = getSessionKey(sch, index);
                        const isActive = index === 0;

                        const tab = $(`<button class="nav-link${isActive ? ' active' : ''}" type="button" data-session-key="${sessionKey}">${sessionLabel}</button>`);
                        tab.on('click', function() {
                            $('#slotSessionTabs .nav-link').removeClass('active');
                            $(this).addClass('active');
                            $('.session-pane').removeClass('show active');
                            $(`#${sessionKey}`).addClass('show active');
                        });

                        $('#slotSessionTabs').append($('<div class="nav-item me-2"></div>').append(tab));

                        const section = $(
                            `<div class="tab-pane session-pane${isActive ? ' show active' : ''}" id="${sessionKey}">
                                <div class="session-section mb-4">
                                    <h6 class="session-title border-bottom pb-2 d-flex align-items-center gap-2">
                                        <i class="ti ti-clock text-primary"></i> ${sessionLabel}
                                        <small>(${sch.start_time} - ${sch.end_time})</small>
                                    </h6>
                                    <div class="time-slots d-flex flex-wrap gap-2 mt-2"></div>
                                </div>
                            </div>`
                        );

                        const con = section.find('.time-slots');
                        const sDuration = parseInt(sch.slot_duration) || slotInterval;
                        const sGap = parseInt(sch.gap_duration) || 0;
                        
                        let currentMs = parseTimeToDate(sch.start_time).getTime();
                        let endMs = parseTimeToDate(sch.end_time).getTime();
                        if (endMs <= currentMs) endMs += 24 * 60 * 60 * 1000;
                        
                        const nowMs = Date.now();
                        const isToday = selectedDate === ymdFormatter.format(new Date());

                        while (currentMs + (sDuration * 60 * 1000) <= endMs) {
                            const startTimeStr = formatTime(new Date(currentMs));
                            const endTimeStr = formatTime(new Date(currentMs + (sDuration * 60 * 1000)));
                            const displayRange = `${startTimeStr} - ${endTimeStr}`;
                            
                            const btn = $('<button>').addClass('time-slot').text(displayRange);
                            const isBooked = bookedTimes.includes(startTimeStr);
                            const isPast = isToday && currentMs < (nowMs - 2 * 60 * 1000);
                            
                            if (isPast || isBooked) {
                                btn.addClass(isBooked ? 'booked' : 'disabled').prop('disabled', true);
                            } else {
                                btn.on('click', function() { openModal($(this), startTimeStr); });
                            }
                            con.append(btn);
                            currentMs += (sDuration + sGap) * 60 * 1000;
                            if (sDuration === 0) break;
                        }

                        if (con.children().length > 0) {
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
                console.error("Error loading slots:", error);
                $('#loadingSlots').hide();
                $('#combinedSlotsList').html('<div class="alert alert-danger text-center mt-3">Error loading schedule data. Please try again.</div>');
            }
        }
'''
text = text[:idx] + replacement + text[idx2:]
path.write_text(text, encoding='utf-8')
print('patched')
