<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\SupportVideo;
use Illuminate\Support\Facades\File;

class SupportController extends Controller
{
    // ====== TICKETS ======
    public function index()
    {
        // View all support tickets for Admin
        $tickets = SupportTicket::select('id', 'user_id', 'subject', 'status', 'created_at')
            ->with(['user' => function($query) {
                $query->select('id', 'name', 'role');
            }])
            ->orderBy('created_at', 'desc')
            ->get();
        return view('super-admin.supports.index', compact('tickets'));
    }

    public function show($id)
    {
        // View a specific ticket to reply
        $ticket = SupportTicket::select('id', 'user_id', 'subject', 'status', 'created_at')
            ->with([
                'user' => function($query) { $query->select('id', 'name', 'role'); },
                'messages' => function($query) {
                    $query->select('id', 'support_ticket_id', 'sender_id', 'message', 'is_admin_reply', 'attachment_path', 'attachment_type', 'created_at')
                          ->orderBy('created_at', 'asc');
                },
                'messages.sender' => function($query) { $query->select('id', 'name'); }
            ])
            ->findOrFail($id);
            
        return view('super-admin.supports.show', compact('ticket'));
    }

    public function reply(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240' // 10MB max
        ]);

        $ticket = SupportTicket::findOrFail($id);

        $attachmentPath = null;
        $attachmentType = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $extension = $file->getClientOriginalExtension();
            $filename = time() . '_' . uniqid() . '.' . $extension;
            $destinationPath = public_path('uploads/support_attachments');

            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true);
            }

            $file->move($destinationPath, $filename);
            $attachmentPath = 'uploads/support_attachments/' . $filename;
            $attachmentType = in_array(strtolower($extension), ['pdf']) ? 'pdf' : 'image';
        }

        $message = SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_id' => auth()->id(),
            'message' => $request->message,
            'is_admin_reply' => true,
            'attachment_path' => $attachmentPath,
            'attachment_type' => $attachmentType
        ]);

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Reply sent successfully!',
                'data' => [
                    'id' => $message->id,
                    'message' => $message->message,
                    'is_admin_reply' => (bool)$message->is_admin_reply,
                    'attachment_path' => $message->attachment_path ? asset($message->attachment_path) : null,
                    'attachment_type' => $message->attachment_type,
                    'created_at' => $message->created_at->format('M d, h:i A')
                ]
            ]);
        }

        return redirect()->back()->with('success', 'Reply sent successfully!');
    }

    public function getSupportMessages($id)
    {
        $ticket = SupportTicket::select('id', 'user_id')->findOrFail($id);
        
        // Ensure user is authorized to view this ticket
        if (auth()->user()->role !== 'super_admin' && $ticket->user_id !== auth()->user()->getDoctorIdContext()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $last_id = request('last_id', 0);
        
        $messages = $ticket->messages()
            ->select('id', 'message', 'is_admin_reply', 'attachment_path', 'attachment_type', 'created_at')
            ->where('id', '>', $last_id)
            ->get();
        
        $formattedMessages = $messages->map(function($msg) {
            return [
                'id' => $msg->id,
                'message' => $msg->message,
                'is_admin_reply' => (bool)$msg->is_admin_reply,
                'attachment_path' => $msg->attachment_path ? asset($msg->attachment_path) : null,
                'attachment_type' => $msg->attachment_type,
                'created_at' => $msg->created_at->format('M d, h:i A')
            ];
        });

        return response()->json([
            'success' => true,
            'messages' => $formattedMessages
        ]);
    }

    public function getOrCreateTicket()
    {
        $user = auth()->user();
        $ticket = SupportTicket::select('id', 'user_id', 'status')
            ->where('user_id', $user->getDoctorIdContext())
            ->where('status', 'open')
            ->first();
        
        if (!$ticket) {
            $ticket = SupportTicket::create([
                'user_id' => $user->id,
                'subject' => 'Assistance Needed from Chat Boat',
                'status' => 'open'
            ]);
            
            SupportTicketMessage::create([
                'support_ticket_id' => $ticket->id,
                'sender_id' => $user->id,
                'message' => 'I need assistance.',
                'is_admin_reply' => false
            ]);
        }
        
        $messages = $ticket->messages()
            ->select('id', 'message', 'is_admin_reply', 'attachment_path', 'attachment_type', 'created_at')
            ->get()
            ->map(function($msg) {
            return [
                'id' => $msg->id,
                'message' => $msg->message,
                'is_admin_reply' => (bool)$msg->is_admin_reply,
                'attachment_path' => $msg->attachment_path ? asset($msg->attachment_path) : null,
                'attachment_type' => $msg->attachment_type,
                'created_at' => $msg->created_at->format('M d, h:i A')
            ];
        });

        return response()->json([
            'success' => true,
            'ticket_id' => $ticket->id,
            'messages' => $messages
        ]);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'ticket_id' => 'required|exists:support_tickets,id',
            'message' => 'required|string',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240'
        ]);

        $ticket = SupportTicket::findOrFail($request->ticket_id);
        
        if ($ticket->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $attachmentPath = null;
        $attachmentType = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $extension = $file->getClientOriginalExtension();
            $filename = time() . '_' . uniqid() . '.' . $extension;
            $destinationPath = public_path('uploads/support_attachments');

            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true);
            }

            $file->move($destinationPath, $filename);
            $attachmentPath = 'uploads/support_attachments/' . $filename;
            $attachmentType = in_array(strtolower($extension), ['pdf']) ? 'pdf' : 'image';
        }

        $message = SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_id' => auth()->id(),
            'message' => $request->message,
            'is_admin_reply' => false,
            'attachment_path' => $attachmentPath,
            'attachment_type' => $attachmentType
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $message->id,
                'message' => $message->message,
                'is_admin_reply' => false,
                'attachment_path' => $message->attachment_path ? asset($message->attachment_path) : null,
                'attachment_type' => $message->attachment_type,
                'created_at' => $message->created_at->format('M d, h:i A')
            ]
        ]);
    }

    public function closeTicket($id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $ticket->status = 'closed';
        $ticket->save();

        return redirect()->back()->with('success', 'Ticket closed successfully!');
    }


    // ====== VIDEOS ======
    public function videos()
    {
        $videos = SupportVideo::orderBy('created_at', 'desc')->get();
        return view('super-admin.supports.videos', compact('videos'));
    }

    public function storeVideo(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'video_type' => 'required|in:upload,youtube',
            'video' => 'required_if:video_type,upload|nullable|mimes:mp4,mov,ogg,qt|max:50000',
            'video_url' => 'required_if:video_type,youtube|nullable|url'
        ]);

        $videoPath = null;
        $videoUrl = $request->video_url;

        if ($request->video_type === 'upload' && $request->hasFile('video')) {
            $file = $request->file('video');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/videos');
            
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true);
            }
            
            $file->move($destinationPath, $filename);
            $videoPath = 'uploads/videos/' . $filename;
        }

        SupportVideo::create([
            'title' => $request->title,
            'description' => $request->description,
            'video_type' => $request->video_type,
            'video_url' => $videoUrl,
            'video_path' => $videoPath
        ]);

        return redirect()->back()->with('success', 'Support resource added successfully!');
    }

    public function destroyVideo($id)
    {
        $video = SupportVideo::findOrFail($id);
        
        if ($video->video_path && file_exists(public_path($video->video_path))) {
            unlink(public_path($video->video_path));
        }

        $video->delete();

        return redirect()->back()->with('success', 'Video deleted successfully!');
    }
}
