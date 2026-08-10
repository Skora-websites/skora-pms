@extends('layouts.layout-doctor')
@section('title', 'Doctor || Profile')
@section('content')
 
    <div class="main-wrapper">
        <div class="page-wrapper">
             <div class="content">
                <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-4">
                    <div class="flex-grow-1">
                        <h4 class="fw-bold mb-0 color-doctorrx"> Your Profile </h4>
                    </div>
                </div>

               @php
                $user = Auth::user();
                $photo = $user->profile_photo_path
                    ? asset('storage/' . $user->profile_photo_path)
                    : asset('assets-doctor/img/users/default-user.jpg');
             @endphp

            <div class="card">
                <div class="row align-items-end">
                    <div class="col-xl-8 col-lg-7">
                        <div class="d-sm-flex align-items-center position-relative z-0 overflow-hidden p-3">
                            <a href="javascript:void(0);" class="avatar avatar-xxxl patient-avatar me-2 flex-shrink-0">
                           @if(!empty($user->profile_photo_path) && file_exists(public_path($user->profile_photo_path)))
                                <img src="{{ asset($user->profile_photo_path) }}" class="" width="120" height="120" alt="Profile Photo">
                            @else
                                @php
                                    $initials = strtoupper(substr($user->name, 0, 1) . substr(strstr($user->name, ' '), 1, 1));
                                @endphp
                                <div class="rounded-circle bg-light text-dark d-flex align-items-center justify-content-center" 
                                    style="width:120px; height:120px; font-size:36px; font-weight:bold;">
                                    {{ $initials }}
                                </div>
                            @endif

                            </a>
                            <div>
                                <p class="text-primary mb-1">#DR{{ str_pad($user->id, 4, '0', STR_PAD_LEFT) }}</p>
                                <h5 class="mb-1 fw-bold">{{ $user->name }}</h5>
                                <p class="mb-3">{{ $user->address ?? 'Address not available' }}</p>
                                <div class="d-flex align-items-center flex-wrap">
                                    <p class="mb-0 d-inline-flex align-items-center">
                                        <i class="ti ti-phone me-1 text-dark"></i>
                                        Phone : <span class="text-dark ms-1">{{ $user->phone ?? 'N/A' }}</span>
                                    </p>
                                    <span class="mx-2 text-light">|</span>
                                    <p class="mb-0 d-inline-flex align-items-center">
                                        <i class="ti ti-calendar-time me-1 text-dark"></i>
                                        Joined : <span class="text-dark ms-1">{{ $user->created_at->format('d M Y') }}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-4 col-lg-5">
                        <div class="p-3 text-lg-end">
                            <a href="javascript:void(0);" 
                            class="btn btn-primary fs-13 btn-md mb-1" 
                            data-bs-toggle="modal" 
                            data-bs-target="#editProfileModal">
                            <i class="ti ti-edit mr-1"></i>&nbsp; Edit Profile
                            </a>
                        </div>
                    </div>
                </div>
            </div>

        <!-- About Section -->
        <div class="card mt-3">
            <div class="card-header">
                <h5 class="fw-bold mb-0"><i class="ti ti-user-star me-1"></i>About</h5>
            </div>
            <div class="card-body pb-0">
                <div class="row">
                    <div class="col-sm-4 mb-3">
                        <strong>Email:</strong> {{ $user->email ?? 'N/A' }}
                    </div>
                    <div class="col-sm-4 mb-3">
                        <strong>DOB:</strong> {{ $user->dob ?? 'N/A' }}
                    </div>
                    <div class="col-sm-4 mb-3">
                        <strong>Gender:</strong> {{ $user->gender ?? 'N/A' }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 🧾 Edit Modal -->
        <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <form action="{{ route('update.profile', $user->id) }}" method="POST" enctype="multipart/form-data">
                        @csrf

                         <div class="modal-header rounded border-0">
                            <h5 class="modal-title fw-bold d-flex align-items-center gap-2" id="addbillingtypeLabel" style="color: #0e606e; font-weight: 700;">
                            Edit Profile
                            </h5>
                            <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label class="form-label fw-bold">Name</label>
                                    <input type="text" name="name" value="{{ $user->name }}" class="form-control" required>
                                </div>
                              
                                <div class="col-md-4">
                                    <label class="form-label fw-bold">Phone</label>
                                    <input type="text" name="phone" value="{{ $user->phone }}" class="form-control">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-bold">Gender</label>
                                    <select name="gender" class="form-select">
                                        <option value="">Select</option>
                                        <option value="Male" {{ $user->gender == 'Male' ? 'selected' : '' }}>Male</option>
                                        <option value="Female" {{ $user->gender == 'Female' ? 'selected' : '' }}>Female</option>
                                        <option value="Other" {{ $user->gender == 'Other' ? 'selected' : '' }}>Other</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-bold">Date of Birth</label>
                                    <input type="date" name="dob" value="{{ $user->dob }}" class="form-control">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-bold">Address</label>
                                    <input type="text" name="address" value="{{ $user->address }}" class="form-control">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-bold">Profile Image</label>
                                   <input type="file" name="profile_photo" class="form-control">
                                </div>

                                <hr class="my-2">

                                <div class="col-md-4">
                                    <label class="form-label fw-bold">New Password</label>
                                    <input type="password" name="new_password" class="form-control" placeholder="Enter Password">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-bold">Confirm Password</label>
                                    <input type="password" name="new_password_confirmation" class="form-control" placeholder="Enter Confirm Pass">
                                </div>
                            </div>

                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-success"><i class="ti ti-device-floppy me-1"></i>Save Changes</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        </div>
    </div>
</div>

@endsection