<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkoraCares || Login</title>
    <link rel="icon" href="{{ asset('front-assets/img/favicon.png') }}" type="image/x-icon">


    @include('front.inc.header-links')
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">

    <style>
        .ul-header-2 .ul-header-bottom-wrapper {
            background-color: #0e606e;
            border-radius: 30px;
        }

        .input-group-text {
            background-color: #0e606e;
        }

        .login-btn {
            background-color: #0e606e;
            color: white;
        }

        .ul-header-nav a {
            color: #fcf6f6 !important;
            transition: color 0.3s ease !important;
        }
    </style>
</head>

<body class="ul-footer ul-footer-2">
    <main>
        <div class="preloader" id="preloader">
            <div class="loader"></div>
        </div>

        <!-- SIDEBAR SECTION START -->
        <div class="ul-sidebar">
            <div class="ul-sidebar-header">
                <div class="ul-sidebar-header-logo">
                    <a href="{{ url('/') }}">
                        <img src="front-assets/img/main-logo.png" height="40" alt="logo" class="logo">
                    </a>
                </div>
                <button class="ul-sidebar-closer"><i class="flaticon-close-1"></i></button>
            </div>

            <div class="ul-sidebar-header-nav-wrapper d-block d-lg-none"></div>
            <div class="ul-header-bottom-right">
                <div class="ul-header-2-bottom-btns">
                    <a href="{{ route('login') }}" class="ul-2-btn border-dark text-dark">Log In</a>
                    <a href="{{ route('register') }}" class="ul-2-btn border border-dark">Sign up</a>
                </div>
            </div>

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

       <div class="preloader" id="preloader">
    <div class="loader"></div>
</div>

<!-- SIDEBAR SECTION START -->
<div class="ul-sidebar">
    <!-- header -->
    <div class="ul-sidebar-header">
        <div class="ul-sidebar-header-logo">
            <a href="{{ url('/') }}">
                <img src="{{ asset('assets/img/main-logo.png')}}" height="40" alt="skora cares logo" class="logo">
            </a>
        </div>
        <!-- sidebar closer -->
        <button class="ul-sidebar-closer"><i class="flaticon-close-1"></i></button>
    </div>

    <div class="ul-sidebar-header-nav-wrapper d-block d-lg-none">
    </div>
    <div class="ul-header-bottom-right">
        <div class="ul-header-2-bottom-btns">
            <a href="{{ route('login')}}" class="ul-2-btn border-dark text-dark">Log In</a>
            <a href="{{ route('register')}}" class="ul-2-btn border border-dark">Sign up</a>
        </div>
    </div>

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
                    <img src="{{ asset('assets/img/main-logo.png')}}" height="40" alt="logo" class="logo" style="filter: brightness(0) invert(1) !important;">
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
                            @if(auth()->user()->role === 'admin')
                                <a href="{{ route('admin.dashboard') }}"    class="ul-2-btn d-xxs-none">Dashboard</a>
                            @elseif(auth()->user()->role === 'doctor')
                                <a href="{{ route('doctor.dashboard') }}"   class="ul-2-btn d-xxs-none">Dashboard</a>
                            @elseif(auth()->user()->role === 'super_admin')
                                <a href="{{ route('super-admin.dashboard') }}"  class="ul-2-btn d-xxs-none">Dashboard</a>
                            @else
                                <a href="{{ route('patient.dashboard') }}"   class="ul-2-btn d-xxs-none">Dashboard</a>
                            @endif
                        @endauth
                        @guest
                            <a href="{{ route('login') }}" class="ul-2-btn d-xxs-none">Log In</a>
                        @endguest
                    <a href="{{ route('register')}}" class="ul-2-btn d-xxs-none">Sign up</a>
                </div>
                <button class="ul-header-sidebar-opener d-lg-none d-inline-flex"><i class="flaticon-right-arrow"></i></button>
            </div>
        </div>
    </div>
</header>
        <!-- HEADER SECTION END -->

        <div class="container my-5 py-5">
            <div class="row align-items-center justify-content-center py-5">
                <div class="col-lg-10">
                    <div class="card shadow-lg border-0 rounded-5" style="background: radial-gradient(circle at top left, #ff9aff, transparent 40%),
                    radial-gradient(circle at top right, #00e5ff, transparent 40%),
                    radial-gradient(circle at bottom left, #ffe066, transparent 40%),
                    radial-gradient(circle at bottom right, #a3ffb3, transparent 40%);
                background-color: #f5f5f5;">
                        <div class="card-body p-4">
                            <div class="col-10 mx-auto border-0 p-3 mt-3 rounded-3" style="background: #fcf9f447;">
                                <form method="POST" action="{{ route('login') }}">
                                    @csrf

                                    <!-- Validation Errors -->
                                    @if ($errors->any())
                                        <div class="alert alert-danger">
                                            <ul>
                                                @foreach ($errors->all() as $error)
                                                    <li>{{ $error }}</li>
                                                @endforeach
                                            </ul>
                                        </div>
                                    @endif

                                    <!-- Session Status -->
                                    @if (session('status'))
                                        <div class="alert alert-success">
                                            {{ session('status') }}
                                        </div>
                                    @endif

                                    <div class="mb-3">
                                        <label for="email" class="form-label">Your Email</label>
                                        <div class="input-group">
                                            <span class="input-group-text text-white">
                                                <i class="bi bi-envelope"></i>
                                            </span>
                                            <input id="email" class="form-control shadow-none" type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username" placeholder="admin@example.com">
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="password" class="form-label">Password</label>
                                        <div class="input-group">
                                            <span class="input-group-text text-white">
                                                <i class="bi bi-key"></i>
                                            </span>
                                            <input id="password" class="form-control shadow-none" type="password" name="password" required autocomplete="current-password" placeholder="Enter your password">
                                            <span class="input-group-text text-white toggle-password" style="cursor:pointer;">
                                                <i class="bi bi-eye"></i>
                                            </span>
                                        </div>
                                    </div>

                                    <div class="block mt-4">
                                        <label for="remember_me" class="flex items-center">
                                            <input id="remember_me" type="checkbox" name="remember" class="form-check-input">
                                            <span class="ms-2 text-sm text-gray-600">{{ __('Remember me') }}</span>
                                        </label>
                                    </div>

                                    <div class="d-flex justify-content-between mt-4">
                                        <div>
                                            <a href="{{ route('register') }}" class="text-primary">Don't have an account? Register Here</a>
                                        </div>
                                        @if (Route::has('password.request'))
                                            <a class="text-decoration-none" style="color: #0e606e;" href="{{ route('password.request') }}">
                                                {{ __('Forgot your password?') }}
                                            </a>
                                        @endif
                                    </div>

                                    <div class="mt-4">
                                        <button type="submit" class="btn btn-sm login-btn w-100">Log in</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    @include('front.inc.footer')

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>

    <script>
        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(el => {
            el.addEventListener('click', () => {
                const input = el.previousElementSibling;
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        });
    </script>

    @include('front.inc.footer-links')
</body>

</html>