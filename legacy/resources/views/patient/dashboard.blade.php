<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Coming Soon</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #fff;
            text-align: center;
        }

        .coming-soon {
            max-width: 600px;
            padding: 40px 20px;
        }

        .coming-soon h1 {
            font-size: 48px;
            margin-bottom: 15px;
            letter-spacing: 2px;
        }

        .coming-soon p {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 30px;
        }

        .divider {
            width: 80px;
            height: 4px;
            background: #f4c430;
            margin: 0 auto 25px;
            border-radius: 2px;
        }

        .footer-text {
            font-size: 14px;
            opacity: 0.7;
            margin-top: 40px;
        }

        .logout-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 20px;
        width: 50%;
        margin: auto;

        padding: 10px 15px;
        text-decoration: none;
        background-color: #fb794ee6; /* red */
        color: #fff;
        border-radius: 6px;

        font-size: 15px;
        font-weight: 500;

    transition: all 0.3s ease;
}

.logout-btn i {
    font-size: 18px;
}

.logout-btn:hover {
    background-color: #b52a37;
    color: #fff;
    transform: translateY(-1px);
}

.logout-btn:active {
    transform: scale(0.97);
}


    </style>
</head>
<body>

    <div class="coming-soon">
        <h1>Hii, {{ auth()->user()->name }}</h1>
        <h1>Coming Soon</h1>
        <div class="divider"></div>
        <p>
            We are working hard to bring you something amazing.<br>
            Our website will be live very soon.
        </p>

        <div class="footer-text" style="margin-bottom:20px; ">
            © {{ date('Y') }} All Rights Reserved
        </div>

        <a href="{{ route('doctor.logout') }}" class="logout-btn ">
          <i class="ti ti-logout"></i>
          <span>Please Go Logout</span>
      </a>

    </div>

</body>
</html>
