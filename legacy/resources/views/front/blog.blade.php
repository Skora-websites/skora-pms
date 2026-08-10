<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PMS || Blog</title>

    @include('front.inc.header-links')


</head>

<body>

    @include('front.inc.header-links')

    <main>
        <!-- BREADCRUMBS SECTION START -->
        <section class="ul-breadcrumb ul-section-spacing">
            <div class="ul-container">
                <ul class="ul-breadcrumb-nav">
                    <li><a href="{{ url('/') }}">Home</a></li>
                    <li><span class="separator"><i class="flaticon-right"></i></span></li>
                    <li>Blog</li>
                </ul>
                <h2 class="ul-breadcrumb-title">Our Blog</h2>
            </div>
        </section>
        <!-- BREADCRUMBS SECTION END -->

        <div class="ul-section-spacing">
            <div class="ul-container">
                <div class="row ul-bs-row row-cols-md-3 row-cols-2 row-cols-xxs-1">
                    <!-- single blog -->
                    <div class="col">
                        <div class="ul-inner-blog">
                            <div class="ul-inner-blog-img">
                                <img src="front-assets/img/blog-3.jpg" alt="image">
                                <span class="blog-tag">Marketing</span>
                            </div>
                            <div class="ul-inner-blog-txt">
                                <span class="date">12 January 2024</span>
                                <h3 class="title"><a href="">2025 Top SEO Features for Your Marketing Designs</a></h3>
                            </div>
                        </div>
                    </div>

                    <!-- single blog -->
                    <div class="col">
                        <div class="ul-inner-blog">
                            <div class="ul-inner-blog-img">
                                <img src="front-assets/img/blog-4.jpg" alt="image">
                                <span class="blog-tag">Marketing</span>
                            </div>
                            <div class="ul-inner-blog-txt">
                                <span class="date">12 January 2024</span>
                                <h3 class="title"><a href="">How to Integrate Marketing Tools into Your Design</a></h3>
                            </div>
                        </div>
                    </div>

                    <!-- single blog -->
                    <div class="col">
                        <div class="ul-inner-blog">
                            <div class="ul-inner-blog-img">
                                <img src="front-assets/img/blog-5.jpg" alt="image">
                                <span class="blog-tag">Marketing</span>
                            </div>
                            <div class="ul-inner-blog-txt">
                                <span class="date">12 January 2024</span>
                                <h3 class="title"><a href="">Innovative Business Marketing Designs for Success</a></h3>
                            </div>
                        </div>
                    </div>

                    <!-- single blog -->
                    <div class="col">
                        <div class="ul-inner-blog">
                            <div class="ul-inner-blog-img">
                                <img src="front-assets/img/blog-6.jpg" alt="image">
                                <span class="blog-tag">Marketing</span>
                            </div>
                            <div class="ul-inner-blog-txt">
                                <span class="date">12 January 2024</span>
                                <h3 class="title"><a href="">2024 Top SEO Features for Your Marketing Designs</a></h3>
                            </div>
                        </div>
                    </div>

                    <!-- single blog -->
                    <div class="col">
                        <div class="ul-inner-blog">
                            <div class="ul-inner-blog-img">
                                <img src="front-assets/img/blog-7.jpg" alt="image">
                                <span class="blog-tag">Marketing</span>
                            </div>
                            <div class="ul-inner-blog-txt">
                                <span class="date">12 January 2024</span>
                                <h3 class="title"><a href="">How to Integrate Marketing Tools into Your Design</a></h3>
                            </div>
                        </div>
                    </div>

                    <!-- single blog -->
                    <div class="col">
                        <div class="ul-inner-blog">
                            <div class="ul-inner-blog-img">
                                <img src="front-assets/img/blog-3.jpg" alt="image">
                                <span class="blog-tag">Marketing</span>
                            </div>
                            <div class="ul-inner-blog-txt">
                                <span class="date">12 January 2024</span>
                                <h3 class="title"><a href="">2025 Top SEO Features for Your Marketing Designs</a></h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>



        @include('front.inc.footer')


    @include('front.inc.footer-links')

</body>

</html>