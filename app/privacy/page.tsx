export default function PrivacyPage() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-extrabold text-ink mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-ink text-base mb-2">1. Information We Collect</h2>
            <p className="text-muted mb-2">When you use PJRoutes, we collect the following information:</p>
            <ul className="list-disc pl-5 text-muted space-y-1">
              <li><strong className="text-ink">Account information:</strong> Email address when you sign in or create an account.</li>
              <li><strong className="text-ink">Booking information:</strong> Name, phone number, and payment details when completing a booking.</li>
              <li><strong className="text-ink">Operator information:</strong> Company name, contact details, aircraft information, and flight listings submitted by operators.</li>
              <li><strong className="text-ink">Usage data:</strong> Pages visited, search queries, and interactions with the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-muted space-y-1">
              <li>To process and confirm flight bookings.</li>
              <li>To send booking confirmations and flight details.</li>
              <li>To notify you of flights matching your saved route alerts.</li>
              <li>To verify operator credentials and manage listings.</li>
              <li>To send weekly flight deal emails if you&apos;ve subscribed.</li>
              <li>To improve the platform and prevent fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">3. Payment Processing</h2>
            <p className="text-muted">All payments are processed by Stripe. PJRoutes does not store your card number or bank account details. Your payment information is handled directly by Stripe in accordance with their privacy policy and PCI DSS standards.</p>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">4. Information Sharing</h2>
            <p className="text-muted mb-2">We do not sell your personal information. We share information only as necessary:</p>
            <ul className="list-disc pl-5 text-muted space-y-1">
              <li><strong className="text-ink">With operators:</strong> When you book a flight, we share your name and contact information with the operator so they can confirm your booking and provide FBO details.</li>
              <li><strong className="text-ink">With service providers:</strong> Stripe (payments), Supabase (database), Resend (email delivery).</li>
              <li><strong className="text-ink">Legal requirements:</strong> If required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">5. Data Retention</h2>
            <p className="text-muted">We retain your account information for as long as your account is active. Booking records are retained for 7 years for tax and compliance purposes. You may request deletion of your account by contacting us.</p>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">6. Your Rights</h2>
            <p className="text-muted">You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">7. Cookies</h2>
            <p className="text-muted">We use essential cookies to maintain your session. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">8. Contact</h2>
            <p className="text-muted">Questions about this policy? Contact us at <a href="mailto:support@pjroutes.com" className="text-ink underline">support@pjroutes.com</a>.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
