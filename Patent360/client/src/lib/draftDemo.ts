/**
 * Demonstration content for the drafting workbench.
 *
 * A fictional matter for a fictional client. The claim language is written for
 * this mock-up; it describes nothing real and is not a filing of any kind.
 */

export type Claim = {
  n: number;
  /** Null for an independent claim. */
  dependsOn: number | null;
  /** Claim text, split so defined terms can be marked in the editor. */
  text: string;
  status: 'clean' | 'warn' | 'error';
};

export const MATTER = {
  docket: 'BL-2291-US',
  appNo: '18/412,907',
  title: 'Thermal management for stacked battery modules',
  client: 'Nordhaven Energy',
  attorney: 'A. Reyes',
  cpc: 'H01M 10/653',
  draft: 'v7',
  saved: '4 minutes ago'
};

export const CLAIMS: Claim[] = [
  {
    n: 1, dependsOn: null, status: 'clean',
    text: 'A thermal management assembly for a stacked battery module, comprising: a plurality of prismatic cells arranged along a stacking axis; a compliant interstitial layer disposed between each adjacent pair of the prismatic cells; a coolant manifold thermally coupled to a first face of the stacked battery module; and a controller configured to vary a coolant flow rate through the coolant manifold in response to a temperature differential measured across the stacking axis.'
  },
  { n: 2, dependsOn: 1, status: 'clean', text: 'The assembly of claim 1, wherein the compliant interstitial layer comprises a phase-change material.' },
  { n: 3, dependsOn: 2, status: 'clean', text: 'The assembly of claim 2, wherein the phase-change material has a transition temperature between 28 and 42 degrees Celsius.' },
  { n: 4, dependsOn: 1, status: 'warn', text: 'The assembly of claim 1, wherein the coolant manifold defines a plurality of channels having a cross-sectional area that decreases along a flow direction.' },
  { n: 5, dependsOn: 4, status: 'clean', text: 'The assembly of claim 4, wherein each channel of the plurality of channels is aligned with a respective pair of adjacent prismatic cells.' },
  { n: 6, dependsOn: 1, status: 'error', text: 'The assembly of claim 1, wherein the controller is further configured to derate a charge current when the thermal gradient exceeds a threshold value.' },
  { n: 7, dependsOn: 6, status: 'clean', text: 'The assembly of claim 6, wherein the threshold value is determined from a state of charge of the stacked battery module.' },
  { n: 8, dependsOn: null, status: 'warn', text: 'A method of managing heat in a stacked battery module, the method comprising: measuring a temperature at a first end and a second end of the stacked battery module; computing a temperature differential across a stacking axis; and varying a coolant flow rate through a coolant manifold in response to the temperature differential.' },
  { n: 9, dependsOn: 8, status: 'clean', text: 'The method of claim 8, further comprising compressing a compliant interstitial layer disposed between adjacent prismatic cells to a predetermined preload.' },
  { n: 10, dependsOn: 8, status: 'clean', text: 'The method of claim 8, further comprising derating a charge current when the temperature differential exceeds a threshold value.' }
];

export type Issue = {
  kind: 'antecedent' | 'support' | 'numbering' | 'breadth' | 'figure';
  severity: 'error' | 'warn' | 'info';
  claim: number | null;
  title: string;
  detail: string;
};

export const ISSUES: Issue[] = [
  {
    kind: 'antecedent', severity: 'error', claim: 6,
    title: 'No antecedent basis for "the thermal gradient"',
    detail: 'Claim 6 recites "the thermal gradient". Claim 1 recites "a temperature differential". Either amend claim 6 to recite the temperature differential, or introduce the thermal gradient in claim 1.'
  },
  {
    kind: 'support', severity: 'warn', claim: 4,
    title: 'Thin specification support for the tapering channels',
    detail: 'The decreasing cross-sectional area appears in claim 4 and in Fig. 3, but the specification describes it in one sentence at paragraph [0042]. Consider a paragraph covering the range and the purpose.'
  },
  {
    kind: 'support', severity: 'warn', claim: 8,
    title: 'Method claim has no corresponding apparatus limitation',
    detail: 'Claim 8 recites measuring at a first end and a second end. No apparatus claim recites the sensors that perform it. Consider adding a dependent claim to the claim 1 family.'
  },
  {
    kind: 'figure', severity: 'info', claim: null,
    title: 'Figure 4 is not referenced in the specification',
    detail: 'Fig. 4 exists in the drawing set and carries callouts 402 and 404, but no paragraph refers to it.'
  },
  {
    kind: 'breadth', severity: 'info', claim: 3,
    title: 'Numeric range may narrow claim 3 unnecessarily',
    detail: 'The 28 to 42 degree range is narrower than the 24 to 50 degree range described at paragraph [0031]. Confirm the narrower range is intended.'
  }
];

export const SPEC = [
  { id: '[0028]', head: 'Field', ok: true, text: 'The present disclosure relates to thermal management of battery modules, and more particularly to managing temperature gradients across a stack of prismatic cells.' },
  { id: '[0031]', head: 'Interstitial layer', ok: true, text: 'In some embodiments the compliant interstitial layer comprises a phase-change material having a transition temperature in a range from 24 to 50 degrees Celsius…' },
  { id: '[0038]', head: 'Coolant manifold', ok: true, text: 'The coolant manifold 210 is thermally coupled to a first face 208 of the stacked battery module 200 and defines channels 212…' },
  { id: '[0042]', head: 'Channel geometry', ok: false, text: 'The channels 212 may taper along the flow direction.' },
  { id: '[0047]', head: 'Controller', ok: true, text: 'The controller 300 receives a first temperature from sensor 302 and a second temperature from sensor 304, computes a temperature differential…' }
];

export const FIGURES = [
  { id: 'FIG. 1', label: 'Exploded view of the stacked module', callouts: ['100', '102', '104', '106'], refs: 6 },
  { id: 'FIG. 2', label: 'Coolant manifold and cell interface', callouts: ['200', '208', '210', '212'], refs: 9 },
  { id: 'FIG. 3', label: 'Channel cross-section along flow', callouts: ['212', '214'], refs: 3 },
  { id: 'FIG. 4', label: 'Controller block diagram', callouts: ['402', '404'], refs: 0 },
  { id: 'FIG. 5', label: 'Method flow', callouts: ['500', '502', '504'], refs: 4 }
];

export const VERSIONS = [
  { v: 'v7', when: '4 minutes ago', who: 'A. Reyes', note: 'Narrowed claim 3 range; added claim 10' },
  { v: 'v6', when: 'Yesterday, 16:20', who: 'A. Reyes', note: 'Split method claims into their own family' },
  { v: 'v5', when: 'Yesterday, 09:02', who: 'D. Cole', note: 'Figure callouts renumbered to match Fig. 2' },
  { v: 'v4', when: '3 days ago', who: 'D. Cole', note: 'First full draft from the disclosure' }
];

/** Terms the editor marks, and where each is defined. */
export const TERMS: Record<string, string> = {
  'compliant interstitial layer': 'Defined at [0031]. Recited in claims 1, 2, 9.',
  'coolant manifold': 'Defined at [0038], callout 210. Recited in claims 1, 4, 8.',
  'temperature differential': 'Defined at [0047]. Recited in claims 1, 8, 10.',
  'thermal gradient': 'NOT defined in the specification and not introduced in any independent claim.',
  'prismatic cells': 'Defined at [0028], callout 102. Recited in claims 1, 5, 9.',
  'stacking axis': 'Defined at [0028]. Recited in claims 1, 8.'
};
