<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr"
  data-theme="theme-default" data-assets-path="assets-admin/" data-template="vertical-menu-template" data-style="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Super-admin || Add All Master</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
    @include('super-admin.inc.header-links')

  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>

<body>
  <div class="layout-wrapper layout-content-navbar">
    <div class="layout-container">
      @include('super-admin.inc.sidebar')

      <div class="layout-page">
        @include('super-admin.inc.header')

        <div class="content-wrapper">
          <div class="container-xxl flex-grow-1 container-p-y">
            <!-- Symptoms Section -->
            <div class="card mt-5 mb-5"  style="margin-bottom: 120px !important;">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title m-0">All Master Symptoms</h5>
                <button class="btn btn-primary add-btn" data-type="symptoms" data-bs-toggle="modal" data-bs-target="#addLevelModal">
                  Add Symptoms
                </button>
              </div>

              <div class="row align-items-center mb-5">
                <div class="col-lg-4 col-md-6 col-12 mb-2 mb-lg-0">
                    <div class="ms-2" style="max-width: 100%;">
                        <input type="text" id="searchBoxSymptoms" class="form-control" placeholder="Search here...">
                    </div>
                </div>

                <div class="col-lg-8 col-md-6 col-12">
                    <div class="ms-2 me-2 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
                        <form action="{{ url('/admin/symptoms/import') }}" method="POST" enctype="multipart/form-data" class="mb-2 mb-md-0">
                            @csrf
                            <div class="input-group">
                                <input type="file" name="file" class="form-control" required>
                                <button type="submit" class="btn btn-outline-danger">
                                    <i class="icofont-arrow-up me-2 fs-6"></i>Import
                                </button>
                            </div>
                        </form>
                        <a href="{{ url('/admin/symptoms/export') }}" class="btn btn-outline-success" onclick="return confirm('Do you want to export excel file?');">
                            <i class="icofont-arrow-down me-2 fs-6"></i>Export file
                        </a>
                    </div>
                </div>
            </div>

               <div class="col-xl-12 col-md-6">
                <div class="card overflow-hidden">
                  <div class="table-responsive">
                     <div id="totalSymptomsCount" class="ms-3 mb-2 fw-bold text-primary"></div> <!-- New: Total Count -->
                     <div id="symptomsLoader" class="text-center" style="display: none;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <table class="table table-sm" id="symptomsTable">
                      <thead>
                        <tr>
                          <th class="text-truncate">Sr No.</th>
                          <th class="text-truncate">Symptoms Name</th>
                          <th class="text-truncate">Actions</th>
                        </tr>
                      </thead>
                   <tbody id="symptomsData">
                   </tbody>
                    </table>
                </div>
                <div id="symptomsPagination" class="d-flex justify-content-end mt-3"></div>
            </div>
              </div>
            </div>

            <!-- Examinations Section -->
            <div class="card mt-5 mb-5"  style="margin-bottom: 120px !important;">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title m-0">All Master Examinations</h5>
                <button class="btn btn-primary add-btn" data-type="examinations" data-bs-toggle="modal" data-bs-target="#addLevelModal">
                  Add Examination
                </button>
              </div>

              <div class="row align-items-center mb-5">
                <div class="col-lg-4 col-md-6 col-12 mb-2 mb-lg-0">
                    <div class="ms-2" style="max-width: 100%;">
                        <input type="text" id="searchBoxExaminations" class="form-control" placeholder="Search here...">
                    </div>
                </div>

                <div class="col-lg-8 col-md-6 col-12">
                    <div class="ms-2 me-2 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
                        <form action="{{ url('/admin/examinations/import') }}" method="POST" enctype="multipart/form-data" class="mb-2 mb-md-0">
                            @csrf
                            <div class="input-group">
                                <input type="file" name="file" class="form-control" required>
                                <button type="submit" class="btn btn-outline-danger">
                                    <i class="icofont-arrow-up me-2 fs-6"></i>Import
                                </button>
                            </div>
                        </form>
                        <a href="{{ url('/admin/examinations/export') }}" class="btn btn-outline-success" onclick="return confirm('Do you want to export excel file?');">
                            <i class="icofont-arrow-down me-2 fs-6"></i>Export file
                        </a>
                    </div>
                </div>
            </div>

               <div class="col-xl-12 col-md-6">
                <div class="card overflow-hidden">
                  <div class="table-responsive">
                     <div id="totalExaminationsCount" class="ms-3 mb-2 fw-bold text-primary"></div> <!-- New: Total Count -->
                     <div id="examinationsLoader" class="text-center" style="display: none;">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </div>
                    <table class="table table-sm" id="examinationsTable">
                      <thead>
                        <tr>
                          <th class="text-truncate">Sr No.</th>
                          <th class="text-truncate">Examination Name</th>
                          <th class="text-truncate">Actions</th>
                        </tr>
                      </thead>
                   <tbody id="examinationsData">
                   </tbody>
                    </table>
                   
                  </div>
                    <div id="examinationsPagination" class="d-flex justify-content-end mt-3"></div>

                </div>
              </div>
            </div>

            <!-- Diagnoses Section -->
            <div class="card mt-5 mb-5"  style="margin-bottom: 120px !important;">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title m-0">All Master Diagnoses</h5>
                <button class="btn btn-primary add-btn" data-type="diagnoses" data-bs-toggle="modal" data-bs-target="#addLevelModal">
                  Add Diagnosis
                </button>
              </div>

              <div class="row align-items-center mb-5">
                <div class="col-lg-4 col-md-6 col-12 mb-2 mb-lg-0">
                    <div class="ms-2" style="max-width: 100%;">
                        <input type="text" id="searchBoxDiagnoses" class="form-control" placeholder="Search here...">
                    </div>
                </div>

                <div class="col-lg-8 col-md-6 col-12">
                    <div class="ms-2 me-2 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
                        <form action="{{ url('/admin/diagnoses/import') }}" method="POST" enctype="multipart/form-data" class="mb-2 mb-md-0">
                            @csrf
                            <div class="input-group">
                                <input type="file" name="file" class="form-control" required>
                                <button type="submit" class="btn btn-outline-danger">
                                    <i class="icofont-arrow-up me-2 fs-6"></i>Import
                                </button>
                            </div>
                        </form>
                        <a href="{{ url('/admin/diagnoses/export') }}" class="btn btn-outline-success" onclick="return confirm('Do you want to export excel file?');">
                            <i class="icofont-arrow-down me-2 fs-6"></i>Export file
                        </a>
                    </div>
                </div>
            </div>

               <div class="col-xl-12 col-md-6">
                <div class="card overflow-hidden">
                  <div class="table-responsive">
                     <div id="totalDiagnosesCount" class="ms-3 mb-2 fw-bold text-primary"></div> <!-- New: Total Count -->
                    <table class="table table-sm" id="diagnosesTable">
                      <thead>
                        <tr>
                          <th class="text-truncate">Sr No.</th>
                          <th class="text-truncate">Diagnosis Name</th>
                          <th class="text-truncate">Actions</th>
                        </tr>
                      </thead>
                   <tbody id="diagnosesData">
                   </tbody>
                    </table>
                    <div id="diagnosesPagination" class="d-flex justify-content-end mt-3"></div>
                    <div id="diagnosesLoader" class="text-center" style="display: none;">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Lab Tests Section -->
            <div class="card mt-5 mb-5"  style="margin-bottom: 120px !important;">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title m-0">All Master Lab Tests</h5>
                <button class="btn btn-primary add-btn" data-type="lab_tests" data-bs-toggle="modal" data-bs-target="#addLevelModal">
                  Add Lab Test
                </button>
              </div>

              <div class="row align-items-center mb-5">
                <div class="col-lg-4 col-md-6 col-12 mb-2 mb-lg-0">
                    <div class="ms-2" style="max-width: 100%;">
                        <input type="text" id="searchBoxLabTests" class="form-control" placeholder="Search here...">
                    </div>
                </div>

                <div class="col-lg-8 col-md-6 col-12">
                    <div class="ms-2 me-2 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
                        <form action="{{ url('/admin/lab_tests/import') }}" method="POST" enctype="multipart/form-data" class="mb-2 mb-md-0">
                            @csrf
                            <div class="input-group">
                                <input type="file" name="file" class="form-control" required>
                                <button type="submit" class="btn btn-outline-danger">
                                    <i class="icofont-arrow-up me-2 fs-6"></i>Import
                                </button>
                            </div>
                        </form>
                        <a href="{{ url('/admin/lab_tests/export') }}" class="btn btn-outline-success" onclick="return confirm('Do you want to export excel file?');">
                            <i class="icofont-arrow-down me-2 fs-6"></i>Export file
                        </a>
                    </div>
                </div>
            </div>

               <div class="col-xl-12 col-md-6">
                <div class="card overflow-hidden">
                  <div class="table-responsive">
                     <div id="totalLabTestsCount" class="ms-3 mb-2 fw-bold text-primary"></div> <!-- New: Total Count -->
                    <table class="table table-sm" id="labTestsTable">
                      <thead>
                        <tr>
                          <th class="text-truncate">Sr No.</th>
                          <th class="text-truncate">Lab Test Name</th>
                          <th class="text-truncate">Actions</th>
                        </tr>
                      </thead>
                   <tbody id="labTestsData">
                   </tbody>
                    </table>
                    <div id="labTestsPagination" class="d-flex justify-content-end mt-3"></div>
                    <div id="labTestsLoader" class="text-center" style="display: none;">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medicines Section -->
            <div class="card mt-5 mb-5"  style="margin-bottom: 120px !important;">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title m-0">All Master Medicines</h5>
                <button class="btn btn-primary add-btn" data-type="medicines" data-bs-toggle="modal" data-bs-target="#addLevelModal">
                  Add Medicine
                </button>
              </div>

              <div class="row align-items-center mb-5">
                <div class="col-lg-4 col-md-6 col-12 mb-2 mb-lg-0">
                    <div class="ms-2" style="max-width: 100%;">
                        <input type="text" id="searchBoxMedicines" class="form-control" placeholder="Search here...">
                    </div>
                </div>

                <div class="col-lg-8 col-md-6 col-12">
                    <div class="ms-2 me-2 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
                        <form action="{{ url('/admin/medicines/import') }}" method="POST" enctype="multipart/form-data" class="mb-2 mb-md-0">
                            @csrf
                            <div class="input-group">
                                <input type="file" name="file" class="form-control" required>
                                <button type="submit" class="btn btn-outline-danger">
                                    <i class="icofont-arrow-up me-2 fs-6"></i>Import
                                </button>
                            </div>
                        </form>
                        <a href="{{ url('/admin/medicines/export') }}" class="btn btn-outline-success" onclick="return confirm('Do you want to export excel file?');">
                            <i class="icofont-arrow-down me-2 fs-6"></i>Export file
                        </a>
                    </div>
                </div>
            </div>

               <div class="col-xl-12 col-md-6">
                <div class="card overflow-hidden">
                  <div class="table-responsive">
                     <div id="totalMedicinesCount" class="ms-3 mb-2 fw-bold text-primary"></div> <!-- New: Total Count -->
                     <div id="medicinesLoader" class="text-center" style="display: none;">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </div>
                    <table class="table table-sm" id="medicinesTable">
                      <thead>
                        <tr>
                          <th class="text-truncate">Sr No.</th>
                          <th class="text-truncate">Medicine Name</th>
                          <th class="text-truncate">Actions</th>
                        </tr>
                      </thead>
                   <tbody id="medicinesData">
                   </tbody>
                    </table>
                   
                  </div>
                    <div id="medicinesPagination" class="d-flex justify-content-end mt-3"></div>

                </div>
              </div>
            </div>

          </div>

          @include('super-admin.inc.footer')
          <div class="content-backdrop fade"></div>
        </div>
      </div>
    </div>
    <div class="layout-overlay layout-menu-toggle"></div>
    <div class="drag-target"></div>
  </div>

  <!-- Add Modal -->
  <div class="modal fade" id="addLevelModal" tabindex="-1" aria-labelledby="addLevelModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-md">
      <div class="modal-content">
        <form id="addForm">
          @csrf
             <div class="modal-header rounded card-header">
                <h5 class="modal-title fw-semibold" id="addModalLabel">Add Item</h5>
                <button type="button" class="btn-close rounded-circle shadow bg-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
          <div class="modal-body">
            <div class="mb-5">
              <div class="input-group input-group-merge">
                <div class="form-floating form-floating-outline">
                  <input type="text" name="name" id="addName" class="form-control" placeholder="Item Name" required />
                  <label for="addName">Item Name</label>
                </div>
              </div>
            </div>
            </div>
            <input type="hidden" name="type" id="addType">

          <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Add</button>
          </div>
        </form>
      </div>
    </div>
  </div>

    <!-- Edit Modal -->
  <div class="modal fade" id="editLevelModal" tabindex="-1" aria-labelledby="editLevelModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-md">
      <div class="modal-content">
        <form id="editForm">
          @csrf
          @method('PUT')
          <div class="modal-header">
            <h5 class="modal-title" id="editModalLabel">Edit Item</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div class="mb-5">
              <div class="input-group input-group-merge">
                <div class="form-floating form-floating-outline">
                  <input type="text" name="name" id="editName" class="form-control" placeholder="Item Name" required />
                  <label for="editName">Item Name</label>
                </div>
              </div>
            </div>
            </div>
            <input type="hidden" name="type" id="editType">
            <input type="hidden" name="id" id="editId">
           
          <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Update</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- JS -->
  <script>
    $(document).ready(function () {
      // Track current page for each section
      let currentPages = {
        symptoms: 1,
        examinations: 1,
        diagnoses: 1,
        lab_tests: 1,
        medicines: 1
      };

      // Function to capitalize first letter and handle underscores for ID mapping
      function getCapitalizedType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', '');
      }

      // Function to load data for a type with pagination and loader
      function loadData(type, tbodyId, tableId, searchBoxId, paginationId, loaderId, page = 1) {
        $(`#${loaderId}`).show();
        $.ajax({
          url: `/admin/${type}?page=${page}`,
          type: 'GET',
          success: function (response) {
            let rows = '';
            response.data.forEach((item, i) => {
              const srNo = ((page - 1) * response.per_page) + (i + 1);
              rows += `
                <tr>
                  <td>${srNo}</td>
                  <td>${item.name}</td>
                  <td>
                    <button class="btn rounded  p-1 btn-outline-success edit-btn" data-type="${type}" data-id="${item.id}">
                     <i class='ri-pencil-fill'></i>
                    </button>
                    <button class="btn rounded p-1 btn-outline-danger delete-btn" data-type="${type}" data-id="${item.id}">
                     <i class='ri-delete-bin-fill'></i>
                    </button>
                  </td>
                </tr>`;
            });
            $(`#${tbodyId}`).html(rows);

            // Update total count display
            const capitalizedType = getCapitalizedType(type);
            $(`#total${capitalizedType}Count`).text(`Total Records: ${response.total}`);

            // Render pagination links
            let paginationHtml = '<ul class="pagination">';
            if (response.prev_page_url) {
              paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${response.current_page - 1}">Previous</a></li>`;
            }
            for (let p = 1; p <= response.last_page; p++) {
              paginationHtml += `<li class="page-item ${p === response.current_page ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
            }
            if (response.next_page_url) {
              paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${response.current_page + 1}">Next</a></li>`;
            }
            paginationHtml += '</ul>';
            $(`#${paginationId}`).html(paginationHtml);

            // Pagination click handler
            $(`#${paginationId} .page-link`).on('click', function (e) {
              e.preventDefault();
              const clickedPage = $(this).data('page');
              currentPages[type] = clickedPage;
              loadData(type, tbodyId, tableId, searchBoxId, paginationId, loaderId, clickedPage);
            });

            // Client-side search (applies to current page)
            $(`#${searchBoxId}`).off('keyup').on('keyup', function () {
              let value = $(this).val().toLowerCase();
              $(`#${tableId} tbody tr`).filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
              });
            });

            $(`#${loaderId}`).hide();
          },
          error: function () {
            console.error(`Failed to load ${type}.`);
            $(`#${loaderId}`).hide();
          }
        });
      }

      // Load all sections initially
      loadData('symptoms', 'symptomsData', 'symptomsTable', 'searchBoxSymptoms', 'symptomsPagination', 'symptomsLoader', currentPages.symptoms);
      loadData('examinations', 'examinationsData', 'examinationsTable', 'searchBoxExaminations', 'examinationsPagination', 'examinationsLoader', currentPages.examinations);
      loadData('diagnoses', 'diagnosesData', 'diagnosesTable', 'searchBoxDiagnoses', 'diagnosesPagination', 'diagnosesLoader', currentPages.diagnoses);
      loadData('lab_tests', 'labTestsData', 'labTestsTable', 'searchBoxLabTests', 'labTestsPagination', 'labTestsLoader', currentPages.lab_tests);
      loadData('medicines', 'medicinesData', 'medicinesTable', 'searchBoxMedicines', 'medicinesPagination', 'medicinesLoader', currentPages.medicines);

      // Handle Add Button Click (set type and title)
      $('.add-btn').on('click', function () {
        const type = $(this).data('type');
        $('#addType').val(type);
        $('#addModalLabel').text(`Add ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`);
        $('#addName').val(''); // Reset
      });

      // Add Form Submit
      $('#addForm').on('submit', function (e) {
        e.preventDefault();
        const type = $('#addType').val();
        let formData = new FormData(this);
        $.ajax({
          url: `/admin/${type}/store`,
          type: 'POST',
          data: formData,
          contentType: false,
          processData: false,
          success: function (response) {
            showNotification(response.message, 'success');
            $('#addForm')[0].reset();
            $('#addLevelModal').modal('hide');
            const capitalizedType = getCapitalizedType(type);
            loadData(type, `${type.replace('_', '')}Data`, `${type.replace('_', '')}Table`, `searchBox${capitalizedType}`, `${type.replace('_', '')}Pagination`, `${type.replace('_', '')}Loader`, currentPages[type]);
          },
          error: function (xhr) {
            let errorMsg = 'Something went wrong';
            if (xhr.responseJSON && xhr.responseJSON.message) {
              errorMsg = xhr.responseJSON.message;
            }
            showNotification(errorMsg, 'error');
            console.error(xhr);
          }
        });
      });

      // Handle Edit Button Click
      $(document).on('click', '.edit-btn', function () {
        const type = $(this).data('type');
        const id = $(this).data('id');
        $.ajax({
          url: `/admin/${type}/${id}/edit`,
          type: 'GET',
          success: function (data) {
            $('#editName').val(data.name);
            $('#editType').val(type);
            $('#editId').val(id);
            $('#editModalLabel').text(`Edit ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`);
            $('#editLevelModal').modal('show');
          },
          error: function (xhr) {
            showNotification('Failed to fetch data.', 'error');
            console.error(xhr);
          }
        });
      });

      // Edit Form Submit
      $('#editForm').on('submit', function (e) {
        e.preventDefault();
        const type = $('#editType').val();
        const id = $('#editId').val();
        let formData = new FormData(this);
        $.ajax({
          url: `/admin/${type}/${id}`,
          type: 'POST', // Laravel handles _method=PUT
          data: formData,
          contentType: false,
          processData: false,
          success: function (response) {
            showNotification(response.message, 'success');
            $('#editForm')[0].reset();
            $('#editLevelModal').modal('hide');
            const capitalizedType = getCapitalizedType(type);
            loadData(type, `${type.replace('_', '')}Data`, `${type.replace('_', '')}Table`, `searchBox${capitalizedType}`, `${type.replace('_', '')}Pagination`, `${type.replace('_', '')}Loader`, currentPages[type]);
          },
          error: function (xhr) {
            showNotification(xhr.responseJSON?.message || 'Something went wrong', 'error');
          }
        });
      });

      // Delete
      $(document).on('click', '.delete-btn', function() {
        const type = $(this).data('type');
        const id = $(this).data('id');
        if (confirm('Are you sure you want to delete this?')) {
            $.ajax({
                url: `/admin/${type}/${id}`,
                type: 'POST',
                data: { _method: 'DELETE' },
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function (response) {
                    showNotification(response.message, 'success');
                    const capitalizedType = getCapitalizedType(type);
                    loadData(type, `${type.replace('_', '')}Data`, `${type.replace('_', '')}Table`, `searchBox${capitalizedType}`, `${type.replace('_', '')}Pagination`, `${type.replace('_', '')}Loader`, currentPages[type]);
                },
                error: function (xhr) {
                    showNotification('Error deleting item.', 'error');
                    console.log('Error:', xhr);
                }
            });
        }
      });
    });
  </script>

@include('super-admin.inc.footer-links')

</body>

</html>