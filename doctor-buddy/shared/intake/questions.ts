/**
 * The 100-item DSM-5-aligned intake.
 *
 * Single source of truth for the question bank and its branch logic, shared by
 * the intake UI and the scorer. It previously lived only inside the page
 * component, which meant nothing server-side or test-side could see it.
 */

export type QuestionType = "frequency" | "yesno" | "severity" | "duration" | "scale";

export interface IntakeQuestion {
  id: number;
  text: string;
  domain: string;
  type: string;
  options: string[];
}

export const DSM5_QUESTIONS: IntakeQuestion[] = [
  // Depression Domain (1-14)
  { id: 1, text: "Over the past two weeks, have you felt little interest or pleasure in doing things?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Over the past two weeks, have you felt down, depressed, or hopeless?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Have you had trouble falling or staying asleep, or sleeping too much?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Have you felt tired or had little energy?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Have you had a poor appetite or been overeating?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Have you felt bad about yourself — or that you are a failure or have let yourself or your family down?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 7, text: "Have you had trouble concentrating on things, such as reading the newspaper or watching television?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 8, text: "Have you been moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 9, text: "Have you had thoughts that you would be better off dead, or of hurting yourself in some way?", domain: "Depression", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 10, text: "Have you experienced periods of feeling extremely sad that lasted most of the day, nearly every day, for at least two weeks?", domain: "Depression", type: "yesno", options: ["Yes", "No"] },
  { id: 11, text: "Have you lost interest in activities you previously enjoyed for an extended period?", domain: "Depression", type: "yesno", options: ["Yes", "No"] },
  { id: 12, text: "Have you experienced significant weight loss or gain (more than 5% of body weight in a month) without trying?", domain: "Depression", type: "yesno", options: ["Yes", "No"] },
  { id: 13, text: "Do these depressive symptoms cause significant distress or impairment in your social, occupational, or other important areas of functioning?", domain: "Depression", type: "yesno", options: ["Yes", "No"] },
  { id: 14, text: "Have you had more than one episode of depression in your lifetime?", domain: "Depression", type: "yesno", options: ["Yes", "No"] },
  // Anxiety Domain (15-28)
  { id: 15, text: "Over the past two weeks, how often have you been feeling nervous, anxious, or on edge?", domain: "Anxiety", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 16, text: "How often have you not been able to stop or control worrying?", domain: "Anxiety", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 17, text: "How often have you been worrying too much about different things?", domain: "Anxiety", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 18, text: "How often have you had trouble relaxing?", domain: "Anxiety", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 19, text: "How often have you been so restless that it is hard to sit still?", domain: "Anxiety", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 20, text: "How often have you become easily annoyed or irritable?", domain: "Anxiety", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 21, text: "How often have you felt afraid, as if something awful might happen?", domain: "Anxiety", type: "frequency", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 22, text: "Have you experienced sudden episodes of intense fear or discomfort that reached a peak within minutes (panic attacks)?", domain: "Anxiety", type: "yesno", options: ["Yes", "No"] },
  { id: 23, text: "Do you avoid situations or places because you fear having a panic attack or feeling trapped?", domain: "Anxiety", type: "yesno", options: ["Yes", "No"] },
  { id: 24, text: "Do you have a marked fear of specific objects or situations (e.g., heights, animals, needles, flying)?", domain: "Anxiety", type: "yesno", options: ["Yes", "No"] },
  { id: 25, text: "Do you fear or avoid social situations because you might be embarrassed, humiliated, or scrutinized by others?", domain: "Anxiety", type: "yesno", options: ["Yes", "No"] },
  { id: 26, text: "Do your anxiety symptoms cause significant distress or impairment in daily functioning?", domain: "Anxiety", type: "yesno", options: ["Yes", "No"] },
  { id: 27, text: "Have you experienced physical symptoms of anxiety such as heart pounding, sweating, trembling, or shortness of breath?", domain: "Anxiety", type: "yesno", options: ["Yes", "No"] },
  { id: 28, text: "Has your anxiety been present for more than 6 months?", domain: "Anxiety", type: "yesno", options: ["Yes", "No"] },
  // PTSD Domain (29-38)
  { id: 29, text: "Have you experienced or witnessed a traumatic event involving actual or threatened death, serious injury, or sexual violence?", domain: "PTSD", type: "yesno", options: ["Yes", "No"] },
  { id: 30, text: "Do you have recurrent, involuntary, and intrusive distressing memories of the traumatic event?", domain: "PTSD", type: "frequency", options: ["Never", "Rarely", "Sometimes", "Often", "Always"] },
  { id: 31, text: "Do you have recurrent distressing dreams related to the traumatic event?", domain: "PTSD", type: "frequency", options: ["Never", "Rarely", "Sometimes", "Often", "Always"] },
  { id: 32, text: "Do you experience flashbacks where you feel as if the traumatic event is recurring?", domain: "PTSD", type: "yesno", options: ["Yes", "No"] },
  { id: 33, text: "Do you avoid thoughts, feelings, or reminders associated with the traumatic event?", domain: "PTSD", type: "yesno", options: ["Yes", "No"] },
  { id: 34, text: "Do you feel emotionally numb or detached from others since the traumatic event?", domain: "PTSD", type: "yesno", options: ["Yes", "No"] },
  { id: 35, text: "Are you easily startled or do you feel constantly on guard (hypervigilance)?", domain: "PTSD", type: "yesno", options: ["Yes", "No"] },
  { id: 36, text: "Do you have difficulty sleeping or concentrating since the traumatic event?", domain: "PTSD", type: "yesno", options: ["Yes", "No"] },
  { id: 37, text: "Do you have persistent negative beliefs about yourself or the world following the trauma?", domain: "PTSD", type: "yesno", options: ["Yes", "No"] },
  { id: 38, text: "Have these trauma-related symptoms lasted more than one month?", domain: "PTSD", type: "yesno", options: ["Yes", "No"] },
  // Bipolar Domain (39-48)
  { id: 39, text: "Have you ever had a period of time when you felt so good, high, or hyper that other people thought you were not your normal self?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 40, text: "Have you ever had a period when you were so irritable that you shouted at people or started fights or arguments?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 41, text: "During these high periods, did you feel much more self-confident than usual?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 42, text: "During these high periods, did you need much less sleep than usual and still feel rested?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 43, text: "During these high periods, were you much more talkative or did you speak faster than usual?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 44, text: "During these high periods, did thoughts race through your head or could you not slow your mind down?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 45, text: "During these high periods, were you so easily distracted that you had trouble concentrating?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 46, text: "During these high periods, did you engage in risky behaviors (spending sprees, sexual indiscretions, reckless driving)?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 47, text: "Did any of these high periods last at least 4 days and were clearly different from your usual self?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  { id: 48, text: "Have you ever been hospitalized or had legal/financial problems during a high period?", domain: "Bipolar", type: "yesno", options: ["Yes", "No"] },
  // OCD Domain (49-55)
  { id: 49, text: "Do you have unwanted thoughts, images, or urges that repeatedly enter your mind and cause distress?", domain: "OCD", type: "yesno", options: ["Yes", "No"] },
  { id: 50, text: "Do you feel driven to perform certain behaviors or mental acts in response to these thoughts?", domain: "OCD", type: "yesno", options: ["Yes", "No"] },
  { id: 51, text: "Do you spend more than one hour per day on these obsessive thoughts or compulsive behaviors?", domain: "OCD", type: "yesno", options: ["Yes", "No"] },
  { id: 52, text: "Do you recognize that your obsessions or compulsions are excessive or unreasonable?", domain: "OCD", type: "yesno", options: ["Yes", "No"] },
  { id: 53, text: "Do you have concerns about contamination, symmetry, harm, or forbidden thoughts?", domain: "OCD", type: "yesno", options: ["Yes", "No"] },
  { id: 54, text: "Do these obsessions or compulsions significantly interfere with your daily routine, work, or relationships?", domain: "OCD", type: "yesno", options: ["Yes", "No"] },
  { id: 55, text: "Have you tried to suppress or ignore these obsessions without success?", domain: "OCD", type: "yesno", options: ["Yes", "No"] },
  // Psychosis Domain (56-63)
  { id: 56, text: "Have you ever heard voices or sounds that others could not hear?", domain: "Psychosis", type: "yesno", options: ["Yes", "No"] },
  { id: 57, text: "Have you ever seen things or had visions that others could not see?", domain: "Psychosis", type: "yesno", options: ["Yes", "No"] },
  { id: 58, text: "Have you ever believed that people were following you, spying on you, or plotting against you?", domain: "Psychosis", type: "yesno", options: ["Yes", "No"] },
  { id: 59, text: "Have you ever had the experience of receiving special messages from the TV, radio, or internet meant specifically for you?", domain: "Psychosis", type: "yesno", options: ["Yes", "No"] },
  { id: 60, text: "Have you ever had beliefs that others found strange or bizarre?", domain: "Psychosis", type: "yesno", options: ["Yes", "No"] },
  { id: 61, text: "Have you ever felt that your thoughts were being broadcast so that others could hear them?", domain: "Psychosis", type: "yesno", options: ["Yes", "No"] },
  { id: 62, text: "Have you ever experienced a significant period of disorganized thinking or speech?", domain: "Psychosis", type: "yesno", options: ["Yes", "No"] },
  { id: 63, text: "Have these experiences caused significant distress or impairment in your functioning?", domain: "Psychosis", type: "yesno", options: ["Yes", "No"] },
  // Substance Use Domain (64-71)
  { id: 64, text: "Have you used alcohol or drugs more than you intended to in the past 12 months?", domain: "Substance Use", type: "yesno", options: ["Yes", "No"] },
  { id: 65, text: "Have you tried to cut down or stop using alcohol or drugs but found you could not?", domain: "Substance Use", type: "yesno", options: ["Yes", "No"] },
  { id: 66, text: "Have you spent a great deal of time obtaining, using, or recovering from alcohol or drugs?", domain: "Substance Use", type: "yesno", options: ["Yes", "No"] },
  { id: 67, text: "Have you experienced cravings or strong urges to use alcohol or drugs?", domain: "Substance Use", type: "yesno", options: ["Yes", "No"] },
  { id: 68, text: "Has your substance use caused problems with your work, school, or home responsibilities?", domain: "Substance Use", type: "yesno", options: ["Yes", "No"] },
  { id: 69, text: "Have you continued using substances despite it causing problems in your relationships?", domain: "Substance Use", type: "yesno", options: ["Yes", "No"] },
  { id: 70, text: "Have you experienced withdrawal symptoms when you stopped or reduced your substance use?", domain: "Substance Use", type: "yesno", options: ["Yes", "No"] },
  { id: 71, text: "Have you needed to use more of the substance to get the same effect (tolerance)?", domain: "Substance Use", type: "yesno", options: ["Yes", "No"] },
  // ADHD Domain (72-79) — Q72 is gateway
  { id: 72, text: "Do you have significant difficulty with attention, concentration, hyperactivity, or impulsivity that interferes with your daily life?", domain: "ADHD", type: "yesno", options: ["Yes", "No"] },
  { id: 73, text: "How often do you have trouble wrapping up the final details of a project after the challenging parts have been done?", domain: "ADHD", type: "frequency", options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"] },
  { id: 74, text: "How often do you have difficulty getting things in order when you have to do a task that requires organization?", domain: "ADHD", type: "frequency", options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"] },
  { id: 75, text: "How often do you have problems remembering appointments or obligations?", domain: "ADHD", type: "frequency", options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"] },
  { id: 76, text: "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?", domain: "ADHD", type: "frequency", options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"] },
  { id: 77, text: "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?", domain: "ADHD", type: "frequency", options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"] },
  { id: 78, text: "How often do you feel overly active and compelled to do things, like you were driven by a motor?", domain: "ADHD", type: "frequency", options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"] },
  { id: 79, text: "Have these attention or hyperactivity symptoms been present since childhood (before age 12)?", domain: "ADHD", type: "yesno", options: ["Yes", "No"] },
  // Personality Disorders Domain (80-88) — Q80 is gateway
  { id: 80, text: "Do you have significant and persistent difficulties in how you relate to others, your sense of identity, or controlling your emotions and impulses?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  { id: 81, text: "Do you have a pattern of unstable and intense interpersonal relationships alternating between idealization and devaluation?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  { id: 82, text: "Do you have a persistent unstable sense of identity or self-image?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  { id: 83, text: "Do you engage in impulsive behaviors that are potentially self-damaging (spending, sex, substance use, reckless driving)?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  { id: 84, text: "Do you have recurrent suicidal behavior, gestures, threats, or self-mutilating behavior?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  { id: 85, text: "Do you experience intense episodic dysphoria, irritability, or anxiety usually lasting a few hours?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  { id: 86, text: "Do you have a pervasive pattern of grandiosity, need for admiration, and lack of empathy?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  { id: 87, text: "Do you have a pervasive distrust and suspiciousness of others such that their motives are interpreted as malevolent?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  { id: 88, text: "Have these personality patterns been stable and of long duration, traceable back to adolescence or early adulthood?", domain: "Personality", type: "yesno", options: ["Yes", "No"] },
  // Somatic / Sleep / Eating (89-100) — Q89 is gateway
  { id: 89, text: "Do you have significant concerns about physical symptoms, sleep problems, or eating/weight that are causing distress or interfering with your life?", domain: "Somatic", type: "yesno", options: ["Yes", "No"] },
  { id: 90, text: "Do you have one or more somatic symptoms that are distressing or result in significant disruption of daily life?", domain: "Somatic", type: "yesno", options: ["Yes", "No"] },
  { id: 91, text: "Do you have excessive thoughts, feelings, or behaviors related to somatic symptoms or associated health concerns?", domain: "Somatic", type: "yesno", options: ["Yes", "No"] },
  { id: 92, text: "Do you have difficulty initiating or maintaining sleep, or early-morning awakening at least 3 nights per week?", domain: "Sleep", type: "yesno", options: ["Yes", "No"] },
  { id: 93, text: "Has your sleep difficulty caused significant distress or impairment in social, occupational, or other functioning?", domain: "Sleep", type: "yesno", options: ["Yes", "No"] },
  { id: 94, text: "Do you restrict your caloric intake leading to a significantly low body weight in the context of age, sex, and health?", domain: "Eating", type: "yesno", options: ["Yes", "No"] },
  { id: 95, text: "Do you have recurrent episodes of eating an unusually large amount of food in a discrete period of time?", domain: "Eating", type: "yesno", options: ["Yes", "No"] },
  { id: 96, text: "Do you engage in compensatory behaviors such as purging, excessive exercise, or fasting after eating?", domain: "Eating", type: "yesno", options: ["Yes", "No"] },
  { id: 97, text: "How would you rate your overall current mental health? (1 = very poor, 10 = excellent)", domain: "General", type: "scale", options: ["1","2","3","4","5","6","7","8","9","10"] },
  { id: 98, text: "How long have you been experiencing your primary mental health concerns?", domain: "General", type: "duration", options: ["Less than 2 weeks", "2-4 weeks", "1-3 months", "3-6 months", "6-12 months", "1-2 years", "More than 2 years"] },
  { id: 99, text: "Have you previously received a psychiatric diagnosis from a licensed professional?", domain: "General", type: "yesno", options: ["Yes", "No"] },
  { id: 100, text: "Are you currently taking any psychiatric medications?", domain: "General", type: "yesno", options: ["Yes", "No"] },
];

export const BRANCH_RULES: { gateId: number; gateAnswer: string; skipIds: number[] }[] = [
  // PTSD: if Q29 (trauma exposure) = No → skip all PTSD follow-ups 30-38
  { gateId: 29, gateAnswer: "No", skipIds: [30,31,32,33,34,35,36,37,38] },
  // Bipolar: if Q39 AND Q40 both No → skip Bipolar follow-ups 41-48
  // (handled via combined gate below)
  { gateId: 39, gateAnswer: "No", skipIds: [41,42,43,44,45,46,47,48] },
  { gateId: 40, gateAnswer: "No", skipIds: [41,42,43,44,45,46,47,48] },
  // OCD: if Q49 (obsessions) = No → skip OCD follow-ups 50-55
  { gateId: 49, gateAnswer: "No", skipIds: [50,51,52,53,54,55] },
  // Psychosis: if Q56 (hallucinations) = No AND Q57 = No → skip 58-63
  { gateId: 56, gateAnswer: "No", skipIds: [58,59,60,61,62,63] },
  { gateId: 57, gateAnswer: "No", skipIds: [58,59,60,61,62,63] },
  // Substance Use: if Q64 = No → skip 65-71
  { gateId: 64, gateAnswer: "No", skipIds: [65,66,67,68,69,70,71] },
  // Panic attacks: if Q22 = No → skip agoraphobia Q23
  { gateId: 22, gateAnswer: "No", skipIds: [23] },
  // Bipolar hospitalization: if Q47 = No → skip Q48
  { gateId: 47, gateAnswer: "No", skipIds: [48] },
  // ADHD: if Q72 (ADHD gateway) = No → skip Q73-Q79
  { gateId: 72, gateAnswer: "No", skipIds: [73,74,75,76,77,78,79] },
  // Personality: if Q80 (Personality gateway) = No → skip Q81-Q88
  { gateId: 80, gateAnswer: "No", skipIds: [81,82,83,84,85,86,87,88] },
  // Somatic/Sleep/Eating: if Q89 (gateway) = No → skip Q90-Q96
  { gateId: 89, gateAnswer: "No", skipIds: [90,91,92,93,94,95,96] },
];

/**
 * Questions whose endorsement is a safety signal rather than a severity signal.
 * Q9 is passive ideation ("better off dead"); Q84 is recurrent suicidal
 * behaviour or self-mutilation. Both must reach the crisis path regardless of
 * how the rest of the instrument scores.
 */
export const SAFETY_CRITICAL_IDS = [9, 84] as const;

/** Ids skipped under the branch rules, given the answers so far. */
export function getSkippedIds(answers: Record<string, string>): Set<number> {
  const skipped = new Set<number>();
  // Bipolar follow-ups are gated on BOTH stem questions being negative, so the
  // generic single-gate rule below would skip them too eagerly.
  const bipolarBothNo = answers["39"] === "No" && answers["40"] === "No";
  if (bipolarBothNo) [41, 42, 43, 44, 45, 46, 47, 48].forEach(id => skipped.add(id));

  for (const rule of BRANCH_RULES) {
    if ([39, 40].includes(rule.gateId) && rule.skipIds.includes(41)) continue;
    if (answers[rule.gateId.toString()] === rule.gateAnswer) {
      rule.skipIds.forEach(id => skipped.add(id));
    }
  }
  return skipped;
}

/** Questions still in play given the answers so far. */
export function visibleQuestions(answers: Record<string, string>): IntakeQuestion[] {
  const skipped = getSkippedIds(answers);
  return DSM5_QUESTIONS.filter(q => !skipped.has(q.id));
}

export const DOMAINS = Array.from(new Set(DSM5_QUESTIONS.map(q => q.domain)));
