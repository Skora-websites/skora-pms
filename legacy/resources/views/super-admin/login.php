<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Notification</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">
    <?php include('inc/header-links.php'); ?>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: "Poppins", sans-serif;
            background-color: #f8f9fa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background-color: #fff;
            width: 800px;
            max-width: 100%;
            height: 500px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            display: flex;
        }
        .forms-container {
            width: 50%;
            position: relative;
            overflow: hidden;
        }
        .form-control {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 20px;
            transition: transform 0.5s ease-in-out;
        }
        .form-control h2 {
            font-size: 1.8rem;
            margin-bottom: 20px;
            text-align: center;
            color: #333;
        }
        .form-control form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .form-control .socials {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 15px;
        }
        .form-control .socials i {
            padding: 8px;
            color: #fff;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
        }
        .form-control .socials .ri-logout-box-r-line.facebook {
            background-color: #3b5998;
        }
        .form-control .socials .ri-logout-box-r-line.google {
            background-color: #db4a39;
        }
        .form-control .socials .ri-logout-box-r-line.linkedin {
            background-color: #0e76a8;
        }
        .form-control span {
            text-align: center;
            color: #666;
            margin: 10px 0;
        }
        .signup-form {
            transform: translateX(100%);
            opacity: 0;
        }
        .signin-form {
            transform: translateX(0);
            opacity: 1;
        }
        .intros-container {
            width: 50%;
            position: relative;
            overflow: hidden;
        }
        .intro-control {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            color: #fff;
           background: linear-gradient(#0085fe, #00c6f082);
  box-shadow: 0px 3px 0px 1px rgb(119 159 230);
            transition: transform 0.5s ease-in-out;
        }
        .intro-control h2 {
            font-size: 1.8rem;
            margin-bottom: 10px;
        }
        .intro-control p {
            font-size: 1rem;
            margin-bottom: 20px;
            text-align: center;
        }
        .intro-control button {
            padding: 10px 30px;
            border: none;
            border-radius: 25px;
           background: linear-gradient(#0085fe, #00c6f082);
  box-shadow: 0px 3px 0px 1px rgb(119 159 230);
            color: #fff;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .intro-control button:hover {
           background: linear-gradient(#0085fe, #00c6f082);
  box-shadow: 0px 3px 0px 1px rgb(119 159 230);
        }
        .signin-intro {
            transform: translateX(0);
            opacity: 1;
        }
        .signup-intro {
            transform: translateX(-100%);
            opacity: 0;
        }
        .change .signup-form {
            transform: translateX(0);
            opacity: 1;
        }
        .change .signin-form {
            transform: translateX(-100%);
            opacity: 0;
        }
        .change .signin-intro {
            transform: translateX(100%);
            opacity: 0;
        }
        .change .signup-intro {
            transform: translateX(0);
            opacity: 1;
            background: linear-gradient(#0085fe, #00c6f082);
  box-shadow: 0px 3px 0px 1px rgb(119 159 230);
        }
        .change .signup-intro button {
            background-color: #2563eb;
        }
        .change .signup-intro button:hover {
            background-color: #1d4ed8;
        }
        @media (max-width: 576px) {
            .container {
                flex-direction: column;
                height: auto;
                min-height: 100vh;
            }
            .forms-container, .intros-container {
                width: 100%;
                height: 50vh;
            }
            .form-control, .intro-control {
                position: relative;
            }
            .signup-form {
                transform: translateX(0);
                opacity: 0;
                display: none;
            }
            .signin-form {
                display: block;
            }
            .change .signup-form {
                display: block;
            }
            .change .signin-form {
                display: none;
            }
            .signin-intro, .signup-intro {
                transform: translateX(0);
            }
            .change .signin-intro {
                display: none;
            }
            .change .signup-intro {
                display: flex;
            }
        }
    </style>
</head>
<body>
    <div class="layout-wrapper layout-content-navbar">
        <div class="layout-container">
            <?php include('inc/sidebar.php'); ?>
            <div class="layout-page">
                <?php include('inc/header.php'); ?>
                <div class="content-wrapper">
                    <div class="container-xxl flex-grow-1 container-p-y">
                        <div class="container">
                            <div class="forms-container">
                                <div class="form-control signup-form">
                                    <form action="#">
                                        <h2>Signup</h2>
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-logout-box-r-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" name="username" id="username" class="form-control" placeholder="Username" required />
                                                    <label for="username">Username</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-logout-box-r-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="email" name="email" id="email" class="form-control" placeholder="Email" required />
                                                    <label for="email">Email</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-logout-box-r-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="password" name="password" id="password" class="form-control" placeholder="Password" required />
                                                    <label for="password">Password</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-logout-box-r-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="password" name="confirm_password" id="confirm_password" class="form-control" placeholder="Confirm Password" required />
                                                    <label for="confirm_password">Confirm Password</label>
                                                </div>
                                            </div>
                                        </div>
                                        <button class="btn btn-primary">Signup</button>
                                    </form>
                                    <span>or signup with</span>
                                    <div class="socials">
                                        <i class="ri-logout-box-r-line facebook"></i>
                                        <i class="ri-logout-box-r-line google"></i>
                                        <i class="ri-logout-box-r-line linkedin"></i>
                                    </div>
                                </div>
                                <div class="form-control signin-form">
                                    <form action="#">
                                        <h2>Signin</h2>
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-logout-box-r-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="text" name="username" id="signin_username" class="form-control" placeholder="Username" required />
                                                    <label for="signin_username">Username</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-4">
                                            <div class="input-group input-group-merge">
                                                <span class="input-group-text"><i class="ri-logout-box-r-line ri-20px"></i></span>
                                                <div class="form-floating form-floating-outline">
                                                    <input type="password" name="password" id="signin_password" class="form-control" placeholder="Password" required />
                                                    <label for="signin_password">Password</label>
                                                </div>
                                            </div>
                                        </div>
                                        <button class="btn btn-primary">Signin</button>
                                    </form>
                                    <span>or signin with</span>
                                    <div class="socials">
                                        <i class="ri-logout-box-r-line facebook"></i>
                                        <i class="ri-logout-box-r-line google"></i>
                                        <i class="ri-logout-box-r-line linkedin"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="intros-container">
                                <div class="intro-control signin-intro">
                                    <h2>Welcome back!</h2>
                                    <p>Welcome back! We are so happy to have you here. It's great to see you again. We hope you had a safe and enjoyable time away.</p>
                                    <button id="signup-btn" class="btn btn-outline-light">No account yet? Signup.</button>
                                </div>
                                <div class="intro-control signup-intro">
                                    <h2>Come join us!</h2>
                                    <p>We are so excited to have you here. If you haven't already, create an account to get access to exclusive offers, rewards, and discounts.</p>
                                    <button id="signin-btn" class="btn btn-outline-light">Already have an account? Signin.</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php include('inc/footer.php'); ?>
                    <div class="content-backdrop fade"></div>
                </div>
            </div>
        </div>
        <div class="layout-overlay layout-menu-toggle"></div>
        <div class="drag-target"></div>
    </div>
    <?php include('inc/footer-links.php'); ?>
    <script>
        const signupBtn = document.getElementById("signup-btn");
        const signinBtn = document.getElementById("signin-btn");
        const mainContainer = document.querySelector(".container");
        signupBtn.addEventListener("click", () => {
            mainContainer.classList.toggle("change");
        });
        signinBtn.addEventListener("click", () => {
            mainContainer.classList.toggle("change");
        });
    </script>
</body>
</html>