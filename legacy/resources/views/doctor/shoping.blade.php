<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Home</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">

    <!--header links  -->
    @include('doctor.inc.header-links')
       @include('doctor.inc.custom')

    <!--  -->
    <style>
    
    .card img {
        max-width: 100%;
        height: 240px !important;
    }
        .price-section {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        .discounted-price {
            font-size: 1.15rem;
            color: #00bef2;
            font-weight: bold;
        }
        .original-price {
            font-size: 0.95rem;
            color: #6c757d;
            text-decoration: line-through;
        }
        .discount-badge {
            background-color: #28a745;
            color: #fff;
            font-size: 0.85rem;
            padding: 4px 10px;
            border-radius: 20px;
            font-weight: 500;
        }
        .amount {
            font-size: 0.95rem;
            color: #6c757d;
            margin-bottom: 10px;
        }
        .rating {
            color: #ffc107;
            font-size: 0.9rem;
        }
        .rating i {
            margin-right: 2px;
        }
        .btn-primary {
            background-color: #0e606e;
            border: none;
            border-radius: 50px;
            padding: 8px 20px;
            transition: background-color 0.3s ease;
        }
        .btn-primary:hover {
            background-color: #6f3cd1;
        }
        .search-filter-section {
            background-color: #f9fcfe;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 40px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .search-input {
            border-radius: 50px;
            border: 1px solid #ced4da;
            padding: 12px 20px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .filter-btn {
            border-radius: 50px;
            padding: 10px 25px;
            margin-right: 12px;
            background-color: #172c75;
            color: #fff;
            border: none;
            transition: background-color 0.3s ease;
        }
        .filter-btn:hover {
            background-color: #0f1e4a;
        }
       
     
        .coming-soon-icon {
            font-size: 6rem;
            color: #7834f6;
            margin-bottom: 25px;
        }
    </style>

    <style>
    /* Overlay Background */
    .coming-soon-overlay {
           position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgb(38 229 18 / 20%), rgb(143 255 227 / 23%));
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    animation: fadeIn 0.6s 
ease-in-out;
    }

    /* Card Style */
    .coming-soon-content {
              background: rgb(214 197 255 / 68%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
   padding: 2px 25px 27px 25px !important;
    max-width: 500px;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.7s 
ease-out;
    }

    /* Icon */
    .coming-soon-icon i {
        font-size: 60px;
        color: #869ff9;
        animation: pulse 1.5s infinite;
    }

    /* Text Styling */
    .coming-soon-content h1 {
        color: #fff;
        font-size: 2.5rem;
        letter-spacing: 1px;
    }

    .coming-soon-content p {
        font-size: 1.1rem;
        color: #eaeaea;
    }

    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }

    /* Responsive */
    @media (max-width: 576px) {
        .coming-soon-content {
            padding: 30px 20px;
            max-width: 90%;
        }

        .coming-soon-content h1 {
            font-size: 1.8rem;
        }

        .coming-soon-icon i {
            font-size: 45px;
        }
    }
</style>

</head>
<body>
    <!-- Begin Wrapper -->
    <div class="main-wrapper">
        <!-- Topbar Start -->
        @include('doctor.inc.header')
        <!-- Topbar End -->

        <!-- Search Modal -->
        <div class="modal fade" id="searchModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content bg-transparent">
                    <div class="card shadow-none mb-0">
                        <div class="px-3 py-2 d-flex flex-row align-items-center" id="search-top">
                            <i class="ti ti-search fs-22"></i>
                            <input type="search" class="form-control border-0" placeholder="Search">
                            <button type="button" class="btn p-0" data-bs-dismiss="modal" aria-label="Close"><i class="ti ti-x fs-22"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidenav Menu Start -->
        @include('doctor.inc.sidebar')
        <!-- Sidenav Menu End -->

        <!-- Start Page Content -->
        <div class="page-wrapper">
            <!-- Start Content -->
            <div class="content pb-0">
               <div class="coming-soon-overlay" id="comingSoonOverlay">
                    <div class="coming-soon-content card text-center shadow-lg">
                        <!-- SVG Icon -->
                        <div class="coming-soon-icon mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="#0d6efd" stroke-width="4" fill="#e9f5ff"/>
                            <rect x="28" y="16" width="8" height="32" fill="#0d6efd"/>
                            <rect x="16" y="28" width="32" height="8" fill="#0d6efd"/>
                            <circle cx="48" cy="16" r="6" stroke="#0d6efd" stroke-width="2" fill="white"/>
                            <line x1="48" y1="16" x2="48" y2="12" stroke="#0d6efd" stroke-width="2"/>
                            <line x1="48" y1="16" x2="50" y2="16" stroke="#0d6efd" stroke-width="2"/>
                        </svg>
                        </div>
                        <h1 class="fw-bold text-uppercase mb-2">Coming Soon</h1>
                            <p class="text-primary mb-0">
                        Medical card shopping for doctors is under development and will be available soon.
                        </p>
                    </div>
                    </div>


                <!-- Search and Filter Section -->
                <div class="search-filter-section">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text  border-0"><i class="ti ti-search fs-20"></i></span>
                                <input type="text" class="form-control search-input" placeholder="Search Medical Cards...">
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <button class="btn filter-btn">Filter by Price</button>
                            <button class="btn filter-btn">Filter by Rating</button>
                            <button class="btn filter-btn">Filter by Category</button>
                        </div>
                    </div>
                </div>

                <!-- Cards Grid -->
                <div class="row">
                    <!-- Card 1 -->
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <img src="assets-doctor/img/1.jpg" class="card-img-top" alt="Medical Card Image">
                            <div class="card-body">
                                <h5 class="card-title">Premium Medical Card</h5>
                                <div class="price-section">
                                    <span class="discounted-price">$49.99</span>
                                    <span class="original-price">$62.49</span>
                                    <span class="discount-badge">20% Off</span>
                                </div>
                                <p class="amount">Available: 100 units</p>
                                <div class="rating">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star-half-alt"></i>
                                    (4.5)
                                </div>
                                <a href="#" class="btn btn-outline-primary mt-3 rounded">Add to Cart</a>
                            </div>
                        </div>
                    </div>
                    <!-- Card 2 -->
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <img src="assets-doctor/img/2.png" class="card-img-top" alt="Medical Card Image">
                            <div class="card-body">
                                <h5 class="card-title">Standard Health Card</h5>
                                <div class="price-section">
                                    <span class="discounted-price">$29.99</span>
                                    <span class="original-price">$37.49</span>
                                    <span class="discount-badge">20% Off</span>
                                </div>
                                <p class="amount">Available: 150 units</p>
                                <div class="rating">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="far fa-star"></i>
                                    (4.0)
                                </div>
                                <a href="#" class="btn btn-outline-primary mt-3 rounded">Add to Cart</a>
                            </div>
                        </div>
                    </div>
                    <!-- Card 3 -->
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <img src="assets-doctor/img/3.jpeg" class="card-img-top" alt="Medical Card Image">
                            <div class="card-body">
                                <h5 class="card-title">Advanced Wellness Card</h5>
                                <div class="price-section">
                                    <span class="discounted-price">$69.99</span>
                                    <span class="original-price">$87.49</span>
                                    <span class="discount-badge">20% Off</span>
                                </div>
                                <p class="amount">Available: 80 units</p>
                                <div class="rating">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    (5.0)
                                </div>
                                <a href="#" class="btn btn-outline-primary mt-3 rounded">Add to Cart</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            @include('doctor.inc.footer')
        </div>
    </div>

    @include('doctor.inc.footer-links')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const overlay = document.getElementById('comingSoonOverlay');
            overlay.addEventListener('click', function(event) {
                if (!event.target.closest('.coming-soon-content')) {
                    overlay.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>