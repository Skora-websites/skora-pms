<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Home</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">
    <!-- Header Links -->
    @include('doctor.inc.header-links')
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
    .stats {
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 15px;
        position: relative;
    }
    .stats h6 {
        font-weight: 600;
        margin-bottom: 5px;
    }
    .stats .icon {
        font-size: 24px;
        color: #28a745;
        margin-right: 8px;
    }
    .stats .progress {
        height: 6px;
        border-radius: 5px;
        background: #e9ecef;
    }
    .stats .progress-bar {
        border-radius: 5px;
    }
    .eye-icon {
        cursor: pointer;
        position: absolute;
        right: 15px;
        top: 15px;
        color: #6c757d;
    }
    .eye-icon:hover {
        color: #000;
    }
</style>

    <style>
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .card {
            border-radius: 15px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            overflow: hidden;
        }
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 7px rgba(53, 236, 221, 0.3);
        }
        .welcome {
            /* background: linear-gradient(8deg, #35ecdd 41%, #cafff9); */
            background:white;
            color: #0b727f;
            border-radius: 15px;
            position: relative;
            overflow: hidden;
            padding: 20px;
            animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .welcome h2 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: bold;
            color: #0b727f;
        }
        .welcome p, .welcome h4 {
            font-size: 16px;
            margin-bottom: 15px;
            color: #0b727f;
        }
        .welcome button {
            border: none;
            background: linear-gradient(8deg, #0e8379 41%, #0b727f);
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 5px 0px #0c4843;
            font-weight: bold;
            color: #fff;
            transition: background 0.3s ease, color 0.3s ease, transform 0.3s ease;
        }
        .welcome button:hover {
            background: #0b727f;
            color: #fff;
            transform: translateY(-2px);
        }
        .stats {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 15px;
        }
        .stats h6 {
            margin: 5px 0;
            font-size: 18px;
            color: #0b727f;
            font-weight: 600;
            animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .stats p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
        }
        .stats .fs-1 {
            font-size: 28px;
            font-weight: bold;
            color: #0b727f;
        }
        .progress {
            width: 100%;
            background: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 10px;
        }
        .progress-bar {
            height: 10px;
            background: linear-gradient(90deg, #0b727f 41%, #0cfffc 91%);
            border-radius: 10px;
            transition: width 1s ease;
        }
        .audio-lessons .waveform {
            width: 100%;
            height: 50px;
            background: #f0f0f0;
            border-radius: 10px;
            position: relative;
            margin-top: 10px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .audio-lessons .play-btn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: #0b727f;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            color: #fff;
            font-size: 20px;
            transition: transform 0.3s ease;
        }
        .audio-lessons .play-btn:hover {
            transform: translate(-50%, -50%) scale(1.1);
        }
        .lesson-overview button {
            background: linear-gradient(135deg, #0b727f 0%, #35ecdd 100%);
            color: #fff;
            border: none;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
            transition: transform 0.3s ease, background 0.3s ease;
        }
        .lesson-overview button:hover {
            transform: scale(1.05);
            background: linear-gradient(135deg, #35ecdd 0%, #0b727f 100%);
        }
       

        .chart-container {
            position: relative;
            height: 250px;
            width: 100%;
            margin-top: 20px;
            animation: fadeIn 0.5s ease-out;
            background: linear-gradient(8deg, #35ecdd 41%, #cafff9);
            border-radius: 10px;
            padding: 10px;
        }
        .chart-container canvas {
            background:#fff;
            border-radius: 10px;
        }
        .banner {
            position: relative;
            width: 100%;
            height: 240px;
            background: url('assets-doctor/img/banner.png') no-repeat center/cover;
           border-radius: 4px 6px 4px 4px;
            animation: fadeIn 0.5s ease-out;
        }
        /* .banner::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(8deg, rgba(53, 236, 221, 0.5) 41%, rgba(202, 255, 249, 0.5));
            z-index: 1;
        } */
        .banner-content {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0b727f;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.8);
        }
        .operational-table {
            margin-top: 20px;
            animation: fadeIn 0.5s ease-out;
        }
        .operational-table table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
        }
        .operational-table th, .operational-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .operational-table th {
            background: #0f96a7;
            color: #fff !important;
            font-weight: 600;
        }
        .operational-table td {
            color: #333;
        }
        @media (max-width: 768px) {
            .welcome h2 {
                font-size: 22px;
            }
            .welcome p, .welcome h4 {
                font-size: 14px;
            }
            .stats h6 {
                font-size: 16px;
            }
            .stats p {
                font-size: 12px;
            }
            .card {
                margin-bottom: 15px;
            }
            .col-md-6, .col-md-3, .col-md-8, .col-md-4 {
                flex: 0 0 100%;
                max-width: 100%;
            }
            .operational-table table {
                font-size: 14px;
            }
            .banner {
                height: 120px;
            }
            .banner-content {
                font-size: 18px;
            }
            .chart-container {
                height: 200px;
            }
        }
    </style>
</head>
<body>
    <div class="main-wrapper">
        <!-- Topbar Start -->
        @include('doctor.inc.header')
        <!-- Sidenav Menu Start -->
        @include('doctor.inc.sidebar')
        <div class="page-wrapper">
            <div class="banner">
            </div>
            <div class="content pb-0">
                    {{-- <div class="banner-content">Welcome to Dr. Ashish Kumar's Dashboard</div> --}}

                <div class="row" style="margin: -98px 0px;">
                    <div class="col-md-6 ps-1 pe-1">
                        <div class="card welcome pb-4">
                            <p></p>
                           <h2 class="fw-bold  align-items-center">
                               <img src="{{ asset('assets-doctor/img/dashboard-dk.png') }}" alt="user" width="35" height="40" >
                               <span class="align-items-center" style="position: relative; top:10px"> Hello! </span> 
                            </h2>

                            <h4 class="mb-1">Dr. {{ Auth::user()->name }}</h4>
                          <a href="{{ route('doctor.profile') }}"> <button class="creatbtn btn text-white mt-4 w-50 m-auto rounded-5"> View Profile</button></a>
                        </div>
                    </div>
                    <div class="col-md-3 ps-1 pe-1">
                        <div class="card stats">
                            <h6>New Appointments</h6>
                            <p class="mt-3"><span class="fs-1 fw-bold">40%</span> (+20% increased)</p>
                            <div class="progress">
                                <div class="progress-bar" style="width: 40%;"></div>
                            </div>
                            <p class="mt-2 mb-3">200 patients</p>
                        </div>
                    </div>
                    <div class="col-md-3 ps-1 pe-1">
                        <div class="card stats">
                            <h6>Home Visit </h6>
                            <p class="mt-3"><span class="fs-1 fw-bold">80%</span> (+70% increased)</p>
                            <div class="progress">
                                <div class="progress-bar" style="width: 80%;"></div>
                            </div>
                            <p class="mt-2 mb-3">100 patients</p>
                        </div>
                    </div>
                    <div class="col-md-8 ps-1 pe-1">
                        <div class="card stats">
                            <h6>Total New Registrations</h6>
                            <p>40 | 5 Hrs</p>
                            <div class="chart-container">
                                <canvas id="registrationChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-4 ps-1 pe-1">
                        <div class="card stats p-4">
                        <i class="ti ti-eye eye-icon" onclick="toggleAmount('incomeAmount', this)"></i>
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-home-heart icon"></i>
                            <h6 class="mb-0">Total Income</h6>
                        </div>
                        <h5 class="fw-bold"> <span id="incomeAmount">****</span></h5>
                        <p>
                            <small class="text-muted ms-2 fw-bold">03:12 AM IST | 60 tasks | 75% Completed</small>
                        </p>
                        <div class="progress">
                            <div class="progress-bar bg-success" style="width: 75%;"></div>
                        </div>
                    </div>
                    <div class="card stats p-4">
                        <i class="ti ti-eye eye-icon" onclick="toggleAmount('expenseAmount', this)"></i>
                        <div class="d-flex align-items-center mb-2">
                            <i class="ti ti-home-heart icon text-danger"></i>
                            <h6 class="mb-0">Total Expense</h6>
                        </div>
                        <h5>  <span class="fw-bold text-danger" id="expenseAmount">****</span></h5>
                        <p>
                            <small class="text-muted ms-2 fw-bold">09:20 AM IST | 25 tasks | 40% Spent</small>
                        </p>
                        <div class="progress">
                            <div class="progress-bar text-danger" style="width: 40%;"></div>
                        </div>
                    </div>
                 </div>
                 </div>



                  
                  

                    <div class="row g-2">
                        <!-- Total Patients -->
                        <div class="col-md-3 ps-1 pe-1">
                            <div class="card stats text-center">
                                <div class="d-flex justify-content-center align-items-center mb-2">
                                    <i class="ti ti-users icon text-primary"></i>
                                    <h6 class="mb-0">Total Appointment</h6>
                                </div>
                                 <p class="mt-2"><span class="fs-1 fw-bold">440</span> </p>
                                <p class="text-muted pb-1">Active this month</p>
                            </div>
                        </div>

                        <!-- Total Billing -->
                        <div class="col-md-3 ps-1 pe-1">
                            <div class="card stats text-center audio-lessons">
                                <div class="d-flex justify-content-center align-items-center mb-2">
                                    <i class="ti ti-receipt icon text-success"></i>
                                    <h6 class="mb-0">Total Bill</h6>
                                </div>
                                <p class="mt-2"><span class="fs-1 fw-bold">40</span> </p>
                                <p class="text-muted pb-1">₹1,25,000 total generated</p>
                            </div>
                        </div>

                        <!-- Test Booking -->
                        <div class="col-md-3 ps-1 pe-1">
                            <div class="card stats text-center lesson-overview">
                                <div class="d-flex justify-content-center align-items-center mb-2">
                                    <i class="ti ti-flask icon text-warning"></i>
                                    <h6 class="mb-0">Test Booking</h6>
                                </div>
                                <p>Total test Booking : 30</p>
                                <div class="progress">
                                    <div class="progress-bar bg-warning" style="width: 65%;"></div>
                                </div>
                                <button>View Details</button>
                            </div>
                        </div>

                        <!-- Inventory -->
                        <div class="col-md-3 ps-1 pe-1">
                            <div class="card stats text-center lesson-overview">
                                <div class="d-flex justify-content-center align-items-center mb-2">
                                    <i class="ti ti-box icon text-danger"></i>
                                    <h6 class="mb-0">Inventory</h6>
                                </div>
                                <p>Comming Soon</p>
                                <div class="progress">
                                    <div class="progress-bar bg-danger" style="width: 80%;"></div>
                                </div>
                                <button>Manage Inventory</button>
                            </div>
                        </div>
                    </div>

                    <!-- Operational Visit Table -->
                    <div class="col-12 operational-table">
                        <h6 class="text-secondary mb-1 fw-bold">Operational Visit</h6>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Visit Type</th>
                                    <th>Patient ID</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>2025-10-13</td>
                                    <td>Home Visit</td>
                                    <td>P00123</td>
                                    <td>Completed</td>
                                </tr>
                                <tr>
                                    <td>2025-10-14</td>
                                    <td>Clinic Visit</td>
                                    <td>P00124</td>
                                    <td>Scheduled</td>
                                </tr>
                                <tr>
                                    <td>2025-10-14</td>
                                    <td>Follow-up</td>
                                    <td>P00125</td>
                                    <td>Pending</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </div>
            <!-- Footer Start -->
            @include('doctor.inc.footer')
        </div>
    </div>
    @include('doctor.inc.footer-links')
    <script>
        // Chart.js Configuration for Total New Registrations (Line Chart)
        const ctx = document.getElementById('registrationChart').getContext('2d');
        const registrationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'New Registrations',
                    data: [30, 40, 35, 45, 38, 42, 33],
                    fill: true,
                    backgroundColor: '#96e4e642',
                    borderColor: '#0c4843',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#0e8379'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Registrations'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuad'
                }
            }
        });
    </script>


<script>
    // Income & Expense toggle
    function toggleAmount(id, icon) {
        const el = document.getElementById(id);
        if (el.dataset.hidden === "false") {
            el.textContent = "****";
            el.dataset.hidden = "true";
            icon.classList.remove("ti-eye-off");
            icon.classList.add("ti-eye");
        } else {
            el.textContent = id === "incomeAmount" ? "₹45,000" : "₹18,500";
            el.dataset.hidden = "false";
            icon.classList.remove("ti-eye");
            icon.classList.add("ti-eye-off");
        }
    }

    // Initialize hidden state
    document.getElementById('incomeAmount').dataset.hidden = "true";
    document.getElementById('expenseAmount').dataset.hidden = "true";
</script>
</body>
</html>