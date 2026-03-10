import React, { useState, useRef, useEffect } from 'react';

// ---------------------------------------------
//  Knowledge Base
// ---------------------------------------------
const KB = [
  {
    keys: ['hello','hi','hey','good morning','good evening','greet','start'],
    answer: `Hello! Welcome to Med-Claim Guardian AI Assistant.\n\nI can answer questions about:\n• Claim denials and how to prevent them\n• Understanding your prediction results\n• SHAP / AI explainability\n• Payer and procedure risk analysis\n• Prior authorization guidance\n• Coding accuracy tips\n• ROI and business impact\n\nJust type your question below!`
  },
  {
    keys: ['what is med-claim','about this','what does this do','purpose','overview'],
    answer: `Med-Claim Guardian is an AI-powered Revenue Cycle Management platform.\n\nWhat it does:\n1. Predicts the probability of insurance claim denial before submission\n2. Explains why a claim might be denied using SHAP AI\n3. Gives actionable recommendations to fix issues\n4. Shows payer-specific risk heatmaps\n5. Lets you run What-If scenarios to optimise claims\n\nTrained on: 5,000+ historical healthcare claims\nAccuracy: 72.2% on unseen test data\nAlgorithm: Random Forest with SHAP explainability`
  },
  {
    keys: ['why denied','claim denied','denial reason','reason for denial','why is my claim','denial cause','high denial','denied'],
    answer: `Top reasons healthcare claims get denied:\n\n1. Incomplete Documentation - Missing clinical notes, lab reports, or referrals\n2. No Prior Authorization - Many procedures need pre-approval from the payer\n3. Coding Errors - Wrong ICD/CPT codes that do not match the diagnosis\n4. Timely Filing Missed - Claim submitted after payer deadline\n5. Medical Necessity Not Proven - Not enough clinical justification\n6. Out-of-Network Provider - Patient seen by non-contracted provider\n7. Duplicate Claim - Same claim submitted twice\n\nOur system scores each of these factors and tells you which one is the highest risk for your specific claim.`
  },
  {
    keys: ['prior auth','prior authorization','authorization','pre-approval','preauth'],
    answer: `Prior Authorization (PA) Guide:\n\nPrior authorization is approval from the insurance company before a service is provided.\n\nWhen is PA required?\n• Specialist referrals\n• Elective surgeries\n• High-cost imaging (MRI, CT scans)\n• Expensive medications\n• Inpatient hospital stays\n\nHow to get PA:\n1. Submit clinical notes showing medical necessity\n2. Use payer portal or call provider line\n3. Get a PA reference number and keep it on file\n4. Attach PA number to every related claim\n\nTip: In our predictor, selecting prior_authorization = yes reduces denial probability significantly, especially for Private insurance.`
  },
  {
    keys: ['coding','icd','cpt','procedure code','diagnosis code','coding accuracy','wrong code','code error'],
    answer: `Medical Coding Best Practices:\n\nCoding accuracy is the #1 factor in our AI model.\n\nCommon coding mistakes:\n• Using outdated ICD-10 codes\n• Upcoding (billing higher than service provided)\n• Unbundling (splitting codes that should be one)\n• Wrong modifier usage\n• Diagnosis does not support the procedure\n\nHow to improve:\n• Use a certified medical coder (CPC/CCS)\n• Run claims through a scrubber before submission\n• Keep coding accuracy score above 85%\n• Regularly audit denied claims for coding patterns\n\nIn our system, a coding accuracy below 0.60 triggers an automatic "Review medical coding" recommendation.`
  },
  {
    keys: ['documentation','missing document','clinical notes','medical record','upload','paperwork'],
    answer: `Documentation Checklist for Clean Claims:\n\nEssential documents needed:\n• Physician/provider notes for the date of service\n• Laboratory or diagnostic test results\n• Referral letter (if specialist visit)\n• Prior authorization approval letter\n• Patient consent forms\n• Discharge summary (inpatient)\n\nKey rule in our model:\nIf documentation_complete = no, the system immediately flags it and recommends "Upload missing documents."\n\nImpact: Incomplete documentation increases denial probability by an estimated 18-25%.`
  },
  {
    keys: ['submission delay','filing deadline','timely filing','late submission','claim delay','days delayed'],
    answer: `Timely Filing - Why it matters:\n\nEvery payer has a filing deadline after the date of service:\n• New India Assurance: 90 days\n• Star Health: 30 days (cashless) / 15 days (reimbursement)\n• HDFC ERGO: 30 days after discharge\n• ICICI Lombard: 30 days (cashless) / 15 days (reimbursement)\n• Bajaj Allianz: 15 days (cashless) / 30 days (reimbursement)\n• Government (PMJAY): 30 days from discharge\n• ESI: 15 days from date of service\n\nIn our AI model:\n• Delay 5 days or less = Normal risk\n• Delay 6-14 days = Flag raised\n• Delay more than 14 days = High denial risk\n\nBest practice: Submit claims within 48 hours of service or discharge for maximum acceptance rates. Our model shows delay is the #2 most impactful factor.`
  },
  {
    keys: ['payer','insurer','insurance company','star health','hdfc ergo','icici lombard','bajaj allianz','new india','which payer','payer risk'],
    answer: `Payer Risk Comparison (from our Heatmap):\n\n• ICICI Lombard: ~35% avg denial rate - strictest on high-value claims and PA\n• HDFC ERGO: ~28% - strictest on coding accuracy\n• New India Assurance: ~25% - strictest on documentation completeness\n• Star Health: ~22% - lowest denial rate, good for most procedures\n• Bajaj Allianz: ~18% - strictest on timely filing\n\nRecommendations:\n• For ICICI Lombard: always get PA for procedures above ₹10,000\n• For HDFC ERGO: double-check all ICD/CPT codes before submission\n• For Bajaj Allianz: submit within 48 hours for best results\n• For New India Assurance: attach all clinical notes upfront\n• For Star Health: ensure prior authorization for specialist referrals\n\nCheck the Payer Heatmap tab to see denial rates broken down by payer and procedure type.`
  },
  {
    keys: ['shap','explainability','feature importance','why predicted','how does ai decide','model explain','contributing factor'],
    answer: `SHAP - How Our AI Explains Its Decisions:\n\nSHAP stands for SHapley Additive exPlanations. It shows exactly which factors pushed your claim toward denial or approval.\n\nHow to read SHAP results:\n• Positive SHAP value = Increases denial probability (bad)\n• Negative SHAP value = Reduces denial probability (good)\n\nTop 5 most influential features in our model:\n1. Coding Accuracy Score (17.1% importance) - highest impact\n2. Submission Delay Days (16.2%)\n3. Claim Amount (15.6%)\n4. Patient Age (14.3%)\n5. Procedure Code (7.1%)\n\nAfter running a prediction, you can see the SHAP feature contributions chart showing exactly why that score was given.`
  },
  {
    keys: ['what if','simulation','scenario','test claim','simulate','change value','adjust'],
    answer: `What-If Simulation - Test Before You Submit:\n\nThe What-If tab lets you experiment with claim attributes in real-time.\n\nHow to use it:\n1. Go to the What-If tab in the top navigation\n2. Adjust any slider or dropdown (age, payer, amount, etc.)\n3. Click Predict to instantly see the new denial probability\n4. Compare side-by-side with your original scenario\n\nUseful experiments:\n• What if I complete documentation? Usually drops risk by 10-20%\n• What if I add prior authorization? Big drop for Private insurance\n• What if I improve coding accuracy from 60% to 90%? Test the impact\n• What if I choose a different payer? Compare payer strictness\n\nUse this to optimise every claim before submission!`
  },
  {
    keys: ['roi','return on investment','money saved','cost benefit','savings','financial','revenue'],
    answer: `ROI and Proof of Value:\n\nTypical financial impact for a mid-size hospital or clinic with ₹2 Crore annual claims:\n\nBefore Med-Claim Guardian:\n• Denial rate: ~12%\n• Revenue lost to denials: ~₹24 Lakh/year\n• Staff time on rework: 120+ hrs/month\n\nAfter Med-Claim Guardian:\n• Denial rate: ~8% (33% reduction)\n• Revenue recovered: ~₹8 Lakh/year\n• Staff time saved: 75 hrs/month\n\nSummary:\n• Annual Savings: ~₹8,00,000\n• System Cost: ~₹5,00,000/yr\n• Net Benefit: ~₹3,00,000/yr\n• ROI: 60%+\n• Payback Period: 7-8 months\n\nSee the full breakdown in the ROI and POV tab.`
  },
  {
    keys: ['accuracy','how accurate','model performance','precision','recall','f1','reliable','trust'],
    answer: `Model Performance Metrics:\n\nOur Random Forest model was trained and evaluated on 5,000 healthcare claims.\n\n• Accuracy: 72.2%\n• Precision (Denial class): ~71%\n• Recall (Denial class): ~69%\n• F1 Score: ~70%\n• AUC-ROC: ~0.78\n\nWhat does this mean?\n• Out of 100 claims, the model correctly classifies ~72\n• It correctly identifies ~69% of all denied claims before they are submitted\n• False positive rate is acceptable for a pre-screening tool\n\nImportant note: This is a predictive tool meant to flag risk, not replace human review. Always combine AI recommendations with clinical expertise and payer-specific knowledge.`
  },
  {
    keys: ['low risk','safe claim','approved','will it pass','acceptance','chance of approval'],
    answer: `Low Risk Claims - What Makes a Clean Claim:\n\nOur model labels a claim Low Risk when denial probability is below 33%.\n\nCharacteristics of low-risk claims:\n• Prior authorization confirmed\n• All documentation complete\n• Coding accuracy score at or above 85%\n• Submitted within 5 days of service or discharge\n• Claim amount within normal range for procedure\n• Payer with historically lower denial rates (e.g., Bajaj Allianz)\n• Government (PMJAY) or ESI insurance type\n\nExample of a near-perfect claim:\n• Age: 30-45, ESI, Clinic visit\n• PROC_A with matching DX1 diagnosis\n• Coding accuracy: 98%\n• Delay: 1 day, PA: Yes, Docs: Complete\n• Predicted denial probability: ~15-21%`
  },
  {
    keys: ['high risk','red','dangerous','likely denied','reject','how to fix'],
    answer: `High Risk Claims - How to Fix Them:\n\nOur model labels a claim High Risk when denial probability exceeds 67%.\n\nImmediate action checklist:\n1. Do NOT submit yet - fix the issues first\n2. Check documentation completeness\n3. Verify prior authorization is on file\n4. Review all procedure and diagnosis codes\n5. Make sure you are within the filing window\n6. Use What-If Simulation to find the best combination\n7. Call the payer provider line to pre-verify\n\nMost impactful fixes in order:\n1. Complete missing documentation - reduces denial risk by 15-20%\n2. Get prior authorization - reduces by 12-18% for Private insurance\n3. Fix coding accuracy to 90%+ - reduces by 10-15%\n4. Submit within 3 days - reduces by 8-12%`
  },
  {
    keys: ['random forest','machine learning','algorithm','model type','how trained','training data','dataset'],
    answer: `About Our AI Model:\n\nAlgorithm: Random Forest Classifier\nLibrary: scikit-learn 1.3.2\nTraining data: 5,000 synthetic healthcare claims\nFeatures used: 11 input variables\n\nWhy Random Forest?\n• Handles both numerical and categorical data well\n• Resistant to overfitting via ensemble averaging\n• Provides feature importance scores natively\n• Works well with class imbalance (handled via SMOTE)\n• Fast inference - predictions in under 100ms\n\nTraining process:\n1. Data loaded from synthetic claims dataset\n2. Label encoding for categorical columns\n3. SMOTE applied to balance denied vs approved classes\n4. 80/20 train-test split\n5. 100 decision trees in the ensemble\n6. SHAP TreeExplainer fitted on the trained model`
  },
  {
    keys: ['medicare','medicaid','private','insurance type','coverage','pmjay','esi','ayushman'],
    answer: `Insurance Types in Our Model:\n\nGovernment (PMJAY - Pradhan Mantri Jan Arogya Yojana):\n• Covers economically weaker sections of society\n• Provides cashless treatment up to ₹5 lakh per family per year\n• Strict on medical necessity documentation\n• Timely filing window: 30 days from discharge\n\nESI (Employee State Insurance):\n• For organised sector employees earning below ₹21,000/month\n• Covers employees and their dependants\n• Requires ESI card and employer verification\n• Filing window: 15 days from date of service\n\nPrivate (Commercial Insurance):\n• Strictest prior authorisation requirements\n• Usually highest denial rates for high-value procedures\n• Most variation between payers (Star Health, HDFC ERGO, etc.)\n\nTip: Our model shows Private insurance with no prior authorisation is the highest-risk combination. Always get PA confirmed before a high-cost procedure for any Private insurance patient.`
  },
  {
    keys: ['recommendation','suggest','tip','advice','best practice','what should i do'],
    answer: `Smart Recommendations from Med-Claim Guardian:\n\nBefore Submission:\n• Run every claim through our predictor first\n• Fix any High Risk or Medium Risk claims before sending\n• Verify prior authorization for all Private insurance claims above ₹10,000\n• Ensure documentation is complete - attach all notes upfront\n• Submit within 48 hours of service or discharge date\n\nCoding Best Practices:\n• Use a code scrubber or encoder tool\n• Verify ICD-10 code is valid for the date of service\n• Ensure procedure code matches the diagnosis\n• Keep coding accuracy above 85%\n\nPayer Strategy:\n• Know each payer's specific requirements\n• Use the Payer Heatmap to identify high-risk combinations\n• Build PA templates for your most common procedures`
  },
  {
    keys: ['amount','cost','expensive','high value','rupee','price','claim amount'],
    answer: `Claim Amount and Denial Risk:\n\nClaim amount is the 3rd most important factor in our model at 15.6% importance.\n\nWhy high-amount claims get denied more:\n• Payers scrutinise large claims more carefully\n• Often triggers mandatory medical necessity review\n• More likely to require PA for high-value procedures\n• Greater chance of upcoding suspicion\n\nRisk thresholds observed:\n• ₹0 to ₹5,000: Baseline risk\n• ₹5,000 to ₹25,000: +5-10% denial risk\n• ₹25,000 to ₹1,00,000: +10-20% denial risk\n• ₹1,00,000+: +20-30% denial risk\n\nTips for high-value claims:\n• Always attach detailed medical necessity documentation\n• Get prior authorization regardless of insurance type\n• Submit with complete itemised billing\n• Use the What-If tool to see the exact impact`
  },
  {
    keys: ['how to use','tutorial','guide','walkthrough','steps','navigate','tabs'],
    answer: `How to Use Med-Claim Guardian - Quick Guide:\n\nTab 1: Quick Predict\n• Enter claim details and click Predict\n• See denial probability, risk level and recommendations\n\nTab 2: What-If Simulation\n• Adjust claim parameters with sliders\n• Compare scenario outcomes side-by-side\n\nTab 3: Payer Heatmap\n• See denial rates by payer and procedure matrix\n• Identify your highest-risk combinations\n\nTab 4: Analytics\n• View overall denial trends and distributions\n• Analyse by payer, procedure, and risk level\n\nTab 5: ROI and POV\n• Calculate your organisation potential savings\n• See business case metrics\n\nTab 6: AI Chat (you are here)\n• Ask any question and get instant answers\n\nStart here: Go to Quick Predict and enter a claim!`
  },
];

function getResponse(query) {
  const q = query.toLowerCase().trim();
  let bestScore = 0;
  let bestAnswer = null;
  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keys) {
      if (q.includes(kw)) score += kw.split(' ').length;
    }
    if (score > bestScore) { bestScore = score; bestAnswer = entry.answer; }
  }
  if (bestScore > 0) return bestAnswer;
  return `I understand you are asking about: "${query}"\n\nI can help with these topics:\n• "Why do claims get denied?"\n• "What is prior authorization?"\n• "How to improve coding accuracy?"\n• "Which payer denies the most?"\n• "How does SHAP explain results?"\n• "What does High Risk mean?"\n• "What documents do I need?"\n• "What are the cost savings?"\n• "How accurate is the model?"\n• "How do I use this platform?"\n\nType any of the above or click a Quick Topic button below!`;
}

const QUICK_TOPICS = [
  { label: 'Why claims get denied', q: 'Why do claims get denied?' },
  { label: 'Prior authorization', q: 'What is prior authorization?' },
  { label: 'Coding accuracy tips', q: 'How to improve coding accuracy?' },
  { label: 'Payer risk comparison', q: 'Which payer denies the most claims?' },
  { label: 'SHAP explainability', q: 'How does SHAP explain the AI prediction?' },
  { label: 'Documentation needed', q: 'What documentation is needed for clean claims?' },
  { label: 'High risk - how to fix', q: 'How to fix a high risk claim?' },
  { label: 'ROI and savings', q: 'What is the ROI and financial savings?' },
  { label: 'How to use platform', q: 'How do I use Med-Claim Guardian?' },
];

function ChatAssistant({ onBack }) {
  const [messages, setMessages] = useState([{
    id: 1, sender: 'bot', timestamp: new Date(),
    text: "Hello! I am your Med-Claim Guardian AI Assistant.\n\nAsk me anything about:\n• Claim denials and prevention strategies\n• Prior authorization and documentation\n• Payer-specific requirements\n• SHAP AI explainability\n• Coding accuracy tips\n• ROI and cost savings\n\nOr click a Quick Topic below to get started!",
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  const sendMessage = (text) => {
    const q = (text || inputValue).trim();
    if (!q || isTyping) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: q, timestamp: new Date() }]);
    setInputValue('');
    setIsTyping(true);
    const answer = getResponse(q);
    const delay = Math.min(500 + answer.length * 1.0, 1800);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: answer, timestamp: new Date() }]);
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }, delay);
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(inputValue); };

  const applyBold = (str) => str.split(/\*\*(.*?)\*\*/g).map((p, j) =>
    j % 2 === 1 ? <strong key={j} style={{ color: '#0F4C81' }}>{p}</strong> : p
  );

  const fmtText = (text) => text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
    if (/^\d+\. /.test(line)) {
      const num = line.match(/^\d+/)[0];
      const rest = line.replace(/^\d+\. /, '');
      return <div key={i} style={{ display:'flex', gap:8, marginBottom:3 }}><span style={{color:'#0F4C81',minWidth:16,flexShrink:0,fontWeight:700}}>{num}.</span><span>{applyBold(rest)}</span></div>;
    }
    if (line.startsWith('• ')) return <div key={i} style={{ display:'flex', gap:8, marginBottom:2 }}><span style={{color:'#008BA3',flexShrink:0}}>•</span><span>{applyBold(line.slice(2))}</span></div>;
    return <div key={i} style={{ marginBottom: 2 }}>{applyBold(line)}</div>;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', backgroundColor:'#ffffff', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #0F4C81', padding:'14px 20px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#0F4C81,#008BA3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#ffffff', fontWeight:700 }}>AI</div>
          <div>
            <div style={{ color:'#0F4C81', fontWeight:700, fontSize:16 }}>Med-Claim Guardian Assistant</div>
            <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>
              <span style={{ display:'inline-block', width:7, height:7, backgroundColor:'#10b981', borderRadius:'50%', marginRight:5, verticalAlign:'middle' }} />
              Online · Ask me anything about healthcare claims
            </div>
          </div>
        </div>
        {onBack && (
          <button onClick={onBack} style={{ backgroundColor:'#f3f4f6', border:'1px solid #d1d5db', color:'#4b5563', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
            Back to Dashboard
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:10, backgroundColor:'#f9fafb' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display:'flex', justifyContent: msg.sender==='user'?'flex-end':'flex-start', alignItems:'flex-end', gap:8 }}>
            {msg.sender === 'bot' && (
              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#0F4C81,#008BA3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', fontWeight:700, flexShrink:0 }}>AI</div>
            )}
            <div style={{
              maxWidth:'70%',
              backgroundColor: msg.sender==='user' ? '#0F4C81' : '#ffffff',
              border: msg.sender==='bot' ? '1px solid #d1d5db' : 'none',
              borderRadius: msg.sender==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding:'11px 15px', color: msg.sender==='user'?'#ffffff':'#374151', fontSize:13.5, lineHeight:1.6, boxShadow: msg.sender==='bot'?'0 1px 2px rgba(0,0,0,0.05)':'none'
            }}>
              {fmtText(msg.text)}
              <div style={{ fontSize:10, color: msg.sender==='user'?'#d1d5db':'#9ca3af', marginTop:5, textAlign:'right' }}>
                {msg.timestamp.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
            {msg.sender === 'user' && (
              <div style={{ width:28, height:28, borderRadius:'50%', backgroundColor:'#0F4C81', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', fontWeight:700, flexShrink:0 }}>U</div>
            )}
          </div>
        ))}
        {isTyping && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#0F4C81,#008BA3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', fontWeight:700 }}>AI</div>
            <div style={{ backgroundColor:'#ffffff', border:'1px solid #d1d5db', borderRadius:'16px 16px 16px 4px', padding:'12px 16px', display:'flex', gap:5, alignItems:'center', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' }}>
              {[0,0.2,0.4].map((d,i) => <div key={i} style={{ width:7, height:7, borderRadius:'50%', backgroundColor:'#0F4C81', animation:'chatBounce 1.2s infinite', animationDelay:`${d}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Topics */}
      <div style={{ backgroundColor:'#f3f4f6', borderTop:'1px solid #e5e7eb', padding:'8px 16px', flexShrink:0 }}>
        <div style={{ color:'#6b7280', fontSize:10, marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px' }}>Quick Topics</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {QUICK_TOPICS.map(t => (
            <button key={t.q} onClick={() => sendMessage(t.q)} disabled={isTyping}
              style={{ backgroundColor:'#ffffff', border:'1px solid #d1d5db', color:'#4b5563', padding:'4px 12px', borderRadius:20, cursor: isTyping?'not-allowed':'pointer', fontSize:12, opacity: isTyping?0.5:1, transition:'all .15s' }}
              onMouseEnter={e=>{ if(!isTyping){e.currentTarget.style.backgroundColor='#eff6ff'; e.currentTarget.style.color='#0F4C81'; e.currentTarget.style.borderColor='#0F4C81'; }}}
              onMouseLeave={e=>{ e.currentTarget.style.backgroundColor='#ffffff'; e.currentTarget.style.color='#4b5563'; e.currentTarget.style.borderColor='#d1d5db'; }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ backgroundColor:'#ffffff', borderTop:'2px solid #0F4C81', padding:'12px 16px', flexShrink:0 }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', gap:10 }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type your question here and press Enter or click Send..."
            disabled={isTyping}
            style={{ flex:1, backgroundColor:'#ffffff', border:'1.5px solid #d1d5db', borderRadius:10, padding:'11px 15px', color:'#1f2937', fontSize:14, outline:'none' }}
            onFocus={e => e.target.style.borderColor='#0F4C81'}
            onBlur={e => e.target.style.borderColor='#d1d5db'}
          />
          <button type="submit" disabled={isTyping || !inputValue.trim()}
            style={{ background: isTyping||!inputValue.trim() ? '#e5e7eb' : 'linear-gradient(135deg,#0F4C81,#008BA3)', border:'none', borderRadius:10, padding:'11px 22px', color: isTyping||!inputValue.trim() ? '#9ca3af' : '#ffffff', fontWeight:700, fontSize:14, cursor: isTyping||!inputValue.trim()?'not-allowed':'pointer', transition:'all .2s', whiteSpace:'nowrap' }}>
            Send
          </button>
        </form>
        <div style={{ color:'#6b7280', fontSize:11, marginTop:5, textAlign:'center' }}>
          Press Enter to send · Powered by Med-Claim Guardian AI
        </div>
      </div>

      <style>{`@keyframes chatBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

export default ChatAssistant;
