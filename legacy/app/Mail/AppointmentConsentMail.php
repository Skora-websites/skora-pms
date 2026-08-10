<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\AppointmentConsultConsent;
use App\Models\Appointment;
use App\Models\User;
use App\Models\DoctorClinic;
class AppointmentConsentMail extends Mailable
{
    use Queueable, SerializesModels;

    public $consent;
    public $appointment;
    public $doctor;
    public $patient;
    public $clinic;

    /**
     * Create a new message instance.
     */
    public function __construct(AppointmentConsultConsent $consent, Appointment $appointment, User $doctor, User $patient, ?DoctorClinic $clinic = null)
    {
        $this->consent = $consent;
        $this->appointment = $appointment;
        $this->doctor = $doctor;
        $this->patient = $patient;
        $this->clinic = $clinic;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Action Required: Appointment Consultation Consent',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-consent',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
