<meta name="csrf-token" content="{{ csrf_token() }}">
<!-- Favicon -->
    <link rel="shortcut icon" href="{{ asset('assets-doctor/img/favicon.png') }}">

    <!-- Apple Icon -->

    <!-- Theme Config Js -->
    <script src="{{ asset('assets-doctor/js/theme-script.js') }}"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/css/bootstrap.min.css') }}">

    <!-- Fontawesome CSS -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/fontawesome/css/fontawesome.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/fontawesome/css/all.min.css') }}">

    <!-- Tabler Icon CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/tabler-icons/tabler-icons.min.css') }}">

    <!-- Bootstrap Tagsinput CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css') }}">

    <!-- Daterangepicker CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/daterangepicker/daterangepicker.css') }}">

    <!-- Datetimepicker CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/css/bootstrap-datetimepicker.min.css') }}">

    <!-- Simplebar CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/simplebar/simplebar.min.css') }}">

    <!-- Main CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/css/style.css') }}" id="app-style">

    <!-- Select2 CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/select2/css/select2.min.css') }}">

    <!-- Datatable CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/css/dataTables.bootstrap5.min.css') }}">

    <!-- Quill CSS -->
    <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/quill/quill.snow.css') }}">



    <div id="pageLoader">
    <div class="loader-wrapper">
        <div class="circle-loader"></div>
        <img src="{{ asset('assets-doctor/img/favicon.png') }}" class="loader-logo" alt="Logo">
    </div>
</div>



<style>
    
        #pageLoader {
    position: fixed;
    inset: 0;
    background: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99999;
}

.loader-wrapper {
    position: relative;
    width: 100px;
    height: 100px;
}

.loader-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 70px;
    transform: translate(-50%, -50%);
    z-index: 2;
}

.circle-loader {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid #e5e7eb;
    border-top-color: #0c4843; /* green */
    animation: spin 1.2s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>