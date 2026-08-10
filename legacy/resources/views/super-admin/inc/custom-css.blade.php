
  <style>
    .input-group-text{
        padding: 8px !important;
    }
    .w-px-40 {
        width: 33px !important;
    }
    .color-doctor-x{
        color: #0e606e !important;
    }
     .bg-doctor-x{
        color: #0e606e !important;  
    }
    .card-header{
    background: #0e606e17 !important;
    padding:10px 21px !important;
    margin-bottom: 20px !important;
    }

    .dashboard-card-bg{
              background-color: rgb(14 96 110 / 7%) !important;
    color: #0e606e6e !important;
    cursor: pointer !important;
    box-shadow: 0 2px 6px rgb(16 124 142 / 62%) !important;
    }

    .dashboard-card-bg:hover{
             background-color: rgb(19 120 137 / 14%) !important;
    color: #0e606e !important;
    cursor: pointer !important;
    box-shadow: 0 4px 12px rgb(14 96 110 / 35%) !important;
    }

    /* Transition & Hover Micro-interactions */
    .transition-all {
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    }
    
    .hover-glow:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(14, 96, 110, 0.25) !important;
    }
    
    .hover-scale {
      transition: all 0.2s ease-in-out;
    }
    
    .hover-scale:hover {
      transform: translateX(4px);
      background-color: rgba(14, 96, 110, 0.04) !important;
    }

    .card-text{
      color: #1c8767;
    font-weight: 800 !important;
    }

    .card-header h5{
        color: #0e606e !important;
        font-weight: 700 !important;
        font-size:1rem !important;
    }


     .card-header h6{
        color: #d8d7da !important;
        font-weight: 700 !important;
    }

    .card-header .card-subtitle{
    color: #0e606ea8 !important;
    }

    .floating-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background-color: #0e606e;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      transition: background-color 0.3s ease, transform 0.2s;
    }

    .floating-btn:hover {
      background-color: #6b3cc9;
      transform: scale(1.1);
    }

    .help-panel {
      position: fixed;
      bottom: 0;
      right: 0;
      width: min(100%, 400px);
      height: calc(100vh - 60px);
      background-color: #f3e9ff;
      border-radius: 10px 10px 0 0;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9000;
      display: none;
      flex-direction: column;
      transition: all 0.3s ease;
    }

    .help-panel.active {
      display: flex;
    }

    .help-header {
      background-color: #0e606e;
      color: #fff;
      padding: 10px 15px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }

    .help-header h6 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .help-header .header-buttons {
      display: flex;
      gap: 10px;
    }

    .help-header button {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      font-size: 16px;
    }

    .help-body {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      background-color: #f5f4f6;
    }

    .chat-container {
      height: 100%;
      display: flex;
      font-size: 11px;
      flex-direction: column;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      scroll-behavior: smooth;
    }

    .date-separator {
      text-align: center;
      margin: 10px 0;
      color: #555;
      }

    .message {
      margin-bottom: 10px;
      padding: 8px 12px;
      border-radius: 7px;
      position: relative;
      display: table;
      /* flex-direction: column; */
      animation: fadeIn 0.3s ease;
    }

    .user-message {
      background-color: #b8fcac;
      color: #000;
      margin-left: auto;
      border-bottom-right-radius: 2px;
    }

    .user-message::after {
      content: "";
    transform: rotate(31deg);
    position: absolute;
    top: -9px;
    right: 0px;
    border: 8px solid #c53f3f00;
    border-bottom-color: #b8fcac;
    border-right-color: #b8fcac;
    }

    .bot-message {
      background-color: #fff;
      color: #000;
      margin-right: auto;
      border-bottom-left-radius: 2px;
    }

    .bot-message::after {
          content: "";
        position: absolute;
        top: -10px;
        transform: rotate(-23deg);
        left: 0px;
        border: 8px solid transparent;
        border-bottom-color: #fff;
        border-left-color: #fff;
    }

    .timestamp {
      font-size: 10px;
      color: #666;
      margin-top: 4px;
      align-self: flex-end;
    }

    .typing .content {
      animation: typing 1s infinite;
    }

    @keyframes typing {
      0% { content: 'Typing.'; }
      33% { content: 'Typing..'; }
      66% { content: 'Typing...'; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message-menu {
      position: absolute;
      background: #fff;
      border: 1px solid #ddd;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 10;
      padding: 5px;
      border-radius: 5px;
    }

    .message-menu button {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      background: none;
      padding: 6px 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .message-menu button:hover {
      background: #f0f0f0;
    }

    .chat-input {
      display: flex;
      padding: 2px;
      background: #fff;
      border-radius: 70px;
      border-top: 1px solid #ddd;
      align-items: center;
    }

    .chat-input input {
      flex: 1;
      border: none;
      padding: 10px;
      border-radius: 20px;
      background: #f0f0f0;
      margin: 0 8px 0 0;
    }

    .chat-input .input-buttons {
      display: flex;
    }

    .chat-input button {
      background: none;
      border: none;
      color: #0e606e;
      font-size: 16px;
      cursor: pointer;
    }

    .help-body input[type="text"] {
          border-radius: 20px;
          background: #fff;
          border: 1px solid #ddd;
          padding: 8px;
          font-size: 13px;         
         margin-bottom: 3px;

    }

    .help-body1 input[type="text"]:focus {
      border: 0;
      background: #fff;   
      outline: none;
    }

    @media (max-width: 768px) {
      .help-panel {
        width: 100%;
        height: 100vh;
        border-radius: 0;
      }

      .floating-btn {
        bottom: 15px;
        right: 15px;
      }
    }

    @media (min-width: 769px) {
      .help-header .back-btn {
        display: none;
      }
    }
     .form-floating.form-floating-outline>.form-control:focus, .form-floating.form-floating-outline>.form-select:focus {
        border-width: 1.6px;
}

.form-floating>.form-control, .form-floating>.form-control-plaintext, .form-floating>.form-select {
    height: 1.1rem;
    min-height: 2.700rem;
    line-height: 1.475;
}

select:not(:placeholder-shown) {
    padding-top: 0.6rem !important;
    padding-bottom: 0.8555rem !important;
}


.form-floating>.form-control, .form-floating>.form-control-plaintext, .form-floating>.form-select {
    line-height: 1.175 !important;
}


@media (min-width: 1200px) {
    .navbar-expand-xl .navbar-nav .dropdown-menu {
        position: absolute;
        box-shadow: 0px 5px 6px 1px rgb(135 76 245 / 48%);
        background: #fbf8ff;
    }
}

.form-control {
    line-height: 1 !important;
}

.table-sm>:not(caption)>*>* {
    padding: .4rem 1.9rem !important;
}
.rounded {
    border-radius: .275rem !important;
}

.page-item .page-link {
    border-radius: 20px !important;
}

  </style>