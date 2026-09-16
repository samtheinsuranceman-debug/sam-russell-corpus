/**
 * Deterministic consumer health-data rights summary.
 *
 * Do not use an LLM to invent or interpret legal rights at runtime. This module
 * intentionally provides a conservative product-level baseline plus the one
 * state-specific consumer-health rule set the public release explicitly
 * supports in-product (Washington). It is informational, not legal advice.
 */

export interface StateRightsResult {
  state: string;
  laws: Array<{ name: string; summary: string }>;
  rights: string[];
  healthDataSpecific: string[];
  optOutInstructions: string;
  contactInfo: string;
  generated: boolean;
  disclaimer: string;
}

const DISCLAIMER =
  "Product privacy summary, not legal advice. Privacy requirements vary by state and can change. The app's universal privacy controls remain available regardless of location.";

const universalRights = [
  "Request a copy/export of information associated with your account.",
  "Request deletion of consumer health information associated with your account, subject to limited legal or security exceptions.",
  "Withdraw optional activity logging or personalization consent going forward.",
  "Use core support features without permitting health-data advertising or sale; Doctor Buddy does not sell consumer health data or use it for targeted advertising.",
  "Contact the privacy address listed in the app with a privacy request or complaint.",
];

function generic(state: string): StateRightsResult {
  return {
    state,
    laws: [
      {
        name: "Doctor Buddy Consumer Health Data Commitments",
        summary:
          "The public wellness edition applies data minimization, access/export, deletion, consent controls, and a no-health-data-advertising/sale rule as product-wide protections.",
      },
    ],
    rights: universalRights,
    healthDataSpecific: [
      "The public wellness edition does not treat HIPAA as automatically applicable merely because information relates to health.",
      "If Doctor Buddy is separately deployed on behalf of a HIPAA covered entity or business associate, that regulated deployment must use its HIPAA/BAA configuration and organizational safeguards.",
    ],
    optOutInstructions:
      "Use Account & Privacy to export or delete your information and to change optional consent settings, or contact the privacy address shown in the Privacy Policy.",
    contactInfo: process.env.PRIVACY_CONTACT_EMAIL || "See the Privacy Policy for the current privacy contact.",
    generated: false,
    disclaimer: DISCLAIMER,
  };
}

export async function generateStateRights(state: string): Promise<StateRightsResult> {
  const normalized = state.trim().toLowerCase();
  const base = generic(state);

  if (["wa", "washington", "washington state"].includes(normalized)) {
    return {
      ...base,
      laws: [
        ...base.laws,
        {
          name: "Washington My Health My Data Act",
          summary:
            "Washington provides rights and consent requirements for certain consumer health data outside traditional HIPAA coverage, including a dedicated consumer health data privacy policy and controls around collection, sharing, sale, access, and deletion.",
        },
      ],
      rights: [
        ...base.rights,
        "Washington users may exercise applicable My Health My Data rights through the app's privacy controls or privacy contact.",
      ],
      healthDataSpecific: [
        ...base.healthDataSpecific,
        "Doctor Buddy publishes a separate Consumer Health Data Privacy Policy and does not sell consumer health data.",
      ],
    };
  }

  return base;
}
