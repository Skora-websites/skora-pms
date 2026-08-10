<style>

.sidebar.active {
    width: 80px; /* Mini sidebar width */
}

/* Sidebar Logo Section */
.sidebar-logo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 15px;
    transition: all 0.3s ease;
}

.sidebar-logo img {
    height: 80px;
    width: 110px;
    transition: all 0.3s ease;
}

.sidebar.active .sidebar-logo img {
    height: 51px;
    width: 59px;
    object-fit: contain;
    margin-left: -6px;
}

/* Sidebar Inner Area */
.sidebar-inner {
    height: calc(100vh - 60px);
    overflow-y: auto;
    transition: all 0.3s ease;
}

/* Text Hide on Collapse */
.sidebar.active .sidebar-menu span {
    display: none;
}

/* Center Icons in Mini Sidebar */
.sidebar.active .sidebar-menu a {
    justify-content: center;
}

/* Icons Size */
.sidebar-menu i {
    font-size: 20px;
}

/* Active Menu */
.sidebar-menu .active > a {
    background-color: #0c4843;
    color: #fff;
    font-weight: 500;
    border-radius: 6px;
}

/* Submenu open effect */
.submenu ul {
    display: none;
}

.submenu.open > ul {
    display: block;
}

@media (max-width: 768px) {
    .sidebar {
        z-index: 1001;
    }
}

@media (max-width: 768px) {
   .sidebar {
    width: 240px;
    transition: all 0.3s ease-in-out;
    background: #fff;
    height: 100vh;
    overflow: hidden;
    position: fixed; /* Add this if not already present for consistency */
    top: 0;
    left: 0; /* Default for desktop */
}

    .sidebar.active {
        left: 0;
        width: 240px;
    }

    .sidebar.active .sidebar-logo img {
        height: 40px;
        width: auto;
    }

    #toggle_btn {
        position: absolute;
        right: -40px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
}
</style>

<div class="sidebar" id="sidebar">
    <div class="sidebar-logo">
        <div>
            <a href="{{ route('doctor.dashboard') }}" >
            <img src="{{ asset('assets-doctor/img/main-logo.png') }}" alt="Logo" id="sidebarLogo" />
            </a>
        </div>
        <button class="sidenav-toggle-btn btn border-0 p-0" id="toggle_btn">
            <i class="ti ti-arrow-left"></i>
        </button>
        <button class="sidebar-close" id="sidebar_close">
            <i class="ti ti-x align-middle"></i>
        </button>
    </div>
     
    <div class="sidebar-inner" data-simplebar>
        <div id="sidebar-menu" class="sidebar-menu ps-0 pt-2 pb-2 pe-2">
            <ul>
                <li>
                    <ul>
                        <li class="{{ request()->routeIs('doctor.dashboard') ? 'active' : '' }}">
                            <a href="{{ route('doctor.dashboard') }}"><i class="ti ti-layout-dashboard"></i><span>Dashboard</span></a>
                        </li>
                        @can('schedule')
                        <li class="{{ request()->routeIs('doctor.doctor-schedule') ? 'active' : '' }}">
                            <a href="{{ route('doctor.doctor-schedule') }}"><i class="ti ti-calendar-time"></i><span>Schedule Time</span></a>
                        </li>
                        @endcan
                        @can('registrations')
                        <li class="{{ request()->routeIs('doctor.patient-registration') ? 'active' : '' }}">
                            <a href="{{ route('doctor.patient-registration') }}"><i class="ti ti-user-plus"></i><span>Registrations</span></a>
                        </li>
                        @endcan
                        @can('appointments')
                        <li class="{{ request()->routeIs('doctors.appointment') ? 'active' : '' }}">
                            <a href="{{ route('doctors.appointment') }}"><i class="ti ti-calendar-event"></i><span>Appointments</span></a>
                        </li>
                        @endcan
                        @can('follow-up')
                        <li class="{{ request()->routeIs('doctor.follow-ups') ? 'active' : '' }}">
                            <a href="{{ route('doctor.follow-ups') }}"><i class="ti ti-phone-calling"></i><span>Follow Up</span></a>
                        </li>
                        @endcan
                        @can('income-expense')
                        <li class="{{ request()->routeIs('doctor.income-expence') ? 'active' : '' }}">
                            <a href="{{ route('doctor.income-expence') }}"><i class="ti ti-cash"></i><span>Income & Expense</span></a>
                        </li>
                        @endcan

                        @can('test-booking')
                        <li class="{{ request()->routeIs('doctor-test-booking') ? 'active' : '' }}">
                            <a href="{{ route('doctor-test-booking') }}"><i class="ti ti-test-pipe"></i><span>Test Booking</span></a>
                        </li>
                        @endcan
                        @can('billing')
                        <li class="{{ request()->routeIs('doctor-billing') ? 'active' : '' }}">
                            <a href="{{ route('doctor-billing') }}"><i class="ti ti-calculator"></i><span>Billing</span></a>
                        </li>
                        @endcan
                        {{-- <li class="{{ request()->routeIs('doctors.shoping') ? 'active' : '' }}">
                            <a href="{{ route('doctors.shoping') }}"><i class="ti ti-shopping-cart"></i><span>Shop</span></a>
                        </li>
                        <li class="{{ request()->routeIs('doctor.chat') ? 'active' : '' }}">
                            <a href="{{ route('doctor.chat') }}"><i class="ti ti-message-circle"></i><span>Chat</span></a>
                        </li> --}}
                        @can('support')
                        <li class="{{ request()->routeIs('doctor.supports') ? 'active' : '' }}">
                            <a href="{{ route('doctor.supports') }}"><i class="ti ti-headset"></i><span>Support</span></a>
                        </li>
                        @endcan

                          {{-- <li class="">
                            <a href="{{ url('/') }}" target="_blank"><i class="ti ti-world"></i><span>View Site</span></a>
                        </li> --}}

                        @can('roles-permissions')
                          <li class="{{ request()->routeIs('my-staff.index') ? 'active' : '' }}">
                            <a href="{{ route('my-staff.index') }}"> <i class="ti ti-users"></i><span>My Staff</span></a>
                          </li> 

                         <li class="{{ request()->routeIs('roles-permission') ? 'active' : '' }}">
                        <a href="{{ route('roles-permission') }}"> <i class="ti ti-user-shield"></i><span>Roles & Permission</span></a>
                    </li> 
                    @endcan

                        <li class="{{ request()->routeIs('doctor.logout') ? 'active' : '' }}">
                            <a href="{{ route('doctor.logout') }}"><i class="ti ti-logout"></i><span>Logout</span></a>
                        </li>
                    </ul>

                    <ul>
                    {{-- <li class="">
                        <a href=""><i class="ti ti-adjustments"></i> Setting</a>
                    </li> --}}
                   
                        {{-- <li class="{{ request()->routeIs('doctor.notifications') ? 'active' : '' }}">
                        <a href="{{ route('doctor.notifications') }}"><i class="ti ti-bell"></i> Notifications</a>
                    </li> --}}
                    </ul>

                </li>
            </ul>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('toggle_btn');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('sidebar_close');
    const overlay = document.getElementById('overlay'); // Add this if exists

    toggleBtn.addEventListener('click', function () {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            overlay.style.display = 'block'; // Show overlay
        } else {
            overlay.style.display = 'none'; // Hide
        }
    });

    closeBtn.addEventListener('click', function () {
        sidebar.classList.remove('active');
        overlay.style.display = 'none';
    });

    // Optional: Close on overlay click
    overlay.addEventListener('click', function () {
        sidebar.classList.remove('active');
        overlay.style.display = 'none';
    });
});
</script>




