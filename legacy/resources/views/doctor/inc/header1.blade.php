<header class="navbar-header m-0 w-100">
    <div class="container-fluid">
        <div class="row align-items-center pt-2">

            <style>
                .dropdown-menu{
                    width: 200px !important;
                }
            </style>
            <!-- LEFT SIDE -->
            <div class="col-2 d-flex align-items-center">
                <button class="btn p-0 d-flex align-items-center justify-content-center"
                    style="width:38px; height:38px; border-radius:50%; border:1px solid #e2e8f0; background:white;"
                    onclick="history.back()">
                    <i class="ti ti-arrow-left" style="color:#0e606e; font-size:18px;"></i>
                </button>
            </div>

            <!-- CENTER SEARCH (col-7) -->
            <div class="col-7">
                {{-- <div class="position-relative">
                    <input type="text" id="navbarSearch" class="form-control"
                        placeholder="Search Patient name, email, phone number..."
                        style="border-radius:30px; padding-left:40px; height:38px;">

                    <i class="ti ti-search position-absolute"
                        style="left:15px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                    <div id="searchResults" class="shadow bg-white position-absolute w-100 mt-1 rounded-3 d-none"
                        style="z-index:999; max-height:250px; overflow-y:auto;">

                        <a href="#" class="dropdown-item py-2">Testing Now Dashboard</a>
                        <a href="#" class="dropdown-item py-2">Testing Now Appointments</a>
                        <a href="#" class="dropdown-item py-2">Testing Now Patients</a>
                        <a href="#" class="dropdown-item py-2">Testing Now Profile</a>
                        <a href="#" class="dropdown-item py-2">Testing Now Settings</a>

                    </div>
                </div> --}}
            </div>


            @php
                $user = Auth::user();
                $photo = $user && $user->profile_photo_path ? asset($user->profile_photo_path) : null;

                // Generate initials if no image
                $initials = '';
                if ($user && $user->name) {
                    $nameParts = explode(' ', trim($user->name));
                    $firstLetter = strtoupper(substr($nameParts[0], 0, 1));
                    $secondLetter = isset($nameParts[1]) ? strtoupper(substr($nameParts[1], 0, 1)) : '';
                    $initials = $firstLetter . $secondLetter;
                }
            @endphp

            <!-- RIGHT SIDE -->
            <div class="col-3 d-flex justify-content-end align-items-center gap-2">

                {{-- <!-- End Visit -->
                <button id="submitConsultation" class="d-flex align-items-center gap-2 bg-light"
                    style="background:white; border:1px solid #e2e8f0; border-radius:30px; padding:0.2rem 0.8rem; height:38px;">
                    <i class="ti ti-circle-check" style="color:#0e606e;"></i>
                    <span class="fw-medium" style="color:#0e606e;">End Visit</span>
                </button> --}}

                <!-- Profile Dropdown -->
                <div class="dropdown">
                    <button
                        class="profile-badge bg-light rounded-circle d-flex align-items-center justify-content-center border"
                        type="button" data-bs-toggle="dropdown" style="width:38px; height:38px; font-weight:600;">
                        {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}
                    </button>

                    <div class="dropdown-menu dropdown-menu-end shadow border-0 p-2">
                        <div class="d-flex align-items-center bg-light rounded-3 p-2 mb-2">
                            @if ($photo)
                                <img src="{{ $photo }}" class="rounded-circle" width="42" height="42"
                                    alt="Profile" />
                            @else
                                <div class="rounded-circle bg-white d-flex align-items-center justify-content-center border"
                                    style="width:42px; height:42px; font-weight:700; color:#333;">
                                    {{ $initials }}
                                </div>
                            @endif
                            <div class="ms-2">
                                <span class="d-block fs-13 text-capitalize">{{ $user->role ?? '' }}</span>
                                <p class="fw-medium text-dark mb-0">{{ $user->name ?? 'Guest User' }}</p>
                            </div>
                        </div>

                        <a href="{{ route('doctor.profile') }}" class="dropdown-item">
                            <i class="ti ti-user-circle me-1 align-middle"></i>
                            <span class="align-middle">Profile Settings</span>
                        </a>

                        <div class="pt-2 mt-2 border-top">
                            <a href="{{ route('doctor.logout') }}" class="dropdown-item text-danger"
                                style="background: rgb(246, 197, 197)">
                                <i class="ti ti-logout me-1 fs-17 align-middle"></i>
                                <span class="align-middle">Log Out</span>
                            </a>
                        </div>

                    </div>
                </div>

            </div>

        </div>
    </div>
</header>
<script>
    document.addEventListener("DOMContentLoaded", function() {

        const input = document.getElementById("navbarSearch");
        const results = document.getElementById("searchResults");

        if (!input) return;

        input.addEventListener("focus", () => {
            results.classList.remove("d-none");
        });

        input.addEventListener("input", function() {

            const value = this.value.toLowerCase().trim();
            let hasVisible = false;

            document.querySelectorAll("#searchResults .dropdown-item")
                .forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(value)) {
                        item.style.display = "block";
                        hasVisible = true;
                    } else {
                        item.style.display = "none";
                    }
                });

            results.classList.toggle("d-none", !hasVisible);
        });

        document.addEventListener("click", function(e) {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                results.classList.add("d-none");
            }
        });

    });
</script>


@include('layouts.notification')
