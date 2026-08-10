<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            width: 80%;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            background-color: #f9f9f9;
        }
        .header {
            background: linear-gradient(135deg, #0a6e8a 0%, #00c9a7 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            width: 30%;
            color: #0a6e8a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Demo Request</h2>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            <p>You have received a new request for a product demo. Here are the details:</p>
            <table>
                <tr>
                    <th>Full Name</th>
                    <td>{{ $data['full_name'] }}</td>
                </tr>
                <tr>
                    <th>Email Address</th>
                    <td>{{ $data['email'] }}</td>
                </tr>
                <tr>
                    <th>Clinic/Company</th>
                    <td>{{ $data['clinic_name'] ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <th>Contact Number</th>
                    <td>{{ $data['phone'] }}</td>
                </tr>
                <tr>
                    <th>Preferred Time</th>
                    <td>{{ $data['preferred_time'] ?? 'Not Specified' }}</td>
                </tr>
                <tr>
                    <th>Concern/Message</th>
                    <td>{{ $data['concern'] }}</td>
                </tr>
            </table>
            <p>Please follow up with the client as soon as possible.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Skoracare. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
