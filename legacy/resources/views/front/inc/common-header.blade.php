<div class="preloader" id="preloader">
    <div class="loader"></div>
</div>

<!-- SIDEBAR SECTION START -->
<div class="ul-sidebar">
    <!-- header -->
    <div class="ul-sidebar-header">
        <div class="ul-sidebar-header-logo">
            <a href="{{ url('/') }}">
                <img src="{{ asset('front-assets/img/logo-new.png')}}" height="40" alt="skora cares logo" class="logo">
            </a>
        </div>
        <!-- sidebar closer -->
        <button class="ul-sidebar-closer"><i class="flaticon-close-1"></i></button>
    </div>

    <div class="ul-sidebar-header-nav-wrapper d-block d-lg-none">
    </div>
        @auth
            @if (in_array(auth()->user()->role, ['super_admin', 'admin']))
                <a href="{{ route('super-admin.dashboard') }}" class="ul-2-btn">Dashboard</a>
            @elseif(in_array(auth()->user()->role, ['doctor', 'receptionist', 'nurse', 'accountant']))
                <a href="{{ route('doctor.dashboard') }}" class="ul-2-btn">Dashboard</a>
            @else
                <a href="{{ route('patient.dashboard') }}" class="ul-2-btn">Dashboard</a>
            @endif
        @else
            <a href="{{ route('login') }}" class="ul-2-btn border-dark text-dark">Log In</a>
            <a href="{{ route('register') }}" class="ul-2-btn border border-dark">Sign up</a>
        @endauth

    <!-- sidebar footer -->
    <div class="ul-sidebar-footer">
        <span class="ul-sidebar-footer-title">Follow us</span>

        <div class="ul-sidebar-footer-social">
            <a href="#"><i class="flaticon-facebook"></i></a>
            <a href="#"><i class="flaticon-twitter"></i></a>
            <a href="#"><i class="flaticon-instagram"></i></a>
            <a href="#"><i class="flaticon-linkedin-big-logo"></i></a>
        </div>
    </div>
</div>
<!-- SIDEBAR SECTION END -->

<!-- HEADER SECTION START -->
<header class="ul-header ul-header-2 ul-header-3">
    <div class="ul-header-bottom to-be-sticky wow animate__slideInDown">
        <div class="ul-header-bottom-wrapper ul-header-container">
            <div class="logo-container">
                <a href="{{ url('/') }}" class="d-inline-block">
                    <img src="{{ asset('front-assets/img/logo-new.png')}}" height="40" alt="logo" class="logo" style="filter: brightness(0) invert(1) !important;">
                    <!-- <h4 class="fw-bold text-white">Skoracares</h4> -->
                </a>
            </div>

            <div class="ul-header-bottom-center">
                <!-- header nav -->
                <div class="ul-header-nav-wrapper">
                    <div class="to-go-to-sidebar-in-mobile">
                        <nav class="ul-header-nav">
                            <a href="{{ url('/') }}" class="active">Home</a>
                            <a href="{{ url('/about') }}">About</a>
                            <a href="{{ url('/contact') }}">Contact</a>
                        </nav>
                    </div>
                </div>
            </div>
           <div class="ul-header-bottom-right">
                <div class="ul-header-2-bottom-btns">
                        @auth
                            @if (in_array(auth()->user()->role, ['super_admin', 'admin']))
                                <a href="{{ route('super-admin.dashboard') }}" class="ul-2-btn d-xxs-none">Dashboard</a>
                            @elseif(in_array(auth()->user()->role, ['doctor', 'receptionist', 'nurse', 'accountant']))
                                <a href="{{ route('doctor.dashboard') }}" class="ul-2-btn d-xxs-none">Dashboard</a>
                            @else
                                <a href="{{ route('patient.dashboard') }}" class="ul-2-btn d-xxs-none">Dashboard</a>
                            @endif
                        @else
                            <a href="{{ route('login') }}" class="ul-2-btn d-xxs-none">Log In</a>
                            <a href="{{ route('register') }}" class="ul-2-btn d-xxs-none">Sign up</a>
                        @endauth
                </div>
                <button class="ul-header-sidebar-opener d-lg-none d-inline-flex"><i class="flaticon-right-arrow"></i></button>
            </div>
        </div>
    </div>
</header>

<script>
    // header js 
    window.addEventListener("scroll", function() {
        const header = document.querySelector("header");
        if (window.scrollY > 50) { // 50px scroll ke baad effect
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });
</script>


<style>
    .font-inter {
    font-family: 'Inter', sans-serif !important;
}
</style>

  <style>

:root {
    --pr-font-sans-serif: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 
'Segoe UI Emoji', 'Segoe UI Symbol';
}

.font-inter {
    font-family: var(--pr-font-sans-serif) !important;
}
body {
    font-family: 'Inter', sans-serif !;
    font-weight: 400;
}

.font-inter {
    font-family: 'Inter', sans-serif !important;
}
</style>