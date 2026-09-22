// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Scale, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, FileText, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const FIDOComplianceTracker = () => {
  const [fiduciaryChecklist, setFiduciaryChecklist] = useState([
    { id: 1, description: 'DOL Fiduciary Rule: Act in client\'s best interest', completed: false },
    { id: 2, description: 'SEC Regulation Best Interest: Disclosure of conflicts', completed: false },
    { id: 3, description: 'State-specific fiduciary standards: Compliance with local laws', completed: false },
    { id: 4, description: 'DOL Fiduciary Rule: Reasonable compensation', completed: false },
    { id: 5, description: 'SEC Reg BI: Care obligation met', completed: false },
    { id: 6, description: 'State regulations: Annual review of fiduciary practices', completed: false },
  ]);

  const [regBIDoc, setRegBIDoc] = useState([
    { id: 1, document: 'Best Interest Disclosure Form', status: 'Pending' },
    { id: 2, document: 'Conflict of Interest Statement', status: 'Approved' },
    { id: 3, document: 'Client Recommendation Log', status: 'In Review' },
  ]);

  const [formCRSTracker, setFormCRSTracker] = useState([
    { id: 1, client: 'Client A', deliveryDate: '2023-01-15', status: 'Delivered' },
    { id: 2, client: 'Client B', deliveryDate: '2023-02-20', status: 'Pending' },
    { id: 3, client: 'Client C', deliveryDate: '2023-03-10', status: 'Sent' },
  ]);

  const [advPart2Schedule, setAdvPart2Schedule] = useState([
    { id: 1, updateType: 'Annual Update', dueDate: '2023-12-31', status: 'Upcoming' },
    { id: 2, updateType: 'Material Change', dueDate: '2023-06-15', status: 'Completed' },
  ]);

  const [clientSuitabilityLog, setClientSuitabilityLog] = useState([
    { id: 1, client: 'Client D', reviewDate: '2023-04-05', suitability: 'High', notes: 'Risk assessment passed' },
    { id: 2, client: 'Client E', reviewDate: '2023-05-10', suitability: 'Medium', notes: 'Adjustments needed' },
  ]);

  const [feeDisclosureAudit, setFeeDisclosureAudit] = useState([
    { id: 1, feeType: 'Management Fee', disclosureDate: '2023-03-01', audited: true },
    { id: 2, feeType: 'Transaction Fee', disclosureDate: '2023-04-01', audited: false },
  ]);

  const [conflictRegister, setConflictRegister] = useState([
    { id: 1, conflict: 'Personal investment in client stock', mitigation: 'Divestment plan', status: 'Resolved' },
    { id: 2, conflict: 'Family ties to competitor', mitigation: 'Recusal from decisions', status: 'Ongoing' },
  ]);

  const [complianceCalendar, setComplianceCalendar] = useState([
    { id: 1, event: 'DOL Fiduciary Rule Audit', deadline: '2023-07-15' },
    { id: 2, event: 'SEC Reg BI Training', deadline: '2023-08-20' },
    { id: 3, event: 'FINRA Rule 2111 Review', deadline: '2023-09-10' },
  ]);

  const scorecardItems = useMemo(() => [
    { id: 1, item: 'DOL Fiduciary Rule: Best Interest Standard', compliance: 'Yes' },
    { id: 2, item: 'SEC Reg BI: Disclosure Requirements', compliance: 'Partial' },
    { id: 3, item: 'FINRA Rule 2111: Suitability', compliance: 'Yes' },
    { id: 4, item: 'FINRA Rule 2090: Know Your Customer', compliance: 'Yes' },
    { id: 5, item: 'Investment Advisers Act 1940: Registration', compliance: 'Yes' },
    { id: 6, item: 'ERISA 3(21): Fiduciary Duties', compliance: 'Partial' },
    { id: 7, item: 'ERISA 3(38): Investment Management', compliance: 'Yes' },
    { id: 8, item: 'State Fiduciary Laws: Annual Reporting', compliance: 'Yes' },
    { id: 9, item: 'Form CRS Delivery: All Clients', compliance: 'Yes' },
    { id: 10, item: 'ADV Part 2: Timely Updates', compliance: 'Partial' },
    { id: 11, item: 'Client Suitability Reviews: Quarterly', compliance: 'Yes' },
    { id: 12, item: 'Fee Disclosures: Transparent', compliance: 'Yes' },
    { id: 13, item: 'Conflict Register: Up-to-Date', compliance: 'Partial' },
    { id: 14, item: 'Compliance Calendar: All Deadlines Met', compliance: 'Yes' },
    { id: 15, item: 'DOL Rule: Prudence in Investments', compliance: 'Yes' },
    { id: 16, item: 'SEC BI: Conflict Mitigation', compliance: 'Partial' },
    { id: 17, item: 'FINRA 2111: Reasonable Basis', compliance: 'Yes' },
    { id: 18, item: 'FINRA 2090: Customer Information', compliance: 'Yes' },
    { id: 19, item: 'Advisers Act: Anti-Fraud Provisions', compliance: 'Yes' },
    { id: 20, item: 'ERISA: Benefit Plan Standards', compliance: 'Partial' },
    { id: 21, item: 'State Laws: Proxy Voting', compliance: 'Yes' },
    { id: 22, item: 'Reg BI: Care Obligation', compliance: 'Yes' },
    { id: 23, item: 'DOL: Loyalty to Clients', compliance: 'Partial' },
    { id: 24, item: 'SEC: Best Execution', compliance: 'Yes' },
    { id: 25, item: 'FINRA: Supervision', compliance: 'Yes' },
    { id: 26, item: 'Advisers Act: Custody Rules', compliance: 'Partial' },
    { id: 27, item: 'ERISA: Reporting and Disclosure', compliance: 'Yes' },
    { id: 28, item: 'State: Record-Keeping', compliance: 'Yes' },
    { id: 29, item: 'Form CRS: Electronic Delivery', compliance: 'Partial' },
    { id: 30, item: 'ADV: Brochure Supplements', compliance: 'Yes' },
    { id: 31, item: 'Suitability: Risk Tolerance', compliance: 'Yes' },
    { id: 32, item: 'Fees: Itemization', compliance: 'Partial' },
    { id: 33, item: 'Conflicts: Disclosure', compliance: 'Yes' },
    { id: 34, item: 'Calendar: Reminders', compliance: 'Yes' },
    { id: 35, item: 'DOL: Prohibited Transactions', compliance: 'Partial' },
    { id: 36, item: 'SEC: Insider Trading', compliance: 'Yes' },
    { id: 37, item: 'FINRA: Communications', compliance: 'Yes' },
    { id: 38, item: 'Advisers Act: Performance Fees', compliance: 'Partial' },
    { id: 39, item: 'ERISA: Fiduciary Insurance', compliance: 'Yes' },
    { id: 40, item: 'State: Ethical Standards', compliance: 'Yes' },
    { id: 41, item: 'Reg BI: Documentation', compliance: 'Partial' },
    { id: 42, item: 'DOL: Education Requirements', compliance: 'Yes' },
    { id: 43, item: 'SEC: Cybersecurity', compliance: 'Yes' },
    { id: 44, item: 'FINRA: Anti-Money Laundering', compliance: 'Partial' },
    { id: 45, item: 'Advisers Act: Books and Records', compliance: 'Yes' },
    { id: 46, item: 'ERISA: Plan Assets', compliance: 'Yes' },
    { id: 47, item: 'State: Licensing', compliance: 'Partial' },
    { id: 48, item: 'Form CRS: Updates', compliance: 'Yes' },
    { id: 49, item: 'ADV: Privacy Notice', compliance: 'Yes' },
    { id: 50, item: 'Overall Compliance Score', compliance: '75%' },
  ], []);

  const complianceData = useMemo(() => [
    { name: 'DOL Rule', value: 85 },
    { name: 'SEC Reg BI', value: 90 },
    { name: 'FINRA Rules', value: 75 },
    { name: 'Advisers Act', value: 80 },
    { name: 'ERISA', value: 70 },
  ], []);

  const pieData = useMemo(() => [
    { name: 'Compliant', value: 60 },
    { name: 'Non-Compliant', value: 40 },
  ], []);

  const COLORS = ['#FF0000', '#0000FF'];  // Red and blue accents

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0000FF', textAlign: 'center' }}>Fiduciary Compliance Tracker</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><Scale size={24} /> Fiduciary Duty Compliance Checklist</h2>
        <ul>
          {fiduciaryChecklist.map(item => (
            <li key={item.id} style={{ marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => {
                  const updated = fiduciaryChecklist.map(i =>
                    i.id === item.id ? { ...i, completed: !i.completed } : i
                  );
                  setFiduciaryChecklist(updated);
                }}
              /> {item.description}
            </li>
          ))}
        </ul>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><Shield size={24} /> Reg BI Best Interest Documentation</h2>
        <ul>
          {regBIDoc.map(doc => (
            <li key={doc.id} style={{ marginBottom: '10px' }}>
              {doc.document} - Status: <span style={{ color: doc.status === 'Approved' ? '#00FF00' : '#FF0000' }}>{doc.status}</span>
            </li>
          ))}
        </ul>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><FileText size={24} /> Form CRS Delivery Tracker</h2>
        <div className="overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: '#fff' }}>
              <th>Client</th>
              <th>Delivery Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {formCRSTracker.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #555' }}>
                <td>{item.client}</td>
                <td>{item.deliveryDate}</td>
                <td style={{ color: item.status === 'Delivered' ? '#00FF00' : '#FF0000' }}>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><Calendar size={24} /> ADV Part 2 Update Schedule</h2>
        <ul>
          {advPart2Schedule.map(item => (
            <li key={item.id} style={{ marginBottom: '10px' }}>
              {item.updateType} - Due: {item.dueDate} - Status: {item.status}
            </li>
          ))}
        </ul>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><Target size={24} /> Client Suitability Review Log</h2>
        <ul>
          {clientSuitabilityLog.map(log => (
            <li key={log.id} style={{ marginBottom: '10px' }}>
              Client: {log.client} - Review Date: {log.reviewDate} - Suitability: {log.suitability}
            </li>
          ))}
        </ul>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><DollarSign size={24} /> Fee Disclosure Audit Trail</h2>
        <ul>
          {feeDisclosureAudit.map(audit => (
            <li key={audit.id} style={{ marginBottom: '10px' }}>
              Fee Type: {audit.feeType} - Disclosure Date: {audit.disclosureDate} - Audited: {audit.audited ? 'Yes' : 'No'}
            </li>
          ))}
        </ul>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><AlertTriangle size={24} /> Conflict of Interest Register</h2>
        <ul>
          {conflictRegister.map(conflict => (
            <li key={conflict.id} style={{ marginBottom: '10px' }}>
              Conflict: {conflict.conflict} - Mitigation: {conflict.mitigation} - Status: {conflict.status}
            </li>
          ))}
        </ul>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><Calendar size={24} /> Compliance Calendar with Deadlines</h2>
        <ul>
          {complianceCalendar.map(event => (
            <li key={event.id} style={{ marginBottom: '10px' }}>
              Event: {event.event} - Deadline: {event.deadline}
            </li>
          ))}
        </ul>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FF0000' }}><CheckCircle2 size={24} /> 50-Item Regulatory Compliance Scorecard</h2>
        <ul>
          {scorecardItems.map(item => (
            <li key={item.id} style={{ marginBottom: '5px' }}>
              {item.item}: {item.compliance}
            </li>
          ))}
        </ul>
      </section>
      
      <section>
        <h2 style={{ color: '#FF0000' }}><TrendingUp size={24} /> Compliance Dashboard Charts</h2>
        
        <div style={{ width: '100%', height: '300px', marginBottom: '20px' }}>
          <ResponsiveContainer>
            <BarChart data={complianceData}>
              <XAxis dataKey="name" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0000FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ width: '100%', height: '300px', marginBottom: '20px' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer>
            <RadarChart data={complianceData}>
              <PolarGrid stroke="#ffffff" />
              <PolarAngleAxis dataKey="name" stroke="#ffffff" />
              <PolarRadiusAxis stroke="#ffffff" />
              <Radar name="Compliance" dataKey="value" stroke="#FF0000" fill="#FF0000" fillOpacity={0.6} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <PageInsights section="f-i-d-o-compliance-tracker" />
    </div>
  );
};

export default FIDOComplianceTracker;
