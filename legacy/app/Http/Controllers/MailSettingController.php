<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Mail_setting;

class MailSettingController extends Controller
{
    public function mailsetup()
    {
        $settings = Mail_setting::firstOrNew([]);
        return view('super-admin.email-setup', compact('settings'));
    }

    public function update(Request $request)
    {
        $request->validate([
            'mail_host' => 'required|string',
            'mail_port' => 'required|numeric',
            'mail_username' => 'required|string',
            'mail_password' => 'required|string',
            'mail_encryption' => 'nullable|string',
            'from_email' => 'required|email',
            'from_name' => 'required|string',
        ]);

        $settings = Mail_setting::firstOrNew([]);
        
        $settings->mailer = 'smtp';
        $settings->host = $request->mail_host;
        $settings->port = $request->mail_port;
        $settings->username = $request->mail_username;
        $settings->password = $request->mail_password;
        $settings->encryption = $request->mail_encryption;
        $settings->from_address = $request->from_email;
        $settings->from_name = $request->from_name;
        $settings->save();

        return response()->json(['message' => 'Mail settings updated successfully!']);
    }
}