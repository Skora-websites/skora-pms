<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>SkoraCares</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#000000">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="apple-mobile-web-app-title" content="SkoraCares">
    <link rel="icon" type="image/png" href="{{ asset('front-assets/img/favicon.png') }}">
    <link rel="apple-touch-icon" sizes="152x152" href="{{ asset('icons/icon-152x152.png') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('icons/icon-192x192.png') }}">
    <link rel="manifest" href="{{ url('/manifest.json') }}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('front-assets/vendor/bootstrap/bootstrap.min.css') }}">
    <link rel="stylesheet" href="{{ asset('front-assets/vendor/splide/splide.min.css') }}">
    <link rel="stylesheet" href="{{ asset('front-assets/vendor/swiper/swiper-bundle.min.css') }}">
    <link rel="stylesheet" href="{{ asset('front-assets/vendor/animate-wow/animate.min.css') }}">
    <link rel="stylesheet" href="{{ asset('front-assets/icon/flaticon_digicom.css') }}">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="{{ asset('front-assets/css/style.css') }}">
    <link rel="stylesheet" href="{{ asset('front-assets/css/custom.css') }}">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">

    @stack('styles')
    @include('layouts.notification')
    @laravelPWA

    <style>
        .floating-buttons-container {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: flex-end;
        }

        /* Base Button Style */
        .floating-btn {
            border: none;
            border-radius: 50px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            position: relative;
            animation: floatIn 0.8s ease-out forwards;
            opacity: 0;
            transform: translateY(100px);
            padding: 0;
        }

        /* Scroll to Top Button */
        .scroll-top-btn {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #0c4843 0%, #1a7c75 100%);
            color: white;
            font-size: 20px;
            animation-delay: 0.2s;
        }

        /* Button Hover Effects */
        .floating-btn:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
        }

        .scroll-top-btn:hover {
            background: linear-gradient(135deg, #1a7c75 0%, #0c4843 100%);
        }

        /* Bounce Animation for Scroll Button */
        .scroll-top-btn.show {
            animation: bounce 2s infinite;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        @keyframes bounce {

            0%,
            100% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-10px);
            }
        }

        @keyframes floatIn {
            from {
                opacity: 0;
                transform: translateY(100px) rotate(10deg);
            }

            to {
                opacity: 1;
                transform: translateY(0) rotate(0);
            }
        }
    </style>
</head>


<body>

    <div id="preloader">
        <div class="preloader">
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

    <div class="ul-sidebar">
        <!-- header -->
        <div class="ul-sidebar-header">
            <div class="ul-sidebar-header-logo">
                <a href="{{ url('/') }}">
                    <img src="{{ asset('front-assets/img/favicon.png') }}" height="55" alt="skoraCares logo"
                        class="logo">
                </a>
            </div>
            <button class="ul-sidebar-closer"><i class="flaticon-close-1 sidebar-btn"></i></button>
        </div>
        <div class="ul-sidebar-header-nav-wrapper d-block d-lg-none">
        </div>
        <div style="display:flex; flex-direction:row; gap:10px; padding: 10px 16px; width:100%;">

            {{-- Book a demo --}}
            <a href="" data-bs-toggle="modal" data-bs-target="#demoModal" class="ul-2-btn"
                style="flex:1; padding:10px 5px; display:flex; align-items:center; justify-content:center; gap:4px; white-space:nowrap; font-size:14px; min-height:44px;">
                Book a demo
            </a>

            @auth
                @if (in_array(auth()->user()->role, ['super_admin', 'admin']))
                    <a href="{{ route('super-admin.dashboard') }}" class="ul-2-btn"
                        style="flex:1; padding:10px 5px; display:flex; align-items:center; justify-content:center; font-size:14px; min-height:44px; line-height:1.2;">Dashboard</a>
                @elseif(in_array(auth()->user()->role, ['doctor', 'receptionist', 'nurse', 'accountant']))
                    <a href="{{ route('doctor.dashboard') }}" class="ul-2-btn"
                        style="flex:1; padding:10px 5px; display:flex; align-items:center; justify-content:center; font-size:14px; min-height:44px; line-height:1.2;">Dashboard</a>
                @else
                    <a href="{{ route('patient.dashboard') }}" class="ul-2-btn"
                        style="flex:1; padding:10px 5px; display:flex; align-items:center; justify-content:center; font-size:14px; min-height:44px; line-height:1.2;">Dashboard</a>
                @endif
            @else
                <a href="{{ route('login') }}" class="ul-2-btn"
                    style="flex:1; padding:10px 5px; display:flex; align-items:center; justify-content:center; font-size:14px; min-height:44px; line-height:1.2;">Sign In</a>
            @endauth

        </div>

        <!-- sidebar footer -->
        <div class="mt-2">
            <span class="ul-sidebar-footer-title">Follow us</span>

            <div class="ul-sidebar-footer-social">
                <a href="https://www.facebook.com/skoracares" target="_blank"><i class="flaticon-facebook"></i></a>
                {{-- <a href="#"><i class="flaticon-twitter"></i></a> --}}
                <a href="https://www.instagram.com/skoracares_?" target="_blank"><i class="flaticon-instagram"></i></a>
                <a href="https://www.linkedin.com/company/skoracares" target="_blank"><i
                        class="flaticon-linkedin-big-logo"></i></a>
            </div>
        </div>
    </div>
    <!-- HEADER SECTION START -->
    <header class="ul-header ul-header-2 ul-header-3">
        <div class="ul-header-bottom to-be-sticky wow animate__slideInDown">
            <div class="ul-header-bottom-wrapper ul-header-container">
                <div class="logo-container">
                    <a href="{{ url('/') }}" class="d-inline-block">
                        <img src="{{ asset('front-assets/img/Skora-logo.png') }}" alt="logo" class="logo">
                        <!-- <h4 class="fw-bold text-white">Skoracares</h4> -->
                    </a>
                </div>
                <div class="ul-header-bottom-center">
                    <!-- header nav -->
                    <div class="ul-header-nav-wrapper ">
                        <div class="to-go-to-sidebar-in-mobile">
                            <nav class="ul-header-nav ">
                                {{-- <a href="{{ url('/') }}" class="nav-link active">
                                    <i class="bi bi-house mobile-icon"></i>
                                    <span class="nav-text">Home</span>
                                </a>

                                <a href="{{ url('/about') }}" class="nav-link">
                                    <i class="bi bi-info-circle mobile-icon"></i>
                                    <span class="nav-text">About</span>
                                </a>

                                <a href="{{ url('/contact') }}" class="nav-link">
                                    <i class="bi bi-telephone mobile-icon"></i>
                                    <span class="nav-text">Contact</span>
                                </a> --}}


                            </nav>
                        </div>
                    </div>
                </div>

                <div class="ul-header-bottom-right">
                    <div class="ul-header-2-bottom-btns">
                        <a href="" data-bs-toggle="modal" data-bs-target="#demoModal"
                            class="ul-2-btn d-none d-lg-inline-flex align-items-center gap-1 me-1">
                            Book a demo
                        </a>

                        @auth
                            @if (in_array(auth()->user()->role, ['super_admin', 'admin']))
                                <a href="{{ route('super-admin.dashboard') }}" class="ul-2-btn d-xxs-none">Dashboard</a>
                            @elseif(in_array(auth()->user()->role, ['doctor', 'receptionist', 'nurse', 'accountant']))
                                <a href="{{ route('doctor.dashboard') }}" class="ul-2-btn d-xxs-none">Dashboard</a>
                            @else
                                <a href="{{ route('patient.dashboard') }}" class="ul-2-btn d-xxs-none">Dashboard</a>
                            @endif
                        @else
                            <a href="{{ route('login') }}" class="ul-2-btn d-xxs-none">Sign In</a>
                        @endauth
                        {{-- <a href="{{ route('contact') }}" class="ul-2-btn d-xxs-none">Contact</a> --}}
                        {{-- <a href="{{ route('register') }}" class="ul-2-btn d-xxs-none">Sign up</a> --}}
                    </div>
                    <button class="ul-header-sidebar-opener d-lg-none d-inline-flex"><i
                            class="flaticon-right-arrow"></i></button>
                </div>
            </div>
        </div>
    </header>

    <script>
        // header js 
        window.addEventListener("scroll", function () {
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

        /* Logo styling for scrolled state */
        header.scrolled .logo {
            filter: brightness(0) invert(1) !important;
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
            font-family: 'Inter', sans-serif !important;
            font-weight: 400;
        }

        .font-inter {
            font-family: 'Inter', sans-serif !important;
        }
    </style>


    @yield('content')

    <!-- FOOTER SECTION START -->
    <footer class="ul-footer ul-footer-2" sty>
        <!-- footer top -->
        <div class="ul-footer-top">
            <div class="ul-container">
                <div class="ul-footer-top-contact-infos">
                    <!-- single info -->
                    <div class="ul-footer-top-logo">
                        <a href="{{ url('/') }}">
                            <img src="front-assets/img/logo-new.png" height="30" alt="logo">
                            <!-- <h4 class="fw-bold">Skoracares</h4> -->
                        </a>
                        <div class="ul-footer-socials">
                            <a href="https://www.facebook.com/skoracares" target="_blank"><i
                                    class="flaticon-facebook-app-symbol"></i></a>
                            {{-- <a href="#"><i class="flaticon-twitter"></i></a> --}}
                            <a href="https://www.instagram.com/skoracares_?" target="_blank"><i
                                    class="flaticon-instagram"></i></a>
                            <a href="https://www.linkedin.com/company/skoracares" target="_blank"><i
                                    class="flaticon-linkedin-big-logo"></i></a>

                        </div>
                    </div>

                    <!-- single info -->
                    <div class="ul-footer-top-contact-info">
                        <!-- icon -->
                        <div class="ul-footer-top-contact-info-icon"><i class="flaticon-telephone"></i></div>
                        <!-- txt -->
                        <div class="ul-footer-top-contact-info-txt">
                            <span class="ul-footer-top-contact-info-label">Call Now </span>
                            <h5 class="ul-footer-top-contact-info-address"><a href="tel:+919217375831">+91 921 7375
                                    831</a> / <a href="tel:+919217375835">835</a></h5>
                        </div>
                    </div>

                    <!-- single info -->
                    <div class="ul-footer-top-contact-info">
                        <!-- icon -->
                        <div class="ul-footer-top-contact-info-icon"><i class="flaticon-mail"></i></div>
                        <!-- txt -->
                        <div class="ul-footer-top-contact-info-txt">
                            <span class="ul-footer-top-contact-info-label">Email Us</span>
                            <h5 class="ul-footer-top-contact-info-address"><a
                                    href="mailto:info@skoracares.com">info@skoracares.com</a></h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- footer middle -->
        <div class="ul-footer-middle">
            <div class="ul-container">
                <div class="ul-footer-middle-wrapper wow animate__fadeInUp">
                    <div class="ul-footer-about">
                        <h3 class="ul-footer-widget-title">About Us</h3>
                        <p class="ul-footer-about-txt">Upload prescriptions online, manage multiple clinics
                            effortlessly, and schedule home visits with map integration—all in one powerful platform
                            designed to simplify and grow your medical practice.</p>
                    </div>

                    <div class="ul-footer-widget">
                        <h3 class="ul-footer-widget-title">Our Best Service</h3>

                        <div class="ul-footer-widget-links">
                            <a href="https://www.skorasoft.com/" target="_blank">IT Management</a>
                            <a href="https://www.skorasoft.com/" target="_blank">SEO Optimization</a>
                            <a href="https://www.skorasoft.com/" target="_blank">Web Development</a>
                            <a href="https://www.skorasoft.com/" target="_blank">Cyber Security</a>
                            <a href="https://www.skorasoft.com/" target="_blank">Data Security</a>
                        </div>
                    </div>

                    <div class="ul-footer-widget ul-footer-recent-posts">
                        <h3 class="ul-footer-widget-title">Policy Pages</h3>

                        {{-- <div class="ul-footer-widget-links">
                            <a href="{{ url('/about') }}">About Us</a>
                            <a href="">Our Services</a>
                            <a href="">Our Blogs</a>
                            <a href="">FAQ'S</a>
                            <a href="{{ url('/contact') }}">Contact Us</a>
                        </div> --}}

                        <div class="ul-footer-widget-links">
                            <a href="{{ route('privacy-policy') }}">Privacy Policy</a>
                            <a href="{{ route('terms-conditions') }}">Terms & Conditions</a>
                            <a href="{{ route('cancellation-policy') }}">Cancellation Policy</a>
                            <a href="{{ route('refund-policy') }}">Refund Policy</a>

                        </div>
                    </div>

                    <div class="ul-footer-widget ul-nwsltr-widget">
                        <h3 class="ul-footer-widget-title">Contact Us</h3>
                        <div class="ul-footer-widget-links">
                            <span>Monday - Saturday : <span class="colored">10 AM – 7 PM</span></span>
                            <span>Sunday : <span class="colored">Closed</span></span>
                        </div>
                        {{-- <form action="#" class="ul-nwsltr-form">
                            <div class="top">
                                <input type="email" name="email" id="nwsltr-email" placeholder="Your Email Address"
                                    class="ul-nwsltr-input">
                                <button type="submit"><i class="flaticon-next-1"></i></button>
                            </div>

                            <div class="agreement">
                                <label for="nwsltr-agreement" class="ul-checkbox-wrapper">
                                    <input type="checkbox" name="agreement" id="nwsltr-agreement" hidden>
                                    <span class="ul-checkbox"><i class="flaticon-check-1"></i></span>
                                    <span class="ul-checkbox-txt">I agree with the <a
                                            href="{{ route('privacy-policy') }}">Privacy
                                            Policy</a></span>
                                </label>
                            </div>
                        </form> --}}
                    </div>
                </div>
            </div>
        </div>


        <div class="ul-container">
            <div class="ul-footer-bottom">
                <div class="ul-footer-bottom-wrapper justify-content-center">
                    <p class="copyright-txt"> &copy; ScoraCares
                        <script>
                            document.write(new Date().getFullYear())
                        </script> All rights reserved || Digital Partner <a href="https://www.skorasoft.com/"
                            class="text-dark" target="_blank"> SkoraSoft</a>
                    </p>
                </div>
            </div>
        </div>

        <div class="floating-buttons-container">
            <button id="scrollToTopBtn" class="floating-btn scroll-top-btn" title="Scroll to top">
                <i class="bi bi-arrow-up-circle"></i>

            </button>
        </div>
        <!-- vector -->
        <div class="ul-footer-vectors">
            <img src="front-assets/img/footer-2-vector-1.png" alt="Footer Image" class="ul-footer-vector-1">
            <img src="front-assets/img/footer-2-vector-2.png" alt="Footer Image" class="ul-footer-vector-2">
        </div>
    </footer>
    <!-- libraries JS -->
    <script src="{{ asset('front-assets/vendor/bootstrap/bootstrap.bundle.min.js') }}"></script>
    <script src="{{ asset('front-assets/vendor/splide/splide.min.js') }}"></script>
    <script src="{{ asset('front-assets/vendor/splide/splide-extension-auto-scroll.min.js') }}"></script>
    <script src="{{ asset('front-assets/vendor/swiper/swiper-bundle.min.js') }}"></script>
    <script src="{{ asset('front-assets/vendor/animate-wow/wow.min.js') }}"></script>
    <script src="{{ asset('front-assets/vendor/fslightbox/fslightbox.js') }}"></script>
    <script src="{{ asset('front-assets/vendor/scrollspy/simple-scrollspy.min.js') }}"></script>

    <!-- custom JS -->
    <script src="{{ asset('front-assets/js/main.js') }}"></script>
    <script src="{{ asset('front-assets/js/tab.js') }}"></script>
    <script src="{{ asset('front-assets/js/accordion.js') }}"></script>
    <script src="{{ asset('front-assets/js/progressbar.js') }}"></script>
    <script src="{{ asset('front-assets/js/about-tab-3.js') }}"></script>
    <script src="{{ asset('front-assets/js/custom.js') }}"></script>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const scrollToTopBtn = document.getElementById('scrollToTopBtn');

            if (scrollToTopBtn) {
                window.addEventListener('scroll', function () {
                    if (window.pageYOffset > 300) {
                        scrollToTopBtn.classList.add('show');
                        scrollToTopBtn.style.opacity = '1';
                        scrollToTopBtn.style.transform = 'translateY(0)';
                    } else {
                        scrollToTopBtn.classList.remove('show');
                        scrollToTopBtn.style.opacity = '0.8';
                    }
                });

                scrollToTopBtn.addEventListener('click', function () {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
            }
        });
    </script>


    {{-- whatsp floating button --}}

    <style>
        .whatsapp-float {
            position: fixed;
            width: 60px;
            height: 60px;
            bottom: 120px;
            right: 20px;
            background-color: #25D366;
            color: white;
            border-radius: 50%;
            text-align: center;
            font-size: 30px;
            box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: 0.3s;
        }

        .whatsapp-float:hover {
            background-color: #1ebe5d;
            transform: scale(1.1);
        }
    </style>

    <!-- WhatsApp Floating Button -->
    <a href="https://wa.me/919217375832" target="_blank" class="whatsapp-float">
        <i class="bi bi-whatsapp"></i>
    </a>



    @stack('scripts')


</body>

</html>