
async function loadData(){
 const r=await fetch('data/kalender.json');
 return await r.json();
}
