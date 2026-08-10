<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr"
      data-theme="theme-default" data-assets-path="{{ asset('assets') }}/" data-template="vertical-menu-template" data-style="light">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Manage Landing Page</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @include('super-admin.inc.header-links')
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <style>
        .section-tab-card {
            border: 1px solid rgba(0,0,0,.08);
            border-radius: 8px;
            background: #fff;
            padding: 20px;
            margin-bottom: 25px;
        }
        .nav-align-top .nav-tabs .nav-link.active {
            background-color: #0e606e !important;
            color: #fff !important;
        }
        .nav-tabs .nav-link {
            color: #0e606e;
            font-weight: 500;
        }
    </style>
</head>
<body>
<div class="layout-wrapper layout-content-navbar">
  <div class="layout-container">
    @include('super-admin.inc.sidebar')
    <div class="layout-page">
      @include('super-admin.inc.header')

      <div class="content-wrapper">
        <div class="container-xxl flex-grow-1 container-p-y">
          
          @if(session('success'))
            <div class="alert alert-success alert-dismissible" role="alert">
              {{ session('success') }}
              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          @endif

          <h4 class="py-3 mb-4"><span class="text-muted fw-light">Website /</span> Landing Page Content Management</h4>

          <div class="row">
            <div class="col-xl-12">
              <div class="nav-align-top mb-4">
                
                <!-- Tab Headers -->
                <ul class="nav nav-tabs" role="tablist">
                  @foreach($sections as $index => $sec)
                    <li class="nav-item">
                      <button type="button" class="nav-link {{ $index === 0 ? 'active' : '' }}" role="tab" data-bs-toggle="tab" data-bs-target="#tab-{{ $sec->key }}" aria-controls="tab-{{ $sec->key }}" aria-selected="{{ $index === 0 ? 'true' : 'false' }}">
                        {{ $sec->name }}
                      </button>
                    </li>
                  @endforeach
                </ul>

                <!-- Tab Contents -->
                <div class="tab-content" style="background: transparent; border: none; padding: 20px 0 0 0;">
                  @foreach($sections as $index => $sec)
                    <div class="tab-pane fade {{ $index === 0 ? 'show active' : '' }}" id="tab-{{ $sec->key }}" role="tabpanel">
                      
                      <!-- Section Settings Card -->
                      <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                          <h5 class="mb-0 text-white fw-bold">{{ $sec->name }} Header & Status</h5>
                        </div>
                        <div class="card-body mt-3">
                          <form action="{{ route('super-admin.landing-page.section.update', $sec->key) }}" method="POST">
                            @csrf
                            <div class="row">
                              
                              @if($sec->key !== 'hero' && $sec->key !== 'cta')
                                <div class="col-md-6 mb-3">
                                  <label class="form-label">Section Title / Heading</label>
                                  <input type="text" name="title" class="form-control" value="{{ $sec->title }}">
                                </div>
                                <div class="col-md-6 mb-3">
                                  <label class="form-label">Section Subtitle</label>
                                  <textarea name="subtitle" class="form-control" rows="2">{{ $sec->subtitle }}</textarea>
                                </div>
                              @endif

                              <!-- Metadata fields -->
                              @if($sec->key === 'features' || $sec->key === 'how_it_works' || $sec->key === 'products' || $sec->key === 'testimonials' || $sec->key === 'pricing' || $sec->key === 'faq')
                                <div class="col-md-6 mb-3">
                                  <label class="form-label">Badge Label (Small uppercase text on top)</label>
                                  <input type="text" name="metadata[badge]" class="form-control" value="{{ $sec->metadata['badge'] ?? '' }}">
                                </div>
                              @endif

                              @if($sec->key === 'pricing')
                                <div class="col-md-4 mb-3">
                                  <label class="form-label">Monthly Toggle Label</label>
                                  <input type="text" name="metadata[monthly_label]" class="form-control" value="{{ $sec->metadata['monthly_label'] ?? 'Monthly' }}">
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label class="form-label">Yearly Toggle Label</label>
                                  <input type="text" name="metadata[yearly_label]" class="form-control" value="{{ $sec->metadata['yearly_label'] ?? 'Yearly' }}">
                                </div>
                                <div class="col-md-4 mb-3">
                                  <label class="form-label">Discount Badge Text</label>
                                  <input type="text" name="metadata[discount_badge]" class="form-control" value="{{ $sec->metadata['discount_badge'] ?? 'Save 16.6%' }}">
                                </div>
                              @endif

                              @if($sec->key === 'faq')
                                <div class="col-md-6 mb-3">
                                  <label class="form-label">Contact Button Text</label>
                                  <input type="text" name="metadata[contact_btn_text]" class="form-control" value="{{ $sec->metadata['contact_btn_text'] ?? 'Contact Support' }}">
                                </div>
                                <div class="col-md-6 mb-3">
                                  <label class="form-label">Contact Button Link</label>
                                  <input type="text" name="metadata[contact_btn_link]" class="form-control" value="{{ $sec->metadata['contact_btn_link'] ?? '/contact' }}">
                                </div>
                              @endif

                              @if($sec->key === 'cta')
                                <div class="col-md-6 mb-3">
                                  <label class="form-label">Banner Title</label>
                                  <input type="text" name="title" class="form-control" value="{{ $sec->title }}">
                                </div>
                                <div class="col-md-6 mb-3">
                                  <label class="form-label">Banner Description</label>
                                  <textarea name="subtitle" class="form-control" rows="2">{{ $sec->subtitle }}</textarea>
                                </div>
                                <div class="col-md-3 mb-3">
                                  <label class="form-label">Primary Button Text</label>
                                  <input type="text" name="metadata[primary_btn_text]" class="form-control" value="{{ $sec->metadata['primary_btn_text'] ?? 'Start Free Trial' }}">
                                </div>
                                <div class="col-md-3 mb-3">
                                  <label class="form-label">Primary Button Link</label>
                                  <input type="text" name="metadata[primary_btn_link]" class="form-control" value="{{ $sec->metadata['primary_btn_link'] ?? '/contact' }}">
                                </div>
                                <div class="col-md-3 mb-3">
                                  <label class="form-label">Secondary Button Text</label>
                                  <input type="text" name="metadata[secondary_btn_text]" class="form-control" value="{{ $sec->metadata['secondary_btn_text'] ?? 'Request a Demo' }}">
                                </div>
                                <div class="col-md-3 mb-3">
                                  <label class="form-label">Secondary Button Link</label>
                                  <input type="text" name="metadata[secondary_btn_link]" class="form-control" value="{{ $sec->metadata['secondary_btn_link'] ?? '#demoModal' }}">
                                </div>
                              @endif

                              <div class="col-12 mb-3 mt-2">
                                <div class="form-check form-switch">
                                  <input class="form-check-input" type="checkbox" name="is_active" id="active-{{ $sec->key }}" {{ $sec->is_active ? 'checked' : '' }}>
                                  <label class="form-check-label fw-bold text-dark" for="active-{{ $sec->key }}">Active (Show this section on landing page)</label>
                                </div>
                              </div>

                              <div class="col-12 text-start">
                                <button type="submit" class="btn btn-primary btn-md">Save Header Settings</button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>

                      <!-- Sub-items List Card -->
                      @if($sec->key !== 'cta')
                        <div class="card">
                          <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0 text-white fw-bold">{{ $sec->name }} Items / Cards</h5>
                            <button class="btn btn-sm btn-success" data-bs-toggle="modal" data-bs-target="#addItemModal-{{ $sec->key }}">
                              <i class="ri-add-line"></i> Add New Item
                            </button>
                          </div>
                          <div class="table-responsive text-nowrap">
                            <table class="table table-hover">
                              <thead>
                                <tr>
                                  <th>Order</th>
                                  @if($sec->key === 'hero' || $sec->key === 'products')
                                    <th>Image</th>
                                  @endif
                                  @if($sec->key === 'features')
                                    <th>Icon / Emoji</th>
                                  @endif
                                  @if($sec->key === 'how_it_works')
                                    <th>Step No.</th>
                                  @endif
                                  <th>Title / Name</th>
                                  @if($sec->key === 'pricing')
                                    <th>Monthly Price</th>
                                    <th>Yearly Price</th>
                                  @endif
                                  @if($sec->key === 'testimonials')
                                    <th>Author Name</th>
                                    <th>Role / Location</th>
                                    <th>Stars</th>
                                  @endif
                                  <th>Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                @forelse($sec->items as $item)
                                  <tr>
                                    <td>{{ $item->order }}</td>
                                    @if($sec->key === 'hero' || $sec->key === 'products')
                                      <td>
                                        @if($item->image)
                                          <img src="{{ asset('storage/' . $item->image) }}" class="rounded" width="50" height="40" style="object-fit: cover;">
                                        @else
                                          <span class="text-muted">No image</span>
                                        @endif
                                      </td>
                                    @endif
                                    @if($sec->key === 'features')
                                      <td><span class="fs-4">{{ $item->icon }}</span></td>
                                    @endif
                                    @if($sec->key === 'how_it_works')
                                      <td><span class="badge bg-primary">{{ $item->badge }}</span></td>
                                    @endif
                                    <td><strong>{{ $item->title }}</strong></td>
                                    @if($sec->key === 'pricing')
                                      <td>₹{{ $item->price_monthly }}</td>
                                      <td>₹{{ $item->price_yearly }}</td>
                                    @endif
                                    @if($sec->key === 'testimonials')
                                      <td>{{ $item->link_text }}</td>
                                      <td>{{ $item->link }}</td>
                                      <td>{{ str_repeat('★', $item->stars) }}</td>
                                    @endif
                                    <td>
                                      <span class="badge bg-{{ $item->is_active ? 'success' : 'secondary' }}">
                                        {{ $item->is_active ? 'Active' : 'Inactive' }}
                                      </span>
                                    </td>
                                    <td>
                                      <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editItemModal-{{ $item->id }}">Edit</button>
                                      <form action="{{ route('super-admin.landing-page.item.delete', $item->id) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this item?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                                      </form>
                                    </td>
                                  </tr>
                                @empty
                                  <tr>
                                    <td colspan="10" class="text-center text-muted py-4">No items added to this section yet.</td>
                                  </tr>
                                @endforelse
                              </tbody>
                            </table>
                          </div>
                        </div>
                      @endif

                    </div>
                  @endforeach
                </div>

              </div>
            </div>
          </div>

        </div>

        @include('super-admin.inc.footer')
        <div class="content-backdrop fade"></div>
      </div>
    </div>
  </div>
</div>

<!-- Add/Edit Modals -->
@foreach($sections as $sec)
  
  <!-- Add Modal -->
  @if($sec->key !== 'cta')
    <div class="modal fade" id="addItemModal-{{ $sec->key }}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg" role="document">
        <form action="{{ route('super-admin.landing-page.item.store', $sec->key) }}" method="POST" enctype="multipart/form-data">
          @csrf
          <div class="modal-content">
            <div class="modal-header bg-success">
              <h5 class="modal-title text-white">Add New Item to {{ $sec->name }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">

                @if($sec->key === 'features')
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Icon / Emoji</label>
                    <input type="text" name="icon" class="form-control" placeholder="e.g. 📋" required>
                  </div>
                @endif

                @if($sec->key === 'how_it_works')
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Step Number / Badge</label>
                    <input type="text" name="badge" class="form-control" placeholder="e.g. 1" required>
                  </div>
                @endif

                @if($sec->key === 'products')
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Badge</label>
                    <input type="text" name="badge" class="form-control" placeholder="e.g. ⚙️ Explore Solutions" required>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Layout Style</label>
                    <select name="icon" class="form-control">
                      <option value="normal">Left Image, Right Content</option>
                      <option value="reverse">Right Image, Left Content (Reverse)</option>
                    </select>
                  </div>
                @endif

                @if($sec->key === 'testimonials')
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Stars</label>
                    <select name="stars" class="form-control">
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Author Initials (for Avatar)</label>
                    <input type="text" name="title" class="form-control" placeholder="e.g. RS" required>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Avatar Gradient (CSS style or leave blank)</label>
                    <input type="text" name="badge" class="form-control" placeholder="e.g. linear-gradient(135deg,#00c9a7,#0a6e8a)">
                  </div>
                @endif

                @if($sec->key !== 'testimonials')
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Title / Name</label>
                    <input type="text" name="title" class="form-control" placeholder="Item Title" required>
                  </div>
                @endif

                @if($sec->key === 'testimonials')
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Doctor / Author Name</label>
                    <input type="text" name="link_text" class="form-control" placeholder="e.g. Dr. Ranjit Singh" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Role / Specialization & Location</label>
                    <input type="text" name="link" class="form-control" placeholder="e.g. General Physician, Delhi" required>
                  </div>
                @endif

                @if($sec->key !== 'pricing')
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Description / Subtitle</label>
                    <textarea name="description" class="form-control" rows="3" required></textarea>
                  </div>
                @endif

                @if($sec->key === 'hero' || $sec->key === 'products')
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Button Text</label>
                    <input type="text" name="link_text" class="form-control" placeholder="e.g. Get Started">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Button Link</label>
                    <input type="text" name="link" class="form-control" placeholder="e.g. #demoModal or tel:...">
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Upload Image</label>
                    <input type="file" name="image_file" class="form-control">
                    @if($sec->key === 'hero')
                      <small class="text-danger fw-bold d-block mt-1">Recommended resolution: 600 x 500 px (Landscape format, preferably transparent PNG, Max 2MB)</small>
                    @else
                      <small class="text-danger fw-bold d-block mt-1">Recommended resolution: 500 x 350 px (Landscape format, JPEG/PNG, Max 2MB)</small>
                    @endif
                  </div>
                @endif

                @if($sec->key === 'products')
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Product Features (List) - Enter one feature per line</label>
                    <textarea name="features_list[]" class="form-control" rows="4" placeholder="Feature 1&#10;Feature 2&#10;Feature 3"></textarea>
                  </div>
                @endif

                @if($sec->key === 'pricing')
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Monthly Price (₹)</label>
                    <input type="number" step="0.01" name="price_monthly" class="form-control" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Yearly Price (₹)</label>
                    <input type="number" step="0.01" name="price_yearly" class="form-control" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Original Crossed Monthly Price (₹) (Optional)</label>
                    <input type="number" step="0.01" name="price_original_monthly" class="form-control">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Original Crossed Yearly Price (₹) (Optional)</label>
                    <input type="number" step="0.01" name="price_original_yearly" class="form-control">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Popular Badge (e.g. ✦ Most Popular or leave blank)</label>
                    <input type="text" name="badge" class="form-control" placeholder="e.g. ✦ Most Popular">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Action Button Text</label>
                    <input type="text" name="link_text" class="form-control" placeholder="e.g. Get Started" required>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Action Button Link</label>
                    <input type="text" name="link" class="form-control" placeholder="e.g. #" required>
                  </div>

                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Package Features (Manage Monthly vs Yearly settings):</label>
                    <div id="pricing-features-container-add">
                      <!-- Dynamic Pricing Feature Rows -->
                      <div class="row mb-2 pricing-feature-row align-items-center border p-2 rounded">
                        <div class="col-md-4 mb-2">
                          <label class="small text-muted mb-0">Feature Name</label>
                          <input type="text" name="pricing_features[0][name]" class="form-control form-control-sm" placeholder="e.g. OPD Management">
                        </div>
                        <div class="col-md-2 mb-2 text-center">
                          <div class="form-check d-inline-block">
                            <input class="form-check-input" type="checkbox" name="pricing_features[0][included_monthly]" value="1" checked>
                            <label class="form-check-label small">Monthly</label>
                          </div>
                        </div>
                        <div class="col-md-2 mb-2 text-center">
                          <div class="form-check d-inline-block">
                            <input class="form-check-input" type="checkbox" name="pricing_features[0][included_yearly]" value="1" checked>
                            <label class="form-check-label small">Yearly</label>
                          </div>
                        </div>
                        <div class="col-md-2 mb-2">
                          <label class="small text-muted mb-0">Text Monthly</label>
                          <input type="text" name="pricing_features[0][text_monthly]" class="form-control form-control-sm" placeholder="Optional">
                        </div>
                        <div class="col-md-2 mb-2">
                          <label class="small text-muted mb-0">Text Yearly</label>
                          <input type="text" name="pricing_features[0][text_yearly]" class="form-control form-control-sm" placeholder="Optional">
                        </div>
                      </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addPricingFeatureRow('pricing-features-container-add')">Add Feature Row</button>
                  </div>
                @endif

              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
              <button type="submit" class="btn btn-success">Add Item</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  @endif

  <!-- Edit Modals -->
  @foreach($sec->items as $item)
    <div class="modal fade" id="editItemModal-{{ $item->id }}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg" role="document">
        <form action="{{ route('super-admin.landing-page.item.update', $item->id) }}" method="POST" enctype="multipart/form-data">
          @csrf
          <div class="modal-content">
            <div class="modal-header bg-primary">
              <h5 class="modal-title text-white">Edit {{ $sec->name }} Item</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">

                @if($sec->key === 'features')
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Icon / Emoji</label>
                    <input type="text" name="icon" class="form-control" value="{{ $item->icon }}" required>
                  </div>
                @endif

                @if($sec->key === 'how_it_works')
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Step Number / Badge</label>
                    <input type="text" name="badge" class="form-control" value="{{ $item->badge }}" required>
                  </div>
                @endif

                @if($sec->key === 'products')
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Badge</label>
                    <input type="text" name="badge" class="form-control" value="{{ $item->badge }}" required>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Layout Style</label>
                    <select name="icon" class="form-control">
                      <option value="normal" {{ $item->icon === 'normal' ? 'selected' : '' }}>Left Image, Right Content</option>
                      <option value="reverse" {{ $item->icon === 'reverse' ? 'selected' : '' }}>Right Image, Left Content (Reverse)</option>
                    </select>
                  </div>
                @endif

                @if($sec->key === 'testimonials')
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Stars</label>
                    <select name="stars" class="form-control">
                      <option value="5" {{ $item->stars === 5 ? 'selected' : '' }}>5 Stars</option>
                      <option value="4" {{ $item->stars === 4 ? 'selected' : '' }}>4 Stars</option>
                      <option value="3" {{ $item->stars === 3 ? 'selected' : '' }}>3 Stars</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Author Initials (for Avatar)</label>
                    <input type="text" name="title" class="form-control" value="{{ $item->title }}" required>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Avatar Gradient (CSS style or leave blank)</label>
                    <input type="text" name="badge" class="form-control" value="{{ $item->badge }}">
                  </div>
                @endif

                @if($sec->key !== 'testimonials')
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Title / Name</label>
                    <input type="text" name="title" class="form-control" value="{{ $item->title }}" required>
                  </div>
                @endif

                @if($sec->key === 'testimonials')
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Doctor / Author Name</label>
                    <input type="text" name="link_text" class="form-control" value="{{ $item->link_text }}" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Role / Specialization & Location</label>
                    <input type="text" name="link" class="form-control" value="{{ $item->link }}" required>
                  </div>
                @endif

                @if($sec->key !== 'pricing')
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Description / Subtitle</label>
                    <textarea name="description" class="form-control" rows="3" required>{{ $item->description }}</textarea>
                  </div>
                @endif

                @if($sec->key === 'hero' || $sec->key === 'products')
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Button Text</label>
                    <input type="text" name="link_text" class="form-control" value="{{ $item->link_text }}">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Button Link</label>
                    <input type="text" name="link" class="form-control" value="{{ $item->link }}">
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Upload New Image (Leave blank to keep existing)</label>
                    <input type="file" name="image_file" class="form-control">
                    @if($sec->key === 'hero')
                      <small class="text-danger fw-bold d-block mt-1">Recommended resolution: 600 x 500 px (Landscape format, preferably transparent PNG, Max 2MB)</small>
                    @else
                      <small class="text-danger fw-bold d-block mt-1">Recommended resolution: 500 x 350 px (Landscape format, JPEG/PNG, Max 2MB)</small>
                    @endif
                    @if($item->image)
                      <div class="mt-2">
                        <img src="{{ asset('storage/' . $item->image) }}" class="rounded" width="80" height="60" style="object-fit: cover;">
                      </div>
                    @endif
                  </div>
                @endif

                @if($sec->key === 'products')
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Product Features (List) - Enter one feature per line</label>
                    <textarea name="features_list[]" class="form-control" rows="4" placeholder="Feature 1&#10;Feature 2&#10;Feature 3">{{ is_array($item->features) ? implode("\n", $item->features) : '' }}</textarea>
                  </div>
                @endif

                @if($sec->key === 'pricing')
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Monthly Price (₹)</label>
                    <input type="number" step="0.01" name="price_monthly" class="form-control" value="{{ $item->price_monthly }}" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Yearly Price (₹)</label>
                    <input type="number" step="0.01" name="price_yearly" class="form-control" value="{{ $item->price_yearly }}" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Original Crossed Monthly Price (₹) (Optional)</label>
                    <input type="number" step="0.01" name="price_original_monthly" class="form-control" value="{{ $item->price_original_monthly }}">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Original Crossed Yearly Price (₹) (Optional)</label>
                    <input type="number" step="0.01" name="price_original_yearly" class="form-control" value="{{ $item->price_original_yearly }}">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Popular Badge (e.g. ✦ Most Popular or leave blank)</label>
                    <input type="text" name="badge" class="form-control" value="{{ $item->badge }}">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Action Button Text</label>
                    <input type="text" name="link_text" class="form-control" value="{{ $item->link_text }}" required>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Action Button Link</label>
                    <input type="text" name="link" class="form-control" value="{{ $item->link }}" required>
                  </div>

                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Package Features (Manage Monthly vs Yearly settings):</label>
                    <div id="pricing-features-container-edit-{{ $item->id }}">
                      @php
                        $features_arr = is_array($item->features) ? $item->features : [];
                      @endphp
                      @foreach($features_arr as $f_idx => $feat)
                        <div class="row mb-2 pricing-feature-row align-items-center border p-2 rounded">
                          <div class="col-md-3 mb-2">
                            <label class="small text-muted mb-0">Feature Name</label>
                            <input type="text" name="pricing_features[{{ $f_idx }}][name]" class="form-control form-control-sm" value="{{ $feat['name'] ?? '' }}" placeholder="e.g. OPD Management">
                          </div>
                          <div class="col-md-2 mb-2 text-center">
                            <div class="form-check d-inline-block">
                              <input class="form-check-input" type="checkbox" name="pricing_features[{{ $f_idx }}][included_monthly]" value="1" {{ isset($feat['included_monthly']) && $feat['included_monthly'] ? 'checked' : '' }}>
                              <label class="form-check-label small">Monthly</label>
                            </div>
                          </div>
                          <div class="col-md-2 mb-2 text-center">
                            <div class="form-check d-inline-block">
                              <input class="form-check-input" type="checkbox" name="pricing_features[{{ $f_idx }}][included_yearly]" value="1" {{ isset($feat['included_yearly']) && $feat['included_yearly'] ? 'checked' : '' }}>
                              <label class="form-check-label small">Yearly</label>
                            </div>
                          </div>
                          <div class="col-md-2 mb-2">
                            <label class="small text-muted mb-0">Text Monthly</label>
                            <input type="text" name="pricing_features[{{ $f_idx }}][text_monthly]" class="form-control form-control-sm" value="{{ $feat['text_monthly'] ?? '' }}" placeholder="Optional">
                          </div>
                          <div class="col-md-2 mb-2">
                            <label class="small text-muted mb-0">Text Yearly</label>
                            <input type="text" name="pricing_features[{{ $f_idx }}][text_yearly]" class="form-control form-control-sm" value="{{ $feat['text_yearly'] ?? '' }}" placeholder="Optional">
                          </div>
                          <div class="col-md-1 mb-2 text-center">
                            <button type="button" class="btn btn-sm btn-outline-danger mt-3" onclick="$(this).closest('.pricing-feature-row').remove();">&times;</button>
                          </div>
                        </div>
                      @endforeach
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addPricingFeatureRow('pricing-features-container-edit-{{ $item->id }}')">Add Feature Row</button>
                  </div>
                @endif

                <div class="col-12 mt-2">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" name="is_active" id="item-active-{{ $item->id }}" {{ $item->is_active ? 'checked' : '' }}>
                    <label class="form-check-label" for="item-active-{{ $item->id }}">Active (Show this item inside section)</label>
                  </div>
                </div>

              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  @endforeach
@endforeach

@include('super-admin.inc.footer-links')

<script>
  function addPricingFeatureRow(containerId) {
    const container = document.getElementById(containerId);
    const index = container.getElementsByClassName('pricing-feature-row').length;
    const row = document.createElement('div');
    row.className = 'row mb-2 pricing-feature-row align-items-center border p-2 rounded';
    row.innerHTML = `
      <div class="col-md-3 mb-2">
        <label class="small text-muted mb-0">Feature Name</label>
        <input type="text" name="pricing_features[${index}][name]" class="form-control form-control-sm" placeholder="e.g. OPD Management">
      </div>
      <div class="col-md-2 mb-2 text-center">
        <div class="form-check d-inline-block">
          <input class="form-check-input" type="checkbox" name="pricing_features[${index}][included_monthly]" value="1" checked>
          <label class="form-check-label small">Monthly</label>
        </div>
      </div>
      <div class="col-md-2 mb-2 text-center">
        <div class="form-check d-inline-block">
          <input class="form-check-input" type="checkbox" name="pricing_features[${index}][included_yearly]" value="1" checked>
          <label class="form-check-label small">Yearly</label>
        </div>
      </div>
      <div class="col-md-2 mb-2">
        <label class="small text-muted mb-0">Text Monthly</label>
        <input type="text" name="pricing_features[${index}][text_monthly]" class="form-control form-control-sm" placeholder="Optional">
      </div>
      <div class="col-md-2 mb-2">
        <label class="small text-muted mb-0">Text Yearly</label>
        <input type="text" name="pricing_features[${index}][text_yearly]" class="form-control form-control-sm" placeholder="Optional">
      </div>
      <div class="col-md-1 mb-2 text-center">
        <button type="button" class="btn btn-sm btn-outline-danger mt-3" onclick="$(this).closest('.pricing-feature-row').remove();">&times;</button>
      </div>
    `;
    container.appendChild(row);
  }
</script>

</body>
</html>
