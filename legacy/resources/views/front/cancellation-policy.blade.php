@extends('layouts.frontend')

@push('scripts')
    <script>
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === "#" || targetId === "") return;
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    history.pushState(null, null, targetId);
                }
            });
        });

        // Make all external links safe
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            if (!link.href.includes('skoracares.com')) {
                link.setAttribute('rel', 'noopener noreferrer');
                link.setAttribute('target', '_blank');
            }
        });
    </script>
@endpush
@section('content')
    <main>
        <!-- BREADCRUMBS SECTION START -->
        <section class="ul-breadcrumb ul-section-spacing">
            <div class="ul-container">
                <ul class="ul-breadcrumb-nav">
                    <li><a href="{{ url('/') }}">Home</a></li>
                    <li><span class="separator"><i class="flaticon-right"></i></span></li>
                    <li>Cancellation Policy</li>
                </ul>
                <h2 class="ul-breadcrumb-title">Cancellation Policy</h2>
            </div>
        </section>

        <div class="container">
            <!-- Hero header with Bootstrap Icons -->
            <div class="privacy-header">
                <div class="badge-icon">
                    <i class="bi bi-shield-lock-fill"></i>
                </div>
                <h1>Cancellation Policy</h1>
                <p style="font-size: 1.1rem; max-width: 680px; margin: 0.5rem auto 0; color: var(--text-muted);">Your trust
                    is our priority — clear, transparent protection of your personal data.</p>
                <div class="last-updated">
                    <i class="bi bi-calendar3"></i> Revised effective date: April 2026
                </div>
            </div>

            <!-- Main policy card -->
            <div class="policy-card">
                <div class="policy-inner">

                    <!-- 1. Information We Collect -->
                    <div class="policy-section" id="collect">
                        <div class="section-title">
                            <i class="bi bi-database"></i>
                            <span>1. Information We Collect</span>
                        </div>
                        <div class="data-grid">
                            <i class="bi bi-person-check-fill" style="color: var(--accent); margin-right: 8px;"></i>
                            <strong>Personal & Business Data:</strong>
                            <ul class="list-styled" style="margin-top: 12px;">
                                <li><i class="bi bi-person"></i> Full Name, Email Address, Phone Number</li>
                                <li><i class="bi bi-hospital"></i> Clinic/Hospital Name, Business Details, Address</li>
                                <li><i class="bi bi-globe2"></i> IP Address, Browser Type, Device Information, Operating
                                    System</li>
                                <li><i class="bi bi-graph-up"></i> Website Usage Data, Cookies and Analytics Data</li>
                            </ul>
                        </div>
                        <p class="section-subhead" style="margin-top: 10px;">We collect information to personalize your
                            experience and improve our healthcare-related services.</p>
                    </div>

                    <!-- 2. How We Use Your Information -->
                    <div class="policy-section" id="use">
                        <div class="section-title">
                            <i class="bi bi-gear-wide-connected"></i>
                            <span>2. How We Use Your Information</span>
                        </div>
                        <ul class="list-styled">
                            <li><i class="bi bi-check-circle-fill"></i> Provide and manage services – seamless access to
                                SkoraCares platform</li>
                            <li><i class="bi bi-headset"></i> Respond to inquiries and support requests</li>
                            <li><i class="bi bi-bar-chart-steps"></i> Improve website functionality and user experience</li>
                            <li><i class="bi bi-envelope-paper-fill"></i> Send updates and service-related communication
                            </li>
                            <li><i class="bi bi-shield-check"></i> Maintain security and prevent fraud</li>
                            <li><i class="bi bi-columns-gap"></i> Comply with legal requirements</li>
                        </ul>
                    </div>

                    <!-- 3. Data Protection & Security -->
                    <div class="policy-section" id="security">
                        <div class="section-title">
                            <i class="bi bi-lock-fill"></i>
                            <span>3. Data Protection & Security</span>
                        </div>
                        <p>We implement enterprise-grade security measures to keep your information safe:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 14px;">
                            <span class="badge-law"><i class="bi bi-shield-check"></i> SSL Security</span>
                            <span class="badge-law"><i class="bi bi-key-fill"></i> Encrypted Transmission</span>
                            <span class="badge-law"><i class="bi bi-hdd-stack-fill"></i> Secure Servers</span>
                            <span class="badge-law"><i class="bi bi-person-lock"></i> Access Controls</span>
                            <span class="badge-law"><i class="bi bi-activity"></i> Regular Monitoring</span>
                        </div>
                        <p class="section-subhead" style="margin-top: 12px;">All data is encrypted both in transit and at
                            rest using modern protocols.</p>
                    </div>

                    <!-- 4. Data Sharing & Disclosure -->
                    <div class="policy-section" id="sharing">
                        <div class="section-title">
                            <i class="bi bi-share-fill"></i>
                            <span>4. Data Sharing & Disclosure</span>
                        </div>
                        <p><strong>We do NOT sell, rent, or trade personal information.</strong> Your privacy is
                            non-negotiable. However, data may be shared only in limited scenarios:</p>
                        <ul class="list-styled" style="margin-top: 12px;">
                            <li><i class="bi bi-people"></i> With trusted service providers (to operate our platform)</li>
                            <li><i class="bi bi-sliders"></i> When required by law or legal process</li>
                            <li><i class="bi bi-shield-check"></i> To protect rights, property, or safety of SkoraCares &
                                users</li>
                            <li><i class="bi bi-check2-all"></i> With your explicit consent</li>
                        </ul>
                    </div>

                    <!-- 5. Cookies Policy -->
                    <div class="policy-section" id="cookies">
                        <div class="section-title">
                            <i class="bi bi-cookie"></i>
                            <span>5. Cookies Policy</span>
                        </div>
                        <p>We use cookies to enhance browsing experience, analyze traffic, and personalize content. You can
                            manage cookie preferences in your browser settings. By continuing to use our site, you agree to
                            our use of cookies.</p>
                        <div class="data-grid" style="background: #fff6e5; border-left-color: #00c9a7;">
                            <i class="bi bi-info-circle-fill"></i> <strong>Cookie types:</strong> Essential, Analytics,
                            Functional, and Preference cookies.
                        </div>
                    </div>

                    <!-- 6. Data Retention -->
                    <div class="policy-section" id="retention">
                        <div class="section-title">
                            <i class="bi bi-hourglass-split"></i>
                            <span>6. Data Retention</span>
                        </div>
                        <p>SkoraCares retains your personal information only as long as necessary to fulfill the purposes
                            outlined in this policy, comply with legal obligations, resolve disputes, and enforce our
                            agreements. When data is no longer needed, we securely delete or anonymize it.</p>
                    </div>

                    <!-- 7. Your Rights (GDPR + Indian laws) -->
                    <div class="policy-section" id="rights">
                        <div class="section-title">
                            <i class="bi bi-shield-lock"></i>
                            <span>7. Your Rights</span>
                        </div>
                        <p>You have full control over your personal data. Under applicable privacy laws, you may request:
                        </p>
                        <div
                            style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px,1fr)); gap: 12px; margin: 16px 0;">
                            <div><i class="bi bi-eye-fill" style="color: var(--accent);"></i> Access to your data</div>
                            <div><i class="bi bi-pencil-square" style="color: var(--accent);"></i> Correction of inaccurate
                                info</div>
                            <div><i class="bi bi-trash3-fill" style="color: var(--accent);"></i> Deletion / Right to be
                                forgotten</div>
                            <div><i class="bi bi-chat-dots-fill" style="color: var(--accent);"></i> Withdrawal of consent
                            </div>
                            <div><i class="bi bi-hand-thumbs-down" style="color: var(--accent);"></i> Objection to
                                processing</div>
                            <div><i class="bi bi-files" style="color: var(--accent);"></i> Copy of your data (portability)
                            </div>
                        </div>
                        <p class="section-subhead">To exercise your rights, simply contact us via the details in section 12.
                        </p>
                    </div>

                    <!-- 8. Third-Party Links -->
                    <div class="policy-section" id="thirdparty">
                        <div class="section-title">
                            <i class="bi bi-box-arrow-up-right"></i>
                            <span>8. Third-Party Links</span>
                        </div>
                        <p>Our website may contain links to external sites (partner resources, medical journals, etc.). We
                            are not responsible for the privacy practices or content of those third-party websites. We
                            encourage you to review their privacy policies before sharing personal information.</p>
                    </div>

                    <!-- 9. Children's Privacy -->
                    <div class="policy-section" id="children">
                        <div class="section-title">
                            <i class="bi bi-people-fill"></i>
                            <span>9. Children's Privacy</span>
                        </div>
                        <p>SkoraCares does not knowingly collect personal information from children under 18 years of age.
                            If you are a parent or guardian and believe your child has provided us with personal data,
                            please contact us immediately, and we will take steps to remove that information.</p>
                    </div>

                    <!-- 10. Compliance with Laws -->
                    <div class="policy-section" id="compliance">
                        <div class="section-title">
                            <i class="bi bi-bank2"></i>
                            <span>10. Compliance with Laws</span>
                        </div>
                        <p>We adhere to applicable Indian government regulations, including the Information Technology Act,
                            2000, and other privacy frameworks. SkoraCares is committed to upholding highest standards of
                            data governance in alignment with local and international best practices.</p>
                    </div>

                    <!-- 11. Changes to This Privacy Policy -->
                    <div class="policy-section" id="changes">
                        <div class="section-title">
                            <i class="bi bi-pencil-square"></i>
                            <span>11. Changes to This Privacy Policy</span>
                        </div>
                        <p>We may update this policy from time to time to reflect operational, legal, or regulatory changes.
                            Any revisions will be posted on this page with a revised effective date. We encourage you to
                            review this page periodically. Continued use of SkoraCares services after modifications
                            indicates acceptance of the updated policy.</p>
                    </div>

                    <!-- 12. Contact Us (with live links) -->
                    <div class="policy-section" id="contact" style="border-bottom: none;">
                        <div class="section-title">
                            <i class="bi bi-envelope-paper-heart-fill"></i>
                            <span>12. Contact Us</span>
                        </div>
                        <div class="contact-block">
                            <div class="contact-details">
                                <p><i class="bi bi-building"></i> <strong>SkoraCares</strong><br>
                                    <i class="bi bi-globe2"></i> Website: <a href="https://skoracares.com"
                                        target="_blank" rel="noopener noreferrer">https://skoracares.com</a><br>
                                    <i class="bi bi-envelope-fill"></i> Email: <a
                                        href="mailto:info@skoracares.com">info@skoracares.com</a>
                                </p>
                            </div>
                            <a href="{{ url('/contact') }}" class="btn-grace" target="_blank"><i
                                    class="bi bi-send-fill"></i> Get in touch</a>

                        </div>
                        <p style="margin-top: 1rem; font-size: 0.9rem;">For data privacy requests, security concerns, or to
                            exercise your rights, reach out to our Data Protection Officer via email.</p>
                    </div>

                </div> <!-- policy-inner -->
            </div> <!-- policy-card -->

        </div>
    </main>
@endsection
