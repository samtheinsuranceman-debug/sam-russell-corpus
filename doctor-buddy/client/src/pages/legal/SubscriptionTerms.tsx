import LegalShell from "./LegalShell";
import { LEGAL_BUSINESS_NAME, MEMBERSHIP_PRICE } from "@/lib/releasePolicy";
export default function SubscriptionTerms() {
  return <LegalShell title="Subscription Terms">
    <h2>Membership</h2>
    <p>{LEGAL_BUSINESS_NAME} offers the Doctor Buddy Membership at {MEMBERSHIP_PRICE} USD per month in the public edition unless a different price is clearly displayed before enrollment. A membership purchases software access only—not medical care.</p>
    <h2>Automatic renewal</h2>
    <p>Your membership automatically renews each month and the payment method provided to the hosted checkout provider is charged the then-disclosed recurring amount until you cancel. The first charge occurs at checkout unless a specific free-trial start and end date is expressly displayed before enrollment.</p>
    <h2>Affirmative consent</h2>
    <p>A subscription is created only after you confirm that you are at least 18 and expressly authorize recurring billing. That authorization is recorded separately from consumer-health-data consent.</p>
    <h2>Cancellation</h2>
    <p>You can cancel online from Account &amp; Privacy through the hosted billing portal without calling or negotiating with support. Cancel before the next renewal to prevent future renewal charges. Access normally continues through the already-paid billing period.</p>
    <h2>Taxes</h2>
    <p>Applicable taxes may be added where required by law and, when collected through checkout, are shown before payment. The operator remains responsible for configuring and administering required tax collection.</p>
    <h2>Refunds</h2>
    <p>Charges are non-refundable after a billing period begins except where required by law or where the checkout screen expressly promises an additional refund right.</p>
    <h2>Price or term changes</h2>
    <p>Material price or renewal-term changes require advance notice before they affect a future renewal. You may cancel before the changed renewal takes effect.</p>
    <h2>No surprise conversion</h2>
    <p>A free feature or assessment does not silently convert into a paid subscription. If a free trial is ever offered, its length, end date, post-trial price, and cancellation method must be shown before enrollment.</p>
  </LegalShell>;
}
