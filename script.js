let emails=[], validEmails=[], index=0, sentCount=0, duplicatesCount=0, paused=false;

const tabs=document.querySelectorAll(".tab");
const tabContents=document.querySelectorAll(".tab-content");
const progressBar=document.getElementById("progress");

tabs.forEach(tab=>tab.addEventListener("click",()=>{
  tabs.forEach(t=>t.classList.remove("active"));
  tab.classList.add("active");
  tabContents.forEach(c=>c.classList.remove("active"));
  document.getElementById(tab.dataset.tab).classList.add("active");
}));

const recipientBody=document.getElementById("recipientBody");
const total=document.getElementById("total"), validEl=document.getElementById("valid"),
invalid=document.getElementById("invalid"), duplicatesEl=document.getElementById("duplicates"),
sentEl=document.getElementById("sent"), remainingEl=document.getElementById("remaining");

document.getElementById("emails").addEventListener("input",parseEmails);
document.getElementById("fileInput").addEventListener("change",e=>{
  let reader=new FileReader();
  reader.onload=()=>{ document.getElementById("emails").value=reader.result; parseEmails(); };
  reader.readAsText(e.target.files[0]);
});

function parseEmails(){
  emails=document.getElementById("emails").value.split(/\n|,|;/).map(e=>e.trim()).filter(Boolean);
  let unique=[...new Set(emails)];
  duplicatesCount=emails.length-unique.length;
  emails=unique;
  validEmails=emails.filter(e=>/\S+@\S+\.\S+/.test(e));
  total.innerText=emails.length;
  validEl.innerText=validEmails.length;
  invalid.innerText=emails.length-validEmails.length;
  duplicatesEl.innerText=duplicatesCount;
  sentEl.innerText=sentCount;
  remainingEl.innerText=validEmails.length-sentCount;
  renderRecipientTable();
  updateProgress();
}

function renderRecipientTable(){
  recipientBody.innerHTML="";
  emails.forEach(e=>{
    let tr=document.createElement("tr");
    let tdEmail=document.createElement("td"); tdEmail.textContent=e;
    let tdStatus=document.createElement("td");
    if(!/\S+@\S+\.\S+/.test(e)){ tdStatus.textContent="Invalid"; tr.classList.add("invalid"); }
    else tdStatus.textContent="Valid"; tr.classList.add("valid");
    let tdSent=document.createElement("td"); tdSent.textContent=(sentCount>emails.indexOf(e))?"Yes":"No";
    tr.appendChild(tdEmail); tr.appendChild(tdStatus); tr.appendChild(tdSent);
    recipientBody.appendChild(tr);
  });
}

function saveTemplate(){
  let templates=JSON.parse(localStorage.templates||"[]");
  templates.push({subject:subject.value,message:message.value});
  localStorage.templates=JSON.stringify(templates);
  loadTemplateList();
}

function loadTemplateList(){
  let templates=JSON.parse(localStorage.templates||"[]");
  templateList.innerHTML="";
  templates.forEach((t,i)=>{ templateList.innerHTML+=`<option value=${i}>Template ${i+1}</option>`; });
}

function loadTemplate(){
  let templates=JSON.parse(localStorage.templates||"[]");
  let t=templates[templateList.value];
  subject.value=t.subject;
  message.value=t.message;
}

function updateProgress(){
  let percent=(sentCount/validEmails.length)*100||0;
  progressBar.style.width=percent+"%";
}

function celebrate(){
  let duration = 3 * 1000;
  let end = Date.now() + duration;
  (function frame(){
    confetti({particleCount:5,angle:60,spread:55,origin:{x:0}});
    confetti({particleCount:5,angle:120,spread:55,origin:{x:1}});
    if(Date.now()<end){requestAnimationFrame(frame);}
  })();
}

function startCampaign(){ index=0; paused=false; sendBatch(); }
function pauseCampaign(){ paused=true; }
function resumeCampaign(){ paused=false; sendBatch(); }

function sendBatch(){
  if(paused) return;
  if(index>=validEmails.length){updateProgress();celebrate();return;}

  let batchSize=Number(document.getElementById("batchSize").value)||3;
  let delay=Number(document.getElementById("delay").value)*1000;
  let senderEmail=document.getElementById("senderEmail").value;

  let batch=validEmails.slice(index,index+batchSize);
  batch.forEach(email=>{
    let subjectText=subject.value;
    let bodyText=message.value.replace("{email}",email);
    let url=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;
    if(senderEmail) url+='&from='+encodeURIComponent(senderEmail);
    window.open(url,"_blank");
    index++;
    sentCount++;
  });

  sentEl.innerText=sentCount;
  remainingEl.innerText=validEmails.length-sentCount;
  renderRecipientTable();
  updateProgress();

  setTimeout(sendBatch,delay);
}

themeToggle.onclick=()=>{ document.body.classList.toggle("dark"); };
loadTemplateList();
