<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkoraCares || SignUp</title>
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
            padding-top: 0px;
        }

        /* Mobile & Tablet View */
        .signup-wrapper {
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
            padding: 15px;
            /* box-shadow: 0 5px 15px rgba(0, 0, 0, 0.045); */
        }

        /* Desktop View */
        .signup-card {
            background: var(--light-bg);
            border-radius: 9px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            width: 100%;
            max-width: 900px;
            display: flex;
            transition: var(--transition);
        }

        .signup-card:hover {
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

        .step-indicator {
            display: flex;
            justify-content: center;
            margin-bottom: 25px;
            position: relative;
        }

        .step {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #777;
            position: relative;
            z-index: 2;
            font-size: 0.85rem;
            transition: var(--transition);
        }

        .step.active {
            background: var(--primary-color);
            color: white;
            transform: scale(1.1);
        }

        .step.completed {
            background: #4CAF50;
            color: white;
        }

        .step-line {
            height: 2px;
            background: #e0e0e0;
            flex-grow: 1;
            margin: 0 8px;
            align-self: center;
            max-width: 60px;
            transition: var(--transition);
        }

        .step-line.active {
            background: var(--primary-color);
        }

        .step-label {
            position: absolute;
            top: 38px;
            font-size: 0.75rem;
            color: #777;
            white-space: nowrap;
        }

        .step-label.active {
            color: var(--primary-color);
            font-weight: 600;
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
            color: #626262eb;
            font-size: 0.9rem;
        }

        .input-container {
            position: relative;
            display: flex;
            align-items: center;
        }

        .custom-input, .custom-select {
            width: 100%;
            padding: 12px 45px 5px 23px;
            border: none;
            border-bottom: 2px solid #d1d1d1;
            background: transparent;
            font-size: 0.95rem;
            transition: var(--transition);
            outline: none;
            border-radius: 0;
        }

        .custom-input:focus, .custom-select:focus {
            border-bottom: 2px solid var(--primary-color);
            box-shadow: none;
        }

        .custom-input.valid, .custom-select.valid {
            border-bottom-color: #4CAF50;
        }

        .custom-input.error, .custom-select.error {
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
            padding: 10px 0px;
            font-size: 0.95rem;
            font-weight: 600;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 0 #0a4c58, 0 6px 12px rgba(14, 96, 110, 0.25);
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

        .btn-secondary {
            background-color: #6c757d;
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
            box-shadow: 0 4px 0 #545b62,
                        0 6px 12px rgba(108, 117, 125, 0.25);
            position: relative;
            top: 0;
        }

        .btn-secondary:hover {
            background-color: #5a6268;
            transform: translateY(-2px);
            box-shadow: 0 6px 0 #484e53,
                        0 8px 16px rgba(108, 117, 125, 0.3);
        }

        .btn-secondary:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0 #484e53,
                        0 4px 8px rgba(108, 117, 125, 0.2);
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

        /* Step Animation */
        .step-content {
            animation: fadeIn 0.4s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
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
                padding-top: 50px;
            }
            
            .signup-wrapper {
                padding: 20px;
                max-width: 100%;       
                 /* box-shadow: 0 3px 3px 4px rgb(14 96 110 / 45%); */
                max-width: 100%;
                border-radius: 7px;
            }
            
            .logo {
                height: 70px;
            }
            
            .page-title {
                font-size: 1.3rem;
            }
            
            .custom-input, .custom-select {
                font-size: 0.9rem;
                padding: 10px 18px 0px 21px;
            }
            
            .btn-primary, .btn-secondary {
                padding: 10px 20px;
                font-size: 0.9rem;
            }
            
            .button-group {
                flex-direction: column;
            }
            
            .step {
                width: 28px;
                height: 28px;
                font-size: 0.8rem;
            }
            
            .step-line {
                max-width: 40px;
            }
        }

        @media (min-width: 769px) and (max-width: 992px) {
            .signup-card {
                max-width: 700px;
            }
            
            .card-left, .card-right {
                padding: 30px;
            }
            
            .logo {
                height: 75px;
            }
            
            .page-title {
                font-size: 1.4rem;
            }
        }

        @media (min-width: 993px) {
            .signup-wrapper {
                display: none;
            }
            
            .signup-card {
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
            .signup-card {
                display: none;
            }
            
            .signup-wrapper {
                display: block;
            }
        }

        /* Link Styling */
        .login-link {
            text-align: center;
            margin-top: 20px;
            font-size: 0.9rem;
        }
        
        .login-link a {
            color: var(--primary-color);
            font-weight: 600;
            text-decoration: none;
        }
        
        .login-link a:hover {
            text-decoration: underline;
        }

        /* Mobile-specific classes */
        .mobile-only {
            display: none;
        }
        
        @media (max-width: 992px) {
            .mobile-only {
                display: block;
            }
            
            .desktop-only {
                display: none;
            }
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
        <p style="font-size: 0.95rem;">Creating your account...</p>
    </div>  

    <!-- Main Container -->
    <div class="main-container">
        <!-- Mobile & Tablet View -->
        <div class="signup-wrapper">
            <div class="logo-container">
                 <a href="{{ url('/') }}">
                <img src="{{ asset('front-assets/img/favicon.png') }}" alt="SkoraCares Logo" class="logo">
                 </a>
                <h2 class="page-title ">Create Account</h2>
            </div>
            
            <div class="step-indicator">
                <div class="step active" id="mobileStep1">1</div>
                <div class="step-label active"></div>
                <div class="step-line"></div>
                <div class="step" id="mobileStep2">2</div>
                <div class="step-label"></div>
            </div>
            
            <div class="error-message" id="mobileErrorMessage">
                <i class="fas fa-exclamation-circle"></i>
                <span id="mobileErrorText">Please fill in all required fields correctly.</span>
            </div>
            
            <!-- Success message display -->
            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif
            
            @if(session('error'))
                <div class="alert alert-danger">
                    {{ session('error') }}
                </div>
            @endif
            
            <!-- Mobile Form with Role Field -->
            <form id="signupFormMobile" method="POST" action="{{ route('register.submit') }}">
                @csrf
                
                <!-- Step 1: Personal Information -->
                <div class="step-content" id="mobileStep1Content">
                    <div class="custom-input-group">
                        <label for="mobileName">Full Name *</label>
                        <div class="input-container">
                            <input type="text" class="custom-input" id="mobileName" name="name" 
                                placeholder="Full Name" value="{{ old('name') }}" required>
                            <span class="input-icon">
                                <i class="fas fa-user"></i>
                            </span>
                        </div>
                        <div class="validation-message" id="mobileNameValidation"></div>
                        @error('name')
                            <div class="text-danger">{{ $message }}</div>
                        @enderror
                    </div>
                    
                    <div class="custom-input-group">
                        <label for="mobileEmail">Email *</label>
                        <div class="input-container">
                            <input type="email" class="custom-input" id="mobileEmail" name="email" 
                                placeholder="Email address" value="{{ old('email') }}" required>
                            <span class="input-icon">
                                <i class="fas fa-envelope"></i>
                            </span>
                        </div>
                        <div class="validation-message" id="mobileEmailValidation"></div>
                        @error('email')
                            <div class="text-danger">{{ $message }}</div>
                        @enderror
                    </div>
                    
                    <div class="custom-input-group">
                        <label for="mobilePhone">Phone *</label>
                        <div class="input-container">
                            <input type="tel" class="custom-input" id="mobilePhone" name="phone" 
                                placeholder="Phone number" value="{{ old('phone') }}" required maxlength="10" minlength="10">
                            <span class="input-icon">
                                <i class="fas fa-phone"></i>
                            </span>
                        </div>
                        <div class="validation-message" id="mobilePhoneValidation"></div>
                        @error('phone')
                            <div class="text-danger">{{ $message }}</div>
                        @enderror
                    </div>
                    
                    <button type="button" class="btn btn-primary w-100" id="mobileNextBtn">
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                
                <!-- Step 2: Account Security with Role -->
                <div class="step-content" id="mobileStep2Content" style="display: none;">
                    <div class="custom-input-group">
                        <label for="mobilePassword">Password * (At least 8 characters)</label>
                        <div class="input-container">
                            <input type="password" class="custom-input" id="mobilePassword" name="password" 
                                placeholder="Password" required minlength="8">
                            <span class="input-icon">
                                <i class="fas fa-lock"></i>
                            </span>
                            <button type="button" class="toggle-password" data-target="mobilePassword">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="validation-message" id="mobilePasswordValidation"></div>
                        @error('password')
                            <div class="text-danger">{{ $message }}</div>
                        @enderror
                    </div>
                    
                    <div class="custom-input-group">
                        <label for="mobilePasswordConfirm">Confirm Password *</label>
                        <div class="input-container">
                            <input type="password" class="custom-input" id="mobilePasswordConfirm" 
                                name="password_confirmation" placeholder="Confirm Password" required>
                            <span class="input-icon">
                                <i class="fas fa-lock"></i>
                            </span>
                            <button type="button" class="toggle-password" data-target="mobilePasswordConfirm">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="validation-message" id="mobilePasswordConfirmValidation"></div>
                    </div>
                    
                    <!-- Role Selection Field -->
                    <div class="custom-input-group">
                        <label for="mobileRole">I am a *</label>
                        <div class="input-container">
                            <select class="custom-select" id="mobileRole" name="role" required>
                                <option value="">Select Role</option>
                                <option value="patient" {{ old('role') == 'patient' ? 'selected' : '' }}>Patient</option>
                                <option value="doctor" {{ old('role') == 'doctor' ? 'selected' : '' }}>Doctor</option>
                            </select>
                            <span class="input-icon">
                                <i class="fas fa-user-tag"></i>
                            </span>
                        </div>
                        <div class="validation-message" id="mobileRoleValidation"></div>
                        @error('role')
                            <div class="text-danger">{{ $message }}</div>
                        @enderror
                    </div>
                    
                    <div class="button-group">
                        <button type="button" class="btn btn-secondary" id="mobilePrevBtn">
                            <i class="fas fa-arrow-left"></i> Previous
                        </button>
                        <button type="submit" class="btn btn-primary" id="mobileSubmitBtn">
                            Sign Up <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </form>
            
            <div class="login-link">
                <p>Already have an account? <a href="{{ route('login') }}">Sign In</a></p>
            </div>
        </div>
        
        <!-- Desktop View -->
        <div class="signup-card">
            <div class="card-left">
                <div class="logo-container">
                    <a href="{{ url('/') }}">
                    <img src="{{ asset('front-assets/img/logo-new.png') }}" height="40" alt="logo" class="logo" style="filter: brightness(0) invert(1) !important;"> </a>
                    <h2 class="page-title" style="color: white;">Join SkoraCares</h2>
                </div>
                <p style="font-size: 0.9rem; opacity: 0.9;">Create an account to access personalized healthcare services and manage your wellness journey.</p>
                <ul class="features-list">
                    <li><i class="fas fa-heartbeat"></i> Personalized health tracking</li>
                    <li><i class="fas fa-calendar-check"></i> Appointment scheduling</li>
                    <li><i class="fas fa-user-md"></i> Access to healthcare professionals</li>
                    <li><i class="fas fa-shield-alt"></i> Secure & private data storage</li>
                </ul>
                <div class="login-link" style="margin-top: 30px;">
                    <p style="color: white; opacity: 0.9; font-size: 0.9rem;">Already have an account? <a href="{{ route('login') }}" style="color: var(--accent-color);">Sign In</a></p>
                </div>
            </div>
            <div class="card-right">
                <div class="step-indicator">
                    <div class="step active" id="desktopStep1">1</div>
                    <div class="step-line active"></div>
                    <div class="step" id="desktopStep2">2</div>
                </div>
                
                <div class="error-message" id="errorMessage">
                    <i class="fas fa-exclamation-circle"></i>
                    <span id="errorText">Please fill in all required fields correctly.</span>
                </div>
                
                <!-- Success message display -->
                @if(session('success'))
                    <div class="alert alert-success">
                        {{ session('success') }}
                    </div>
                @endif
                
                @if(session('error'))
                    <div class="alert alert-danger">
                        {{ session('error') }}
                    </div>
                @endif
                
                <form id="signupFormDesktop" method="POST" action="{{ route('register.submit') }}">
                    @csrf
                    <div class="step-content" id="desktopStep1Content">
                        <h4 class="mb-3 d-block d-sm-block" style="color: var(--primary-color);"></h4>
                        <div class="custom-input-group">
                            <label for="desktopName">Full Name *</label>
                            <div class="input-container">
                                <input type="text" class="custom-input" id="desktopName" name="name" 
                                    placeholder="Enter your full name" value="{{ old('name') }}" required>
                                <span class="input-icon">
                                    <i class="fas fa-user"></i>
                                </span>
                            </div>
                            <div class="validation-message" id="desktopNameValidation"></div>
                            @error('name')
                                <div class="text-danger">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="custom-input-group">
                            <label for="desktopEmail">Email Address *</label>
                            <div class="input-container">
                                <input type="email" class="custom-input" id="desktopEmail" name="email" 
                                    placeholder="Enter your email" value="{{ old('email') }}" required>
                                <span class="input-icon">
                                    <i class="fas fa-envelope"></i>
                                </span>
                            </div>
                            <div class="validation-message" id="desktopEmailValidation"></div>
                            @error('email')
                                <div class="text-danger">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="custom-input-group">
                            <label for="desktopPhone">Phone Number *</label>
                            <div class="input-container">
                                <input type="tel" class="custom-input" id="desktopPhone" name="phone" 
                                    placeholder="Enter your phone number" value="{{ old('phone') }}" maxlength="10" minlength="10" required>
                                <span class="input-icon">
                                    <i class="fas fa-phone"></i>
                                </span>
                            </div>
                            <div class="validation-message" id="desktopPhoneValidation"></div>
                            @error('phone')
                                <div class="text-danger">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="button-group">
                            <button type="button" class="btn btn-primary" id="desktopNextBtn">
                                Next Step <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="step-content" id="desktopStep2Content" style="display: none;">
                        <h4 class="mb-3 d-block d-sm-block" style="color: var(--primary-color); font-size: 1.2rem;">Account Security</h4>
                        
                        <div class="custom-input-group">
                            <label for="desktopPassword">Password *</label>
                            <div class="input-container">
                                <input type="password" class="custom-input" id="desktopPassword" name="password" 
                                    placeholder="Create a password (min. 8 characters)" required minlength="8">
                                <span class="input-icon">
                                    <i class="fas fa-lock"></i>
                                </span>
                                <button type="button" class="toggle-password" data-target="desktopPassword">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <div class="validation-message" id="desktopPasswordValidation"></div>
                            @error('password')
                                <div class="text-danger">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="custom-input-group">
                            <label for="desktopPasswordConfirm">Confirm Password *</label>
                            <div class="input-container">
                                <input type="password" class="custom-input" id="desktopPasswordConfirm" 
                                    name="password_confirmation" placeholder="Confirm your password" required>
                                <span class="input-icon">
                                    <i class="fas fa-lock"></i>
                                </span>
                                <button type="button" class="toggle-password" data-target="desktopPasswordConfirm">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <div class="validation-message" id="desktopPasswordConfirmValidation"></div>
                        </div>
                        
                        <!-- Role Selection Field -->
                        <div class="custom-input-group">
                            <label for="desktopRole">I am a *</label>
                            <div class="input-container">
                                <select class="custom-select" id="desktopRole" name="role" required>
                                    <option value="">Select Role</option>
                                    <option value="patient" {{ old('role') == 'patient' ? 'selected' : '' }}>Patient</option>
                                    <option value="doctor" {{ old('role') == 'doctor' ? 'selected' : '' }}>Doctor</option>
                                </select>
                                <span class="input-icon">
                                    <i class="fas fa-user-tag"></i>
                                </span>
                            </div>
                            <div class="validation-message" id="desktopRoleValidation"></div>
                            @error('role')
                                <div class="text-danger">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="button-group">
                            <button type="button" class="btn btn-secondary" id="desktopPrevBtn">
                                <i class="fas fa-arrow-left"></i> Previous
                            </button>
                            <button type="submit" class="btn btn-primary" id="desktopSubmitBtn">
                                Create Account <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        $(document).ready(function() {
            // Determine current view based on screen width
            const isMobileView = window.innerWidth < 993;
            
            // Initialize step indicators
            if (isMobileView) {
                updateStepIndicators(1, true);
            } else {
                updateStepIndicators(1, false);
            }
            
            // Header button actions
            $('#backBtn').click(function() {
                if (confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
                    window.history.back();
                }
            });
            
            $('#helpBtn').click(function() {
                alert('Need help? Contact our support team at support@skoracares.com');
            });
            
            $('#infoBtn').click(function() {
                alert('SkoraCares - Your personal healthcare companion. Sign up to access personalized health services.');
            });
            
            // Toggle password visibility
            $(document).on('click', '.toggle-password', function() {
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
            
            // Mobile View Navigation and Form Submission
            $('#mobileNextBtn').click(function() {
                if (validateStep(1, true)) {
                    showStep(2, true);
                    updateStepIndicators(2, true);
                }
            });
            
            $('#mobilePrevBtn').click(function() {
                showStep(1, true);
                updateStepIndicators(1, true);
            });
            
            // Mobile form submission
            $('#signupFormMobile').on('submit', function(e) {
                e.preventDefault();
                
                // Final validation
                if (validateStep(2, true) && validatePasswordMatch(true) && validateField($('#mobileRole'))) {
                    // Show loading
                    $('#loadingOverlay').css('display', 'flex');
                    
                    // Submit form
                    $(this).off('submit').submit();
                } else {
                    $('#mobileErrorMessage').show().find('#mobileErrorText').text('Please fill in all required fields correctly.');
                }
            });
            
            // Desktop View Navigation
            $('#desktopNextBtn').click(function() {
                if (validateStep(1, false)) {
                    showStep(2, false);
                    updateStepIndicators(2, false);
                }
            });
            
            $('#desktopPrevBtn').click(function() {
                showStep(1, false);
                updateStepIndicators(1, false);
            });
            
            // Desktop form submission
            $('#signupFormDesktop').on('submit', function(e) {
                // Final validation
                if (!validateStep(2, false) || !validatePasswordMatch(false) || !validateField($('#desktopRole'))) {
                    e.preventDefault();
                    $('#errorMessage').show().find('#errorText').text('Please fill in all required fields correctly.');
                } else {
                    // Show loading
                    $('#loadingOverlay').css('display', 'flex');
                }
            });
            
            // Input validation on blur
            $(document).on('blur', '.custom-input, .custom-select', function() {
                validateField($(this));
            });
            
            // Real-time password confirmation validation
            $('#mobilePasswordConfirm, #desktopPasswordConfirm').on('input', function() {
                const isMobile = $(this).attr('id').includes('mobile');
                validatePasswordMatch(isMobile);
            });
            
            // Role field validation on change
            $('#mobileRole, #desktopRole').on('change', function() {
                validateField($(this));
            });
            
            // Handle window resize
            $(window).resize(function() {
                // Optional: Add resize handling if needed
            });
        });
        
        // Function to show a specific step
        function showStep(stepNumber, isMobile) {
            if (isMobile) {
                if (stepNumber === 1) {
                    $('#mobileStep1Content').show();
                    $('#mobileStep2Content').hide();
                } else {
                    $('#mobileStep1Content').hide();
                    $('#mobileStep2Content').show();
                }
            } else {
                if (stepNumber === 1) {
                    $('#desktopStep1Content').show();
                    $('#desktopStep2Content').hide();
                } else {
                    $('#desktopStep1Content').hide();
                    $('#desktopStep2Content').show();
                }
            }
        }
        
        // Function to update step indicators
        function updateStepIndicators(currentStep, isMobile) {
            if (isMobile) {
                // Mobile step indicators
                if (currentStep === 1) {
                    $('#mobileStep1').addClass('active');
                    $('#mobileStep1').removeClass('completed');
                    $('#mobileStep2').removeClass('active');
                    $('#mobileStep2').removeClass('completed');
                    
                    // Update labels
                    $('.step-label').eq(0).addClass('active');
                    $('.step-label').eq(1).removeClass('active');
                    
                    // Update step line
                    $('.step-line').removeClass('active');
                } else {
                    $('#mobileStep1').removeClass('active');
                    $('#mobileStep1').addClass('completed');
                    $('#mobileStep2').addClass('active');
                    $('#mobileStep2').removeClass('completed');
                    
                    // Update labels
                    $('.step-label').eq(0).removeClass('active');
                    $('.step-label').eq(1).addClass('active');
                    
                    // Update step line
                    $('.step-line').addClass('active');
                }
            } else {
                // Desktop step indicators
                if (currentStep === 1) {
                    $('#desktopStep1').addClass('active');
                    $('#desktopStep2').removeClass('active');
                    
                    // Update step line
                    $('.step-line').addClass('active');
                } else {
                    $('#desktopStep1').removeClass('active');
                    $('#desktopStep2').addClass('active');
                    
                    // Update step line
                    $('.step-line').addClass('active');
                }
            }
        }
        
        // Function to validate a specific step
        function validateStep(stepNumber, isMobile) {
            let isValid = true;
            
            if (stepNumber === 1) {
                if (isMobile) {
                    isValid = validateField($('#mobileName')) && isValid;
                    isValid = validateField($('#mobileEmail')) && isValid;
                    isValid = validateField($('#mobilePhone')) && isValid;
                    
                    if (!isValid) {
                        $('#mobileErrorMessage').show().find('#mobileErrorText').text('Please fill in all required fields correctly.');
                    } else {
                        $('#mobileErrorMessage').hide();
                    }
                } else {
                    isValid = validateField($('#desktopName')) && isValid;
                    isValid = validateField($('#desktopEmail')) && isValid;
                    isValid = validateField($('#desktopPhone')) && isValid;
                    
                    if (!isValid) {
                        $('#errorMessage').show().find('#errorText').text('Please fill in all required fields correctly.');
                    } else {
                        $('#errorMessage').hide();
                    }
                }
            } else if (stepNumber === 2) {
                if (isMobile) {
                    isValid = validateField($('#mobilePassword')) && isValid;
                    isValid = validateField($('#mobilePasswordConfirm')) && isValid;
                    isValid = validateField($('#mobileRole')) && isValid;
                    
                    if (!isValid) {
                        $('#mobileErrorMessage').show().find('#mobileErrorText').text('Please fill in all required fields correctly.');
                    } else {
                        $('#mobileErrorMessage').hide();
                    }
                } else {
                    isValid = validateField($('#desktopPassword')) && isValid;
                    isValid = validateField($('#desktopPasswordConfirm')) && isValid;
                    isValid = validateField($('#desktopRole')) && isValid;
                    
                    if (!isValid) {
                        $('#errorMessage').show().find('#errorText').text('Please fill in all required fields correctly.');
                    } else {
                        $('#errorMessage').hide();
                    }
                }
            }
            
            return isValid;
        }
        
        // Function to validate an individual field
        function validateField(field) {
            const fieldId = field.attr('id');
            const fieldValue = field.val().trim();
            let isValid = true;
            let message = '';
            
            // Reset validation classes
            field.removeClass('valid error');
            
            // Name validation
            if (fieldId.includes('Name')) {
                if (fieldValue === '') {
                    isValid = false;
                    message = 'Name is required';
                } else if (fieldValue.length < 2) {
                    isValid = false;
                    message = 'Name must be at least 2 characters';
                } else {
                    isValid = true;
                    message = 'Name looks good!';
                }
            }
            
            // Email validation
            else if (fieldId.includes('Email')) {
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
            
            // Phone validation
            else if (fieldId.includes('Phone')) {
                const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
                if (fieldValue === '') {
                    isValid = false;
                    message = 'Phone number is required';
                } else if (!phoneRegex.test(fieldValue.replace(/\D/g, ''))) {
                    isValid = false;
                    message = 'Please enter a valid phone number (10 digits)';
                } else {
                    isValid = true;
                    message = 'Phone number looks good!';
                }
            }
            
            // Password validation
            else if (fieldId.includes('Password') && !fieldId.includes('Confirm')) {
                if (fieldValue === '') {
                    isValid = false;
                    message = 'Password is required';
                } else if (fieldValue.length < 8) {
                    isValid = false;
                    message = 'Password must be at least 8 characters';
                } else {
                    isValid = true;
                    message = 'Password looks good!';
                }
            }
            
            // Password confirmation validation
            else if (fieldId.includes('PasswordConfirm')) {
                const passwordFieldId = fieldId.replace('Confirm', '');
                const passwordValue = $('#' + passwordFieldId).val().trim();
                
                if (fieldValue === '') {
                    isValid = false;
                    message = 'Please confirm your password';
                } else if (fieldValue !== passwordValue) {
                    isValid = false;
                    message = 'Passwords do not match';
                } else {
                    isValid = true;
                    message = 'Passwords match!';
                }
            }
            
            // Role validation
            else if (fieldId.includes('Role')) {
                if (fieldValue === '') {
                    isValid = false;
                    message = 'Please select a role';
                } else if (!['patient', 'doctor'].includes(fieldValue)) {
                    isValid = false;
                    message = 'Please select a valid role';
                } else {
                    isValid = true;
                    message = 'Role selected!';
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
        
        // Function to validate password match
        function validatePasswordMatch(isMobile) {
            let passwordId, confirmId;
            
            if (isMobile) {
                passwordId = '#mobilePassword';
                confirmId = '#mobilePasswordConfirm';
            } else {
                passwordId = '#desktopPassword';
                confirmId = '#desktopPasswordConfirm';
            }
            
            const password = $(passwordId).val().trim();
            const confirmPassword = $(confirmId).val().trim();
            
            if (confirmPassword === '' || password === '') {
                return false;
            }
            
            if (password !== confirmPassword) {
                $(confirmId).addClass('error');
                $('#' + $(confirmId).attr('id') + 'Validation')
                    .text('Passwords do not match')
                    .addClass('error');
                return false;
            } else {
                $(confirmId).removeClass('error');
                $(confirmId).addClass('valid');
                $('#' + $(confirmId).attr('id') + 'Validation')
                    .text('Passwords match!')
                    .addClass('success');
                return true;
            }
        }
    </script>
</body>
</html>