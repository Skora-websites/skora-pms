<?php

namespace App\Http\Controllers;

use App\Models\LandingSection;
use App\Models\LandingItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LandingPageController extends Controller
{
    /**
     * Show the landing page management dashboard.
     */
    public function index()
    {
        $sections = LandingSection::with('items')->get();
        return view('super-admin.landing-page.index', compact('sections'));
    }

    /**
     * Update a section's settings (Title, Subtitle, Status, Metadata).
     */
    public function updateSection(Request $request, $key)
    {
        $section = LandingSection::where('key', $key)->firstOrFail();

        $section->title = $request->input('title');
        $section->subtitle = $request->input('subtitle');
        $section->is_active = $request->has('is_active');

        // Handle section specific metadata (e.g., badge, monthly/yearly toggle labels, etc.)
        if ($request->has('metadata')) {
            $section->metadata = array_merge($section->metadata ?? [], $request->input('metadata'));
        }

        $section->save();

        return redirect()->back()->with('success', "{$section->name} updated successfully.");
    }

    /**
     * Store a new item under a section.
     */
    public function storeItem(Request $request, $section_key)
    {
        $rules = [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'badge' => 'nullable|string|max:255',
            'link' => 'nullable|string|max:255',
            'link_text' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'image_file' => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:2048',
            'price_monthly' => 'nullable|numeric',
            'price_yearly' => 'nullable|numeric',
            'price_original_monthly' => 'nullable|numeric',
            'price_original_yearly' => 'nullable|numeric',
            'stars' => 'nullable|integer|min:1|max:5',
        ];

        $request->validate($rules);

        $data = $request->except(['image_file', 'features_list', 'pricing_features']);

        // Handle Features list (for products / pricing features)
        if ($request->has('features_list')) {
            // e.g., product features as an array of strings
            $data['features'] = array_filter($request->input('features_list'));
        } elseif ($request->has('pricing_features')) {
            $pricing_features = [];
            foreach ($request->input('pricing_features') as $f) {
                if (!empty($f['name'])) {
                    $pricing_features[] = [
                        'name' => $f['name'],
                        'included_monthly' => isset($f['included_monthly']) && $f['included_monthly'] == '1',
                        'included_yearly' => isset($f['included_yearly']) && $f['included_yearly'] == '1',
                        'text_monthly' => $f['text_monthly'] ?? '',
                        'text_yearly' => $f['text_yearly'] ?? '',
                    ];
                }
            }
            $data['features'] = $pricing_features;
        }

        $data['section_key'] = $section_key;
        $data['order'] = LandingItem::where('section_key', $section_key)->count();
        $data['is_active'] = $request->has('is_active') || $request->input('is_active') === null;

        // Image upload
        if ($request->hasFile('image_file')) {
            $data['image'] = $request->file('image_file')->store('landing', 'public');
        }

        LandingItem::create($data);

        return redirect()->back()->with('success', 'Item added successfully.');
    }

    /**
     * Update an item.
     */
    public function updateItem(Request $request, $id)
    {
        $item = LandingItem::findOrFail($id);

        $rules = [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'badge' => 'nullable|string|max:255',
            'link' => 'nullable|string|max:255',
            'link_text' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'image_file' => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:2048',
            'price_monthly' => 'nullable|numeric',
            'price_yearly' => 'nullable|numeric',
            'price_original_monthly' => 'nullable|numeric',
            'price_original_yearly' => 'nullable|numeric',
            'stars' => 'nullable|integer|min:1|max:5',
        ];

        $request->validate($rules);

        $data = $request->except(['image_file', 'features_list', 'pricing_features']);
        
        // Handle Features list (for products / pricing features)
        if ($request->has('features_list')) {
            $data['features'] = array_filter($request->input('features_list'));
        } elseif ($request->has('pricing_features')) {
            $pricing_features = [];
            foreach ($request->input('pricing_features') as $f) {
                if (!empty($f['name'])) {
                    $pricing_features[] = [
                        'name' => $f['name'],
                        'included_monthly' => isset($f['included_monthly']) && $f['included_monthly'] == '1',
                        'included_yearly' => isset($f['included_yearly']) && $f['included_yearly'] == '1',
                        'text_monthly' => $f['text_monthly'] ?? '',
                        'text_yearly' => $f['text_yearly'] ?? '',
                    ];
                }
            }
            $data['features'] = $pricing_features;
        }

        $data['is_active'] = $request->has('is_active');

        // Image upload
        if ($request->hasFile('image_file')) {
            if ($item->image && Storage::disk('public')->exists($item->image)) {
                Storage::disk('public')->delete($item->image);
            }
            $data['image'] = $request->file('image_file')->store('landing', 'public');
        }

        $item->update($data);

        return redirect()->back()->with('success', 'Item updated successfully.');
    }

    /**
     * Delete an item.
     */
    public function destroyItem($id)
    {
        $item = LandingItem::findOrFail($id);

        if ($item->image && Storage::disk('public')->exists($item->image)) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return redirect()->back()->with('success', 'Item deleted successfully.');
    }
}
