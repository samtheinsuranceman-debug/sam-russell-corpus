import { useState } from "react";
import { Mail, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: "annual_review",
    name: "Annual Review Invitation",
    subject: "Time for Your Annual Financial Review",
    body: `Dear {client_name},

I hope this message finds you well. It's time for our annual financial review, and I'd love to schedule a meeting to discuss your portfolio performance, any changes in your financial goals, and strategies for the year ahead.

During our review, we'll cover:
- Portfolio performance and asset allocation
- Tax optimization opportunities
- Retirement planning updates
- Insurance and estate planning review

Please let me know your availability for the next two weeks, and I'll get us scheduled.

Best regards,
{advisor_name}`,
    category: "Review",
  },
  {
    id: "market_update",
    name: "Market Update",
    subject: "Market Update: What It Means for Your Portfolio",
    body: `Dear {client_name},

I wanted to reach out with a brief update on recent market developments and what they mean for your financial plan.

Key takeaways:
- Market conditions remain favorable for long-term investors
- Your portfolio is well-positioned for current conditions
- No immediate changes are recommended at this time

As always, your financial plan is designed to weather market fluctuations. If you have any questions or concerns, please don't hesitate to reach out.

Best regards,
{advisor_name}`,
    category: "Updates",
  },
  {
    id: "roth_conversion",
    name: "Roth Conversion Opportunity",
    subject: "Tax-Saving Opportunity: Roth Conversion Strategy",
    body: `Dear {client_name},

Based on our recent analysis, I've identified a potential Roth conversion opportunity that could significantly reduce your lifetime tax burden.

Here's a quick summary:
- Current IRA balance: {ira_balance}
- Estimated tax savings: Significant over your retirement horizon
- Optimal conversion window: This tax year

I'd like to schedule a 30-minute call to walk you through the numbers and discuss whether this strategy makes sense for your situation.

Would you be available this week for a brief discussion?

Best regards,
{advisor_name}`,
    category: "Strategy",
  },
  {
    id: "birthday",
    name: "Birthday Greeting",
    subject: "Happy Birthday, {client_name}!",
    body: `Dear {client_name},

Wishing you a wonderful birthday! I hope this year brings you health, happiness, and continued financial success.

As your advisor, I'm grateful for the trust you place in me to help manage your financial future. Here's to another great year ahead!

Warm regards,
{advisor_name}`,
    category: "Personal",
  },
  {
    id: "new_client_welcome",
    name: "New Client Welcome",
    subject: "Welcome to Russell Capital Solutions™",
    body: `Dear {client_name},

Welcome to Russell Capital Solutions™! I'm thrilled to have you as a client and look forward to helping you achieve your financial goals.

Here's what to expect next:
1. We'll schedule an initial discovery meeting
2. I'll prepare a comprehensive financial analysis
3. We'll develop a personalized strategy together

In the meantime, feel free to explore your client portal where you can view your accounts, documents, and upcoming meetings.

Welcome aboard!

Best regards,
{advisor_name}`,
    category: "Onboarding",
  },
  {
    id: "iul_followup",
    name: "IUL Strategy Follow-Up",
    subject: "Follow-Up: Your IUL Strategy Discussion",
    body: `Dear {client_name},

Thank you for our recent discussion about Indexed Universal Life insurance as part of your financial strategy. I wanted to follow up with some additional details.

Key benefits we discussed:
- Tax-free death benefit for your beneficiaries
- Cash value accumulation with downside protection
- Tax-advantaged policy loans for retirement income
- Flexibility in premium payments

I've attached an updated illustration based on the parameters we discussed. Please review it at your convenience, and let me know if you'd like to schedule a follow-up call.

Best regards,
{advisor_name}`,
    category: "Strategy",
  },
];

const CATEGORIES = Array.from(new Set(TEMPLATES.map((t) => t.category)));

export function BulkEmailTemplates({ onClose }: { onClose: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = selectedCategory
    ? TEMPLATES.filter((t) => t.category === selectedCategory)
    : TEMPLATES;

  const copyToClipboard = async (template: EmailTemplate) => {
    const text = `Subject: ${template.subject}\n\n${template.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(template.id);
    toast.success("Template copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0a1628] border border-[#1a3055] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#1a3055] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[#3b82f6]" />
            <h2 className="text-white font-bold">Email Templates</h2>
          </div>
          <button onClick={onClose} className="text-[#7a95b8] hover:text-white">
            &times;
          </button>
        </div>

        {/* Category filter */}
        <div className="px-4 py-3 border-b border-[#12233e] flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30" : "bg-[#12233e] text-[#7a95b8] border border-transparent"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30" : "bg-[#12233e] text-[#7a95b8] border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.map((template) => (
            <div key={template.id} className="border border-[#12233e] rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-[#0f1e35] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedId === template.id ? <ChevronDown size={14} className="text-[#7a95b8]" /> : <ChevronRight size={14} className="text-[#7a95b8]" />}
                  <div className="text-left">
                    <div className="text-sm text-white font-medium">{template.name}</div>
                    <div className="text-xs text-[#7a95b8]">{template.subject}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#12233e] text-[#7a95b8]">{template.category}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(template);
                    }}
                    className="p-1.5 rounded hover:bg-[#1a3055] transition-colors"
                  >
                    {copiedId === template.id ? <Check size={14} className="text-[#22c55e]" /> : <Copy size={14} className="text-[#7a95b8]" />}
                  </button>
                </div>
              </button>
              {expandedId === template.id && (
                <div className="px-4 pb-3 border-t border-[#12233e]">
                  <pre className="text-xs text-[#c8d8ec] whitespace-pre-wrap font-sans mt-2 leading-relaxed">
                    {template.body}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
