/* Copenhagen Preview: henter indhold fra content/*.json (redigeres i Pages CMS) og bygger siderne. */
(function () {
  var FILER = ["indstillinger", "billetter", "nyheder", "sessions", "program", "sponsorer", "om", "billetinfo"];

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  /* Billedstier fra Pages CMS starter med "/". Gør dem relative, så de virker overalt. */
  var src = function (p) { return String(p || "").replace(/^\//, ""); };
  var kr = function (n) { return Number(n).toLocaleString("da-DK").replace(/,/g, ".") + " kr."; };
  var initials = function (name) {
    var w = String(name || "").split(/\s+/).filter(Boolean);
    return w.length > 1 ? w[0][0] + w[w.length - 1][0] : (w[0] || "").slice(0, 2);
  };
  var paras = function (arr) { return (arr || []).filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""); };
  var set = function (id, html) { var el = $(id); if (el) el.innerHTML = html; };
  var list = function (x) { return Array.isArray(x) ? x : []; };

  var hent = function (navn) {
    return fetch("content/" + navn + ".json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(navn + ": " + r.status); return r.json(); })
      .catch(function (e) { console.error("Kunne ikke hente content/" + navn + ".json", e); return null; });
  };

  Promise.all(FILER.map(hent)).then(function (res) {
    var C = {};
    FILER.forEach(function (n, i) { C[n] = res[i]; });
    render(C);
  });

  function render(C) {
    var S = C.indstillinger || {};
    var billetter = list(C.billetter), nyheder = list(C.nyheder), sessions = list(C.sessions),
        program = list(C.program), sponsorer = list(C.sponsorer), om = C.om || {}, info = C.billetinfo || {};
    var tel = function () { return "tel:+45" + String(S.kontaktTelefon || "").replace(/\s/g, ""); };

    /* Fælles felter */
    document.querySelectorAll("[data-konf]").forEach(function (el) {
      var key = el.getAttribute("data-konf");
      if (S[key] != null) el.textContent = S[key];
    });
    var temaEl = document.querySelector("[data-tema]");
    if (temaEl && S.tema) {
      var t = esc(S.tema), f = esc(S.temaFremhaev || "");
      var at = f ? t.lastIndexOf(f) : -1;
      temaEl.innerHTML = at >= 0 ? t.slice(0, at) + "<em>" + f + "</em>" + t.slice(at + f.length) : t;
    }
    document.querySelectorAll("[data-tt]").forEach(function (a) { a.href = S.ticketTailorUrl; });
    document.querySelectorAll("[data-tt-admin]").forEach(function (a) { a.href = S.ticketTailorAdministrer; });
    document.querySelectorAll("[data-soster]").forEach(function (a) { a.href = S.sosterSite; });
    document.querySelectorAll("[data-nyhedsbrev]").forEach(function (a) { a.href = S.nyhedsbrevUrl; });
    document.querySelectorAll("[data-mail]").forEach(function (a) { a.href = "mailto:" + S.kontaktEmail; a.textContent = S.kontaktEmail; });
    document.querySelectorAll("[data-tel]").forEach(function (a) { a.href = tel(); a.textContent = S.kontaktTelefon; });

    /* Priser i forsidens faktaboks */
    if (billetter.length) {
      var hoved = billetter.filter(function (b) { return b.fremhaevet; })[0] || billetter[0];
      var andre = billetter.filter(function (b) { return b !== hoved && b.pris != null && b.pris !== ""; });
      set("pris-fakta", esc(kr(hoved.pris)) + "<small>" + andre.map(function (b) {
        return esc(b.navn) + " " + esc(kr(b.pris)) + (b.stempel ? " (" + esc(b.stempel) + ")" : "");
      }).join(" · ") + "</small>");
    }

    /* Nyheder */
    if ($("news") && nyheder.length) {
      var item = function (n) {
        return '<article class="news-item">' +
          '<p class="mono news-meta"><time>' + esc(n.dato) + "</time> · <b>" + esc(n.tag) + "</b></p>" +
          "<h3>" + esc(n.titel) + "</h3>" +
          '<p class="uddrag">' + esc(n.uddrag) + "</p>" +
          (n.tekst ? "<details><summary>Læs mere</summary><p>" + esc(n.tekst) + "</p></details>" : "") +
          "</article>";
      };
      set("news", '<div class="news-lead">' + item(nyheder[0]) + "</div>" +
        '<div class="news-list">' + nyheder.slice(1).map(item).join("") + "</div>");
    }

    /* Kasser */
    var tones = ["wash", "ink", "signal"];
    var DATA = { sessions: sessions, program: program };
    var isBreak = function (p) { return p.type === "Pause" || p.type === "Netværk" || (p.type === "Afslutning" && !p.beskrivelse); };
    var phText = function (p) {
      if (p.maerke) return p.maerke;
      var who = String(p.talere || "").split(",")[0].split(" og ")[0].trim();
      if (!who || /annonceres|arrangørerne|panel/i.test(who)) return p.type;
      return initials(who);
    };
    var imgTag = function (path, fokus) {
      return '<img src="' + esc(src(path)) + '" alt=""' + (fokus ? ' style="object-position:' + esc(fokus) + '"' : "") + ">";
    };
    var imgHtml = function (p, i) {
      if (p.billede) return imgTag(p.billede, p.billedeFokus);
      var ph = phText(p) || "";
      return '<div class="ph ph--' + tones[i % 3] + (ph.length > 4 ? " ph--word" : "") + '" aria-hidden="true"><span>' + esc(ph) + "</span></div>";
    };
    var tagHtml = function (t) { return '<span class="tag tag--' + esc(String(t || "").replace(/\s/g, "-")) + '">' + esc(t) + "</span>"; };
    var boxHtml = function (p, i, wide, kilde, idx) {
      return '<article class="box' + (wide ? " box--wide" : "") + '" data-src="' + kilde + '" data-idx="' + idx + '" data-tone="' + i + '">' +
        '<button type="button" class="box-open" aria-label="Læs mere om ' + esc(p.titel) + '"></button>' +
        '<div class="box-img">' + imgHtml(p, i) + "</div>" +
        '<div class="box-body">' +
          '<p class="box-meta">' + tagHtml(p.type) + "</p>" +
          "<h3>" + esc(p.titel) + "</h3>" +
          (p.beskrivelse ? "<p>" + esc(p.beskrivelse) + "</p>" : "") +
          (p.talere ? '<p class="box-who"><span class="mono">' + esc(p.talereLabel || "Taler") + "</span>" + esc(p.talere) + "</p>" : "") +
          '<span class="box-more">Læs mere +</span>' +
        "</div></article>";
    };

    set("teaser", sessions.map(function (p, i) { return boxHtml(p, i, false, "sessions", i); }).join(""));
    var sNote = $("sessions-note"); if (sNote) sNote.textContent = S.sessionsNote || "";

    if ($("schedule")) {
      var pNote = $("program-note"); if (pNote) pNote.textContent = S.programNote || "";
      var n = 0;
      set("schedule", program.map(function (p, idx) {
        var time = '<div class="tl-time">' + esc(p.start) + (p.slut ? "<small>til " + esc(p.slut) + "</small>" : "") + "</div>";
        if (isBreak(p)) {
          return '<div class="tl-row tl-row--break">' + time + '<div class="tl-break">' + tagHtml(p.type) + "<h3>" + esc(p.titel) + "</h3></div></div>";
        }
        return '<div class="tl-row">' + time + boxHtml(p, n++, true, "program", idx) + "</div>";
      }).join(""));
    }

    /* Popup: session og personer */
    var dlg = null, cur = null;
    var shell = function (imgPart, tag, body, actions) {
      return '<div class="modal-inner">' +
        '<div class="modal-img">' + imgPart + "</div>" +
        '<div class="modal-body">' +
          '<div class="modal-top"><div class="modal-top-left"><div class="modal-thumb" aria-hidden="true">' + imgPart + "</div>" + tag + '</div><button type="button" class="modal-close">Luk ×</button></div>' +
          body +
          '<p class="modal-facts mono"><span>' + esc(S.datoLang) + "</span><span>" + esc(S.tid) + "</span><span>" + esc(S.sted) + "</span></p>" +
          '<div class="modal-actions">' + actions + "</div>" +
        "</div></div>";
    };
    var showSession = function () {
      var p = cur.p;
      var text = (p.mere && p.mere.length ? p.mere : [p.beskrivelse]).filter(Boolean);
      var people = "";
      var personer = list(p.personer);
      if (personer.length) {
        people = '<div class="modal-speaker"><span class="mono">' + (personer.length === 1 ? "Mød oplægsholderen" : "Mød oplægsholderne") + "</span>" + '<div class="people">' +
          personer.map(function (x, i) {
            var pic = x.billede ? imgTag(x.billede, x.billedeFokus) : '<span class="person-ini">' + esc(initials(x.navn)) + "</span>";
            return '<button type="button" class="person" data-person="' + i + '"><span class="person-img">' + pic + '</span><span class="person-txt"><strong>' + esc(x.navn) + '</strong><span class="mono">' + esc(x.rolle) + "</span></span></button>";
          }).join("") + "</div></div>";
      } else if (p.talere) {
        people = '<div class="modal-speaker"><span class="mono">' + esc(p.talereLabel || "Taler") + "</span><strong>" + esc(p.talere) + "</strong></div>";
      }
      dlg.innerHTML = shell(imgHtml(p, cur.tone), tagHtml(p.type),
        '<h2 id="modal-title">' + esc(p.titel) + '</h2><div class="modal-text">' + paras(text) + "</div>" + people,
        '<a class="btn" href="billetter.html">Køb billet →</a>' + (cur.src === "program" ? "" : '<a class="link-arrow" href="program.html">Se programmet</a>'));
    };
    var showPerson = function (i) {
      var x = list(cur.p.personer)[i]; if (!x) return;
      var pic = x.billede ? imgTag(x.billede, x.billedeFokus) : '<div class="ph ph--ink"><span>' + esc(initials(x.navn)) + "</span></div>";
      dlg.innerHTML = shell(pic, tagHtml(x.rolle),
        '<h2 id="modal-title">' + esc(x.navn) + '</h2><div class="modal-text">' + paras(x.bio) +
          (x.url ? '<p><a class="link-arrow" href="' + esc(x.url) + '">' + esc(x.linkTekst || "Hjemmeside →") + "</a></p>" : "") + "</div>" +
        '<div class="modal-speaker"><span class="mono">' + (x.rolle === "Sessionvært" ? "Vært for" : "Session") + "</span><strong>" + esc(cur.p.titel) + "</strong></div>",
        '<button type="button" class="btn btn--ghost modal-back">← Tilbage til sessionen</button><a class="link-arrow" href="billetter.html">Køb billet →</a>');
      var c = dlg.querySelector(".modal-back"); if (c) c.focus();
    };
    var openBox = function (kilde, idx, tone) {
      var p = (DATA[kilde] || [])[idx]; if (!p) return;
      if (!dlg) {
        dlg = document.createElement("dialog");
        dlg.className = "modal";
        dlg.setAttribute("aria-labelledby", "modal-title");
        document.body.appendChild(dlg);
        dlg.addEventListener("click", function (e) {
          var person = e.target.closest(".person");
          if (person) { showPerson(+person.dataset.person); return; }
          if (e.target.closest(".modal-back")) { showSession(); var f = dlg.querySelector(".person"); if (f) f.focus(); return; }
          if (e.target === dlg || e.target.closest(".modal-close")) dlg.close();
        });
        dlg.addEventListener("close", function () { document.documentElement.classList.remove("modal-open"); });
      }
      cur = { src: kilde, p: p, tone: tone };
      showSession();
      document.documentElement.classList.add("modal-open");
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    };
    document.addEventListener("click", function (e) {
      var box = e.target.closest(".box[data-idx]");
      if (box) openBox(box.dataset.src, +box.dataset.idx, +box.dataset.tone || 0);
    });

    /* Sponsorer */
    set("tiers", sponsorer.map(function (lvl) {
      var sp = list(lvl.sponsorer);
      var slots = sp.map(function (s) {
        var inner = s.logo ? '<img src="' + esc(src(s.logo)) + '" alt="' + esc(s.navn) + '">' : '<span class="slot-name">' + esc(s.navn) + "</span>";
        return s.url ? '<a class="slot" href="' + esc(s.url) + '">' + inner + "</a>" : '<div class="slot">' + inner + "</div>";
      });
      var pladser = Math.max(Number(lvl.pladser) || 0, sp.length);
      for (var i = sp.length; i < pladser; i++) slots.push('<div class="slot slot--empty">Ledig plads</div>');
      var cls = pladser === 1 ? "slots--1" : pladser <= 4 ? "slots--" + pladser : "slots--6";
      return '<div class="tier"><h3>' + esc(lvl.navn) + '</h3><div class="slots ' + cls + '">' + slots.join("") + "</div></div>";
    }).join(""));
    var sTekst = $("sponsor-tekst"); if (sTekst) sTekst.textContent = S.sponsorTekst || "";

    /* Om-siden og forsidens principper */
    set("om-indledning", paras(om.indledning));
    set("om-frem", paras(om.frem));
    set("om-arrangoer", paras(om.samarbejde));
    set("om-principper", list(om.principper).map(function (p) {
      return '<div class="principle"><h3>' + esc(p.titel) + "</h3><p>" + esc(p.tekst) + "</p></div>";
    }).join(""));
    set("om-maalgruppe", list(om.maalgruppe).map(function (m) { return "<li>" + esc(m) + "</li>"; }).join(""));
    set("om-hold", list(om.hold).map(function (t) {
      var portrait = t.foto ? '<img src="' + esc(src(t.foto)) + '" alt="Portræt af ' + esc(t.navn) + '">' : '<span aria-hidden="true">' + esc(initials(t.navn)) + "</span>";
      return '<article class="speaker"><div class="portrait">' + portrait + "</div><h3>" + esc(t.navn) + '</h3><p class="mono rolle">' + esc(t.rolle) + "</p>" +
        (t.tekst ? "<p>" + esc(t.tekst) + "</p>" : "") +
        (t.url ? '<p><a class="link-arrow" href="' + esc(t.url) + '">Læs mere →</a></p>' : "") + "</article>";
    }).join(""));
    set("om-kontakt", list(om.kontakt).map(function (k) {
      return '<div class="contact-item"><h3>' + esc(k.label) + "</h3><p>" + esc(k.tekst) + "</p>" +
        (k.visEmail ? '<a class="email" href="mailto:' + esc(S.kontaktEmail) + '">' + esc(S.kontaktEmail) + "</a>" : "") +
        (k.visTelefon ? '<a class="email" href="' + tel() + '">Tlf. ' + esc(S.kontaktTelefon) + "</a>" : "") +
        (k.link ? '<a class="link-arrow" href="' + esc(k.link) + '">' + esc(k.linkTekst || "Læs mere →") + "</a>" : "") + "</div>";
    }).join(""));

    /* Billetside */
    if ($("tickets")) {
      var label = { salg: "På salg", snart: "Kommer snart", udsolgt: "Udsolgt" };
      set("tickets", billetter.map(function (t) {
        var open = t.status === "salg";
        var price = t.pris != null && t.pris !== ""
          ? '<div class="price">' + esc(kr(t.pris)) + "<small>" + esc(t.enhed || "pr. person") + "</small></div>"
          : '<div class="price price--text">' + esc(t.enhed || "") + "</div>";
        return '<article class="ticket' + (t.fremhaevet ? " ticket--featured" : "") + '">' +
          "<div><h2>" + esc(t.navn) + (t.stempel ? ' <span class="flag">' + esc(t.stempel) + "</span>" : "") + "</h2><p>" + esc(t.beskrivelse) + "</p></div>" +
          "<ul>" + list(t.inkluderer).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>" +
          price +
          '<div class="ticket-action"><span class="status status--' + esc(t.status) + '">' + esc(label[t.status] || t.status) + "</span>" +
          '<a class="btn' + (t.fremhaevet ? " btn--signal" : "") + '" href="' + esc(t.url || S.ticketTailorUrl) + '"' + (open ? "" : ' aria-disabled="true" tabindex="-1"') + ">" +
          (open ? "Køb billet →" : esc(label[t.status] || "")) + "</a></div></article>";
      }).join(""));
    }
    var faq = function (arr, firstOpen) {
      return list(arr).map(function (q, i) {
        return "<details" + (firstOpen && i === 0 ? " open" : "") + "><summary>" + esc(q.titel) + "</summary><p>" + esc(q.tekst) +
          (q.link ? ' <a href="' + esc(q.link) + '">' + esc(q.linkTekst || "Læs mere →") + "</a>" : "") + "</p></details>";
      }).join("");
    };
    set("billet-inkluderet", faq(info.inkluderet, true));
    set("billet-praktisk", faq(info.praktisk, false));

    var y = $("year"); if (y) y.textContent = new Date().getFullYear();
    document.documentElement.classList.add("indhold-klar");
  }
})();
