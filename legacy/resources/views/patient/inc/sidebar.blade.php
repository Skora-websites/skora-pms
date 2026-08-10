     <?php
        @$currentPage = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        ?>
{{-- <aside id="layout-menu" class="layout-menu menu-vertical menu bg-menu-theme sidebar" style="background-color: #d7c4fc73 !important;"> --}}
<aside id="layout-menu" class="layout-menu menu-vertical menu bg-menu-theme sidebar" >
  <div class="app-brand demo">
    <a href="{{ route('doctor.dashboard') }}" class="app-brand-link">
      <span class="app-brand-text demo menu-text ms-2 fw-bold" style="color:#0e606e; font-size:20px;">
        <i class="ri-hospital-line align-middle fs-2"></i> Skoracares
      </span>
    </a>
    <a href="javascript:void(0);" class="layout-menu-toggle menu-link text-large ms-auto">
      <i class="menu-toggle-icon d-xl-block align-middle color-doctor-x"></i>
    </a>
  </div>

  <div class="menu-inner-shadow"></div>

  <ul class="menu-inner py-1">
    {{-- Dashboard --}}
    <li class="menu-item {{ request()->routeIs('doctor.dashboard') ? 'active' : '' }}">
      <a href="{{ route('doctor.dashboard') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-dashboard-line"></i>
        <div data-i18n="Dashboard">Dashboard</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('doctor.patient-registration') ? 'active' : '' }}">
        <a href="{{ route('doctor.patient-registration') }}" class="menu-link">
            <i class="menu-icon tf-icons ri-user-add-line"></i>
            <div data-i18n="Patient Registration">Patient Registration</div>
        </a>
    </li>



    {{-- Manage Patient --}}
    {{-- <li class="menu-item {{ request()->routeIs('super-admin.patient-*') ? 'active open' : '' }}">
      <a href="javascript:void(0);" class="menu-link menu-toggle">
        <i class="menu-icon tf-icons ri-user-2-line"></i>
        <div>Manage Patient</div>
      </a>
      <ul class="menu-sub">
        <li class="menu-item {{ request()->routeIs('super-admin.patient-registration') ? 'active' : '' }}">
          <a href="{{ route('super-admin.patient-registration') }}" class="menu-link">
            <div data-i18n="Patient Registration">Patient Registration</div>
          </a>
        </li>
        <li class="menu-item {{ request()->routeIs('super-admin.appointment') ? 'active' : '' }}">
          <a href="" class="menu-link">
            <div>Appointment</div>
          </a>
        </li>
        <li class="menu-item {{ request()->routeIs('super-admin.prescription') ? 'active' : '' }}">
          <a href="" class="menu-link">
            <div>Prescriptions</div>
          </a>
        </li>
        <li class="menu-item {{ request()->routeIs('super-admin.income-expense') ? 'active' : '' }}">
          <a href="" class="menu-link">
            <div>Income & Expense</div>
          </a>
        </li>
        <li class="menu-item {{ request()->routeIs('super-admin.home-visit') ? 'active' : '' }}">
          <a href="" class="menu-link">
            <div>Home Visit</div>
          </a>
        </li>
        <li class="menu-item {{ request()->routeIs('super-admin.test-booking') ? 'active' : '' }}">
          <a href="" class="menu-link">
            <div>Test Booking</div>
          </a>
        </li>
      </ul>
    </li> --}}

    {{-- Other Menus --}}
    <li class="menu-item {{ request()->routeIs('super-admin.notification') ? 'active' : '' }}">
      <a href="" class="menu-link">
        <i class="menu-icon tf-icons ri-notification-3-line"></i>
        <div>Notification</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.clinic') ? 'active' : '' }}">
      <a href="" class="menu-link">
        <i class="menu-icon tf-icons ri-hospital-line"></i>
        <div>Clinic</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.role-assign') ? 'active' : '' }}">
      <a href="" class="menu-link">
        <i class="menu-icon tf-icons ri-user-settings-line"></i>
        <div>Role Assign</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.email-setup') ? 'active' : '' }}">
    <a href="{{ route('super-admin.email-setup') }}" class="menu-link">
      <i class="menu-icon tf-icons ri-settings-3-line"></i>
      <div data-i18n="Email Setup ">Email Setup </div>
    </a>
  </li>

  {{-- <li class="menu-item {{ request()->routeIs('doctor.dashboard-settings') ? 'active' : '' }}">
    <a href="{{ route('doctor.dashboard-settings') }}" class="menu-link">
      <i class="menu-icon tf-icons ri-settings-3-line"></i>
      <div data-i18n="Dashboard Settings">Dashboard Settings</div>
    </a>
  </li> --}}

  <li class="menu-item {{ request()->routeIs('super-admin.faqs') ? 'active' : '' }}">
    <a href="{{ route('super-admin.faqs') }}" class="menu-link">
      <i class="menu-icon tf-icons ri-question-line"></i>
      <div data-i18n="My FAQS ">My FAQS </div>
    </a>
  </li>


   <li class="menu-item">
  <form action="{{ route('logout') }}" method="POST" style="margin:0; padding:0;">
    @csrf
    <button type="submit" class="menu-link d-flex align-items-center" 
            style="border:none; background:none; width:100%; text-align:left;">
      <i class="menu-icon tf-icons ri-logout-box-r-line"></i>
      <div>Logout</div>
    </button>
  </form>
</li>

  </ul>
</aside>
