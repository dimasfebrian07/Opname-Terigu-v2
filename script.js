const KEY="gwip_opname_v2";
const weights={"Terigu Soft":25,"Terigu Medium":25,"Tapioka":50};
const defaults={"Terigu Soft":["B7","LM","Mila"],"Terigu Medium":["W3"],"Tapioka":["NBR","Panca Agro"]};
let brands=JSON.parse(localStorage.getItem(KEY+"_brands")||"null")||defaults;
let records=JSON.parse(localStorage.getItem(KEY+"_records")||"[]");
let editingId=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function save(){localStorage.setItem(KEY+"_brands",JSON.stringify(brands));localStorage.setItem(KEY+"_records",JSON.stringify(records))}
function isoNow(){let d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function fmtKg(n){return Number(n).toLocaleString("id-ID",{maximumFractionDigits:2})+" kg"}
function populateCategories(){$("category").innerHTML=Object.keys(weights).map(x=>`<option>${x}</option>`).join("");populateBrands()}
function populateBrands(){let list=brands[$("category").value]||[];$("brand").innerHTML=list.map(x=>`<option>${esc(x)}</option>`).join("");updatePreview()}
function updatePreview(){let w=weights[$("category").value],n=parseFloat($("bags").value)||0;$("perBag").textContent=w+" kg";$("weightInfo").textContent=`1 zak = ${w} kg`;$("bagPreview").textContent=n.toLocaleString("id-ID",{maximumFractionDigits:2});$("kgPreview").textContent=fmtKg(n*w)}
function submit(){
 let n=parseFloat($("bags").value),cat=$("category").value,br=$("brand").value;
 if(!n||n<=0)return alert("Masukkan jumlah zak terlebih dahulu.");
 if(!br)return alert("Pilih atau tambahkan merk.");
 if(editingId!==null){
   let r=records.find(x=>x.id===editingId);
   Object.assign(r,{shift:$("shift").value,category:cat,brand:br,bags:n,kg:n*weights[cat]});
   editingId=null;
 }else records.unshift({id:Date.now(),date:isoNow(),time:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),shift:$("shift").value,category:cat,brand:br,bags:n,kg:n*weights[cat]});
 save();$("bags").value="";$("submitBtn").textContent="SUBMIT & SIMPAN";updatePreview();render();setTimeout(()=>$("submitBtn").textContent="SUBMIT & SIMPAN",900)
}
function editRecord(id){let r=records.find(x=>x.id===id);if(!r)return;editingId=id;$("shift").value=r.shift;$("category").value=r.category;populateBrands();$("brand").value=r.brand;$("bags").value=r.bags;updatePreview();$("submitBtn").textContent="UPDATE & SIMPAN";scrollTo({top:0,behavior:"smooth"})}
function deleteRecord(id){let r=records.find(x=>x.id===id);if(r&&confirm(`Hapus ${r.category} - ${r.brand} (${fmtKg(r.kg)})?`)){records=records.filter(x=>x.id!==id);save();render()}}
function filtered(){let fd=$("filterDate").value,fs=$("filterShift").value,fc=$("filterCategory").value,q=$("search").value.toLowerCase();return records.filter(r=>(!fd||r.date===fd)&&(!fs||r.shift===fs)&&(!fc||r.category===fc)&&(!q||r.brand.toLowerCase().includes(q)||r.category.toLowerCase().includes(q)))}
function render(){
 let rows=filtered();
 $("historyBody").innerHTML=rows.map(r=>`<tr><td>${r.date.split("-").reverse().join("-")} ${r.time}</td><td>Shift ${r.shift}</td><td>${esc(r.category)}</td><td><b>${esc(r.brand)}</b></td><td>${r.bags.toLocaleString("id-ID",{maximumFractionDigits:2})}</td><td><b>${fmtKg(r.kg)}</b></td><td class="actions"><button class="edit" onclick="editRecord(${r.id})">Edit</button><button class="delete" onclick="deleteRecord(${r.id})">Hapus</button></td></tr>`).join("");
 $("empty").style.display=rows.length?"none":"block";
 let day=records.filter(r=>r.date===isoNow()),sum=c=>day.filter(r=>r.category===c).reduce((a,r)=>a+r.kg,0);
 $("softTotal").textContent=fmtKg(sum("Terigu Soft"));$("mediumTotal").textContent=fmtKg(sum("Terigu Medium"));$("tapiokaTotal").textContent=fmtKg(sum("Tapioka"));
 $("brandCount").textContent=new Set(day.map(r=>r.category+"|"+r.brand)).size;
 renderWA(day);
}
function grouped(data){
 let out={"Terigu Soft":{},"Terigu Medium":{},"Tapioka":{}};
 data.forEach(r=>{out[r.category][r.brand]=(out[r.category][r.brand]||0)+r.kg});
 return out;
}
function renderWA(data){
 if(!data.length){
   $("waPreview").textContent="Belum ada data opname.";
   return;
 }

 const activeDate=$("filterDate").value || isoNow();
 const activeShift=$("filterShift").value || $("shift").value;
 const d=new Date(activeDate+"T00:00:00");
 const dateText=d.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 const g=grouped(data);

 const lines=[
   "*Stock terigu & tapioka Gwip stage 1*",
   `*Shift ${activeShift}*`,
   `*${dateText}*`,
   "",
   "*Stock Terigu soft*"
 ];

 Object.entries(g["Terigu Soft"]).forEach(([brand,kg])=>{
   lines.push(`- ${brand} : ${formatWAKg(kg)}`);
 });

 lines.push("", "*Stock terigu medium*");
 Object.entries(g["Terigu Medium"]).forEach(([brand,kg])=>{
   lines.push(`- ${brand} : ${formatWAKg(kg)}`);
 });

 lines.push("", "*Stock Tapioka :*");
 Object.entries(g["Tapioka"]).forEach(([brand,kg])=>{
   lines.push(`- ${brand} : ${formatWAKg(kg)}`);
 });

 $("waPreview").textContent=lines.join("\n");
}

function formatWAKg(n){
 return Number(n).toLocaleString("id-ID",{maximumFractionDigits:2})+" kg";
}

$("addBrandBtn").onclick=()=>{$("newBrand").value="";$("brandModal").classList.remove("hidden");$("newBrand").focus()};
$("closeModal").onclick=()=>$("brandModal").classList.add("hidden");
$("saveBrand").onclick=()=>{let n=$("newBrand").value.trim(),c=$("category").value;if(!n)return alert("Isi nama merk.");if(brands[c].some(x=>x.toLowerCase()===n.toLowerCase()))return alert("Merk sudah ada.");brands[c].push(n);save();populateBrands();$("brand").value=n;$("brandModal").classList.add("hidden")};
$("submitBtn").onclick=submit;$("category").onchange=populateBrands;$("bags").oninput=updatePreview;
["filterDate","filterShift","filterCategory","search"].forEach(id=>$(id).addEventListener("input",render));
$("clearBtn").onclick=()=>{
  const activeDate=$("filterDate").value||isoNow();
  const activeShift=$("filterShift").value||$("shift").value;
  const count=records.filter(r=>r.date===activeDate&&r.shift===activeShift).length;
  if(!count)return alert(`Tidak ada data opname untuk ${activeDate.split("-").reverse().join("-")} Shift ${activeShift}.`);
  const prettyDate=activeDate.split("-").reverse().join("-");
  if(confirm(`Reset seluruh data opname pada tanggal ${prettyDate} dan Shift ${activeShift}?\\n\\n${count} data akan dihapus.`)){
    records=records.filter(r=>!(r.date===activeDate&&r.shift===activeShift));
    if(editingId!==null && !records.some(r=>r.id===editingId)) editingId=null;
    save();render();
    alert(`Data opname tanggal ${prettyDate} Shift ${activeShift} berhasil di-reset.`);
  }
};
$("copyBtn").onclick=async()=>{let t=$("waPreview").textContent;if(t==="Belum ada data opname.")return alert(t);await navigator.clipboard.writeText(t);$("copyBtn").textContent="✓ Tersalin";setTimeout(()=>$("copyBtn").textContent="Salin Format",1000)};
$("waBtn").onclick=()=>{let t=$("waPreview").textContent;if(t==="Belum ada data opname.")return alert(t);window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank")};
$("today").textContent=new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
populateCategories();render();