<?php
namespace App\Http\Controllers;
use App\Models\BlogImage;
use App\Models\Blog;
use App\Models\Category;
use App\Models\Counsellingcourse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    public function index()
{
    $blogs = Blog::with('category', 'images')->latest()->paginate(10);
    $categories = Category::all();
    return view('super-admin.blogs', compact('blogs', 'categories'));
}

    
    public function store(Request $request)
    {
        // Validation
        $request->validate([
            'counsellingcourseid' => 'nullable',
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'shortcontent' => 'required',
            'content' => 'required',
            'image' => 'nullable',
            'images.*' => 'nullable',
        ]);
    
        // Slug generate kare aur ensure kare ki unique ho
        $slug = Str::slug($request->title);
        $originalSlug = $slug;
        $count = 1;
    
        while (Blog::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }
    
        // Blog create karein
        $blog = Blog::create([
            'counsellingcourseid' => $request->counsellingcourseid,
            'category_id' => $request->category_id,
            'title' => $request->title,
            'slug' => $slug,
            'shortcontent' => $request->shortcontent,
            'content' => $request->content,
        ]);
    
        // Single image ko save karein
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME) . '_' . time() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('uploads/blogs'), $imageName);
            $blog->image = 'uploads/blogs/' . $imageName;
            $blog->save();
        }
    
        // Multiple images ko save karein
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $imageName = pathinfo($img->getClientOriginalName(), PATHINFO_FILENAME) . '_' . time() . '.' . $img->getClientOriginalExtension();
                $img->move(public_path('uploads/blogs'), $imageName);
    
                BlogImage::create([
                    'blog_id' => $blog->id,
                    'image' => 'uploads/blogs/' . $imageName
                ]);
            }
        }
    
        return redirect()->route('admin.blogs')->with('success', 'Blog saved successfully!');
    }
    


public function editBlog($id) {
    $blog = Blog::findOrFail($id); 
    $categories = Category::all();
    return view('admin.Blog-edit', compact('blog', 'categories'));
}

public function update(Request $request, $id)
{
    $blog = Blog::findOrFail($id);

    $request->validate([
        'counsellingcourseid' => 'nullable',
        'category_id' => 'required|exists:categories,id',
        'title' => 'required|string|max:255',
        'slug' => '',
        'shortcontent' => 'required',
        'content' => 'required',
        'image' => 'nullable|mimes:jpeg,png,jpg,gif,webp|max:9120',
        'images.*' => 'nullable|mimes:jpeg,png,jpg,gif,webp|max:5120',
    ]);

    $slug = Str::slug($request->title);
    $originalSlug = $slug;
    $count = 1;

    while (Blog::where('slug', $slug)->where('id', '!=', $id)->exists()) {
        $slug = $originalSlug . '-' . $count;
        $count++;
    }

    if ($request->hasFile('image')) {
        if ($blog->image && file_exists(public_path($blog->image))) {
            unlink(public_path($blog->image));
        }

        $image = $request->file('image');
        $imageName = uniqid() . '_' . time() . '.' . $image->getClientOriginalExtension();

        if ($image->move(public_path('uploads/blogs'), $imageName)) {
            $blog->image = 'uploads/blogs/' . $imageName;
        }
    }

    if ($request->hasFile('images')) {
        $oldImages = BlogImage::where('blog_id', $blog->id)->get();
        foreach ($oldImages as $img) {
            if (file_exists(public_path($img->image))) {
                unlink(public_path($img->image));
            }
            $img->delete();
        }

        foreach ($request->file('images') as $img) {
            $imageName = uniqid() . '_' . time() . '.' . $img->getClientOriginalExtension();

            if ($img->move(public_path('uploads/blogs'), $imageName)) {
                BlogImage::create([
                    'blog_id' => $blog->id,
                    'image' => 'uploads/blogs/' . $imageName
                ]);
            }
        }
    }

    // ✅ Blog Data Update
    $blog->update([
        'counsellingcourseid' => $request->counsellingcourseid,
        'category_id' => $request->category_id,
        'title' => $request->title,
        'slug' => $slug,
        'shortcontent' => $request->shortcontent,
        'content' => $request->content,
    ]);

    return redirect()->route('admin.blogs')->with('success', 'Blog updated successfully!');
}


public function destroy($id)
{
    $blog = Blog::findOrFail($id);

    if ($blog->image && file_exists(public_path($blog->image))) {
        unlink(public_path($blog->image));
    }

    $blogImages = BlogImage::where('blog_id', $blog->id)->get();
    foreach ($blogImages as $img) {
        if (file_exists(public_path($img->image))) {
            unlink(public_path($img->image));  
        }
        $img->delete(); 
    }

    $blog->delete();

    return redirect()->route('admin.blogs')->with('success', 'Delete Blogs successfully!');
}

}
