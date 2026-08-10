@extends('layouts.frontend')
@push('styles')
@endpush
@section('content')
    <main>
        <section class="ul-breadcrumb ul-section-spacing">
            <div class="ul-container">
                <ul class="ul-breadcrumb-nav">
                    <li><a href="{{ url('/') }}">Home</a></li>
                    <li><span class="separator"><i class="flaticon-right"></i></span></li>
                    <li>Consultation form</li>
                </ul>
                <h2 class="ul-breadcrumb-title">Consultation form</h2>
            </div>
        </section>

         <div class="container card mt-5 pt-5 pb-5 mb-5 p-3">
                <h2 class="fw-bold mb-4 color-doctorrx">Patient Consent Form</h2>
                
                <div class="alert alert-info mb-4">
                    <strong>Important:</strong> Please read this consent form carefully before proceeding with your appointment.
                </div>

                <div class="mb-4">
                    <h4>1. Introduction</h4>
                    <p>I, [Patient Name], hereby give my informed consent to receive medical treatment from Dr. [Doctor's Name] at [Clinic Name].</p>
                </div>

                <div class="mb-4">
                    <h4>2. Nature of Treatment</h4>
                    <p>The doctor has explained the proposed treatment/procedure, including its purpose, benefits, risks, and alternatives. I understand that no guarantees have been made regarding the results.</p>
                </div>

                <div class="mb-4">
                    <h4>3. Risks and Complications</h4>
                    <p>I acknowledge that all medical procedures carry some risks, including but not limited to infection, allergic reactions, and unexpected complications.</p>
                </div>

                <div class="mb-4">
                    <h4>4. Privacy and Confidentiality</h4>
                    <p>My personal health information will be kept confidential in accordance with applicable laws and regulations.</p>
                </div>

                <div class="mb-4">
                    <h4>5. Withdrawal of Consent</h4>
                    <p>I understand that I can withdraw my consent at any time without affecting my right to future care or treatment.</p>
                </div>

                <div class="alert alert-warning mb-4">
                    <p>By clicking "I Agree" below, you confirm that you have read, understood, and agree to the terms of this consent form.</p>
                </div>

                <form method="POST" action="#">
                    @csrf
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="agree" required>
                        <label class="form-check-label" for="agree">I agree to the terms and conditions</label>
                    </div>
                    <button type="button" class="btn btn-primary">Submit Consent</button>
                </form>
            </div>

    </main>
@endsection