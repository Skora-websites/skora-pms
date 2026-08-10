<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkoraCares || Login</title>
    <link rel="icon" type="image/png" href="{{ asset('front-assets/img/favicon.png') }}">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <style>
        :root {
            --primary-color: #0e606e;
            --secondary-color: #b493f2;
            --accent-color: #f8d756;
            --text-color: #333;
            --light-bg: rgba(255, 255, 255, 0.95);
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s ease;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: radial-gradient(circle at left top, rgba(255, 154, 255, 0.06), rgba(0, 0, 0, 0) 40%),
                        radial-gradient(circle at right top, rgb(135 76 245 / 16%), transparent 40%),
                        radial-gradient(circle at left bottom, rgb(248 215 86 / 40%), transparent 40%),
                        radial-gradient(circle at right bottom, rgb(238 236 122 / 19%), transparent 40%);
            min-height: 100vh;
            padding: 20px;
            overflow-x: hidden;
        }

        /* Header Styling */
        .page-header {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
        }

        .back-btn {
            background: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
            color: var(--primary-color);
            font-size: 18px;
            transition: var(--transition);
            cursor: pointer;
        }

        .back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }

        .header-actions {
            display: flex;
            gap: 10px;
        }

        .header-icon {
            background: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
            color: var(--primary-color);
            font-size: 18px;
            transition: var(--transition);
            cursor: pointer;
        }

        .header-icon:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
        }

        /* Main Container */
        .main-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding-top: 5px;
        }

        /* Mobile & Tablet View */
        .login-wrapper {
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
            padding: 15px;
            /* box-shadow: 0 5px 15px rgba(0, 0, 0, 0.045); */
        }

        /* Desktop View */
        .login-card {
            background: var(--light-bg);
            border-radius: 9px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            width: 100%;
            max-width: 900px;
            display: flex;
            transition: var(--transition);
        }

        .login-card:hover {
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
        }

        .card-left {
            background: linear-gradient(135deg, var(--primary-color), #1a8fa0);
            padding: 40px;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 60%;
        }

        .card-right {
            padding: 40px;
            width: 55%;
        }

        /* Common Elements */
        .logo-container {
            text-align: center;
            margin-bottom: 25px;
        }

        .logo {
            height: 70px;
            transition: var(--transition);
        }

        .page-title {
            color: var(--primary-color);
            font-weight: 700;
            margin-top: 10px;
            font-size: 1.5rem;
        }

        /* Form Elements with Bottom Border Only */
        .custom-input-group {
            margin-bottom: 20px;
            position: relative;
        }

        .custom-input-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: var(--text-color);
            font-size: 0.9rem;
        }

        .input-container {
            position: relative;
            display: flex;
            align-items: center;
        }

        .custom-input {
            width: 100%;
            padding: 12px 45px 12px 26px;
            border: none;
            border-bottom: 2px solid #d1d1d1;
            background: transparent;
            font-size: 0.95rem;
            transition: var(--transition);
            outline: none;
            border-radius: 0;
        }

        .custom-input:focus {
            border-bottom: 2px solid var(--primary-color);
            box-shadow: none;
        }

        .custom-input.valid {
            border-bottom-color: #4CAF50;
        }

        .custom-input.error {
            border-bottom-color: #f44336;
        }

        .input-icon {
            position: absolute;
            left: 0;
            color: var(--primary-color);
            font-size: 1rem;
        }

        .toggle-password {
            position: absolute;
            right: 0;
            background: none;
            border: none;
            color: #777;
            cursor: pointer;
            font-size: 1rem;
            transition: var(--transition);
            padding: 5px;
        }

        .toggle-password:hover {
            color: var(--primary-color);
        }

        .validation-message {
            font-size: 0.8rem;
            margin-top: 4px;
            display: none;
        }

        .validation-message.error {
            color: #f44336;
            display: block;
        }

        .validation-message.success {
            color: #4CAF50;
            display: block;
        }

        /* 3D Buttons with Box Shadow */
        .btn-primary {
            background-color: var(--primary-color);
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 0.95rem;
            font-weight: 600;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 0 #0a4c58,
                        0 6px 12px rgba(14, 96, 110, 0.25);
            position: relative;
            top: 0;
        }

        .btn-primary:hover {
            background-color: #0a4c58;
            transform: translateY(-2px);
            box-shadow: 0 6px 0 #083a44,
                        0 8px 16px rgba(14, 96, 110, 0.3);
        }

        .btn-primary:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0 #083a44,
                        0 4px 8px rgba(14, 96, 110, 0.2);
        }

        .button-group {
            display: flex;
            gap: 12px;
            margin-top: 25px;
        }

        .button-group .btn {
            flex: 1;
        }

        /* Loading Overlay */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            flex-direction: column;
        }

        .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid var(--primary-color);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Success Message */
        .success-message {
            text-align: center;
            padding: 25px;
            display: none;
        }

        .success-message i {
            font-size: 3rem;
            color: #4CAF50;
            margin-bottom: 15px;
        }

        .success-message h3 {
            color: var(--primary-color);
            margin-bottom: 10px;
            font-size: 1.3rem;
        }
        
        .error-message {
            background-color: #ffe6e6;
            border-left: 3px solid #f44336;
            padding: 12px;
            margin-bottom: 15px;
            border-radius: 4px;
            display: none;
            font-size: 0.9rem;
        }
        
        .error-message i {
            color: #f44336;
            margin-right: 8px;
        }

        /* Features List */
        .features-list {
            list-style: none;
            padding: 0;
            margin-top: 20px;
        }

        .features-list li {
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            font-size: 0.9rem;
        }

        .features-list i {
            margin-right: 10px;
            background: rgba(255, 255, 255, 0.2);
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            body {
                padding: 15px;
                background-attachment: fixed;
            }
            
            .page-header {
                top: 15px;
                left: 15px;
                right: 15px;
            }
            
            .main-container {
                padding-top: 70px;
            }
            
            .login-wrapper {
                padding: 20px;
                /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); */
                max-width: 100%;
            }
            
            .logo {
                height: 70px;
            }
            
            .page-title {
                font-size: 1.3rem;
            }
            
            .custom-input {
                font-size: 0.9rem;
                padding: 10px 18px 0px 27px;
            }
            
            .btn-primary {
                padding: 10px 20px;
                font-size: 0.9rem;
            }
            
            .button-group {
                flex-direction: column;
            }
        }

        @media (min-width: 769px) and (max-width: 992px) {
            .login-card {
                max-width: 700px;
            }
            
            .card-left, .card-right {
                padding: 30px;
            }
            
            .logo {
                height: 70px;
            }
            
            .page-title {
                font-size: 1.4rem;
            }
        }

        @media (min-width: 993px) {
            .login-wrapper {
                display: none;
            }
            
            .login-card {
                display: flex;
            }
            
            .back-btn {
                width: 45px;
                height: 45px;
                font-size: 20px;
            }
            
            .header-icon {
                width: 45px;
                height: 45px;
                font-size: 20px;
            }
        }

        @media (max-width: 992px) {
            .login-card {
                display: none;
            }
            
            .login-wrapper {
                display: block;
            }
        }

        /* Link Styling */
        .signup-link {
            text-align: center;
            margin-top: 20px;
            font-size: 0.9rem;
        }
        
        .signup-link a {
            color: var(--primary-color);
            font-weight: 600;
            text-decoration: none;
        }
        
        .signup-link a:hover {
            text-decoration: underline;
        }

        /* Forgot Password Link */
        .forgot-password {
            text-align: right;
            margin-top: 5px;
        }
        
        .forgot-password a {
            color: var(--primary-color);
            font-size: 0.85rem;
            text-decoration: none;
        }
        
        .forgot-password a:hover {
            text-decoration: underline;
        }

        /* Remember Me Checkbox */
        .remember-me {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .remember-me input {
            margin-right: 8px;
            accent-color: var(--primary-color);
        }
        
        .remember-me label {
            font-size: 0.9rem;
            color: var(--text-color);
            cursor: pointer;
        }
    </style>
</head>
<body>
    <!-- Header with Back Button and Icons -->
    <div class="page-header">
       <button class="back-btn" onclick="history.back()">
            <i class="fas fa-arrow-left"></i>
        </button>
        <div class="header-actions">
            <button class="header-icon" id="helpBtn" title="Help">
                <i class="fas fa-question-circle"></i>
            </button>
            <button class="header-icon" id="infoBtn" title="Information">
                <i class="fas fa-info-circle"></i>
            </button>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loader"></div>
        <p style="font-size: 0.95rem;">Signing you in...</p>
    </div>

    <!-- Main Container -->
    <div class="main-container">
        <!-- Mobile & Tablet View -->
        <div class="login-wrapper">
            <div class="logo-container">
                <img src="{{ asset('front-assets/img/favicon.png') }}" alt="SkoraCares Logo" class="logo">
                <h2 class="page-title">Welcome Back</h2>
            </div>
            
            <!-- Error Message Display -->
            @if($errors->any())
                <div class="error-message" id="mobileErrorMessage">
                    <i class="fas fa-exclamation-circle"></i>
                    <span id="mobileErrorText">
                        @foreach($errors->all() as $error)
                            {{ $error }}<br>
                        @endforeach
                    </span>
                </div>
            @endif
            
            @if(session('error'))
                <div class="error-message" id="mobileErrorMessage">
                    <i class="fas fa-exclamation-circle"></i>
                    <span id="mobileErrorText">{{ session('error') }}</span>
                </div>
            @endif
            
            @if(session('success'))
                <div class="alert alert-success" id="mobileSuccessMessage">
                    {{ session('success') }}
                </div>
            @endif
            
            <!-- Mobile Login Form -->
            <form id="loginFormMobile" method="POST" action="{{ route('login') }}">
                @csrf
                
                <div class="custom-input-group">
                    <label for="mobileEmail">Email Address *</label>
                    <div class="input-container">
                        <span class="input-icon">
                            <i class="fas fa-envelope"></i>
                        </span>
                        <input type="email" class="custom-input" id="mobileEmail" name="email" 
                            placeholder="Enter your email" value="{{ old('email') }}" required>
                    </div>
                    <div class="validation-message" id="mobileEmailValidation"></div>
                </div>
                
                <div class="custom-input-group">
                    <label for="mobilePassword">Password *</label>
                    <div class="input-container">
                        <span class="input-icon">
                            <i class="fas fa-lock"></i>
                        </span>
                        <input type="password" class="custom-input" id="mobilePassword" name="password" 
                            placeholder="Enter your password" required>
                        <button type="button" class="toggle-password" data-target="mobilePassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="validation-message" id="mobilePasswordValidation"></div>
                </div>
                
                <div class="remember-me">
                    <input type="checkbox" id="mobileRemember" name="remember" {{ old('remember') ? 'checked' : '' }}>
                    <label for="mobileRemember">Remember me</label>
                </div>
                
                <div class="forgot-password">
                    @if (Route::has('password.request'))
                        <a href="{{ route('password.request') }}">
                            Forgot your password?
                        </a>
                    @endif
                </div>
                
                <button type="submit" class="btn btn-primary w-100 mt-3" id="mobileLoginBtn">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
                <!-- Biometric Login -->
                <button type="button" id="mobileBiometricBtn" class="btn btn-outline-secondary w-100 mt-3">
                    <i class="fas fa-fingerprint"></i> Login with Fingerprint / Face ID
                </button>

                <!-- Passkey Login -->
                <button type="button" id="mobilePasskeyBtn" class="btn btn-outline-dark w-100 mt-2">
                    <i class="fas fa-key"></i> Login with Passkey
                </button>


            </form>
            
            <div class="signup-link">
                <p>Don't have an account? <a href="{{ route('register') }}">Sign Up</a></p>
            </div>
        </div>
        
        <!-- Desktop View -->
        <div class="login-card">
            <div class="card-left">
                <div class="logo-container">
                    <img src="{{ asset('front-assets/img/logo-new.png') }}" height="40" alt="logo" class="logo" style="filter: brightness(0) invert(1) !important;">
                    <h2 class="page-title" style="color: white;">Welcome Back to SkoraCares</h2>
                </div>
                <p style="font-size: 0.9rem; opacity: 0.9;">Sign in to access your personalized healthcare dashboard and continue your wellness journey.</p>
                <ul class="features-list">
                    <li><i class="fas fa-heartbeat"></i> Track your health progress</li>
                    <li><i class="fas fa-calendar-check"></i> Manage appointments</li>
                    <li><i class="fas fa-user-md"></i> Connect with healthcare providers</li>
                    <li><i class="fas fa-shield-alt"></i> Secure & private access</li>
                </ul>
                <div class="signup-link" style="margin-top: 30px;">
                    <p style="color: white; opacity: 0.9; font-size: 0.9rem;">New to SkoraCares? <a href="{{ route('register') }}" style="color: var(--accent-color);">Create Account</a></p>
                </div>
            </div>
            <div class="card-right">
                <!-- Error Message Display -->
                @if($errors->any())
                    <div class="error-message" id="errorMessage">
                        <i class="fas fa-exclamation-circle"></i>
                        <span id="errorText">
                            @foreach($errors->all() as $error)
                                {{ $error }}<br>
                            @endforeach
                        </span>
                    </div>
                @endif
                
                @if(session('error'))
                    <div class="error-message" id="errorMessage">
                        <i class="fas fa-exclamation-circle"></i>
                        <span id="errorText">{{ session('error') }}</span>
                    </div>
                @endif
                
                @if(session('success'))
                    <div class="alert alert-success" id="successMessage">
                        {{ session('success') }}
                    </div>
                @endif
                
                <!-- Desktop Login Form -->
                <form id="loginFormDesktop" method="POST" action="{{ route('login') }}">
                    @csrf
                    
                    <h4 class="mb-5" style="color: var(--primary-color); font-size: 1.2rem;">Sign In to Your Account</h4>
                    
                    <div class="custom-input-group mt-5">
                        <label for="desktopEmail">Email Address *</label>
                        <div class="input-container">
                            <span class="input-icon">
                                <i class="fas fa-envelope"></i>
                            </span>
                            <input type="email" class="custom-input" id="desktopEmail" name="email" 
                                placeholder="Enter your email address" value="{{ old('email') }}" required>
                        </div>
                        <div class="validation-message" id="desktopEmailValidation"></div>
                    </div>
                    
                    <div class="custom-input-group">
                        <label for="desktopPassword">Password *</label>
                        <div class="input-container">
                            <span class="input-icon">
                                <i class="fas fa-lock"></i>
                            </span>
                            <input type="password" class="custom-input" id="desktopPassword" name="password" 
                                placeholder="Enter your password" required>
                            <button type="button" class="toggle-password" data-target="desktopPassword">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="validation-message" id="desktopPasswordValidation"></div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div class="remember-me">
                            <input type="checkbox" id="desktopRemember" name="remember" {{ old('remember') ? 'checked' : '' }}>
                            <label for="desktopRemember">Remember me</label>
                        </div>
                        
                        @if (Route::has('password.request'))
                            <div class="forgot-password">
                                <a href="{{ route('password.request') }}">
                                    Forgot Password?
                                </a>
                            </div>
                        @endif
                    </div>
                    
                    <button type="submit" class="btn btn-primary w-100" id="desktopLoginBtn">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>

                    <!-- Biometric Login -->
                <button type="button" id="desktopBiometricBtn" class="btn btn-outline-secondary w-100 mt-3">
                    <i class="fas fa-fingerprint"></i> Login with Fingerprint / Face ID
                </button>

                <!-- Passkey Login -->
                <button type="button" id="desktopPasskeyBtn" class="btn btn-outline-dark w-100 mt-2">
                    <i class="fas fa-key"></i> Login with Passkey
                </button>

                </form>
                
                <div class="signup-link mt-4">
                    <p style="font-size: 0.9rem;">Don't have an account? <a href="{{ route('register') }}">Create Account</a></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        $(document).ready(function() {
            // Determine current view based on screen width
            const isMobileView = window.innerWidth < 993;
            $('#helpBtn').click(function() {
                alert('Need help with login? Contact our support team at support@skoracares.com');
            });
            
            $('#infoBtn').click(function() {
                alert('SkoraCares Login - Access your personalized healthcare dashboard.');
            });
            
            // Toggle password visibility
            $('.toggle-password').click(function() {
                const targetId = $(this).data('target');
                const input = $('#' + targetId);
                const icon = $(this).find('i');
                
                if (input.attr('type') === 'password') {
                    input.attr('type', 'text');
                    icon.removeClass('fa-eye').addClass('fa-eye-slash');
                } else {
                    input.attr('type', 'password');
                    icon.removeClass('fa-eye-slash').addClass('fa-eye');
                }
            });
            
            // Form validation on blur
            $('.custom-input').on('blur', function() {
                validateField($(this));
            });
            
            // Form submission handling
            if (isMobileView) {
                // Mobile form submission
                $('#loginFormMobile').on('submit', function(e) {
                    // Basic validation
                    const email = $('#mobileEmail').val().trim();
                    const password = $('#mobilePassword').val().trim();
                    
                    if (!email || !password) {
                        e.preventDefault();
                        $('#mobileErrorMessage').show().find('#mobileErrorText').text('Please enter both email and password.');
                        return false;
                    }
                    
                    // Email format validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        e.preventDefault();
                        $('#mobileErrorMessage').show().find('#mobileErrorText').text('Please enter a valid email address.');
                        return false;
                    }
                    
                    // Show loading overlay
                    $('#loadingOverlay').css('display', 'flex');
                });
            } else {
                // Desktop form submission
                $('#loginFormDesktop').on('submit', function(e) {
                    // Basic validation
                    const email = $('#desktopEmail').val().trim();
                    const password = $('#desktopPassword').val().trim();
                    
                    if (!email || !password) {
                        e.preventDefault();
                        $('#errorMessage').show().find('#errorText').text('Please enter both email and password.');
                        return false;
                    }
                    
                    // Email format validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        e.preventDefault();
                        $('#errorMessage').show().find('#errorText').text('Please enter a valid email address.');
                        return false;
                    }
                    
                    // Show loading overlay
                    $('#loadingOverlay').css('display', 'flex');
                });
            }
            
            // Show error messages if they exist
            @if($errors->any() || session('error'))
                if (isMobileView) {
                    $('#mobileErrorMessage').show();
                } else {
                    $('#errorMessage').show();
                }
            @endif
            
            // Auto-hide success messages after 5 seconds
            $('.alert-success').delay(5000).fadeOut();
        });
        
        // Function to validate an individual field
        function validateField(field) {
            const fieldId = field.attr('id');
            const fieldValue = field.val().trim();
            let isValid = true;
            let message = '';
            
            // Reset validation classes
            field.removeClass('valid error');
            
            // Email validation
            if (fieldId.includes('Email')) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (fieldValue === '') {
                    isValid = false;
                    message = 'Email is required';
                } else if (!emailRegex.test(fieldValue)) {
                    isValid = false;
                    message = 'Please enter a valid email address';
                } else {
                    isValid = true;
                    message = 'Email looks good!';
                }
            }
            
            // Password validation
            else if (fieldId.includes('Password')) {
                if (fieldValue === '') {
                    isValid = false;
                    message = 'Password is required';
                } else {
                    isValid = true;
                    message = 'Password looks good!';
                }
            }
            
            // Update field classes and validation message
            if (fieldValue !== '') {
                if (isValid) {
                    field.addClass('valid');
                } else {
                    field.addClass('error');
                }
            }
            
            // Update validation message element
            const validationElement = $('#' + fieldId + 'Validation');
            if (validationElement.length) {
                validationElement.text(message);
                validationElement.removeClass('error success');
                
                if (fieldValue !== '') {
                    validationElement.addClass(isValid ? 'success' : 'error');
                }
            }
            
            return isValid;
        }
    </script>


<script>
async function biometricLogin() {

    if (!window.PublicKeyCredential) {
        alert("Biometric login not supported on this device.");
        return;
    }

    try {

        // Step 1 → Get options from server
        let res = await fetch("/webauthn/login/options");
        let options = await res.json();

        // Step 2 → Ask device for fingerprint / face
        let credential = await navigator.credentials.get({
            publicKey: options
        });

        // Step 3 → Verify with server
        let verify = await fetch("/webauthn/login/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": "{{ csrf_token() }}"
            },
            body: JSON.stringify(credential)
        });

        let result = await verify.json();

        if(result.success){
            window.location.href = "/dashboard";
        } else {
            alert("Biometric login failed!");
        }

    } catch (err) {
        console.error(err);
        alert("Biometric authentication cancelled.");
    }
}

// Button Clicks
$("#mobileBiometricBtn, #desktopBiometricBtn").click(function(){
    biometricLogin();
});

$("#mobilePasskeyBtn, #desktopPasskeyBtn").click(function(){
    biometricLogin();
});
</script>

</body>
</html>