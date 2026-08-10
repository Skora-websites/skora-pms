@extends('layouts.frontend')
@push('styles')
@endpush
@section('content')
    <main>
        <!-- BREADCRUMBS SECTION START -->
        <section class="ul-breadcrumb ul-section-spacing">
            <div class="ul-container">
                <ul class="ul-breadcrumb-nav">
                    <li><a href="{{ url('/') }}">Home</a></li>
                    <li><span class="separator"><i class="flaticon-right"></i></span></li>
                    <li>About Company</li>
                </ul>
                <h2 class="ul-breadcrumb-title">About Company</h2>
            </div>
        </section>
        <!-- ABOUT SECTION START -->
        <section class="ul-inner-about ul-section-spacing pb-0 wow animate__fadeInUp">
            <div class="ul-container">
                <!-- txt -->
                <div class="row row-cols-md-2 row-cols-1 align-items-start gy-4 ul-inner-about-row">
                    <div class="col">
                        <div class="ul-inner-about-txt-left">
                            <span class="ul-section-sub-title">About us</span>
                            <h2 class="ul-section-title">Expertise That Drives Digital Success</h2>

                            <div class="ul-inner-about-stats">
                                <div class="ul-inner-about-stat">
                                    <p class="stat-text">By optimizing your website for search engines.</p>
                                </div>
                                <div class="ul-inner-about-stat">
                                    <p class="stat-text">Rise in revenue as more visitors convert into paying.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- <div class="col">
                        <div class="ul-inner-about-points">
                            <div class="ul-inner-about-point">
                                <img src="front-assets/img/about-point-icon-1.png" alt="Icon" class="ul-inner-about-point-icon">
                                <div>
                                    <h4 class="ul-inner-about-point-title">Community & Industry Involvement</h4>
                                    <p class="ul-inner-about-point-descr">Our e-commerce solutions are designed to create seamless online shopping experiences. From user-friendly website design to secure payment processing and inventory management.</p>
                                </div>
                            </div>
                            <div class="ul-inner-about-point">
                                <img src="front-assets/img/about-point-icon-2.png" alt="Icon" class="ul-inner-about-point-icon">
                                <div>
                                    <h4 class="ul-inner-about-point-title">Awards & Recognition</h4>
                                    <p class="ul-inner-about-point-descr">Our e-commerce solutions are designed to create seamless online shopping experiences. From user-friendly website design to secure payment processing and inventory management.</p>
                                </div>
                            </div>
                        </div>
                    </div> -->

                    <div class="col">
                        <div class="ul-inner-about-img">
                            <img src="front-assets/img/about.jpg" class="w-100" alt="Image">
                        </div>
                    </div>

                </div>


            </div>
        </section>
        <!-- ABOUT SECTION END -->


        <section class="ul-work-process ul-section-spacing overflow-hidden wow animate__fadeInUp">
            <div class="ul-container">
                <div class="ul-section-heading text-center justify-content-center">
                    <div class="left">
                        <span class="ul-section-sub-title">Work Process</span>
                        <h2 class="ul-section-title">Why PMS?</h2>
                    </div>
                </div>

                <div class="row ul-bs-row row-cols-md-2 row-cols-2 row-cols-xxs-1 ul-work-process-row">
                    <!-- single process -->
                    <div class="col">
                        <div class="ul-work-process-single">
                            <div class="ul-work-process-single-txt">
                                <!-- <h3 class="ul-work-process-single-title">Define Requirements</h3> -->
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>

                            </div>
                        </div>
                    </div>

                    <div class="col">
                        <div class="ul-work-process-single">
                            <div class="ul-work-process-single-txt">
                                <!-- <h3 class="ul-work-process-single-title">Define Requirements</h3> -->
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                                <p class="ul-work-process-single-descr"><i class="bi bi-arrow-right-circle-fill me-2"></i>In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>




        <!-- WORK PROCESS SECTION START -->
        <section class="ul-work-process ul-section-spacing overflow-hidden wow animate__fadeInUp">
            <div class="ul-container">
                <div class="ul-section-heading text-center justify-content-center">
                    <div class="left">
                        <span class="ul-section-sub-title">Work Process</span>
                        <h2 class="ul-section-title">Our Development Process</h2>
                    </div>
                </div>

                <div class="row ul-bs-row row-cols-md-3 row-cols-2 row-cols-xxs-1 ul-work-process-row">
                    <!-- single process -->
                    <div class="col">
                        <div class="ul-work-process-single">
                            <div class="ul-work-process-single-img">
                                <img src="front-assets/img/process-1.jpg" alt="Image">
                                <div class="ul-work-process-single-index"><span>1</span></div>
                            </div>

                            <div class="ul-work-process-single-txt">
                                <h3 class="ul-work-process-single-title">Define Requirements</h3>
                                <p class="ul-work-process-single-descr">In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                            </div>
                        </div>
                    </div>

                    <!-- single process -->
                    <div class="col">
                        <div class="ul-work-process-single">
                            <div class="ul-work-process-single-img">
                                <img src="front-assets/img/process-2.jpg" alt="Image">
                                <div class="ul-work-process-single-index"><span>2</span></div>
                            </div>

                            <div class="ul-work-process-single-txt">
                                <h3 class="ul-work-process-single-title">Design & Prototyping</h3>
                                <p class="ul-work-process-single-descr">In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                            </div>
                        </div>
                    </div>

                    <!-- single process -->
                    <div class="col">
                        <div class="ul-work-process-single">
                            <div class="ul-work-process-single-img">
                                <img src="front-assets/img/process-3.jpg" alt="Image">
                                <div class="ul-work-process-single-index"><span>3</span></div>
                            </div>

                            <div class="ul-work-process-single-txt">
                                <h3 class="ul-work-process-single-title">Final Solution</h3>
                                <p class="ul-work-process-single-descr">In a free hour, when our power of choice is untrammelled and when nothing prevents dolor sit amet, consectetur</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!-- WORK PROCESS SECTION END -->


        <!-- STATS SECTION START -->
        <div class="ul-stats wow animate__fadeInUp">
            <div class="ul-container">
                <div class="ul-stats-wrapper wow animate__fadeInUp">
                    <div class="ul-stats-items">
                        <div class="ul-stats-item">
                            <i class="flaticon-completed-task"></i>
                            <span class="number">6,561+</span>
                            <span class="txt">Satisfied Clients</span>
                        </div>

                        <div class="ul-stats-item">
                            <i class="flaticon-idea"></i>
                            <span class="number">600+</span>
                            <span class="txt">Finished Projects</span>
                        </div>

                        <div class="ul-stats-item">
                            <i class="flaticon-expert"></i>
                            <span class="number">250+</span>
                            <span class="txt">Skilled Experts</span>
                        </div>

                        <div class="ul-stats-item">
                            <i class="flaticon-adversting"></i>
                            <span class="number">5,980+</span>
                            <span class="txt">Media Posts</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- STATS SECTION END -->


        <!-- HISTORY SECTION START -->
        <section class="ul-history ul-section-spacing wow animate__fadeInUp">
            <div class="ul-container">
                <div class="row row-cols-md-2 row-cols-1 gy-4 ul-history-row align-items-center">
                    <!-- txt -->
                    <div class="col">
                        <div class="ul-history-txt">
                            <div class="ul-section-heading">
                                <div class="left">
                                    <span class="ul-section-sub-title">Company History</span>
                                    <h2 class="ul-section-title">Our Company History</h2>
                                </div>
                            </div>


                            <div class="ul-history-milestones">
                                <!-- single milestone -->
                                <div class="ul-history-milestone">
                                    <h3 class="ul-history-milestone-title">Community & Industry Involvement</h3>
                                    <p class="ul-history-milestone-descr">Our e-commerce solutions are designed to create seamless online shopping experiences. From user-friendly website design to secure payment processing and inventory</p>
                                </div>
                                <!-- single milestone -->
                                <div class="ul-history-milestone">
                                    <h3 class="ul-history-milestone-title">Community & Industry Involvement</h3>
                                    <p class="ul-history-milestone-descr">Our e-commerce solutions are designed to create seamless online shopping experiences. From user-friendly website design to secure payment processing and inventory</p>
                                </div>
                                <!-- single milestone -->
                                <div class="ul-history-milestone">
                                    <h3 class="ul-history-milestone-title">Community & Industry Involvement</h3>
                                    <p class="ul-history-milestone-descr">Our e-commerce solutions are designed to create seamless online shopping experiences. From user-friendly website design to secure payment processing and inventory</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- img -->
                    <div class="col">
                        <div class="ul-history-img">
                            <img src="front-assets/img/history-img.jpg" alt="Image">
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!-- HISTORY SECTION END -->


        <!-- REVIEW-CONTACT SECTION START -->
        <section class="ul-review-contact ul-section-spacing wow animate__fadeInUp">
            <!-- bg left image -->
            <div class="bg-img">
                <img src="front-assets/img/contact-review-bg-img.jpg" alt="Image">
            </div>

            <div class="ul-container">
                <div class="row ul-review-contact-row row-cols-md-2 row-cols-1 align-items-center">
                    <!-- contact -->
                    <div class="col">
                        <div class="ul-contact-form-wrapper">
                            <div>
                                <span class="ul-section-sub-title">TALK TO US</span>
                                <h2 class="ul-section-title">How May We Help You!</h2>

                                <form action="#" class="ul-contact-form">
                                    <div class="row ul-bs-row row-cols-2 row-cols-xxs-1">
                                        <div class="col">
                                            <div class="form-group">
                                                <label for="ul-contact-name">Your Name*</label>
                                                <input type="text" name="name" id="ul-contact-name" placeholder="Robot fox">
                                            </div>
                                        </div>

                                        <div class="col">
                                            <div class="form-group">
                                                <label for="ul-contact-email">Your Email*</label>
                                                <input type="email" name="email" id="ul-contact-email" placeholder="info@example.com">
                                            </div>
                                        </div>

                                        <div class="col">
                                            <div class="form-group">
                                                <label for="ul-contact-subject">Subject*</label>
                                                <input type="text" name="subject" id="ul-contact-subject" placeholder="Subject">
                                            </div>
                                        </div>

                                        <div class="col">
                                            <div class="form-group">
                                                <label for="ul-contact-phone">Your Phone*</label>
                                                <input type="tel" name="phone" id="ul-contact-phone" placeholder="+1253 457 7840">
                                            </div>
                                        </div>

                                        <div class="col-12">
                                            <div class="form-group">
                                                <label for="ul-contact-message">Message*</label>
                                                <textarea name="message" id="ul-contact-message" placeholder="Write Message"></textarea>
                                            </div>
                                        </div>

                                        <div class="col-12">
                                            <div class="form-group">
                                                <button type="submit">Send Message</button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- reviews -->
                    <div class="col">
                        <div class="ul-reviews">
                            <div>
                                <span class="ul-section-sub-title">Clients Review</span>
                                <h2 class="ul-section-title">What They Say About Our</h2>
                                <p class="ul-reviews-heading-descr">It is a long established fact that a reader will be distracted the readable content of a page when looking at layout the point of using lorem the is Ipsum less normal distribution of letters.</p>
                            </div>

                            <div class="swiper ul-reviews-slider">
                                <div class="swiper-wrapper">
                                    <!-- single slide -->
                                    <div class="swiper-slide">
                                        <div class="ul-review">
                                            <div class="top">
                                                <div class="ul-review-reviewer-img">
                                                    <img src="front-assets/img/user.jpg" alt="Reviewer Image">
                                                </div>

                                                <div class="ul-review-reviewer-info">
                                                    <h3 class="ul-review-reviewer-name">Kathryn Murphy</h3>
                                                    <h4 class="ul-review-reviewer-role">Medical Assistant</h4>
                                                    <div class="ul-review-rating">
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                    </div>
                                                </div>

                                                <div class="ul-review-quotation-icon flex-shrink-0">
                                                    <img src="front-assets/img/quotation-icon.svg" alt="quotaion-icon">
                                                </div>
                                            </div>
                                            <p class="ul-review-txt">Consectetur adipiscing elit. Integer nunc viverra laoreet est the is porta pretium metus aliquam eget maecenas porta is nunc viverra Aenean pulvinar maximus leo ”</p>
                                        </div>
                                    </div>

                                    <!-- single slide -->
                                    <div class="swiper-slide">
                                        <div class="ul-review">
                                            <div class="top">
                                                <div class="ul-review-reviewer-img">
                                                    <img src="front-assets/img/user.jpg" alt="Reviewer Image">
                                                </div>

                                                <div class="ul-review-reviewer-info">
                                                    <h3 class="ul-review-reviewer-name">Kathryn Murphy</h3>
                                                    <h4 class="ul-review-reviewer-role">Medical Assistant</h4>
                                                    <div class="ul-review-rating">
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                    </div>
                                                </div>

                                                <div class="ul-review-quotation-icon flex-shrink-0">
                                                    <img src="front-assets/img/quotation-icon.svg" alt="quotaion-icon">
                                                </div>
                                            </div>
                                            <p class="ul-review-txt">Consectetur adipiscing elit. Integer nunc viverra laoreet est the is porta pretium metus aliquam eget maecenas porta is nunc viverra Aenean pulvinar maximus leo ”</p>
                                        </div>
                                    </div>

                                    <!-- single slide -->
                                    <div class="swiper-slide">
                                        <div class="ul-review">
                                            <div class="top">
                                                <div class="ul-review-reviewer-img">
                                                    <img src="front-assets/img/user.jpg" alt="Reviewer Image">
                                                </div>

                                                <div class="ul-review-reviewer-info">
                                                    <h3 class="ul-review-reviewer-name">Kathryn Murphy</h3>
                                                    <h4 class="ul-review-reviewer-role">Medical Assistant</h4>
                                                    <div class="ul-review-rating">
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                        <i class="flaticon-star"></i>
                                                    </div>
                                                </div>

                                                <div class="ul-review-quotation-icon flex-shrink-0">
                                                    <img src="front-assets/img/quotation-icon.svg" alt="quotaion-icon">
                                                </div>
                                            </div>
                                            <p class="ul-review-txt">Consectetur adipiscing elit. Integer nunc viverra laoreet est the is porta pretium metus aliquam eget maecenas porta is nunc viverra Aenean pulvinar maximus leo ”</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="ul-reviews-slider-nav ul-slider-nav">
                                <button class="prev"><i class="flaticon-left"></i></button>
                                <button class="next"><i class="flaticon-next-2"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
@endsection