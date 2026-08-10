<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact " dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
  <title>Doctor Admin || Dashboard</title>
  <meta name="description" content="" />
  <meta name="keywords" content="">
  @include('super-admin.inc.header-links')
  
  <style>
    th input[type="checkbox"],
    td input[type="checkbox"] {
      margin: 0;
      transform: scale(1.2);
    }
    .card-border-shadow-Skoracares {
      border-color: #0e606e !important;
      box-shadow: 0 0.25rem 1rem rgba(135, 76, 245, 0.1);
    }
    .bg-label-purple {
      background-color: rgba(135, 76, 245, 0.1) !important;
      color: #0e606e !important;
    }
    
    /* Anti-Layout Shift Optimizations */
    #appointmentStatisticsChart {
      min-height: 310px;
    }
    #cancellationReasonsChart {
      min-height: 320px;
    }
    
    /* Smooth entrance animation for timeline items */
    .timeline-item {
      animation: fadeIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
    }
  </style>
</head>

<body>
  <!-- ?PROD Only: Google Tag Manager (noscript) (Default ThemeSelection: GTM-5DDHKGP, PixInvent: GTM-5J3LMKC) -->
  <noscript><iframe
      src="https://www.googletagmanager.com/ns.html?id=GTM-5DDHKGP"
      height="0"
      width="0"
      style="display: none; visibility: hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

  <!-- Layout wrapper -->
  <div class="layout-wrapper layout-content-navbar">
    <div class="layout-container">

      <!-- Menu -->
    @include('super-admin.inc.sidebar')
      <!-- / Menu -->
      <!-- Layout container -->
      <div class="layout-page">
        <!-- Navbar -->
       @include('super-admin.inc.header')
        <!-- / Navbar -->
        <!-- Content wrapper -->
        <div class="content-wrapper">
          <!-- Content -->
         <div class="container-xxl flex-grow-1 container-p-y">
          <!-- Card Border Shadow -->
          <div class="row">
            <div class="col-sm-6 col-lg-3 mb-6">
              <div class="card card-border-shadow-Skoracares dashboard-card-bg h-100 transition-all hover-glow" style="cursor: default !important;">
                <div class="card-body d-flex flex-row justify-content-around align-items-center p-3">
                  <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Doctor Icon" style="width: 50px; height: 50px;">
                  <div class="text-end">
                    <h4 class="mb-0 card-text">{{ $totalPrescriptions }}</h4>
                    <h6 class="mb-0 text-muted small">Total Prescriptions</h6>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-sm-6 col-lg-3 mb-6">
              <div class="card card-border-shadow-Skoracares dashboard-card-bg h-100 transition-all hover-glow" style="cursor: default !important;">
                <div class="card-body d-flex flex-row justify-content-around align-items-center p-3">
                  <img src="{{ asset('assets/img/dashboard/medical-team.png') }}" alt="Doctor Icon" style="width: 50px; height: 50px;">
                  <div class="text-end">
                    <h4 class="mb-0 card-text">{{ $totalAppointments }}</h4>
                    <h6 class="mb-0 text-muted small">Total Appointments</h6>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-sm-6 col-lg-3 mb-6">
              <div class="card card-border-shadow-Skoracares dashboard-card-bg h-100 transition-all hover-glow" style="cursor: default !important;">
                <div class="card-body d-flex flex-row justify-content-around align-items-center p-3">
                  <img src="{{ asset('assets/img/dashboard/first-aid.png') }}" alt="Doctor Icon" style="width: 50px; height: 50px;">
                  <div class="text-end">
                    <h4 class="mb-0 card-text">{{ $homeVisits }}</h4>
                    <h6 class="mb-0 text-muted small">Home Visits</h6>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-sm-6 col-lg-3 mb-6">
              <div class="card card-border-shadow-Skoracares dashboard-card-bg h-100 transition-all hover-glow" style="cursor: default !important;">
                <div class="card-body d-flex flex-row justify-content-around align-items-center p-3">
                  <img src="{{ asset('assets/img/dashboard/first-aid-kit.png') }}" alt="Doctor Icon" style="width: 50px; height: 50px;">
                  <div class="text-end">
                    <h4 class="mb-0 card-text">{{ $testBookings }}</h4>
                    <h6 class="mb-0 text-muted small">Test Bookings</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-sm-6 col-lg-3 mb-6">
              <a href="{{ route('super-admin.manage-doctors') }}" class="text-decoration-none">
                <div class="card card-border-shadow-Skoracares dashboard-card-bg h-100 transition-all hover-glow">
                  <div class="card-body d-flex flex-row justify-content-around align-items-center p-3">
                    <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Doctor Icon" style="width: 50px; height: 50px;">
                    <div class="text-end">
                      <h4 class="mb-0 card-text">{{ $totalDoctors }}</h4>
                      <h6 class="mb-0 text-muted small">Total Doctors</h6>
                    </div>
                  </div>
                </div>
              </a>
            </div>
            <div class="col-sm-6 col-lg-3 mb-6">
              <a href="{{ route('super-admin.manage-users') }}" class="text-decoration-none">
                <div class="card card-border-shadow-Skoracares dashboard-card-bg h-100 transition-all hover-glow">
                  <div class="card-body d-flex flex-row justify-content-around align-items-center p-3">
                    <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Doctor Icon" style="width: 50px; height: 50px;">
                    <div class="text-end">
                      <h4 class="mb-0 card-text">{{ $totalPatients }}</h4>
                      <h6 class="mb-0 text-muted small">Total Patients</h6>
                    </div>
                  </div>
                </div>
              </a>
            </div>
            <div class="col-sm-6 col-lg-3 mb-6">
              <div class="card card-border-shadow-Skoracares dashboard-card-bg h-100 transition-all hover-glow" style="cursor: default !important;">
                <div class="card-body d-flex flex-row justify-content-around align-items-center p-3">
                  <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Doctor Icon" style="width: 50px; height: 50px;">
                  <div class="text-end">
                    <h4 class="mb-0 card-text">{{ $videoConsultations }}</h4>
                    <h6 class="mb-0 text-muted small">Video Consultations</h6>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-sm-6 col-lg-3 mb-6">
              <div class="card card-border-shadow-Skoracares dashboard-card-bg h-100 transition-all hover-glow" style="cursor: default !important;">
                <div class="card-body d-flex flex-row justify-content-around align-items-center p-3">
                  <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Doctor Icon" style="width: 50px; height: 50px;">
                  <div class="text-end">
                    <h4 class="mb-0 card-text">{{ $textConsultations }}</h4>
                    <h6 class="mb-0 text-muted small">Text Consultations</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>



            <!--/ Card Border Shadow -->
            <div class="row">
              <!-- Appointments overview -->
              <div class="col-xxl-6 mb-6 order-5 order-xxl-0">
                <div class="card h-100">
                  <div
                    class="card-header d-flex align-items-center justify-content-between">
                    <div class="card-title mb-0">
                      <h5 class="m-0 me-2">Appointments Overview</h5>
                    </div>
                    <div class="dropdown">
                      <button
                        class="btn p-0"
                        type="button"
                        id="appointmentsOverview"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false">
                        <i class="ri-more-2-line ri-20px"></i>
                      </button>
                      <div
                        class="dropdown-menu dropdown-menu-end"
                        aria-labelledby="appointmentsOverview">
                        <a class="dropdown-item" href="javascript:void(0);">Select All</a>
                        <a class="dropdown-item" href="javascript:void(0);">Refresh</a>
                        <a class="dropdown-item" href="javascript:void(0);">Share</a>
                      </div>
                    </div>
                  </div>
                  <div class="card-body pb-2">
                    <div
                      class="d-none d-lg-flex vehicles-progress-labels mb-5">
                      <div
                        class="vehicles-progress-label on-the-way-text"
                        style="width: {{ $scheduledPercent }}%">
                        Scheduled
                      </div>
                      <div
                        class="vehicles-progress-label unloading-text"
                        style="width: {{ $inProgressPercent }}%">
                        In Progress
                      </div>
                      <div
                        class="vehicles-progress-label loading-text"
                        style="width: {{ $completedPercent }}%">
                        Completed
                      </div>
                      <div
                        class="vehicles-progress-label waiting-text"
                        style="width: {{ $cancelledPercent }}%">
                        Cancelled
                      </div>
                    </div>
                    <div
                      class="vehicles-overview-progress progress rounded bg-transparent mb-2"
                      style="height: 46px">
                      <div
                        class="progress-bar small fw-medium text-start rounded-start bg-lightest text-heading px-1 px-lg-4"
                        role="progressbar"
                        style="width: {{ $scheduledPercent }}%"
                        aria-valuenow="{{ $scheduledPercent }}"
                        aria-valuemin="0"
                        aria-valuemax="100">
                        {{ $scheduledPercent }}%
                      </div>
                      <div
                        class="progress-bar small fw-medium text-start bg-primary px-1 px-lg-4"
                        role="progressbar"
                        style="width: {{ $inProgressPercent }}%"
                        aria-valuenow="{{ $inProgressPercent }}"
                        aria-valuemin="0"
                        aria-valuemax="100">
                        {{ $inProgressPercent }}%
                      </div>
                      <div
                        class="progress-bar small fw-medium text-start text-bg-info px-1 px-lg-4"
                        role="progressbar"
                        style="width: {{ $completedPercent }}%"
                        aria-valuenow="{{ $completedPercent }}"
                        aria-valuemin="0"
                        aria-valuemax="100">
                        {{ $completedPercent }}%
                      </div>
                      <div
                        class="progress-bar small fw-medium text-start rounded-end bg-gray-900 px-1 px-lg-4"
                        role="progressbar"
                        style="width: {{ $cancelledPercent }}%"
                        aria-valuenow="{{ $cancelledPercent }}"
                        aria-valuemin="0"
                        aria-valuemax="100">
                        {{ $cancelledPercent }}%
                      </div>
                    </div>
                    <div class="table-responsive">
                      <table class="table card-table">
                        <tbody class="table-border-bottom-0">
                          <tr>
                            <td class="w-75 ps-0">
                              <div
                                class="d-flex justify-content-start align-items-center">
                                <div class="me-2">
                                  <i
                                    class="text-heading ri-calendar-event-line ri-24px"></i>
                                </div>
                                <h6 class="mb-0 fw-normal">Scheduled</h6>
                              </div>
                            </td>
                            <td class="text-end pe-0 text-nowrap">
                              <h6 class="mb-0">{{ $scheduledCount }}</h6>
                            </td>
                            <td class="text-end pe-0 ps-6">
                              <span>{{ $scheduledPercent }}%</span>
                            </td>
                          </tr>
                          <tr>
                            <td class="w-75 ps-0">
                              <div
                                class="d-flex justify-content-start align-items-center">
                                <div class="me-2">
                                  <i
                                    class="text-heading ri-time-line ri-24px"></i>
                                </div>
                                <h6 class="mb-0 fw-normal">In Progress</h6>
                              </div>
                            </td>
                            <td class="text-end pe-0 text-nowrap">
                              <h6 class="mb-0">{{ $inProgressCount }}</h6>
                            </td>
                            <td class="text-end pe-0 ps-6">
                              <span>{{ $inProgressPercent }}%</span>
                            </td>
                          </tr>
                          <tr>
                            <td class="w-75 ps-0">
                              <div
                                class="d-flex justify-content-start align-items-center">
                                <div class="me-2">
                                  <i
                                    class="text-heading ri-checkbox-circle-line ri-24px"></i>
                                </div>
                                <h6 class="mb-0 fw-normal">Completed</h6>
                              </div>
                            </td>
                            <td class="text-end pe-0 text-nowrap">
                              <h6 class="mb-0">{{ $completedCount }}</h6>
                            </td>
                            <td class="text-end pe-0 ps-6">
                              <span>{{ $completedPercent }}%</span>
                            </td>
                          </tr>
                          <tr>
                            <td class="w-75 ps-0">
                              <div
                                class="d-flex justify-content-start align-items-center">
                                <div class="me-2">
                                  <i
                                    class="text-heading ri-close-circle-line ri-24px"></i>
                                </div>
                                <h6 class="mb-0 fw-normal">Cancelled</h6>
                              </div>
                            </td>
                            <td class="text-end pe-0 text-nowrap">
                              <h6 class="mb-0">{{ $cancelledCount }}</h6>
                            </td>
                            <td class="text-end pe-0 ps-6">
                              <span>10%</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>





              <!--/ Appointments overview -->
              <!-- Appointment statistics-->
              <div class="col-lg-6 col-xxl-6 mb-6 order-3 order-xxl-1">
                <div class="card">
                  <div
                    class="card-header d-flex align-items-center justify-content-between gap-2 flex-wrap">
                    <div class="card-title mb-0">
                      <h5 class="m-0 me-2">Appointment Statistics</h5>
                      <span class="card-subtitle">Total appointments this year: 2.5k</span>
                    </div>
                    <div class="btn-group">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary">
                        January
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary dropdown-toggle dropdown-toggle-split"
                        data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <span class="visually-hidden">Toggle Dropdown</span>
                      </button>
                      <ul class="dropdown-menu">
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">January</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">February</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">March</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">April</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">May</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">June</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">July</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">August</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">September</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">October</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">November</a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="javascript:void(0);">December</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="card-body">
                    <div id="appointmentStatisticsChart"></div>
                  </div>
                </div>
              </div>
              <!--/ Appointment statistics -->
              <!-- Clinic Performance -->
              <div class="col-lg-6 col-xxl-4 mb-6 order-2 order-xxl-2">
                <div class="card h-100">
                  <div
                    class="card-header d-flex align-items-center justify-content-between">
                    <div class="card-title mb-0">
                      <h5 class="m-0 me-2">Clinic Performance</h5>
                      <span class="card-subtitle">Live system parameters</span>
                    </div>
                    <div class="dropdown">
                      <button
                        class="btn p-0"
                        type="button"
                        id="clinicPerformance"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false">
                        <i class="ri-more-2-line ri-20px"></i>
                      </button>
                      <div
                        class="dropdown-menu dropdown-menu-end"
                        aria-labelledby="clinicPerformance">
                        <a class="dropdown-item" href="javascript:void(0);">Select All</a>
                        <a class="dropdown-item" href="javascript:void(0);">Refresh</a>
                        <a class="dropdown-item" href="javascript:void(0);">Share</a>
                      </div>
                    </div>
                  </div>
                  <div class="card-body">
                    <ul class="p-0 m-0">
                      <li class="d-flex mb-4 pb-1 align-items-center transition-all hover-scale">
                        <div class="avatar flex-shrink-0 me-4">
                          <span
                            class="avatar-initial rounded bg-label-purple"><i class="ri-group-line ri-26px"></i></span>
                        </div>
                        <div
                          class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                          <div class="me-2">
                            <h6 class="mb-0 fw-normal">
                              New Patients (30d)
                            </h6>
                            <small class="text-success fw-normal d-block">
                              <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                              Monthly Growth
                            </small>
                          </div>
                          <div class="user-progress">
                            <h6 class="mb-0 card-text text-success font-weight-bold">{{ $newPatientsCount }}</h6>
                          </div>
                        </div>
                      </li>
                      <li class="d-flex mb-4 pb-1 align-items-center transition-all hover-scale">
                        <div class="avatar flex-shrink-0 me-4">
                          <span class="avatar-initial rounded bg-label-purple"><i class="ri-calendar-line ri-26px"></i></span>
                        </div>
                        <div
                          class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                          <div class="me-2">
                            <h6 class="mb-0 fw-normal">
                              Appointments Today
                            </h6>
                            <small class="text-success fw-normal d-block">
                              <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                              Daily Load
                            </small>
                          </div>
                          <div class="user-progress">
                            <h6 class="mb-0 card-text text-success font-weight-bold">{{ $appointmentsTodayCount }}</h6>
                          </div>
                        </div>
                      </li>
                      <li class="d-flex mb-4 pb-1 align-items-center transition-all hover-scale">
                        <div class="avatar flex-shrink-0 me-4">
                          <span
                            class="avatar-initial rounded bg-label-purple"><i class="ri-checkbox-circle-line text-success ri-26px"></i></span>
                        </div>
                        <div
                          class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                          <div class="me-2">
                            <h6 class="mb-0 fw-normal">Completed Consultations</h6>
                            <small class="text-success fw-normal d-block">
                              <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                              Total Output
                            </small>
                          </div>
                          <div class="user-progress">
                            <h6 class="mb-0 card-text text-success font-weight-bold">{{ $completedConsultationsCount }}</h6>
                          </div>
                        </div>
                      </li>
                      <li class="d-flex mb-4 pb-1 align-items-center transition-all hover-scale">
                        <div class="avatar flex-shrink-0 me-4">
                          <span
                            class="avatar-initial rounded bg-label-purple"><i class="ri-star-smile-line ri-26px"></i></span>
                        </div>
                        <div
                          class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                          <div class="me-2">
                            <h6 class="mb-0 fw-normal">
                              Patient Satisfaction Rate
                            </h6>
                            <small class="text-success fw-normal d-block">
                              <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                              High-Quality Care
                            </small>
                          </div>
                          <div class="user-progress">
                            <h6 class="mb-0 card-text text-success font-weight-bold">{{ $satisfactionRate }}%</h6>
                          </div>
                        </div>
                      </li>
                      <li class="d-flex mb-4 pb-1 align-items-center transition-all hover-scale">
                        <div class="avatar flex-shrink-0 me-4">
                          <span
                            class="avatar-initial rounded bg-label-purple"><i class="ri-time-line ri-26px"></i></span>
                        </div>
                        <div
                          class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                          <div class="me-2">
                            <h6 class="mb-0 fw-normal">
                              Average Consultation Time
                            </h6>
                            <small class="text-muted fw-normal d-block">
                              Standard Interval
                            </small>
                          </div>
                          <div class="user-progress">
                            <h6 class="mb-0 card-text text-success font-weight-bold">15 min</h6>
                          </div>
                        </div>
                      </li>
                      <li class="d-flex transition-all hover-scale">
                        <div class="avatar flex-shrink-0 me-4">
                          <span class="avatar-initial rounded bg-label-purple"><i class="ri-user-heart-line ri-26px"></i></span>
                        </div>
                        <div
                          class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                          <div class="me-2">
                            <h6 class="mb-0 fw-normal">
                              Active Patients
                            </h6>
                            <small class="text-success fw-normal d-block">
                              <i class="ri-arrow-up-s-line me-1 ri-24px"></i>
                              Engagement
                            </small>
                          </div>
                          <div class="user-progress">
                            <h6 class="mb-0 card-text text-success font-weight-bold">{{ $activePatientsCount }}</h6>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <!--/ Clinic Performance -->

              <!-- Reasons for Cancellations -->
              <div class="col-md-6 col-xxl-4 mb-6 order-1 order-xxl-3">
                <div class="card h-100">
                  <div
                    class="card-header d-flex align-items-center justify-content-between">
                    <div class="card-title mb-0">
                      <h5 class="m-0 me-2">
                        Reasons for Appointment Cancellations
                      </h5>
                    </div>
                    <div class="dropdown">
                      <button
                        class="btn p-0"
                        type="button"
                        id="reasonsCancellations"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false">
                        <i class="ri-more-2-line ri-20px"></i>
                      </button>
                      <div
                        class="dropdown-menu dropdown-menu-end"
                        aria-labelledby="reasonsCancellations">
                        <a class="dropdown-item" href="javascript:void(0);">Select All</a>
                        <a class="dropdown-item" href="javascript:void(0);">Refresh</a>
                        <a class="dropdown-item" href="javascript:void(0);">Share</a>
                      </div>
                    </div>
                  </div>
                  <div class="card-body">
                    <div id="cancellationReasonsChart"></div>
                  </div>
                </div>
              </div>
              <!--/ Reasons for Cancellations -->
              <!-- Recent Appointments -->
              <div class="col-md-6 col-xxl-4 mb-6 order-0 order-xxl-4">
                <div class="card h-100">
                  <div
                    class="card-header d-flex align-items-center justify-content-between">
                    <div class="card-title mb-0">
                      <h5 class="m-0 me-2">Recent Appointments</h5>
                      <span class="card-subtitle">Live system queue</span>
                    </div>
                    <div class="dropdown">
                      <button
                        class="btn p-0"
                        type="button"
                        id="recentAppointments"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false">
                        <i class="ri-more-2-line ri-20px"></i>
                      </button>
                      <div
                        class="dropdown-menu dropdown-menu-end"
                        aria-labelledby="recentAppointments">
                        <a class="dropdown-item" href="javascript:void(0);">Select All</a>
                        <a class="dropdown-item" href="javascript:void(0);">Refresh</a>
                        <a class="dropdown-item" href="javascript:void(0);">Share</a>
                      </div>
                    </div>
                  </div>
                  <div class="card-body p-0">
                    <div class="nav-align-top">
                      <ul
                        class="nav nav-tabs nav-fill tabs-line border-bottom-0"
                        role="tablist">
                        <li class="nav-item">
                          <button
                            type="button"
                            class="nav-link active"
                            role="tab"
                            data-bs-toggle="tab"
                            data-bs-target="#navs-justified-new"
                            aria-controls="navs-justified-new"
                            aria-selected="true">
                            New
                          </button>
                        </li>
                        <li class="nav-item">
                          <button
                            type="button"
                            class="nav-link"
                            role="tab"
                            data-bs-toggle="tab"
                            data-bs-target="#navs-justified-upcoming"
                            aria-controls="navs-justified-upcoming"
                            aria-selected="false">
                            Upcoming
                          </button>
                        </li>
                        <li class="nav-item">
                          <button
                            type="button"
                            class="nav-link"
                            role="tab"
                            data-bs-toggle="tab"
                            data-bs-target="#navs-justified-completed"
                            aria-controls="navs-justified-completed"
                            aria-selected="false">
                            Completed
                          </button>
                        </li>
                      </ul>
                      <div class="tab-content border-0 pb-0 px-6 mx-1">
                        <div
                          class="tab-pane fade show active"
                          id="navs-justified-new"
                          role="tabpanel">
                          <ul class="timeline mb-0">
                            @forelse($newAppointments as $app)
                            <li class="timeline-item ps-6 border-left-dashed pb-3">
                              <span class="timeline-indicator-advanced text-success border-0 shadow-none">
                                <i class="ri-user-line ri-20px"></i>
                              </span>
                              <div class="timeline-event ps-1">
                                <div class="timeline-header mb-50 d-flex justify-content-between align-items-center">
                                  <small class="text-success text-uppercase font-weight-bold">{{ str_replace('_', ' ', ucwords($app->case_type)) }}</small>
                                  <span class="badge bg-label-secondary font-size-11">{{ $app->time }}</span>
                                </div>
                                <h6 class="mb-1 text-heading">{{ $app->patient ? $app->patient->name : ($app->patient_string ?? 'Guest Patient') }}</h6>
                                <p class="mb-0 text-muted small">
                                  Doctor: {{ $app->doctor ? $app->doctor->name : 'No Doctor Assigned' }} <br>
                                  Date: {{ date('d M Y', strtotime($app->date)) }}
                                </p>
                              </div>
                            </li>
                            @empty
                            <li class="timeline-item ps-6 border-transparent">
                              <div class="timeline-event ps-1 text-center py-4">
                                <p class="mb-0 text-muted">No new appointments found</p>
                              </div>
                            </li>
                            @endforelse
                          </ul>
                        </div>
                        <div
                          class="tab-pane fade"
                          id="navs-justified-upcoming"
                          role="tabpanel">
                          <ul class="timeline mb-0">
                            @forelse($upcomingAppointments as $app)
                            <li class="timeline-item ps-6 border-left-dashed pb-3">
                              <span class="timeline-indicator-advanced text-primary border-0 shadow-none">
                                <i class="ri-user-line ri-20px"></i>
                              </span>
                              <div class="timeline-event ps-1">
                                <div class="timeline-header mb-50 d-flex justify-content-between align-items-center">
                                  <small class="text-primary text-uppercase font-weight-bold">{{ str_replace('_', ' ', ucwords($app->case_type)) }}</small>
                                  <span class="badge bg-label-secondary font-size-11">{{ $app->time }}</span>
                                </div>
                                <h6 class="mb-1 text-heading">{{ $app->patient ? $app->patient->name : ($app->patient_string ?? 'Guest Patient') }}</h6>
                                <p class="mb-0 text-muted small">
                                  Doctor: {{ $app->doctor ? $app->doctor->name : 'No Doctor Assigned' }} <br>
                                  Date: {{ date('d M Y', strtotime($app->date)) }}
                                </p>
                              </div>
                            </li>
                            @empty
                            <li class="timeline-item ps-6 border-transparent">
                              <div class="timeline-event ps-1 text-center py-4">
                                <p class="mb-0 text-muted">No upcoming appointments found</p>
                              </div>
                            </li>
                            @endforelse
                          </ul>
                        </div>
                        <div
                          class="tab-pane fade"
                          id="navs-justified-completed"
                          role="tabpanel">
                          <ul class="timeline mb-0">
                            @forelse($completedAppointments as $app)
                            <li class="timeline-item ps-6 border-left-dashed pb-3">
                              <span class="timeline-indicator-advanced text-info border-0 shadow-none">
                                <i class="ri-user-line ri-20px"></i>
                              </span>
                              <div class="timeline-event ps-1">
                                <div class="timeline-header mb-50 d-flex justify-content-between align-items-center">
                                  <small class="text-info text-uppercase font-weight-bold">{{ str_replace('_', ' ', ucwords($app->case_type)) }}</small>
                                  <span class="badge bg-label-secondary font-size-11">{{ $app->time }}</span>
                                </div>
                                <h6 class="mb-1 text-heading">{{ $app->patient ? $app->patient->name : ($app->patient_string ?? 'Guest Patient') }}</h6>
                                <p class="mb-0 text-muted small">
                                  Doctor: {{ $app->doctor ? $app->doctor->name : 'No Doctor Assigned' }} <br>
                                  Date: {{ date('d M Y', strtotime($app->date)) }}
                                </p>
                              </div>
                            </li>
                            @empty
                            <li class="timeline-item ps-6 border-transparent">
                              <div class="timeline-event ps-1 text-center py-4">
                                <p class="mb-0 text-muted">No completed appointments found</p>
                              </div>
                            </li>
                            @endforelse
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!--/ Recent Appointments -->
              <!-- Doctors List Table -->
              <div class="col-12 order-5">
                <div class="card">
                  <div class="card-header border-bottom">
                    <h6 class="card-title mb-0">Doctors List</h6>
                  </div>
                  <div class="table-responsive">
                    <table class="table align-middle">
                      <thead>
                        <tr>
                          <th><input type="checkbox" id="selectAll" /></th>
                          <th>Doctor</th>
                          <th>Email</th>
                          <th>Specialty</th>
                          <th>Status</th>
                          <th>Patients Treated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        @forelse($doctorsList as $doc)
                        <tr class="transition-all hover-scale">
                          <td><input type="checkbox" class="row-checkbox" /></td>
                          <td>
                            <div class="d-flex align-items-center">
                              <div class="avatar avatar-sm me-3">
                                <img src="{{ $doc->profile_photo_path ? asset($doc->profile_photo_path) : asset('assets/img/avatars/1.png') }}" alt="Avatar" class="rounded-circle" />
                              </div>
                              <div>
                                <h6 class="mb-0 text-truncate font-weight-bold">{{ $doc->name }}</h6>
                                <small class="text-muted">{{ $doc->qualification ?? 'General Practitioner' }}</small>
                              </div>
                            </div>
                          </td>
                          <td class="text-truncate">{{ $doc->email }}</td>
                          <td class="text-truncate">
                            <div class="d-flex align-items-center">
                              <i class="ri-stethoscope-line ri-22px text-primary me-2"></i>
                              <span>{{ $doc->qualification ?? 'General Practitioner' }}</span>
                            </div>
                          </td>
                          <td>
                            <span class="badge {{ $doc->status === 'active' ? 'bg-success' : 'bg-danger' }}">
                              {{ ucfirst($doc->status) }}
                            </span>
                          </td>
                          <td class="font-weight-bold text-dark">{{ $doc->patients_treated }}</td>
                          <td>
                            <div class="d-flex gap-2">
                              <a href="{{ route('super-admin.manage-doctors') }}" class="btn btn-sm btn-primary" title="View/Edit">
                                <i class="ri-eye-line"></i> Manage
                              </a>
                            </div>
                          </td>
                        </tr>
                        @empty
                        <tr>
                          <td colspan="7" class="text-center py-4 text-muted">No active doctors found in the clinic database</td>
                        </tr>
                        @endforelse
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <!--/ Doctors List Table -->
          </div>
          <!-- / Content -->
          <!-- Footer -->
          @include('super-admin.inc.footer')

          <!-- / Footer--->

          <div class="content-backdrop fade"></div>
        </div>
        <!-- Content wrapper -->
         
      </div>
      <!-- / Layout page -->
    </div>

    <!-- Overlay -->
    <div class="layout-overlay layout-menu-toggle"></div>

    <!-- Drag Target Area To SlideIn Menu On Small Screens -->
    <div class="drag-target"></div>
  </div>
  <!-- / Layout wrapper -->

  <!-- Footer-links -->
        @include('super-admin.inc.footer-links')
  <!-- / Footer-links -->

</body>

</html>

<!-- checkbox js  -->
<script>
// Select All Checkbox Script
  document.getElementById('selectAll').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
    });
  });
</script>

<!-- ApexCharts Script --->
<script>
  document.addEventListener("DOMContentLoaded", function() {
    // Colors & Theme Configuration
    const brandPrimary = '#0e606e';
    const brandSuccess = '#1c8767';
    const chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Dynamic Data from Backend
    const appointmentsData = @json($monthlyAppointmentsData);
    const completedData = @json($monthlyCompletedData);
    const cancellationData = @json($cancellationData);

    // 1. Appointment Statistics (Sleek Smooth Area Spline Chart)
    const statsChartEl = document.querySelector("#appointmentStatisticsChart");
    if (statsChartEl) {
      const statsOptions = {
        chart: {
          height: 310,
          type: 'area',
          parentHeightOffset: 0,
          toolbar: { show: false },
          dropShadow: {
            enabled: true,
            top: 12,
            left: 0,
            blur: 6,
            opacity: 0.1,
            color: brandPrimary
          }
        },
        dataLabels: { enabled: false },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          fontFamily: 'Inter',
          fontSize: '13px',
          markers: { radius: 12 }
        },
        colors: [brandPrimary, brandSuccess],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.35,
            opacityTo: 0.05,
            stops: [0, 90, 100]
          }
        },
        series: [
          { name: 'Total Appointments', data: appointmentsData },
          { name: 'Completed Consultations', data: completedData }
        ],
        xaxis: {
          categories: chartLabels,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: {
            style: {
              colors: '#a1acb8',
              fontSize: '12px',
              fontFamily: 'Inter'
            }
          }
        },
        yaxis: {
          min: 0,
          tickAmount: 4,
          labels: {
            style: {
              colors: '#a1acb8',
              fontSize: '12px',
              fontFamily: 'Inter'
            }
          }
        },
        grid: {
          borderColor: '#e5e9ed',
          strokeDashArray: 4,
          padding: { right: 20 }
        }
      };
      
      const statsChart = new ApexCharts(statsChartEl, statsOptions);
      statsChart.render();
    }

    // 2. Cancellation Reasons (Premium Donut Chart)
    const cancellationEl = document.querySelector("#cancellationReasonsChart");
    if (cancellationEl) {
      const cancellationOptions = {
        chart: {
          height: 320,
          type: 'donut',
          parentHeightOffset: 0
        },
        labels: ['Schedule Conflict', 'Doctor Unavailable', 'Weather Issues', 'Personal Emergency', 'Recovered'],
        series: cancellationData,
        colors: ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#0e606e'],
        stroke: { width: 0 },
        dataLabels: { enabled: false },
        legend: {
          show: true,
          position: 'bottom',
          fontFamily: 'Inter',
          fontSize: '12px',
          markers: { radius: 12 },
          itemMargin: { horizontal: 10, vertical: 5 }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '78%',
              labels: {
                show: true,
                value: {
                  fontSize: '1.4rem',
                  fontFamily: 'Inter',
                  color: '#32475c',
                  fontWeight: 600,
                  offsetY: -10,
                  formatter: function(val) {
                    return parseInt(val) + " cases";
                  }
                },
                name: { offsetY: 20, fontFamily: 'Inter' },
                total: {
                  show: true,
                  fontSize: '0.85rem',
                  label: 'Cancellations',
                  color: '#8a9baf',
                  formatter: function(w) {
                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + " cases";
                  }
                }
              }
            }
          }
        }
      };
      
      const cancellationChart = new ApexCharts(cancellationEl, cancellationOptions);
      cancellationChart.render();
    }
  });
</script>