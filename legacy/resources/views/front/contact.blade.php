@extends('layouts.frontend')
@push('styles')
@endpush
@section('content')

<body style="background: radial-gradient(circle at top left, #ff9aff, transparent 40%),
                radial-gradient(circle at top right, #00e5ff, transparent 40%),
                radial-gradient(circle at bottom left, #ffe066, transparent 40%),
                radial-gradient(circle at bottom right, #a3ffb3, transparent 40%);
            background-color: #f5f5f5;">

    <main>
        <!-- BREADCRUMBS SECTION START -->
        <section class="ul-breadcrumb ul-section-spacing">
            <div class="ul-container">
                <ul class="ul-breadcrumb-nav">
                    <li><a href="{{ url('/') }}">Home</a></li>
                    <li><span class="separator"><i class="flaticon-right"></i></span></li>
                    <li>Contact Us</li>
                </ul>
                <h2 class="ul-breadcrumb-title">Contact Us</h2>
            </div>
        </section>
        <!-- BREADCRUMBS SECTION END -->



        <div class="container my-5">
            <div class="row align-items-center">
                <!-- CONTACT FORM -->
                <div class="col-lg-5 col-md-6 mb-3">
                    <div class="ul-contact-info mb-3">
                        <div class="icon"><i class="flaticon-location fs-5"></i></div>
                        <div class="txt">
                            <h6 class="title">Our Address</h6>
                            <p class="descr mb-0">T4, NX One Corporate Park, Noida Extension - 201318</p>
                        </div>
                    </div>

                    <div class="ul-contact-info mb-3">
                        <div class="icon"><i class="flaticon-email fs-5"></i></div>
                        <div class="txt">
                            <h6 class="title">Email Address</h6>
                            <p class="descr mb-0">
                                <a href="mailto:info@skorasoft.com">info@skorasoft.com</a>
                                <a href="mailto:info@skoracares.com">info@skoracares.com</a>
                            </p>
                        </div>
                    </div>

                    <div class="ul-contact-info">
                        <div class="icon"><i class="flaticon-customer-support fs-5"></i></div>
                        <div class="txt">
                            <h6 class="title">Hours of Operation</h6>
                            <p class="descr mb-0">
                                <span>Monday - Saturday: 10 AM – 7 PM</span><br>
                                <span>Sunday: Closed</span>
                                <div class="ul-footer-widget-links">
                        </div>
                            </p>
                        </div>
                    </div>

                </div>

                <div class="col-lg-1"></div>

                <div class="col-lg-6 col-md-6 mb-3">
                    <div class="bg-white shadow rounded-3 p-3">
                        <h3 class="">Get in Touch</h3>
                        <form action="#" class="ul-contact-form-2">
                            <div class="grid">
                                <!-- firstname -->
                                <div class="form-group">
                                    <div class="position-relative">
                                        <input type="text" name="firstname" id="firstname" placeholder="First Name">
                                        <span class="field-icon"><i class="flaticon-user"></i></span>
                                    </div>
                                </div>

                                <!-- lastname -->
                                <div class="form-group">
                                    <div class="position-relative">
                                        <input type="text" name="lastname" id="lastname" placeholder="Last Name">
                                        <span class="field-icon"><i class="flaticon-user"></i></span>
                                    </div>
                                </div>

                                <!-- phone -->
                                <div class="form-group">
                                    <div class="position-relative">
                                        <input type="tel" name="phone-number" id="phone-number" placeholder="Phone Number">
                                        <span class="field-icon"><i class="flaticon-telephone-1"></i></span>
                                    </div>
                                </div>
                                <!-- email -->
                                <div class="form-group">
                                    <div class="position-relative">
                                        <input type="email" name="email" id="email" placeholder="Enter Email Address">
                                        <span class="field-icon"><i class="flaticon-email"></i></span>
                                    </div>
                                </div>
                                <!-- message -->
                                <div class="form-group">
                                    <div class="position-relative">
                                        <textarea name="message" rows="4" id="message" placeholder="Write Message..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <!-- submit btn -->
                            <button type="submit">Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>







        <!-- <div class="ul-section-spacing ul-container">
            <div class="ul-contact-infos">
                <div class="ul-contact-info">
                    <div class="icon"><i class="flaticon-location"></i></div>
                    <div class="txt">
                        <h6 class="title">Our Address</h6>
                        <p class="descr mb-0">SkoraSoft Digital Pvt. Ltd. 6th Floor, Addela Tower, Greater Noida, UP, India</p>
                    </div>
                </div>

                <div class="ul-contact-info">
                    <div class="icon"><i class="flaticon-email"></i></div>
                    <div class="txt">
                        <h6 class="title">Email Address</h6>
                        <p class="descr mb-0">
                            <a href="mailto:info@skorasoft.com">info@skorasoft.com</a>
                            <a href="mailto:sales@skorasoft.com">sales@skorasoft.com</a>
                        </p>
                    </div>
                </div>

                <div class="ul-contact-info">
                    <div class="icon"><i class="flaticon-customer-support"></i></div>
                    <div class="txt">
                        <h6 class="title">Hours of Operation</h6>
                        <p class="descr mb-0">
                            <span>Sunday-Fri: 9 AM – 6 PM</span><br>
                            <span>Saturday: 9 AM – 4 PM</span>
                        </p>
                    </div>
                </div>
            </div>
        </div> -->


        <!-- CONTACT MAP -->
        <div class="ul-contact-map">
            <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7004.515509510856!2d77.420346!3d28.622036!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cef006e7c487d%3A0xc96937d75fbfc539!2sSkoraSoft%20Digital%20Pvt.%20Ltd.%20-%20One%20Pixel%20At%20A%20Time(Greater%20Noida)!5e0!3m2!1sen!2sin!4v1759579188511!5m2!1sen!2sin" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>



    </main>
@endsection
@push('scripts')