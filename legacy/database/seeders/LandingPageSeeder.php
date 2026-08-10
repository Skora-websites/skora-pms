<?php

namespace Database\Seeders;

use App\Models\LandingSection;
use App\Models\LandingItem;
use Illuminate\Database\Seeder;

class LandingPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete existing ones to prevent duplicates
        LandingItem::query()->delete();
        LandingSection::query()->delete();

        // 1. HERO SECTION
        LandingSection::create([
            'key' => 'hero',
            'name' => 'Hero Slider',
            'title' => null,
            'subtitle' => null,
            'is_active' => true,
        ]);

        LandingItem::create([
            'section_key' => 'hero',
            'title' => 'SkoraCares – Smarter Patient & Clinic Management',
            'description' => 'Online Prescription Upload, Multi Clinic Management, Home Visit with Map Integration — everything your practice needs in one powerful platform.',
            'image' => 'front-assets/img/banner1.png',
            'link' => '#demoModal',
            'link_text' => 'Request a demo →',
            'order' => 0,
        ]);

        LandingItem::create([
            'section_key' => 'hero',
            'title' => 'Your Digital Backbone for Clinical Excellence',
            'description' => 'From Consent Form Submission to Staff Management and Role Management — SkoraCares simplifies every step of care with multi vendor integration for lab tests.',
            'image' => 'front-assets/img/banner1.png',
            'link' => '#demoModal',
            'link_text' => 'Request a demo →',
            'order' => 1,
        ]);

        LandingItem::create([
            'section_key' => 'hero',
            'title' => 'Your digital partner for smarter, faster, personalized care.',
            'description' => 'I/E Management, Ledger Feature, Follow-up Management — healthcare teams get smart digital tools to deliver efficient, personalized patient care seamlessly.',
            'image' => 'front-assets/img/banner1.png',
            'link' => '#demoModal',
            'link_text' => 'Request a demo →',
            'order' => 2,
        ]);

        // 2. FEATURES SECTION
        LandingSection::create([
            'key' => 'features',
            'name' => 'Platform Features',
            'title' => 'Everything Your Clinic Needs',
            'subtitle' => 'Purpose-built tools for modern healthcare professionals — from solo practitioners to multi-branch hospitals.',
            'is_active' => true,
            'metadata' => ['badge' => 'Platform Features'],
        ]);

        $features = [
            ['📋', 'Online Prescription Upload', 'Submit and manage prescriptions digitally for faster, error-free dispensing and retrieval.'],
            ['✍️', 'Consent Form Submission', 'Collect and store patient consent forms electronically with full compliance and audit trails.'],
            ['🧪', 'Multi Vendor Lab Tests', 'Seamlessly integrate with multiple lab vendors to order tests and receive results in one place.'],
            ['👥', 'Staff Management', 'Manage your entire team — schedules, roles, access permissions — from a single dashboard.'],
            ['📦', 'I/E Management', 'Track inventory and expenses efficiently to keep your clinic operations running smoothly.'],
            ['📍', 'Home Visit with Map Integration', 'Schedule and track home visits with live map integration for accurate, timely care delivery.'],
            ['🏥', 'Multi Clinic Management', 'Operate and oversee multiple clinic locations from one unified, centralized platform.'],
            ['📱', 'Role Management', 'Define granular access roles for doctors, staff, and admins to keep your data secure.'],
            ['🔐', 'White Label', 'Launch under your own brand identity with full white-label customization options available.'],
            ['📒', 'Ledger Feature', 'Maintain transparent financial records and patient accounts with a built-in ledger system.'],
            ['🔔', 'Follow-up Management', 'Never miss a follow-up — automate reminders and track patient follow-up schedules easily.'],
            ['📁', 'Patient Record', 'Store and manage complete patient information securely in one place. Access medical history, prescription, lab reports, and treatment notes anytime, anywhere.'],
        ];

        foreach ($features as $index => $feat) {
            LandingItem::create([
                'section_key' => 'features',
                'icon' => $feat[0],
                'title' => $feat[1],
                'description' => $feat[2],
                'order' => $index,
            ]);
        }

        // 3. HOW IT WORKS
        LandingSection::create([
            'key' => 'how_it_works',
            'name' => 'How It Works',
            'title' => 'Get Started in 4 Simple Steps',
            'subtitle' => 'From signup to fully operational in under a day — no IT team required.',
            'is_active' => true,
            'metadata' => ['badge' => 'How It Works'],
        ]);

        $steps = [
            ['Create Your Account', 'Sign up in 2 minutes. No credit card needed for the free trial.'],
            ['Set Up Your Clinic', 'Add your doctors, departments, schedule, and branding easily.'],
            ['Add Patient Data', 'Easily add new patient details or import existing records in just a few clicks.'],
            ['Go Live & Grow', 'Start seeing patients digitally and watch your efficiency soar.'],
        ];

        foreach ($steps as $index => $step) {
            LandingItem::create([
                'section_key' => 'how_it_works',
                'title' => $step[0],
                'description' => $step[1],
                'badge' => (string)($index + 1),
                'order' => $index,
            ]);
        }

        // 4. PRODUCTS SECTION
        LandingSection::create([
            'key' => 'products',
            'name' => 'Core Products',
            'title' => 'Explore Our Suite of Solutions',
            'subtitle' => null,
            'is_active' => true,
            'metadata' => ['badge' => 'Core Products'],
        ]);

        LandingItem::create([
            'section_key' => 'products',
            'title' => 'All-in-One Healthcare Management Platform',
            'description' => 'Manage your complete healthcare operations with a powerful and easy-to-use platform. From patient records and prescriptions to staff management, billing, home visits, and multi-clinic operations — everything is available in one smart dashboard.',
            'badge' => '⚙️ Explore Our Suite of Solutions',
            'link' => 'tel:9217375832',
            'link_text' => 'Contact Sales →',
            'image' => 'front-assets/img/explore.jpeg',
            'features' => [
                'Online Prescription Upload & Consent Form Submission',
                'Multi Vendor Integration for Lab Tests',
                'Staff, Role & Profile Management',
                'Home Visit Management with Map Integration',
                'Multi Clinic Management & White Label Solution',
                'Ledger Feature, I/E Management & Follow Up Management'
            ],
            'icon' => 'normal',
            'order' => 0,
        ]);

        LandingItem::create([
            'section_key' => 'products',
            'title' => 'Smart, Affordable & Trusted Solution',
            'description' => 'Designed for modern healthcare professionals, our platform offers premium features at the best price. Hundreds of doctors, clinics, and healthcare businesses already trust us to streamline their daily operations and improve patient care.',
            'badge' => '🚀 Why Choose Us',
            'link' => 'tel:9217375832',
            'link_text' => 'Contact Sales →',
            'image' => 'front-assets/img/choose.jpeg',
            'features' => [
                'PMS Complimentary for Existing Customers',
                'Affordable Paid PMS Plans Available',
                '30 Days Free Trial',
                'Easy to Use Interface',
                'Highest Features at Lowest Price',
                '24×7 Training & Support'
            ],
            'icon' => 'reverse',
            'order' => 1,
        ]);

        // 5. TESTIMONIALS SECTION
        LandingSection::create([
            'key' => 'testimonials',
            'name' => 'Testimonials',
            'title' => 'Loved by Doctors Across India',
            'subtitle' => 'Here\'s what healthcare professionals say after switching to SkoraCares.',
            'is_active' => true,
            'metadata' => ['badge' => 'Testimonials'],
        ]);

        LandingItem::create([
            'section_key' => 'testimonials',
            'stars' => 5,
            'description' => 'SkoraCares helped me improve my clinic’s online presence with professional SEO and Google My Business management. My clinic now ranks better locally, and I have seen a steady increase in appointments. Excellent service and support.',
            'title' => 'RS',
            'link_text' => 'Dr. Ranjit Singh',
            'link' => 'General Physician, Delhi',
            'order' => 0,
        ]);

        LandingItem::create([
            'section_key' => 'testimonials',
            'stars' => 5,
            'description' => 'As a doctor, I wanted a marketing company that understands patient trust and ethics. SkoraCares delivered exactly that. Their campaigns are professional, transparent, and focused on quality patient leads.',
            'title' => 'PM',
            'link_text' => 'Dr. Priya Mehta',
            'link' => 'Pediatrician, Mumbai',
            'badge' => 'linear-gradient(135deg,#00c9a7,#0a6e8a)',
            'order' => 1,
        ]);

        LandingItem::create([
            'section_key' => 'testimonials',
            'stars' => 5,
            'description' => 'If you are a doctor looking for reliable digital marketing support, SkoraCares is the right choice. They know how to generate patient leads ethically while improving online visibility and reputation.',
            'title' => 'AK',
            'link_text' => 'Dr. Anil Kumar',
            'link' => 'Cardiologist, Bengaluru',
            'badge' => 'linear-gradient(135deg,#533ab7,#0a6e8a)',
            'order' => 2,
        ]);

        // 6. PRICING SECTION
        LandingSection::create([
            'key' => 'pricing',
            'name' => 'Pricing',
            'title' => 'Simple, Transparent Pricing',
            'subtitle' => 'No hidden fees. No per-patient charges. Just one flat monthly price for your entire clinic.',
            'is_active' => true,
            'metadata' => [
                'badge' => 'Pricing',
                'monthly_label' => 'Monthly',
                'yearly_label' => 'Yearly',
                'discount_badge' => 'Save 16.6%',
            ],
        ]);

        $p1_features = [
            ['name' => '1 User', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'OPD Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Staff Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Appointment Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Billing System Integrated', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Comprehensive Patient Record', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Digital Prescription', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Ledger Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Online/Offline Consultation', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Multi Clinic Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Multi Vendor for Lab Test', 'included_monthly' => false, 'included_yearly' => false],
            ['name' => 'Role Management', 'included_monthly' => false, 'included_yearly' => false],
            ['name' => 'GMB Optimization', 'included_monthly' => false, 'included_yearly' => false],
            ['name' => 'Landing Page', 'included_monthly' => false, 'included_yearly' => true, 'text_monthly' => 'Landing Page', 'text_yearly' => 'Landing Page'],
        ];

        LandingItem::create([
            'section_key' => 'pricing',
            'title' => 'Package 1',
            'price_monthly' => 799,
            'price_yearly' => 7990,
            'price_original_monthly' => null,
            'price_original_yearly' => 9588,
            'features' => $p1_features,
            'link_text' => 'Get Started',
            'link' => '#',
            'order' => 0,
        ]);

        $p2_features = [
            ['name' => '3 Users', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'OPD Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Staff Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Appointment Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Billing System Integrated', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Comprehensive Patient Record', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Digital Prescription', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Ledger Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Online/Offline Consultation', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Multi Clinic Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Multi Vendor for Lab Test', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Role Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'GMB Optimization', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Landing Page', 'included_monthly' => false, 'included_yearly' => true, 'text_monthly' => 'Static Pages', 'text_yearly' => 'Static Pages'],
        ];

        LandingItem::create([
            'section_key' => 'pricing',
            'title' => 'Package 2',
            'price_monthly' => 1299,
            'price_yearly' => 12990,
            'price_original_monthly' => null,
            'price_original_yearly' => 15588,
            'features' => $p2_features,
            'badge' => '✦ Most Popular',
            'link_text' => 'Get Started',
            'link' => '#',
            'order' => 1,
        ]);

        $p3_features = [
            ['name' => '5 Users', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'OPD Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Staff Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Appointment Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Billing System Integrated', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Comprehensive Patient Record', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Digital Prescription', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Ledger Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Online/Offline Consultation', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Multi Clinic Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Multi Vendor for Lab Test', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Role Management', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'GMB Optimization', 'included_monthly' => true, 'included_yearly' => true],
            ['name' => 'Landing Page', 'included_monthly' => false, 'included_yearly' => true, 'text_monthly' => 'Dynamic Pages', 'text_yearly' => 'Dynamic Pages'],
        ];

        LandingItem::create([
            'section_key' => 'pricing',
            'title' => 'Package 3',
            'price_monthly' => 2499,
            'price_yearly' => 24990,
            'price_original_monthly' => null,
            'price_original_yearly' => 29988,
            'features' => $p3_features,
            'link_text' => 'Get Started',
            'link' => '#',
            'order' => 2,
        ]);

        // 7. FAQ SECTION
        LandingSection::create([
            'key' => 'faq',
            'name' => 'FAQ',
            'title' => 'Frequently Asked Questions',
            'subtitle' => 'Still have questions? We\'re here to help.',
            'is_active' => true,
            'metadata' => [
                'badge' => 'FAQ',
                'contact_btn_text' => 'Contact Support',
                'contact_btn_link' => '/contact',
            ],
        ]);

        $faqs = [
            ['What is this healthcare management system?', 'This platform is a digital healthcare management system designed to streamline patient records, doctor information, appointments, and medical history in one secure place.', 'open'],
            ['How can I register as a patient?', 'You can register by filling out the patient registration form with your basic details such as name, contact number, email, and medical information.', ''],
            ['Can I book appointments online?', 'Yes, patients can easily book appointments with doctors through the platform by selecting their preferred date and time.', ''],
            ['Can I get digital prescriptions?', 'Yes, doctors can generate and share digital prescriptions which can be viewed and downloaded by patients anytime.', ''],
            ['How do doctors manage their profiles?', 'Doctors can update their profile details, specialization, availability, and consultation timings through their dashboard', ''],
        ];

        foreach ($faqs as $index => $faq) {
            LandingItem::create([
                'section_key' => 'faq',
                'title' => $faq[0],
                'description' => $faq[1],
                'badge' => $faq[2],
                'order' => $index,
            ]);
        }

        // 8. CTA SECTION
        LandingSection::create([
            'key' => 'cta',
            'name' => 'CTA Banner',
            'title' => 'Ready to Transform Your Clinic?',
            'subtitle' => 'Join 2,000+ healthcare providers who\'ve already made the switch. Start your free 14-day trial.',
            'is_active' => true,
            'metadata' => [
                'primary_btn_text' => 'Start Free Trial',
                'primary_btn_link' => '/contact',
                'secondary_btn_text' => 'Request a Demo',
                'secondary_btn_link' => '#demoModal',
            ],
        ]);
    }
}
