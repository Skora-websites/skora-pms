@php
    $whatsappNumber = '';
    if ($settings) {
        $whatsappNumber = $settings->company_whatsapp1 ?? $settings->company_mobile1 ?? '';
    }
    // Clean phone number (keep digits only)
    $cleanWhatsapp = preg_replace('/[^0-9]/', '', $whatsappNumber);
    // If no country code, add country code e.g. 91
    if (strlen($cleanWhatsapp) == 10) {
        $cleanWhatsapp = '91' . $cleanWhatsapp;
    }
    
    $supportEmail = $settings ? ($settings->company_email1 ?? 'Support@skoracares.in') : 'Support@skoracares.in';
    $supportPhone = $settings ? ($settings->company_mobile1 ?? '+91 9876543210') : '+91 9876543210';
    
    $message = "Hi, my trial plan on SkoraCares has expired.\nDoctor: " . ($doctor->name ?? '') . "\nEmail: " . ($doctor->email ?? '') . "\nI want to extend/renew my plan.";
    $whatsappUrl = "https://wa.me/" . $cleanWhatsapp . "?text=" . urlencode($message);
    $callUrl = "tel:" . preg_replace('/[^0-9+]/', '', $supportPhone);
    $emailUrl = "mailto:" . $supportEmail . "?subject=" . urlencode("Subscription Renewal Request - " . ($doctor->name ?? '')) . "&body=" . urlencode($message);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Expired || SkoraCares</title>
    <link rel="icon" type="image/png" href="{{ asset('front-assets/img/favicon.png') }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #0e606e;
            --primary-dark: #093e47;
            --secondary: #b493f2;
            --accent: #f8d756;
            --accent-dark: #e0be30;
            --text-dark: #1e293b;
            --text-muted: #64748b;
            --white: #ffffff;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #0c111d;
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(14, 96, 110, 0.25) 0%, transparent 45%),
                radial-gradient(circle at 90% 80%, rgba(180, 147, 242, 0.2) 0%, transparent 45%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
        }

        /* Glassmorphic Card Container */
        .expired-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            max-width: 980px;
            width: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: row;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }

        /* Left Side Panel - Gradient */
        .panel-left {
            flex: 1;
            background: linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%);
            padding: 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: var(--white);
            position: relative;
            overflow: hidden;
        }

        /* Ambient glows inside panel-left */
        .panel-left::after {
            content: '';
            position: absolute;
            width: 150px;
            height: 150px;
            background: var(--accent);
            opacity: 0.12;
            filter: blur(50px);
            top: -20px;
            right: -20px;
            border-radius: 50%;
        }

        .expired-title {
            font-family: 'Outfit', sans-serif;
            font-size: 2.1rem;
            font-weight: 800;
            line-height: 1.25;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
        }

        .expired-desc {
            font-size: 0.95rem;
            line-height: 1.5;
            opacity: 0.9;
            margin-bottom: 25px;
        }

        /* Yellow Offer Box */
        .offer-box {
            background: var(--accent);
            border-radius: 14px;
            padding: 18px;
            color: #1e293b;
            position: relative;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            margin-top: auto;
            border: 1px dashed rgba(30, 41, 59, 0.2);
        }

        .offer-box::before, .offer-box::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            background-color: #7234ec; /* matches the parent gradient point */
            border-radius: 50%;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .offer-box::before {
            left: -8px;
        }
        
        .offer-box::after {
            right: -8px;
            background-color: #215970; /* matches the teal gradient point */
        }

        .offer-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .offer-text {
            font-size: 0.85rem;
            line-height: 1.4;
            margin-bottom: 12px;
            opacity: 0.9;
        }

        .offer-btn {
            background-color: #1e293b;
            color: var(--white);
            border: none;
            border-radius: 8px;
            padding: 10px 20px;
            font-weight: 600;
            font-size: 0.9rem;
            width: 100%;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }

        .offer-btn:hover {
            background-color: #0f172a;
            color: var(--white);
            transform: translateY(-1px);
        }

        /* Right Side Panel - Info list and Actions */
        .panel-right {
            flex: 1.1;
            background-color: var(--white);
            padding: 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .features-title {
            font-family: 'Outfit', sans-serif;
            color: var(--text-dark);
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .features-subtitle {
            color: var(--text-muted);
            font-size: 0.95rem;
            margin-bottom: 20px;
        }

        /* Feature items checklist */
        .feature-list {
            list-style: none;
            padding: 0;
            margin-bottom: 25px;
        }

        .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 14px;
        }

        .feature-icon-wrapper {
            background-color: rgba(14, 96, 110, 0.08);
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .feature-icon-wrapper i {
            color: var(--primary);
            font-size: 0.75rem;
        }

        .feature-text {
            color: #334155;
            font-size: 0.92rem;
            font-weight: 500;
            line-height: 1.4;
        }

        /* Buttons section */
        .actions-wrapper {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }

        .btn-action-outline {
            flex: 1;
            border: 2px solid var(--primary);
            color: var(--primary);
            background: transparent;
            border-radius: 10px;
            padding: 10px 16px;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .btn-action-outline:hover {
            background-color: rgba(14, 96, 110, 0.05);
            transform: translateY(-1px);
        }

        .btn-action-solid {
            flex: 1;
            background-color: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 10px;
            padding: 10px 16px;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .btn-action-solid:hover {
            background-color: var(--primary-dark);
            color: var(--white);
            transform: translateY(-1px);
            box-shadow: 0 5px 12px rgba(14, 96, 110, 0.2);
        }

        /* Contact Details Footer inside Panel Right */
        .footer-support {
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .support-info {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #475569;
            font-size: 0.88rem;
            font-weight: 500;
        }

        .support-info i {
            color: var(--primary);
            font-size: 1rem;
        }

        .support-info a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
        }

        .support-info a:hover {
            text-decoration: underline;
        }

        .footer-bottom-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 5px;
        }

        .logout-link {
            color: #ef4444;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.88rem;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s ease;
        }

        .logout-link:hover {
            color: #b91c1c;
            transform: translateX(1px);
        }

        /* Responsiveness */
        @media (max-width: 991px) {
            .expired-card {
                flex-direction: column;
                max-width: 500px;
                margin: 20px 0;
            }

            .panel-left, .panel-right {
                padding: 25px 20px;
            }

            .expired-title {
                font-size: 1.8rem;
            }

            .offer-box {
                margin-top: 20px;
            }
        }

        @media (max-width: 480px) {
            .actions-wrapper {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>

    <div class="expired-card">
        <!-- Left Column -->
        <div class="panel-left">
            <div>
                <h1 class="expired-title">Your trial plan has Expired!</h1>
                <p class="expired-desc">Your trial period has expired. Upgrade your plan now to continue accessing the SkoraCares doctor dashboard and smart clinic management tools seamlessly.</p>
            </div>
            
            <div class="offer-box">
                <h3 class="offer-title">🎁 Wait! Just for You...</h3>
                <p class="offer-text">Need more time to evaluate? Request a temporary trial extension directly from our support team on WhatsApp.</p>
                <a href="{{ $whatsappUrl }}" target="_blank" class="offer-btn">
                    <i class="fab fa-whatsapp me-1"></i> Extend Your Trial Plan
                </a>
            </div>
        </div>

        <!-- Right Column -->
        <div class="panel-right">
            <div>
                <h2 class="features-title">Don't Lose Your Digital Advantage!</h2>
                <p class="features-subtitle">Upgrade your plan to continue using premium features:</p>
                
                <ul class="feature-list">
                    <li class="feature-item">
                        <div class="feature-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="feature-text">Seamless clinic management and staff portal access all in one place.</span>
                    </li>
                    <li class="feature-item">
                        <div class="feature-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="feature-text">Secure, cloud-based, instant access to patient medical records.</span>
                    </li>
                    <li class="feature-item">
                        <div class="feature-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="feature-text">Effortless e-prescriptions with less paperwork and zero errors.</span>
                    </li>
                    <li class="feature-item">
                        <div class="feature-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="feature-text">Generate AI-powered smart prescriptions in seconds.</span>
                    </li>
                </ul>
            </div>

            <div>
                <div class="actions-wrapper">
                    <a href="{{ $callUrl }}" class="btn-action-outline">
                        <i class="fas fa-phone-alt"></i> Request a call back
                    </a>
                    <a href="{{ $whatsappUrl }}" target="_blank" class="btn-action-solid">
                        <i class="fab fa-whatsapp"></i> Get Unlimited Access
                    </a>
                </div>

                <div class="footer-support">
                    <div class="row align-items-center">
                        <div class="col-sm-7 support-info mb-2 mb-sm-0">
                            <i class="fas fa-envelope"></i>
                            Email: <a href="{{ $emailUrl }}">{{ $supportEmail }}</a>
                        </div>
                        <div class="col-sm-5 support-info mb-2 mb-sm-0">
                            <i class="fas fa-phone-alt"></i>
                            Call: <a href="{{ $callUrl }}">{{ $supportPhone }}</a>
                        </div>
                    </div>
                    
                    <div class="footer-bottom-row">
                        <span></span>
                        <a href="{{ route('doctor.logout') }}" class="logout-link">
                            Sign Out from Account <i class="fas fa-sign-out-alt"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
