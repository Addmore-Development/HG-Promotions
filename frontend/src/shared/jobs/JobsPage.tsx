import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const B   = '#080808'
const BC  = '#161616'
const BC2 = '#111111'
const BB  = 'rgba(212,136,10,0.16)'
const GL  = '#E8A820'
const G   = '#C4973A'
const G2  = '#AB8D3F'
const G3  = '#D4880A'
const G4  = '#8B5A1A'
const G5  = '#6B3F10'

// ─── Updated white/grey palette ───────────────────────────────────────────────
const W   = '#CEC5B2'
const WM  = 'rgba(200,188,168,0.88)'
const WD  = 'rgba(168,152,130,0.55)'

const FD = "'Playfair Display', Georgia, serif"
const FB = "'DM Sans', system-ui, sans-serif"

const ACCENT_PALETTE = [GL, G3, G2, G, G4, GL, G3, G2, G, G4, GL, G3, G2, G, G4, GL, G3, G2, G, G4, GL, G3, G2, G]

export const ALL_JOBS = [
  { id:'JB-201', title:'Brand Promoter — Castle Lager Launch', company:'SABMiller SA', companyInitial:'S', companyColor:GL, location:'Sandton City, Johannesburg', type:'Brand Activation', pay:'R 950', payPer:'per shift', date:'Sat 22 Mar 2026', jobDate:'2026-03-22', approvedAt:'2026-03-10', slots:6, slotsLeft:2, duration:'8 hrs', tags:['Female preferred','English','Own transport'], accentLine:GL, gradient:`linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Thandi Nkosi', contactEmail:'thandi@sabmiller.co.za', contactPhone:'+27 11 555 0201', companyReg:'1895/000583/06', vatNumber:'4560123456', address:'65 Park Lane, Sandton, 2196', terms:`1. ENGAGEMENT TERMS\nSABMiller SA engages the Promoter as an independent contractor.\n\n2. PAYMENT\nR 950 per shift within 5 business days of geo-verified shift completion.\n\n3. CONDUCT & UNIFORM\nWear provided branded uniform and comply with venue rules.\n\n4. LIABILITY\nSABMiller SA is NOT liable for personal injury, property loss, or travel costs.\n\n5. POPIA COMPLIANCE\nAll personal data processed in accordance with POPIA.` },
  { id:'JB-202', title:'Red Bull Sampling — Activations Team', company:'Red Bull South Africa', companyInitial:'R', companyColor:G3, location:'V&A Waterfront, Cape Town', type:'Sampling', pay:'R 800', payPer:'per shift', date:'Sun 23 Mar 2026', jobDate:'2026-03-23', approvedAt:'2026-03-09', slots:4, slotsLeft:4, duration:'6 hrs', tags:['Any gender','Afrikaans + English','High energy'], accentLine:G3, gradient:`linear-gradient(135deg, rgba(212,136,10,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Marco van der Berg', contactEmail:'marco@redbull.co.za', contactPhone:'+27 21 555 0202', companyReg:'2001/012345/07', vatNumber:'4561234567', address:'Clock Tower, V&A Waterfront, Cape Town, 8001', terms:`1. ENGAGEMENT TERMS\nRed Bull South Africa engages the Promoter as an independent contractor.\n\n2. PAYMENT\nR 800 per shift payable within 5 business days.\n\n3. POPIA COMPLIANCE\nPersonal data processed in accordance with POPIA.` },
  { id:'JB-203', title:'In-Store Promoter — Shoprite Durban', company:'FreshBrands Ltd', companyInitial:'F', companyColor:G2, location:'Musgrave Centre, Durban', type:'In-Store', pay:'R 700', payPer:'per shift', date:'Mon 24 – Fri 28 Mar 2026', jobDate:'2026-03-28', approvedAt:'2026-03-08', slots:3, slotsLeft:1, duration:'5 hrs/day x 5 days', tags:['Female','Zulu + English','Neat appearance'], accentLine:G2, gradient:`linear-gradient(135deg, rgba(171,141,63,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'filling fast', contactPerson:'Nomvula Dlamini', contactEmail:'nomvula@freshbrands.co.za', contactPhone:'+27 31 555 0203', companyReg:'2010/098765/07', vatNumber:'4562345678', address:'12 Brand Street, Umhlanga, Durban, 4320', terms:`1. ENGAGEMENT TERMS\nFreshBrands Ltd engages the Promoter as an independent contractor.\n\n2. PAYMENT\nR 700 per shift totalling R 3,500 for 5 days. Processed within 7 business days.\n\n3. POPIA COMPLIANCE\nData processed in accordance with POPIA.` },
  { id:'JB-204', title:'Event Hostess — Menlyn Fashion Night', company:'Acme Events Corp', companyInitial:'A', companyColor:GL, location:'Menlyn Mall, Pretoria', type:'Events & Hosting', pay:'R 1,200', payPer:'per shift', date:'Fri 21 Mar 2026', jobDate:'2026-03-21', approvedAt:'2026-03-07', slots:8, slotsLeft:3, duration:'10 hrs', tags:['Female','1.70m+','Smart evening wear provided'], accentLine:GL, gradient:`linear-gradient(135deg, rgba(232,168,32,0.12) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Pieter Joubert', contactEmail:'pieter@acmeevents.co.za', contactPhone:'+27 12 555 0204', companyReg:'2005/056789/07', vatNumber:'4563456789', address:'44 Corporate Park, Centurion, 0157', terms:`1. ENGAGEMENT TERMS\nAcme Events Corp engages the Promoter as an independent contractor.\n\n2. PAYMENT\nR 1,200 per 10-hour shift. Overtime beyond 10 hours at R 150/hr.\n\n3. POPIA COMPLIANCE\nAll data handled in accordance with POPIA.` },
  { id:'JB-205', title:'Heineken Roadshow — Weekend Crew', company:'Heineken SA', companyInitial:'H', companyColor:G3, location:'Mall of Africa, Midrand', type:'Brand Activation', pay:'R 880', payPer:'per shift', date:'Sat 29 Mar 2026', jobDate:'2026-03-29', approvedAt:'2026-03-11', slots:5, slotsLeft:5, duration:'8 hrs', tags:['Any gender','English','Brand experience'], accentLine:G3, gradient:`linear-gradient(135deg, rgba(212,136,10,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Jason Ferreira', contactEmail:'jason@heineken.co.za', contactPhone:'+27 11 555 0205', companyReg:'1998/034567/06', vatNumber:'4564567890', address:'90 Brewery Road, Midrand, 1685', terms:`1. ENGAGEMENT TERMS\nHeineken SA engages the Promoter as an independent contractor.\n\n2. AGE VERIFICATION\nDo NOT distribute to anyone under 18.\n\n3. PAYMENT\nR 880 per 8-hour shift.\n\n4. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-206', title:'Vodacom Product Demo — Weekend Staff', company:'Vodacom SA', companyInitial:'V', companyColor:G2, location:'Canal Walk, Cape Town', type:'In-Store', pay:'R 750', payPer:'per shift', date:'Sun 30 Mar 2026', jobDate:'2026-03-30', approvedAt:'2026-03-11', slots:4, slotsLeft:4, duration:'6 hrs', tags:['Any gender','Tech savvy','English'], accentLine:G2, gradient:`linear-gradient(135deg, rgba(171,141,63,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Siphiwe Mthembu', contactEmail:'siphiwe@vodacom.co.za', contactPhone:'+27 21 555 0206', companyReg:'1993/003367/06', vatNumber:'4565678901', address:'Vodacom Park, Canal Walk, Cape Town, 7441', terms:`1. ENGAGEMENT TERMS\nVodacom SA engages the Promoter to demonstrate products.\n\n2. DEVICE HANDLING\nDemo devices are Vodacom property. Loss due to negligence will be invoiced.\n\n3. PAYMENT\nR 750 per shift.\n\n4. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-207', title:"Nando's In-Store Tasting — Joburg North", company:"Nando's SA", companyInitial:'N', companyColor:G, location:'Fourways Mall, Johannesburg', type:'In-Store', pay:'R 680', payPer:'per shift', date:'Sat 29 Mar 2026', jobDate:'2026-03-29', approvedAt:'2026-03-10', slots:2, slotsLeft:1, duration:'5 hrs', tags:['Female preferred','Energetic','English + Zulu'], accentLine:G, gradient:`linear-gradient(135deg, rgba(196,151,58,0.10) 0%, rgba(171,141,63,0.04) 100%)`, status:'filling fast', contactPerson:'Ayanda Khumalo', contactEmail:'ayanda@nandos.co.za', contactPhone:'+27 11 555 0207', companyReg:'1987/007890/06', vatNumber:'4566789012', address:'3 Nandos House, Midrand, 1682', terms:`1. ENGAGEMENT TERMS\nNando's SA engages the Promoter for in-store food tasting.\n\n2. FOOD HYGIENE\nGloves must be worn at all times when handling product.\n\n3. PAYMENT\nR 680 per 5-hour shift.\n\n4. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-208', title:'MTN Brand Ambassador — Soweto Festival', company:'MTN SA', companyInitial:'M', companyColor:GL, location:'Maponya Mall, Soweto', type:'Brand Activation', pay:'R 900', payPer:'per shift', date:'Sat 5 Apr 2026', jobDate:'2026-04-05', approvedAt:'2026-03-11', slots:10, slotsLeft:7, duration:'8 hrs', tags:['Any gender','Sesotho + English','Brand activation exp'], accentLine:GL, gradient:`linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Lerato Mokoena', contactEmail:'lerato@mtn.co.za', contactPhone:'+27 11 555 0208', companyReg:'1994/009555/06', vatNumber:'4567890123', address:'216 14th Avenue, Johannesburg, 2091', terms:`1. ENGAGEMENT TERMS\nMTN SA engages the Promoter as an independent contractor.\n\n2. PAYMENT\nR 900 per shift.\n\n3. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-209', title:'Tiger Brands — Pick n Pay Sampling', company:'Tiger Brands', companyInitial:'T', companyColor:G3, location:'Greenacres, Port Elizabeth', type:'Sampling', pay:'R 650', payPer:'per shift', date:'Mon 31 Mar 2026', jobDate:'2026-03-31', approvedAt:'2026-03-09', slots:3, slotsLeft:2, duration:'5 hrs', tags:['Female','isiXhosa + English','Neat appearance'], accentLine:G3, gradient:`linear-gradient(135deg, rgba(212,136,10,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Bongiwe Ntuli', contactEmail:'bongiwe@tigerbrands.co.za', contactPhone:'+27 41 555 0209', companyReg:'1921/000570/06', vatNumber:'4568901234', address:'3010 William Nicol Drive, Johannesburg, 2021', terms:`1. ENGAGEMENT TERMS\nTiger Brands engages the Promoter for sampling duties.\n\n2. PAYMENT\nR 650 per 5-hour shift.\n\n3. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-210', title:'Absolut Vodka — Night Activation', company:'Pernod Ricard SA', companyInitial:'P', companyColor:G4, location:'Rosebank, Johannesburg', type:'Events & Hosting', pay:'R 1,100', payPer:'per shift', date:'Fri 28 Mar 2026', jobDate:'2026-03-28', approvedAt:'2026-03-10', slots:6, slotsLeft:2, duration:'7 hrs', tags:['Female','21+','Evening wear','English'], accentLine:G4, gradient:`linear-gradient(135deg, rgba(139,90,26,0.12) 0%, rgba(107,63,16,0.06) 100%)`, status:'filling fast', contactPerson:'Claire Beaumont', contactEmail:'claire@pernodricard.co.za', contactPhone:'+27 11 555 0210', companyReg:'1999/088341/07', vatNumber:'4569012345', address:'54 Wessel Road, Rivonia, 2128', terms:`1. ENGAGEMENT TERMS\nPernod Ricard SA engages the Promoter. Promoters must be 21+.\n\n2. ALCOHOL SERVICE\nDo not consume alcohol during the shift. Age verification required.\n\n3. PAYMENT\nR 1,100 per 7-hour shift.\n\n4. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-211', title:'Shoprite Checkers — Easter Promotions', company:'Shoprite Holdings', companyInitial:'S', companyColor:G2, location:'Westgate Mall, Johannesburg', type:'In-Store', pay:'R 700', payPer:'per shift', date:'Thu 3 Apr – Sun 6 Apr 2026', jobDate:'2026-04-06', approvedAt:'2026-03-11', slots:8, slotsLeft:6, duration:'6 hrs/day x 4 days', tags:['Female preferred','Sesotho or Zulu','Reliable'], accentLine:G2, gradient:`linear-gradient(135deg, rgba(171,141,63,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Zanele Sithole', contactEmail:'zanele@shoprite.co.za', contactPhone:'+27 11 555 0211', companyReg:'1936/007721/06', vatNumber:'4570123456', address:'Shoprite House, Cape Town, 8001', terms:`1. ENGAGEMENT TERMS\nShoprite Holdings engages the Promoter.\n\n2. PAYMENT\nR 700 per 6-hour shift (R 2,800 total). Processed within 7 business days.\n\n3. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-212', title:'Coca-Cola Spaza Activation — Khayelitsha', company:'Coca-Cola SA', companyInitial:'C', companyColor:G, location:'Khayelitsha, Cape Town', type:'Sampling', pay:'R 750', payPer:'per shift', date:'Sat 4 Apr 2026', jobDate:'2026-04-04', approvedAt:'2026-03-10', slots:5, slotsLeft:5, duration:'7 hrs', tags:['Any gender','isiXhosa + English','Community-facing'], accentLine:G, gradient:`linear-gradient(135deg, rgba(196,151,58,0.10) 0%, rgba(171,141,63,0.04) 100%)`, status:'open', contactPerson:'Lungelo Mgqibi', contactEmail:'lungelo@coca-cola.co.za', contactPhone:'+27 21 555 0212', companyReg:'1902/000012/06', vatNumber:'4571234567', address:'3 Buitenkant Street, Cape Town, 8001', terms:`1. ENGAGEMENT TERMS\nCoca-Cola SA engages the Promoter for community sampling.\n\n2. PAYMENT\nR 750 per 7-hour shift.\n\n3. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-213', title:'Woolworths Food Tasting — Upper-End Malls', company:'Woolworths SA', companyInitial:'W', companyColor:GL, location:'Cavendish Square, Cape Town', type:'In-Store', pay:'R 850', payPer:'per shift', date:'Sat 5 Apr 2026', jobDate:'2026-04-05', approvedAt:'2026-03-11', slots:3, slotsLeft:3, duration:'6 hrs', tags:['Female','Well-spoken','English + Afrikaans','Neat'], accentLine:GL, gradient:`linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Mia van Wyk', contactEmail:'mia@woolworths.co.za', contactPhone:'+27 21 555 0213', companyReg:'1952/003403/06', vatNumber:'4572345678', address:'Woolworths House, 93 Longmarket Street, Cape Town, 8001', terms:`1. ENGAGEMENT TERMS\nWoolworths SA engages the Promoter for premium food tasting.\n\n2. PAYMENT\nR 850 per 6-hour shift.\n\n3. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-214', title:"Jack Daniel's Whisky Night — Durban", company:'Brown-Forman SA', companyInitial:'B', companyColor:G4, location:'uShaka Marine, Durban', type:'Events & Hosting', pay:'R 1,050', payPer:'per shift', date:'Fri 4 Apr 2026', jobDate:'2026-04-04', approvedAt:'2026-03-09', slots:5, slotsLeft:3, duration:'8 hrs', tags:['Female','Afrikaans or Zulu + English','21+','Brand exp'], accentLine:G4, gradient:`linear-gradient(135deg, rgba(139,90,26,0.12) 0%, rgba(107,63,16,0.06) 100%)`, status:'open', contactPerson:'Ruan Kotze', contactEmail:'ruan@brown-forman.co.za', contactPhone:'+27 31 555 0214', companyReg:'2000/099123/07', vatNumber:'4573456789', address:'14 Harbour Road, Durban, 4001', terms:`1. ENGAGEMENT TERMS\nBrown-Forman SA engages the Promoter. Minimum age 21.\n\n2. PAYMENT\nR 1,050 per 8-hour shift.\n\n3. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-215', title:'Sanlam Financial Services Fair', company:'Sanlam Group', companyInitial:'S', companyColor:G3, location:'CTICC, Cape Town', type:'Events & Hosting', pay:'R 900', payPer:'per shift', date:'Wed 8 Apr 2026', jobDate:'2026-04-08', approvedAt:'2026-03-11', slots:6, slotsLeft:6, duration:'9 hrs', tags:['Any gender','Corporate appearance','Afrikaans + English'], accentLine:G3, gradient:`linear-gradient(135deg, rgba(212,136,10,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Werner du Plessis', contactEmail:'werner@sanlam.co.za', contactPhone:'+27 21 555 0215', companyReg:'1959/001562/06', vatNumber:'4574567890', address:'2 Strand Road, Bellville, Cape Town, 7530', terms:`1. ENGAGEMENT TERMS\nSanlam Group engages the Promoter.\n\n2. FINANCIAL ADVICE PROHIBITION\nThe Promoter may NOT provide financial advice.\n\n3. PAYMENT\nR 900 per 9-hour shift.\n\n4. POPIA COMPLIANCE\nStrict POPIA compliance required.` },
  { id:'JB-216', title:'Listerine Sampling — Taxi Ranks', company:'Johnson & Johnson SA', companyInitial:'J', companyColor:G2, location:'Noord Taxi Rank, Johannesburg', type:'Sampling', pay:'R 620', payPer:'per shift', date:'Tue 7 Apr 2026', jobDate:'2026-04-07', approvedAt:'2026-03-08', slots:8, slotsLeft:8, duration:'5 hrs', tags:['Female','Zulu + English','Community-facing','Resilient'], accentLine:G2, gradient:`linear-gradient(135deg, rgba(171,141,63,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Thandiwe Mhlongo', contactEmail:'thandiwe@jnj.co.za', contactPhone:'+27 11 555 0216', companyReg:'1968/004567/06', vatNumber:'4575678901', address:'7 Hunts End, Randburg, 2194', terms:`1. ENGAGEMENT TERMS\nJohnson & Johnson SA engages the Promoter.\n\n2. PAYMENT\nR 620 per 5-hour shift.\n\n3. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-217', title:'KFC New Menu Launch — Gauteng', company:'KFC South Africa', companyInitial:'K', companyColor:G, location:'Jabulani Mall, Soweto', type:'Brand Activation', pay:'R 780', payPer:'per shift', date:'Thu 9 Apr 2026', jobDate:'2026-04-09', approvedAt:'2026-03-10', slots:4, slotsLeft:4, duration:'6 hrs', tags:['Any gender','Energetic','English + Sesotho'], accentLine:G, gradient:`linear-gradient(135deg, rgba(196,151,58,0.10) 0%, rgba(171,141,63,0.04) 100%)`, status:'open', contactPerson:'Tebogo Radebe', contactEmail:'tebogo@kfc.co.za', contactPhone:'+27 11 555 0217', companyReg:'1971/006345/06', vatNumber:'4576789012', address:'1 Harrington Street, Cape Town, 8001', terms:`1. ENGAGEMENT TERMS\nKFC South Africa engages the Promoter.\n\n2. PAYMENT\nR 780 per 6-hour shift.\n\n3. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-218', title:'Hyundai Test Drive — Weekend Promoter', company:'Hyundai Automotive SA', companyInitial:'H', companyColor:G3, location:'Menlyn Park, Pretoria', type:'Events & Hosting', pay:'R 950', payPer:'per shift', date:'Sat 12 Apr 2026', jobDate:'2026-04-12', approvedAt:'2026-03-11', slots:3, slotsLeft:3, duration:'8 hrs', tags:['Female preferred','1.65m+','Automotive knowledge a plus'], accentLine:G3, gradient:`linear-gradient(135deg, rgba(212,136,10,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Andile Nxumalo', contactEmail:'andile@hyundai.co.za', contactPhone:'+27 12 555 0218', companyReg:'2002/011234/07', vatNumber:'4577890123', address:'Hyundai Automotive House, Centurion, 0157', terms:`1. ENGAGEMENT TERMS\nHyundai Automotive SA engages the Promoter.\n\n2. VEHICLE PROXIMITY\nThe Promoter must not enter or operate any display vehicles.\n\n3. PAYMENT\nR 950 per 8-hour shift.\n\n4. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-219', title:'Old Mutual Roadshow — PE & East London', company:'Old Mutual SA', companyInitial:'O', companyColor:G2, location:'The Boardwalk, Port Elizabeth', type:'Events & Hosting', pay:'R 880', payPer:'per shift', date:'Mon 14 Apr 2026', jobDate:'2026-04-14', approvedAt:'2026-03-11', slots:4, slotsLeft:4, duration:'7 hrs', tags:['Any gender','Corporate','isiXhosa + English'], accentLine:G2, gradient:`linear-gradient(135deg, rgba(171,141,63,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Nomsa Qwabe', contactEmail:'nomsa@oldmutual.co.za', contactPhone:'+27 41 555 0219', companyReg:'1845/001000/06', vatNumber:'4578901234', address:'Mutualpark, Jan Smuts Drive, Cape Town, 7405', terms:`1. ENGAGEMENT TERMS\nOld Mutual SA engages the Promoter.\n\n2. FINANCIAL SERVICES PROHIBITION\nMay not provide financial advice.\n\n3. PAYMENT\nR 880 per 7-hour shift.\n\n4. POPIA COMPLIANCE\nStrict POPIA compliance required.` },
  { id:'JB-220', title:'Unilever — Dove Beauty Sampling', company:'Unilever SA', companyInitial:'U', companyColor:GL, location:'Gateway Theatre of Shopping, Durban', type:'Sampling', pay:'R 720', payPer:'per shift', date:'Sat 12 Apr 2026', jobDate:'2026-04-12', approvedAt:'2026-03-10', slots:5, slotsLeft:5, duration:'6 hrs', tags:['Female','Confident','English + Zulu'], accentLine:GL, gradient:`linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Priya Naidoo', contactEmail:'priya@unilever.co.za', contactPhone:'+27 31 555 0220', companyReg:'1951/000583/06', vatNumber:'4579012345', address:'15 Nollsworth Crescent, La Lucia, Durban, 4051', terms:`1. ENGAGEMENT TERMS\nUnilever SA engages the Promoter.\n\n2. BEAUTY PRODUCT HANDLING\nSamples must not be applied without explicit consent.\n\n3. PAYMENT\nR 720 per 6-hour shift.\n\n4. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-221', title:'Standard Bank Career Expo — Wits', company:'Standard Bank SA', companyInitial:'S', companyColor:G3, location:'Wits University, Johannesburg', type:'Events & Hosting', pay:'R 820', payPer:'per shift', date:'Tue 15 Apr 2026', jobDate:'2026-04-15', approvedAt:'2026-03-11', slots:6, slotsLeft:6, duration:'8 hrs', tags:['Any gender','Corporate','UCT/Wits preferred','English'], accentLine:G3, gradient:`linear-gradient(135deg, rgba(212,136,10,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Kagiso Motsepe', contactEmail:'kagiso@standardbank.co.za', contactPhone:'+27 11 555 0221', companyReg:'1962/000738/06', vatNumber:'4580123456', address:'9 Simmonds Street, Johannesburg, 2001', terms:`1. ENGAGEMENT TERMS\nStandard Bank SA engages the Promoter.\n\n2. FINANCIAL ADVICE PROHIBITION\nNo banking advice permitted.\n\n3. PAYMENT\nR 820 per 8-hour shift.\n\n4. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-222', title:'Brutal Fruit — Weekend Sampling Crew', company:'SAB South Africa', companyInitial:'S', companyColor:G4, location:'Eastgate Mall, Johannesburg', type:'Sampling', pay:'R 800', payPer:'per shift', date:'Sat 19 Apr 2026', jobDate:'2026-04-19', approvedAt:'2026-03-11', slots:4, slotsLeft:4, duration:'7 hrs', tags:['Female preferred','18-28','Energetic','Afrikaans a plus'], accentLine:G4, gradient:`linear-gradient(135deg, rgba(139,90,26,0.12) 0%, rgba(107,63,16,0.06) 100%)`, status:'open', contactPerson:'Chantelle Botha', contactEmail:'chantelle@sab.co.za', contactPhone:'+27 11 555 0222', companyReg:'1895/000583/06', vatNumber:'4581234567', address:'65 Park Lane, Sandton, 2196', terms:`1. ENGAGEMENT TERMS\nSAB South Africa engages the Promoter.\n\n2. AGE VERIFICATION\nNo alcohol to anyone under 18.\n\n3. PAYMENT\nR 800 per 7-hour shift.\n\n4. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
  { id:'JB-223', title:'Pick n Pay Smart Shopper Activation', company:'Pick n Pay SA', companyInitial:'P', companyColor:G2, location:'Pavilion Shopping Centre, Durban', type:'Brand Activation', pay:'R 760', payPer:'per shift', date:'Wed 16 Apr 2026', jobDate:'2026-04-16', approvedAt:'2026-03-10', slots:5, slotsLeft:5, duration:'6 hrs', tags:['Any gender','English + Zulu','Retail exp preferred'], accentLine:G2, gradient:`linear-gradient(135deg, rgba(171,141,63,0.10) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Sibusiso Vilakazi', contactEmail:'sibusiso@pnp.co.za', contactPhone:'+27 31 555 0223', companyReg:'1940/000779/06', vatNumber:'4582345678', address:'Pick n Pay House, 101 Rosmead Avenue, Cape Town, 7700', terms:`1. ENGAGEMENT TERMS\nPick n Pay SA engages the Promoter.\n\n2. DATA COLLECTION\nExplicit consent required before collecting customer data.\n\n3. PAYMENT\nR 760 per 6-hour shift.\n\n4. POPIA COMPLIANCE\nStrict POPIA compliance essential.` },
  { id:'JB-224', title:'Distell Premium Wines — Trade Launch', company:'Distell Group', companyInitial:'D', companyColor:G3, location:'Sandton Convention Centre, Johannesburg', type:'Events & Hosting', pay:'R 1,350', payPer:'per shift', date:'Thu 17 Apr 2026', jobDate:'2026-04-17', approvedAt:'2026-03-11', slots:10, slotsLeft:7, duration:'10 hrs', tags:['Female','1.68m+','Evening wear provided','Wine knowledge a plus'], accentLine:G3, gradient:`linear-gradient(135deg, rgba(212,136,10,0.12) 0%, rgba(196,151,58,0.04) 100%)`, status:'open', contactPerson:'Francois du Toit', contactEmail:'francois@distell.co.za', contactPhone:'+27 11 555 0224', companyReg:'1988/005010/06', vatNumber:'4583456789', address:'Distell Park, Adam Tas Road, Stellenbosch, 7599', terms:`1. ENGAGEMENT TERMS\nDistell Group engages the Promoter for a premium wine trade launch.\n\n2. WINE SERVICE STANDARDS\nStrict adherence to the presentation script required.\n\n3. PAYMENT\nR 1,350 per 10-hour shift. Overtime at R 150/hr.\n\n4. CONFIDENTIALITY\nAll trade pricing and buyer information is strictly confidential.\n\n5. POPIA COMPLIANCE\nData handled in accordance with POPIA.` },
] as const

export function getAllJobsWithAdminJobs(): typeof ALL_JOBS {
  try {
    const stored = JSON.parse(localStorage.getItem('hg_admin_jobs') || '[]') as any[]
    const adminJobs = stored.map((j: any, idx: number) => ({
      ...j,
      companyColor: ACCENT_PALETTE[idx % ACCENT_PALETTE.length],
      accentLine:   ACCENT_PALETTE[idx % ACCENT_PALETTE.length],
      gradient:     `linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`,
    }))
    return [...adminJobs, ...ALL_JOBS] as any
  } catch {
    return ALL_JOBS as any
  }
}

export function getActiveJobs(allJobs: typeof ALL_JOBS) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return (allJobs as any[])
    .filter((j: any) => new Date(j.jobDate) >= today)
    .sort((a: any, b: any) => {
      const d = new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime()
      if (d !== 0) return d
      return new Date(a.jobDate).getTime() - new Date(b.jobDate).getTime()
    })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    'open':         { color: GL, bg: 'rgba(232,168,32,0.12)' },
    'filling fast': { color: G3, bg: 'rgba(212,136,10,0.12)' },
    'closed':       { color: G4, bg: 'rgba(139,90,26,0.18)'  },
  }
  const s = map[status] || map['open']
  return <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:s.color, background:s.bg, padding:'3px 10px', borderRadius:2 }}>{status}</span>
}

function TermsModal({ job, onAccept, onClose }: { job: any; onAccept: () => void; onClose: () => void }) {
  const [agreed, setAgreed] = useState(false)
  const [scrolledTerms, setScrolledTerms] = useState(false)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:BC, border:`1px solid ${BB}`, width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'relative', padding:'32px 36px 24px', borderBottom:`1px solid ${BB}`, flexShrink:0 }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${G5}, ${G}, ${GL}, ${G}, ${G5})` }} />
          <div style={{ fontSize:9, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>Terms & Conditions — Read Before Accepting</div>
          <h2 style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, lineHeight:1.3, marginBottom:10 }}>{job.title}</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 24px' }}>
            {[['Company', job.company], ['Pay', `${job.pay} ${job.payPer}`], ['Location', job.location], ['Duration', job.duration]].map(([l, v]) => (
              <div key={l} style={{ fontSize:11, color:WM }}><span style={{ color:WD }}>{l}: </span>{v}</div>
            ))}
          </div>
          <button onClick={onClose} style={{ position:'absolute', top:20, right:20, background:'none', border:'none', cursor:'pointer', color:WD, fontSize:18, lineHeight:1 }}>✕</button>
        </div>
        <div onScroll={e => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setScrolledTerms(true) }}
          style={{ flex:1, overflowY:'auto', padding:'28px 36px' }}>
          {!scrolledTerms && <div style={{ background:'rgba(232,168,32,0.06)', border:`1px solid rgba(232,168,32,0.22)`, padding:'10px 16px', marginBottom:20, fontSize:11, color:G, display:'flex', alignItems:'center', gap:8 }}><span>↓</span> Please scroll through all terms before accepting</div>}
          <div style={{ whiteSpace:'pre-line', fontSize:13, lineHeight:1.85, color:WM, fontFamily:FB }}>{job.terms || 'Standard Honey Group Promoter Terms & Conditions apply.'}</div>
        </div>
        <div style={{ padding:'20px 36px 28px', borderTop:`1px solid ${BB}`, flexShrink:0 }}>
          <label style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer', marginBottom:20 }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop:2, accentColor:G, width:16, height:16, flexShrink:0 }} />
            <span style={{ fontSize:12, color:WM, lineHeight:1.6 }}>I have read and understand the Terms & Conditions. I accept this engagement as an independent contractor.</span>
          </label>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={onAccept} disabled={!agreed} style={{ flex:1, padding:'14px', background:agreed?G:'rgba(206,197,178,0.05)', border:'none', color:agreed?B:WD, fontFamily:FB, fontSize:11, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', cursor:agreed?'pointer':'not-allowed', transition:'all 0.25s' }}>Accept & Continue to Application</button>
            <button onClick={onClose} style={{ padding:'14px 20px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:11, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentModal({ job, onClose, onSuccess }: { job: any; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'select'|'processing'|'done'>('select')
  const [method, setMethod] = useState<'card'|'eft'|'wallet'>('card')
  const [cardNum, setCardNum] = useState('')
  const [expiry,  setExpiry ] = useState('')
  const [cvv,     setCvv    ] = useState('')
  const [name,    setName   ] = useState('')
  const fmtCard   = (v: string) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  const fmtExpiry = (v: string) => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? d.slice(0,2)+'/'+d.slice(2) : d }
  const handlePay = () => { setStep('processing'); setTimeout(() => { setStep('done'); setTimeout(onSuccess, 1800) }, 2200) }
  const inp: React.CSSProperties = { width:'100%', padding:'12px 14px', background:B, border:`1px solid ${BB}`, color:W, fontFamily:FB, fontSize:13, outline:'none', marginBottom:12, boxSizing:'border-box' }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:BC, border:`1px solid ${BB}`, width:'100%', maxWidth:460, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G5},${G},${GL},${G},${G5})` }} />
        {step === 'processing' && <div style={{ padding:'80px 40px', textAlign:'center' }}><div style={{ fontSize:48, color:G, marginBottom:20, display:'inline-block', animation:'spin 1.2s linear infinite' }}>◎</div><div style={{ fontFamily:FD, fontSize:22, color:W, marginBottom:8 }}>Processing</div><div style={{ fontSize:13, color:WM }}>Securing your slot...</div><style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style></div>}
        {step === 'done' && <div style={{ padding:'80px 40px', textAlign:'center' }}><div style={{ fontSize:56, marginBottom:16, color:G }}>✓</div><div style={{ fontFamily:FD, fontSize:24, color:GL, marginBottom:8 }}>Application Submitted!</div><div style={{ fontSize:13, color:WM, lineHeight:1.6 }}>Your slot for <strong style={{ color:W }}>{job.title}</strong> has been reserved.</div></div>}
        {step === 'select' && <>
          <div style={{ padding:'28px 32px 20px', borderBottom:`1px solid ${BB}` }}>
            <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:G, marginBottom:6 }}>Demo Payment Gateway</div>
            <h2 style={{ fontFamily:FD, fontSize:20, color:W, marginBottom:4 }}>Confirm Application</h2>
            <div style={{ fontSize:12, color:WM }}>{job.title} — {job.company}</div>
            <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(232,168,32,0.08)', border:`1px solid rgba(232,168,32,0.22)`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:WM }}>Application Registration Fee</span>
              <span style={{ fontFamily:FD, fontSize:18, color:G, fontWeight:700 }}>R 25.00</span>
            </div>
            <div style={{ fontSize:10, color:WD, marginTop:6 }}>⚠ Demo only — no real payment processed</div>
            <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WD, fontSize:18 }}>✕</button>
          </div>
          <div style={{ padding:'20px 32px 28px' }}>
            <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, marginBottom:12 }}>Payment Method</div>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {(['card','eft','wallet'] as const).map(m => <button key={m} onClick={() => setMethod(m)} style={{ flex:1, padding:'10px 8px', background:method===m?'rgba(196,151,58,0.16)':'transparent', border:`1px solid ${method===m?G:BB}`, color:method===m?G:WM, fontFamily:FB, fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }}>{m==='card'?'💳 Card':m==='eft'?'🏦 EFT':'👜 Wallet'}</button>)}
            </div>
            {method==='card' && <><input placeholder="Cardholder Name" value={name} onChange={e=>setName(e.target.value)} style={inp} /><input placeholder="Card Number" value={cardNum} onChange={e=>setCardNum(fmtCard(e.target.value))} style={inp} maxLength={19} /><div style={{ display:'flex', gap:12 }}><input placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(fmtExpiry(e.target.value))} style={{ ...inp, flex:1 }} maxLength={5} /><input placeholder="CVV" value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} style={{ ...inp, flex:1 }} maxLength={4} type="password" /></div></>}
            {method==='eft' && <div style={{ padding:'18px', background:'rgba(206,197,178,0.03)', border:`1px solid ${BB}`, marginBottom:12 }}>{[['Bank','Honey Group Bank (Demo)'],['Account','1234 5678 9012'],['Branch','250655'],['Reference',`HG-${job.id}`]].map(([l,v])=><div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><span style={{ fontSize:11, color:WD }}>{l}</span><span style={{ fontSize:11, color:W, fontWeight:600 }}>{v}</span></div>)}</div>}
            {method==='wallet' && <div style={{ padding:'18px', background:'rgba(206,197,178,0.03)', border:`1px solid ${BB}`, marginBottom:12 }}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><span style={{ fontSize:12, color:WM }}>HG Wallet Balance (Demo)</span><span style={{ fontFamily:FD, fontSize:18, color:G, fontWeight:700 }}>R 250.00</span></div><div style={{ fontSize:11, color:WD }}>R 25.00 will be deducted.</div></div>}
            <button onClick={handlePay} style={{ width:'100%', padding:'14px', background:`linear-gradient(90deg,${G5},${G},${GL})`, border:'none', color:B, fontFamily:FB, fontSize:11, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', cursor:'pointer' }}>{method==='eft'?'Confirm EFT Payment (Demo)':'Pay R 25.00 (Demo)'}</button>
            <div style={{ textAlign:'center', marginTop:10, fontSize:10, color:WD }}>🔒 Secured by Paystack · POPIA Compliant · Demo Mode</div>
          </div>
        </>}
      </div>
    </div>
  )
}

function RepostModal({ job, onClose, onSuccess }: { job: any; onClose: () => void; onSuccess: (newDate: string, newId: string) => void }) {
  const [newDate, setNewDate] = useState('')
  const [note,    setNote   ] = useState('')
  const [done,    setDone   ] = useState(false)
  const handle = () => { if (!newDate) return; setDone(true); const newId = `${job.id}-R${Date.now().toString().slice(-4)}`; setTimeout(() => onSuccess(newDate, newId), 1400) }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:BC, border:`1px solid ${BB}`, width:'100%', maxWidth:460, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G5},${G},${GL},${G},${G5})` }} />
        {done ? <div style={{ padding:'60px 40px', textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12, color:G }}>↻</div><div style={{ fontFamily:FD, fontSize:22, color:G }}>Job Reposted!</div></div> : <>
          <div style={{ padding:'28px 32px 20px', borderBottom:`1px solid ${BB}` }}>
            <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:G, marginBottom:6 }}>Repost Job</div>
            <h2 style={{ fontFamily:FD, fontSize:18, color:W, lineHeight:1.3 }}>{job.title}</h2>
            <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WD, fontSize:18 }}>✕</button>
          </div>
          <div style={{ padding:'24px 32px 32px' }}>
            <div style={{ fontSize:11, color:WM, lineHeight:1.7, marginBottom:20, padding:'12px 16px', background:'rgba(196,151,58,0.06)', border:`1px solid rgba(196,151,58,0.22)` }}>This will create a new listing with an updated event date, subject to admin approval.</div>
            <div style={{ marginBottom:16 }}><div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, marginBottom:8 }}>New Event Date</div><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{ width:'100%', padding:'11px 14px', background:B, border:`1px solid ${BB}`, color:W, fontFamily:FB, fontSize:13, outline:'none', boxSizing:'border-box', colorScheme:'dark' }} /></div>
            <div style={{ marginBottom:24 }}><div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, marginBottom:8 }}>Note to Admin (optional)</div><textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Any changes from the original job?" style={{ width:'100%', padding:'11px 14px', background:B, border:`1px solid ${BB}`, color:W, fontFamily:FB, fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }} /></div>
            <button onClick={handle} disabled={!newDate} style={{ width:'100%', padding:'14px', background:newDate?G:'rgba(206,197,178,0.05)', border:'none', color:newDate?B:WD, fontFamily:FB, fontSize:11, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', cursor:newDate?'pointer':'not-allowed', transition:'all 0.25s' }}>Submit for Repost</button>
          </div>
        </>}
      </div>
    </div>
  )
}

function JobCard({ job, onView, onApply, onRepost, appliedIds, session }: { job: any; onView: (id: string) => void; onApply: (job: any) => void; onRepost: (job: any) => void; appliedIds: Set<string>; session: { role: string; name: string } | null }) {
  const [hovered, setHovered] = useState(false)
  const filled = job.slots - job.slotsLeft
  const pct    = Math.round((filled / job.slots) * 100)
  const almostFull = job.slotsLeft <= 2
  const isApplied  = appliedIds.has(job.id)
  const accent     = job.accentLine || G
  return (
    <div>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ position:'relative', background:BC, border:`1px solid ${hovered?accent+'44':BB}`, overflow:'hidden', transition:'all 0.3s ease', transform:hovered?'translateY(-3px)':'none', boxShadow:hovered?`0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22`:'none' }}>
        <div style={{ position:'absolute', inset:0, background:job.gradient||'transparent', opacity:hovered?1:0.6, transition:'opacity 0.3s' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${G5}, ${accent}, ${G5})` }} />
        {isApplied && <div style={{ position:'absolute', top:12, right:12, zIndex:10, background:G, color:B, fontSize:8, fontWeight:800, letterSpacing:'0.2em', padding:'3px 10px', textTransform:'uppercase', borderRadius:2 }}>Applied ✓</div>}
        <div style={{ position:'relative', padding:'24px 24px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:`rgba(196,151,58,0.16)`, border:`1px solid rgba(196,151,58,0.35)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:accent, flexShrink:0, fontFamily:FD }}>{job.companyInitial || job.company?.charAt(0) || '?'}</div>
              <div><div style={{ fontSize:11, color:accent, fontWeight:600 }}>{job.company}</div><div style={{ fontSize:9, color:WD, marginTop:1, letterSpacing:'0.15em', textTransform:'uppercase' }}>{job.type}</div></div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}><div style={{ fontFamily:FD, fontSize:20, fontWeight:700, color:G, lineHeight:1 }}>{job.pay}</div><div style={{ fontSize:10, color:'rgba(192,178,158,0.82)', marginTop:2 }}>{job.payPer}</div></div>
          </div>
          <h3 style={{ fontFamily:FD, fontSize:16, fontWeight:700, color:W, lineHeight:1.3, marginBottom:12 }}>{job.title}</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
            {[{icon:'◎',text:job.location},{icon:'◈',text:job.date},{icon:'◉',text:`${job.duration} · ${job.slots} slots`}].map((m,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}><span style={{ fontSize:10, color:G, flexShrink:0 }}>{m.icon}</span><span style={{ fontSize:11, color:WM }}>{m.text}</span></div>)}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
            {(job.tags||[]).map((tag:string,i:number) => <span key={i} style={{ fontSize:8, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:WD, background:'rgba(206,197,178,0.05)', border:`1px solid ${BB}`, padding:'3px 8px', borderRadius:2 }}>{tag}</span>)}
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}><span style={{ fontSize:9, color:WD, letterSpacing:'0.1em' }}>SLOTS FILLED</span><span style={{ fontSize:9, fontWeight:700, color:almostFull?G3:G }}>{job.slotsLeft} left</span></div>
            <div style={{ height:3, background:'rgba(206,197,178,0.08)', borderRadius:2, overflow:'hidden' }}><div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${G5}, ${accent})`, borderRadius:2 }} /></div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <StatusBadge status={job.status} />
            <div style={{ flex:1 }} />
            <button onClick={() => onView(job.id)} style={{ padding:'8px 14px', border:`1px solid ${accent}44`, background:'transparent', color:WM, fontFamily:FB, fontSize:9, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent}} onMouseLeave={e=>{e.currentTarget.style.borderColor=`${accent}44`;e.currentTarget.style.color=WM}}>Details</button>
            <button onClick={() => onApply(job)} style={{ padding:'8px 16px', border:'none', background:isApplied?G:accent, color:B, fontFamily:FB, fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', cursor:'pointer' }}>{isApplied?'Applied ✓':'Apply →'}</button>
          </div>
        </div>
      </div>
      {session && <div style={{ display:'flex', gap:4, marginTop:4 }}><button onClick={() => onRepost(job)} style={{ flex:1, padding:'8px', background:'transparent', border:`1px solid ${BB}`, color:WD, fontFamily:FB, fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent}} onMouseLeave={e=>{e.currentTarget.style.borderColor=BB;e.currentTarget.style.color=WD}}>↻ Repost Job</button></div>}
    </div>
  )
}

const JOB_TYPES = ['All Types','Brand Activation','Sampling','In-Store','Events & Hosting']
const CITIES    = ['All Cities','Johannesburg','Cape Town','Durban','Pretoria']
const SORT_OPTS = ['Newest Approved','Soonest Date','Highest Pay','Most Slots']

export default function JobsPage() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [cityFilter, setCityFilter] = useState('All Cities')
  const [sortBy,     setSortBy    ] = useState('Newest Approved')
  const [searchQ,    setSearchQ   ] = useState('')
  const [session,    setSession   ] = useState<{ role: string; name: string } | null>(null)
  const [termsJob,   setTermsJob  ] = useState<any>(null)
  const [paymentJob, setPaymentJob] = useState<any>(null)
  const [repostJob,  setRepostJob ] = useState<any>(null)
  const [toast,      setToast     ] = useState('')
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [allJobs,    setAllJobs   ] = useState<any[]>([])

  useEffect(() => { const s = localStorage.getItem('hg_session'); if (s) { try { setSession(JSON.parse(s)) } catch {} } }, [])
  useEffect(() => {
    const load = () => setAllJobs(getAllJobsWithAdminJobs())
    load()
    window.addEventListener('storage', load)
    const interval = setInterval(load, 2000)
    return () => { window.removeEventListener('storage', load); clearInterval(interval) }
  }, [])

  const showToast         = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }
  const handleApply       = (job: any) => { if (!session) { navigate('/login'); return }; setTermsJob(job) }
  const handleRepost      = (job: any) => { if (!session) { navigate('/login'); return }; setRepostJob(job) }
  const handleTermsAccepted  = () => { if (!termsJob) return; setPaymentJob(termsJob); setTermsJob(null) }
  const handlePaymentSuccess = () => { if (!paymentJob) return; setAppliedIds(prev => new Set([...prev, paymentJob.id])); showToast(`✓ Application submitted for "${paymentJob.title}"`); setPaymentJob(null) }
  const handleRepostSuccess  = (_newDate: string, newId: string) => { showToast(`Job reposted as ${newId} — pending admin approval`); setRepostJob(null) }

  const activeJobs = getActiveJobs(allJobs)
  const filtered = activeJobs
    .filter((j:any) => typeFilter==='All Types' || j.type===typeFilter)
    .filter((j:any) => cityFilter==='All Cities' || j.location.toLowerCase().includes(cityFilter.toLowerCase()))
    .filter((j:any) => !searchQ || [j.title,j.company,j.location].some((s:string)=>s.toLowerCase().includes(searchQ.toLowerCase())))
    .sort((a:any,b:any) => {
      if (sortBy==='Soonest Date') return new Date(a.jobDate).getTime()-new Date(b.jobDate).getTime()
      if (sortBy==='Highest Pay')  return parseInt(b.pay.replace(/\D/g,''))-parseInt(a.pay.replace(/\D/g,''))
      if (sortBy==='Most Slots')   return b.slotsLeft-a.slotsLeft
      return new Date(b.approvedAt).getTime()-new Date(a.approvedAt).getTime()
    })

  const sel: React.CSSProperties = { background:BC, border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:11, padding:'10px 14px', cursor:'pointer', outline:'none' }

  return (
    <div style={{ minHeight:'100vh', background:B, fontFamily:FB, color:W }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{background:${B};}::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:${G};}select option{background:${BC};color:${W};}textarea{box-sizing:border-box;}`}</style>

      {toast && <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)', background:G, color:B, padding:'14px 28px', fontFamily:FB, fontSize:12, fontWeight:700, letterSpacing:'0.1em', zIndex:2000, whiteSpace:'nowrap', borderRadius:2 }}>{toast}</div>}

      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(8,8,8,0.97)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${BB}`, padding:'16px 48px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:WM, fontFamily:FB, fontSize:12 }} onMouseEnter={e=>e.currentTarget.style.color=W} onMouseLeave={e=>e.currentTarget.style.color=WM}>← Back to Home</button>
        <div style={{ fontFamily:FD, fontSize:16, fontWeight:700 }}><span style={{ color:G }}>HONEY</span><span style={{ color:W }}> GROUP</span></div>
        <div style={{ display:'flex', gap:10 }}>
          {session ? <button onClick={() => navigate(session.role==='promoter'?'/promoter/dashboard':'/')} style={{ padding:'9px 20px', background:G, border:'none', color:B, fontFamily:FB, fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer' }}>My Dashboard</button>
            : <><button onClick={() => navigate('/login')} style={{ padding:'9px 20px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:11, cursor:'pointer' }}>Log In</button><button onClick={() => navigate('/register')} style={{ padding:'9px 20px', background:G, border:'none', color:B, fontFamily:FB, fontSize:11, fontWeight:700, cursor:'pointer' }}>Register</button></>}
        </div>
      </nav>

      <div style={{ background:BC2, borderBottom:`1px solid ${BB}`, padding:'52px 48px 40px' }}>
        <div style={{ maxWidth:1360, margin:'0 auto' }}>
          <div style={{ fontSize:10, letterSpacing:'0.38em', textTransform:'uppercase', color:G, fontWeight:600, marginBottom:14 }}>Current Opportunities</div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
            <div><h1 style={{ fontFamily:FD, fontSize:'clamp(32px,4vw,52px)', fontWeight:700, lineHeight:1 }}>All Jobs</h1><p style={{ fontSize:12, color:WD, marginTop:8 }}>Sorted newest-approved first · Auto-removed after event date · T&C + payment required to apply</p></div>
            <div style={{ textAlign:'right' }}><div style={{ fontFamily:FD, fontSize:36, fontWeight:700, color:G, lineHeight:1 }}>{filtered.length}</div><div style={{ fontSize:11, color:WM, marginTop:4 }}>active positions</div></div>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search jobs, companies, locations..." style={{ ...sel, flex:'1 1 240px', minWidth:200, color:W }} onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ ...sel, minWidth:170 }}>{JOB_TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select value={cityFilter} onChange={e=>setCityFilter(e.target.value)} style={{ ...sel, minWidth:150 }}>{CITIES.map(c=><option key={c}>{c}</option>)}</select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ ...sel, minWidth:170 }}>{SORT_OPTS.map(s=><option key={s}>{s}</option>)}</select>
            {(typeFilter!=='All Types'||cityFilter!=='All Cities'||searchQ) && <button onClick={() => { setTypeFilter('All Types'); setCityFilter('All Cities'); setSearchQ('') }} style={{ padding:'10px 16px', background:'transparent', border:`1px solid rgba(212,136,10,0.35)`, color:G3, fontFamily:FB, fontSize:10, fontWeight:600, cursor:'pointer', letterSpacing:'0.12em', textTransform:'uppercase' }}>✕ Clear</button>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1360, margin:'0 auto', padding:'40px 48px 80px' }}>
        {filtered.length===0
          ? <div style={{ textAlign:'center', padding:'80px 0' }}><div style={{ fontFamily:FD, fontSize:48, color:WD, marginBottom:16 }}>◎</div><div style={{ fontFamily:FD, fontSize:28, color:W, marginBottom:12 }}>No Jobs Found</div><p style={{ fontSize:14, color:WM }}>Adjust your filters or check back soon.</p></div>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:20 }}>{filtered.map((job:any) => <JobCard key={job.id} job={job} appliedIds={appliedIds} session={session} onView={id=>navigate(`/jobs/${id}`)} onApply={handleApply} onRepost={handleRepost} />)}</div>}
        <div style={{ marginTop:64, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{ width:1, height:40, background:`linear-gradient(to bottom, ${G}, transparent)` }} />
          <p style={{ fontSize:13, color:WD }}>Jobs are automatically removed after their event date.</p>
          {!session && <button onClick={() => navigate('/register')} style={{ marginTop:8, padding:'12px 36px', background:G, border:'none', color:B, fontFamily:FB, fontSize:11, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', cursor:'pointer' }}>Register to Apply</button>}
        </div>
      </div>

      {termsJob   && <TermsModal   job={termsJob}   onAccept={handleTermsAccepted}   onClose={() => setTermsJob(null)}   />}
      {paymentJob && <PaymentModal job={paymentJob} onSuccess={handlePaymentSuccess} onClose={() => setPaymentJob(null)} />}
      {repostJob  && <RepostModal  job={repostJob}  onSuccess={handleRepostSuccess}  onClose={() => setRepostJob(null)}  />}
    </div>
  )
}