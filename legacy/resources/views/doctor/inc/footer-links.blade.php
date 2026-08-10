{{-- Place this in your Blade layout file (e.g., resources/views/layouts/app.blade.php) at the end of the <body> tag --}}
{{-- Core Scripts --}}
<script src="{{ asset('assets-doctor/js/jquery-3.7.1.min.js') }}"></script>
<script>
    // Suppress DataTables warnings globally as early as possible
    if (typeof window.console !== 'undefined') {
        window.alert = (function(oldAlert) {
            return function(msg) {
                if (msg && msg.indexOf('DataTables warning') !== -1) {
                    console.warn(msg);
                    return;
                }
                oldAlert(msg);
            };
        })(window.alert);
    }
</script>

{{-- Bootstrap Core JS --}}
<script src="{{ asset('assets-doctor/js/bootstrap.bundle.min.js') }}"></script>

{{-- Simplebar JS --}}
<script src="{{ asset('assets-doctor/plugins/simplebar/simplebar.min.js') }}"></script>

{{-- Bootstrap Tagsinput JS --}}
<script src="{{ asset('assets-doctor/plugins/bootstrap-tagsinput/bootstrap-tagsinput.js') }}"></script>

{{-- Select2 JS --}}
<script src="{{ asset('assets-doctor/plugins/select2/js/select2.min.js') }}"></script>

{{-- Chart JS --}}
<script src="{{ asset('assets-doctor/plugins/apexchart/apexcharts.min.js') }}"></script>
<script src="{{ asset('assets-doctor/plugins/apexchart/chart-data.js') }}"></script>

{{-- Daterangepicker JS --}}
<script src="{{ asset('assets-doctor/js/moment.min.js') }}"></script>
<script src="{{ asset('assets-doctor/plugins/daterangepicker/daterangepicker.js') }}"></script>


{{-- Datatable JS --}}
<script src="{{ asset('assets-doctor/js/jquery.dataTables.min.js') }}"></script>
<script src="{{ asset('assets-doctor/js/dataTables.bootstrap5.min.js') }}"></script>

<!-- {{-- Sticky Sidebar JS --}} -->
<script src="{{ asset('assets-doctor/plugins/theia-sticky-sidebar/ResizeSensor.js') }}"></script>
<script src="{{ asset('assets-doctor/plugins/theia-sticky-sidebar/theia-sticky-sidebar.js') }}"></script>

<!-- {{-- Quill JS --}} -->
<script src="{{ asset('assets-doctor/plugins/quill/quill.min.js') }}"></script>

{{-- Main JS --}}
<script src="{{ asset('assets-doctor/js/script.js') }}"></script>
<script src="{{ asset('assets-doctor/js/chat.js') }}"></script>
<script src="{{ asset('assets-doctor/js/social-feed.js') }}"></script>
<script src="{{ asset('assets-doctor/js/slimscroll.js') }}"></script>
<script src="{{ asset('assets-doctor/js/email.js') }}"></script>
<script src="{{ asset('assets-doctor/js/doctors.js') }}"></script>