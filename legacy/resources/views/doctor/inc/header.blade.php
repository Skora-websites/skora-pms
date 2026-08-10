<header class="navbar-header" style="box-shadow: 6px 1px 8px 0px rgb(14 96 110 / 54%);">
  <div class="page-container topbar-menu">
    <div class="d-flex align-items-center gap-2">
      <!-- Logo -->
      <a href="index.php" class="logo">
        <!-- Logo Normal -->
        <span class="logo-light">
          <span class="logo-sm"><img src="{{ asset('assets-doctor/img/logo-small.svg')}}" alt="small logo" /></span>
        </span>

        <!-- Logo Dark -->
        <span class="logo-dark">
          <span class="logo-lg"><img src="{{ asset('assets-doctor/img/logo-white.svg')}}" alt="dark logo" /></span>
        </span>
      </a>

      <!-- Sidebar Mobile Button -->
      <a id="mobile_btn" class="mobile-btn" href="#sidebar">
        <i class="ti ti-menu-deep fs-24"></i>
      </a>

      <button
        class="sidenav-toggle-btn btn border-0 p-0 active"
        id="toggle_btn2">
        <i class="ti ti-arrow-right"></i>
      </button>

      <!-- Search -->
      {{-- <div
        class="me-auto d-flex align-items-center header-search d-lg-flex d-none">
        <!-- Search -->
        <div class="input-icon-start position-relative me-2">
          <span class="input-icon-addon">
            <i class="ti ti-search"></i>
          </span>
          <input
            type="text"
            class="form-control shadow-sm"
            placeholder="Search" />
          <span
            class="input-icon-addon text-dark shadow fs-18 d-inline-flex p-0 header-search-icon"><i class="ti ti-command"></i></span>
        </div>
        <!-- /Search -->
      </div> --}}
    </div>

    <div class="d-flex align-items-center">
      <!-- Search for Mobile -->
      <div class="header-item d-flex d-lg-none me-2">
        <button
          class="topbar-link btn btn-icon"
          data-bs-toggle="modal"
          data-bs-target="#searchModal"
          type="button">
          <i class="ti ti-search fs-16"></i>
        </button>
      </div>

      {{-- <a href="" class="btn btn-liner-gradient me-3 d-lg-flex d-none" data-bs-toggle="modal" data-bs-target="#wallet">Wallet<i class="ti ti-wallet mx-1"></i> $ 654</a> --}}

      <!-- AI Assistance -->
  <a href="javascript:void(0);" id="toggleButton" class=" btn btn-liner-gradient me-3 d-lg-flex d-none toggle-help-panel">
    <span class="animated-text">  Skora Assistance</span> <i class="ti ti-robot ms-1"></i>
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
        <div class="dropdown me-3">
          <button
            class="topbar-link btn btn-icon topbar-link dropdown-toggle drop-arrow-none"
            data-bs-toggle="dropdown"
            data-bs-offset="0,24"
            type="button"
            aria-haspopup="false"
            aria-expanded="false">
            <i class="ri-notification-3-line fs-16 animate-ring"></i>
            <span class="notification-badge"></span>
          </button>

          <div
            class="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg"
            style="min-height: 300px">
            <div class="p-2 border-bottom">
              <div class="row align-items-center">
                <div class="col">
                  <h6 class="m-0 fs-16 fw-semibold">Notifications</h6>
                </div>
              </div>
            </div>

            <!-- Notification Body -->
            <div
              class="notification-body position-relative z-2 rounded-0"
              data-simplebar>
              <!-- Item-->
              <div
                class="dropdown-item notification-item py-3 text-wrap border-bottom"
                id="notification-1">
                <div class="d-flex">
                  <div class="me-2 position-relative flex-shrink-0">
                    <img
                      src="{{ asset('assets-doctor/img/profiles/avatar-01.jpg')}}"
                      class="avatar-md rounded-circle"
                      alt="" />
                  </div>
                  <div class="flex-grow-1">
                    <p class="mb-0 fw-medium text-dark">{{ Auth::user()->name }}</p>
                    <p class="mb-1 text-wrap">
                      updated the
                      <span class="fw-medium text-dark">surgery</span>
                      schedule.
                    </p>
                    <div
                      class="d-flex justify-content-between align-items-center">
                      <span class="fs-12"><i class="ti ti-clock me-1"></i>4 min ago</span>
                      <div
                        class="notification-action d-flex align-items-center float-end gap-2">
                        <a
                          href="javascript:void(0);"
                          class="notification-read rounded-circle bg-danger"
                          data-bs-toggle="tooltip"
                          title=""
                          data-bs-original-title="Make as Read"
                          aria-label="Make as Read"></a>
                        <button
                          class="btn rounded-circle p-0"
                          data-dismissible="#notification-1">
                          <i class="ti ti-x"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Item-->
              <div
                class="dropdown-item notification-item py-3 text-wrap border-bottom"
                id="notification-2">
                <div class="d-flex">
                  <div class="me-2 position-relative flex-shrink-0">
                    <img
                      src="{{ asset('assets-doctor/img/doctors/doctor-06.jpg')}}"
                      class="avatar-md rounded-circle"
                      alt="" />
                  </div>
                  <div class="flex-grow-1">
                    <p class="mb-0 fw-medium text-dark">Dr. Patel</p>
                    <p class="mb-1 text-wrap">
                      completed a
                      <span class="fw-medium text-dark">follow-up</span>
                      report for patient
                      <span class="fw-medium text-dark">Emily</span>.
                    </p>
                    <div
                      class="d-flex justify-content-between align-items-center">
                      <span class="fs-12"><i class="ti ti-clock me-1"></i>8 min ago</span>
                      <div
                        class="notification-action d-flex align-items-center float-end gap-2">
                        <a
                          href="javascript:void(0);"
                          class="notification-read rounded-circle bg-danger"
                          data-bs-toggle="tooltip"
                          title=""
                          data-bs-original-title="Make as Read"
                          aria-label="Make as Read"></a>
                        <button
                          class="btn rounded-circle p-0"
                          data-dismissible="#notification-2">
                          <i class="ti ti-x"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Item-->
              <div
                class="dropdown-item notification-item py-3 text-wrap border-bottom"
                id="notification-3">
                <div class="d-flex">
                  <div class="me-2 position-relative flex-shrink-0">
                    <img
                      src="assets-doctor/img/doctors/doctor-02.jpg"
                      class="avatar-md rounded-circle"
                      alt="" />
                  </div>
                  <div class="flex-grow-1">
                    <p class="mb-0 fw-medium text-dark">Emily</p>
                    <p class="mb-1 text-wrap">
                      booked an appointment with
                      <span class="fw-medium text-dark">Dr. Patel</span>
                      for
                      <span class="fw-medium text-dark">April 15</span>
                    </p>
                    <div
                      class="d-flex justify-content-between align-items-center">
                      <span class="fs-12"><i class="ti ti-clock me-1"></i>15 min ago</span>
                      <div
                        class="notification-action d-flex align-items-center float-end gap-2">
                        <a
                          href="javascript:void(0);"
                          class="notification-read rounded-circle bg-danger"
                          data-bs-toggle="tooltip"
                          title=""
                          data-bs-original-title="Make as Read"
                          aria-label="Make as Read"></a>
                        <button
                          class="btn rounded-circle p-0"
                          data-dismissible="#notification-3">
                          <i class="ti ti-x"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Item-->
              <div
                class="dropdown-item notification-item py-3 text-wrap"
                id="notification-4">
                <div class="d-flex">
                  <div class="me-2 position-relative flex-shrink-0">
                    <img
                      src="assets-doctor/img/doctors/doctor-07.jpg"
                      class="avatar-md rounded-circle"
                      alt="" />
                  </div>
                  <div class="flex-grow-1">
                    <p class="mb-0 fw-medium text-dark">Amelia</p>
                    <p class="mb-1 text-wrap">
                      completed the
                      <span class="fw-medium text-dark">pre-visit</span>
                      health questionnaire.
                    </p>
                    <div
                      class="d-flex justify-content-between align-items-center">
                      <span class="fs-12"><i class="ti ti-clock me-1"></i>20 min ago</span>
                      <div
                        class="notification-action d-flex align-items-center float-end gap-2">
                        <a
                          href="javascript:void(0);"
                          class="notification-read rounded-circle bg-danger"
                          data-bs-toggle="tooltip"
                          title=""
                          data-bs-original-title="Make as Read"
                          aria-label="Make as Read"></a>
                        <button
                          class="btn rounded-circle p-0"
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
              <a
                href=""
                class="text-center text-decoration-underline fs-14 mb-0">
                View All Notifications
              </a>
            </div>
          </div>
        </div>
      </div>

    @php
        $user = Auth::user();
        $photo = $user && $user->profile_photo_path 
            ? asset($user->profile_photo_path) 
            : null;

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
    <a href="javascript:void(0);" 
      class="topbar-link dropdown-toggle drop-arrow-none position-relative"
      data-bs-toggle="dropdown"data-bs-offset="0,22"
      aria-haspopup="false"aria-expanded="false">

        @if ($photo)
            <img src="{{ $photo }}" class="rounded-circle" alt="user-image" style="height: 42px; width: 42px; position: relative; top: 7px;"/>
        @else
            <div class="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                style="width:32px; height:32px; font-weight:600; color:#333;">
                {{ $initials }}
            </div>
        @endif

        <span class="online text-success">
            <i class="ti ti-circle-filled d-flex bg-white rounded-circle border border-1 border-white"></i>
        </span>
    </a>

    <div class="dropdown-menu dropdown-menu-end dropdown-menu-md p-2">
        <div class="d-flex align-items-center bg-light rounded-3 p-2 mb-2">
            @if ($photo)
                <img src="{{ $photo }}" class="rounded-circle" width="42" height="42" alt="Profile" />
            @else
                <div class="rounded-circle bg-white d-flex align-items-center justify-content-center border" 
                    style="width:42px; height:42px; font-weight:700; color:#333;">
                    {{ $initials }}
                </div>
            @endif
            <div class="ms-2">
                <p class="fw-medium text-dark mb-0">{{ $user->name ?? 'Guest User' }}</p>
                @php
                    $roleName = $user->roles->first() ? $user->roles->first()->name : ($user->role ?? '');
                @endphp
                <span class="d-block fs-13 text-capitalize">{{ $roleName }}</span>
            </div>
        </div>

        <a href="{{ route('doctor.profile') }}" class="dropdown-item">
            <i class="ti ti-user-circle me-1 align-middle"></i>
            <span class="align-middle">Profile Settings</span>
        </a>

        <div class="pt-2 mt-2 border-top">
            <a href="{{ route('doctor.logout') }}" 
              class="dropdown-item text-danger" 
              style="background: rgb(246, 197, 197)">
                <i class="ti ti-logout me-1 fs-17 align-middle"></i>
                <span class="align-middle">Log Out</span>
            </a>
        </div>
    </div>


    
  </div>
</div>
</header>

<style>
      .dashboard-card-bg{
          background-color: rgb(135 76 245 / 33%) !important;
          color: #0e606e6e !important;
          cursor: pointer !important;
    }

    .dashboard-card-bg:hover{
          background-color: rgb(135 76 245 / 33%) !important;
          color: #0e606e !important;
          cursor: pointer !important;
    }

    .card-text{
      color: #5f19da;
    font-weight: 800 !important;
    }

    .card-header h5{
        color: #0e606e !important;
        font-weight: 700 !important;
        font-size:1rem !important;
    }


     .card-header h6{
        color: #d8d7da !important;
        font-weight: 700 !important;
    }

    .card-header .card-subtitle{
    color: #0e606ea8 !important;
    }

    .floating-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background-color: #0e606e;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      transition: background-color 0.3s ease, transform 0.2s;
    }

    .floating-btn:hover {
      background-color: #6b3cc9;
      transform: scale(1.1);
    }
</style>

@include('layouts.skora-assistant')




{{-- Notification Styles --}}
<style>
    .notification-sidebar {
        position: fixed;
        top: 45px;
        right: -320px;
        z-index: 99999;
        transition: right 0.5s ease-in-out, opacity 0.5s ease;
    }
    
    .notification-sidebar.show-notification {
        right: 4px;
    }
    
    .custom-alert-box {  
        background: white;
        border-radius: 10px;
        border-left: 5px solid #28a745; /* Default: Success Green */
        overflow: hidden;
        padding: 12px;
        display: flex;
        width: auto;
        align-items: center;
        gap: 10px;
        position: relative;
    }

    .custom-alert-box.alert-success {
        border-left: 5px solid #28a745;
        background: #edfff3;
    }

    .custom-alert-box.alert-error {
        border-left: 5px solid #dc3545;
        background: #ffebed;
    }

    .custom-alert-box.alert-info {
        border-left: 5px solid #17a2b8;
        background: #e6f7f9;
    }

    .custom-alert-box.alert-warning {
        border-left: 5px solid #ffc107;
        background: #fffbeb;
    }

    .close-btn {
        background: none;
        border: none;
        color: #333;
        font-size: 20px;
        cursor: pointer;
        position: absolute;
        right: 10px;
        top: 8px;
    }

    .p-custom{
        padding: 2px 44px 3px 16px;
    }
    .icon {
        font-size: 22px;
    }
</style>

{{-- Session-based Notifications --}}
@if(session('success') || session('error') || $errors->any())
    <div class="custom-alert-box notification-sidebar position-fixed top-2 mt-3 shadow-lg rounded" id="alertContainer">
        @if(session('success'))
            <div class="alert-success p-custom">
                <i class="fas fa-check-circle text-success icon"></i>
                {{ session('success') }}
                <button type="button" class="close-btn" onclick="closeAlert()">&times;</button>
            </div>
        @endif

        @if(session('error'))
            <div class="alert-error p-custom">
                <i class="fas fa-exclamation-circle text-danger icon"></i>
                {{ session('error') }}
                <button type="button" class="close-btn" onclick="closeAlert()">&times;</button>
            </div>
        @endif

        @if ($errors->any())
            <div class="alert-error p-custom">
                <ul class="list-unstyled mb-0">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
                <button type="button" class="close-btn" onclick="closeAlert()">&times;</button>
            </div>
        @endif
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", function () {
            let alertBox = document.getElementById("alertContainer");
            if (alertBox) {
                alertBox.classList.add("show-notification");
                setTimeout(() => closeAlert(), 7000);
            }
        });

        function closeAlert() {
            let alertBox = document.getElementById("alertContainer");
            if (alertBox) {
                alertBox.style.transition = "right 0.5s ease-in-out, opacity 0.5s ease";
                alertBox.style.opacity = "0";
                setTimeout(() => alertBox.style.display = "none", 500);
            }
        }
    </script>
@endif

{{-- Advanced Notification Script --}}
<script>
    function showNotification(msg, type = 'success') {
        let alertClass = 'alert-' + type;
        let iconClass = '';
        let textClass = '';

        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle text-success';
                textClass = 'text-success';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle text-danger';
                textClass = 'text-danger';
                break;
            case 'info':
                iconClass = 'fas fa-info-circle text-info';
                textClass = 'text-info';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle text-warning';
                textClass = 'text-warning';
                break;
            default:
                iconClass = 'fas fa-check-circle text-success';
                textClass = 'text-success';
        }

        var alertBox = document.createElement("div");
        alertBox.className = `custom-alert-box ${alertClass} notification-sidebar position-fixed top-2 show-notification mt-3 shadow-lg rounded`;
        alertBox.innerHTML = `
            <div class="${textClass} p-custom">
                <i class="${iconClass} icon"></i>
                ${msg}
                <button type="button" class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        document.body.appendChild(alertBox);
        setTimeout(() => {
            alertBox.style.transition = "right 0.5s ease-in-out, opacity 0.5s ease";
            alertBox.style.opacity = "0";
            setTimeout(() => alertBox.remove(), 500);
        }, 8000);
    }
</script>

    <!-- Delete Confirmation Modal -->


  <div class="modal fade" id="delete_modal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="deleteModalLabel">Confirm Deletion</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    Are you sure you want to delete this patient record?
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>

<!-- Cleaned up old Tawk.to block -->