import{a as y}from"./chunk-ZDQKPCL3.js";import{Xa as x,_b as h,ya as u}from"./chunk-WIGFMRSE.js";import{d as m,k as g,m as w,o as b,p as f}from"./chunk-KECI53AB.js";g();b();var n=m(w(),1);var l=m(f(),1);function a(t){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(t)}function $(t,s){let e=t.clientProfile,o=s==="strategy"?t.title:t.comboName,d=((t.finalNetWorth-e.startingNetWorth)/e.startingNetWorth*100).toFixed(1),c=t.steps.map((i,r)=>`
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#1e293b;text-align:center;">${r+1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:600;color:#1e293b;">${i.strategyName}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${i.description.substring(0,200)}${i.description.length>200?"...":""}</div>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#16a34a;font-weight:600;">${a(i.taxSaved)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#2563eb;font-weight:600;">${a(i.capitalDeployed)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#1e293b;">${a(i.netWorthAfter)}</td>
    </tr>
  `).join("");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${o} \u2014 Russell Capital Systems\u2122</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #0f172a; }
    .logo { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .logo span { color: #16a34a; }
    .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .date { font-size: 12px; color: #64748b; text-align: right; }
    .title-section { margin-bottom: 28px; }
    .title-section h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .title-section .desc { font-size: 13px; color: #475569; line-height: 1.6; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-right: 6px; margin-bottom: 4px; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-purple { background: #ecfdf5; color: #065f46; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .stat-value { font-size: 20px; font-weight: 800; color: #0f172a; }
    .stat-value.green { color: #16a34a; }
    .stat-value.blue { color: #2563eb; }
    .stat-value.purple { color: #059669; }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
    .profile-item { font-size: 12px; }
    .profile-item .label { color: #64748b; font-weight: 500; }
    .profile-item .value { color: #1e293b; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #0f172a; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    .summary-bar { display: flex; justify-content: space-between; background: #0f172a; color: #fff; padding: 16px 20px; border-radius: 8px; margin-top: 20px; }
    .summary-item { text-align: center; }
    .summary-item .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-item .value { font-size: 18px; font-weight: 800; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; line-height: 1.6; }
    .confidential { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #991b1b; margin-bottom: 20px; font-weight: 500; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Russell Capital <span>Systems\u2122</span></div>
      <div class="subtitle">Turn Capital Into Income\u2122</div>
    </div>
    <div class="date">
      <div>Report Generated</div>
      <div style="font-weight:600;color:#1e293b;">${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
      <div style="margin-top:4px;">${s==="strategy"?`Strategy #${t.id}`:`Combo #${t.id}`}</div>
    </div>
  </div>

  <div class="confidential">
    CONFIDENTIAL \u2014 Prepared exclusively for ${e.name}. This document contains proprietary tax optimization strategies and should not be distributed without authorization from Russell Capital Systems\u2122.
  </div>

  <div class="title-section">
    <h1>${o}</h1>
    ${t.description?`<div class="desc">${t.description}</div>`:""}
    <div style="margin-top:10px;">
      ${(t.categories||[]).map(i=>`<span class="badge badge-blue">${i}</span>`).join("")}
      ${(t.ircCodes||[]).map(i=>`<span class="badge badge-purple">${i}</span>`).join("")}
      ${t.impactScore?`<span class="badge badge-amber">Impact: ${t.impactScore}/12</span>`:""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Client Profile</div>
    <div class="profile-grid">
      <div class="profile-item"><div class="label">Client</div><div class="value">${e.name}</div></div>
      <div class="profile-item"><div class="label">Profession</div><div class="value">${e.profession}</div></div>
      <div class="profile-item"><div class="label">Age</div><div class="value">${e.age}</div></div>
      <div class="profile-item"><div class="label">State</div><div class="value">${e.state}</div></div>
      <div class="profile-item"><div class="label">Starting Net Worth</div><div class="value">${a(e.startingNetWorth)}</div></div>
      <div class="profile-item"><div class="label">Annual Income</div><div class="value">${a(e.annualIncome)}</div></div>
      <div class="profile-item"><div class="label">Family</div><div class="value">${e.familyStatus}</div></div>
      <div class="profile-item"><div class="label">Tax Bracket</div><div class="value">${e.taxBracket}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Key Metrics</div>
    <div class="grid-3">
      <div class="stat-card">
        <div class="stat-label">Total Tax Saved</div>
        <div class="stat-value green">${a(t.totalTaxSaved)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Final Net Worth</div>
        <div class="stat-value blue">${a(t.finalNetWorth)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Net Worth Growth</div>
        <div class="stat-value purple">+${d}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Capital Deployed</div>
        <div class="stat-value">${a(t.totalDeployed)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Wealth Multiplier</div>
        <div class="stat-value">${t.netWorthMultiplier}x</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Time Horizon</div>
        <div class="stat-value" style="font-size:16px;">${t.timeHorizon}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${s==="strategy"?"Implementation Steps":"Strategy Sequence"} (${t.steps.length} Steps)</div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center;">#</th>
          <th>Strategy</th>
          <th style="text-align:right;width:110px;">Tax Saved</th>
          <th style="text-align:right;width:110px;">Deployed</th>
          <th style="text-align:right;width:120px;">Net Worth</th>
        </tr>
      </thead>
      <tbody>
        ${c}
      </tbody>
    </table>
  </div>

  <div class="summary-bar">
    <div class="summary-item">
      <div class="label">Starting Net Worth</div>
      <div class="value">${a(e.startingNetWorth)}</div>
    </div>
    <div class="summary-item">
      <div class="label">\u2192</div>
      <div class="value" style="color:#4ade80;">+${a(t.totalTaxSaved)} saved</div>
    </div>
    <div class="summary-item">
      <div class="label">Final Net Worth</div>
      <div class="value" style="color:#60a5fa;">${a(t.finalNetWorth)}</div>
    </div>
    <div class="summary-item">
      <div class="label">Growth</div>
      <div class="value" style="color:#c084fc;">+${d}%</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Disclaimer:</strong> This report is for educational and illustrative purposes only and does not constitute tax, legal, or investment advice. All projected values are hypothetical and based on assumed scenarios. Actual results will vary based on individual circumstances, market conditions, and applicable tax laws. Consult with qualified tax and legal professionals before implementing any strategy. Russell Capital Systems\u2122 is not a registered investment advisor, tax advisor, or law firm.</p>
    <p style="margin-top:8px;">\xA9 ${new Date().getFullYear()} Russell Capital Systems\u2122 \u2014 www.RussellCap.com \u2014 All Rights Reserved. CONFIDENTIAL.</p>
  </div>
</body>
</html>`}function W({data:t,type:s}){let[e,o]=(0,n.useState)(!1),d=(0,n.useCallback)(()=>{o(!0);try{let c=$(t,s),i=new Blob([c],{type:"text/html"}),r=URL.createObjectURL(i),p=window.open(r,"_blank");if(p)p.onload=()=>{setTimeout(()=>{p.print(),o(!1)},500)};else{let v=document.createElement("a");v.href=r,v.download=`${s==="strategy"?t.title:t.comboName}_Report.html`,v.click(),o(!1)}setTimeout(()=>URL.revokeObjectURL(r),3e4)}catch{o(!1)}},[t,s]);return(0,l.jsxs)(y,{onClick:d,disabled:e,variant:"outline",size:"sm",className:"gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300",children:[e?(0,l.jsx)(h,{className:"h-4 w-4 animate-spin"}):(0,l.jsx)(u,{className:"h-4 w-4"}),(0,l.jsx)(x,{className:"h-4 w-4"}),e?"Generating...":"Download PDF Report"]})}export{W as a};
