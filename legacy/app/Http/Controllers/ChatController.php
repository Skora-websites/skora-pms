<?php

namespace App\Http\Controllers;

use App\Models\ChatRoom;
use App\Models\Message;
use App\Models\Favorite;
use App\Models\UserChatSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller {
    public function index() {
        $room = ChatRoom::firstOrCreate(
            ['name' => 'Doctors Group'],
            ['type' => 'group']
        );
        
        // Get member count
        $memberCount = User::whereHas('messages', function($query) use ($room) {
            $query->where('chat_room_id', $room->id);
        })->distinct()->count();
        
        $messages = Message::where('chat_room_id', $room->id)
            ->where('timestamp', '>', optional(Auth::user()->chatSettings()->where('chat_room_id', $room->id)->first())->last_cleared_at ?? '1900-01-01')
            ->with('sender', 'doctor')
            ->orderBy('timestamp')
            ->paginate(50);

        return view('doctor.chat', compact('messages', 'room', 'memberCount'));
    }

    public function send(Request $request) {
        $validated = $request->validate([
            'content' => 'required|string'
        ]);
        
        $chatRoom = ChatRoom::firstOrCreate(
            ['name' => 'Doctors Group'],
            ['type' => 'group']
        );
        
        $message = Message::create([
            'chat_room_id' => $chatRoom->id,
            'sender_id' => Auth::id(),
            'doctor_id' => Auth::id(),
            'content' => $validated['content'],
            'timestamp' => now(),
        ]);

        return response()->json($message->load('sender', 'doctor'));
    }

    public function getNewMessages(Request $request) {
        $lastTimestamp = $request->input('last_timestamp', '1900-01-01');
        $chatRoom = ChatRoom::firstOrCreate(
            ['name' => 'Doctors Group'],
            ['type' => 'group']
        );
        
        $messages = Message::where('chat_room_id', $chatRoom->id)
            ->where('timestamp', '>', $lastTimestamp)
            ->with('sender', 'doctor')
            ->orderBy('timestamp')
            ->get();

        return response()->json($messages);
    }

    public function favorite(Request $request) {
        $request->validate(['message_id' => 'required|exists:messages,id']);
        
        Favorite::create([
            'user_id' => Auth::id(), 
            'message_id' => $request->message_id
        ]);
        return response()->json(['success' => true]);
    }

    public function delete(Message $message) {
        if ($message->sender_id === Auth::id()) {
            $message->delete();
        }
        return response()->json(['success' => true]);
    }

    public function search(Request $request) {
        $query = $request->input('query');
        $chatRoom = ChatRoom::firstOrCreate(
            ['name' => 'Doctors Group'],
            ['type' => 'group']
        );
        
        $results = Message::where('chat_room_id', $chatRoom->id)
            ->whereFullText('content', $query)
            ->with('sender', 'doctor')
            ->orderBy('timestamp', 'desc')
            ->get();

        return response()->json($results);
    }

    public function mute() {
        $chatRoom = ChatRoom::firstOrCreate(
            ['name' => 'Doctors Group'],
            ['type' => 'group']
        );
        
        UserChatSetting::updateOrCreate(
            ['user_id' => Auth::id(), 'chat_room_id' => $chatRoom->id],
            ['muted' => true]
        );
        return response()->json(['success' => true]);
    }

    public function unmute() {
        $chatRoom = ChatRoom::firstOrCreate(
            ['name' => 'Doctors Group'],
            ['type' => 'group']
        );
        
        UserChatSetting::updateOrCreate(
            ['user_id' => Auth::id(), 'chat_room_id' => $chatRoom->id],
            ['muted' => false]
        );
        return response()->json(['success' => true]);
    }

    public function clear() {
        $chatRoom = ChatRoom::firstOrCreate(
            ['name' => 'Doctors Group'],
            ['type' => 'group']
        );
        
        UserChatSetting::updateOrCreate(
            ['user_id' => Auth::id(), 'chat_room_id' => $chatRoom->id],
            ['last_cleared_at' => now()]
        );
        return response()->json(['success' => true]);
    }

    public function deleteChat() {
        $chatRoom = ChatRoom::firstOrCreate(
            ['name' => 'Doctors Group'],
            ['type' => 'group']
        );
        
        UserChatSetting::where('user_id', Auth::id())->where('chat_room_id', $chatRoom->id)->delete();
        Favorite::where('user_id', Auth::id())->delete();
        return redirect()->route('doctor.dashboard');
    }


    // Add this method to your ChatController
public function update(Request $request, Message $message)
{
    if ($message->sender_id !== Auth::id()) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }
    
    $validated = $request->validate([
        'content' => 'required|string'
    ]);
    
    $message->update([
        'content' => $validated['content'],
        'edited_at' => now(),
    ]);
    
    return response()->json(['success' => true]);
}
}