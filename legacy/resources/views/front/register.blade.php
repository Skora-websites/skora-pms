<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkoraCares || Signup</title>

    @include('front.inc.header-links')

    <!-- jQuery CDN -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- Select2 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

    <style>
        .ul-header-2 .ul-header-bottom-wrapper {
            background-color: #0e606e;
            border-radius: 30px;
        }
    </style>

</head>

<body class="">

    <main>

        <div class="preloader" id="preloader">
            <div class="loader"></div>
        </div>

        <!-- SIDEBAR SECTION START -->
        <div class="ul-sidebar">
            <!-- header -->
            <div class="ul-sidebar-header">
                <div class="ul-sidebar-header-logo">
                    <a href="{{ url('/') }}">
                        <img src="front-assets/img/main-logo.png" height="40" alt="logo" class="logo">
                    </a>
                </div>
                <!-- sidebar closer -->
                <button class="ul-sidebar-closer"><i class="flaticon-close-1"></i></button>
            </div>

            <div class="ul-sidebar-header-nav-wrapper d-block d-lg-none">
            </div>
            <div class="ul-header-bottom-right">
                <div class="ul-header-2-bottom-btns">
                    <a href="login.php" class="ul-2-btn border-dark text-dark">Log In</a>
                    <a href="register.php" class="ul-2-btn border border-dark">Sign up</a>
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
                            <img src="front-assets/img/main-logo.png" height="30" alt="logo" class="logo" style="filter: brightness(0) invert(1);">
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
                                    <a href="">Services</a>
                                    <a href="blog.php">Blog</a>
                                    <a href="{{ url('/contact') }}">Contact</a>
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div class="ul-header-bottom-right">
                        <div class="ul-header-2-bottom-btns">
                            <a href="login.php" class="ul-2-btn d-xxs-none">Log In</a>
                            <a href="register.php" class="ul-2-btn d-xxs-none">Sign up</a>
                        </div>
                        <button class="ul-header-sidebar-opener d-lg-none d-inline-flex"><i class="flaticon-right-arrow"></i></button>
                    </div>
                </div>
            </div>
        </header>
        <!-- HEADER SECTION END -->



        <section class="py-5">
            <div class="container  py-5">
                <div class="row align-items-center justify-content-center py-5">
                    <div class="col-lg-12">
                        <div class="card shadow-lg border-0 rounded-5" style=" background: #ffffffa3;">
                            <div class="card-body p-4">

                                <!-- Step Indicator -->
                                <div class=" d-flex justify-content-center">
                                    <div class="col-6 d-flex justify-content-between position-relative ">
                                        <div class="step-progress w-100 position-absolute top-50 start-50 translate-middle "></div>
                                        <div class="text-center">
                                            <div class="step-circle active">1</div>
                                            <!-- <div class="step-label">Mobile</div> -->
                                        </div>
                                        <div class="text-center">
                                            <div class="step-circle">2</div>
                                            <!-- <div class="step-label">Doctor</div> -->
                                        </div>
                                        <div class="text-center">
                                            <div class="step-circle">3</div>
                                            <!-- <div class="step-label">Address</div> -->
                                        </div>
                                        <div class="text-center">
                                            <div class="step-circle">4</div>
                                            <!-- <div class="step-label">Account</div> -->
                                        </div>
                                    </div>

                                </div>

                                <div class="col-10 mx-auto border-0 p-3 mt-3 rounded-3" style="background: #fcf9f447;">
                                    <form id="multiStepForm ">
                                        <!-- Step 1 -->
                                        <div class="form-step ">
                                            <div class="row  align-items-center">
                                                <div class="col-lg-6 d-none d-lg-block">
                                                    <div class="gif">
                                                        <img src="front-assets/img/login-gif.gif" class="w-100" alt="">
                                                    </div>
                                                </div>
                                                <div class="col-lg-1">
                                                </div>
                                                <div class="col-lg-5 ">
                                                    <div class="mb-3">
                                                        <label for="mobile" class="form-label ">Mobile Number</label>
                                                        <input type="tel" class="form-control" id="mobile" placeholder="Enter mobile number">
                                                    </div>
                                                    <div class="d-flex justify-content-between">
                                                        <button type="button" class="btn btn-sm login-btn">Send OTP</button>
                                                        <button type="button" class="btn btn-sm login-btn next-btn">Next</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Step 2 -->
                                        <div class="form-step d-none">
                                            <div class="row">
                                                <div class="col-lg-6 mb-3">
                                                    <label for="drName" class="form-label">Doctor Name</label>
                                                    <input type="text" class="form-control" id="drName" placeholder="Dr. Name">
                                                </div>
                                                <div class="col-lg-6 mb-3">
                                                    <label class="form-label ">Degree</label>

                                                    <select class="js-example-basic-multiple w-100" name="items[]" multiple="multiple">
                                                        <option value="Apple">Apple</option>
                                                        <option value="Banana">Banana</option>
                                                        <option value="Orange">Orange</option>
                                                        <option value="Mango">Mango</option>
                                                        <option value="Grapes">Grapes</option>
                                                        <option value="Pineapple">Pineapple</option>
                                                        <option value="Strawberry">Strawberry</option>
                                                        <option value="Watermelon">Watermelon</option>
                                                    </select>
                                                </div>
                                                <div class="col-lg-6 mb-3">
                                                    <label for="clinic" class="form-label ">Clinic Name (optional)</label>
                                                    <input type="text" class="form-control" id="clinic" placeholder="Clinic Name">
                                                </div>
                                                <div class="col-lg-6 mb-3">
                                                    <label for="specialization" class="form-label ">Area of Specialization</label>
                                                    <select class="form-select" id="specialization" multiple>
                                                        <option>Cardiology</option>
                                                        <option>Dermatology</option>
                                                        <option>Neurology</option>
                                                        <option>Pediatrics</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="d-flex justify-content-between mt-4">
                                                <button type="button" class="btn btn-sm login-btn prev-btn">Previous</button>
                                                <button type="button" class="btn btn-sm login-btn next-btn">Next</button>
                                            </div>
                                        </div>

                                        <!-- Step 3 -->
                                        <div class="form-step d-none">
                                            <div class="row">
                                                <div class="col-lg-6 mb-3">
                                                    <label for="country" class="form-label ">Country</label>
                                                    <input type="text" class="form-control" id="country" placeholder="Country">
                                                </div>
                                                <div class="col-lg-6 mb-3">
                                                    <label for="state" class="form-label">State</label>
                                                    <input type="text" class="form-control" id="state" placeholder="State">
                                                </div>
                                                <div class="col-lg-6 mb-3">
                                                    <label for="city" class="form-label">City</label>
                                                    <input type="text" class="form-control" id="city" placeholder="City">
                                                </div>
                                                <div class="col-lg-6 mb-3">
                                                    <label for="address" class="form-label ">Address</label>
                                                    <input type="text" class="form-control" id="address" placeholder="Address">
                                                </div>
                                                <div class="col-lg-6 mb-3">
                                                    <label for="currentAddress" class="form-label">Current Address</label>
                                                    <input type="text" class="form-control" id="currentAddress" placeholder="Current Address">
                                                </div>
                                            </div>
                                            <div class="d-flex justify-content-between mt-4">
                                                <button type="button" class="btn btn-sm login-btn prev-btn">Previous</button>
                                                <div class="d-flex gap-2">
                                                    <button type="button" class="btn btn-sm btn-outline-secondary skip-btn">Skip</button>
                                                    <button type="button" class="btn btn-sm login-btn next-btn">Next</button>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Step 4 -->
                                        <div class="form-step d-none justify-content-center">
                                            <div class="col-lg-5 m-auto">
                                                <div class=" mb-3">
                                                    <label for="email" class="form-label ">Email</label>
                                                    <input type="email" class="form-control" id="email" placeholder="Email address">
                                                </div>
                                                <div class="mb-3 login-eye">
                                                    <label for="password" class="form-label ">Password</label>
                                                    <input type="password" class="form-control" id="password" placeholder="At least 8 characters">
                                                    <span class=" me-3 toggle-password" style="cursor:pointer;">👁️</span>
                                                </div>
                                                <div class="mb-3  login-eye">
                                                    <label for="confirmPassword" class="form-label ">Confirm Password</label>
                                                    <input type="password" class="form-control" id="confirmPassword" placeholder="Re-enter your password">
                                                    <span class=" me-3 toggle-password" style="cursor:pointer;">👁️</span>
                                                </div>
                                                <div class="text-end">
                                                    <button type="submit" class="btn btn-sm login-btn">Submit</button>
                                                </div>
                                            </div>
                                            <div class="d-flex justify-content-between mt-4">
                                                <button type="button" class="btn btn-sm login-btn prev-btn">Previous</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>




    </main>

    <?php include('front-assets/inc/footer.php') ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>


    <script>
        const formSteps = document.querySelectorAll('.form-step');
        const nextBtns = document.querySelectorAll('.next-btn');
        const prevBtns = document.querySelectorAll('.prev-btn');
        const skipBtns = document.querySelectorAll('.skip-btn');
        const stepCircles = document.querySelectorAll('.step-circle');
        let currentStep = 0;

        function showStep(step) {
            formSteps.forEach((s, i) => s.classList.toggle('d-none', i !== step));
            stepCircles.forEach((circle, i) => {
                circle.classList.toggle('active', i <= step);
            });
        }

        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentStep = Math.min(currentStep + 1, formSteps.length - 1);
                showStep(currentStep);
            });
        });

        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentStep = Math.max(currentStep - 1, 0);
                showStep(currentStep);
            });
        });

        skipBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentStep = Math.min(currentStep + 1, formSteps.length - 1);
                showStep(currentStep);
            });
        });

        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(el => {
            el.addEventListener('click', () => {
                const input = el.previousElementSibling;
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        });
    </script>

    <script>
        $(document).ready(function() {
            $('.js-example-basic-multiple').select2({
                placeholder: "Search and select items...",
                allowClear: true,
                closeOnSelect: false,
                templateSelection: function(data) {
                    return data.text || data.id;
                }
            });

            // Log selected values to console for demonstration
            $('.js-example-basic-multiple').on('change', function() {
                let selectedValues = $(this).val();
                console.log('Selected:', selectedValues);
            });
        });
    </script>


    <?php include('front-assets/inc/footer-links.php') ?>

</body>

</html>