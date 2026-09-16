import{b as T,c as S,d as k,e as W,f as A}from"./chunk-FISMAJ7G.js";import"./chunk-KJNFJTD2.js";import{f as ie}from"./chunk-32HLAYPJ.js";import"./chunk-DZDPAEQJ.js";import{a as se}from"./chunk-WTTRPGEJ.js";import"./chunk-MUZAU57M.js";import"./chunk-J5OVICBR.js";import"./chunk-4G2ZUPVP.js";import{a as i,b as h,c as u,e as s}from"./chunk-VJ67OVVZ.js";import"./chunk-6D65WVNF.js";import"./chunk-QX6D7LOU.js";import"./chunk-4JATSXBE.js";import"./chunk-7VVRQE4J.js";import"./chunk-DRLZ6I7O.js";import"./chunk-SUKEMNR6.js";import"./chunk-VDHDOSPI.js";import"./chunk-WC6G42GD.js";import"./chunk-4R7Z3LRA.js";import"./chunk-MN64LCTS.js";import"./chunk-CSUKODL6.js";import"./chunk-IFE7HSOP.js";import"./chunk-4XG2FIIL.js";import"./chunk-UIVH4P5E.js";import{a as y}from"./chunk-ZDQKPCL3.js";import"./chunk-Z4R3KCEB.js";import"./chunk-A7PUPJLP.js";import"./chunk-IAESP2BT.js";import{a as f}from"./chunk-HINXIEN5.js";import"./chunk-AZECHMBS.js";import{a as X}from"./chunk-NBB4JLAB.js";import"./chunk-CA2KUVWV.js";import{f as Q}from"./chunk-XS7H6XJ7.js";import{Cb as ee,Vd as oe,Xa as Z,Yc as ae,_b as te,he as C,nd as re,pa as J,qd as ne,v as x,xa as _,zd as $}from"./chunk-WIGFMRSE.js";import"./chunk-SWTA47RB.js";import"./chunk-VDIFRGKY.js";import{d as N,k as V,m as fe,o as D,p as q}from"./chunk-KECI53AB.js";V();D();var l=N(fe(),1);var e=N(q(),1),le=[{id:"retirement-rescue",label:"Retirement Rescue",description:"How you saved their retirement from disaster",icon:ne,color:"text-blue-400"},{id:"tax-savings",label:"Tax Savings Hero",description:"The strategy that saved them thousands in taxes",icon:_,color:"text-green-400"},{id:"family-protection",label:"Family Protection",description:"How their family is now protected forever",icon:ee,color:"text-red-400"},{id:"wealth-growth",label:"Wealth Growth",description:"The journey from worried to wealthy",icon:oe,color:"text-emerald-400"},{id:"legacy-builder",label:"Legacy Builder",description:"Building generational wealth that lasts",icon:C,color:"text-amber-400"}],de=[{id:"emotional",label:"Emotional & Heartfelt"},{id:"professional",label:"Professional & Polished"},{id:"urgent",label:"Urgent & Compelling"},{id:"inspirational",label:"Inspirational & Uplifting"},{id:"conversational",label:"Casual & Conversational"}];function ye(){var R,F,M,G;let{user:be}=X(),me=Q.clients.list.useQuery(),[b,ce]=(0,l.useState)(""),[g,he]=(0,l.useState)(""),[B,ue]=(0,l.useState)("emotional"),[n,ge]=(0,l.useState)(""),[v,pe]=(0,l.useState)(""),[K,I]=(0,l.useState)(!1),d=me.data,m=d==null?void 0:d.find(t=>{var a;return((a=t.id)==null?void 0:a.toString())===b}),H=async()=>{var O,j,E,U,Y,z;if(!b||!g){f.error("Please select a client and story template.");return}I(!0);let t=m,a=(t==null?void 0:t.name)||`${(O=t==null?void 0:t.firstName)!=null?O:""} ${(j=t==null?void 0:t.lastName)!=null?j:""}`.trim()||"the client",c=(E=t==null?void 0:t.age)!=null?E:"unknown",r=Number((U=t==null?void 0:t.totalNetWorth)!=null?U:0),o=Number((Y=t==null?void 0:t.iraBalance)!=null?Y:0),P=Number((z=t==null?void 0:t.rothBalance)!=null?z:0),w=le.find(p=>p.id===g),xe=de.find(p=>p.id===B);await new Promise(p=>setTimeout(p,2e3));let L={"retirement-rescue":`**${a}'s Retirement Rescue**

When ${a}, age ${c}, first walked into our office, they were carrying a weight most people never talk about \u2014 the quiet terror of running out of money.

Their ${o>0?`IRA of $${(o/1e3).toFixed(0)}K`:"retirement accounts"} ${P>0?`and Roth balance of $${(P/1e3).toFixed(0)}K`:""} looked like numbers on a page. But behind those numbers was a ${c>60?"couple who'd worked their entire lives":"family with decades of dreams ahead"}.

**The Problem:** Without intervention, ${a} was on track to ${r>5e5?"lose over $"+Math.round(r*.15/1e3)+"K to unnecessary taxes":"face a significant retirement shortfall"}.

**The Solution:** Through a carefully designed ${w==null?void 0:w.label} strategy, we restructured their portfolio to maximize tax-free growth while protecting their principal.

**The Result:** ${a} now has a retirement plan that provides ${r>0?"$"+Math.round(r*.04/12).toLocaleString()+"/month":"reliable monthly income"} in tax-efficient income \u2014 for life.

*"I sleep better now than I have in years."* \u2014 ${a}

${n?`
**Additional Context:** ${n}`:""}`,"tax-savings":`**How ${a} Saved $${Math.round(r*.12/1e3)}K in Taxes**

Most people think taxes are inevitable. ${a} thought so too \u2014 until we showed them the math.

With ${o>0?`$${(o/1e3).toFixed(0)}K sitting in a traditional IRA`:"significant pre-tax retirement assets"}, ${a} was looking at a tax time bomb. Every dollar withdrawn would be taxed at their highest marginal rate.

**The Strategy:** A multi-year Roth conversion ladder, timed to their specific tax brackets, combined with strategic income shifting.

**Year 1:** Converted $${Math.round(r*.05/1e3)}K at the 22% bracket \u2014 saving vs. the 32% they'd pay later.
**Year 2-5:** Systematic conversions totaling $${Math.round(r*.2/1e3)}K, all at favorable rates.

**Total Tax Savings:** $${Math.round(r*.12/1e3)}K over 10 years.

That's not a rounding error. That's a vacation home. That's their grandchildren's education. That's freedom.

${n?`
**Additional Context:** ${n}`:""}`,"family-protection":`**The Day ${a}'s Family Became Untouchable**

Nobody likes to think about the worst-case scenario. But ${a}, age ${c}, had the courage to face it head-on.

With a total estate of $${(r/1e3).toFixed(0)}K, their family was exposed. No trust structure. No succession plan. No safety net.

**What We Built:**
- A comprehensive estate plan that protects every dollar
- Life insurance structured to cover estate taxes
- A trust that ensures their wishes are honored \u2014 not the government's

**The Moment It Clicked:** When ${a} saw the side-by-side comparison \u2014 their family's future WITH our plan vs. WITHOUT \u2014 they didn't speak for a full minute. Then they said:

*"Why didn't someone show me this ten years ago?"*

Because nobody cared enough to. We do.

${n?`
**Additional Context:** ${n}`:""}`,"wealth-growth":`**${a}'s Journey: From Worried to Wealthy**

A year ago, ${a} was worried. Not the kind of worry that keeps you up at night \u2014 the kind that sits in the back of your mind during every family dinner, every vacation, every quiet moment.

*"Am I going to be okay?"*

With $${(r/1e3).toFixed(0)}K in total assets, they weren't poor. But they weren't confident either.

**The Transformation:**

We didn't just move money around. We built a system:
1. Tax-optimized withdrawals that save $${Math.round(r*.03/1e3)}K/year
2. Growth-oriented allocations in protected vehicles
3. A guaranteed income floor that can never run out

**12 Months Later:** ${a}'s portfolio has grown, their tax bill has shrunk, and for the first time in years, they're not worried.

They're excited.

${n?`
**Additional Context:** ${n}`:""}`,"legacy-builder":`**${a}: Building a Legacy That Outlives Them**

Some people save for retirement. ${a} is building something bigger.

With $${(r/1e3).toFixed(0)}K in assets and a family that spans generations, ${a} didn't just want financial security. They wanted a legacy.

**The Vision:** Every child and grandchild inherits not just money, but a system \u2014 a financial framework that grows, protects, and provides for generations.

**What We Designed:**
- A dynasty trust structure that shields wealth from estate taxes
- Indexed universal life policies that create tax-free generational transfers
- A family governance framework that teaches financial literacy

**The Numbers:** Over 3 generations, this plan is projected to transfer $${Math.round(r*3.5/1e3)}K in total wealth \u2014 tax-efficiently.

That's not financial planning. That's empire building.

*"My grandfather worked in a factory. My grandchildren will never have to worry."* \u2014 ${a}

${n?`
**Additional Context:** ${n}`:""}`};pe(L[g]||L["retirement-rescue"]),I(!1),f.success("Story generated! +75 XP")};return(0,e.jsx)(ie,{children:(0,e.jsxs)("div",{className:"min-h-screen bg-background",children:[(0,e.jsx)("div",{className:"border-b border-border/30 bg-gradient-to-r from-rose-500/5 via-background to-emerald-500/5",children:(0,e.jsx)("div",{className:"container py-6",children:(0,e.jsxs)("div",{className:"flex items-center gap-3",children:[(0,e.jsx)("div",{className:"w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-emerald-600 flex items-center justify-center",children:(0,e.jsx)(x,{className:"w-5 h-5 text-white"})}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h1",{className:"text-2xl font-bold text-white",children:"Client Story Generator"}),(0,e.jsx)("p",{className:"text-sm text-muted-foreground",children:"Transform cold numbers into warm stories that close deals."})]})]})})}),(0,e.jsx)("div",{className:"container py-8",children:(0,e.jsxs)("div",{className:"grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto",children:[(0,e.jsxs)("div",{className:"space-y-6",children:[(0,e.jsxs)(i,{className:"border-border/30",children:[(0,e.jsx)(h,{children:(0,e.jsxs)(u,{className:"text-base flex items-center gap-2",children:[(0,e.jsx)(C,{className:"w-4 h-4 text-blue-400"})," Select Client"]})}),(0,e.jsxs)(s,{children:[(0,e.jsxs)(T,{value:b,onValueChange:ce,children:[(0,e.jsx)(k,{children:(0,e.jsx)(S,{placeholder:"Choose a client..."})}),(0,e.jsx)(W,{children:(d!=null?d:[]).map(t=>{var a,c,r,o;return(0,e.jsxs)(A,{value:(a=t.id)==null?void 0:a.toString(),children:[t.name||`${(c=t.firstName)!=null?c:""} ${(r=t.lastName)!=null?r:""}`.trim()," \u2014 $",(Number((o=t.totalNetWorth)!=null?o:0)/1e3).toFixed(0),"K"]},t.id)})})]}),m&&(0,e.jsxs)("div",{className:"mt-3 p-3 rounded-lg bg-white/5 text-xs text-muted-foreground space-y-1",children:[(0,e.jsxs)("p",{children:["Age: ",(R=m.age)!=null?R:"N/A"," | Net Worth: $",(Number((F=m.totalNetWorth)!=null?F:0)/1e3).toFixed(0),"K"]}),(0,e.jsxs)("p",{children:["IRA: $",(Number((M=m.iraBalance)!=null?M:0)/1e3).toFixed(0),"K | Roth: $",(Number((G=m.rothBalance)!=null?G:0)/1e3).toFixed(0),"K"]})]})]})]}),(0,e.jsxs)(i,{className:"border-border/30",children:[(0,e.jsx)(h,{children:(0,e.jsxs)(u,{className:"text-base flex items-center gap-2",children:[(0,e.jsx)(Z,{className:"w-4 h-4 text-emerald-400"})," Story Template"]})}),(0,e.jsx)(s,{className:"space-y-2",children:le.map(t=>{let a=t.icon;return(0,e.jsxs)("button",{onClick:()=>he(t.id),className:`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${g===t.id?"bg-emerald-500/10 border border-emerald-500/30":"hover:bg-white/5 border border-transparent"}`,children:[(0,e.jsx)(a,{className:`w-5 h-5 ${t.color} shrink-0`}),(0,e.jsxs)("div",{children:[(0,e.jsx)("p",{className:"text-sm font-medium text-white",children:t.label}),(0,e.jsx)("p",{className:"text-xs text-muted-foreground",children:t.description})]})]},t.id)})})]}),(0,e.jsxs)(i,{className:"border-border/30",children:[(0,e.jsx)(h,{children:(0,e.jsxs)(u,{className:"text-base flex items-center gap-2",children:[(0,e.jsx)($,{className:"w-4 h-4 text-amber-400"})," Tone"]})}),(0,e.jsx)(s,{children:(0,e.jsxs)(T,{value:B,onValueChange:ue,children:[(0,e.jsx)(k,{children:(0,e.jsx)(S,{})}),(0,e.jsx)(W,{children:de.map(t=>(0,e.jsx)(A,{value:t.id,children:t.label},t.id))})]})})]}),(0,e.jsxs)(i,{className:"border-border/30",children:[(0,e.jsx)(h,{children:(0,e.jsx)(u,{className:"text-base",children:"Additional Context (Optional)"})}),(0,e.jsx)(s,{children:(0,e.jsx)(se,{value:n,onChange:t=>ge(t.target.value),placeholder:"Add any personal details, specific wins, or emotional moments to include...",rows:3})})]}),(0,e.jsx)(y,{onClick:H,disabled:K||!b||!g,className:"w-full bg-gradient-to-r from-rose-600 to-emerald-600 hover:from-rose-700 hover:to-emerald-700 h-12 text-lg",children:K?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(te,{className:"w-5 h-5 mr-2 animate-spin"})," Crafting Your Story..."]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)($,{className:"w-5 h-5 mr-2"})," Generate Story"]})})]}),(0,e.jsx)("div",{children:v?(0,e.jsxs)(i,{className:"border-emerald-500/20 sticky top-4",children:[(0,e.jsxs)(h,{className:"flex flex-row items-center justify-between",children:[(0,e.jsxs)(u,{className:"text-lg flex items-center gap-2",children:[(0,e.jsx)(x,{className:"w-5 h-5 text-emerald-400"})," Your Story"]}),(0,e.jsxs)("div",{className:"flex gap-2",children:[(0,e.jsxs)(y,{variant:"outline",size:"sm",onClick:()=>{navigator.clipboard.writeText(v.replace(/\*\*/g,"")),f.success("Copied!")},children:[(0,e.jsx)(J,{className:"w-4 h-4 mr-1"})," Copy"]}),(0,e.jsxs)(y,{variant:"outline",size:"sm",onClick:()=>f.success("Shared! +25 XP"),children:[(0,e.jsx)(re,{className:"w-4 h-4 mr-1"})," Share"]})]})]}),(0,e.jsxs)(s,{children:[(0,e.jsx)("div",{className:"prose prose-invert prose-sm max-w-none",children:v.split(`
`).map((t,a)=>t.startsWith("**")&&t.endsWith("**")?(0,e.jsx)("h3",{className:"text-lg font-bold text-white mt-4 mb-2",children:t.replace(/\*\*/g,"")},a):t.startsWith("*")&&t.endsWith("*")?(0,e.jsx)("p",{className:"italic text-emerald-400/80",children:t.replace(/\*/g,"")},a):t.startsWith("- ")||t.startsWith("1.")?(0,e.jsx)("p",{className:"text-muted-foreground ml-4",children:t},a):t.trim()===""?(0,e.jsx)("br",{},a):(0,e.jsx)("p",{className:"text-muted-foreground leading-relaxed",children:t.replace(/\*\*/g,"")},a))}),(0,e.jsx)("div",{className:"mt-6 flex gap-2",children:(0,e.jsxs)(y,{variant:"outline",size:"sm",onClick:H,children:[(0,e.jsx)(ae,{className:"w-4 h-4 mr-1"})," Regenerate"]})})]})]}):(0,e.jsx)(i,{className:"border-border/30 border-dashed",children:(0,e.jsxs)(s,{className:"p-12 text-center",children:[(0,e.jsx)(x,{className:"w-16 h-16 text-muted-foreground/30 mx-auto mb-4"}),(0,e.jsx)("h3",{className:"text-lg font-semibold text-muted-foreground mb-2",children:"Your Story Will Appear Here"}),(0,e.jsx)("p",{className:"text-sm text-muted-foreground/60",children:"Select a client, choose a template, and click Generate to create a compelling narrative."})]})})})]})})]})})}export{ye as default};
