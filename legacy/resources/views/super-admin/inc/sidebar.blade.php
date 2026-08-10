      <?php
         @$currentPage = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
         ?>
<aside id="layout-menu" class="layout-menu menu-vertical menu bg-menu-theme sidebar" style="background-color: rgb(14 96 110 / 6%) !important;">
  <div class="app-brand demo">
     <div class="app-brand demo">
        <a href="{{ route('super-admin.dashboard') }}" class="app-brand-link">
            <img src="{{ asset('assets/img/logo.png') }}" class="" alt="" width="150">
        </a>
      <a href="javascript:void(0);" class="layout-menu-toggle menu-link text-large ms-auto">
        <i class="menu-toggle-icon d-xl-block align-middle color-doctor-x"></i>
      </a>
    </div>
  </div>

  <div class="menu-inner-shadow"></div>

  <ul class="menu-inner py-1">
    {{-- Dashboard --}}
    <li class="menu-item {{ request()->routeIs('super-admin.dashboard') ? 'active' : '' }}">
      <a href="{{ route('super-admin.dashboard') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-dashboard-line"></i>
        <div data-i18n="Dashboard">Dashboard</div>
      </a>
    </li>

    <li class="menu-header small text-uppercase">
      <span class="menu-header-text">User Management</span>
    </li>

    {{-- Manage Doctors --}}
    <li class="menu-item {{ request()->routeIs('super-admin.manage-doctors') ? 'active' : '' }}">
      <a href="{{ route('super-admin.manage-doctors') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-stethoscope-line"></i>
        <div data-i18n="Manage Doctors">Manage Doctors</div>
      </a>
    </li>

    {{-- Manage Clinics --}}
    <li class="menu-item {{ Request::is('manage-clinics') ? 'active' : '' }}">
      <a href="{{ route('super-admin.manage-clinics') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-hospital-line"></i>
        <div data-i18n="Manage Clinics">Manage Clinics</div>
      </a>
    </li>

    {{-- Manage Users --}}
    <li class="menu-item {{ request()->routeIs('super-admin.manage-users') ? 'active' : '' }}">
      <a href="{{ route('super-admin.manage-users') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-group-line"></i>
        <div data-i18n="Manage Users">Manage All Users</div>
      </a>
    </li>

    {{-- Roles & Permissions --}}
    <li class="menu-item {{ Request::is('roles-permission') ? 'active' : '' }}">
      <a href="{{ route('roles-permission') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-shield-user-line"></i>
        <div data-i18n="Roles & Permissions">Roles & Permissions</div>
      </a>
    </li>

    <li class="menu-header small text-uppercase">
      <span class="menu-header-text">Support Center</span>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.supports.index') || request()->routeIs('super-admin.supports.show') ? 'active' : '' }}">
      <a href="{{ route('super-admin.supports.index') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-customer-service-2-line"></i>
        <div>Support Tickets</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.supports.videos') ? 'active' : '' }}">
      <a href="{{ route('super-admin.supports.videos') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-video-upload-line"></i>
        <div>Support Videos</div>
      </a>
    </li>

    <li class="menu-header small text-uppercase">
      <span class="menu-header-text">Patient Care</span>
    </li>

    {{-- Manage Patient --}}
    <li class="menu-item {{ request()->routeIs('super-admin.patient-*') ? 'active open' : '' }}">
      <a href="javascript:void(0);" class="menu-link menu-toggle">
        <i class="menu-icon tf-icons ri-user-2-line"></i>
        <div>Manage Patients</div>
      </a>
      <ul class="menu-sub">
        <li class="menu-item {{ request()->routeIs('super-admin.patient-registration') ? 'active' : '' }}">
          <a href="{{ route('super-admin.patient-registration') }}" class="menu-link">
            <div data-i18n="Patient Registration">Patient Registration</div>
          </a>
        </li>
      </ul>
    </li>

    <li class="menu-header small text-uppercase">
      <span class="menu-header-text">Settings & Config</span>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.landing-page') ? 'active' : '' }}">
      <a href="{{ route('super-admin.landing-page') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-layout-line"></i>
        <div data-i18n="Manage Landing Page">Manage Landing Page</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.email-setup') ? 'active' : '' }}">
      <a href="{{ route('super-admin.email-setup') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-mail-settings-line"></i>
        <div data-i18n="Email Setup">Email Setup</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.dashboard-settings') ? 'active' : '' }}">
      <a href="{{ route('super-admin.dashboard-settings') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-settings-5-line"></i>
        <div data-i18n="Dashboard Settings">Dashboard Settings</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.faqs') ? 'active' : '' }}">
      <a href="{{ route('super-admin.faqs') }}" class="menu-link">
        <i class="menu-icon tf-icons ri-question-line"></i>
        <div data-i18n="My FAQS">My FAQS</div>
      </a>
    </li>

    <li class="menu-item {{ request()->routeIs('super-admin.Consult-*') ? 'active open' : '' }}">
      <a href="javascript:void(0);" class="menu-link menu-toggle">
        <i class="menu-icon tf-icons ri-mastercard-line"></i>
        <div>All Masters</div>
      </a>
      <ul class="menu-sub">
        <li class="menu-item {{ request()->routeIs('super-admin.Consult-master') ? 'active' : '' }}">
          <a href="{{ route('super-admin.Consult-master') }}" class="menu-link">
            <div data-i18n="Doctor Consult master">Doctor Consult master</div>
          </a>
        </li>
      </ul>
    </li>

    <li class="menu-item">
      <a href="javascript:void(0);" class="menu-link menu-toggle">
        <i class="menu-icon tf-icons ri-article-line"></i>
        <div data-i18n="Manage Blogs">Manage Blogs</div>
      </a>
      <ul class="menu-sub">
        <li class="menu-item {{ request()->routeIs('super-admin.blog-category') ? 'active' : '' }}">
          <a href="{{ route('super-admin.blog-category') }}" class="menu-link">
            <div data-i18n="Blog Category">Blog Category</div>
          </a>
        </li>
        <li class="menu-item {{ request()->routeIs('super-admin.blogs') ? 'active' : '' }}">
          <a href="{{ route('super-admin.blogs') }}" class="menu-link">
            <div data-i18n="Manage Blogs">Manage Blogs</div>
          </a>
        </li>
      </ul>
    </li>



    <li class="menu-header small text-uppercase">
      <span class="menu-header-text">System</span>
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

<style>
  html {
    font-size: 0.89rem !important;
  }
</style>
