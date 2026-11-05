// Run INSIDE https://viimsi.edupage.org/timetable/ (a normal browser page, same origin).
// Evaluates to a JSON string for admin/tt/data.json: only days that differ from the regular A/B pattern.
(async () => {
  const CLASS = "9D", WEEKS = 13;
  const post = async (path, arg) => {
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ __args: [null, arg], __gsh: "00000000" }) });
    if (!r.ok) throw new Error(path + " " + r.status);
    return (await r.json()).r;
  };
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
  // timetable number (regular timetable of the current school year)
  let num = "128";
  try { const v = await post("/timetable/server/ttviewer.js?__func=getTTViewerData", new Date().getFullYear()); if (v && v.regular && v.regular.default_num) num = String(v.regular.default_num); } catch (e) {}
  const reg = await post("/timetable/server/regulartt.js?__func=regularttGetData", num);
  const T = {}; reg.dbiAccessorRes.tables.forEach((t) => (T[t.id] = t.data_rows || []));
  const idx = (n) => Object.fromEntries(T[n].map((r) => [r.id, r]));
  const S = idx("subjects"), Te = idx("teachers"), Cr = idx("classrooms"), Gr = idx("groups"), L = idx("lessons");
  const cls = T.classes.find((c) => c.name === CLASS);
  if (!cls) throw new Error("class not found");
  const CID = cls.id;
  const gname = (n) => (n === "Terve klass" ? "" : n);
  const regular = (li, day) => {
    const out = [];
    T.cards.forEach((c) => {
      const l = L[c.lessonid];
      if (!l || l.classids.indexOf(CID) < 0) return;
      if (c.days[day] !== "1" || c.weeks[li] !== "1") return;
      const g = gname((Gr[l.groupids[0]] || {}).name || "");
      out.push([Number(c.period), l.subjectid, g, l.teacherids.slice().sort().join(","), c.classroomids.slice().sort().join(",")].join("|"));
    });
    return out.sort().join("#");
  };
  const liveKey = (x) => [Number(x.uniperiod), x.subjectid, x.groupnames[0] || "", (x.teacherids || []).slice().sort().join(","), (x.classroomids || []).slice().sort().join(",")].join("|");
  // Monday of this week (Europe/Tallinn date from the browser's clock)
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - dow * 864e5;
  const BASE = Date.UTC(2026, 10, 2); // a week A
  const days = {}, letters = {};
  let okWeeks = 0;
  for (let w = 0; w < WEEKS; w++) {
    const mon = new Date(start + w * 7 * 864e5), end = new Date(start + (w * 7 + 6) * 864e5);
    const year = mon.getUTCMonth() >= 7 ? mon.getUTCFullYear() : mon.getUTCFullYear() - 1;
    let j;
    try {
      j = await post("/timetable/server/currenttt.js?__func=curentttGetData", { year, datefrom: iso(mon), dateto: iso(end), table: "classes", id: CID, showColors: true, showIgroupsInClasses: false, showOrig: true, log_module: "CurrentTTView" });
    } catch (e) { continue; }
    okWeeks++;
    const letter = (j.week_name || "").slice(-1);
    const auto = Math.round((mon.getTime() - BASE) / (7 * 864e5)) % 2 === 0 ? "A" : "B";
    if (letter && letter !== auto) letters[iso(mon)] = letter;
    const li = letter === "B" ? 1 : 0;
    const byDate = {};
    (j.ttitems || []).forEach((x) => { if (x.subjectid) (byDate[x.date] = byDate[x.date] || []).push(x); });
    for (let d = 0; d < 5; d++) {
      const date = iso(new Date(mon.getTime() + d * 864e5));
      const live = byDate[date] || [];
      if (live.map(liveKey).sort().join("#") !== regular(li, d)) {
        days[date] = live.map((x) => [
          Number(x.uniperiod), (S[x.subjectid] || {}).short, (S[x.subjectid] || {}).name, (S[x.subjectid] || {}).color,
          (x.groupnames || []).filter(Boolean).join(", "),
          (x.teacherids || []).map((i) => (Te[i] || {}).name).filter(Boolean).join(", "),
          (x.classroomids || []).map((i) => (Cr[i] || {}).short).filter(Boolean).join(", "),
          x.changed ? 1 : 0,
        ]);
      }
    }
  }
  if (okWeeks < WEEKS - 2) throw new Error("too few weeks fetched: " + okWeeks);
  const to = new Date(start + (WEEKS * 7 - 1) * 864e5);
  return JSON.stringify({ generated: iso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))), from: iso(new Date(start)), to: iso(to), letters, days });
})()
