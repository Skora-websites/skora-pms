<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
  <title>Doctor Admin || Dashboard</title>
  @include('super-admin.inc.header-links')
</head>
<body>
  <div class="layout-wrapper layout-content-navbar">
    <div class="layout-container">
      @include('super-admin.inc.sidebar')
      <div class="layout-page">
        @include('super-admin.inc.header')
        <div class="content-wrapper">
          <div class="container-xxl flex-grow-1 container-p-y">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title m-0">All Categories</h5>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addModal">Add Category</button>
              </div>
                {{-- <div class="row mb-3">
                <div class="col-lg-4 me-4 ms-auto col-md-6">
                  <div class="form-floating form-floating-outline">
                    <input type="text" id="searchBoxSymptoms" class="form-control" placeholder="Search Categories">
                    <label for="searchBoxSymptoms">Search Categories</label>
                  </div>
                </div>
              </div> --}}

              <div class="table-responsive">
                <div id="symptomsLoader" class="text-center" style="display: none;">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
                <table class="table table-sm" >
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Category Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @forelse($categories as $index => $category)
                      <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $category->name }}</td>
                        <td>
                          <span class="badge bg-info">{{ $category->button1 }}</span>
                          <span class="badge bg-primary">{{ $category->button2 }}</span>
                          <span class="badge bg-success">{{ $category->button3 }}</span>
                          <button type="button" class="btn btn-sm btn-outline-primary mx-1 edit-btn" 
                                  data-bs-toggle="modal" data-bs-target="#editModal" 
                                  data-id="{{ $category->id }}"
                                  data-name="{{ $category->name }}">
                            <i class="ri-pencil-fill"></i>
                          </button>
                          <button type="button" class="btn btn-sm btn-outline-danger delete-btn" 
                                  data-id="{{ $category->id }}">
                            <i class="ri-delete-bin-fill"></i>
                          </button>
                        </td>
                      </tr>
                    @empty
                      <tr>
                        <td colspan="3" class="text-center text-danger">No Records Found</td>
                      </tr>
                    @endforelse
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          @include('super-admin.inc.footer')
        </div>
      </div>
    </div>
  </div>

  <!-- Add Modal -->
  <div class="modal fade" id="addModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-semibold">Add Category</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="categoryForm">
            @csrf
            <div class="form-floating form-floating-outline mb-3">
              <input type="text" name="name" id="name" class="form-control" placeholder="Category Name" required />
              <label for="name">Category Name</label>
            </div>
            <div class="modal-footer p-0">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Modal -->
  <div class="modal fade" id="editModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-semibold">Edit Category</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="editCategoryForm">
            @csrf
            @method('PATCH')
            <input type="hidden" id="category_id" name="id">
            <div class="form-floating form-floating-outline mb-3">
              <input type="text" name="name" id="category_name" class="form-control" placeholder="Category Name" required />
              <label for="category_name">Category Name</label>
            </div>
            <div class="modal-footer p-0">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  @include('super-admin.inc.footer-links')

  <script>
    $(document).ready(function() {
      const table = $('#symptomsTable').DataTable({
        searching: true,
        paging: true,
        info: false,
        lengthChange: false,
        pageLength: 10
      });
      $('#searchBoxSymptoms').on('keyup', function() {
        table.search(this.value).draw();
      });
      $('#categoryForm').on('submit', function(e) {
        e.preventDefault();
        $.ajax({
          url: '/categories',
          type: 'POST',
          data: $(this).serialize(),
          success: function() {
            showNotification('Category Added Successfully');
            location.reload();
          },
          error: function(xhr) {
            alert('Error: ' + xhr.responseJSON.message);
          }
        });
      });
      $('.edit-btn').on('click', function() {
        const id = $(this).data('id');
        const name = $(this).data('name');
        $('#category_id').val(id);
        $('#category_name').val(name);
      });

      $('#editCategoryForm').on('submit', function(e) {
        e.preventDefault();
        const id = $('#category_id').val();
        $.ajax({
          url: `/categories/${id}`,
          type: 'POST',
          data: $(this).serialize(),
          success: function() {
            showNotification('Category Updated Successfully');

            location.reload();
          },
          error: function(xhr) {
            alert('Error: ' + xhr.responseJSON.message);
          }
        });
      });

      // Delete Category
      $('.delete-btn').on('click', function() {
        const id = $(this).data('id');
        if (confirm('Are you sure you want to delete this category?')) {
          $.ajax({
            url: `/categories/${id}`,
            type: 'POST',
            data: {
              _token: $('meta[name="csrf-token"]').attr('content'),
              _method: 'DELETE'
            },
            success: function() {
              showNotification('Category Deleted Successfully');
              location.reload();
            },
            error: function(xhr) {
              alert('Error: ' + xhr.responseJSON.message);
            }
          });
        }
      });
    });
  </script>
</body>
</html>