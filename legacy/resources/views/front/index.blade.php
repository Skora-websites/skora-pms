@extends('layouts.frontend')
@push('styles')
    <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet">
    <style>
        :root {
            --primary: #0a6e8a;
            --primary-dark: #074f65;
            --primary-light: #c8f1fb;
            --accent: #00c9a7;
            --accent-dark: #009e83;
            --surface: #f8fdff;
            --text: #0d1f2d;
            --text-muted: #5a7384;
            --white: #ffffff;
            --border: #d0e8ef;
            --gradient: linear-gradient(135deg, #0a6e8a 0%, #00c9a7 100%);
            --shadow: 0 8px 40px rgba(10, 110, 138, 0.12);
            --shadow-lg: 0 20px 60px rgba(10, 110, 138, 0.18);
            --radius: 16px;
            --radius-sm: 10px;
        }

        /* ─── HERO ─── */
        .hero {
            min-height: 100vh;
            padding: 72px 5% 0;
            display: flex;
            align-items: center;
            position: relative;
            overflow: hidden;
            background: linear-gradient(160deg, #f0fbff 0%, #e8f9f5 50%, #f0fbff 100%);
        }

        .hero-bg-shape {
            position: absolute;
            border-radius: 50%;
            opacity: 0.06;
            background: var(--primary);
            pointer-events: none;
        }

        .hero-bg-shape-1 {
            width: 600px;
            height: 600px;
            top: -200px;
            right: -100px;
        }

        .hero-bg-shape-2 {
            width: 400px;
            height: 400px;
            bottom: -100px;
            left: -100px;
            background: var(--accent);
        }

        .hero-content {
            flex: 1;
            max-width: 580px;
            padding: 80px 0;
            position: relative;
            z-index: 1;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 50px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 28px;
            box-shadow: 0 2px 12px rgba(10, 110, 138, 0.08);
        }

        .hero-badge-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent);
            animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {

            0%,
            100% {
                opacity: 1;
                transform: scale(1)
            }

            50% {
                opacity: 0.6;
                transform: scale(1.3)
            }
        }

        .hero h1 {
            font-family: 'Sora', sans-serif;
            font-size: clamp(38px, 5vw, 58px);
            font-weight: 800;
            line-height: 1.12;
            color: var(--text);
            margin-bottom: 22px;
        }

        .hero h1 span {
            color: var(--primary);
        }

        .hero p {
            font-family: 'DM Sans', sans-serif;
            font-size: 18px;
            color: var(--text-muted);
            line-height: 1.7;
            margin-bottom: 40px;
            max-width: 480px;
        }

        .hero-actions {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 52px;
        }

        .hero-stats {
            display: flex;
            gap: 40px;
        }

        .hero-stat-num {
            font-family: 'Sora', sans-serif;
            font-size: 28px;
            font-weight: 800;
            color: var(--text);
        }

        .hero-stat-label {
            font-size: 13px;
            color: var(--text-muted);
            font-weight: 500;
            margin-top: 2px;
        }

        .hero-visual {
            flex: 1;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            position: relative;
            z-index: 1;
            padding: 80px 0 40px;
        }

        .hero-card-main {
            background: var(--white);
            border-radius: 24px;
            box-shadow: var(--shadow-lg);
            padding: 28px;
            width: 360px;
            position: relative;
            z-index: 2;
            border: 1px solid rgba(10, 110, 138, 0.07);
            animation: float-main 4s ease-in-out infinite;
        }

        @keyframes float-main {

            0%,
            100% {
                transform: translateY(0)
            }

            50% {
                transform: translateY(-10px)
            }
        }

        .hero-card-mini {
            background: var(--white);
            border-radius: 16px;
            box-shadow: var(--shadow);
            padding: 16px 20px;
            position: absolute;
            border: 1px solid rgba(10, 110, 138, 0.07);
            z-index: 3;
        }

        .hero-card-mini-1 {
            top: 60px;
            right: 320px;
            animation: float-mini-1 3.5s ease-in-out infinite;
        }

        .hero-card-mini-2 {
            bottom: 80px;
            right: 300px;
            animation: float-mini-2 4.5s ease-in-out infinite;
        }

        @keyframes float-mini-1 {

            0%,
            100% {
                transform: translateY(0)
            }

            50% {
                transform: translateY(-8px)
            }
        }

        @keyframes float-mini-2 {

            0%,
            100% {
                transform: translateY(0)
            }

            50% {
                transform: translateY(8px)
            }
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        .card-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Sora', sans-serif;
            font-weight: 700;
            font-size: 16px;
            flex-shrink: 0;
        }

        .card-header-info h4 {
            font-family: 'Sora', sans-serif;
            font-size: 15px;
            font-weight: 600;
            color: var(--text);
        }

        .card-header-info p {
            font-size: 12px;
            color: var(--text-muted);
        }

        .card-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .card-metric {
            background: var(--surface);
            border-radius: var(--radius-sm);
            padding: 12px;
        }

        .card-metric-val {
            font-family: 'Sora', sans-serif;
            font-weight: 700;
            font-size: 20px;
            color: var(--text);
        }

        .card-metric-label {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .card-progress {
            margin-top: 16px;
        }

        .card-progress-label {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 6px;
        }

        .card-progress-bar {
            height: 6px;
            background: #e0f4f9;
            border-radius: 10px;
            overflow: hidden;
        }

        .card-progress-fill {
            height: 100%;
            background: var(--gradient);
            border-radius: 10px;
        }

        .mini-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            margin-bottom: 8px;
        }

        .mini-val {
            font-family: 'Sora', sans-serif;
            font-weight: 700;
            font-size: 18px;
            color: var(--text);
        }

        .mini-label {
            font-size: 11px;
            color: var(--text-muted);
        }

        /* Buttons */
        .btn-ghost {
            padding: 10px 22px;
            border: 1.5px solid var(--border);
            border-radius: 50px;
            background: transparent;
            color: var(--text);
            font-family: 'DM Sans', sans-serif;
            font-weight: 500;
            font-size: 15px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
            display: inline-block;
        }

        .btn-ghost:hover {
            border-color: var(--primary);
            color: var(--primary);
        }

        .btn-primary-redesign {
            padding: 10px 24px;
            border-radius: 50px;
            border: none;
            background: var(--gradient);
            color: white;
            font-family: 'DM Sans', sans-serif;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s;
            box-shadow: 0 4px 16px rgba(10, 110, 138, 0.3);
        }

        .btn-primary-redesign:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(10, 110, 138, 0.35);
            color: white;
        }

        .btn-large {
            padding: 16px 36px;
            font-size: 16px;
            border-radius: 50px;
        }

        .btn-outline-white-redesign {
            padding: 16px 36px;
            font-size: 16px;
            border-radius: 50px;
            border: 2px solid rgba(255, 255, 255, 0.7);
            background: transparent;
            color: white;
            font-family: 'DM Sans', sans-serif;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s;
        }

        .btn-outline-white-redesign:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: white;
            color: white;
        }

        /* ─── TRUST BAR ─── */
        .trust-bar {
            background: var(--text);
            padding: 28px 5%;
        }

        .trust-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 60px;
            flex-wrap: wrap;
        }

        .trust-item {
            display: flex;
            align-items: center;
            gap: 10px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            font-weight: 500;
        }

        .trust-icon {
            font-size: 20px;
        }

        /* ─── SECTIONS ─── */
        section.redesign {
            padding: 100px 5%;
        }

        .section-label {
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--accent-dark);
            margin-bottom: 12px;
        }

        .section-title {
            font-family: 'Sora', sans-serif;
            font-size: clamp(28px, 3.5vw, 42px);
            font-weight: 800;
            color: var(--text);
            line-height: 1.2;
            margin-bottom: 16px;
        }

        .section-subtitle {
            font-family: 'DM Sans', sans-serif;
            font-size: 18px;
            color: var(--text-muted);
            max-width: 560px;
            line-height: 1.7;
        }

        .section-header-center {
            text-align: center;
            margin: 0 auto 60px;
            max-width: 600px;
        }

        .section-header-center .section-subtitle {
            margin: 0 auto;
        }

        /* ─── FEATURES ─── */
        .features {
            background: var(--white);
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
        }

        .feature-card {
            padding: 32px;
            border-radius: var(--radius);
            border: 1.5px solid var(--border);
            background: var(--white);
            transition: all 0.3s;
            cursor: default;
        }

        .feature-card:hover {
            border-color: var(--primary);
            box-shadow: var(--shadow);
            transform: translateY(-4px);
        }

        .feature-icon {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: var(--primary-light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            margin-bottom: 20px;
            transition: all 0.3s;
        }

        .feature-card:hover .feature-icon {
            background: var(--gradient);
            color: white;
        }

        .feature-card h3 {
            font-family: 'Sora', sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 10px;
        }

        .feature-card p {
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            color: var(--text-muted);
            line-height: 1.65;
        }

        /* ─── STATS ─── */
        .stats-section {
            background: var(--gradient);
            padding: 80px 5%;
            position: relative;
            overflow: hidden;
        }

        .stats-section::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 500px;
            height: 500px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.06);
            pointer-events: none;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 40px;
            text-align: center;
        }

        .stat-num {
            font-family: 'Sora', sans-serif;
            font-size: 48px;
            font-weight: 800;
            color: white;
            line-height: 1;
            margin-bottom: 8px;
        }

        .stat-desc {
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            color: rgba(255, 255, 255, 0.75);
            font-weight: 500;
        }

        /* ─── HOW IT WORKS ─── */
        .how-section {
            background: var(--surface);
        }

        .steps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-top: 60px;
            position: relative;
        }

        .steps-grid::before {
            content: '';
            position: absolute;
            top: 28px;
            left: calc(12.5% + 14px);
            right: calc(12.5% + 14px);
            height: 2px;
            background: linear-gradient(90deg, var(--accent), var(--primary));
            z-index: 0;
        }

        .step-item {
            text-align: center;
            position: relative;
            z-index: 1;
        }

        .step-num {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--white);
            border: 2px solid var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Sora', sans-serif;
            font-weight: 800;
            font-size: 20px;
            color: var(--primary);
            margin: 0 auto 20px;
            box-shadow: 0 4px 16px rgba(10, 110, 138, 0.12);
        }

        .step-item h4 {
            font-family: 'Sora', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 8px;
        }

        .step-item p {
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.6;
        }

        /* ─── PRODUCTS ─── */
        .products-section {
            background: var(--white);
        }

        .products-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            align-items: center;
            margin-bottom: 60px;
        }

        .products-layout.reverse {
            direction: rtl;
        }

        .products-layout.reverse>* {
            direction: ltr;
        }

        .product-img-wrap {
            background: linear-gradient(145deg, #e8f9f4, #e0f4f9);
            border-radius: 24px;
            /* padding: 10px; */
            display: flex;
            align-items: center;
            /* border-radius: 10px; */
            justify-content: center;
            /* min-height: 340px; */
            position: relative;
            overflow: hidden;
        }

        .product-visual {
            width: 100%;
            max-width: 280px;
        }

        .product-visual-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 8px 30px rgba(10, 110, 138, 0.12);
            margin-bottom: 12px;
            text-align: left;
        }

        .product-visual-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
        }

        .product-visual-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--accent);
            flex-shrink: 0;
        }

        .product-visual-line {
            height: 8px;
            border-radius: 4px;
            background: var(--primary-light);
            flex: 1;
        }

        .product-visual-line.short {
            flex: 0.5;
        }

        .product-info h3 {
            font-family: 'Sora', sans-serif;
            font-size: 28px;
            font-weight: 800;
            color: var(--text);
            margin-bottom: 14px;
        }

        .product-info p {
            font-family: 'DM Sans', sans-serif;
            font-size: 16px;
            color: var(--text-muted);
            line-height: 1.7;
            margin-bottom: 24px;
        }

        .product-features {
            list-style: none;
            margin-bottom: 30px;
            padding: 0;
        }

        .product-features li {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 15px;
            color: var(--text-muted);
            padding: 6px 0;
        }

        .check-icon {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            flex-shrink: 0;
        }

        .product-divider {
            border: none;
            border-top: 1px solid var(--border);
            margin: 70px 0;
        }

        /* ─── TESTIMONIALS ─── */
        .testimonials-section {
            background: var(--surface);
        }

        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
        }

        .testimonial-card {
            background: var(--white);
            border-radius: var(--radius);
            padding: 30px;
            border: 1.5px solid var(--border);
            transition: all 0.3s;
        }

        .testimonial-card:hover {
            box-shadow: var(--shadow);
            border-color: var(--primary);
            transform: translateY(-3px);
        }

        .testimonial-stars {
            display: flex;
            gap: 3px;
            margin-bottom: 16px;
        }

        .star {
            color: #f59e0b;
            font-size: 16px;
        }

        .testimonial-text {
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            color: var(--text-muted);
            line-height: 1.7;
            margin-bottom: 24px;
            font-style: italic;
        }

        .testimonial-author {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .t-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Sora', sans-serif;
            font-weight: 700;
            font-size: 15px;
            flex-shrink: 0;
        }

        .t-name {
            font-family: 'Sora', sans-serif;
            font-weight: 600;
            font-size: 15px;
            color: var(--text);
        }

        .t-role {
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            color: var(--text-muted);
        }

        /* ─── PRICING ─── */
        .pricing-section {
            background: var(--white);
        }

        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
            margin-top: 60px;
        }

        .pricing-card {
            border-radius: var(--radius);
            padding: 36px;
            border: 1.5px solid var(--border);
            position: relative;
            transition: all 0.3s;
        }

        .pricing-card:hover {
            box-shadow: var(--shadow);
            transform: translateY(-4px);
        }

        .pricing-card.featured {
            border: 2px solid var(--primary);
            background: linear-gradient(145deg, #f0fbff, #e8fdf7);
            transform: scale(1.02);
        }

        .pricing-card.featured:hover {
            transform: scale(1.02) translateY(-4px);
        }

        .popular-badge {
            position: absolute;
            top: -14px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--gradient);
            color: white;
            padding: 6px 20px;
            border-radius: 50px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            letter-spacing: 0.5px;
        }

        .pricing-name {
            font-family: 'Sora', sans-serif;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--primary);
            margin-bottom: 8px;
        }

        .pricing-price {
            font-family: 'Sora', sans-serif;
            font-size: 48px;
            font-weight: 800;
            color: var(--text);
            line-height: 1;
        }

        .pricing-price span {
            font-size: 18px;
            font-weight: 500;
            color: var(--text-muted);
        }

        .pricing-period {
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 24px;
            margin-top: 4px;
        }

        .pricing-features {
            list-style: none;
            margin-bottom: 32px;
            padding: 0;
        }

        .pricing-features li {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: var(--text-muted);
            padding: 7px 0;
            border-bottom: 1px solid rgba(208, 232, 239, 0.5);
        }

        .pricing-features li:last-child {
            border-bottom: none;
        }

        /* ─── FAQ ─── */
        .faq-section {
            background: var(--surface);
        }

        .faq-layout {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 80px;
            align-items: start;
        }

        .faq-item {
            border-bottom: 1px solid var(--border);
        }

        .faq-question {
            width: 100%;
            padding: 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: none;
            border: none;
            cursor: pointer;
            font-family: 'Sora', sans-serif;
            font-size: 16px;
            font-weight: 600;
            color: var(--text);
            text-align: left;
            gap: 16px;
        }

        .faq-icon {
            font-size: 20px;
            color: var(--primary);
            flex-shrink: 0;
            transition: transform 0.3s;
            font-style: normal;
        }

        .faq-item.open .faq-icon {
            transform: rotate(45deg);
        }

        .faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.35s ease, padding 0.3s;
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            color: var(--text-muted);
            line-height: 1.7;
        }

        .faq-item.open .faq-answer {
            max-height: 200px;
            padding-bottom: 18px;
        }

        /* ─── CTA BANNER ─── */
        .cta-section {
            background: var(--gradient);
            padding: 80px 5%;
            text-align: center;
            position: relative;
            overflow: hidden;
            border-radius: 24px;
            margin: 0 5% 100px;
        }

        .cta-section h2 {
            font-family: 'Sora', sans-serif;
            font-size: clamp(28px, 3vw, 42px);
            font-weight: 800;
            color: white;
            margin-bottom: 16px;
            position: relative;
        }

        .cta-section p {
            font-family: 'DM Sans', sans-serif;
            font-size: 18px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 40px;
            position: relative;
            max-width: 520px;
            margin-left: auto;
            margin-right: auto;
        }

        .cta-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
            position: relative;
        }

        /* Utilities */
        .badge-redesign {
            display: inline-block;
            padding: 5px 14px;
            border-radius: 50px;
            font-size: 12px;
            font-weight: 600;
            background: var(--primary-light);
            color: var(--primary);
            margin-bottom: 12px;
        }

        .mt-60 {
            margin-top: 60px;
        }

        /* ─── MOBILE ─── */
        @media (max-width: 900px) {
            .hero {
                flex-direction: column;
                padding-top: 80px;
            }

            .hero-visual {
                display: none;
            }

            .hero-content {
                max-width: 100%;
                text-align: center;
            }

            .hero-actions {
                justify-content: center;
            }

            .hero-stats {
                justify-content: center;
            }

            .features-grid,
            .testimonials-grid,
            .pricing-grid {
                grid-template-columns: 1fr;
            }

            .stats-grid {
                grid-template-columns: 1fr 1fr;
            }

            .steps-grid {
                grid-template-columns: 1fr 1fr;
            }

            .steps-grid::before {
                display: none;
            }

            .products-layout,
            .products-layout.reverse {
                grid-template-columns: 1fr;
                direction: ltr;
            }

            .faq-layout {
                grid-template-columns: 1fr;
            }

            section.redesign {
                padding: 30px 4%;
            }

            .pricing-card.featured {
                transform: none;
            }
        }


        /* modal pop-up form  */
        /* Gradient Button */
        .demo-btn {
            background: linear-gradient(135deg, #0a6e8a 0%, #00c9a7 100%);
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
        }

        /* Modal Header Gradient */
        .custom-modal {
            border-radius: 12px;
            overflow: hidden;
        }

        .custom-modal .modal-header {
            background: linear-gradient(135deg, #0a6e8a 0%, #00c9a7 100%);
        }

        /* Submit Button */
        .submit-btn {
            background: linear-gradient(135deg, #0a6e8a 0%, #00c9a7 100%);
            color: #fff;
            border: none;
            padding: 10px 25px;
            border-radius: 6px;
        }

        /* Inputs */
        .form-control {
            border-radius: 8px;
        }
    </style>

    <style>
        /* =========================
                                           DESKTOP / DEFAULT STYLES
                                        ========================= */

        .tabs {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .tab-button {
            padding: 12px 24px;
            background-color: #f0f0f0;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .tab-button.active {
            background-color: #0e606e;
            color: #fff;
        }

        .tab-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }


        /* =========================
                                           MOBILE & TABLET (≤ 767px)
                                        ========================= */

        @media (max-width: 767px) {

            /* Banner */
            .ul-banner-3 {
                padding: 20px 0 !important;
            }

            .ul-banner-3-container {
                padding: 0 15px !important;
            }

            .ul-banner-3-title {
                font-size: 1.4rem !important;
                font-weight: 800;
                margin-bottom: 40px !important;
            }

            .ul-banner-3-descr {
                font-size: 0.85rem !important;
                margin-bottom: 30px !important;
                color: #666;
            }

            .ul-banner-3-btn {
                display: inline-block;
                padding: 10px 30px;
                font-size: 0.9rem;
                background-color: #0e606e;
                color: #fff;
                border-radius: 5px;
                text-decoration: none;
                transition: all 0.3s;
            }

            .ul-banner-3-btn:hover {
                background-color: #0056b3;
                transform: translateY(-2px);
            }

            /* Carousel */
            .carousel-control-prev,
            .carousel-control-next {
                width: 40px !important;
                height: 40px !important;
            }

            .carousel-control-prev-icon,
            .carousel-control-next-icon,
            .carousel-item,
            .sm-image {
                display: none;
            }

            .carousel-item {
                top: 69px;
            }

            /* Tabs scroll */
            .tabs-scroll-container {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding: 0 5px;
            }

            .tabs-scroll-container::-webkit-scrollbar {
                display: none;
            }

            .tabs {
                flex-wrap: nowrap;
                gap: 10px;
                padding: 5px 0;
                min-width: fit-content;
            }

            .tabs-scroll-container::after {
                content: '';
                position: absolute;
                right: 0;
                top: 0;
                bottom: 0;
                width: 30px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9));
                pointer-events: none;
            }
        }


        /* =========================
                                           SMALL MOBILE (≤ 576px)
                                        ========================= */

        @media (max-width: 576px) {

            .ul-banner-3-title {
                font-size: 1.7rem !important;
            }

            .ul-banner-3-descr {
                font-size: 0.8rem !important;
            }

            .ul-banner-3-btn {
                padding: 8px 20px;
                font-size: 0.85rem;
            }

            .tabs {
                gap: 8px;
            }

            .tab-button {
                padding: 8px 16px;
                font-size: 0.85rem;
            }

            .ul-2-section-title {
                font-size: 1.5rem;
            }
        }

        /* card css  */
        .feature-card {
            background: linear-gradient(145deg, #e8f9f4, #e0f4f9);
        }
    </style>
@endpush

@section('content')
    <main>
        <!-- HERO -->
        @if(isset($sections['hero']) && $sections['hero']->is_active)
        <section class="ul-banner-3">
            <div id="bannerCarousel" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-inner">
                    @foreach($sections['hero']->items as $index => $item)
                    <div class="carousel-item {{ $index === 0 ? 'active' : '' }}">
                        <div class="ul-banner-3-container">
                            <div class="row row-cols-lg-2 row-cols-1 gy-5 align-items-start">

                                <!-- txt -->
                                <div class="col pe-lg-5">
                                    <div class="ul-banner-3-txt pe-lg-4">
                                        <h3 class="ul-banner-3-title">{{ $item->title }}</h3>
                                        <p class="ul-banner-3-descr">{{ $item->description }}</p>
                                        <a href="{{ $item->link ?? '' }}" {!! $item->link === '#demoModal' ? 'data-bs-toggle="modal" data-bs-target="#demoModal"' : '' !!} class="btn-primary-redesign">{{ $item->link_text }}</a>
                                    </div>
                                </div>

                                <!-- img -->
                                <div class="col-lg col-11 sm-image">
                                    <div class="ul-banner-3-img">
                                        <img src="{{ asset('storage/' . $item->image) }}" alt="{{ $item->title }}">
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
                <!-- Controls -->
                <button class="carousel-control-prev" type="button" data-bs-target="#bannerCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#bannerCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                </button>
            </div>

            <!-- Vectors same outside -->
            <div class="ul-banner-3-vectors">
                <img src="{{ asset('front-assets/img/banner-3-vector-1.png') }}" alt="vector" class="vector-1">
                <img src="{{ asset('front-assets/img/banner-3-vector-2.png') }}" alt="" class="vector-2">
                <img src="{{ asset('front-assets/img/banner-3-vector-3.png') }}" alt="" class="vector-3">
            </div>
        </section>
        @endif

        {{-- modal popup code --}}
        <!-- Modal -->
        <div class="modal fade" id="demoModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content custom-modal">

                    <!-- Header -->
                    <div class="modal-header border-0">
                        <h5 class="modal-title text-white">Book a Demo</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>

                    <!-- Body -->
                    <div class="modal-body bg-white p-4 rounded-bottom">
                        @if (session('success'))
                            <div class="alert alert-success">
                                {{ session('success') }}
                            </div>
                        @endif
                        @if (session('error'))
                            <div class="alert alert-danger">
                                {{ session('error') }}
                            </div>
                        @endif
                        <form action="{{ route('book.demo') }}" method="POST">
                            @csrf
                            <div class="row g-3">

                                <div class="col-md-6">
                                    <input type="text" name="full_name" class="form-control" placeholder="Full Name"
                                        required>
                                </div>

                                <div class="col-md-6">
                                    <input type="email" name="email" class="form-control" placeholder="Email Address"
                                        required>
                                </div>

                                <div class="col-md-6">
                                    <input type="text" name="clinic_name" class="form-control"
                                        placeholder="Company / Clinic Name">
                                </div>

                                <div class="col-md-6">
                                    <input type="tel" name="phone" class="form-control"
                                        placeholder="Contact Number" required>
                                </div>

                                <div class="col-md-12">
                                    <textarea name="concern" class="form-control" rows="3" placeholder="Your Concern" required></textarea>
                                </div>

                                <div class="col-md-12">
                                    <input type="datetime-local" name="preferred_time" class="form-control">
                                    <small class="text-muted">Preferred Time (Optional)</small>
                                </div>

                                <div class="col-md-12 text-end">
                                    <button type="submit" class="btn submit-btn">
                                        Submit Request
                                    </button>
                                </div>

                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>

        <!-- FEATURES -->
        @if(isset($sections['features']) && $sections['features']->is_active)
        <section class="features redesign" id="features">
            <div class="section-header-center">
                <div class="section-label">{{ $sections['features']->metadata['badge'] ?? 'Platform Features' }}</div>
                <h2 class="section-title">{{ $sections['features']->title }}</h2>
                <p class="section-subtitle">{{ $sections['features']->subtitle }}</p>
            </div>
            <div class="features-grid">
                @foreach($sections['features']->items as $item)
                <div class="feature-card">
                    <div class="feature-icon">{{ $item->icon }}</div>
                    <h3>{{ $item->title }}</h3>
                    <p>{{ $item->description }}</p>
                </div>
                @endforeach
            </div>
        </section>
        @endif

        <!-- HOW IT WORKS -->
        @if(isset($sections['how_it_works']) && $sections['how_it_works']->is_active)
        <section class="how-section redesign" id="how-it-works">
            <div class="section-header-center">
                <div class="section-label">{{ $sections['how_it_works']->metadata['badge'] ?? 'How It Works' }}</div>
                <h2 class="section-title">{{ $sections['how_it_works']->title }}</h2>
                <p class="section-subtitle">{{ $sections['how_it_works']->subtitle }}</p>
            </div>
            <div class="steps-grid">
                @foreach($sections['how_it_works']->items as $item)
                <div class="step-item">
                    <div class="step-num">{{ $item->badge }}</div>
                    <h4>{{ $item->title }}</h4>
                    <p>{{ $item->description }}</p>
                </div>
                @endforeach
            </div>
        </section>
        @endif

        <!-- PRODUCTS -->
        @if(isset($sections['products']) && $sections['products']->is_active)
        <section class="products-section redesign" id="products">
            <div class="section-header-center">
                <div class="section-label">{{ $sections['products']->metadata['badge'] ?? 'Core Products' }}</div>
                <h2 class="section-title">{{ $sections['products']->title }}</h2>
            </div>

            @foreach($sections['products']->items as $item)
            <div class="products-layout {{ $item->icon === 'reverse' ? 'reverse' : '' }}">
                @if($item->icon !== 'reverse')
                <div class="product-img-wrap">
                    <img src="{{ asset('storage/' . $item->image) }}" class="w-100" alt="{{ $item->title }}">
                </div>
                @endif

                <div class="product-info">
                    <div class="badge-redesign">{{ $item->badge }}</div>
                    <h3>{{ $item->title }}</h3>
                    <p>{{ $item->description }}</p>
                    <ul class="product-features">
                        @if(is_array($item->features))
                            @foreach($item->features as $feat)
                            <li>
                                <div class="check-icon">✓</div> {{ $feat }}
                            </li>
                            @endforeach
                        @endif
                    </ul>
                    <a href="{{ $item->link ?? '#' }}" class="btn-primary-redesign">{{ $item->link_text }}</a>
                </div>

                @if($item->icon === 'reverse')
                <div class="product-img-wrap" style="background:linear-gradient(145deg,#e8f9f4,#fef9e7);">
                    <img src="{{ asset('storage/' . $item->image) }}" class="w-100" alt="{{ $item->title }}">
                </div>
                @endif
            </div>
            @if(!$loop->last)
            <hr class="product-divider">
            @endif
            @endforeach
        </section>
        @endif

        <!-- TESTIMONIALS -->
        @if(isset($sections['testimonials']) && $sections['testimonials']->is_active)
        <section class="testimonials-section redesign" id="testimonials">
            <div class="section-header-center">
                <div class="section-label">{{ $sections['testimonials']->metadata['badge'] ?? 'Testimonials' }}</div>
                <h2 class="section-title">{{ $sections['testimonials']->title }}</h2>
                <p class="section-subtitle">{{ $sections['testimonials']->subtitle }}</p>
            </div>
            <div class="testimonials-grid mt-60">
                @foreach($sections['testimonials']->items as $item)
                <div class="testimonial-card" {!! $loop->iteration == 2 ? 'style="border-color: var(--primary);"' : '' !!}>
                    <div class="testimonial-stars">
                        @for($i = 0; $i < ($item->stars ?? 5); $i++)
                            <span class="star">★</span>
                        @endfor
                    </div>
                    <p class="testimonial-text">"{{ $item->description }}"</p>
                    <div class="testimonial-author">
                        <div class="t-avatar" style="{{ $item->badge ? 'background:' . $item->badge : '' }}">{{ $item->title }}</div>
                        <div>
                            <div class="t-name">{{ $item->link_text }}</div>
                            <div class="t-role">{{ $item->link }}</div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </section>
        @endif

        <!-- PRICING -->
        @if(isset($sections['pricing']) && $sections['pricing']->is_active)
        <section class="pricing-section redesign" id="pricing">
            <div class="section-header-center">
                <div class="section-label">{{ $sections['pricing']->metadata['badge'] ?? 'Pricing' }}</div>
                <h2 class="section-title">{{ $sections['pricing']->title }}</h2>
                <p class="section-subtitle">{{ $sections['pricing']->subtitle }}</p>

                <!-- Billing Toggle -->
                <div class="billing-toggle"
                    style="margin-top: 40px; display: flex; justify-content: center; align-items: center; gap: 20px;">
                    <span class="toggle-label" data-period="monthly">{{ $sections['pricing']->metadata['monthly_label'] ?? 'Monthly' }}</span>
                    <div class="toggle-switch active" onclick="toggleBilling()">
                        <div class="toggle-slider" id="toggleSlider"></div>
                    </div>
                    <span class="toggle-label active" data-period="yearly">{{ $sections['pricing']->metadata['yearly_label'] ?? 'Yearly' }} <span class="saving-badge">{{ $sections['pricing']->metadata['discount_badge'] ?? 'Save 16.6%' }}</span></span>
                </div>
            </div>

            <div class="pricing-grid">
                @foreach($sections['pricing']->items as $index => $item)
                <div class="pricing-card {{ !empty($item->badge) ? 'featured' : '' }}" data-monthly="{{ (int)$item->price_monthly }}" data-yearly="{{ (int)$item->price_yearly }}">
                    @if(!empty($item->badge))
                    <div class="popular-badge">{{ $item->badge }}</div>
                    @endif
                    <div class="pricing-name">{{ $item->title }}</div>
                    <div class="pricing-price">
                        <span class="crossed-price"
                            style="text-decoration: line-through; color: #999; font-size: 20px; margin-right: 10px; font-weight: 400;">₹{{ (int)($item->price_original_yearly ?? ($item->price_monthly * 12)) }}</span>
                        <span>₹</span>
                        <span class="price-value">{{ (int)$item->price_yearly }}</span>
                        <span class="period-text"
                            style="font-size: 16px; font-weight: 500; color: #666; margin-left: 6px;">/ year</span>
                    </div>
                    <ul class="pricing-features">
                        @if(is_array($item->features))
                            @foreach($item->features as $f_idx => $feat)
                            @php
                              $inc_monthly = isset($feat['included_monthly']) && $feat['included_monthly'];
                              $inc_yearly = isset($feat['included_yearly']) && $feat['included_yearly'];
                              $text_monthly = !empty($feat['text_monthly']) ? $feat['text_monthly'] : $feat['name'];
                              $text_yearly = !empty($feat['text_yearly']) ? $feat['text_yearly'] : $feat['name'];

                              // Initial load is Yearly (toggleBilling starts at yearly mode)
                              $included = $inc_yearly;
                              $text = $text_yearly;
                            @endphp
                            <li data-included-monthly="{{ $inc_monthly ? '1' : '0' }}"
                                data-included-yearly="{{ $inc_yearly ? '1' : '0' }}"
                                data-text-monthly="{{ $text_monthly }}"
                                data-text-yearly="{{ $text_yearly }}">
                                @if($included)
                                    @if(!empty($item->badge))
                                        <div class="check-icon">✓</div> {{ $text }}
                                    @else
                                        <div class="check-icon" style="background:#c0e4f4;color:#0a6e8a;">✓</div> {{ $text }}
                                    @endif
                                @else
                                    <div class="check-icon" style="background:#e0e0e0;color:#999;opacity:0.5;">✕</div> <span style="opacity:0.5;">{{ $text }}</span>
                                @endif
                            </li>
                            @endforeach
                        @endif
                    </ul>
                    <a href="{{ $item->link ?? '#' }}" class="{{ !empty($item->badge) ? 'btn-primary-redesign' : 'btn-ghost' }}" style="width:100%;text-align:center;display:block;">{{ $item->link_text }}</a>
                </div>
                @endforeach
            </div>
        </section>
        @endif

        <style>
            .billing-toggle {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 20px;
                margin-top: 40px;
            }

            .toggle-label {
                font-size: 16px;
                font-weight: 600;
                color: #999;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }

            .toggle-label.active {
                color: #0a6e8a;
            }

            .saving-badge {
                background: linear-gradient(135deg, #00c9a7 0%, #00a88a 100%);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                margin-left: 8px;
                display: inline-block;
            }

            .toggle-switch {
                width: 60px;
                height: 32px;
                background: #e0e0e0;
                border-radius: 16px;
                cursor: pointer;
                position: relative;
                transition: background 0.3s ease;
                display: inline-block;
            }

            .toggle-switch.active {
                background: linear-gradient(135deg, #0a6e8a 0%, #00c9a7 100%);
            }

            .toggle-slider {
                width: 28px;
                height: 28px;
                background: white;
                border-radius: 14px;
                position: absolute;
                top: 2px;
                left: 2px;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }

            .toggle-switch.active .toggle-slider {
                left: 30px;
            }

            .pricing-price {
                overflow: hidden;
                position: relative;
            }

            .price-value {
                display: inline-block;
                transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .pricing-period {
                display: none !important;
            }

            @media (max-width: 768px) {
                .billing-toggle {
                    flex-direction: column;
                    gap: 15px;
                }

                .saving-badge {
                    display: block;
                    margin-left: 0;
                    margin-top: 8px;
                }
            }
        </style>

        <script>
               let isYearly = true;

    function toggleBilling() {
        isYearly = !isYearly;
        const toggle = document.querySelector('.toggle-switch');
        const labels = document.querySelectorAll('.toggle-label');

        toggle.classList.toggle('active');

        labels.forEach(label => {
            label.classList.remove('active');
            if ((isYearly && label.dataset.period === 'yearly') ||
                (!isYearly && label.dataset.period === 'monthly')) {
                label.classList.add('active');
            }
        });

        document.querySelectorAll('.pricing-card').forEach((card, index) => {
            const priceValue = card.querySelector('.price-value');
            const crossedPrice = card.querySelector('.crossed-price');
            const periodText = card.querySelector('.period-text');
            const features = card.querySelectorAll('.pricing-features li');
            const isFeatured = card.classList.contains('featured');

            priceValue.style.opacity = '0';
            priceValue.style.transform = 'scale(0.8)';
            if (crossedPrice) {
                crossedPrice.style.opacity = '0';
            }

            setTimeout(() => {
                if (isYearly) {
                    const yearlyPrice = card.dataset.yearly;
                    const monthlyPrice = parseInt(card.dataset.monthly);
                    priceValue.textContent = yearlyPrice;
                    if (crossedPrice) {
                        crossedPrice.textContent = '₹' + (monthlyPrice * 12);
                        crossedPrice.style.display = 'inline-block';
                        setTimeout(() => {
                            crossedPrice.style.opacity = '1';
                        }, 50);
                    }
                    periodText.textContent = '/ year';
                } else {
                    const monthlyPrice = card.dataset.monthly;
                    priceValue.textContent = monthlyPrice;
                    if (crossedPrice) {
                        crossedPrice.style.display = 'none';
                    }
                    periodText.textContent = '/ month';
                }

                // Render dynamic features
                features.forEach(li => {
                    const incMonthly = li.getAttribute('data-included-monthly') === '1';
                    const incYearly = li.getAttribute('data-included-yearly') === '1';
                    const textMonthly = li.getAttribute('data-text-monthly');
                    const textYearly = li.getAttribute('data-text-yearly');

                    const included = isYearly ? incYearly : incMonthly;
                    const text = isYearly ? textYearly : textMonthly;

                    if (included) {
                        if (isFeatured) {
                            li.innerHTML = `<div class="check-icon">✓</div> ${text}`;
                        } else {
                            li.innerHTML = `<div class="check-icon" style="background:#c0e4f4;color:#0a6e8a;">✓</div> ${text}`;
                        }
                    } else {
                        li.innerHTML = `<div class="check-icon" style="background:#e0e0e0;color:#999;opacity:0.5;">✕</div> <span style="opacity:0.5;">${text}</span>`;
                    }
                });

                priceValue.style.opacity = '1';
                priceValue.style.transform = 'scale(1)';
            }, 200);
        });

        document.querySelectorAll('.pricing-card').forEach(card => {
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 150);
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.style.transition = 'transform 0.3s ease';
        });

        const toggle = document.querySelector('.toggle-switch');
        if (toggle && !toggle.classList.contains('active')) {
            toggle.classList.add('active');
        }

        // Set initial yearly state
        document.querySelectorAll('.pricing-card').forEach((card, index) => {
            const crossedPrice = card.querySelector('.crossed-price');
            if (crossedPrice && isYearly) {
                const monthlyPrice = parseInt(card.dataset.monthly);
                crossedPrice.textContent = '₹' + (monthlyPrice * 12);
                crossedPrice.style.display = 'inline-block';
                crossedPrice.style.opacity = '1';
            }
        });
    });
        </script>

        <!-- FAQ -->
        @if(isset($sections['faq']) && $sections['faq']->is_active)
        <section class="faq-section redesign" id="faq">
            <div class="faq-layout">
                <div>
                    <div class="section-label">{{ $sections['faq']->metadata['badge'] ?? 'FAQ' }}</div>
                    <h2 class="section-title">{{ $sections['faq']->title }}</h2>
                    <p class="section-subtitle" style="margin-top:16px;">{{ $sections['faq']->subtitle }}</p>
                    <a href="{{ url($sections['faq']->metadata['contact_btn_link'] ?? '/contact') }}" class="btn-primary-redesign"
                        style="margin-top:32px;display:inline-block;">{{ $sections['faq']->metadata['contact_btn_text'] ?? 'Contact Support' }}</a>
                </div>
                <div class="faq-list">
                    @foreach($sections['faq']->items as $item)
                    <div class="faq-item {{ $item->badge === 'open' ? 'open' : '' }}">
                        <button class="faq-question" onclick="toggleFaq(this)">
                            {{ $item->title }}
                            <i class="faq-icon">+</i>
                        </button>
                        <div class="faq-answer">{{ $item->description }}</div>
                    </div>
                    @endforeach
                </div>
            </div>
        </section>
        @endif

        <!-- CTA BANNER -->
        @if(isset($sections['cta']) && $sections['cta']->is_active)
        <section class="cta-section">
            <h2>{{ $sections['cta']->title }}</h2>
            <p>{{ $sections['cta']->subtitle }}</p>
            <div class="cta-buttons">
                <a href="{{ url($sections['cta']->metadata['primary_btn_link'] ?? '/contact') }}" class="btn-primary-redesign btn-large"
                    style="background:white;color:var(--primary);box-shadow:0 4px 20px rgba(0,0,0,0.15);">{{ $sections['cta']->metadata['primary_btn_text'] ?? 'Start Free Trial' }}</a>
                <a href="" data-bs-toggle="modal" data-bs-target="{{ $sections['cta']->metadata['secondary_btn_link'] ?? '#demoModal' }}"
                    class="btn-outline-white-redesign">{{ $sections['cta']->metadata['secondary_btn_text'] ?? 'Request a Demo' }}</a>
            </div>
        </section>
        @endif
    </main>

    <script>
        // FAQ toggle
        function toggleFaq(btn) {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        }

        // Animate elements on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.feature-card, .testimonial-card, .pricing-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    </script>
@endsection
