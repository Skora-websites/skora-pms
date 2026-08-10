<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr"
      data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Setting</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @include('doctor.inc.header-links')
@include('super-admin.inc.custom-css')


<style>
    
</style>
</head>

<body>
<div class="layout-wrapper layout-content-navbar">
  <div class="layout-container">
    @include('doctor.inc.sidebar')
    <div class="layout-page">
      @include('doctor.inc.header')

      <div class="content-wrapper">
        <div class="container-xxl flex-grow-1">
                    <h4 class="fw-bold mb-3 mt-2 text-primary"><img src="{{ asset('assets/img/dashboard/register.png') }}" alt=""  style="width: 40px; height: 40px;"> Patient Registration</h4>
                
                <div class=" d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                    <div class="gap-2">
                        <div class="search-set">
                            <div class="d-flex align-items-center flex-wrap gap-2">
                                <div class="table-search d-flex align-items-center mb-0">
                                    <div class="search-input">
                                        <a href="javascript:void(0);" class="btn-searchset"></a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class=" right-content  flex-wrap">
                            <div class="input-icon-start position-relative">
                                <span class="input-icon-addon text-dark">
                                    <i class="ti ti-calendar-event"></i>
                                </span>
                                <input type="text" class="form-control form-control-sm bookingrange" placeholder="Seatch Here....">
                            </div>
                        </div>
                    </div>

                    <div class="text-end d-flex">
                        <a href="javascript:void(0);" class="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#staticBackdrop"><i class="menu-icon tf-icons ri-user-add-line"></i>  New Registration </a>
                    </div>
                </div>

              <div class="card mb-6">
                <div class="card-header d-flex justify-content-between align-items-center pb-0">
                <h5 class="mb-0 text-white fw-bold"><img src="{{ asset('assets/img/dashboard/total-registration.png') }}" alt="" style="width: 35px; height: 35px;">  All Patient</h5>
            
             <div class="btn-group">
                <button type="button" class="btn btn-lg btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 6px 35px;">
                      <i class="icofont-download me-2 fs-6"></i>  Export
                </button>
                <ul class="dropdown-menu">
                    <li>
                        <a class="dropdown-item"
                        href=" " onclick="return confirm('Do you want to export Excel file?');">
                              <i class="ri-file-excel-2-line text-success me-2"></i> Excel
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item"
                        href=""onclick="return confirm('Do you want to export PDF file?');">
                           <i class="ri-file-pdf-2-line text-danger me-2"></i> PDF
                        </a>
                    </li>
                </ul>
            </div>

            </div>
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="selectAll" /></th>
                                <th class="px-2 sortable" onclick="sortTable(1)">Date & Time <i class="fas fa-sort"></i></th>
                                <th class="px-2 sortable" onclick="sortTable(2)">Patient <i class="fas fa-sort"></i></th>
                                <th class="px-2 sortable" onclick="sortTable(3)">Email <i class="fas fa-sort"></i></th>
                                <th class="px-2 sortable" onclick="sortTable(4)">Gender <i class="fas fa-sort"></i></th>
                                <th class="px-2 sortable" onclick="sortTable(5)">Address <i class="fas fa-sort"></i></th>
                                <th class="px-2 sortable" onclick="sortTable(6)">Mobile<i class="fas fa-sort"></i></th>
                                <th class="px-2 sortable" onclick="sortTable(7)">Referred By <i class="fas fa-sort"></i></th>
                                <th class="px-2 sortable" onclick="sortTable(8)">Status <i class="fas fa-sort"></i></th>
                                <th class="px-2 sortable" onclick="sortTable(9)">Actions <i class="fas fa-sort"></i></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="checkbox" class="row-checkbox" /></td>
                                <td>30 Apr 2025 - 09:30 AM</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar avatar-sm me-3">
                                            <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Avatar" class="rounded-circle" />
                                        </div>
                                        <div>
                                            <h6 class="mb-0 text-truncate">Amit Sharma</h6>
                                            <small class="text-muted">@amitsharma</small>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-truncate">amit.sharma@example.com</td>
                                <td class="text-truncate">
                                    <div class="d-flex align-items-center">
                                        <i class="ri-user-line ri-22px text-primary me-2"></i>
                                        <span>Male</span>
                                    </div>
                                </td>
                                <td class="text-truncate">123, MG Road, Delhi</td>
                                <td>9876543210</td>
                                <td class="text-truncate">Dr. Jordan Stevenson</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-sm btn-primary" title="View">
                                            <i class="ri-eye-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" title="Edit">
                                            <i class="ri-edit-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" title="Delete">
                                            <i class="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><input type="checkbox" class="row-checkbox" /></td>
                                <td class="text-truncate">30 Apr 2025 - 09:30 AM</td>

                                <td>                                    
                                    <div class="d-flex align-items-center">
                                        <div class="avatar avatar-sm me-3">
                                            <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Avatar" class="rounded-circle" />
                                        </div>
                                        <div>
                                            <h6 class="mb-0 text-truncate">Priya Verma</h6>
                                            <small class="text-muted">@priyaverma</small>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-truncate">priya.verma@example.com</td>
                                <td class="text-truncate">
                                    <div class="d-flex align-items-center">
                                        <i class="ri-user-line ri-22px text-primary me-2"></i>
                                        <span>Female</span>
                                    </div>
                                </td>
                                <td class="text-truncate">456, Park Street, Mumbai</td>
                                <td>8765432109</td>
                                <td class="text-truncate">Dr. Emily Carter</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-sm btn-primary" title="View">
                                            <i class="ri-eye-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" title="Edit">
                                            <i class="ri-edit-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" title="Delete">
                                            <i class="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><input type="checkbox" class="row-checkbox" /></td>
                                <td class="text-truncate">30 Apr 2025 - 09:30 AM</td>

                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar avatar-sm me-3">
                                            <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Avatar" class="rounded-circle" />
                                        </div>
                                        <div>
                                            <h6 class="mb-0 text-truncate">Rahul Gupta</h6>
                                            <small class="text-muted">@rahulgupta</small>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-truncate">rahul.gupta@example.com</td>
                                <td class="text-truncate">
                                    <div class="d-flex align-items-center">
                                        <i class="ri-user-line ri-22px text-primary me-2"></i>
                                        <span>Male</span>
                                    </div>
                                </td>
                                <td class="text-truncate">789, Gandhi Nagar, Bangalore</td>
                                <td>7654321098</td>
                                <td class="text-truncate">-</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-sm btn-primary" title="View">
                                            <i class="ri-eye-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" title="Edit">
                                            <i class="ri-edit-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" title="Delete">
                                            <i class="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><input type="checkbox" class="row-checkbox" /></td>
                                <td class="text-truncate">30 Apr 2025 - 09:30 AM</td>

                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar avatar-sm me-3">
                                            <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Avatar" class="rounded-circle" />
                                        </div>
                                        <div>
                                            <h6 class="mb-0 text-truncate">Anjali Singh</h6>
                                            <small class="text-muted">@anjalisingh</small>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-truncate">anjali.singh@example.com</td>
                                <td class="text-truncate">
                                    <div class="d-flex align-items-center">
                                        <i class="ri-user-line ri-22px text-primary me-2"></i>
                                        <span>Female</span>
                                    </div>
                                </td>
                                <td class="text-truncate">101, Lake View, Kolkata</td>
                                <td>6543210987</td>
                                <td class="text-truncate">Dr. Jordan Stevenson</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-sm btn-primary" title="View">
                                            <i class="ri-eye-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" title="Edit">
                                            <i class="ri-edit-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" title="Delete">
                                            <i class="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><input type="checkbox" class="row-checkbox" /></td>
                                <td class="text-truncate">30 Apr 2025 - 09:30 AM</td>

                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar avatar-sm me-3">
                                            <img src="{{ asset('assets/img/dashboard/doctor.png') }}" alt="Avatar" class="rounded-circle" />
                                        </div>
                                        <div>
                                            <h6 class="mb-0 text-truncate">Vikram Patel</h6>
                                            <small class="text-muted">@vikrampatel</small>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-truncate">vikram.patel@example.com</td>
                                <td class="text-truncate">
                                    <div class="d-flex align-items-center">
                                        <i class="ri-user-line ri-22px text-primary me-2"></i>
                                        <span>Other</span>
                                    </div>
                                </td>
                                <td class="text-truncate">321, Sector 12, Chandigarh</td>
                                <td>5432109876</td>
                                <td class="text-truncate">-</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-sm btn-primary" title="View">
                                            <i class="ri-eye-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" title="Edit">
                                            <i class="ri-edit-line"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" title="Delete">
                                            <i class="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

              <div id="resp" class="mt-3"></div>
            </div>
        </div>

        @include('doctor.inc.footer')
        <div class="content-backdrop fade"></div>
      </div>
    </div>
  </div>


  {{-- patient Registration form --}}
  <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header rounded card-header bg-doctor-x">
                <h4 class="modal-title fw-bold text-primary" id="staticBackdropLabel"> <img src="{{ asset('assets/img/dashboard/register.png') }}" alt="" style="width: 25px; height: 25px;"> Patient Registration Form</h4>
                <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="mainForm">
                    <!-- Step 1: Personal Info -->
                    <div class="row">
                            <div class="row">
                                <!-- Referred By -->
                                <div class="col-sm-12 col-lg-6 mb-4">
                                    <div class="input-group input-group-merge">
                                        <div class="form-floating form-floating-outline">
                                            <input type="text" class="form-control" id="referred-by" placeholder="Referred By" name="referred_by">
                                            <label for="referred-by">Referred By</label>
                                        </div>
                                    </div>
                                </div>
                                <!-- Name -->
                                <div class="col-sm-12 col-lg-6 mb-4">
                                    <div class="input-group input-group-merge">
                                        <div class="form-floating form-floating-outline">
                                            <input type="text" class="form-control" id="full-name" placeholder="Full Name" name="full_name">
                                            <label for="full-name">Enter Name</label>
                                        </div>
                                    </div>
                                </div>
                                <!-- Email -->
                                <div class="col-sm-12 col-lg-6 mb-4">
                                    <div class="input-group input-group-merge">
                                        <div class="form-floating form-floating-outline">
                                            <input type="email" class="form-control" id="email" placeholder="Email Address" name="email">
                                            <label for="email">Enter Email</label>
                                        </div>
                                    </div>
                                </div>
                                <!-- Gender -->
                                <div class="col-sm-12 col-lg-6 mb-4">
                                    <div class="input-group input-group-merge">
                                        <div class="form-floating form-floating-outline">
                                            <select class="form-select" id="gender" name="gender">
                                                <option selected disabled>Select Gender</option>
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                            <label for="gender">Gender</label>
                                        </div>
                                    </div>
                                </div>
                                <!-- Address -->
                                <div class="col-lg-12 mb-4">
                                    <div class="input-group input-group-merge">
                                        <div class="form-floating form-floating-outline">
                                            <textarea class="form-control" rows="3" id="address" placeholder="Address" name="address" style="padding: calc(1.8555rem - -2px) calc(1rem - 2px);"></textarea>
                                            <label for="address">Address</label>
                                        </div>
                                    </div>
                                </div>
                      
                        <!-- Mobile -->
                            <div class="col-sm-12 col-lg-5 mb-2">
                                <div class="input-group input-group-merge">
                                    <div class="form-floating form-floating-outline">
                                        <input type="text" class="form-control" id="mobile" placeholder="Mobile Number" name="mobile" maxlength="10" oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);" minlength="10">
                                        <label for="mobile">Mobile Number</label>
                                    </div>
                                </div>
                            </div>
                    
                        </div>

                    </div>
                    <div class="col-sm-12 mt-3">
                        <button type="submit" class="btn btn-primary">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

@include('doctor.inc.footer-links')



</body>
</html>
