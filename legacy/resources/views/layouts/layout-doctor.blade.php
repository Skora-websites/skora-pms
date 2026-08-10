  <!DOCTYPE html>
  <html lang="en">

  <head>
      <title>@yield('title', 'Doctor|| Doctor-dashboard')</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <meta name="csrf-token" content="{{ csrf_token() }}">
      <meta name="csrf-token" content="{{ csrf_token() }}">
      <link rel="shortcut icon" href="{{ asset('assets-doctor/img/favicon.png') }}">
      <script src="{{ asset('assets-doctor/js/theme-script.js') }}"></script>
      <link rel="stylesheet" href="{{ asset('assets-doctor/css/bootstrap.min.css') }}">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet">
      <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/fontawesome/css/fontawesome.min.css') }}">
      <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/fontawesome/css/all.min.css') }}">
      
      <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/tabler-icons/tabler-icons.min.css') }}">
      <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css') }}">
      <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/daterangepicker/daterangepicker.css') }}">
      <link rel="stylesheet" href="{{ asset('assets-doctor/css/bootstrap-datetimepicker.min.css') }}">
      <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/simplebar/simplebar.min.css') }}">
      <link rel="stylesheet" href="{{ asset('assets-doctor/css/style.css') }}" id="app-style">
      <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/select2/css/select2.min.css') }}">
      <link rel="stylesheet" href="{{ asset('assets-doctor/css/dataTables.bootstrap5.min.css') }}">
      <link rel="stylesheet" href="{{ asset('assets-doctor/plugins/quill/quill.snow.css') }}">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">

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
              border-top-color: #0c4843;
              /* green */
              animation: spin 1.2s linear infinite;
          }

          @keyframes spin {
              to {
                  transform: rotate(360deg);
              }
          }
      </style>
      @stack('styles')
  </head>

  <body>
      <header class="navbar-header" style="box-shadow: 6px 1px 8px 0px rgb(14 96 110 / 54%);">
          <div class="page-container topbar-menu">
              <div class="d-flex align-items-center gap-2">
                  <!-- Logo -->
                  <a href="index.php" class="logo">
                      <!-- Logo Normal -->
                      <span class="logo-light">
                          <span class="logo-sm"><img src="{{ asset('assets-doctor/img/logo-small.svg') }}"
                                  alt="small logo" /></span>
                      </span>

                      <!-- Logo Dark -->
                      <span class="logo-dark">
                          <span class="logo-lg"><img src="{{ asset('assets-doctor/img/logo-white.svg') }}"
                                  alt="dark logo" /></span>
                      </span>
                  </a>

                  <a class="mobile-btn" href="{{ route('doctor.dashboard') }}">
                      <img src="{{ asset('assets-doctor/img/logo.png') }}" loading="lazy" height="40" width="92" alt="img" />
                  </a>

                  <button class="sidenav-toggle-btn btn border-0 p-0 active" id="toggle_btn2">
                      <i class="ti ti-arrow-right"></i>
                  </button>

                  <!-- Search -->
                  <div class="me-auto d-flex align-items-center header-search d-lg-flex d-none">
                      <!-- Search -->
                      {{-- <div class="input-icon-start position-relative me-2">
            <span class="input-icon-addon">
              <i class="ti ti-search"></i>
            </span>
            <input
              type="text"
              class="form-control shadow-sm"
              placeholder="Search" />
            <span
              class="input-icon-addon text-dark shadow fs-18 d-inline-flex p-0 header-search-icon"><i class="ti ti-command"></i></span>
          </div> --}}
                      <!-- /Search -->
                  </div>
              </div>

              <div class="d-flex align-items-center">
                  <!-- Search for Mobile -->
                  <div class="header-item d-flex d-lg-none me-1">
                      <button class="topbar-link btn btn-icon" data-bs-toggle="modal" data-bs-target="#searchModal"
                          type="button">
                          <i class="ti ti-search fs-16"></i>
                      </button>
                  </div>

                  {{-- <a href="" class="btn btn-liner-gradient me-3 d-lg-flex d-none" data-bs-toggle="modal" data-bs-target="#wallet">Wallet<i class="ti ti-wallet mx-1"></i> $ 654</a> --}}

                  <!-- AI Assistance -->
                  <a href="javascript:void(0);" id="toggleButton"
                      class=" btn btn-liner-gradient me-3 d-lg-flex d-none toggle-help-panel">
                      <span class="animated-text"> Skora Assistance</span> <i class="ti ti-robot ms-1"></i>
                  </a>


                  <!-- AI Assistance -->


                  <!-- Light/Dark Mode Button -->
                  {{-- <div class="header-item d-none d-sm-flex me-2">
          <button
            class="topbar-link btn btn-icon topbar-link"
            id="light-dark-mode"
            type="button">
            <i class="ti ti-moon fs-16"></i>
          </button>
        </div> --}}

                  <!-- Notification Dropdown -->
                  <div class="header-item">
                      <div class="dropdown me-1">
                          <button class="topbar-link btn btn-icon topbar-link dropdown-toggle drop-arrow-none"
                              data-bs-toggle="dropdown" data-bs-offset="0,24" type="button" aria-haspopup="false"
                              aria-expanded="false">
                              <i class="ti ti-bell-ringing fs-16 animate-ring"></i>
                              <span class="notification-badge"></span>
                          </button>

                          <div class="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg" style="min-height: 300px">
                              <div class="p-2 border-bottom">
                                  <div class="row align-items-center">
                                      <div class="col">
                                          <h6 class="m-0 fs-16 fw-semibold">Notifications</h6>
                                      </div>
                                  </div>
                              </div>

                              <!-- Notification Body -->
                              <div class="notification-body position-relative z-2 rounded-0" data-simplebar>
                                  <!-- Item-->
                                  <div class="dropdown-item notification-item py-3 text-wrap border-bottom"
                                      id="notification-1">
                                      <div class="d-flex">
                                          <div class="me-2 position-relative flex-shrink-0">
                                              <img src="{{ asset('assets-doctor/img/profiles/avatar-01.jpg') }}"
                                                  class="avatar-md rounded-circle" alt="" />
                                          </div>
                                          <div class="flex-grow-1">
                                              <p class="mb-0 fw-medium text-dark">{{ Auth::user()->name }}</p>
                                              <p class="mb-1 text-wrap">
                                                  updated the
                                                  <span class="fw-medium text-dark">surgery</span>
                                                  schedule.
                                              </p>
                                              <div class="d-flex justify-content-between align-items-center">
                                                  <span class="fs-12"><i class="ti ti-clock me-1"></i>4 min
                                                      ago</span>
                                                  <div
                                                      class="notification-action d-flex align-items-center float-end gap-2">
                                                      <a href="javascript:void(0);"
                                                          class="notification-read rounded-circle bg-danger"
                                                          data-bs-toggle="tooltip" title=""
                                                          data-bs-original-title="Make as Read"
                                                          aria-label="Make as Read"></a>
                                                      <button class="btn rounded-circle p-0"
                                                          data-dismissible="#notification-1">
                                                          <i class="ti ti-x"></i>
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <!-- Item-->
                                  <div class="dropdown-item notification-item py-3 text-wrap border-bottom"
                                      id="notification-2">
                                      <div class="d-flex">
                                          <div class="me-2 position-relative flex-shrink-0">
                                              <img src="{{ asset('assets-doctor/img/doctors/doctor-06.jpg') }}"
                                                  class="avatar-md rounded-circle" alt="" />
                                          </div>
                                          <div class="flex-grow-1">
                                              <p class="mb-0 fw-medium text-dark">Dr. Patel</p>
                                              <p class="mb-1 text-wrap">
                                                  completed a
                                                  <span class="fw-medium text-dark">follow-up</span>
                                                  report for patient
                                                  <span class="fw-medium text-dark">Emily</span>.
                                              </p>
                                              <div class="d-flex justify-content-between align-items-center">
                                                  <span class="fs-12"><i class="ti ti-clock me-1"></i>8 min
                                                      ago</span>
                                                  <div
                                                      class="notification-action d-flex align-items-center float-end gap-2">
                                                      <a href="javascript:void(0);"
                                                          class="notification-read rounded-circle bg-danger"
                                                          data-bs-toggle="tooltip" title=""
                                                          data-bs-original-title="Make as Read"
                                                          aria-label="Make as Read"></a>
                                                      <button class="btn rounded-circle p-0"
                                                          data-dismissible="#notification-2">
                                                          <i class="ti ti-x"></i>
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <!-- Item-->
                                  <div class="dropdown-item notification-item py-3 text-wrap border-bottom"
                                      id="notification-3">
                                      <div class="d-flex">
                                          <div class="me-2 position-relative flex-shrink-0">
                                              <img src="assets-doctor/img/doctors/doctor-02.jpg"
                                                  class="avatar-md rounded-circle" alt="" />
                                          </div>
                                          <div class="flex-grow-1">
                                              <p class="mb-0 fw-medium text-dark">Emily</p>
                                              <p class="mb-1 text-wrap">
                                                  booked an appointment with
                                                  <span class="fw-medium text-dark">Dr. Patel</span>
                                                  for
                                                  <span class="fw-medium text-dark">April 15</span>
                                              </p>
                                              <div class="d-flex justify-content-between align-items-center">
                                                  <span class="fs-12"><i class="ti ti-clock me-1"></i>15 min
                                                      ago</span>
                                                  <div
                                                      class="notification-action d-flex align-items-center float-end gap-2">
                                                      <a href="javascript:void(0);"
                                                          class="notification-read rounded-circle bg-danger"
                                                          data-bs-toggle="tooltip" title=""
                                                          data-bs-original-title="Make as Read"
                                                          aria-label="Make as Read"></a>
                                                      <button class="btn rounded-circle p-0"
                                                          data-dismissible="#notification-3">
                                                          <i class="ti ti-x"></i>
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <!-- Item-->
                                  <div class="dropdown-item notification-item py-3 text-wrap" id="notification-4">
                                      <div class="d-flex">
                                          <div class="me-2 position-relative flex-shrink-0">
                                              <img src="assets-doctor/img/doctors/doctor-07.jpg"
                                                  class="avatar-md rounded-circle" alt="" />
                                          </div>
                                          <div class="flex-grow-1">
                                              <p class="mb-0 fw-medium text-dark">Amelia</p>
                                              <p class="mb-1 text-wrap">
                                                  completed the
                                                  <span class="fw-medium text-dark">pre-visit</span>
                                                  health questionnaire.
                                              </p>
                                              <div class="d-flex justify-content-between align-items-center">
                                                  <span class="fs-12"><i class="ti ti-clock me-1"></i>20 min
                                                      ago</span>
                                                  <div
                                                      class="notification-action d-flex align-items-center float-end gap-2">
                                                      <a href="javascript:void(0);"
                                                          class="notification-read rounded-circle bg-danger"
                                                          data-bs-toggle="tooltip" title=""
                                                          data-bs-original-title="Make as Read"
                                                          aria-label="Make as Read"></a>
                                                      <button class="btn rounded-circle p-0"
                                                          data-dismissible="#notification-4">
                                                          <i class="ti ti-x"></i>
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <!-- View All-->
                              <div class="p-2 rounded-bottom border-top text-center">
                                  <a href="" class="text-center text-decoration-underline fs-14 mb-0">
                                      View All Notifications
                                  </a>
                              </div>
                          </div>
                      </div>
                  </div>

                  @php
                      $user = Auth::user();
                      $photo = $user && $user->profile_photo_path ? asset($user->profile_photo_path) : null;

                      // Generate initials if no image
                      $initials = '';
                      if ($user && $user->name) {
                          $nameParts = explode(' ', trim($user->name));
                          $firstLetter = strtoupper(substr($nameParts[0], 0, 1));
                          $secondLetter = isset($nameParts[1]) ? strtoupper(substr($nameParts[1], 0, 1)) : '';
                          $initials = $firstLetter . $secondLetter;
                      }
                  @endphp

                  <!-- Dropdown trigger -->
                  <a href="javascript:void(0);" class="topbar-link dropdown-toggle drop-arrow-none position-relative"
                      data-bs-toggle="dropdown"data-bs-offset="0,22" aria-haspopup="false"aria-expanded="false">

                      @if ($photo)
                          <img src="{{ $photo }}" class="rounded-circle" alt="user-image"
                              style="height: 34px; width: 34px; position: relative; top: 7px;" />
                      @else
                          <div class="rounded-circle bg-light d-flex align-items-center justify-content-center"
                              style="width:32px; height:32px; font-weight:600; color:#333;">
                              {{ $initials }}
                          </div>
                      @endif

                      <span class="online text-success">
                          <i
                              class="ti ti-circle-filled d-flex bg-white rounded-circle border border-1 border-white"></i>
                      </span>
                  </a>

                  <div class="dropdown-menu dropdown-menu-end dropdown-menu-md p-2">
                      <div class="d-flex align-items-center bg-light rounded-3 p-2 mb-2">
                          @if ($photo)
                              <img src="{{ $photo }}" class="rounded-circle" width="42" height="42"
                                  alt="Profile" />
                          @else
                              <div class="rounded-circle bg-white d-flex align-items-center justify-content-center border"
                                  style="width:42px; height:42px; font-weight:700; color:#333;">
                                  {{ $initials }}
                              </div>
                          @endif
                          <div class="ms-2">
                              <p class="fw-medium text-dark mb-0">{{ $user->name ?? 'Guest User' }}</p>
                              <span class="d-block fs-13 text-capitalize">{{ $user->role ?? '' }}</span>
                          </div>
                      </div>

                          <a href="{{ route('doctor.profile') }}" class="dropdown-item">
                            <i class="ti ti-settings me-1 align-middle"></i>
                            <span class="align-middle">Profile Settings</span>
                        </a>

                        <a href="{{ route('doctor.consult-pdf') }}" class="dropdown-item">
                          <i class="ti ti-user-circle me-1 align-middle"></i>
                          <span class="align-middle">Upload Consult PDF </span>
                      </a>


                      <div class="pt-2 mt-2 border-top">
                          <a href="{{ route('doctor.logout') }}" class="dropdown-item text-danger"
                              style="background: rgb(246, 197, 197)">
                              <i class="ti ti-logout me-1 fs-17 align-middle"></i>
                              <span class="align-middle">Log Out</span>
                          </a>
                      </div>
                  </div>



              </div>
          </div>
      </header>

      @include('doctor.inc.sidebar')
      {{-- @include('layouts.chat-boat') --}}
      @yield('content')
      

          <nav class="mobile-footer-nav">
              <div class="footer-nav-container">
                  <!-- Dashboard -->
                  <a href="{{ route('doctor.dashboard') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.dashboard') ? 'active' : '' }}">
                      <i class="ti ti-layout-dashboard footer-nav-icon"></i>
                      <span class="footer-nav-text">Dashboard</span>
                  </a>

                  <!-- Schedule -->
                  <a href="{{ route('doctor.doctor-schedule') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.doctor-schedule') ? 'active' : '' }}">
                      <i class="ti ti-calendar-time footer-nav-icon"></i>
                      <span class="footer-nav-text">Schedule</span>
                  </a>

                  <!-- Patients -->
                  <a href="{{ route('doctor.patient-registration') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.patient-registration') ? 'active' : '' }}">
                      <i class="ti ti-user-plus footer-nav-icon"></i>
                      <span class="footer-nav-text">Registrations</span>
                  </a>

                  <!-- Appointments -->
                  <a href="{{ route('doctors.appointment') }}"
                      class="footer-nav-item {{ request()->routeIs('doctors.appointment') ? 'active' : '' }}">
                      <i class="ti ti-calendar-event footer-nav-icon"></i>
                      <span class="footer-nav-text">Appointments</span>
                  </a>

                  <!-- Finance -->
                  <a href="{{ route('doctor.income-expence') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.income-expence') ? 'active' : '' }}">
                      <i class="ti ti-cash footer-nav-icon"></i>
                      <span class="footer-nav-text">Inc & Exp...</span>
                  </a>

                  <!-- Home Visit -->
                  <a href="{{ route('doctor-home-visit') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor-home-visit') ? 'active' : '' }}">
                      <i class="ti ti-home-heart footer-nav-icon"></i>
                      <span class="footer-nav-text">Home Visit</span>
                  </a>

                  <!-- Test Booking -->
                  <a href="{{ route('doctor-test-booking') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor-test-booking') ? 'active' : '' }}">
                      <i class="ti ti-test-pipe footer-nav-icon"></i>
                      <span class="footer-nav-text">Test Booking</span>
                  </a>

                  <!-- Billing -->
                  <a href="{{ route('doctor-billing') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor-billing') ? 'active' : '' }}">
                      <i class="ti ti-calculator footer-nav-icon"></i>
                      <span class="footer-nav-text">Billing</span>
                  </a>

                  <!-- Shop -->
                  <a href="{{ route('doctors.shoping') }}"
                      class="footer-nav-item {{ request()->routeIs('doctors.shoping') ? 'active' : '' }}">
                      <i class="ti ti-shopping-cart footer-nav-icon"></i>
                      <span class="footer-nav-text">Shop</span>
                  </a>

                  <!-- Chat -->
                  <a href="{{ route('doctor.chat') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.chat') ? 'active' : '' }}">
                      <i class="ti ti-message-circle footer-nav-icon"></i>
                      <span class="footer-nav-text">Chat</span>
                  </a>

                  <!-- Support -->
                  <a href="{{ route('doctor.supports') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.supports') ? 'active' : '' }}">
                      <i class="ti ti-headset footer-nav-icon"></i>
                      <span class="footer-nav-text">Support</span>
                  </a>

                  <!-- Logout -->
                  <a href="{{ route('doctor.logout') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.logout') ? 'active' : '' }}">
                      <i class="ti ti-logout footer-nav-icon"></i>
                      <span class="footer-nav-text">Logout</span>
                  </a>
              </div>
              <div class="scroll-indicator">
                  <i class="ti ti-chevron-right"></i>
              </div>
          </nav>



      <script>
          window.addEventListener('load', function() {
              const loader = document.getElementById('pageLoader');
              loader.style.opacity = '0';
              loader.style.transition = 'opacity 0.4s ease';

              setTimeout(() => {
                  loader.style.display = 'none';
              }, 400);
          });
      </script>


{{-- Place this in your Blade layout file (e.g., resources/views/layouts/app.blade.php) at the end of the <body> tag --}}
{{-- Core Scripts --}}
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

{{-- Bootstrap Core JS --}}
<script src="{{ asset('assets-doctor/js/bootstrap.bundle.min.js') }}"></script>

{{-- Simplebar JS --}}
<script src="{{ asset('assets-doctor/plugins/simplebar/simplebar.min.js') }}" type="b0ec8db7ecf17caaef04ec29-text/javascript"></script>

{{-- Bootstrap Tagsinput JS --}}
<script src="{{ asset('assets-doctor/plugins/bootstrap-tagsinput/bootstrap-tagsinput.js') }}" type="41d2ef6b95c770070dc31f01-text/javascript"></script>


{{-- Chart JS --}}
<script src="{{ asset('assets-doctor/plugins/apexchart/apexcharts.min.js') }}" type="b0ec8db7ecf17caaef04ec29-text/javascript"></script>
<script src="{{ asset('assets-doctor/plugins/apexchart/chart-data.js') }}" type="b0ec8db7ecf17caaef04ec29-text/javascript"></script>

{{-- Daterangepicker JS --}}
<script src="{{ asset('assets-doctor/js/moment.min.js') }}" type="b0ec8db7ecf17caaef04ec29-text/javascript"></script>
<script src="{{ asset('assets-doctor/plugins/daterangepicker/daterangepicker.js') }}" type="b0ec8db7ecf17caaef04ec29-text/javascript"></script>


{{-- Datatable JS --}}
<script src="{{ asset('assets-doctor/js/jquery.dataTables.min.js') }}" type="d7ab00c85387527fb6389a9e-text/javascript"></script>
<script src="{{ asset('assets-doctor/js/dataTables.bootstrap5.min.js') }}" type="d7ab00c85387527fb6389a9e-text/javascript"></script>

<!-- {{-- Sticky Sidebar JS --}} -->
<script src="{{ asset('assets-doctor/plugins/theia-sticky-sidebar/ResizeSensor.js') }}" type="073a2955813255868fa77a9c-text/javascript"></script>
<script src="{{ asset('assets-doctor/plugins/theia-sticky-sidebar/theia-sticky-sidebar.js') }}" type="073a2955813255868fa77a9c-text/javascript"></script>

<!-- {{-- Quill JS --}} -->
<script src="{{ asset('assets-doctor/plugins/quill/quill.min.js') }}" type="198926ab169b832f9d295c8a-text/javascript"></script>

{{-- Main JS --}}
<script src="{{ asset('assets-doctor/js/script.js') }}" type="b0ec8db7ecf17caaef04ec29-text/javascript"></script>
<script src="{{ asset('assets-doctor/js/chat.js') }}" type="bc2836e2c16c28f0a177d9db-text/javascript"></script>
<script src="{{ asset('assets-doctor/js/social-feed.js') }}" type="073a2955813255868fa77a9c-text/javascript"></script>
<script src="{{ asset('assets-doctor/js/slimscroll.js') }}" type="bc2836e2c16c28f0a177d9db-text/javascript"></script>
<script src="{{ asset('assets-doctor/js/email.js') }}" type="073a2955813255868fa77a9c-text/javascript"></script>
<script src="{{ asset('assets-doctor/js/doctors.js') }}" type="0f6cef9345aac4958c4812e8-text/javascript"></script>
<script src="{{ asset('assets-doctor/js/script.js') }}"></script>

{{-- Cloudflare Scripts removed for local development --}}
{{-- <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="b0ec8db7ecf17caaef04ec29-|49" defer></script> --}}
{{-- <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960febd0198051de","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script> --}}


<script src="{{ asset('assets-doctor/js/select2.min.js') }}"></script>

<!-- Removed duplicate jQuery include -->
 <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js"></script>

<script src="assets-doctor/js/chat.js"></script>
{{-- <script src="cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="01cd92e3dea705644e299b13-|49" defer></script><script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"960febd2ce2df04f","version":"2025.7.0","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"token":"3ca157e612a14eccbb30cf6db6691c29","b":1}' crossorigin="anonymous"></script> --}}

    
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    
@include('layouts.notification')
@stack('scripts')

@include('layouts.skora-assistant')

@php
    $currentUser = auth()->user();
    $isExpired = false;
    $supportEmail = 'Support@skoracares.in';
    $supportPhone = '+91-9876543210';
    $supportWhatsapp = '+91-9876543210';
    $whatsappUrl = '#';
    $callUrl = '#';
    $emailUrl = '#';
    
    if ($currentUser && in_array($currentUser->role, ['doctor', 'receptionist', 'nurse', 'accountant'])) {
        $doctorId = $currentUser->getDoctorIdContext();
        $doctor = ($doctorId === $currentUser->id) ? $currentUser : \App\Models\User::find($doctorId);
        if ($doctor && $doctor->role === 'doctor' && $doctor->trial_ends_at && now()->gt($doctor->trial_ends_at)) {
            $isExpired = true;
            
            $settings = \App\Models\CompanySetting::find(1);
            if ($settings) {
                $supportEmail = $settings->company_email1 ?? $supportEmail;
                $supportPhone = $settings->company_mobile1 ?? $supportPhone;
                $supportWhatsapp = $settings->company_whatsapp1 ?? $supportPhone;
            }
            
            $cleanWhatsapp = preg_replace('/[^0-9]/', '', $supportWhatsapp);
            if (strlen($cleanWhatsapp) == 10) {
                $cleanWhatsapp = '91' . $cleanWhatsapp;
            }
            $message = "Hi, my trial plan on SkoraCares has expired.\nDoctor: " . ($doctor->name ?? '') . "\nEmail: " . ($doctor->email ?? '') . "\nI want to extend/renew my plan.";
            $whatsappUrl = "https://wa.me/" . $cleanWhatsapp . "?text=" . urlencode($message);
            $callUrl = "tel:" . preg_replace('/[^0-9+]/', '', $supportPhone);
            $emailUrl = "mailto:" . $supportEmail . "?subject=" . urlencode("Subscription Renewal Request - " . ($doctor->name ?? '')) . "&body=" . urlencode($message);
        }
    }
@endphp

@if($isExpired)
<style>
    body {
        overflow: hidden !important;
    }
    
    /* Overlay Wrapper to block interactions and show dashboard in blur background */
    .expired-overlay-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(12, 17, 29, 0.65);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 99999999 !important; /* Higher than sidebar, maps, and header */
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    }

    .expired-overlay-wrapper .expired-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        max-width: 950px;
        width: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        animation: fadeInOverlay 0.4s ease-out;
    }

    @keyframes fadeInOverlay {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }

    /* Left Side Panel - Gradient */
    .expired-overlay-wrapper .panel-left {
        flex: 1;
        background: linear-gradient(135deg, #5b3ce2 0%, #1e139c 100%);
        padding: 30px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: #ffffff;
        position: relative;
        overflow: hidden;
    }

    /* Ambient glows inside panel-left */
    .expired-overlay-wrapper .panel-left::after {
        content: '';
        position: absolute;
        width: 150px;
        height: 150px;
        background: #f8d756;
        opacity: 0.12;
        filter: blur(50px);
        top: -20px;
        right: -20px;
        border-radius: 50%;
    }

    .expired-overlay-wrapper .expired-title {
        font-family: 'Outfit', sans-serif;
        font-size: 2.3rem;
        font-weight: 800;
        line-height: 1.2;
        margin-bottom: 12px;
        color: #ffffff;
        letter-spacing: -0.5px;
    }

    .expired-overlay-wrapper .expired-desc {
        font-size: 0.95rem;
        line-height: 1.5;
        opacity: 0.9;
        margin-bottom: 25px;
        color: #ffffff;
    }

    /* Yellow Offer Box */
    .expired-overlay-wrapper .offer-box {
        background: #fbbd08;
        border-radius: 12px;
        padding: 16px 18px;
        color: #1e293b;
        position: relative;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        margin-top: auto;
        margin-bottom: 20px;
        border: 1px dashed rgba(30, 41, 59, 0.2);
    }

    .expired-overlay-wrapper .offer-divider {
        border-top: 1px dashed rgba(30, 41, 59, 0.25);
        margin: 12px -18px;
        position: relative;
    }

    .expired-overlay-wrapper .offer-divider::before, 
    .expired-overlay-wrapper .offer-divider::after {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        background-color: #3b25be; 
        border-radius: 50%;
        top: -7px;
    }
    
    .expired-overlay-wrapper .offer-divider::before {
        left: -7px;
    }
    
    .expired-overlay-wrapper .offer-divider::after {
        right: -7px;
        background-color: #3320ad; 
    }

    .expired-overlay-wrapper .offer-title {
        font-family: 'Outfit', sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .expired-overlay-wrapper .offer-text {
        font-size: 0.85rem;
        line-height: 1.4;
        margin-bottom: 12px;
        opacity: 0.9;
    }

    .expired-overlay-wrapper .offer-btn {
        background-color: #24a148;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: 600;
        font-size: 0.9rem;
        width: 100%;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
        text-align: center;
    }

    .expired-overlay-wrapper .offer-btn:hover {
        background-color: #1e8e3e;
        color: #ffffff;
        transform: translateY(-1px);
    }

    /* Contact Details Footer inside Panel Left */
    .expired-overlay-wrapper .support-footer {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        padding-top: 15px;
    }

    .expired-overlay-wrapper .support-footer a {
        color: #ffffff;
        text-decoration: none;
        font-weight: 600;
    }

    .expired-overlay-wrapper .support-footer a:hover {
        text-decoration: underline;
    }

    /* Right Side Panel - Info list and Actions */
    .expired-overlay-wrapper .panel-right {
        flex: 1.1;
        background-color: #ffffff;
        padding: 30px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .expired-overlay-wrapper .features-title {
        font-family: 'Outfit', sans-serif;
        color: #1e293b;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 6px;
    }

    .expired-overlay-wrapper .features-subtitle {
        color: #64748b;
        font-size: 0.95rem;
        margin-bottom: 20px;
    }

    /* Feature items checklist */
    .expired-overlay-wrapper .feature-list {
        list-style: none;
        padding: 0;
        margin-bottom: 25px;
    }

    .expired-overlay-wrapper .feature-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 14px;
    }

    .expired-overlay-wrapper .feature-icon-wrapper {
        background-color: rgba(91, 60, 226, 0.08);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .expired-overlay-wrapper .feature-icon-wrapper i {
        color: #5b3ce2;
        font-size: 0.75rem;
    }

    .expired-overlay-wrapper .feature-text {
        color: #334155;
        font-size: 0.92rem;
        font-weight: 500;
        line-height: 1.4;
    }

    /* Buttons section */
    .expired-overlay-wrapper .actions-wrapper {
        display: flex;
        gap: 12px;
        margin-bottom: 10px;
        margin-top: auto;
    }

    .expired-overlay-wrapper .btn-action-outline {
        flex: 1;
        border: 2px solid #5b3ce2;
        color: #5b3ce2;
        background: transparent;
        border-radius: 10px;
        padding: 12px 16px;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        text-decoration: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .expired-overlay-wrapper .btn-action-outline:hover {
        background-color: rgba(91, 60, 226, 0.05);
        transform: translateY(-1px);
    }

    .expired-overlay-wrapper .btn-action-solid {
        flex: 1;
        background-color: #5b3ce2;
        color: #ffffff;
        border: none;
        border-radius: 10px;
        padding: 12px 16px;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        text-decoration: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .expired-overlay-wrapper .btn-action-solid:hover {
        background-color: #4328bc;
        color: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 5px 12px rgba(91, 60, 226, 0.2);
    }

    /* Responsiveness */
    @media (max-width: 991px) {
        .expired-overlay-wrapper .expired-card {
            flex-direction: column;
            max-width: 500px;
            margin: 20px 0;
        }

        .expired-overlay-wrapper .panel-left, .expired-overlay-wrapper .panel-right {
            padding: 25px 20px;
        }

        .expired-overlay-wrapper .expired-title {
            font-size: 1.8rem;
        }

        .expired-overlay-wrapper .offer-box {
            margin-top: 20px;
        }
    }

    @media (max-width: 480px) {
        .expired-overlay-wrapper .actions-wrapper {
            flex-direction: column;
            gap: 10px;
        }
    }
</style>

<div class="expired-overlay-wrapper">
    <div class="expired-card">
        <!-- Left Column -->
        <div class="panel-left">
            <div>
                <h1 class="expired-title">Your trial plan<br>has Expired!</h1>
                <p class="expired-desc">Your trial plan has expired. Upgrade now to continue a hassle free access!</p>
            </div>
            
            <div class="offer-box">
                <h3 class="offer-title">🎁 Wait! Just for You...</h3>
                <p class="offer-text">Need more time? Extend your trial plan — limited-time only!</p>
                <div class="offer-divider"></div>
                <a href="{{ $whatsappUrl }}" target="_blank" class="offer-btn">
                    Extend Your Trial Plan
                </a>
            </div>

            <div class="support-footer">
                <i class="fas fa-headset"></i> Contact Support: <a href="{{ $callUrl }}">{{ $supportPhone }}</a> | <a href="{{ $emailUrl }}">{{ $supportEmail }}</a>
            </div>
        </div>

        <!-- Right Column -->
        <div class="panel-right">
            <div>
                <h2 class="features-title">Don't Lose Your Digital Advantage!</h2>
                <p class="features-subtitle">Upgrade your plan to continue</p>
                
                <ul class="feature-list">
                    <li class="feature-item">
                        <div class="feature-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="feature-text">Seamless clinic management all in one place.</span>
                    </li>
                    <li class="feature-item">
                        <div class="feature-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="feature-text">Secure & instant access to patient records.</span>
                    </li>
                    <li class="feature-item">
                        <div class="feature-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="feature-text">Effortless e-prescriptions with less paperwork.</span>
                    </li>
                    <li class="feature-item">
                        <div class="feature-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="feature-text">Generate AI-powered prescriptions in seconds & more.</span>
                    </li>
                </ul>
            </div>

            <div class="actions-wrapper">
                <a href="{{ $callUrl }}" class="btn-action-outline">
                    <i class="fas fa-phone-alt"></i> Request a call back
                </a>
                <a href="{{ $whatsappUrl }}" target="_blank" class="btn-action-solid">
                    <i class="fas fa-unlock-alt"></i> Get Unlimited Access
                </a>
            </div>
        </div>
    </div>
</div>
@endif
  </body>

  </html>
