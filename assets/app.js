/* Eko Meble - podglad koncepcji. Strona + pokaz trybu edycji handlowca (demo, zmiany tylko w tej przegladarce). */
(function(){
'use strict';
var d=document, H=d.documentElement;
function $(s,r){return (r||d).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))}

/* ---------- menu mobilne ---------- */
var mb=$('.menu-btn'), mm=$('.mmenu');
if(mb&&mm){
  mb.addEventListener('click',function(){var o=mm.classList.toggle('open');mb.setAttribute('aria-expanded',o);mb.textContent=o?'Zamknij':'Menu';d.body.style.overflow=o?'hidden':''});
  mm.addEventListener('click',function(e){if(e.target.closest('a')){mm.classList.remove('open');mb.setAttribute('aria-expanded','false');mb.textContent='Menu';d.body.style.overflow=''}});
}

/* ---------- karuzele: strzalki + przeciaganie myszka ---------- */
$$('.karuzela').forEach(function(k){
  var tor=$('.tor',k), prev=$('.prev',k), next=$('.next',k);
  if(!tor)return;
  function krok(){var c=tor.firstElementChild;if(!c)return 300;var g=parseFloat(getComputedStyle(tor).columnGap)||0;return c.getBoundingClientRect().width+g}
  function stan(){if(!prev)return;prev.disabled=tor.scrollLeft<4;next.disabled=tor.scrollLeft+tor.clientWidth>=tor.scrollWidth-4}
  if(prev)prev.addEventListener('click',function(){tor.scrollBy({left:-krok(),behavior:'smooth'})});
  if(next)next.addEventListener('click',function(){tor.scrollBy({left:krok(),behavior:'smooth'})});
  tor.addEventListener('scroll',stan,{passive:true});window.addEventListener('resize',stan);stan();
  var x0=0,s0=0,ciag=false,ruch=0;
  tor.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||H.classList.contains('ed-on')||e.button!==0)return;ciag=true;ruch=0;x0=e.clientX;s0=tor.scrollLeft;tor.classList.add('drag')});
  window.addEventListener('pointermove',function(e){if(!ciag)return;var dx=e.clientX-x0;ruch=Math.max(ruch,Math.abs(dx));tor.scrollLeft=s0-dx;if(ruch>4)e.preventDefault()});
  window.addEventListener('pointerup',function(){if(!ciag)return;ciag=false;tor.classList.remove('drag');var c=krok();tor.scrollTo({left:Math.round(tor.scrollLeft/c)*c,behavior:'smooth'})});
  tor.addEventListener('click',function(e){if(ruch>6){e.preventDefault();e.stopPropagation();ruch=0}},true);
  tor.addEventListener('dragstart',function(e){e.preventDefault()});
});

/* ---------- mapa po przewinieciu ---------- */
var mapa=$('.mapa[data-src]');
if(mapa&&'IntersectionObserver' in window){
  var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){io.disconnect();var f=d.createElement('iframe');f.src=mapa.dataset.src;f.title='Mapa dojazdu: Eko Meble, ul. Patriotów 287, Warszawa';f.loading='lazy';f.referrerPolicy='no-referrer-when-downgrade';mapa.appendChild(f)}},{rootMargin:'300px'});
  io.observe(mapa);
}
/* ---------- formularz pokazowy ---------- */
$$('form.zap').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var i=$('.form-info',f);if(i)i.textContent='To podgląd - na docelowej stronie formularz wyśle wiadomość do salonu.'})});

/* =====================================================================
   TRYB EDYCJI - HANDLOWIEC (DEMO)
   Zasady: tylko zwykly tekst (textContent, nigdy HTML), limity znakow,
   zdjecia skalowane i kadrowane w przegladarce, ramki o stalych proporcjach,
   brak dostepu do czcionek, kolorow, ukladu i kodu.
   ===================================================================== */
var KEY='ekomeble-demo-v1', SES='eko-ed', HKEY='eko-hist';
var state=wczytaj(), hist=[], active=null, pendingFrame=null;
try{hist=JSON.parse(sessionStorage.getItem(HKEY)||'[]')}catch(e){hist=[]}
function pusty(){return {v:1,texts:{},imgs:{},links:{},catalog:{}}}
function wczytaj(){try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.v===1){s.texts=s.texts||{};s.imgs=s.imgs||{};s.links=s.links||{};s.catalog=s.catalog||{};return s}}catch(e){}return pusty()}
function zapisz(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){return false}}
function maZmiany(){return Object.keys(state.texts).length+Object.keys(state.imgs).length+Object.keys(state.links).length+Object.keys(state.catalog).length>0}
function zapiszHist(){try{sessionStorage.setItem(HKEY,JSON.stringify(hist.slice(-25)))}catch(e){try{hist=hist.slice(-3);sessionStorage.setItem(HKEY,JSON.stringify(hist))}catch(e2){}}}

/* oryginaly z HTML */
var oryg={t:{},i:{},l:{}};
$$('[data-edit]').forEach(function(el){if(!el.closest('[data-catalog]'))oryg.t[el.dataset.edit]=el.textContent});
$$('[data-edit-img]').forEach(function(el){if(el.closest('[data-catalog]'))return;var im=$('img',el);if(im)oryg.i[el.dataset.editImg]={src:im.getAttribute('src'),srcset:im.getAttribute('srcset'),sizes:im.getAttribute('sizes')}});
$$('a[data-edit-link]').forEach(function(a){oryg.l[a.dataset.editLink]={t:a.textContent,h:a.getAttribute('href')}});

/* katalog */
var grid=$('[data-catalog]'), CID=grid?grid.dataset.catalog:null, DOMYSLNE=[];
try{var dj=$('#katalog-dane');if(dj)DOMYSLNE=JSON.parse(dj.textContent)}catch(e){}
function kopia(o){return JSON.parse(JSON.stringify(o))}
function katalog(s){return (s.catalog&&s.catalog[CID])||DOMYSLNE}
function katalogDoZmiany(s){if(!s.catalog[CID])s.catalog[CID]=kopia(DOMYSLNE);return s.catalog[CID]}
function el(tag,cls,txt){var e=d.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function kartaHTML(it){
  var a=el('article','karta');a.dataset.id=it.id;
  var r=el('div','ramka');r.dataset.editImg='cat:'+it.id+':img';
  var im=d.createElement('img');im.alt=(it.prod?it.prod+' ':'')+it.name;im.loading='lazy';im.decoding='async';
  if(it.imgData){im.src=it.imgData;im.width=600;im.height=400}
  else if(it.img){im.src='assets/img/'+it.img+'-600.webp';im.srcset='assets/img/'+it.img+'-600.webp 600w, assets/img/'+it.img+'-1170.webp 1170w';im.sizes='(max-width:620px) 92vw, (max-width:1000px) 46vw, 30vw';im.width=600;im.height=282}
  if(it.imgData||it.img)r.appendChild(im);else r.appendChild(el('div','foto-wkrotce','Zdjęcie wkrótce'));
  if(it.badges&&it.badges.length){var z=el('div','znaczki');if(it.badges.indexOf('n')>-1)z.appendChild(el('b','z-n','Nowość'));if(it.badges.indexOf('p')>-1)z.appendChild(el('b','z-p','Promocja'));r.appendChild(z)}
  a.appendChild(r);
  var t=el('div','tresc');
  var p=el('p','prod',it.prod||'');p.dataset.edit='cat:'+it.id+':prod';p.dataset.max='40';p.setAttribute('data-optional','');t.appendChild(p);
  var h=el('h3','',it.name);h.dataset.edit='cat:'+it.id+':name';h.dataset.max='40';t.appendChild(h);
  var o=el('p','opis',it.desc||'');o.dataset.edit='cat:'+it.id+':desc';o.dataset.max='220';o.setAttribute('data-optional','');t.appendChild(o);
  var c=el('p','cena',it.price||'');c.dataset.edit='cat:'+it.id+':price';c.dataset.max='30';c.setAttribute('data-optional','');t.appendChild(c);
  var q=el('a','zapytaj','Zapytaj o tę kolekcję');q.href='index.html#kontakt';t.appendChild(q);
  a.appendChild(t);
  var u=el('button','ed-usun ed-tylko','Usuń');u.type='button';a.appendChild(u);
  return a;
}
function rysujKatalog(){
  if(!grid)return;
  var lista=katalog(state);grid.textContent='';
  if(!lista.length){
    var pu=el('div','pusto');pu.appendChild(el('h2','','W tej kategorii nie ma teraz pozycji'));
    pu.appendChild(el('p','','Zapraszamy do salonu - pokażemy kolekcje na miejscu i doradzimy przy wyborze.'));
    var b=el('a','btn btn-g','Zadzwoń: 883 774 474');b.href='tel:+48883774474';pu.appendChild(b);grid.appendChild(pu);
  }
  lista.forEach(function(it){grid.appendChild(kartaHTML(it))});
  var add=el('button','ed-dodaj ed-tylko');add.type='button';add.appendChild(d.createTextNode('+ Dodaj pozycję'));var sm=el('small','','nazwa, opis, cena (opcjonalnie) i zdjęcie');add.appendChild(sm);grid.appendChild(add);
  var lc=$('.licznik');if(lc)lc.textContent=lista.length?('Kolekcje w katalogu: '+lista.length):'';
  if(H.classList.contains('ed-on'))tabindexy(true);
}

function zastosuj(){
  $$('[data-edit]').forEach(function(e){if(e.closest('[data-catalog]'))return;var k=e.dataset.edit;var v=state.texts[k];e.textContent=(v!=null)?v:(oryg.t[k]!=null?oryg.t[k]:e.textContent)});
  $$('[data-edit-img]').forEach(function(f){if(f.closest('[data-catalog]'))return;var k=f.dataset.editImg,im=$('img',f);if(!im)return;var v=state.imgs[k],o=oryg.i[k];
    if(v){im.removeAttribute('srcset');im.removeAttribute('sizes');im.src=v}
    else if(o){if(o.srcset)im.setAttribute('srcset',o.srcset);if(o.sizes)im.setAttribute('sizes',o.sizes);im.setAttribute('src',o.src)}});
  $$('a[data-edit-link]').forEach(function(a){var k=a.dataset.editLink,v=state.links[k]||oryg.l[k];if(v){a.textContent=v.t;a.setAttribute('href',v.h)}});
  if(grid&&(state.catalog[CID]||grid.dataset.rys)){grid.dataset.rys='1';rysujKatalog()}
  odswiezPasek();
}

/* jedna zmiana = jeden krok historii; przy braku miejsca cofamy */
function zmien(fn){
  var przed=JSON.stringify(state);
  fn(state);
  if(!zapisz()){state=JSON.parse(przed);zastosuj();toast('Za mało miejsca w pamięci przeglądarki na tę zmianę (to ograniczenie pokazu - na prawdziwej stronie zdjęcia trafiają na serwer). Usuń albo cofnij któreś zdjęcie.');return false}
  hist.push(przed);zapiszHist();zastosuj();return true;
}
function ustawTekst(s,k,v){if(k.indexOf('cat:')===0){var p=k.split(':'),it=katalogDoZmiany(s).filter(function(x){return x.id===p[1]})[0];if(it)it[p[2]]=v}else s.texts[k]=v}
function ustawZdjecie(s,k,v){if(k.indexOf('cat:')===0){var p=k.split(':'),it=katalogDoZmiany(s).filter(function(x){return x.id===p[1]})[0];if(it)it.imgData=v}else s.imgs[k]=v}

/* ---------- edycja tekstu ---------- */
var licznik=null;
function pokazLicznik(e){if(!licznik){licznik=el('div','ed-licznik ed-ui');d.body.appendChild(licznik)}odswiezLicznik(e)}
function odswiezLicznik(e){if(!licznik||!e)return;var m=+e.dataset.max||200,n=e.textContent.length;licznik.textContent=n+' / '+m+' znaków';licznik.classList.toggle('pelny',n>=m);var r=e.getBoundingClientRect();licznik.style.left=Math.max(8,Math.min(r.left,innerWidth-150))+'px';licznik.style.top=Math.max(8,r.top-38)+'px'}
function ukryjLicznik(){if(licznik){licznik.remove();licznik=null}}
function mrugnij(){if(licznik){licznik.classList.add('pelny');licznik.textContent='Limit znaków: '+(active?active.dataset.max:'')}}
function kursorNaKoniec(e){var r=d.createRange();r.selectNodeContents(e);r.collapse(false);var s=getSelection();s.removeAllRanges();s.addRange(r)}
function zacznij(e,ev){
  if(active===e||!d.body.contains(e))return; if(active)zakoncz(active);
  active=e;e.dataset.przed=e.textContent;e.classList.add('ed-aktywny');
  try{e.contentEditable='plaintext-only'}catch(x){}
  if(e.contentEditable!=='plaintext-only')e.contentEditable='true';
  e.setAttribute('spellcheck','true');e.focus({preventScroll:true});
  var ok=false;
  if(ev&&d.caretRangeFromPoint){var r=d.caretRangeFromPoint(ev.clientX,ev.clientY);if(r&&e.contains(r.startContainer)){var s=getSelection();s.removeAllRanges();s.addRange(r);ok=true}}
  if(!ok)kursorNaKoniec(e);
  pokazLicznik(e);
}
function zakoncz(e){
  e.removeAttribute('contenteditable');e.classList.remove('ed-aktywny');ukryjLicznik();
  var m=+e.dataset.max||200,t=e.textContent.replace(/[\u0000-\u001F\u007F​-‍﻿]/g,' ').replace(/\s+/g,' ').trim();
  if(t.length>m)t=t.slice(0,m);
  var przed=e.dataset.przed;active=null;
  if(!t&&!e.hasAttribute('data-optional')){e.textContent=przed;toast('To pole nie może być puste - przywróciłem poprzedni tekst.');return}
  e.textContent=t;
  if(t!==przed)zmien(function(s){ustawTekst(s,e.dataset.edit,t)});
}
d.addEventListener('beforeinput',function(e){
  if(!active||!active.contains(e.target))return;
  var t=e.inputType||'';
  if(t==='insertParagraph'||t==='insertLineBreak'){e.preventDefault();active.blur();return}
  if(t.indexOf('format')===0||t==='insertFromDrop'||t==='insertLink'){e.preventDefault();return}
  if(t.indexOf('insert')===0&&e.data){var m=+active.dataset.max||200,sel=getSelection(),zazn=sel.rangeCount?sel.toString().length:0;if(active.textContent.length-zazn+e.data.length>m){e.preventDefault();mrugnij()}}
});
d.addEventListener('input',function(e){
  if(!active||!active.contains(e.target))return;
  if(active.children.length){var tx=active.textContent;active.textContent=tx;kursorNaKoniec(active)}
  var m=+active.dataset.max||200;if(active.textContent.length>m){active.textContent=active.textContent.slice(0,m);kursorNaKoniec(active);mrugnij();return}
  odswiezLicznik(active);
});
d.addEventListener('paste',function(e){
  if(!active||!active.contains(e.target))return;
  e.preventDefault();
  var t=((e.clipboardData||window.clipboardData).getData('text/plain')||'').replace(/[\u0000-\u001F\u007F​-‍﻿]+/g,' ').replace(/\s+/g,' ');
  var s=getSelection();if(!s.rangeCount)return;var r=s.getRangeAt(0);
  var m=+active.dataset.max||200,miejsce=m-(active.textContent.length-r.toString().length);
  if(miejsce<=0){mrugnij();return}
  if(t.length>miejsce){t=t.slice(0,miejsce);toast('Wklejony tekst był za długi - skróciłem go do limitu pola ('+m+' znaków).')}
  r.deleteContents();var n=d.createTextNode(t);r.insertNode(n);r.setStartAfter(n);r.collapse(true);s.removeAllRanges();s.addRange(r);active.normalize();odswiezLicznik(active);
});
d.addEventListener('keydown',function(e){
  if(!active)return;
  if(e.key==='Escape'){e.stopImmediatePropagation();active.textContent=active.dataset.przed;active.blur();return}
  if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();active.blur();return}
  if((e.ctrlKey||e.metaKey)&&/^[biuk]$/i.test(e.key)){e.preventDefault()}
});
d.addEventListener('focusout',function(e){if(active&&e.target===active)zakoncz(active)});
window.addEventListener('scroll',function(){if(active)odswiezLicznik(active)},{passive:true});

/* ---------- zdjecia: wybor pliku, kadrowanie i zmniejszenie ---------- */
var plik=el('input','ed-ui');plik.type='file';plik.accept='image/jpeg,image/png,image/webp,image/gif,image/avif';plik.hidden=true;d.body.appendChild(plik);
plik.addEventListener('change',function(){var f=plik.files&&plik.files[0],fr=pendingFrame;plik.value='';pendingFrame=null;if(f&&fr)zdjecieDoRamki(f,fr)});
function przygotujZdjecie(f){
  return new Promise(function(ok,bl){
    if(!f||!/^image\/(jpeg|png|webp|gif|avif|bmp)$/.test(f.type)){bl('Wybierz plik zdjęcia (JPG, PNG albo WebP).');return}
    if(f.size>40*1024*1024){bl('Ten plik jest za duży (ponad 40 MB). Wybierz mniejsze zdjęcie.');return}
    var u=URL.createObjectURL(f),im=new Image();
    im.onload=function(){
      var w=im.naturalWidth,h=im.naturalHeight;if(!w||!h){URL.revokeObjectURL(u);bl('Nie udało się odczytać zdjęcia.');return}
      /* przyciecie skrajnych proporcji (panorama, bardzo wysokie) do 2,4:1 lub 1:2,2 */
      var sx=0,sy=0,sw=w,sh=h,MX=2.4,MN=1/2.2;
      if(w/h>MX){sw=Math.round(h*MX);sx=Math.round((w-sw)/2)}else if(w/h<MN){sh=Math.round(w/MN);sy=Math.round((h-sh)/2)}
      var sk=Math.min(1,1600/Math.max(sw,sh)),cw=Math.max(1,Math.round(sw*sk)),ch=Math.max(1,Math.round(sh*sk));
      var c=d.createElement('canvas');c.width=cw;c.height=ch;var x=c.getContext('2d');x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,cw,ch);x.drawImage(im,sx,sy,sw,sh,0,0,cw,ch);
      URL.revokeObjectURL(u);
      var q=.82,dane=c.toDataURL('image/webp',q);if(dane.indexOf('data:image/webp')!==0)dane=c.toDataURL('image/jpeg',q);
      while(dane.length>700000&&q>.5){q-=.1;dane=c.toDataURL(dane.indexOf('data:image/webp')===0?'image/webp':'image/jpeg',q)}
      ok(dane);
    };
    im.onerror=function(){URL.revokeObjectURL(u);bl('Ten plik nie jest zdjęciem, którego przeglądarka umie odczytać.')};
    im.src=u;
  });
}
function zdjecieDoRamki(f,fr){
  przygotujZdjecie(f).then(function(dane){if(zmien(function(s){ustawZdjecie(s,fr.dataset.editImg,dane)}))toast('Zdjęcie podmienione i dopasowane do ramki.')},function(m){toast(m)});
}

/* ---------- okna dialogowe ---------- */
function dialog(html,init){
  var dl=el('dialog','ed-dlg ed-ui');dl.innerHTML=html;d.body.appendChild(dl);
  dl.addEventListener('close',function(){dl.remove()});
  dl.addEventListener('click',function(e){if(e.target===dl)dl.close()});
  $$('[data-anuluj]',dl).forEach(function(b){b.addEventListener('click',function(){dl.close()})});
  if(init)init(dl);
  if(dl.showModal)dl.showModal();else dl.setAttribute('open','');
  return dl;
}
function potwierdz(tytul,tresc,przycisk,fn){
  dialog('<form method="dialog"><h2></h2><p></p><div class="ed-row"><button type="button" data-anuluj>Anuluj</button><button class="ed-ok ed-red" value="ok"></button></div></form>',function(dl){
    $('h2',dl).textContent=tytul;$('p',dl).textContent=tresc;$('.ed-ok',dl).textContent=przycisk;
    $('form',dl).addEventListener('submit',function(){setTimeout(fn,0)});
  });
}
function czysc(v,m){return String(v||'').replace(/[\u0000-\u001F\u007F​-‍﻿]+/g,' ').replace(/\s+/g,' ').trim().slice(0,m)}

/* logowanie */
function logowanie(){
  if(sessionStorage.getItem(SES)==='1'){wlacz(true);return}
  dialog('<form><h2>Wejście dla handlowca</h2>'+
  '<div class="ed-role"><span><b>Klient</b> - widzi zwykłą stronę.</span><span><b>Handlowiec</b> - zmienia teksty, zdjęcia i pozycje katalogu. Nie ma dostępu do wyglądu, czcionek, układu ani kodu.</span><span><b>Administrator</b> - pełne prawa (my, Wylinka).</span></div>'+
  '<p class="ed-demo">To pokaz. Dane demonstracyjne: login <b>demo</b>, hasło <b>demo</b>. Zmiany zapisują się tylko w tej przeglądarce i widzi je wyłącznie osoba, która je wprowadziła.</p>'+
  '<label>Login<input type="text" name="l" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="40" required></label>'+
  '<label>Hasło<input type="password" name="h" autocomplete="off" maxlength="40" required></label>'+
  '<div class="ed-err" aria-live="polite"></div>'+
  '<div class="ed-row"><button type="button" data-anuluj>Anuluj</button><button class="ed-ok">Wejdź</button></div></form>',function(dl){
    var f=$('form',dl);
    f.addEventListener('submit',function(e){e.preventDefault();
      if(f.l.value.trim().toLowerCase()==='demo'&&f.h.value==='demo'){sessionStorage.setItem(SES,'1');dl.close();wlacz(true)}
      else $('.ed-err',dl).textContent='Nieprawidłowy login lub hasło. W pokazie: demo / demo.'});
    setTimeout(function(){f.l.focus()},30);
  });
}

/* link */
var DOZWOLONE=/^(https?:\/\/[^\s<>"'`]+|tel:\+?[0-9]{6,15}|mailto:[^\s@<>"'`]+@[^\s@<>"'`]+\.[a-z]{2,}|[a-z0-9-]+\.html(#[a-z0-9-]+)?|#[a-z0-9-]+)$/i;
function edytujLink(a){
  dialog('<form><h2>Zmień link</h2><p>Wpisz tekst i adres. Wygląd przycisku zostaje bez zmian.</p>'+
  '<label>Tekst <span class="ed-cnt">(do 40 znaków)</span><input type="text" name="t" maxlength="40" required></label>'+
  '<label>Adres<input type="text" name="h" maxlength="300" required spellcheck="false" autocapitalize="none" placeholder="https://..."></label>'+
  '<div class="ed-szybkie"><button type="button" data-h="salon.html">Katalog: Salon</button><button type="button" data-h="index.html#kontakt">Kontakt</button><button type="button" data-h="index.html#salony">Salony</button><button type="button" data-h="tel:+48883774474">Telefon infolinii</button></div>'+
  '<div class="ed-err" aria-live="polite"></div><div class="ed-row"><button type="button" data-anuluj>Anuluj</button><button class="ed-ok">Zapisz</button></div></form>',function(dl){
    var f=$('form',dl);f.t.value=a.textContent.trim();f.h.value=a.getAttribute('href');
    $$('[data-h]',dl).forEach(function(b){b.addEventListener('click',function(){f.h.value=b.dataset.h})});
    f.addEventListener('submit',function(e){e.preventDefault();
      var t=czysc(f.t.value,40),h=f.h.value.trim().replace(/^tel:([+0-9 ()-]+)$/i,function(m,n){return 'tel:'+n.replace(/[^0-9+]/g,'')});
      if(!t){$('.ed-err',dl).textContent='Tekst nie może być pusty.';return}
      if(!DOZWOLONE.test(h)){$('.ed-err',dl).textContent='Ten adres nie wygląda poprawnie. Użyj adresu zaczynającego się od https:// albo wybierz podstronę powyżej.';return}
      dl.close();var k=a.dataset.editLink;zmien(function(s){s.links[k]={t:t,h:h}});
    });
  });
}

/* nowa pozycja katalogu */
function dodajPozycje(){
  dialog('<form><h2>Dodaj pozycję</h2><p>Nowa karta pojawi się na końcu katalogu w tym samym układzie co pozostałe.</p>'+
  '<label>Nazwa <span class="ed-cnt">(wymagana, do 40 znaków)</span><input type="text" name="n" maxlength="40" required></label>'+
  '<label>Producent <span class="ed-cnt">(do 40 znaków)</span><input type="text" name="p" maxlength="40"></label>'+
  '<label>Opis <span class="ed-cnt">(do 220 znaków)</span><textarea name="o" maxlength="220"></textarea></label>'+
  '<label>Cena <span class="ed-cnt">(opcjonalnie, np. od 2 499 zł)</span><input type="text" name="c" maxlength="30"></label>'+
  '<div class="ed-check"><label><input type="checkbox" name="zn"> Nowość</label><label><input type="checkbox" name="zp"> Promocja</label></div>'+
  '<label>Zdjęcie <span class="ed-cnt">(opcjonalnie, dopasuje się samo)</span><input type="file" name="f" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"></label>'+
  '<div class="ed-err" aria-live="polite"></div><div class="ed-row"><button type="button" data-anuluj>Anuluj</button><button class="ed-ok">Dodaj</button></div></form>',function(dl){
    var f=$('form',dl);setTimeout(function(){f.n.focus()},30);
    f.addEventListener('submit',function(e){e.preventDefault();
      var it={id:'n'+Date.now().toString(36),name:czysc(f.n.value,40),prod:czysc(f.p.value,40),desc:czysc(f.o.value,220),price:czysc(f.c.value,30),badges:[]};
      if(f.zn.checked)it.badges.push('n');if(f.zp.checked)it.badges.push('p');
      if(!it.name){$('.ed-err',dl).textContent='Podaj nazwę.';return}
      var plk=f.f.files&&f.f.files[0];
      var dalej=function(dane){if(dane)it.imgData=dane;dl.close();if(zmien(function(s){katalogDoZmiany(s).push(it)})){var k=grid.querySelector('[data-id="'+it.id+'"]');if(k)k.scrollIntoView({behavior:'smooth',block:'center'});toast('Dodano pozycję „'+it.name+'”.')}};
      if(plk)przygotujZdjecie(plk).then(dalej,function(m){$('.ed-err',dl).textContent=m});else dalej(null);
    });
  });
}
function usunPozycje(k){
  var id=k.dataset.id,it=katalog(state).filter(function(x){return x.id===id})[0];if(!it)return;
  potwierdz('Usunąć pozycję?','Pozycja „'+it.name+'” zniknie z katalogu. Można to cofnąć przyciskiem „Cofnij”.','Usuń',function(){
    zmien(function(s){var a=katalogDoZmiany(s);s.catalog[CID]=a.filter(function(x){return x.id!==id})});toast('Usunięto pozycję.');
  });
}

/* ---------- pasek trybu edycji ---------- */
var pasek=null, zmianyInfo=null;
function tabindexy(on){$$('[data-edit],[data-edit-img]').forEach(function(e){if(on){e.tabIndex=0;e.setAttribute('role',e.hasAttribute('data-edit-img')?'button':'textbox');e.setAttribute('aria-label',e.hasAttribute('data-edit-img')?'Zmień zdjęcie':'Edytuj tekst')}else{e.removeAttribute('tabindex');e.removeAttribute('role');e.removeAttribute('aria-label')}})}
function wlacz(on){
  if(active)active.blur();
  H.classList.toggle('ed-on',on);tabindexy(on);
  if(mm&&mm.classList.contains('open'))mb.click();
  if(on&&!pasek){
    pasek=el('div','ed-bar ed-ui');pasek.setAttribute('role','region');pasek.setAttribute('aria-label','Tryb edycji');
    pasek.innerHTML='<div class="wrap"><div class="ed-info"><b>Tryb handlowca (demo)</b>Kliknij tekst z ołówkiem albo zdjęcie. Zmiany widzisz tylko Ty, w tej przeglądarce.</div><button type="button" class="ed-cof">Cofnij</button><button type="button" class="ed-org">Przywróć oryginał</button><button type="button" class="ed-zak">Zakończ edycję</button></div>';
    d.body.appendChild(pasek);
    $('.ed-cof',pasek).addEventListener('click',cofnij);
    $('.ed-org',pasek).addEventListener('click',function(){potwierdz('Przywrócić oryginał?','Wszystkie Twoje zmiany w pokazie zostaną usunięte i strona wróci do stanu wyjściowego.','Przywróć oryginał',przywroc)});
    $('.ed-zak',pasek).addEventListener('click',function(){sessionStorage.removeItem(SES);wlacz(false);toast(maZmiany()?'Koniec edycji. Twoje zmiany zostają widoczne w tej przeglądarce.':'Koniec edycji.')});
  }
  if(!on&&pasek){pasek.remove();pasek=null}
  odswiezPasek();
}
function odswiezPasek(){
  if(pasek){$('.ed-cof',pasek).disabled=!hist.length;$('.ed-org',pasek).disabled=!maZmiany()}
  var pokaz=!H.classList.contains('ed-on')&&maZmiany();
  if(pokaz&&!zmianyInfo){
    zmianyInfo=el('div','ed-zmiany ed-ui');zmianyInfo.innerHTML='<div>Widzisz swoje zmiany z pokazu edycji (tylko w tej przeglądarce).</div><button type="button" class="z-org">Przywróć oryginał</button><button type="button" class="z-ed">Wróć do edycji</button>';
    d.body.appendChild(zmianyInfo);
    $('.z-org',zmianyInfo).addEventListener('click',function(){potwierdz('Przywrócić oryginał?','Wszystkie Twoje zmiany w pokazie zostaną usunięte.','Przywróć oryginał',przywroc)});
    $('.z-ed',zmianyInfo).addEventListener('click',logowanie);
  }
  if(!pokaz&&zmianyInfo){zmianyInfo.remove();zmianyInfo=null}
}
function cofnij(){if(active)active.blur();if(!hist.length)return;state=JSON.parse(hist.pop());zapiszHist();zapisz();zastosuj();toast('Cofnięto ostatnią zmianę.')}
function przywroc(){try{localStorage.removeItem(KEY)}catch(e){}hist=[];zapiszHist();state=pusty();zastosuj();toast('Przywrócono oryginał strony.')}

var tt=null;
function toast(m){var t=$('.ed-toast');if(!t){t=el('div','ed-toast ed-ui');t.setAttribute('role','status');d.body.appendChild(t)}t.textContent=m;clearTimeout(tt);tt=setTimeout(function(){t.remove()},4200)}

/* ---------- klikniecia w trybie edycji ---------- */
d.addEventListener('click',function(e){
  var wej=e.target.closest('.ed-wejscie');
  if(wej){e.preventDefault();if(H.classList.contains('ed-on'))return;logowanie();return}
  if(!H.classList.contains('ed-on'))return;
  if(e.target.closest('.ed-ui'))return;
  var a=e.target.closest('a');
  var tx=e.target.closest('[data-edit]'),im=e.target.closest('[data-edit-img]'),ln=e.target.closest('a[data-edit-link]'),us=e.target.closest('.ed-usun'),ad=e.target.closest('.ed-dodaj');
  if(a)e.preventDefault();
  if(us){usunPozycje(us.closest('.karta'));return}
  if(ad){dodajPozycje();return}
  if(tx){zacznij(tx,e);return}
  if(ln){edytujLink(ln);return}
  if(im){pendingFrame=im;plik.click();return}
  if(a&&!e.target.closest('.mmenu,.nav,.logo,.okruszki')){toast('W trybie edycji linki nie przenoszą na inne strony. Zakończ edycję, aby nawigować.')}
  else if(a){location.href=a.href}
},true);
d.addEventListener('keydown',function(e){
  if(!H.classList.contains('ed-on')||active)return;
  if(e.key!=='Enter'&&e.key!==' ')return;
  var t=e.target;if(!t.matches||!d.body.contains(t))return;
  if(t.matches('[data-edit]')){e.preventDefault();zacznij(t,null)}
  else if(t.matches('[data-edit-img]')){e.preventDefault();pendingFrame=t;plik.click()}
});
/* przeciagniecie pliku na ramke = podmiana zdjecia; gdzie indziej upuszczanie zablokowane */
d.addEventListener('dragover',function(e){if(H.classList.contains('ed-on'))e.preventDefault()});
d.addEventListener('drop',function(e){
  if(!H.classList.contains('ed-on'))return;e.preventDefault();
  var fr=e.target.closest&&e.target.closest('[data-edit-img]'),f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
  if(fr&&f)zdjecieDoRamki(f,fr);else toast('Upuszczanie jest wyłączone. Kliknij tekst albo zdjęcie, aby je zmienić.');
});

/* start */
zastosuj();
if(sessionStorage.getItem(SES)==='1')wlacz(true);
else if(location.hash==='#edycja')setTimeout(logowanie,300);
})();
