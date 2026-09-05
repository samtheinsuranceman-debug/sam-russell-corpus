const SupportPage: React.FC = () => (
  <div className="min-h-screen bg-[#0a0f1a] text-white p-8">
    <h1 className="text-3xl font-bold text-[#22c55e] mb-8">Support</h1>

    {/* Contact Info */}
    <section className="mb-8 bg-[#1a1f2a] rounded-xl p-6">
      <h2 className="text-xl font-semibold text-[#22c55e] mb-4">Contact Us</h2>
      <p className="mb-2">Phone: <a href="tel:+17035090594" className="text-[#22c55e]">+1 (703) 509-0594</a></p>
      <p className="mb-2">Email: <a href="mailto:support@russellcap.com" className="text-[#22c55e]">support@russellcap.com</a></p>
      <p>Schedule a Call: <a href="https://calendly.com/samtheinsuranceman-1/30min" target="_blank" className="text-[#22c55e]">Book on Calendly</a></p>
    </section>

    {/* FAQ */}
    <section className="mb-8 bg-[#1a1f2a] rounded-xl p-6">
      <h2 className="text-xl font-semibold text-[#22c55e] mb-4">Frequently Asked Questions</h2>
      {/* Add FAQ accordion items */}
    </section>

    {/* Contact Form */}
    <section className="bg-[#1a1f2a] rounded-xl p-6">
      <h2 className="text-xl font-semibold text-[#22c55e] mb-4">Send a Message</h2>
      <form className="space-y-4">
        <input type="text" placeholder="Name" className="w-full p-3 bg-[#0d1117] border border-gray-600 rounded-lg" />
        <input type="email" placeholder="Email" className="w-full p-3 bg-[#0d1117] border border-gray-600 rounded-lg" />
        <textarea placeholder="Message" rows={4} className="w-full p-3 bg-[#0d1117] border border-gray-600 rounded-lg" />
        <button type="submit" className="bg-[#22c55e] px-6 py-3 rounded-lg">Send Message</button>
      </form>
    </section>
  </div>
);

export default SupportPage;
