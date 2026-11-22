export default function TermsPage() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-extrabold text-ink mb-2">Terms of Service</h1>
        <p className="text-muted text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-ink text-base mb-2">1. About PJRoutes</h2>
            <p className="text-muted">PJRoutes is a marketplace that connects travelers with FAA Part 135 certified aircraft operators offering empty-leg flights. PJRoutes does not own, operate, or charter aircraft. We are a technology platform that facilitates bookings between buyers and operators.</p>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">2. Eligibility</h2>
            <p className="text-muted">You must be 18 years or older to use PJRoutes. By creating an account, you confirm you are legally able to enter into binding agreements.</p>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">3. Bookings and Payments</h2>
            <ul className="list-disc pl-5 text-muted space-y-1">
              <li>When you book a flight, payment is charged immediately and your booking is confirmed.</li>
              <li>The price displayed is final at the time of booking. No fuel surcharges or repositioning fees will be added after booking.</li>
              <li>PJRoutes charges a platform fee on each booking, included in the displayed price.</li>
              <li>Payment is processed securely by Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">4. Cancellations and Refunds</h2>
            <ul className="list-disc pl-5 text-muted space-y-1">
              <li><strong className="text-ink">Operator cancels:</strong> You receive a full refund to your original payment method within 5–10 business days.</li>
              <li><strong className="text-ink">Buyer cancels:</strong> Cancellation policies are set by the operator. Contact us to initiate a cancellation request.</li>
              <li>PJRoutes is not liable for operator cancellations but will facilitate your refund.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">5. Operator Responsibilities</h2>
            <p className="text-muted mb-2">Operators who list flights on PJRoutes agree to:</p>
            <ul className="list-disc pl-5 text-muted space-y-1">
              <li>Hold an active FAA Part 135 Air Carrier Certificate.</li>
              <li>Provide accurate flight information including aircraft details, departure windows, and pricing.</li>
              <li>Contact buyers within the stated timeframe to confirm booking details.</li>
              <li>Honor the listed price without adding fees after booking.</li>
              <li>Remove listings that are no longer available immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">6. Limitation of Liability</h2>
            <p className="text-muted">PJRoutes is a marketplace and is not responsible for the actions, safety record, or performance of operators. Flights are operated by independent FAA-certified operators. PJRoutes&apos; maximum liability in any dispute is limited to the amount paid for the relevant booking.</p>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">7. Prohibited Use</h2>
            <ul className="list-disc pl-5 text-muted space-y-1">
              <li>Posting false or misleading flight listings.</li>
              <li>Attempting to circumvent the platform by transacting directly to avoid platform fees.</li>
              <li>Using the platform for any unlawful purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">8. Changes to Terms</h2>
            <p className="text-muted">We may update these terms. Continued use of PJRoutes after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="font-bold text-ink text-base mb-2">9. Contact</h2>
            <p className="text-muted">Questions? Contact us at <a href="mailto:support@pjroutes.com" className="text-ink underline">support@pjroutes.com</a>.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
