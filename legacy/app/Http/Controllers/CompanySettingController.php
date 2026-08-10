<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CompanySettingController extends Controller
{
    public function index()
    {
        // Just return your blade (you already shared layout/includes)
        return view('super-admin.settings.company'); // create this blade with your given HTML
    }

    public function fetch()
    {
        $row = CompanySetting::firstOrCreate(['id'=>1], []);
        return response()->json(['data' => $row]);
    }

    public function save(Request $request)
    {
        // NOTE: jQuery AJAX with FormData -> files allowed, so do NOT use $request->all() blindly
        $rules = [
            'company_name'        => 'nullable|string|max:255',
            'company_short_name'  => 'nullable|string|max:255',
            'company_tagline'     => 'nullable|string|max:255',
            'company_description' => 'nullable|string|max:5000',

            'light_logo'          => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:2048',
            'dark_logo'           => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:2048',
            'favicon'             => 'nullable|image|mimes:png,jpg,jpeg,webp,svg,ico|max:1024',

            'company_email1'      => 'nullable|email',
            'company_email2'      => 'nullable|email',
            'company_mobile1'     => 'nullable|string|max:30',
            'company_mobile2'     => 'nullable|string|max:30',
            'company_whatsapp1'   => 'nullable|string|max:30',
            'company_whatsapp2'   => 'nullable|string|max:30',

            'facebook'            => 'nullable|url',
            'twitter'             => 'nullable|url',
            'linkedin'            => 'nullable|url',
            'instagram'           => 'nullable|url',
            'pintrest'            => 'nullable|url',
            'map'                 => 'nullable|url',

            'company_address1'    => 'nullable|string|max:1000',
            'company_address2'    => 'nullable|string|max:1000',

            'currency_name'       => 'nullable|string|max:50',
            'currency_symbol'     => 'nullable|string|max:10',
            'default_trial_days'  => 'nullable|integer|min:0',

            // hidden old file paths (optional)
            'oldlight_logo'       => 'nullable|string',
            'olddark_logo'        => 'nullable|string',
            'oldfavicon'          => 'nullable|string',
        ];

        $v = Validator::make($request->all(), $rules);
        if ($v->fails()) {
            return response()->json(['status'=>'error','errors'=>$v->errors()], 422);
        }

        $row = CompanySetting::firstOrCreate(['id'=>1], []);
        $data = $request->only([
            'company_name','company_short_name','company_tagline','company_description',
            'company_email1','company_email2','company_mobile1','company_mobile2',
            'company_whatsapp1','company_whatsapp2',
            'facebook','twitter','linkedin','instagram','pintrest','map',
            'company_address1','company_address2',
            'currency_name','currency_symbol',
            'default_trial_days',
        ]);

        // Handle files
        // Stored in storage/app/public/company/...
        if ($request->hasFile('light_logo')) {
            $this->deleteIfExists($row->light_logo);
            $data['light_logo'] = $request->file('light_logo')->store('company', 'public');
        }

        if ($request->hasFile('dark_logo')) {
            $this->deleteIfExists($row->dark_logo);
            $data['dark_logo'] = $request->file('dark_logo')->store('company', 'public');
        }

        if ($request->hasFile('favicon')) {
            $this->deleteIfExists($row->favicon);
            $data['favicon'] = $request->file('favicon')->store('company', 'public');
        }

        $row->update($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Settings saved successfully.',
            'data'    => $row->fresh()
        ]);
    }

    private function deleteIfExists(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
