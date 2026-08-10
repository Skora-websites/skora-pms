    <style>
        :root {
            --primary: #0e606edd;
            --secondary: #0e606e;
            --light-bg: #f9fcfe;
            --light-blue: #e8f4fc;
            --border-color: #0e606ed1;
        }

        .payment-card {
            background: #fff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 400px;
            margin-top: 20px;
            display: none;
        }

        .payment-card.active {
            display: block;
        }

        .payment-card h3 {
            color: #172c75;
            font-size: 1.5em;
            margin-bottom: 15px;
        }

        .payment-card button[type="submit"] {
            padding: 10px 20px;
            background-color: #172c75;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            transition: background-color 0.2s;
            width: 100%;
        }
        
        .payment-card button[type="submit"]:hover {
            background-color: #0e606e;
        }
        
        .payment-fields {
            display: none;
        }

        .payment-fields.active {
            display: block;
        }
        
        .dropdown-menu {
            border: 1px solid #dee2e6;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 0px !important;
            min-width: auto !important;
            /* min-width: 200px; */
            max-height: 300px;
            overflow-y: auto;
            background-color: #fff;
        }

        .dropdown-item {
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s;
            
        }

        .dropdown-item:hover {
            background-color: #f0f0f0;
        }

        .dropdown-search {
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
        }

        .dropdown-search input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        .dropdown-item.active {
            background-color: #0ba09d;
            color: #fff;
        }

        .input-group-text i {
            font-size: 18px;
        }

        .avatar img {
            width: 40px;
            height: 40px;
        }

       
     
        .card-header {
            background-color: var(--light-bg);
            border-bottom: 1px solid var(--border-color);
            padding: 15px 20px;
            border-radius: 10px 10px 0 0 !important;
        }
        
        .patient-details-card {
            background-color: var(--light-bg);
        }
        
        .patient-details-card .detail-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .patient-details-card .detail-item i {
            color: var(--secondary);
            font-size: 18px;
            width: 24px;
            margin-right: 10px;
        }
        
        .form-label {
            margin-bottom: 3px;
        }
        
        /* .form-control, .form-select {
            border-radius: 6px;
            padding: 10px 12px;
            border: 1px solid #d1e7f5;
            transition: all 0.3s;
        } */
        
        .form-control:focus, .form-select:focus {
            border-color: var(--secondary);
            box-shadow: 0 0 0 0.1rem #0e606ed1;
        }
        
        .input-group-text {
            background-color: var(--light-blue);
            border: 1px solid #0ba09d;
            color: var(--primary);
        }
        
        .btn-primary {
            background-color: var(--primary);
            border-color: var(--primary);
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
        }
        
        .btn-primary:hover {
            background-color: #0f1f4f;
            border-color: #0f1f4f;
        }
        
        .btn-outline-primary {
            color: var(--primary);
            border-color: var(--primary);
        }
        
        .btn-outline-primary:hover {
            background-color: var(--primary);
            color: white;
        }
        
        .dropdown-list {
            position: absolute;
            background: white;
            border: 1px solid #d1e7f5;
            border-radius: 6px;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            display: none;
        }
        
        .dropdown-item {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
        }
        
        .dropdown-item:hover, .dropdown-item.active {
            background-color: var(--light-blue);
        }
        
        .dropdown-item:last-child {
            border-bottom: none;
        }
        
        .test-list {
            max-height: 200px;
            overflow-y: auto;
            background-color: #fff;
            border: 1px solid #d1e7f5;
            border-radius: 6px;
            padding: 5px;
            display: none;
        }
        
        .test-item {
            padding: 8px 10px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
        }
        
        .test-item:hover {
            background-color: var(--light-blue);
        }
        
        .test-item:last-child {
            border-bottom: none;
        }
        
        .selected-tests-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .selected-tests-table th, 
        .selected-tests-table td {
            padding: 10px 12px;
            border: 1px solid #d1e7f5;
            text-align: left;
        }
        
        .selected-tests-table th {
            background-color: var(--light-blue);
            color: var(--primary);
            font-weight: 600;
        }
        
        .payment-method-card {
            background-color: var(--light-bg);
            border-radius: 10px;
            padding: 20px;
        }
        
        .payment-option {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            border: 1px solid #d1e7f5;
            border-radius: 6px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .payment-option:hover {
            border-color: var(--secondary);
        }
        
        .payment-option.selected {
            border-color: var(--secondary);
            background-color: var(--light-blue);
        }
        
        .payment-option input {
            margin-right: 10px;
        }
        
        .payment-fields {
            display: none;
            margin-top: 20px;
            padding: 15px;
            background-color: white;
            border-radius: 6px;
            border: 1px solid #d1e7f5;
        }
        
        .payment-fields.active {
            display: block;
        }
        
        .vendor-details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .vendor-details-table th, 
        .vendor-details-table td {
            padding: 8px 10px;
            border: 1px solid #d1e7f5;
        }
        
        .vendor-details-table th {
            background-color: var(--light-blue);
            width: 30%;
            font-weight: 600;
        }
        
        .icon-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--light-blue);
            color: var(--primary);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .icon-circle:hover {
            background-color: var(--secondary);
            color: white;
        }
        
        .search-section {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .suggestion-box {
            position: absolute;
            z-index: 1000;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 6px;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .suggestion-box li {
            padding: 8px 12px;
            list-style: none;
            cursor: pointer;
        }

        .suggestion-box li:hover {
            background-color: #f8f9fa;
        }
        
        .alert {
            padding: 12px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
        }
        
        .alert-success {
            background-color: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
        }
        
        .alert-danger {
            background-color: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
        }
        
        @media (max-width: 768px) {
            .patient-details-card .detail-item {
                margin-bottom: 15px;
            }
            
            .payment-option {
                padding: 10px;
            }




                .mobile-horizontal-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        .mobile-horizontal-scroll > div {
            min-width: 720px;
        }

        .mobile-horizontal-scroll::-webkit-scrollbar {
            height: 6px;
        }

        .mobile-horizontal-scroll::-webkit-scrollbar-thumb {
            background: #d1d1d1;
            border-radius: 10px;
        }

        }
    .card {
        padding: 0px !important;
    }
        .p-custom{
           padding: 4px 5px 6px 12px !important;
            border-bottom: 0.000001rem solid #7b79791f !important;
            z-index: 100000000 !important;
        }

        .suggestion-box {
            position: absolute;
            z-index: 1000;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 6px;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .suggestion-box li {
            padding: 8px 12px;
            list-style: none;
            cursor: pointer;
        }

        .suggestion-box li:hover {
            background-color: #f8f9fa;
        }
        
        .avatar-initials {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            color: white;
        }
        
        .bg-primary1 { background-color: #a77cf7; }
        .bg-success1 { background-color: #56f37b; }
        .bg-info1 { background-color: #85e9f9; }
        .bg-warning1 { background-color: #fddd7e; }
        .bg-danger1 { background-color: #fb929df8; }
        .bg-secondary1 { background-color: #95ccfc; }
        
        .loading-spinner {
            text-align: center;
            padding: 20px;
        }
        
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .badge-pending { background-color: #fff3cd; color: #856404; }
        .badge-completed { background-color: #d1edff; color: #004085; }
        .badge-cancelled { background-color: #f8d7da; color: #721c24; }
        .badge-in-progress { background-color: #d4edda; color: #155724; }


        #statusTabs .nav-link {
          border-radius: 5px;
    transition: all 0.3s  ease-in-out;
    color: #1b5ec2;
    background: linear-gradient(to bottom, #0cbfc317, #9aebf6a0);
    box-shadow: 2px 2px 4px rgb(11 114 127) !important;
    border: 1px solid;
    }

    #statusTabs .nav-link:hover {
        background-color: #e9f3ff;
        box-shadow: 0 2px 6px rgba(13, 110, 253, 0.1);
    }

    #statusTabs .nav-link.active {
           color: #fff !important;
    background: linear-gradient(to bottom, #169eaf, #0e606e5c);
    box-shadow: 2px 1px 2px rgb(5 76 76) !important;
    border-color: #0e606e;
    }


    .form-selects {
        display: block;
        padding: 0.33rem 1.31rem 0.33rem 0.47rem;
        font-size: 0.95rem;
        font-weight: 400;
        line-height: 1.5;
        color: #6c7688a8;
        appearance: none;
        background-color: var(--pr-secondary-bg);
        background-image: var(--pr-form-select-bg-img), var(--pr-form-select-bg-icon, none);
        background-repeat: no-repeat;
        background-position: right 0.77rem center;
        background-size: 14px 10px;
        border: var(--pr-border-width) solid var(--pr-border-color);
        border-radius: 0.4rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
     }






        .upload-container {
            border: 2px dashed #dee2e6;
            border-radius: 10px;
            padding: 20px;
            background: #f8f9fa;
            transition: all 0.3s ease;
        }

        .upload-container:hover {
            border-color: var(--primary-color);
            background: white;
        }

        .upload-area {
            cursor: pointer;
            text-align: center;
            padding: 20px;
        }

        .upload-area i {
            font-size: 48px;
            color: var(--primary-color);
            margin-bottom: 10px;
        }

        .preview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }

        .preview-item {
            position: relative;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            background: white;
            transition: transform 0.2s;
        }

        .preview-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .preview-item img {
            width: 100%;
            height: 100px;
            object-fit: cover;
        }

        .preview-item .pdf-preview {
            height: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            color: var(--primary-color);
        }

        .preview-item .pdf-preview i {
            font-size: 32px;
            margin-bottom: 5px;
        }

        .preview-item .file-name {
            font-size: 11px;
            padding: 5px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            background: #f8f9fa;
        }

        .preview-item .remove-file {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--danger-color);
            color: white;
            border: none;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .preview-item:hover .remove-file {
            opacity: 1;
        }

        /* Modal Animation */
        .modal-animated {
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            0% { transform: translateY(-50px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }

        .hover-scale {
            transition: transform 0.2s;
        }

        .hover-scale:hover {
            transform: scale(1.05);
        }

        .welcome-icon {
            animation: bounce 1s ease-in-out;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        /* Notes Section */
        .notes-section {
            background: var(--primary-light);
            border-left: 4px solid var(--primary-color);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }

        .notes-section textarea {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            resize: vertical;
            min-height: 100px;
        }

        .notes-section textarea:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 0.2rem rgba(14, 96, 110, 0.25);
        }

        /* Fix date range input fields from truncating date strings */
        .bookingrange {
            min-width: 250px !important;
        }

        /* Styling for inputs with icons at the start to prevent icon overlapping the text */
        .input-icon-start {
            position: relative;
            display: inline-block;
        }

        .input-icon-start .input-icon-addon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
            pointer-events: none;
            display: flex;
            align-items: center;
            color: #6c757d;
        }

        .input-icon-start .form-control {
            padding-left: 35px !important;
        }
    </style>