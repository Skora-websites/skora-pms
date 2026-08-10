<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::latest()->get();
        return view('super-admin.blog-category', compact('categories'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
        ]);

        return response()->json(['success' => 'Category Added Successfully!', 'category' => $category]);
    }

    public function edit($id)
    {
        $category = Category::findOrFail($id);
        return response()->json($category);
    }



    public function update(Request $request, $id)
{
    $category = Category::findOrFail($id);

    $request->validate([
        'name' => ['required', 'string', 'max:255', Rule::unique('categories')->ignore($category->id)],
    ]);

    $category->update([
        'name' => $request->name,
        'slug' => Str::slug($request->name),
    ]);

    return response()->json([
        'success' => 'Category Updated Successfully!',
        'category' => $category
    ]);
}



public function destroy($id)
{

    $category = Category::findOrFail($id);
    $blogsCount = Blog::where('category_id', $id)->count();
    if ($blogsCount > 0) {
        return response()->json([
            'success' => false,
            'message' => 'First delete the blogs related to the category.'
        ], 400); 
    }

    $category->delete();

    return response()->json([
        'success' => true,
        'message' => 'Category deleted successfully!'
    ]);
}


}
