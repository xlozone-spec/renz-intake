/* Renz · Style Guide Intake
   Loads into <div id="rz-intake"></div>. Settings come from window.RZ_INTAKE (see index.html).
   TEST MODE (default): no link check, nothing is sent anywhere, photos stay in the browser,
   and every section payload is logged so you can see exactly what GHL would receive. */
(function(){
'use strict';
var CFG=Object.assign({
  testMode:true,
  webhookUrl:'',        // GHL inbound webhook (answers, one post per section)
  appsScriptUrl:'',     // (old) not used in live mode any more
  apiBase:'',           // Railway server; '' = same site as this page
  scanUrl:'',           // Esenca general scan link
  imgBase:'img/',       // step illustrations
  exampleBase:'',       // photo-rule example images (Nano Banana, to come)
  swipeBase:'img/swipe/', // Q10 swipe outfit images
  showPrivacy:false,    // turn on only once Esenca confirms scan photos are deleted
  storePrefix:'rz_intake_v6_'
},window.RZ_INTAKE||{});
var TEST=!!CFG.testMode;
var root=document.getElementById('rz-intake');if(!root)return;
var CID=TEST?'test-contact':'';
var KEY=CFG.storePrefix+CID;
var TOKEN='';var TOKKEY=CFG.storePrefix+'token';
function api(path,body,keep){var b=Object.assign({action:path.replace('/api/',''),token:TOKEN},body||{});return fetch(CFG.apiBase,{method:'POST',keepalive:!!keep,headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)}).then(function(r){return r.json().catch(function(){return {ok:false};});});}
var st={i:0,a:{},up:{},sent:{},dir:1};
var FILES={};           // in-memory previews (object URLs)
var LOG=[];             // test mode: payloads that would have been sent
var RESUME=0;
if(TEST)window.__rz={seed:function(o){for(var k in o)st.a[k]=o[k];save();},get i(){return st.i;},get k(){var s=SCR[st.i];return s.k+(s.q?':'+s.q:'');}};           // screen to return to when they come back

/* ---------------- helpers ---------------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function $(s,el){return (el||root).querySelector(s);}
function $$(s,el){return Array.prototype.slice.call((el||root).querySelectorAll(s));}
var TICK='<svg viewBox="0 0 14 14"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke="#F4F1EA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var HEART='<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" fill="currentColor"/></svg>';
function snap(){return {i:st.i,a:st.a,up:TEST?{}:st.up,sent:st.sent,t:Date.now()};}
function save(){var s=snap();try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}if(!TEST)queueRemote();}
/* live mode: progress is also saved to the server under his link, so he can carry on from any device */
var RT=null;function queueRemote(){clearTimeout(RT);RT=setTimeout(pushRemote,1500);}
function pushRemote(){clearTimeout(RT);RT=null;if(TEST||!TOKEN)return;
  try{api('/api/progress',{state:snap()}).catch(function(){});}catch(e){}}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&RT)pushRemote();});
function load(remote){var s=null;try{s=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
  if(remote&&remote.a&&(!s||(remote.t||0)>(s.t||0)))s=remote;  // the newer copy wins, wherever it was saved
  if(s){st.i=s.i||0;st.a=s.a||{};st.up=s.up||{};st.sent=s.sent||{};}}
function A(k){return st.a[k];}
function set(k,v){st.a[k]=v;save();}
function arr(k){return Array.isArray(st.a[k])?st.a[k]:[];}
function filled(v){return v!=null&&String(v).trim()!=='';}

/* currency + size-system hint from Q1 */
function where(){return String(A('q1')||'').toLowerCase();}
function cur(){var w=where();
  if(/\b(usa|us|united states|america|new york|nyc|los angeles|la|miami|chicago|texas|california|san francisco|boston)\b/.test(w))return '$';
  if(/\b(ireland|france|paris|germany|berlin|munich|spain|madrid|barcelona|italy|milan|rome|portugal|lisbon|porto|netherlands|amsterdam|belgium|brussels|austria|vienna|greece|athens|finland|helsinki|estonia|latvia|lithuania|slovakia|slovenia|croatia|cyprus|malta|luxembourg|dublin)\b/.test(w))return '€';
  return '£';}

/* ---------------- content ---------------- */
var OTHER='Other';
var STEPS=[
 {id:'life',name:'Your life',line:'Your work and your month',img:'life'},
 {id:'closet',name:'Your outfits',line:'You in your real outfits',img:'closet'},
 {id:'taste',name:'Your taste',line:'What you’d wear and wouldn’t',img:'taste'},
 {id:'fit',name:'Your fit',line:'Your sizes and how things fit',img:'fit'},
 {id:'you',name:'You',line:'How you want to be seen',img:'you'},
 {id:'budget',name:'Budget',line:'What you usually spend',img:'budget'},
 {id:'colouring',name:'Your colouring',line:'A few face photos in daylight',img:'colouring'},
 {id:'scan',name:'Your scan',line:'A quick 3D body scan on your phone',img:'scan'}
];
var FREQ=['Weekly','Monthly','Rarely','Never'];
/* swipe outfits: style + situation, never colour. id = image file name. */
/* id, family, situation, what it is, trouser leg, formality 1 (gym) to 5 (black tie) */
var SWIPE=[
 ['quiet-warm','quiet','warm','Cream knit polo, corduroy shorts above the knee, dark loafers','shorts',3],
 ['smart-work','smart','work','Unstructured blazer, plain tee, chinos, white trainers','straight',3],
 ['quiet-cold','quiet','cold','Half-zip knit over an oxford shirt, pleated cream trousers, suede tassel loafers','straight',3],
 ['smart-warm','smart','warm','Overshirt worn open over a ribbed vest, wide pleated trousers, loafers','wide',3],
 ['heritage-workwear-cold','heritage','cold','Dark waxed jacket, white tee, wide raw selvedge jeans turned up, boots, cap','wide',2],
 ['quiet-evening','quiet','evening','Ribbed knit polo, wide pleated trousers, patent shoes, all one tone','wide',3],
 ['smart-evening','smart','evening','Navy blazer, striped open-collar shirt, pleated cream trousers, brown belt','pleated',3],
 ['smart-cold','smart','cold','Cable half-zip over a shirt and tie, chinos, white trainers','straight',3],
 ['tailored-work','tailored','work','Navy two-piece suit, light blue shirt, patterned tie, pocket square, monk shoes','slim',4],
 ['workwear-warm','heritage','warm','Short-sleeve utility shirt with matching wide utility trousers, tee, loafers','wide',2],
 ['quiet-suit','quiet','evening','Unstructured light suit over a knit tee, belt, loafers','wide',4],
 ['smart-gilet','smart','cold','Quilted down gilet over a fine crew knit, wide pleated trousers, chunky loafers','wide',3],
 ['heritage-country','heritage','work','Checked tweed jacket, check shirt, knitted tie, corduroy trousers','straight',4],
 ['tailored-cold','tailored','cold','Long overcoat, ribbed roll neck, pleated wool trousers, loafers','wide',4],
 ['quiet-warm-minimal','quiet','warm','Plain tee, wide trousers, loafers','wide',2],
 ['smart-shell','smart','cold','Cropped technical jacket zipped to the neck, tee, dark jeans','straight',2],
 ['sport-warm','sport','warm','Boxy tee with matching sweat shorts, sports socks, chunky trainers','shorts',2],
 ['heritage-evening','heritage','evening','Suede jacket, knit polo, washed wide jeans, loafers','wide',3],
 ['smart-parka','smart','cold','Hooded technical parka over a half-zip knit, tapered trousers turned up, chunky chelsea boots','tapered',2],
 ['tailored-evening','tailored','evening','Double-breasted check suit over a crew-neck tee, derbies','slim',4],
 ['quiet-linen','quiet','warm','Boxy white tee, pleated linen trousers, suede loafers, woven tote','wide',3],
 ['sport-cold','sport','cold','Piped track jacket with matching wide track trousers, trainers','wide',2],
 ['creative-warm','creative','warm','One bold colour head to toe: bright shirt, jumper over the shoulders, pleated trousers, cap, tote','wide',3],
 ['heritage-shearling','heritage','cold','Suede shearling jacket, roll neck, wide trousers, suede boots','wide',2],
 ['tailored-overcoat-suit','tailored','work','Long overcoat over a double-breasted suit, shirt and tie, brown shoes','straight',4],
 ['quiet-knit-relaxed','quiet','cold','Textured crew-neck knit, pleated light trousers, suede loafers','straight',3],
 ['smart-polo-straight','smart','warm','Ribbed open-collar polo over a tee, straight dark trousers, suede loafers','straight',3],
 ['dark-evening','dark','evening','All black: leather jacket, tee, wide trousers, loafers','wide',3],
 ['creative-cold','creative','cold','Long striped shearling coat, wide-brim hat, cord trousers, pointed boots','wide',3],
 ['tailored-navy-open','tailored','evening','Navy suit, white shirt open at the neck, pocket square, no tie','slim',4],
 ['sport-coat-hoodie','sport','cold','Long overcoat over a hoodie and joggers, retro trainers, cap','wide',2],
 ['smart-blazer-jeans','smart','work','Double-breasted wool blazer, white tee, dark bootcut jeans, horsebit loafers','bootcut',3],
 ['heritage-quilted','heritage','cold','Diamond-quilted jacket over a zip knit, dark wide jeans, loafers','wide',3],
 ['quiet-linen-suit','quiet','warm','Linen suit with wide pleated trousers, open white shirt, loafers','wide',4],
 ['formal-blacktie','formal','formal','Double-breasted dinner suit, bow tie, patent shoes','straight',5],
 ['creative-evening','creative','evening','Open printed shirt, dark trousers, gold chain','straight',3],
 ['sport-puffer','sport','cold','Hooded puffer, waffle henley, light wide jeans, trail trainers','wide',2],
 ['dark-bomber','dark','evening','Brushed bomber, ribbed vest, wide pleated trousers, square-toe shoes','wide',3],
 ['heritage-chore','heritage','cold','Cotton chore jacket, plain tee, straight mid-blue jeans, leather boots','straight',2],
 ['smart-chore','smart','cold','Wool chore jacket, grey sweatshirt, light straight jeans turned up, suede trainers','straight',2],
 ['tailored-overcoat-tie','tailored','cold','Herringbone double-breasted overcoat over a dark suit, white shirt, black tie','wide',5],
 ['quiet-halfzip-straight','quiet','cold','Half-zip knit, straight wool trousers, penny loafers','straight',3],
 ['gym','gym','gym','Fitted training top, shorts over tights, running shoes','shorts',1]];
var COL_WONT=[['Black','#15130F'],['Navy','#23324A'],['Grey','#8A8780'],['White','#FFFFFF'],['Cream','#EFE7D8'],['Beige','#D8C7A8'],['Camel','#C19A6B'],['Brown','#6B4A33'],['Olive','#6B6A3E'],['Green','#2F5D3A'],['Burgundy','#6D2331'],['Red','#B3262E'],['Pink','#E7A7B4'],['Purple','#5E3A73'],['Yellow','#E8C547'],['Orange','#D9772B'],['Light blue','#A9C4DE'],['Bright blue','#1F5FBF']];
var COL_OWN=[['Navy','#23324A'],['Black','#15130F'],['Grey','#8A8780'],['White','#FFFFFF'],['Light blue','#A9C4DE'],['Brown','#6B4A33'],['Beige','#D8C7A8'],['Olive','#6B6A3E'],['Burgundy','#6D2331'],['Green','#2F5D3A'],['Patterned','pattern'],['Bright colours','bright']];
var ITEM_TYPES=['Jacket or blazer','Suit','Shirt','T-shirt or polo','Knitwear','Trousers','Jeans','Shoes','Coat'];
var SIZE={
 suits:{title:'Suits and blazers',q:'What suit or blazer size actually fits you?',qh:'It’s the number on the label, like 40R. That number is your chest size in inches.',cols:['UK / US','EU / IT'],w:'1fr 1fr',
   rows:[[34,44],[36,46],[38,48],[40,50],[42,52],[44,54],[46,56],[48,58],[50,60]],len:['Short','Regular','Long']},
 collar:{title:'Shirt collar',q:'What shirt collar size actually fits you?',qh:'The collar size, not S, M or L.',cols:['UK / US (in)','EU (cm)'],w:'1fr 1fr',
   rows:[['14','36'],['14.5','37'],['15','38'],['15.5','39'],['15.75','40'],['16','41'],['16.5','42'],['17','43'],['17.5','44'],['18','45-46'],['18.5','47']],
   helper:'It’s printed on the label inside the collar of a formal shirt. No formal shirts? Tap “No idea”, the scan covers it.'},
 tops:{title:'T-shirts, polos and knitwear',q:'What size T-shirts, polos and knitwear actually fit you?',qh:'The letter on the label.',cols:['Size','Usually fits a chest of'],w:'1fr 2fr',
   rows:[['XS','34-36 in · 86-91 cm'],['S','36-38 in · 91-97 cm'],['M','38-40 in · 97-102 cm'],['L','41-43 in · 104-109 cm'],['XL','44-46 in · 112-117 cm'],['XXL','47-49 in · 119-125 cm']]},
 trousers:{title:'Trousers',q:'What trouser size actually fits you?',qh:'The size that fits well, not just the one you end up buying. Waist like W32, then the leg length that sits right on your shoe.',cols:['Waist (in)','Waist (cm)','IT / EU'],w:'1fr 1fr 1fr',
   rows:[['28','71','44'],['30','76','46'],['32','81','48'],['34','86','50'],['36','91','52'],['38','96','54'],['40','101','56']],leg:['28','30','32','34','36']},
 shoes:{title:'Shoes',q:'What shoe size actually fits you?',qh:'For smart shoes and boots. Trainers can run different, so add the brand below.',cols:['UK','US','EU'],w:'1fr 1fr 1fr',
   rows:[['6','7','40'],['6.5','7.5','40.5'],['7','8','41'],['7.5','8.5','41.5'],['8','9','42'],['8.5','9.5','42.5'],['9','10','43'],['9.5','10.5','43.5'],['10','11','44'],['10.5','11.5','44.5'],['11','12','45'],['11.5','12.5','45.5'],['12','13','46'],['12.5','13.5','46.5'],['13','14','47']]}
};
var SIZE_ORDER=['suits','collar','tops','trousers','shoes'];
var SZ_LABEL={suits:['Suits and blazers','The number on the label, like 40R'],collar:['Formal shirts','Collar size, or S, M, L'],tops:['T-shirts, polos and knitwear','The letter on the label'],trousers:['Trousers','Waist and leg, like W32 L32'],shoes:['Shoes','Smart shoes and boots']};
var SZ_COL={suits:{UK:0,US:0,EU:1},collar:{UK:0,US:0,EU:1},trousers:{UK:0,US:0,EU:2},shoes:{UK:0,US:1,EU:2}};
var LETTERS=['XS','S','M','L','XL','XXL'];
function region(){var r=A('q18_reg');if(r)return r;var c=cur();return c==='$'?'US':c==='€'?'EU':'UK';}
function szOpt(c,i,reg){var g=SIZE[c],r=g.rows[i];if(c==='tops')return r[0];var v=r[SZ_COL[c][reg]];
  if(c==='suits')return reg==='EU'?'EU '+v:v;if(c==='collar')return reg==='EU'?v+' cm':v+' in';if(c==='trousers')return reg==='EU'?'EU '+v:'W'+v;if(c==='shoes')return reg+' '+v;return v;}
function szDesc(c,val){if(val==='ns'||val==null||typeof val!=='string')return val==='ns'?'Not sure':'';var g=SIZE[c];
  if(String(val).indexOf('L:')===0)return 'Letter '+String(val).slice(2);var r=g.rows[+val];if(!r)return '';
  if(c==='suits')return 'UK/US '+r[0]+' · EU '+r[1];if(c==='collar')return r[0]+' in · EU '+r[1]+' cm';if(c==='tops')return r[0];
  if(c==='trousers')return 'W'+r[0]+' · EU '+r[2];if(c==='shoes')return 'UK '+r[0]+' · US '+r[1]+' · EU '+r[2];}

/* photo rules */
var RULES={
 closet:[
  ['Daylight.','Near a window, main lights off.'],
  ['One piece per photo.','The whole piece in the shot.'],
  ['Hung up or laid flat.','Not on you, not crumpled.'],
  ['All in one go, same spot.','Same light for every piece.']],
 colouring:[
  ['Face a window in daylight.','No direct sun, main lights off, no flash.'],
  ['Plain white or light wall behind you.',''],
  ['Plain white printer paper under your chin,','touching your jaw.'],
  ['Rear camera.','Ask someone to take it or use a timer. No filters, beauty mode or portrait mode.'],
  ['As you normally look.','Beard as you wear it, glasses off, no product in your hair.'],
  ['Upload the original photo.','Not a screenshot, and not a copy sent over WhatsApp.']]
};
var WARN={"closet": "<b>Follow these exactly.</b> If your photos can’t be used, I’ll ask you to take them again, and your style guide waits until you do.", "colouring": "<b>Follow these exactly.</b> If your photos can’t be used, I’ll ask you to take them again, and your style guide waits until you do.", "scan": "<b>Follow the scan exactly.</b> If your scan can’t be used, you’ll have to do it again, and your style guide waits until you do."};
var WHY={
 closet:'Your photos are what I judge your closet on. Take a navy jacket under a yellow bulb and it looks black. I’d judge it as black, and your verdict would be wrong. The same goes for a crumpled shirt, or a piece half out of the shot. Take them right and every call I make is about your clothes, not your lighting. It takes two minutes. Follow the steps exactly.',
 colouring:'This is how I work out your colours. Phone cameras shift skin tone warmer or cooler depending on the light. Get it wrong and I’d put you in colours that wash you out. The white paper is how I correct for it, so every step counts.',
 scan:'This is your body, measured. Your sizes, cuts and proportions are all built on it. Clothes change your shape on a scan, and even tight ones bunch. Same as a tailor’s fitting: the less you wear, the more accurate it is.'
};

/* outfit photos (Photos 2 of 3). Keys double as upload keys and payload field names. */
var OUT_RULES=[['01 · It’s you','You, wearing a full outfit.'],['02 · Head to shoes','The whole outfit in the shot, nothing covering it. No bags, no crossed arms.'],['03 · Your face','Visible, ideally not behind your phone.'],['04 · As it is','No filters.']];
var OUTFITS=[
 {k:'outfit_tuesday',t:'A normal Tuesday',d:'What you wear on an ordinary day.',req:true},
 {k:'outfit_dinner',t:'Dinner out',d:'What you’d wear to a nice restaurant.',req:true},
 {k:'outfit_not_working',t:'The one that’s not working',d:'Where you know you don’t look your best, but not why.',req:true},
 {k:'outfit_gym',t:'Gym or sport',d:'What you train or play in.',req:false},
 {k:'outfit_holiday',t:'Holiday',d:'What you wear when you’re away.',req:false}];

/* questions (n = number shown to the client) */
var Q={
 q1:{n:1,t:'text',title:'Where are you based?',help:'City and country. It decides the weather your clothes need to handle.',ph:'e.g. London, UK'},
 q2:{n:2,t:'text',title:'What do you do?',help:'Your role and your industry.',ph:'e.g. I run a recruitment agency. Mostly client meetings.'},
 q3:{n:3,t:'multi',title:'What does a normal work day look like?',help:'Tick all that apply.',opts:['At a desk in my own office','Working from home','In front of clients','On my feet most of the day','On the road','Walking or cycling a lot'],other:true},
 q4:{n:4,t:'single',title:'How do you get around most days?',opts:['Drive','Walk','Cycle','Public transport','A mix'],other:true},
 q5:{n:5,t:'single',title:'On a normal work day, you’re mostly…',opts:['At a desk','On your feet','Moving between meetings','A bit of everything'],other:true},
 q6:{n:4,t:'freq',title:'What does your month look like?',help:'Tell me how often each of these comes up. This is how I work out where your clothes need to perform.',
     rows:['Investor or pitch meetings','Client or sales meetings','Networking and events','Filming, podcasts or video calls','Hosting or founder dinners','Work travel','Dates','Weddings and formal events','Gym and training','Weekends off']},
 q6_0:{n:4,t:'single',extra:'1 of 10',title:'Investor or pitch meetings',help:'How often does this come up in your month?',opts:FREQ},
 q6_1:{n:4,t:'single',extra:'2 of 10',title:'Client or sales meetings',help:'How often does this come up in your month?',opts:FREQ},
 q6_2:{n:4,t:'single',extra:'3 of 10',title:'Networking and events',help:'How often does this come up in your month?',opts:FREQ},
 q6_3:{n:4,t:'single',extra:'4 of 10',title:'Filming, podcasts or video calls',help:'How often does this come up in your month?',opts:FREQ},
 q6_4:{n:4,t:'single',extra:'5 of 10',title:'Hosting or founder dinners',help:'How often does this come up in your month?',opts:FREQ},
 q6_5:{n:4,t:'single',extra:'6 of 10',title:'Work travel',help:'How often does this come up in your month?',opts:FREQ},
 q6_6:{n:4,t:'single',extra:'7 of 10',title:'Dates',help:'How often does this come up in your month?',opts:FREQ},
 q6_7:{n:4,t:'single',extra:'8 of 10',title:'Weddings and formal events',help:'How often does this come up in your month?',opts:FREQ},
 q6_8:{n:4,t:'single',extra:'9 of 10',title:'Gym and training',help:'How often does this come up in your month?',opts:FREQ},
 q6_9:{n:4,t:'single',extra:'10 of 10',title:'Weekends off',help:'How often does this come up in your month?',opts:FREQ},
 q6_other:{n:4,t:'text',optional:true,extra:'Last one',title:'Anything else that comes up?',help:'Something regular that needs its own outfit. Say how often.',ph:'e.g. Padel every week. Golf once a month.'},
 q7:{n:5,t:'multi',title:'When you travel, where to?',help:'Tick all that apply.',opts:['Hot climates','Cold climates','Similar to home','I rarely travel'],other:true,excl:['I rarely travel']},
 q8:{n:6,t:'text',long:true,title:'What’s coming up in the next 30 days?',help:'A wedding, a big pitch, a first date. What it is and roughly when. Nothing booked? Tell me something you want to look good for anyway.',ph:'e.g. My brother’s wedding, mid-November. Black tie.'},
 q9:{n:7,t:'words',title:'How do you want people to see you?',help:'Three words. The way you’d want a room to describe you after you’ve left it. For example: sharp, calm, trusted.'},
 q10:{n:8,t:'text',long:true,minc:50,title:'What frustrates you most about getting dressed right now?',help:'In your own words. There’s no wrong answer here, and the more honest, the better.',ph:'e.g. I’ve got loads of clothes but nothing goes together. I end up in the same three things.'},
 q11:{n:9,t:'text',optional:true,title:'What would make this worth it for you?',help:'One sentence. What needs to be different after our call?',ph:'e.g. Knowing exactly what to buy so I stop wasting money.'},
 q12:{n:10,t:'swipe',title:'Would you wear it?',help:'',min:2},
 q14:{n:11,t:'text',long:true,title:'Paint me a picture.',help:'A brand you rate, someone whose style you’d take, a piece you own and love, or what drew you to the outfits you said yes to. The more you give me, the better I know your taste.',ph:'e.g. Like Loro Piana, but for a 25-year-old. Clean, relaxed, nothing flashy.'},
 q15:{n:12,t:'swatch',title:'Any colours you won’t wear?',help:'Even if they suit you. I’ll keep them out of your style guide.',opts:COL_WONT,none:'None',other:true},
 q16:{n:13,t:'multi',title:'Anything else you won’t wear, whatever I say?',help:'Cuts, pieces, anything.',opts:['Skinny trousers','Shorts','Ties','Suits','Loafers','Turtlenecks','Visible logos','Loud patterns','None'],other:true,excl:['None']},
 q17:{n:14,t:'single',title:'How do you like your clothes to fit?',opts:['Slim','Regular','Relaxed','Depends on the piece'],other:true},
 q18:{n:15,t:'sizes',title:'What size do you usually buy?',help:'Your usual size in each. Not sure? Pick “Not sure”, the scan covers it.'},
 q19:{n:16,t:'fits',title:'Name 2 or 3 pieces that fit you really well, and why.',help:'At least one. Brand, piece and size, then what you like about how it fits.'},
  q18_suits:{n:15,t:'size1',c:'suits',extra:'1 of 5',title:SIZE.suits.q,help:SIZE.suits.qh},
 q18_collar:{n:15,t:'size1',c:'collar',extra:'2 of 5',title:SIZE.collar.q,help:SIZE.collar.qh},
 q18_tops:{n:15,t:'size1',c:'tops',extra:'3 of 5',title:SIZE.tops.q,help:SIZE.tops.qh},
 q18_trousers:{n:15,t:'size1',c:'trousers',extra:'4 of 5',title:SIZE.trousers.q,help:SIZE.trousers.qh},
 q18_shoes:{n:15,t:'size1',c:'shoes',extra:'5 of 5',title:SIZE.shoes.q,help:SIZE.shoes.qh},
 q20a:{n:16,t:'multi',title:'Anything you’d rather people didn’t notice?',help:'Tick anything that applies. It stays between us. It helps me get the cuts right.',opts:['My stomach','Narrow shoulders','Short legs','Long legs','Long torso','Short torso','My height','My arms','Nothing'],other:true,excl:['Nothing']},
 q20b:{n:17,t:'multi',title:'Anything you want people to notice?',help:'Tick anything that applies.',opts:['My build','My shoulders','My chest','My arms','My legs','My height','Nothing'],other:true,excl:['Nothing']},
 qbuild:{n:18,t:'text',long:true,short:true,optional:true,title:'What do people say about your build?',help:'A tailor, a photographer, a friend, anyone.',ph:'e.g. People always say my legs are long.',phs:['e.g. People always say my legs are long.','e.g. People normally say I have short arms.']},
 q21_0:{n:19,t:'single',extra:'1 of 8',title:'What do you usually spend on jackets and blazers?',help:'Per piece. No judgement. This is so I work with your numbers, not against them.',optsFn:function(c){return ['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];}},
 q21_1:{n:19,t:'single',extra:'2 of 8',title:'What do you usually spend on suits?',help:'Per piece. No judgement. This is so I work with your numbers, not against them.',optsFn:function(c){return ['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];}},
 q21_2:{n:19,t:'single',extra:'3 of 8',title:'What do you usually spend on shirts?',help:'Per piece. No judgement. This is so I work with your numbers, not against them.',optsFn:function(c){return ['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];}},
 q21_3:{n:19,t:'single',extra:'4 of 8',title:'What do you usually spend on knitwear?',help:'Per piece. No judgement. This is so I work with your numbers, not against them.',optsFn:function(c){return ['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];}},
 q21_4:{n:19,t:'single',extra:'5 of 8',title:'What do you usually spend on T-shirts and polos?',help:'Per piece. No judgement. This is so I work with your numbers, not against them.',optsFn:function(c){return ['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];}},
 q21_5:{n:19,t:'single',extra:'6 of 8',title:'What do you usually spend on trousers?',help:'Per piece. No judgement. This is so I work with your numbers, not against them.',optsFn:function(c){return ['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];}},
 q21_6:{n:19,t:'single',extra:'7 of 8',title:'What do you usually spend on shoes?',help:'Per piece. No judgement. This is so I work with your numbers, not against them.',optsFn:function(c){return ['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];}},
 q21_7:{n:19,t:'single',extra:'8 of 8',title:'What do you usually spend on coats?',help:'Per piece. No judgement. This is so I work with your numbers, not against them.',optsFn:function(c){return ['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];}},
 q22:{n:20,t:'single',title:'What would you invest in getting your closet right, once and for all?',optsFn:function(c){return [c+'1,500-2,000',c+'2,000-5,000',c+'5,000-10,000',c+'10,000+'];}},
 q23:{n:20,t:'swatch',title:'Which colours make up most of your closet?',help:'Tick all that apply.',opts:COL_OWN,other:true},
 q24:{n:21,t:'closet10',title:'Your 10 most-worn pieces.',help:'Not your favourites. The ones you actually reach for most. One photo each, then tell me how each one fits you.',photos:1},
 qkeep:{n:21,t:'text',long:true,short:true,optional:true,title:'What do you keep buying that you end up not wearing?',help:'A type of piece, a colour, a cut. Whatever keeps happening.',ph:'e.g. Patterned shirts. They look good in the shop, then sit in my wardrobe.'},
 qout:{n:22,t:'outfits',title:'Photos of you, in your outfits.',help:'Real photos of you wearing a full outfit, from the last year. Not your best looks, just what you actually wear. This is what I work on.',photos:1},
 q26:{n:23,t:'face',title:'Your face, three ways, plus your eyes.',help:'Same spot, same light, one after the other. Only the first one needs the paper. Like your outfit photos, these stay private and are only used for your guide.',slots:['Straight on','Turned left','Turned right','Eyes, close up'],photos:2},
};

/* ---------------- screen list ---------------- */
function grp(k){var m=/^(q6|q18|q21)_/.exec(k);return m?m[1]:k;}
function buildScreens(){
  var S=[{k:'home'}];
  function step(id,list){var s=STEPS.findIndex(function(x){return x.id===id;});S.push({k:'cover',s:s});list.forEach(function(o){o.s=s;S.push(o);});}
  step('life',['q1','q2','q3','q6_0','q6_1','q6_2','q6_3','q6_4','q6_5','q6_6','q6_7','q6_8','q6_9','q6_other','q7'].map(function(q){return {k:'q',q:q};}));
  var cl=[{k:'outrules'}];OUTFITS.forEach(function(o,i){cl.push({k:'q',q:'qout',slot:i});});cl.push({k:'q',q:'qkeep'});step('closet',cl);
  step('taste',['q12','q14','q15','q16'].map(function(q){return {k:'q',q:q};}));
  var fit=[{k:'q',q:'q17'}];fit.push({k:'q',q:'q18_suits'},{k:'q',q:'q18_collar'},{k:'q',q:'q18_tops'},{k:'q',q:'q18_trousers'},{k:'q',q:'q18_shoes'},{k:'q',q:'q20a'},{k:'q',q:'q20b'},{k:'q',q:'qbuild'});step('fit',fit);
  step('you',['q9','q10','q8','q11'].map(function(q){return {k:'q',q:q};}));
  step('budget',[0,1,2,3,4,5,6,7].map(function(i){return {k:'q',q:'q21_'+i};}).concat([{k:'q',q:'q22'}]));
  var co=[{k:'why',w:'colouring'}];RULES.colouring.forEach(function(r,i){co.push({k:'rule',set:'colouring',r:i});});co.push({k:'daylight'},{k:'q',q:'q26'});step('colouring',co);
  step('scan',[{k:'why',w:'scan'},{k:'scanpriv'},{k:'scancompare'},{k:'scanticks'},{k:'final'}]);
  if(TEST)S.push({k:'testend'});
  var num=0,seen={};S.forEach(function(x){var g=x.k==='outrules'?'qout':(x.k==='q'?grp(x.q):null);
    if(!g||seen[g])return;seen[g]=++num;});
  Object.keys(Q).forEach(function(k){var g=grp(k);if(seen[g])Q[k].n=seen[g];});
  return S;}
var SCR=buildScreens();

/* ---------------- validation ---------------- */
function otherOk(k,list){return list.indexOf(OTHER)<0||filled(A(k+'_o'));}
function valid(sc){
  if(sc.k==='rule')return !!A('rule_'+sc.set+'_'+sc.r);
  if(sc.k==='outrules')return !!A('photo_consent');
  if(sc.k==='scanticks')return ['t_name','t_clothes','t_steps'].every(function(k){return A(k);});
  if(sc.k!=='q')return true;
  var q=Q[sc.q],k=sc.q,v=A(k);
  switch(q.t){
   case 'text':return q.optional||(q.minc?String(v||'').trim().length>=q.minc:filled(v));
   case 'words':return [0,1,2].every(function(i){return filled(A('q9_'+i));});
   case 'single':return filled(v)&&(v!==OTHER||filled(A(k+'_o')));
   case 'multi':case 'swatch':var l=arr(k);return l.length>0&&otherOk(k,l);
   case 'freq':for(var oi=0;oi<othN();oi++){if(filled(A('q6_ot_'+oi))&&A('q6_ov_'+oi)==null)return false;}return q.rows.every(function(r,i){return A(k+'_'+i)!=null;});
   case 'duo':return q.parts.some(function(pk){return arr(pk).length>0;})&&q.parts.every(function(pk){return otherOk(pk,arr(pk));});
   case 'swipe':return swDone()&&swYes().length>=q.min;
   case 'size1':var sv=A(k);if(typeof sv!=='string'||sv==='')return false;return q.c!=='trousers'||(typeof A('q18_trousers_leg')==='string'&&A('q18_trousers_leg')!=='');
   case 'sizes':var okv=function(v){return typeof v==='string'&&v!=='';};return SIZE_ORDER.every(function(c){return okv(A('q18_'+c));})&&okv(A('q18_trousers_leg'));
   case 'closet10':for(var ci=0;ci<10;ci++){if(!hasUp('q24_'+ci)||!filled(A('q24_'+ci+'_fit')))return false;}return true;
   case 'fits':var ps=pieces();return ps.some(pieceOk)&&ps.every(function(p){return isEmptyPiece(p)||pieceOk(p);});
   case 'price':return q.rows.every(function(r,i){return A(k+'_'+i)!=null;});
   case 'piece':var p=sc.piece,t=A('q24_'+p+'_type');return hasUp('q24_'+p)&&filled(t)&&(t!==OTHER||filled(A('q24_'+p+'_o')))&&filled(A('q24_'+p+'_fit'));
   case 'outfits':var so=OUTFITS[sc.slot];if(so.k==='outfit_not_working'&&!filled(A('outfit_off_note')))return false;return !so.req||hasUp(so.k);
   case 'face':return q.slots.every(function(s,i){return hasUp('q26_'+i);});
  }return true;}
function whyNot(sc){
  if(sc.k==='rule')return 'Tick the box to carry on.';
  if(sc.k==='outrules')return 'Tick the box to carry on.';
  if(sc.k==='scanticks')return 'Tick all three to carry on.';
  if(sc.k!=='q')return '';var q=Q[sc.q];
  if(q.t==='swipe')return swDone()?'Say yes to at least 2. Tap Start again.':'Go through all of them first.';
  if(q.t==='piece')return 'Add the photo and answer both.';
  if(q.t==='outfits')return OUTFITS[sc.slot].k==='outfit_not_working'?'Add the photo and say what you think is off.':'Add this photo to carry on.';
  if(q.t==='face')return 'Add all four photos.';
  if(q.t==='size1')return q.c==='trousers'?'Pick a waist and a leg, or “Not sure”.':'';
  if(q.t==='sizes')return 'Pick a size in each, or “Not sure”.';
  if(q.t==='closet10')return 'Add all 10 photos and say how each one fits.';
  if(q.t==='text'&&q.minc)return 'A bit more detail, please. At least '+q.minc+' characters.';
  if(q.t==='duo')return 'Tick at least one, or “Nothing”. If you picked Other, say what it is.';
  if(q.t==='fits')return 'Each piece needs a brand, the piece, and at least one reason. Remove any piece you’ve left half done.';
  return '';}

/* ---------------- uploads ---------------- */
function hasUp(k){return !!(FILES[k]||st.up[k]);}
function countUp(pre,max){var n=0;for(var i=0;i<max;i++)if(hasUp(pre+'_'+i))n++;return n;}
function upThumb(k){return FILES[k]?FILES[k].url:(st.up[k]&&st.up[k].thumb)||'';}
function compress(file,maxSide,q){return new Promise(function(res,rej){var img=new Image(),u=URL.createObjectURL(file);
  img.onload=function(){var w=img.naturalWidth,h=img.naturalHeight,s=Math.min(1,maxSide/Math.max(w,h));var c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(function(b){URL.revokeObjectURL(u);b?res(b):rej(new Error('encode'));},'image/jpeg',q);};
  img.onerror=function(){URL.revokeObjectURL(u);rej(new Error('decode'));};img.src=u;});}
function thumbOf(blob){return compress(blob,240,0.7).then(function(b){return new Promise(function(r){var fr=new FileReader();fr.onload=function(){r(fr.result);};fr.readAsDataURL(b);});});}
function handleFile(k,file,label){
  if(!file)return;var tile=$('[data-up="'+k+'"]');if(tile)tile.classList.add('busy');
  setTileStatus(k,'Preparing…');
  compress(file,2400,0.92).then(function(blob){
    FILES[k]={url:URL.createObjectURL(blob),blob:blob};drawTile(k,label);refresh();
    if(TEST){LOG.push({type:'photo',key:k,bytes:blob.size,note:'test mode: kept in browser, not uploaded'});return;}
    setTileStatus(k,'Uploading…');
    return uploadBlob(k,blob).then(function(r){return thumbOf(blob).then(function(t){st.up[k]={id:r.id||'',thumb:t};save();setTileStatus(k,'');});});
  }).catch(function(){delete FILES[k];drawTile(k,label);setTileStatus(k,'That photo didn’t work. Try again.');refresh();});}
function uploadBlob(k,blob){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){
  api('/api/upload',{key:k,mime:'image/jpeg',data:String(fr.result).split(',')[1]})
  .then(function(j){j&&j.ok?res(j):rej(j);}).catch(rej);};fr.readAsDataURL(blob);});}
function removeUp(k,label){delete FILES[k];delete st.up[k];save();drawTile(k,label);refresh();}
function tileHTML(k,label,big,sm,ex,flip,tag){var t=upThumb(k);
  return '<div class="rz-up'+(big?' big':'')+(sm?' sm':'')+(t?' has':'')+(ex&&!t?' ex':'')+(tag?' slot':'')+'" data-up="'+k+'" data-label="'+esc(label||'')+'"'+(ex?' data-ex="'+esc(ex)+'" data-flip="'+(flip?1:0)+'"':'')+(tag?' data-tag="'+esc(tag)+'"':'')+'>'+
    (tag&&(t||tag!=='-')?'<span class="rz-rq'+(t?' ok':tag==='Optional'?' opt':'')+'">'+(t?'✓ Added':esc(tag))+'</span>':'')+
    (ex&&!t?'<img class="rz-exbg'+(flip?' flip':'')+'" src="'+ex+'" alt=""><span class="rz-exl">Example</span>':'')+
    (t?'<img class="rz-prev" src="'+t+'" alt=""><button class="rz-x" data-rm="'+k+'" aria-label="Remove photo">×</button>':
      '<span class="rz-plus">+</span>'+(tag?'<span class="rz-lbl">Add photo</span>':sm||ex?'':'<span>'+(label?esc(label):'Add photo')+'</span><span class="rz-lbl">Tap to choose</span>')+'<input type="file" accept="image/*" data-file="'+k+'">')+
    '<span class="rz-st" hidden></span></div>';}
function drawTile(k,label){var el=$('[data-up="'+k+'"]');if(!el)return;var big=el.classList.contains('big'),sm=el.classList.contains('sm');var d=document.createElement('div');d.innerHTML=tileHTML(k,label,big,sm,el.dataset.ex||'',el.dataset.flip==='1',el.dataset.tag||'');var n=d.firstChild;el.parentNode.replaceChild(n,el);bindTiles(n.parentNode);}
function setTileStatus(k,msg){var el=$('[data-up="'+k+'"] .rz-st');if(!el)return;el.hidden=!msg;el.textContent=msg;}
function bindTiles(scope){
  $$('[data-file]',scope).forEach(function(inp){inp.onchange=function(){var k=inp.dataset.file;var lab=inp.closest('.rz-up').dataset.label;handleFile(k,inp.files&&inp.files[0],lab);};});
  $$('[data-rm]',scope).forEach(function(b){b.onclick=function(e){e.preventDefault();var k=b.dataset.rm;removeUp(k,b.closest('.rz-up').dataset.label);};});}

/* ---------------- renderers ---------------- */
function listOpts(k,opts,multi,other){var v=multi?arr(k):A(k);
  var all=opts.concat(other?[OTHER]:[]),h='<div class="rz-list'+(all.length>5?' c2':'')+'">';
  all.forEach(function(o){var on=multi?v.indexOf(o)>-1:v===o;
    h+='<button class="rz-c'+(on?' on':'')+'" data-k="'+k+'" data-v="'+esc(o)+'" data-m="'+(multi?1:0)+'">'+(multi?'<i class="rz-bx">'+TICK+'</i>':'<i class="rz-ring"></i>')+esc(o)+'</button>';});
  h+='</div>';if(other){var show=multi?v.indexOf(OTHER)>-1:v===OTHER;
    h+='<div class="rz-oth'+(show?' show':'')+'" data-oth="'+k+'"><input class="rz-fld" data-t="'+k+'_o" placeholder="Please specify" value="'+esc(A(k+'_o'))+'"><p class="rz-req">Required when you pick Other.</p></div>';}
  return h;}
function segRow(k,labels,cls){var v=A(k),h='<div class="rz-seg'+(cls?' '+cls:'')+'">';labels.forEach(function(l,i){h+='<button class="rz-pill'+(v===i?' on':'')+'" data-seg="'+k+'" data-n="'+i+'">'+esc(l)+'</button>';});return h+'</div>';}
function swatches(k,opts,none,other){var v=arr(k),h='<div class="rz-sw">';
  opts.forEach(function(o){var bg=o[1]==='pattern'?'repeating-linear-gradient(45deg,#23324A 0 6px,#EFE7D8 6px 12px)':o[1]==='bright'?'conic-gradient(#E8C547,#D9772B,#B3262E,#1F5FBF,#2F5D3A,#E8C547)':o[1];
    h+='<button class="rz-s'+(v.indexOf(o[0])>-1?' on':'')+'" data-k="'+k+'" data-v="'+esc(o[0])+'" data-m="1"><i style="background:'+bg+'"></i>'+esc(o[0])+'</button>';});
  if(none)h+='<button class="rz-s txt'+(v.indexOf(none)>-1?' on':'')+'" data-k="'+k+'" data-v="'+none+'" data-m="1"><i>—</i>'+none+'</button>';
  if(other)h+='<button class="rz-s txt'+(v.indexOf(OTHER)>-1?' on':'')+'" data-k="'+k+'" data-v="'+OTHER+'" data-m="1"><i>+</i>Other</button>';
  h+='</div>';if(other)h+='<div class="rz-oth'+(v.indexOf(OTHER)>-1?' show':'')+'" data-oth="'+k+'" style="padding-left:0;margin-top:14px"><input class="rz-fld" data-t="'+k+'_o" placeholder="Which colour?" value="'+esc(A(k+'_o'))+'"></div>';
  return h;}
function swMap(){var m=A('q12');return m&&typeof m==='object'&&!Array.isArray(m)?m:{};}
function swIdx(){var m=swMap();for(var i=0;i<SWIPE.length;i++)if(!(SWIPE[i][0] in m))return i;return SWIPE.length;}
function swDone(){return swIdx()>=SWIPE.length;}
function swYes(){var m=swMap();return SWIPE.filter(function(x){return m[x[0]]===1;});}
function swNo(){var m=swMap();return SWIPE.filter(function(x){return m[x[0]]===0;});}
function swSrc(id){return (CFG.swipeMap&&CFG.swipeMap[id])||(CFG.swipeBase?CFG.swipeBase+id+'.jpg':'');}
function swCard(i,top){var x=SWIPE[i],src=swSrc(x[0]);return '<div class="rz-swcard'+(top?' top':' next')+'" data-card="'+i+'">'+(src?'<img src="'+src+'" alt="'+esc(x[3])+'" draggable="false">':'<span class="rz-ph-img">'+esc(x[3])+'</span>')+
  '<span class="rz-tint"></span><span class="rz-stamp yes">YES</span><span class="rz-stamp no">NO</span></div>';}
function swipeHTML(){var i=swIdx(),n=SWIPE.length,h='<div class="rz-swipe" data-swipe><p class="rz-swhint"><b>Judge the style, not the colours.</b> Swipe right for yes, left for no.</p>';
  if(i<n){h+='<div class="rz-stack">'+(i+1<n?swCard(i+1,false):'')+swCard(i,true)+'</div>'+
    '<div class="rz-swctl"><button class="rz-swb no" data-sw="0" aria-label="No"><span class="rz-swi"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></span><span class="rz-swl">No</span></button><span class="rz-swc"><b>'+(i+1)+'</b> / '+n+'</span><button class="rz-swb yes" data-sw="1" aria-label="Yes"><span class="rz-swi"><svg viewBox="0 0 24 24"><path d="M4.5 12.5l5 5L19.5 7"/></svg></span><span class="rz-swl">Yes</span></button></div>'+
    '<div class="rz-swlinks">'+(i>0?'<button class="rz-link" data-swundo>Back one</button>':'<span></span>')+'</div>';}
  else{var y=swYes().length;h+='<div class="rz-swdone"><div class="rz-swn">'+y+'</div><p><b>'+(y===1?'outfit':'outfits')+' you’d wear.</b>'+(y>=2?' This helps me understand your taste.':' I need at least 2 to understand your taste.')+'</p>'+
    '<div class="rz-swthumbs">'+swYes().map(function(x){var s2=swSrc(x[0]);return s2?'<img src="'+s2+'" alt="">':'';}).join('')+'</div>'+
    '<div class="rz-swlinks"><button class="rz-link" data-swundo>Back one</button><button class="rz-link" data-swreset>Start again</button></div></div>';}
  return h+'</div>';}
var SWBUSY=false;
function swMoving(on){var st3=$('.rz-stack');if(st3)st3.classList.toggle('moving',!!on);}
/* The answer is always tied to the card the man is actually looking at (data-card), never to a recomputed index,
   and nothing is accepted while a card is flying off. Cards are promoted in place, never re-rendered, so no image
   is ever swapped or reloaded under his finger. */
function swDecide(v){
  var c=$('.rz-swcard.top');if(SWBUSY||!c||c.classList.contains('gone'))return;
  var ci=+c.dataset.card,x=SWIPE[ci];if(!x||ci!==swIdx())return;
  SWBUSY=true;var m=Object.assign({},swMap());m[x[0]]=v;set('q12',m);swMoving(true);
  c.classList.add(v?'yes':'no','gone');c.style.pointerEvents='none';
  var t0=$('.rz-tint',c);if(t0)t0.style.background=v?'rgba(78,107,74,.38)':'rgba(142,75,69,.38)';
  c.style.transition='transform .3s var(--ez),opacity .3s';c.style.transform='translate('+(v?140:-140)+'%,0) rotate('+(v?18:-18)+'deg)';c.style.opacity='0';
  var hb=$('.rz-swb.'+(v?'yes':'no'));if(hb)hb.classList.add('hot');
  setTimeout(function(){swAdvance(c);},280);}
function swAdvance(old){
  if(old&&old.parentNode)old.parentNode.removeChild(old);
  $$('.rz-swb').forEach(function(b){b.classList.remove('hot');});
  var i=swIdx(),n=SWIPE.length;
  if(i>=n){SWBUSY=false;swRedraw();return;}
  var st2=$('.rz-stack');if(!st2){SWBUSY=false;swRedraw();return;}
  var top=$('.rz-swcard[data-card="'+i+'"]',st2);
  if(!top){SWBUSY=false;swRedraw();return;}
  top.classList.remove('next');top.classList.add('top');swBindCard(top);
  if(i+1<n&&!$('.rz-swcard[data-card="'+(i+1)+'"]',st2)){var w=document.createElement('div');w.innerHTML=swCard(i+1,false);st2.insertBefore(w.firstChild,st2.firstChild);}
  var cn=$('.rz-swc b');if(cn)cn.textContent=i+1;
  var ln=$('.rz-swlinks');if(ln&&!$('[data-swundo]',ln)){ln.innerHTML='<button class="rz-link" data-swundo>Back one</button>';swBindLinks();}
  swMoving(false);SWBUSY=false;refresh();}
function swRedraw(){var w=$('[data-swipe]');if(!w)return;w.outerHTML=swipeHTML();swBind();refresh();}
function swBindLinks(){
  $$('[data-swundo]').forEach(function(b){b.onclick=function(){if(SWBUSY)return;var m=Object.assign({},swMap()),i=swIdx();if(i>0){delete m[SWIPE[i-1][0]];set('q12',m);swRedraw();}};});
  $$('[data-swreset]').forEach(function(b){b.onclick=function(){if(SWBUSY)return;set('q12',{});swRedraw();};});}
function swBind(){
  SWBUSY=false;
  $$('[data-sw]').forEach(function(b){b.onclick=function(){swDecide(+b.dataset.sw);};});
  swBindLinks();var c=$('.rz-swcard.top');if(c)swBindCard(c);}
function swBindCard(c){var x0=0,y0=0,dx=0,down=false;
  c.addEventListener('pointerdown',function(e){if(SWBUSY||c.classList.contains('gone'))return;down=true;x0=e.clientX;y0=e.clientY;dx=0;c.setPointerCapture(e.pointerId);c.style.transition='none';});
  c.addEventListener('pointermove',function(e){if(!down)return;dx=e.clientX-x0;if(Math.abs(dx)>2)swMoving(true);var dy=(e.clientY-y0)*.2;c.style.transform='translate('+dx+'px,'+dy+'px) rotate('+(dx/18)+'deg)';
    var k=Math.min(1,Math.abs(dx)/120),t=$('.rz-tint',c);if(t){t.style.background=dx>0?'rgba(78,107,74,'+(k*.38)+')':'rgba(142,75,69,'+(k*.38)+')';}
    c.style.boxShadow='0 0 0 '+(k*3).toFixed(1)+'px '+(dx>0?'#4E6B4A':'#8E4B45')+',0 10px 30px rgba(28,28,27,.10)';
    c.classList.toggle('yes',dx>30);c.classList.toggle('no',dx<-30);
    var by=$('.rz-swb.yes'),bn=$('.rz-swb.no');if(by)by.classList.toggle('hot',dx>30);if(bn)bn.classList.toggle('hot',dx<-30);});
  function up(){if(!down)return;down=false;if(Math.abs(dx)>90)swDecide(dx>0?1:0);else{c.style.transition='transform .3s var(--ezp),box-shadow .3s';c.style.transform='';setTimeout(function(){if(!SWBUSY&&!c.classList.contains('gone'))swMoving(false);},300);c.style.boxShadow='';c.classList.remove('yes','no');var t=$('.rz-tint',c);if(t)t.style.background='';$$('.rz-swb').forEach(function(b){b.classList.remove('hot');});}}
  c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);}
function othN(){return Math.max(1,+A('q6_on')||1);}
function chipOpts(k,opts,multi,other){var v=multi?arr(k):A(k),h='<div class="rz-chips">';opts.concat(other?[OTHER]:[]).forEach(function(o){var on=multi?v.indexOf(o)>-1:v===o;h+='<button class="rz-pill'+(on?' on':'')+'" data-k="'+k+'" data-v="'+esc(o)+'" data-m="'+(multi?1:0)+'">'+esc(o)+'</button>';});h+='</div>';
  if(other){var show=multi?v.indexOf(OTHER)>-1:v===OTHER;h+='<div class="rz-oth'+(show?' show':'')+'" data-oth="'+k+'" style="padding-left:0;margin-top:12px"><input class="rz-fld" data-t="'+k+'_o" placeholder="Please specify" value="'+esc(A(k+'_o'))+'"></div>';}return h;}
function pieces(){var p=A('q19');if(!Array.isArray(p)||!p.length)p=[{b:'',p:'',s:'',r:[],o:''}];return p;}
function isEmptyPiece(p){return !filled(p.b)&&!filled(p.p)&&!filled(p.s)&&!(p.r||[]).length;}
function pieceOk(p){return filled(p.b)&&filled(p.p)&&(p.r||[]).length>0&&((p.r||[]).indexOf(OTHER)<0||filled(p.o));}
var FIT_WHY=['Shoulders sit right','Right length','Room in the chest and arms','Slim through the waist','Comfortable all day','Looks sharp'];

function qHead(q,sc,extra,title,help){var num='Question '+q.n+(extra?' · '+extra:'');help=help===undefined?q.help:help;
  return '<div class="rz-qn">'+num+(q.optional?' · <em>Optional</em>':'')+'</div><h2 class="rz-ql">'+two(title||q.title)+'</h2>'+(help?'<p class="rz-qh">'+esc(help)+'</p>':'');}
/* two-tone title: first clause in ink, the rest in tone */
function scanCompare(){var ex=CFG.exampleMap||{},b=CFG.exampleBase||'img/examples/';
  var rows=[['scan-under',1,'Boxers only','Every line sits on his body.'],['scan-fitted',0,'Fitted tee and shorts','The tee bunches at the waistband. The scan can’t see his natural waist, so it reads it higher, near his chest.'],['scan-loose',0,'Joggers and a jumper','The waistband and baggy legs hide his shape. Nothing here is him.']];
  return '<div class="rz-sx">'+rows.map(function(r){var u=ex[r[0]]||(b+r[0]+'.jpg');return '<div class="rz-sxr"><img src="'+u+'" alt=""><div><b class="'+(r[1]?'ok':'no')+'"><i>'+(r[1]?'✓':'✕')+'</i>'+r[2]+'</b><p>'+r[3]+'</p></div></div>';}).join('')+
   '<p class="rz-sxf">Your proportions are built on this scan. So scan in boxers only.</p></div>';}
function two(t){var m=/^(.+?[,.])\s+(.+)$/.exec(t);return m?esc(m[1])+' <span>'+esc(m[2])+'</span>':esc(t);}

function renderQ(sc){var q=Q[sc.q],k=sc.q,h='',extra='';
  if(q.t==='piece')extra='Piece '+(sc.piece+1)+' of 10';
  if(q.t==='outfits'){var O=OUTFITS[sc.slot];h+=qHead({n:q.n,photos:q.photos},sc,(sc.slot+1)+' of '+OUTFITS.length,O.t,O.d);}
  else h+=qHead(q,sc,extra||q.extra);
  if(q.t==='piece'&&sc.piece>0){h=h.replace('<p class="rz-qh">'+esc(q.help)+'</p>','');}
  h+='<div class="rz-body">';
  switch(q.t){
   case 'text':h+=q.long?'<textarea class="rz-fld'+(q.short?' short':'')+'" data-t="'+k+'" placeholder="'+esc(q.ph||'')+'">'+esc(A(k))+'</textarea>'+(q.minc?'<p class="rz-cnt" data-cnt="'+k+'" data-min="'+q.minc+'"></p>':''):'<input class="rz-fld" data-t="'+k+'" placeholder="'+esc(q.ph||'')+'" value="'+esc(A(k))+'" autocomplete="off">';break;
   case 'words':h+='<div class="rz-words">';[0,1,2].forEach(function(i){h+='<label><span class="rz-n">'+(i+1)+'</span><input class="rz-fld" data-t="q9_'+i+'" placeholder="Word '+(i+1)+'" value="'+esc(A('q9_'+i))+'" autocomplete="off"></label>';});h+='</div>';break;
   case 'single':h+=listOpts(k,q.optsFn?q.optsFn(cur()):q.opts,false,q.other);break;
   case 'multi':h+=listOpts(k,q.opts,true,q.other);break;
   case 'swatch':h+=swatches(k,q.opts,q.none,q.other);break;
   case 'freq':h+='<div class="rz-rows freq">';q.rows.forEach(function(r,i){h+='<div class="rz-row"><div class="rz-rl">'+esc(r)+'</div>'+segRow(k+'_'+i,FREQ)+'</div>';});
     for(var oi=0;oi<othN();oi++){h+='<div class="rz-row rz-orow"><div class="rz-rl">Other <span class="rz-muted">(optional)</span></div><input class="rz-fld" data-t="q6_ot_'+oi+'" placeholder="Anything else that comes up" value="'+esc(A('q6_ot_'+oi))+'">'+segRow('q6_ov_'+oi,FREQ)+'</div>';}
     h+='</div>'+(othN()<5?'<button class="rz-add" data-addoth>+ Add another</button>':'');break;
   case 'duo':q.parts.forEach(function(pk,ix){var P=Q[pk];h+='<div class="rz-block rz-duo"><div class="rz-duo-h '+(ix?'up':'down')+'"><span class="rz-duo-i">'+(ix?'↑':'↓')+'</span><span><b>'+P.label+'</b>'+esc(P.sub)+'</span></div>'+chipOpts(pk,P.opts,true,true)+'</div>';});break;
   case 'swipe':h+=swipeHTML();break;
   case 'size':h+=sizeGrid(sc.sub);break;
   case 'fits':h+=fitsHTML();break;
   case 'price':var c=cur(),bands=['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];
     h+='<div class="rz-szs">';q.rows.forEach(function(r,i){var v=A(k+'_'+i);h+='<div class="rz-szrow"><div class="rz-szl"><b>'+esc(r)+'</b></div><select class="rz-sel'+(v!=null?' set':'')+'" data-sel="'+k+'_'+i+'" aria-label="'+esc(r)+'"><option value="">Choose</option>'+bands.map(function(b,n){return '<option value="'+n+'"'+(String(v)===String(n)?' selected':'')+'>'+esc(b)+'</option>';}).join('')+'</select></div>';});h+='</div>';break;
   case 'size1':var c1=q.c,g1=SIZE[c1],reg1=region(),v1=A(k);
     if(c1!=='tops')h+='<div class="rz-reg"><span>Sizes in</span><div class="rz-seg">'+['UK','US','EU'].map(function(r){return '<button class="rz-pill'+(r===reg1?' on':'')+'" data-reg="'+r+'">'+r+'</button>';}).join('')+'</div></div>';
     var pb=function(key,val,lab,cur){return '<button class="rz-pill'+(String(cur)===String(val)?' on':'')+'" data-sz="'+key+'" data-v="'+esc(val)+'">'+esc(lab)+'</button>';};
     if(c1==='trousers')h+='<div class="rz-szh">Waist</div>';
     h+='<div class="rz-szgrid'+(c1==='tops'?' wide':'')+'">'+g1.rows.map(function(r,i){return pb(k,String(i),szOpt(c1,i,reg1),v1);}).join('')+pb(k,'ns','Not sure',v1)+'</div>';
     if(c1==='collar')h+='<div class="rz-szh">Or a letter size</div><div class="rz-szgrid">'+LETTERS.map(function(l){return pb(k,'L:'+l,l,v1);}).join('')+'</div>';
     if(c1==='trousers'){var lv1=A('q18_trousers_leg');h+='<div class="rz-szh">Leg</div><div class="rz-szgrid">'+g1.leg.map(function(l){return pb('q18_trousers_leg',l,'L'+l,lv1);}).join('')+pb('q18_trousers_leg','ns','Not sure',lv1)+'</div>';}
     break;
   case 'sizes':var reg=region();
     h+='<div class="rz-reg"><span>Sizes in</span><div class="rz-seg">'+['UK','US','EU'].map(function(r){return '<button class="rz-pill'+(r===reg?' on':'')+'" data-reg="'+r+'">'+r+'</button>';}).join('')+'</div></div><div class="rz-szs">';
     SIZE_ORDER.forEach(function(c){var key='q18_'+c,val=A(key),g=SIZE[c];
       var opts='<option value="">Choose</option>'+g.rows.map(function(r,i){return '<option value="'+i+'"'+(String(val)===String(i)?' selected':'')+'>'+esc(szOpt(c,i,reg))+'</option>';}).join('');
       if(c==='collar')opts+='<optgroup label="Or a letter size">'+LETTERS.map(function(l){return '<option value="L:'+l+'"'+(val==='L:'+l?' selected':'')+'>'+l+'</option>';}).join('')+'</optgroup>';
       opts+='<option value="ns"'+(val==='ns'?' selected':'')+'>Not sure</option>';
       var sel='<select class="rz-sel'+(filled(val)?' set':'')+'" data-sel="'+key+'" aria-label="'+esc(SZ_LABEL[c][0])+'">'+opts+'</select>';
       if(c==='trousers'){var lv=A('q18_trousers_leg');sel='<div class="rz-sel2">'+sel.replace('>Choose<','>Waist<')+'<select class="rz-sel'+(filled(lv)?' set':'')+'" data-sel="q18_trousers_leg" aria-label="Leg"><option value="">Leg</option>'+g.leg.map(function(l){return '<option value="'+l+'"'+(lv===l?' selected':'')+'>L'+l+'</option>';}).join('')+'<option value="ns"'+(lv==='ns'?' selected':'')+'>Not sure</option></select></div>';}
       h+='<div class="rz-szrow"><div class="rz-szl"><b>'+SZ_LABEL[c][0]+'</b><span>'+SZ_LABEL[c][1]+'</span></div>'+sel+'</div>';});
     h+='</div>';break;
   case 'closet10':var added=countUp('q24',10);
     h+='<label class="rz-bulk"><input type="file" accept="image/*" multiple data-bulk="q24"><span class="rz-plus">+</span><span><b>'+(added?'Add more photos':'Add your 10 photos')+'</b>Select them all at once from your camera roll</span></label>';
     h+='<div class="rz-pchead"><b>How does each one fit you?</b><span id="rz-c24">'+added+' of 10 added</span></div><div class="rz-pcs">';
     for(var ci=0;ci<10;ci++){h+='<div class="rz-pc">'+tileHTML('q24_'+ci,'Piece '+(ci+1))+segRow('q24_'+ci+'_fitn',['Fits','Not sure','Doesn’t'],'c3 rz-fitseg')+'</div>';}
     h+='</div>';break;
   case 'piece':var p=sc.piece,pk='q24_'+p;
     h+='<div class="rz-block">'+tileHTML(pk,'Photo of piece '+(p+1),true)+'</div>';
     h+='<div class="rz-block"><div class="rz-bl">What is it?</div>'+chipOpts(pk+'_type',ITEM_TYPES,false,true)+'</div>';
     h+='<div class="rz-block"><div class="rz-bl">How does it fit?</div>'+segRow(pk+'_fitn',['Fits well','Not sure','Doesn’t fit'],'c3')+'</div>';break;
   case 'outfits':var O2=OUTFITS[sc.slot];
     var oek={outfit_tuesday:'outfit-tuesday',outfit_dinner:'outfit-dinner',outfit_not_working:'outfit-not-working',outfit_gym:'outfit-gym',outfit_holiday:'outfit-holiday'}[O2.k],oeu=CFG.exampleMap?(CFG.exampleMap[oek]||''):(CFG.exampleBase?CFG.exampleBase+oek+'.jpg':'');
     h+='<div class="rz-oslot">'+tileHTML(O2.k,O2.t,false,false,oeu,false,O2.req?'Required':'-')+'</div>';
     h+='<p class="rz-remind">Full outfit, head to shoes, face visible, no filters.</p>';
     if(O2.k==='outfit_not_working')h+='<div class="rz-follow"><label class="rz-fl" for="rz-off">What do you think is off?</label><input id="rz-off" class="rz-fld" data-t="outfit_off_note" placeholder="e.g. The trousers feel too long and the jacket looks boxy." value="'+esc(A('outfit_off_note'))+'" autocomplete="off"></div>';
     break;
   case 'face':var EX=['colouring-1-good','face-left','face-right','face-eyes'];
     h+='<div class="rz-ups rz-face">';q.slots.forEach(function(s,i){var ek=EX[i],eu=CFG.exampleMap?(CFG.exampleMap[ek]||''):(CFG.exampleBase?CFG.exampleBase+ek+'.jpg':'');
       h+='<div class="rz-fs'+(i===0?' paper':'')+'"><div class="rz-slotl"><b>'+esc(s)+'</b>'+(i===0?'<span class="rz-paper">Paper under chin</span>':'<span class="rz-nopaper">No paper</span>')+'</div>'+tileHTML('q26_'+i,'',false,false,eu,false)+'</div>';});h+='</div>';break;
  }
  return h+'</div>';}

function sizeGrid(c){var g=SIZE[c],k='q18_'+c,v=arr(k),none=!!A(k+'_none'),h='';
  if(g.len){h+='<div class="rz-block"><div class="rz-bl">Length, if you know it</div>'+chips(k+'_len',g.len)+'</div>';}
  h+='<div class="rz-block">'+(g.len?'<div class="rz-bl">Size</div>':'')+(g.help?'<p class="rz-bh">'+esc(g.help)+'</p>':'');
  h+='<div class="rz-tbl"><div class="rz-th" style="grid-template-columns:'+g.w+'">'+g.cols.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>';
  g.rows.forEach(function(r){var id=String(r[0]);h+='<button class="rz-tr'+(v.indexOf(id)>-1?' on':'')+'" style="grid-template-columns:'+g.w+'" data-size="'+k+'" data-v="'+esc(id)+'">'+r.map(function(x,j){return '<span'+(c==='tops'&&j===1?' class="rz-dim"':'')+'>'+esc(x)+'</span>';}).join('')+'</button>';});
  h+='</div>';
  h+='<div class="rz-noidea"><button class="rz-c'+(none?' on':'')+'" data-noidea="'+k+'"><i class="rz-bx">'+TICK+'</i>No idea</button></div>';
  if(g.helper)h+='<div class="rz-help">'+esc(g.helper)+'</div>';
  h+='</div>';
  if(g.leg){h+='<div class="rz-block"><div class="rz-bl">Leg length (in), if you know it</div>'+chips(k+'_leg',g.leg)+'</div>';}
  h+='<div class="rz-block"><div class="rz-bl">Which brand is this from?</div><p class="rz-bh">Optional. Brands size differently, so this helps.</p><input class="rz-fld" data-t="'+k+'_brand" placeholder="e.g. Suitsupply, M&S, BOSS" value="'+esc(A(k+'_brand'))+'"></div>';
  return h;}
function chips(k,opts){var v=arr(k),h='<div class="rz-chips">';opts.forEach(function(o){h+='<button class="rz-pill'+(v.indexOf(o)>-1?' on':'')+'" data-chip="'+k+'" data-v="'+esc(o)+'">'+esc(o)+'</button>';});return h+'</div>';}
function fitsHTML(){var ps=pieces(),h='';
  ps.forEach(function(p,i){h+='<div class="rz-card" data-piece="'+i+'"><div class="rz-card-h"><b>Piece '+(i+1)+'</b>'+(i>0?'<button class="rz-link" data-delpiece="'+i+'">Remove</button>':'')+'</div>'+
    '<input class="rz-fld" data-pf="b" data-i="'+i+'" placeholder="Brand" value="'+esc(p.b)+'">'+
    '<input class="rz-fld" data-pf="p" data-i="'+i+'" placeholder="Piece, e.g. navy blazer" value="'+esc(p.p)+'">'+
    '<input class="rz-fld" data-pf="s" data-i="'+i+'" placeholder="Size (optional)" value="'+esc(p.s)+'">'+
    '<div class="rz-mini-l">What do you like about how it fits?</div><div class="rz-chips">';
    FIT_WHY.concat([OTHER]).forEach(function(r){h+='<button class="rz-pill'+((p.r||[]).indexOf(r)>-1?' on':'')+'" data-pr="'+esc(r)+'" data-i="'+i+'">'+esc(r)+'</button>';});
    h+='</div><div class="rz-oth'+((p.r||[]).indexOf(OTHER)>-1?' show':'')+'" style="padding-left:0;margin-top:10px"><input class="rz-fld" data-pf="o" data-i="'+i+'" placeholder="What else?" value="'+esc(p.o)+'"></div></div>';});
  if(ps.length<3)h+='<button class="rz-add" data-addpiece>+ Add another piece</button>';
  return h;}

/* ---------------- screens ---------------- */
var LASTP=0;
function pad2(n){return (n<10?'0':'')+n;}
function stepFrac(sc){var s=sc.s;if(s==null)return sc.k==='testend'?1:0;var list=SCR.filter(function(x){return x.s===s;}),pos=list.indexOf(sc);return (s+Math.max(.04,(pos+1)/list.length))/8;}
function header(sc){var s=sc.s,pn;
  if(sc.k==='home')pn='Intake · <b>Intro</b>';
  else if(s!=null)pn='<span class="rz-pnw">Step </span><b>'+pad2(s+1)+'</b> / 08 · '+esc(STEPS[s].name);
  else pn='Intake';
  var p=(stepFrac(sc)*100).toFixed(1);
  return '<header class="rz-hd"><span class="rz-logo">The Style Guide</span><span class="rz-pn">'+pn+'</span></header>'+
    (sc.k==='home'?'':'<div class="rz-bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(p)+'"><i style="width:'+LASTP+'%" data-p="'+p+'"></i></div>');}
function imgSrc(img){return (CFG.imgMap&&CFG.imgMap[img])||(CFG.imgBase+img+'.webp');}
var CALM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function webmSrc(img){return (CFG.webmMap&&CFG.webmMap[img])||(CFG.imgBase+img+'.webm');}
function vidSrc(img){return (CFG.vidMap&&CFG.vidMap[img])||(CFG.imgBase+img+'.mp4');}
function posterSrc(img){return (CFG.posterMap&&CFG.posterMap[img])||(CFG.imgBase+img+'-poster.jpg');}
function art(img,alt,move,tag){
  // moving: the clips are rendered with the stone panel colour as their background (no blending needed).
  // still: the transparent webp sits straight on the stone.
  var m=(move&&CFG.animate!==false&&!CALM)?'<video class="rz-m rz-vid" poster="'+posterSrc(img)+'" autoplay muted loop playsinline disablepictureinpicture aria-label="'+esc(alt||'')+'"><source src="'+webmSrc(img)+'" type="video/webm"><source src="'+vidSrc(img)+'" type="video/mp4"></video>':
    '<img class="rz-m rz-still" src="'+imgSrc(img)+'" alt="'+esc(alt||'')+'">';
  return '<div class="rz-art rz-a1"><div class="rz-artin">'+(tag?'<span class="rz-tag">'+esc(tag)+'</span>':'')+m+'</div></div>';}
function thumb(sc){return sc.s==null?'':'<span class="rz-thumb" aria-hidden="true"><img src="'+imgSrc(STEPS[sc.s].img)+'" alt=""></span>';}
function nav(label,opts){opts=opts||{};return '<div class="rz-nav rz-a3'+(opts.mid?' has-mid':'')+(opts.noBack?' no-back':'')+'">'+(opts.noBack?'':'<button class="rz-btn rz-bk" data-back aria-label="Back"><span>Back</span></button>')+
  (opts.mid?'<span class="rz-mid" id="rz-mid">'+opts.mid+'</span>':'')+
  '<button class="rz-btn rz-go'+(opts.wide?' wide':'')+'" data-next'+(opts.skip?' data-skip':'')+'>'+label+'</button><p class="rz-why" data-whynot></p></div>';}
function shell(cls,sc,content,navHTML,artHTML){
  return '<div class="rz-shell '+cls+'">'+header(sc)+'<div class="rz-main"><div class="rz-pane"><div class="rz-content rz-a2">'+content+'</div>'+navHTML+'</div>'+(artHTML||'')+'</div></div>';}
function stepTag(s){return 'Step '+pad2(s+1)+' · '+STEPS[s].name;}

function render(){var sc=SCR[st.i],h='';
  root.classList.toggle('rz-back-anim',st.dir<0);
  if(sc.k==='home'){
    var started=RESUME>1;
    h=shell('rz-home',sc,'<div class="rz-eyeb">Your style guide · Intake</div><h1 class="rz-h1">Before I build it, <span>I need a few things.</span></h1>'+
      '<p class="rz-sub">Everything on our call comes from what you give me here. The more honest you are, the sharper it gets.</p>'+
      '<div class="rz-meta"><div>Steps<b>8</b></div><div>Time<b>About 20 minutes</b></div><div>Progress<b>Saves as you go</b></div></div>'+
      '<ol class="rz-steps">'+STEPS.map(function(x,i){var d=st.sent[x.id];return '<li class="'+(d?'done':'')+'"><span class="rz-sn">'+(d?'✓':pad2(i+1))+'</span><b>'+x.name+'</b><em>'+x.line+'</em></li>';}).join('')+'</ol>',
      nav(started?'Carry on':'Let’s begin',{noBack:true}),art('intro','Everything that goes into your style guide',true,'Your style guide'));
  } else if(sc.k==='cover'){var S=STEPS[sc.s];
    h=shell('rz-cover',sc,'<div class="rz-eyeb">Step '+pad2(sc.s+1)+' of 08</div><h1 class="rz-h1">'+S.name+'</h1><p class="rz-sub">'+S.line+'.</p>',
      nav('Start'),art(S.img,S.name,true,stepTag(sc.s)));
  } else if(sc.k==='why'){
    var wt=sc.w==='scan'?'This is your body, measured.':sc.w==='closet'?'Your photos decide your verdicts.':'Light changes your skin tone.';
    var wb=sc.w==='scan'?WHY.scan.replace('This is your body, measured. ',''):WHY[sc.w];
    h=shell('rz-qs',sc,thumb(sc)+'<div class="rz-qn">Why this matters</div><h2 class="rz-ql">'+two(wt)+'</h2><p class="rz-sub">'+wb+'</p>'+
      '<div class="rz-body"><div class="rz-warn"><div class="rz-warn-t">Important</div>'+WARN[sc.w]+(sc.w!=='scan'?' Next: '+RULES[sc.w].length+' quick rules, each with an example.':'')+'</div></div>',
      nav('I understand'),art(STEPS[sc.s].img,'',false,stepTag(sc.s)));
  } else if(sc.k==='rule'){var R=RULES[sc.set][sc.r],rk='rule_'+sc.set+'_'+sc.r,base=CFG.exampleBase;
    var ex=function(kind){var ek=sc.set+'-'+(sc.r+1)+'-'+kind,eu=(CFG.exampleMap&&CFG.exampleMap[ek])||(base?base+ek+'.jpg':'');var src=eu?'<img src="'+eu+'" alt="">':'<span>Example photo<br>to come</span>';
      return '<div class="rz-exi '+kind+'">'+src+'<span class="rz-tag">'+(kind==='good'?'✓ Like this':'✕ Not this')+'</span></div>';};
    h=shell('rz-qs rz-rule',sc,thumb(sc)+'<div class="rz-qn">Photo rule '+(sc.r+1)+' of '+RULES[sc.set].length+'</div>'+
      '<div class="rz-ex">'+ex('good')+ex('bad')+'</div>'+
      '<div class="rz-rulebig">'+esc(R[0])+'</div>'+(R[1]?'<p class="rz-rulesub">'+esc(R[1])+'</p>':'')+
      '<div class="rz-body"><button class="rz-t'+(A(rk)?' on':'')+'" data-tick="'+rk+'"><span class="rz-bx">'+TICK+'</span><span><b>Got it.</b> I’ll follow this.</span></button></div>',
      nav('Continue'),art(STEPS[sc.s].img,'',false,stepTag(sc.s)));
  } else if(sc.k==='outrules'){var QO=Q.qout;
    h=shell('rz-qs rz-outrules',sc,thumb(sc)+'<div class="rz-qn">Question '+QO.n+'</div><h2 class="rz-ql">'+two(QO.title)+'</h2><p class="rz-qh">'+esc(QO.help)+'</p>'+
      '<div class="rz-rules">'+OUT_RULES.map(function(r){return '<div><span>'+esc(r[0])+'</span><p>'+esc(r[1])+'</p></div>';}).join('')+'</div>'+
      '<div class="rz-disc"><b>No photo for one of these?</b>Send the closest thing you have. Any photo of you in a full outfit is fine.</div>'+
      '<div class="rz-body"><button class="rz-t'+(A('photo_consent')?' on':'')+'" data-tick="photo_consent"><span class="rz-bx">'+TICK+'</span><span><b>I’m happy for you to use my photos for my style guide.</b> They’re only used for my guide and my calls. They stay private and are never shown publicly without my OK. They’re deleted a year after we last work together. Your photos and scan are handled under UK GDPR, and we’ll delete everything on request.</span></button></div>',
      nav('Continue'),art(STEPS[sc.s].img,'',false,stepTag(sc.s)));
  } else if(sc.k==='daylight'){
    h=shell('rz-qs',sc,thumb(sc)+'<div class="rz-qn">Before you start</div><h2 class="rz-ql">These need natural daylight.</h2>'+
      '<p class="rz-sub">If it’s dark where you are, do them first thing tomorrow. Everything else you’ve done is saved.</p>',
      nav('I’m in daylight'),art(STEPS[sc.s].img,'',false,stepTag(sc.s)));
  } else if(sc.k==='q'){
    var wide=['q6','q24'].indexOf(sc.q)>-1,qq=Q[sc.q];
    var skip=qq.t==='outfits'&&!OUTFITS[sc.slot].req;
    h=shell('rz-qs'+(wide?' rz-wide':''),sc,thumb(sc)+'<div class="rz-q rz-q-'+sc.q+(qq.t==='outfits'?' rz-slot-'+OUTFITS[sc.slot].k:'')+'">'+renderQ(sc)+'</div>',nav(skip&&!hasUp(OUTFITS[sc.slot].k)?'Skip':'Continue',{skip:skip}),wide?'':art(STEPS[sc.s].img,'',false,stepTag(sc.s)));
  } else if(sc.k==='scanpriv'){
    var PV=[['What it is','A 3D body scan you do on your phone. You follow the steps on screen and it measures you.'],
      ['Why I need it','It gives me your measurements and your real shape. Your sizes, cuts and proportions in your style guide are all built on it. Without it, I’d be guessing from photos.'],
      ['What I see','Never your photos. All I get back is your measurements and a plain 3D model of your shape, like a mannequin. No face, no colour.'+(CFG.showPrivacy?' The scan’s photos are deleted straight away.':'')],
      ['Who sees it','Only me. It’s used for your style guide and nothing else.']];
    h=shell('rz-qs',sc,thumb(sc)+'<div class="rz-qn">Your scan</div><h2 class="rz-ql">'+two('What the scan is, and what I see.')+'</h2>'+
      '<div class="rz-body"><div class="rz-rules" style="grid-template-columns:1fr">'+PV.map(function(r){return '<div><span>'+esc(r[0])+'</span><p>'+r[1]+'</p></div>';}).join('')+'</div></div>',
      nav('Continue'),art('scan','Your scan',false,stepTag(sc.s)));
  } else if(sc.k==='scancompare'){
    h=shell('rz-qs',sc,thumb(sc)+'<div class="rz-qn">Your scan</div><h2 class="rz-ql">'+two('Why boxers only.')+'</h2><p class="rz-sub">Three real scans. Clothes move the lines your proportions are built on.</p>'+
      scanCompare(),nav('I understand'),art('scan','Your scan',false,stepTag(sc.s)));
  } else if(sc.k==='scanticks'){
    var TK=[['t_name','<b>Use the same name and email you paid with.</b> This is how I match your scan to you.'],
      ['t_clothes','<b>Scan in boxers only.</b> No t-shirt, no shorts, nothing else. If the scan app says fitted clothes are fine, ignore it. For your style guide, it’s boxers only.'],
      ['t_steps','<b>Follow the scan’s own steps exactly.</b>']];
    h=shell('rz-qs',sc,thumb(sc)+'<div class="rz-qn">Before you scan</div><h2 class="rz-ql">'+two('Last step. Then it’s my turn.')+'</h2><p class="rz-qh">Tick each one to confirm.</p>'+
      '<div class="rz-body"><div class="rz-ticks">'+TK.map(function(t){return '<button class="rz-t'+(A(t[0])?' on':'')+'" data-tick="'+t[0]+'"><span class="rz-bx">'+TICK+'</span><span>'+t[1]+'</span></button>';}).join('')+'</div>'+
      '</div>',
      nav('Continue'),art('scan','Your scan',false,stepTag(sc.s)));
  } else if(sc.k==='final'){
    h=shell('rz-qs rz-final',sc,thumb({s:sc.s})+'<div class="rz-eyeb">All done here</div><h1 class="rz-h1">'+two('That’s everything. Only your scan is left.')+'</h1>'+
      '<div class="rz-body"><div class="rz-note"><b>You won’t come back to this page.</b> The button takes you to the scan. Once your scan is submitted, you’re done. Nothing else to do until our call.</div>'+
      '<p class="rz-sub">I’ll build your style guide before our call. You’ll see it for the first time with me. If anything you sent needs redoing, I’ll email you straight away.</p>'+
      '<div class="rz-ready"><div class="rz-stl">Before our call, have these ready</div><ul><li>Your closet, close by</li><li>Good daylight if you can</li></ul></div></div>',
      nav('Start my scan, and finish',{wide:true}),art('done','Done',false,'All done'));
  } else if(sc.k==='testend'){
    h=shell('rz-qs rz-wide',sc,'<div class="rz-eyeb">Test mode</div><h2 class="rz-ql">'+two('In the live page, the button opens the scan here.')+'</h2>'+
      '<p class="rz-sub">Below is everything that would have been sent to GHL, one post per step. Photos stay in your browser in test mode.</p>'+
      '<pre class="rz-json">'+esc(JSON.stringify(LOG,null,2))+'</pre>',
      '<div class="rz-nav"><button class="rz-btn rz-bk" data-back><span>Back</span></button><button class="rz-btn rz-go" data-reset>Start again</button></div>');
  }
  if(window.__phT){clearInterval(window.__phT);window.__phT=null;}
  root.innerHTML=(TEST?'<div class="rz-testbar">Test mode<button data-reset>Reset</button></div>':'')+h;
  bind(sc);refresh();window.scrollTo(0,0);
  if(sc.k==='q'&&Q[sc.q]&&Q[sc.q].phs){var phs=Q[sc.q].phs,pi=0,pf=$('[data-t="'+sc.q+'"]');if(pf)window.__phT=setInterval(function(){pi=(pi+1)%phs.length;pf.setAttribute('placeholder',phs[pi]);},3000);}
  if(sc.k==='home'){var hv=$('video');if(hv){var slow=function(){hv.defaultPlaybackRate=.75;hv.playbackRate=.75;};slow();hv.addEventListener('loadedmetadata',slow);hv.addEventListener('play',slow);}}
  var bar=$('.rz-bar i');if(bar){var to=+bar.dataset.p;void bar.offsetWidth;requestAnimationFrame(function(){bar.style.width=to+'%';});LASTP=to;}else LASTP=0;}
/* ---------------- events ---------------- */
function bind(sc){
  var nx=$('[data-next]'),bk=$('[data-back]');
  if(bk)bk.onclick=function(){go(-1);};
  if(nx)nx.onclick=function(){next(sc);};
  $$('[data-reset]').forEach(function(b){b.onclick=function(){try{localStorage.removeItem(KEY);}catch(e){}st={i:0,a:{},up:{},sent:{},dir:1};FILES={};LOG=[];render();};});
  // options
  $$('.rz-c[data-k],.rz-s[data-k],.rz-pill[data-k]').forEach(function(b){b.onclick=function(){var k=b.dataset.k,v=b.dataset.v,m=b.dataset.m==='1',q=Q[k]||{};
    if(m){var l=arr(k).slice(),ix=l.indexOf(v),ex=(q.excl||[]).concat(q.none?[q.none]:[]);
      if(ix>-1)l.splice(ix,1);else{if(ex.indexOf(v)>-1)l=[v];else{l=l.filter(function(x){return ex.indexOf(x)<0;});l.push(v);}}
      set(k,l);$$('[data-k="'+k+'"]').forEach(function(x){x.classList.toggle('on',l.indexOf(x.dataset.v)>-1);});
      var o=$('[data-oth="'+k+'"]');if(o){o.classList.toggle('show',l.indexOf(OTHER)>-1);if(v===OTHER&&l.indexOf(OTHER)>-1)setTimeout(function(){var f=$('input',o);f&&f.focus();},200);}
    } else {set(k,v);$$('[data-k="'+k+'"]').forEach(function(x){x.classList.toggle('on',x===b);});
      var o2=$('[data-oth="'+k+'"]');if(o2){o2.classList.toggle('show',v===OTHER);if(v===OTHER)setTimeout(function(){var f=$('input',o2);f&&f.focus();},200);}
      if(v!==OTHER&&sc.k==='q'&&Q[sc.q]&&Q[sc.q].t==='single')setTimeout(function(){if(SCR[st.i]===sc&&valid(sc))next(sc);},380);}
    refresh();};});
  $$('[data-t]').forEach(function(f){f.oninput=function(){set(f.dataset.t,f.value);cnt();refresh();};
    if(f.tagName==='INPUT')f.onkeydown=function(e){if(e.key==='Enter'&&!FINE){e.preventDefault();f.blur();}};});
  $$('[data-seg]').forEach(function(b){b.onclick=function(){var k=b.dataset.seg;set(k,+b.dataset.n);$$('[data-seg="'+k+'"]').forEach(function(x){x.classList.toggle('on',x===b);});
    if(k.indexOf('_fitn')>0){set(k.replace('_fitn','_fit'),['Fits well','Not sure','Doesn’t fit'][+b.dataset.n]);}refresh();};});
  $$('[data-chip]').forEach(function(b){b.onclick=function(){var k=b.dataset.chip,l=arr(k).slice(),i=l.indexOf(b.dataset.v);if(i>-1)l.splice(i,1);else l.push(b.dataset.v);set(k,l);b.classList.toggle('on',i<0);refresh();};});
  $$('[data-tick]').forEach(function(b){b.onclick=function(){var k=b.dataset.tick;set(k,!A(k));if(k==='photo_consent')set('photo_consent_at',A(k)?new Date().toISOString():'');b.classList.toggle('on',!!A(k));refresh();};});
  // swipe
  if($('[data-swipe]'))swBind();
  // sizes
  $$('[data-size]').forEach(function(b){b.onclick=function(){var k=b.dataset.size,l=arr(k).slice(),i=l.indexOf(b.dataset.v);if(i>-1)l.splice(i,1);else l.push(b.dataset.v);set(k,l);
    b.classList.toggle('on',i<0);if(l.length){set(k+'_none',false);var ni=$('[data-noidea="'+k+'"]');ni&&ni.classList.remove('on');}refresh();};});
  $$('[data-noidea]').forEach(function(b){b.onclick=function(){var k=b.dataset.noidea,v=!A(k+'_none');set(k+'_none',v);b.classList.toggle('on',v);
    if(v){set(k,[]);$$('[data-size="'+k+'"]').forEach(function(x){x.classList.remove('on');});}refresh();};});
  // q19 pieces
  $$('[data-pf]').forEach(function(f){f.oninput=function(){var ps=pieces().slice();ps[+f.dataset.i][f.dataset.pf]=f.value;set('q19',ps);refresh();};});
  $$('[data-pr]').forEach(function(b){b.onclick=function(){var ps=pieces().slice(),p=ps[+b.dataset.i];p.r=(p.r||[]).slice();var v=b.dataset.pr,ix=p.r.indexOf(v);if(ix>-1)p.r.splice(ix,1);else p.r.push(v);
    set('q19',ps);b.classList.toggle('on',ix<0);if(v===OTHER){var o=b.closest('.rz-card').querySelector('.rz-oth');o.classList.toggle('show',ix<0);}refresh();};});
  $$('[data-reg]').forEach(function(b){b.onclick=function(){set('q18_reg',b.dataset.reg);rerenderBody(sc);};});
  $$('[data-sz]').forEach(function(b){b.onclick=function(){var key=b.dataset.sz;set(key,b.dataset.v);$$('[data-sz="'+key+'"]').forEach(function(x){x.classList.toggle('on',x===b);});refresh();
    setTimeout(function(){if(SCR[st.i]===sc&&valid(sc))next(sc);},380);};});
  $$('[data-sel]').forEach(function(el){el.onchange=function(){set(el.dataset.sel,el.value===''?null:el.value);el.classList.toggle('set',!!el.value);refresh();};});
  var bu=$('[data-bulk]');if(bu)bu.onchange=function(){var fs=Array.prototype.slice.call(bu.files||[]),pre=bu.dataset.bulk,mx=+(bu.dataset.max||10);
    for(var i=0;i<mx&&fs.length;i++){if(!hasUp(pre+'_'+i))handleFile(pre+'_'+i,fs.shift(),String(i+1));}bu.value='';};
  var ao=$('[data-addoth]');if(ao)ao.onclick=function(){set('q6_on',othN()+1);rerenderBody(sc);setTimeout(function(){var f=$('[data-t="q6_ot_'+(othN()-1)+'"]');f&&f.focus();},50);};
  var ap=$('[data-addpiece]');if(ap)ap.onclick=function(){var ps=pieces().slice();ps.push({b:'',p:'',s:'',r:[],o:''});set('q19',ps);rerenderBody(sc);};
  $$('[data-delpiece]').forEach(function(b){b.onclick=function(){var ps=pieces().slice();ps.splice(+b.dataset.delpiece,1);set('q19',ps);rerenderBody(sc);};});
  bindTiles(root);cnt();}
/* Enter = Continue on a keyboard (when the screen is valid). Textareas keep Enter for new lines; Shift+Enter never submits. */
var FINE=window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;
document.addEventListener('keydown',function(e){
  if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&$('.rz-swcard.top')&&!(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))){e.preventDefault();swDecide(e.key==='ArrowRight'?1:0);return;}
  if(e.key!=='Enter'||e.shiftKey||e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.keyCode===229)return;
  var t=e.target,tag=(t&&t.tagName)||'';
  if(tag==='TEXTAREA'||tag==='SELECT')return;
  if(!root.contains(t)&&t!==document.body&&t!==document.documentElement)return;
  if(t.closest&&t.closest('[data-next],[data-back],[data-reset],.rz-testbar'))return;   // focused nav buttons keep their own Enter
  if(tag==='INPUT'&&!FINE)return;   // phone keyboards: Enter/Go just closes the keyboard
  var sc=SCR[st.i];if(!$('[data-next]'))return;
  e.preventDefault();
  if(valid(sc))next(sc);
},true);
function cnt(){$$('[data-cnt]').forEach(function(p){var n=String(A(p.dataset.cnt)||'').trim().length,m=+p.dataset.min;p.textContent=n>=m?'✓ '+n+' characters':n+' / '+m+' characters minimum';p.classList.toggle('ok',n>=m);});}
function rerenderBody(sc){var y=window.scrollY;render();window.scrollTo(0,y);}
function refresh(){var c24=$('#rz-c24');if(c24)c24.textContent=countUp('q24',10)+' of 10 added';var sc=SCR[st.i],nx=$('[data-next]'),w=$('[data-whynot]');if(nx&&nx.hasAttribute('data-skip'))nx.textContent=hasUp(OUTFITS[sc.slot].k)?'Continue':'Skip';if(!nx)return;var ok=valid(sc);nx.classList.toggle('off',!ok);nx.setAttribute('aria-disabled',String(!ok));if(w&&ok){w.textContent='';w.classList.remove('show');}else if(w&&w.classList.contains('show'))w.textContent=whyNot(sc)||'Answer the question above to carry on.';}

function go(d){var n=st.i+d;if(n<0||n>=SCR.length)return;
  // skip Q13 when nothing is left to pick from
  st.dir=d;st.i=n;save();render();}
function next(sc){if(!valid(sc)){var w=$('[data-whynot]'),nx=$('[data-next]');if(w){w.textContent=whyNot(sc)||'Answer the question above to carry on.';w.classList.add('show');}if(nx){nx.classList.remove('shake');void nx.offsetWidth;nx.classList.add('shake');}return;}
  if(sc.k==='home'&&RESUME>1){st.dir=1;st.i=RESUME;RESUME=0;save();render();return;}
  var nxt=SCR[st.i+1];
  if(sc.k==='final'){postSection('scan',true);if(TEST){go(1);}else if(CFG.scanUrl){setTimeout(function(){window.location.href=CFG.scanUrl;},600);}else{blocked('All done. Your scan link is in your welcome email.');}return;}
  if(nxt&&sc.s!=null&&nxt.s!==sc.s){postSection(STEPS[sc.s].id);}
  go(1);}

/* ---------------- sending ---------------- */
function lab(q){return 'Q'+Q[q].n+' '+Q[q].title;}
function withOther(k,v){return Array.isArray(v)?v.map(function(x){return x===OTHER?'Other: '+(A(k+'_o')||''):x;}).join(', '):(v===OTHER?'Other: '+(A(k+'_o')||''):v||'');}
function sectionAnswers(id){var o={},c=cur();
  function put(key,val){o[key]=val==null?'':val;}
  if(id==='life'){put('q1_based',A('q1'));put('q2_role',A('q2'));put('q3_work_day',withOther('q3',arr('q3')));
    var f=Q.q6.rows.map(function(r,i){return r+': '+A('q6_'+i);});if(filled(A('q6_other')))f.push('Other: '+A('q6_other'));put('q6_month',f.join(' | '));
    put('q7_travel',withOther('q7',arr('q7')));put('currency',c);}
  if(id==='you'){put('q9_three_words',[0,1,2].map(function(i){return A('q9_'+i)||'';}).join(', '));put('q10_frustration',A('q10'));put('q11_worth_it',A('q11'));put('q8_next_month',A('q8'));}
  if(id==='taste'){function swTxt(x){return x[0]+' ('+x[3]+' · leg: '+x[4]+' · formality '+x[5]+'/5)';}put('q12_would_wear',swYes().map(swTxt).join(' | '));put('q13_never_wear',swNo().map(swTxt).join(' | '));
    put('q14_picture',A('q14'));put('q15_colours_wont',withOther('q15',arr('q15')));put('q16_wont_wear',withOther('q16',arr('q16')));}
  if(id==='fit'){put('q17_fit_pref',withOther('q17',A('q17')));
    put('q18_region',region());SIZE_ORDER.forEach(function(c2){put('q18_size_'+c2,szDesc(c2,A('q18_'+c2))+(c2==='trousers'?', leg '+(A('q18_trousers_leg')==='ns'?'not sure':A('q18_trousers_leg')):''));});
    put('q20_play_down',withOther('q20a',arr('q20a')));put('q20_show_off',withOther('q20b',arr('q20b')));
    put('build_comments',A('qbuild'));}
  if(id==='budget'){var bands=['Under '+c+'50',c+'50-100',c+'100-250',c+'250-500',c+'500+','Don’t buy these'];
    put('q21_spend_per_piece',[0,1,2,3,4,5,6,7].map(function(i){return Q['q21_'+i].title.replace('What do you usually spend on ','').replace('?','')+': '+A('q21_'+i);}).join(' | '));put('q22_total_budget',A('q22'));}
  if(id==='closet'){put('photo_consent',A('photo_consent')?'yes':'no');put('photo_consent_at',A('photo_consent_at'));put('photo_consent_text','I’m happy for you to use my photos for my style guide. They’re only used for my guide and my calls. They stay private and are never shown publicly without my OK. They’re deleted a year after we last work together. Your photos and scan are handled under UK GDPR, and we’ll delete everything on request.');put('keep_buying_not_wearing',A('qkeep'));
    // outfit photos: the file id from the upload (live), 'uploaded' in test mode, '' if skipped
    OUTFITS.forEach(function(x){put(x.k,hasUp(x.k)?((st.up[x.k]&&st.up[x.k].id)||'uploaded'):'');});
    put('outfit_off_note',A('outfit_off_note'));}
  if(id==='colouring'){put('q26_face_photos',Q.q26.slots.length);}
  if(id==='scan'){put('scan_ticks_confirmed','yes');put('sent_to_scan_at',new Date().toISOString());}
  o['section_'+id+'_complete']='yes';return o;}
function postSection(id){st.sent[id]=true;save();
  var ans;try{ans=sectionAnswers(id);}catch(e){ans={error:'could not read answers: '+e.message};if(window.console)console.error('[RZ intake]',e);}
  var payload={contact_id:CID,section:id,sent_at:new Date().toISOString(),answers:ans};
  if(TEST){LOG.push(payload);if(window.console)console.info('[RZ intake] would send:',payload);return;}
  try{api('/api/section',{section:id,answers:ans},true).catch(function(){});}catch(e){}}

/* ---------------- start ---------------- */
function blocked(msg){root.innerHTML='<div class="rz-wrap"><div class="rz-pane"><div class="rz-eyeb">Your style guide</div><h2 class="rz-h2" style="margin-top:14px">'+msg+'</h2></div></div>';}
function start(remote){load(remote);if(st.i>=SCR.length)st.i=0;
  // come back straight to the screen they were on last (photos added in test mode aren't kept on reload).
  RESUME=0;render();}
function signedIn(j){TOKEN=j.token||TOKEN;try{localStorage.setItem(TOKKEY,TOKEN);}catch(e){}
  CID=TOKEN.slice(0,TOKEN.lastIndexOf('.'));KEY=CFG.storePrefix+CID;if(j.scanUrl)CFG.scanUrl=j.scanUrl;start(j.progress||null);}
function gate(msg){
  var sc={k:'home'};
  root.innerHTML=shell('rz-home rz-gate',sc,
    '<div class="rz-eyeb">Your style guide · Intake</div><h1 class="rz-h1">Let’s get started. <span>Enter the email you paid with.</span></h1>'+
    '<p class="rz-sub">If you’ve started before, you’ll pick up exactly where you left off, on any device.</p>'+
    '<div class="rz-body"><input class="rz-fld" type="email" name="email" autocomplete="email" inputmode="email" placeholder="e.g. james@company.com" aria-label="Your email"></div>',
    '<div class="rz-nav rz-a3 no-back"><button class="rz-btn rz-go" data-gate>Continue</button><p class="rz-why'+(msg?' show':'')+'" role="alert">'+(msg||'')+'</p></div>',
    art('intro','Everything that goes into your style guide',true,'Your style guide'));
  var inp=root.querySelector('.rz-gate input'),btn=root.querySelector('[data-gate]'),err=root.querySelector('.rz-gate .rz-why');
  function say(t){err.textContent=t;err.classList.toggle('show',!!t);}
  function go2(){var em=inp.value.trim();if(!em){say('Enter your email to carry on.');inp.focus();return;}
    btn.disabled=true;btn.textContent='Checking…';say('');
    api('/api/login',{email:em}).then(function(j){
      if(j&&j.ok){signedIn(j);return;}
      btn.disabled=false;btn.textContent='Continue';
      say(j&&j.error==='notfound'?'This email isn’t connected to a client account. Use the email you paid with. Can’t find it? Reply to your welcome email.':
        j&&j.error==='email'?'That doesn’t look like an email address.':(j&&j.error&&j.error.length>12?j.error:'Something went wrong. Try again.'));})
    .catch(function(){btn.disabled=false;btn.textContent='Continue';say('Something went wrong. Check your connection and try again.');});}
  btn.onclick=go2;inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go2();}});
  setTimeout(function(){try{inp.focus();}catch(e){}},300);}
if(TEST){start();}
else{try{TOKEN=localStorage.getItem(TOKKEY)||'';}catch(e){}
  if(!TOKEN){gate();}
  else{api('/api/resume').then(function(j){if(j&&j.ok)signedIn(j);else{TOKEN='';try{localStorage.removeItem(TOKKEY);}catch(e){}gate();}})
    .catch(function(){blocked('Something went wrong loading this page. Refresh to try again.');});}}
})();
