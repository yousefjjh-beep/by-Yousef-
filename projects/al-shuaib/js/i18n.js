// Arabic / English switch. Every visible text node is looked up by its English wording; names in Arabic already on the
// page (class "dup") are hidden in Arabic so nothing is said twice. The choice is remembered per browser.
(function () {
  const AR = {
    'AL SHUAIB': 'الشعيب', 'Three houses by Yousef': 'ثلاثة بيوت · تصميم يوسف', 'Drawings': 'الرسومات', 'Projection': 'الإسقاط', 'Material': 'المواد', 'The house': 'البيت',
    'Choose a house': 'اختر بيتاً', '3 houses': '3 بيوت', 'Al Shuaib Project': 'مشروع الشعيب', 'Three houses, one sheet each': 'ثلاثة بيوت، لكل بيت لوحة',
    'Three houses drawn first, then built in': 'ثلاثة بيوت رُسمت أولاً، ثم بُنيت في', 'Al Shuaib.': 'الشعيب.',
    'A plan, a section and an elevation on one sheet of paper. Scroll, and the drawings build the first house between them, then two more.': 'مسقط ومقطع وواجهة على لوحة واحدة. مرّر الصفحة فتبني الرسومات البيت الأول بينها، ثم بيتين آخرين.',
    'Walk Bayt Safar': 'تجوّل في بيت صفار', 'Scroll to see how it is built': 'مرّر لترى كيف يُبنى',
    'Where three drawings agree, there is a house.': 'حيث تتفق الرسومات الثلاث يكون البيت.', 'Each view pushes its lines into the room. Nothing appears until all three have passed.': 'كل رسمة تدفع خطوطها إلى الفراغ، ولا يظهر شيء حتى تمرّ الثلاث.',
    'Sand render, oak and travertine.': 'لياسة رملية، بلوط وترافرتين.', 'The palms and the olive on the plan stand up as the sweep reaches them. The sun is getting low.': 'النخيل والزيتونة المرسومة على المسقط تقوم حين تصلها المواد. والشمس تميل.',
    'The front': 'الواجهة', 'One oak door in a quiet wall.': 'باب بلوط واحد في جدار هادئ.', 'Slot windows, triangle vents, and a living room that rises above the rest.': 'نوافذ طولية ضيقة، فتحات مثلثة، ومجلس يعلو بقية البيت.',
    'The court': 'الفناء', 'Every room looks inwards.': 'كل الغرف تطل على الداخل.', 'Seven metres square: a still pool, an olive in gravel, and the stair to the roof.': 'سبعة أمتار في سبعة: حوض ماء ساكن، زيتونة في الحصى، ودرج إلى السطح.',
    'The pool': 'المسبح', 'Dining opens east, to the water.': 'غرفة الطعام تنفتح شرقاً على الماء.', 'Ten metres of pool under a pergola, behind triangle screens.': 'مسبح بطول عشرة أمتار تحت مظلة خشبية، خلف ستائر مثلثة النقش.',
    'Three houses': 'ثلاثة بيوت', 'Two more sheets under this one.': 'لوحتان أخريان تحت هذه اللوحة.', 'Bayt Mustaqil and Bayt Mustatil, drawn and built the same way.': 'بيت المستقل وبيت المستطيل، رُسما وبُنيا بالطريقة نفسها.',
    'Al Shuaib': 'الشعيب', 'Sheet': 'اللوحة', 'Drawing': 'الرسمة', 'Scale': 'المقياس', 'Progress': 'التقدّم',
    'One sheet each.': 'لكل بيت لوحة.', 'Choose yours.': 'اختر بيتك.', 'Choose your house': 'اختر بيتك', 'Three houses,': 'ثلاثة بيوت،', 'one language.': 'بلغة واحدة.',
    'Sand render, oak and travertine in all three. Pick the one that fits how you live, then ask us about it. All three are priced at SAR 20,000 per m².': 'لياسة رملية وبلوط وترافرتين في البيوت الثلاثة. اختر ما يناسب طريقة عيشك ثم اسألنا عنه. سعر المتر المربع في البيوت الثلاثة 20,000 ريال.',
    'Bayt Safar': 'بيت صفار', 'Bayt Mustaqil': 'بيت المستقل', 'Bayt Mustatil': 'بيت المستطيل', 'One level around a court': 'دور واحد حول فناء', 'Two floors and a roof': 'دوران وسطح', 'One long room': 'غرفة واحدة طويلة',
    'Every room looks into a 7 × 7 m court. Tall living room, dining open to a 10 m pool.': 'كل الغرف تطل على فناء 7 × 7 م. مجلس عالٍ، وغرفة طعام مفتوحة على مسبح بطول 10 م.',
    'A 9 × 9 m footprint on two floors, with a roof terrace under a pergola and a plunge pool beside it.': 'مسطح 9 × 9 م على دورين، مع جلسة سطح تحت مظلة خشبية ومسبح صغير بجانبه.',
    'One long room, 20 × 7 m, glazed along its whole south side to a pergola, a 15 m pool and palms.': 'غرفة واحدة طويلة 20 × 7 م، زجاج على طول جهتها الجنوبية يطل على مظلة خشبية ومسبح بطول 15 م ونخيل.',
    'Area': 'المساحة', 'Levels': 'الأدوار', 'Bedrooms': 'غرف النوم', 'Price': 'السعر', '230 m²': '230 م²', '160 m²': '160 م²', '140 m²': '140 م²', '2 + roof': '2 + سطح',
    'SAR 4,600,000': '4,600,000 ريال', 'SAR 3,200,000': '3,200,000 ريال', 'SAR 2,800,000': '2,800,000 ريال', 'Ask on WhatsApp': 'اسأل عبر واتساب', 'Walk it': 'تجوّل فيه', 'See it': 'شاهده',
    'A · Bayt Safar': 'أ · بيت صفار', 'B · Bayt Mustaqil': 'ب · بيت المستقل', 'C · Bayt Mustatil': 'ج · بيت المستطيل', 'A': 'أ', 'B': 'ب', 'C': 'ج',
    'One level around a court,': 'دور واحد حول فناء،', 'closed to the street.': 'مغلق على الشارع.',
    'Bayt Safar is a court house in the Wadi Safar manner: thick sand-rendered walls, one oak door, and rooms that take their light from a court open to the sky.': 'بيت صفار بيت فناء على طريقة وادي صفار: جدران سميكة بلياسة رملية، باب بلوط واحد، وغرف تأخذ ضوءها من فناء مفتوح على السماء.',
    'The living room rises above the rest to catch the late sun. Dining opens east to the pool. Everything on this page is the same 3D model you just watched come off the sheet.': 'المجلس يعلو بقية البيت ليلتقط شمس آخر النهار. غرفة الطعام تنفتح شرقاً على المسبح. كل ما في هذه الصفحة هو المجسم نفسه الذي رأيته يخرج من اللوحة.',
    'On one level': 'على دور واحد', '7 × 7 m': '7 × 7 م', '6.30 m': '6.30 م', 'Living room height': 'ارتفاع المجلس', '10 m': '10 م', 'Pool under a pergola': 'مسبح تحت مظلة خشبية',
    'The rooms': 'الغرف', 'Rendered from the model': 'صور من المجسم', 'Five stops on': 'خمس محطات في', 'the walk.': 'الجولة.',
    'One oak door in a quiet wall, date palms either side.': 'باب بلوط واحد في جدار هادئ، ونخلتان على جانبيه.', 'Living room': 'المجلس', 'The tall room. Low seating, oak, and light from high up.': 'الغرفة العالية. جلسة منخفضة، بلوط، وضوء من الأعلى.',
    'Court': 'الفناء', 'A still pool, an olive in gravel, the stair to the roof.': 'حوض ماء ساكن، زيتونة في الحصى، ودرج إلى السطح.', 'Dining': 'الطعام', 'Ten at the table, facing the water.': 'عشرة على المائدة، قبالة الماء.',
    'Pool': 'المسبح', 'Ten metres long, behind triangle screens.': 'بطول عشرة أمتار، خلف ستائر مثلثة النقش.',
    'Five finishes,': 'خمس مواد،', 'nothing shiny.': 'لا شيء لامع.', 'Sand render': 'لياسة رملية', 'Walls, inside and out': 'الجدران من الداخل والخارج', 'Oak': 'بلوط', 'Doors, ceilings, joinery': 'الأبواب والأسقف والنجارة',
    'Travertine': 'ترافرتين', 'Floors and the court': 'الأرضيات والفناء', 'Dark bronze': 'برونز داكن', 'Window frames, screens': 'إطارات النوافذ والستائر', 'Water': 'ماء', 'The court and the pool': 'الفناء والمسبح',
    'Master plan': 'المخطط العام', 'The same house,': 'البيت نفسه،', 'by hand.': 'بخط اليد.', 'A sketched top view of the plot: the house, the court, the pool, and the palms and local trees around them.': 'رسم يدوي للأرض من الأعلى: البيت والفناء والمسبح، والنخيل والأشجار المحلية حولها.', 'Open the master plan': 'افتح المخطط العام',
    'Two floors and a roof,': 'دوران وسطح،', 'on a small plot.': 'على أرض صغيرة.',
    'Bayt Mustaqil stands on a 9 × 9 m footprint. Living and kitchen below, the bedroom above, and the roof as a third room under a pergola.': 'بيت المستقل يقوم على مسطح 9 × 9 م. المعيشة والمطبخ في الأسفل، غرفة النوم في الأعلى، والسطح غرفة ثالثة تحت مظلة خشبية.',
    'A terrace and a plunge pool sit beside it, reached through the wide opening in the east wall.': 'بجانبه جلسة خارجية ومسبح صغير، يُوصل إليهما من الفتحة الواسعة في الجدار الشرقي.',
    'On two floors': 'على دورين', '9 × 9 m': '9 × 9 م', 'Footprint': 'المسطح', '7.9 m': '7.9 م', 'Top of the walls': 'أعلى الجدران', 'At SAR 20,000 per m²': 'بسعر 20,000 ريال للمتر المربع',
    'Slot windows, one oak door, palms at the corners.': 'نوافذ طولية ضيقة، باب بلوط واحد، ونخيل عند الزوايا.', 'Roof terrace': 'السطح', 'Seating under an oak pergola, loungers in the sun.': 'جلسة تحت مظلة من البلوط، وكراسي استلقاء في الشمس.',
    'Plunge pool': 'المسبح الصغير', 'Beside the house, with an olive at its end.': 'بجانب البيت، وفي طرفه زيتونة.',
    'One long room,': 'غرفة واحدة طويلة،', 'open to the garden.': 'مفتوحة على الحديقة.',
    'Bayt Mustatil is 20 × 7 m. Its whole south side is glass between piers, so bedroom, living and dining all look out to the pergola and the pool.': 'بيت المستطيل 20 × 7 م. جهته الجنوبية كلها زجاج بين أعمدة، فغرفة النوم والمعيشة والطعام تطل جميعها على المظلة والمسبح.',
    'The north wall stays closed, with slot windows only. You enter from the west end.': 'الجدار الشمالي يبقى مغلقاً، بنوافذ طولية ضيقة فقط. والدخول من الطرف الغربي.',
    '20 × 7 m': '20 × 7 م', 'The room': 'الغرفة', '15 m': '15 م', 'Pool along the terrace': 'مسبح على طول الجلسة', 'A long roof, a pergola and five date palms.': 'سقف طويل، مظلة خشبية وخمس نخلات.',
    'South side': 'الجهة الجنوبية', 'Glass between piers, the pool the length of the terrace.': 'زجاج بين أعمدة، والمسبح على طول الجلسة.', 'Entrance': 'المدخل', 'One oak door at the west end.': 'باب بلوط واحد في الطرف الغربي.',
    'by Yousef': 'تصميم يوسف', 'Note: these prices are not real. They are shown for illustration only.': 'ملاحظة: هذه الأسعار ليست حقيقية، وهي معروضة للتوضيح فقط.', 'The idea for this project is inspired by the work of Samnang Aing,': 'فكرة هذا المشروع مستوحاة من أعمال Samnang Aing، حساب', 'on X.': 'على منصة X.', 'The prices on this page are not real.': 'الأسعار في هذه الصفحة ليست حقيقية.', 'Now walk it,': 'والآن تجوّل فيه،', 'room by room.': 'غرفة غرفة.', 'Walk the house': 'تجوّل في البيت', 'Back to the sheet': 'عودة إلى اللوحة', 'Riyadh · 2026 · Sheet 01 of 01 · 1:100': 'الرياض · 2026 · لوحة 01 من 01 · 1:100',
    'BAYT SAFAR': 'بيت صفار', 'BAYT MUSTAQIL': 'بيت المستقل', 'BAYT MUSTATIL': 'بيت المستطيل', 'COURT': 'الفناء', 'PLAN': 'المسقط', 'ELEVATION': 'الواجهة', 'SECTION': 'المقطع', 'SWEEP': 'المواد', 'TREES': 'الأشجار',
    'M UP': 'م ارتفاعاً', 'M OUT': 'م امتداداً', 'M ACROSS': 'م عرضاً', 'OF': 'من', 'M²': 'م²', 'M': 'م',
    'WhatsApp number coming soon': 'رقم واتساب قريباً', 'Hello, I am interested in ': 'مرحباً، أنا مهتم بـ', 'English': 'English', 'العربية': 'العربية', 'Light': 'فاتح', 'Dark': 'داكن',
  };
  const nodes = []; let lang = 'en';
  const split = (t) => { const m = t.match(/^(\s*)([\s\S]*?)((?:\s| )*[↗↓↑]?\s*)$/); return [m[1], m[2].replace(/[\s ]+/g, ' '), m[3]]; };
  function collect() { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest('script,style,[lang=ar],#read,#lang,#theme') || p.id === 'bSheet' || p.id === 'bDraw' || p.id === 'bPct') continue; const [a, k, z] = split(n.nodeValue); if (AR[k]) nodes.push([n, n.nodeValue, a + AR[k] + z]); } }
  const t = (s) => (lang === 'ar' && AR[s]) || s;
  function set(l) { lang = l === 'ar' ? 'ar' : 'en'; const h = document.documentElement; h.lang = lang; h.classList.toggle('ar', lang === 'ar'); for (const [n, en, ar] of nodes) n.nodeValue = lang === 'ar' ? ar : en;
    const b = document.getElementById('lang'); if (b) b.textContent = lang === 'ar' ? 'English' : 'العربية'; document.title = lang === 'ar' ? 'مشروع الشعيب — ثلاثة بيوت رُسمت أولاً' : 'Al Shuaib Project · مشروع الشعيب — three houses, drawn first';
    try { localStorage.setItem('shuaib-lang', lang); } catch (e) {} if (window.__themeLabel) window.__themeLabel(); }
  collect();
  let first = new URLSearchParams(location.search).get('lang'); if (!first) { try { first = localStorage.getItem('shuaib-lang'); } catch (e) {} } if (!first) first = (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const b = document.getElementById('lang'); if (b) b.addEventListener('click', () => set(lang === 'ar' ? 'en' : 'ar'));
  window.I18N = { t, set, get lang() { return lang; } }; set(first);
})();

// Dark / light theme: a class on <html>; the 3D scene reads it every frame. Remembered per browser.
(function () {
  const h = document.documentElement, b = document.getElementById('theme'); let th = new URLSearchParams(location.search).get('theme');
  if (!th) { try { th = localStorage.getItem('shuaib-theme'); } catch (e) {} } if (th !== 'light' && th !== 'dark') th = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  window.__themeLabel = () => { if (b) b.textContent = window.I18N.t(th === 'dark' ? 'Light' : 'Dark'); };
  const set = (t) => { th = t; h.classList.toggle('light', t === 'light'); h.classList.toggle('dark', t === 'dark'); window.__themeLabel(); try { localStorage.setItem('shuaib-theme', t); } catch (e) {} };
  if (b) b.addEventListener('click', () => set(th === 'dark' ? 'light' : 'dark')); window.__setTheme = set; set(th);
})();
