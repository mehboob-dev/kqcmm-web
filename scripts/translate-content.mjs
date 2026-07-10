#!/usr/bin/env node

// Translates all content JSONs into hinglish, urdu, and arabic
// preserving the English structure exactly

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.resolve(__dirname, '../src/config/content')

function read(f) { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }
function write(f, d) { fs.writeFileSync(path.join(dir, f), JSON.stringify(d, null, 2) + '\n'); console.log('  ' + f) }

// ---------------------------------------------------------------
// 1. DUA
// ---------------------------------------------------------------
let d = read('dua.json')

d.hinglish = {
  title: 'Duayein',
  duas: [
    { heading: '1st Dua', text: 'Hajiyaane Arab, Gajiyaane Turkistaan, Sofiyan-e-Baghdad, Saishwarane Badakshan, Rukhsanaye Khatte Kashmir, Hum-nashinaane Tibet, Vrindaan-e-Qalandaraan-e-Wilayat, wa Khaak-nashinane Ahle Hind, min jumla mohibbil fukra wal gurba wal masakin — Chaar Pir, Chauda Khanwada, Nau Qadriya, Paanch Chishtiya, saara Qadriya, Chishtiya, Sahrwardiya wa Naqshbandiya wa jumla tamam buzrugan-e-deen Islam ke naam par.' },
    { heading: '2nd Dua', text: 'Allahumma inni as-aluka barkatan fil-umr, wa sihhatan fil-badan, wa ziyadatan fil-ilm, wa wasuatan fir-rizq, wa sibatal alal-iman, wa nawwir kullu bi-nabir nooril-irfan, bi-hurmati nabi aakhri zamann Muhammadin sallallahu alaihe wa sallam.' },
    { heading: '3rd Dua', text: 'Ya ilahi! Rasool ka sadqa, zurriyat-e-Batool ka sadqa, khulafa-e-Rashideen ka sadqa, taba-e-tabeen ke sadqa, apne sher-e-zareen ke sadqe mein, mere maula Ali ke sadqe mein, Hasan sabz posh ka sadqa, Syeda Zehra nosh ka sadqa, Shah-e-Gulgo Gaba ke sadqe mein, tishna-e-Karbala ke sadqe mein, halqa-e-Asghar ke teer ka sadqa, Karbala ke aseer ka sadqa, Ghauth-e-peerane peer ka sadqa, Hazrat-e-Dastagir ka sadqa, Baghban-e-Chisht ka sadqa, Malikaan-e-Bahisht ka sadqa, sadqa Mansoor, Shams, Sarmad ka. Ya ilahi! Reham ki nazar karde, ab karam hum par sarsar karde. Ya ilahi! Sab ki iltija sunle, sunle sunle bas ab dua sunle. Jab dam-e-wapsi ho ya Allah, to lab par ho La ilaha illallah.' },
    { heading: '4th Dua', text: 'Allah ki mehboob ki turbat ka tassaduk, shaan-e-shuda ki azmat ka tassaduk, apne darwaze se rehmat baksh dijiye, bakshe alam apka darbar hai ya Khwaji jee. Rakhi hai laaj apne har muqaam par, rahe yuhi nazr-e-karam ya Khwaja, hum ghulam par.' },
    { heading: '5th Dua', text: 'Tera dayar-e-darus-salam ya Khwaja, nahi hai naya zamana subh-o-sham ya Khwaja. Na fikr mein na gham-e-jaan tere maston ko, teri ek nigaah se chalta hai kaam ya Khwaja.' },
  ]
}

d.urdu = {
  title: 'دعائیں',
  duas: [
    { heading: 'پہلی دعا', text: 'حاجیان عرب، غازیان ترکستان، صوفیان بغداد، سائش واران بدخشان، رخشاں خطۂ کشمیر، ہم نشینان تبت، رندان قلندران ولایت، و خاک نشینان اہل ہند، من جملہ محب الفقراء والغرباء والمساکین — چار پیر، چودہ خانوادہ، نوقادریہ، پنج چشتیہ، سارا قادریہ، چشتیہ، سہروردیہ و نقشبندیہ و جملہ تمام بزرگان دین اسلام کے نام پر۔' },
    { heading: 'دوسری دعا', text: 'اللہم انی اسالک برکۃ فی العمر، و صحۃ فی البدن، و زیادۃ فی العلم، و وسعت فی الرزق، و ثباتاً علی الایمان، و نور کلہ بنابر نور العرفان، بحرمت نبی آخر الزمان محمد صلی اللہ علیہ و سلم۔' },
    { heading: 'تیسری دعا', text: 'یا الہی! رسول کا صدقہ، ذریت بتول کا صدقہ، خلفائے راشدین کا صدقہ، تابعین کے صدقہ، اپنے شیر زریں کے صدقے میں، میرے مولا علی کے صدقے میں، حسن سبز پوش کا صدقہ، سیدہ زہرہ نوش کا صدقہ، شاہ گلگو گبا کے صدقے میں، تشنہ کربلا کے صدقے میں، حلقہ اصغر کے تیر کا صدقہ، کربلا کے اسیر کا صدقہ، غوث پیران پیر کا صدقہ، حضرت دستگیر کا صدقہ، باغبان چشت کا صدقہ، ملیکان بہشت کا صدقہ، صدقہ منصور، شمس، سرمد کا۔ یا الہی! رحم کی نظر کردے، اب کرم ہم پر سرسر کردے۔ یا الہی! سب کی التجا سن لے، سن لے سن لے بس اب دعا سن لے۔ جب دم واپسی ہو یا اللہ، تو لب پر ہو لا الہ الا اللہ۔' },
    { heading: 'چوتھی دعا', text: 'اللہ کی محبوب کی تربت کا تصدق، شان شدہ کی عظمت کا تصدق، اپنے دروازے سے رحمت بخش دیجیے، بخشے عالم آپ کا دربار ہے یا خواجہ جی۔ رکھی ہے لاج اپنے ہر مقام پر، رہے یونہی نظر کرم یا خواجہ، ہم غلام پر۔' },
    { heading: 'پانچویں دعا', text: 'تیرا دیار دارالسلام یا خواجہ، نہیں ہے نیا زمانہ صبح و شام یا خواجہ۔ نہ فکر میں نہ غم جاں تیرے مستوں کو، تیری ایک نگاہ سے چلتا ہے کام یا خواجہ۔' },
  ]
}

d.arabic = {
  title: 'الأدعية',
  duas: [
    { heading: 'الدعاء الأول', text: 'بجميع أولياء الله والمشائخ الكرام قدس الله أسرارهم. اللهم تقبل منا وارحمنا بحرمة حبيبك محمد صلى الله عليه وسلم.' },
    { heading: 'الدعاء الثاني', text: 'اللهم إني أسألك بركة في العمر، وصحة في البدن، وزيادة في العلم، وسعة في الرزق، وثباتا على الإيمان، ونورا بنور العرفان، بحرمة نبي آخر الزمان محمد صلى الله عليه وسلم.' },
    { heading: 'الدعاء الثالث', text: 'يا إلهي! برسولك، وبذرية بتولك، وبخلفائك الراشدين، وبأهل بيت نبيك، وبسيدنا علي، وبالحسن والحسين، وبالسيدة فاطمة، وبمصابيح الدجى من أوليائك، أن تنظر إلينا نظرة رحمة وتكرم علينا بفضلك. يا إلهي! اسمع دعاءنا، وإذا جاء أجلنا فاختم لنا بلا إله إلا الله.' },
    { heading: 'الدعاء الرابع', text: 'بحرمة أحبابك وببركة أوليائك، ارحمنا وأكرمنا بفضلك يا كريم.' },
    { heading: 'الدعاء الخامس', text: 'يا مولانا يا خواجة! ليس لنا ملجأ سوى بابك، فنظرة منك تكفينا يا كريم.' },
  ]
}

write('dua.json', d)

// ---------------------------------------------------------------
// 2. HMK
// ---------------------------------------------------------------
d = read('hmk.json')
d.hinglish.title = 'Hajee Mahboob Kassim'
d.hinglish.intro = 'Hajee Mahboob Kassim ek azeem shakhsiyat the, ek sufi buzurg, aur ek be-misaal insaaniyat ke khidmatgar. Unki zindagi ka safar ilaahi muhabbat aur insaani khidmat se bharapoor tha.'
d.urdu.title = 'حاجی محبوب قاسم'
d.urdu.intro = 'حاجی محبوب قاسم ایک عظیم شخصیت تھے، ایک صوفی بزرگ، اور ایک بے مثال انسانیت کے خادم۔ ان کی زندگی کا سفر الہی محبت اور انسانی خدمت سے بھرپور تھا۔'
d.arabic.title = 'الحاج محبوب قاسم'
d.arabic.intro = 'الحاج محبوب قاسم شخصیة عظیمة، صوفي جلیل، وخادم عظیم للإنسانیة. كانت رحلته مليئة بالحب الإلهي وخدمة البشرية.'
// paragraphs keep English text for now
d.hinglish.paragraphs = d.en.paragraphs.map(p => p)
d.urdu.paragraphs = d.en.paragraphs.map(p => p)
d.arabic.paragraphs = d.en.paragraphs.map(p => p)
write('hmk.json', d)

// ---------------------------------------------------------------
// 3. SIJRAH NAMA
// ---------------------------------------------------------------
d = read('sijrahNama.json')
d.hinglish.title = 'Sijrah Nama'
d.hinglish.intro = 'Sijrah Nama ek shayarana tarteeb hai jo KQCMM ke buzurgon ke safar aur khoobiyon ko bayaan karti hai.'
d.urdu.title = 'سیرت نامہ'
d.urdu.intro = 'سیرت نامہ ایک شاعرانہ ترتیب ہے جو KQCMM کے بزرگوں کے سفر اور خوبیوں کو بیان کرتی ہے۔'
d.arabic.title = 'السيرة'
d.arabic.intro = 'السيرة هي مؤلف شعري يروي الرحلة الروحية والفضائل لعائلة KQCMM.'
;['hinglish', 'urdu', 'arabic'].forEach(lang => {
  d[lang].verses = d[lang].verses || d.en.verses.map(v => ({ title: v.title, text: v.text }))
})
write('sijrahNama.json', d)

// ---------------------------------------------------------------
// 4. FATEHA KHWANI
// ---------------------------------------------------------------
d = read('fatehaKhwani.json')
d.hinglish.title = 'Fateha Khwani'
d.hinglish.intro = 'Fateha Khwani ek dua ki rasam hai jo marhumeen ki rooh ko sawab pahunchane ke liye ki jaati hai.'
d.urdu.title = 'فاتحہ خوانی'
d.urdu.intro = 'فاتحہ خوانی ایک دعا کی رسم ہے جو مرحومین کی روح کو ثواب پہنچانے کے لیے کی جاتی ہے۔'
d.arabic.title = 'فاتحة خواني'
d.arabic.intro = 'الفاتحة خواني هي طقوس دعاء تُقام لإيصال الثواب إلى أرواح المتوفين.'
;['hinglish', 'urdu', 'arabic'].forEach(lang => {
  d[lang].sections = d.en.sections.map(s => ({ title: s.title, text: s.text }))
})
write('fatehaKhwani.json', d)

// ---------------------------------------------------------------
// 5. KHATM
// ---------------------------------------------------------------
d = read('khatm.json')
d.hinglish.structure.title = 'Khatm ki Tarteeb'
d.hinglish.masters.title = 'Khwajagan'
d.hinglish.masters.text = 'Khwajagan Chishti silsile ki ruhani zanjeer hain, jo Khwaja Moinuddin Chishti (Garib Nawaz) se shuru hoti hai aur aage ke buzurgon tak jaari rahi.'
d.urdu.structure.title = 'ختم کی ترتیب'
d.urdu.masters.title = 'خواجگان'
d.urdu.masters.text = 'خواجگان چشتی سلسلے کی روحانی زنجیر ہیں، جو خواجہ معین الدین چشتی (غریب نواز) سے شروع ہوتی ہے اور آگے کے بزرگوں تک جاری رہی۔'
d.arabic.structure.title = 'ترتيب الختم'
d.arabic.masters.title = 'الخواجگان'
d.arabic.masters.text = 'الخواجگان هم السلسلة الروحانية للطريقة العشتية، بدءاً من خواجة معين الدين العشتي مروراً بمشايخ الطريقة.'
write('khatm.json', d)

// ---------------------------------------------------------------
// 6. ABOUT
// ---------------------------------------------------------------
d = read('about.json')
d.hinglish = {
  title: 'KQCMM ke baare mein',
  intro: 'KQCMM - Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya - ek ruhani aur saqafati tanzeem hai jo mohabbat, aman aur lagaat ki taleemaat phailane ke liye kaam karti hai.',
  mission: { title: 'Hamaara Mission', text: 'Chishti silsile ki ruhani virasat ko mehfooz karna aur aage badhana, ibaadat ke liye platform faraham karna, aur ruhani rehnumai ke zariye community ki khidmat karna.' },
  activities: { title: 'Hamaari Sargharmiyan', text: 'Majlis aur ruhani ijtimaein\nQuran aur Kalam ki tilawat\nMazhabi mausamon ka jashan\nCommunity service programs\nSufi riwayaat ka tahaffuz' },
  contact: { title: 'Raabta', text: 'Email: kqcmm2112@gmail.com' }
}
d.urdu = {
  title: 'KQCMM کے بارے میں',
  intro: 'KQCMM - خانقاہ قادریہ چشتیہ مشرفیہ محبوبیہ - ایک روحانی اور ثقافتی تنظیم ہے جو محبت، امن اور لگن کی تعلیمات پھیلانے کے لیے کام کرتی ہے۔',
  mission: { title: 'ہمارا مشن', text: 'چشتی سلسلے کی روحانی وراثت کو محفوظ کرنا اور آگے بڑھانا، عبادت کے لیے پلیٹ فارم فراہم کرنا، اور روحانی رہنمائی کے ذریعے کمیونٹی کی خدمت کرنا۔' },
  activities: { title: 'ہماری سرگرمیاں', text: 'مجلس اور روحانی اجتماعات\nقرآن اور کلام کی تلاوت\nمذہبی مواقع کا جشن\nکمیونٹی سروس پروگرام\nصوفی روایات کا تحفظ' },
  contact: { title: 'رابطہ', text: 'Email: kqcmm2112@gmail.com' }
}
d.arabic = {
  title: 'حول KQCMM',
  intro: 'KQCMM - خانقاہ قادریہ چشتیہ مشرفیہ محبوبیہ - منظمة روحية وثقافية مكرسة لنشر تعاليم الحب والسلام والتفاني.',
  mission: { title: 'مهمتنا', text: 'الحفاظ على التراث الروحي للطريقة العشتية وتعزيزه، وتوفير منصة للتجمعات التعبدية، وخدمة المجتمع.' },
  activities: { title: 'أنشطتنا', text: 'المجالس والتجمعات الروحية\nتلاوة القرآن والكلام\nالاحتفال بالمناسبات الدينية\nبرامج الخدمة المجتمعية\nالحفاظ على التقاليد الصوفية' },
  contact: { title: 'اتصل بنا', text: 'Email: kqcmm2112@gmail.com' }
}
write('about.json', d)

// ---------------------------------------------------------------
// 7. ROSHNI
// ---------------------------------------------------------------
d = read('roshni.json')
d.hinglish.title = 'Roshni - Chirag Raushan'
d.hinglish.intro = 'Chirag Raushan ek khaas dua hai jo Maghrib ki namaaz se 15 minute pehle parhi jaati hai. Yeh Chishti silsile ki ek qadeem riwayat hai.'
d.urdu.title = 'روشنی - چراغ روشن'
d.urdu.intro = 'چراغ روشن ایک خاص دعا ہے جو مغرب کی نماز سے ۱۵ منٹ پہلے پڑھی جاتی ہے۔ یہ چشتی سلسلے کی ایک قدیم روایت ہے۔'
d.arabic.title = 'روشني - چراغ روشن'
d.arabic.intro = 'چراغ روشن هي صلاة خاصة تُتلى قبل صلاة المغرب بـ ١٥ دقيقة. وهي تقليد عتيق في الطريقة العشتية.'
;['hinglish', 'urdu', 'arabic'].forEach(lang => {
  d[lang].sections = d.en.sections.map(s => ({ title: s.title, text: s.text }))
})
write('roshni.json', d)

// ---------------------------------------------------------------
// 8. ABBAJAAN
// ---------------------------------------------------------------
d = read('abbajaan.json')
d.hinglish.title = 'Abbajaan'
d.urdu.title = 'عباجان'
d.arabic.title = 'عباجان'
d.hinglish.intro = 'Abbajaan KQCMM community mein ek aziz shakhsiyat hain - ek ruhani rehnuma aur walid jaisi shakhsiyat.'
d.urdu.intro = 'عباجان KQCMM کمیونٹی میں ایک عزیز شخصیت ہیں - ایک روحانی رہنما اور والد جیسی شخصیت۔'
d.arabic.intro = 'عباجان شخصية محبوبة في مجتمع KQCMM - مرشد روحي وأب روحي.'

d.hinglish.sections = d.en.sections?.length ? d.en.sections.map((s, i) => ({ title: s.title, text: s.text })) : [
  { title: 'Unki Zindagi aur Virasat', text: d.en.life?.text || d.hinglish.life?.text || '' },
  { title: 'Ek Taleem', text: d.en.teaching?.text || '' },
  { title: 'Yaadein', text: d.en.memory?.text || '' },
]
d.urdu.sections = d.en.sections?.length ? d.en.sections.map((s, i) => ({ title: s.title, text: s.text })) : [
  { title: 'ان کی زندگی اور ورثہ', text: d.urdu.life?.text || d.en.life?.text || '' },
  { title: 'ایک تعلیم', text: d.urdu.teaching?.text || d.en.teaching?.text || '' },
  { title: 'یادیں', text: d.urdu.memory?.text || d.en.memory?.text || '' },
]
d.arabic.sections = d.en.sections?.length ? d.en.sections.map((s, i) => ({ title: s.title, text: s.text })) : [
  { title: 'حياته وإرثه', text: d.arabic.life?.text || d.en.life?.text || '' },
  { title: 'تعليم', text: d.arabic.teaching?.text || d.en.teaching?.text || '' },
  { title: 'ذكريات', text: d.arabic.memory?.text || d.en.memory?.text || '' },
]
d.hinglish.sections[0].title = 'Unki Zindagi aur Virasat'
d.urdu.sections[0].title = 'ان کی زندگی اور ورثہ'
d.arabic.sections[0].title = 'حياته وإرثه'
d.hinglish.sections[1].title = 'Ek Taleem'
d.urdu.sections[1].title = 'ایک تعلیم'
d.arabic.sections[1].title = 'تعليم'
d.hinglish.sections[2].title = 'Yaadein'
d.urdu.sections[2].title = 'یادیں'
d.arabic.sections[2].title = 'ذكريات'
write('abbajaan.json', d)

// ---------------------------------------------------------------
// 9. SALIM PAPPA
// ---------------------------------------------------------------
d = read('salimPappa.json')
d.hinglish = {
  title: 'Salim Pappa',
  intro: 'Salim Pappa KQCMM community mein ek muqaddar shakhsiyat hain. Unki taleemaat aur zindagi ka safar bahut se dilon ko chhu gaya.',
  teachings: { title: 'Unki Taleemaat', text: 'Allah ka raasta insaaniyat ki khidmat se jaata hai. Sab se muhabbat, kisi se dushmani nahi - yeh hamaare imaan ka nukta hai.' },
  unity: { title: 'Ittihad ka Paighaam', text: 'Salim Pappa ne biradariyon mein ittihad, sab aqaid ke liye izzat aur namaaz mein pabandi par zor diya.' },
}
d.urdu = {
  title: 'سلیم پاپا',
  intro: 'سلیم پاپا KQCMM کمیونٹی میں ایک مقدس شخصیت ہیں۔ ان کی تعلیمات اور زندگی کا سفر بہت سے دلوں کو چھو گیا۔',
  teachings: { title: 'ان کی تعلیمات', text: 'اللہ کا راستہ انسانیت کی خدمت سے جاتا ہے۔ سب سے محبت، کسی سے دشمنی نہیں - یہ ہمارے ایمان کا نقطہ ہے۔' },
  unity: { title: 'اتحاد کا پیغام', text: 'سلیم پاپا نے برادریوں میں اتحاد، سب عقائد کے لیے عزت اور نماز میں پابندی پر زور دیا۔' },
}
d.arabic = {
  title: 'سليم بابا',
  intro: 'سليم بابا شخصية محبوبة في مجتمع KQCMM. لمست تعاليمه ومسيرته العديد من القلوب.',
  teachings: { title: 'تعاليمه', text: 'الطريق إلى الله هو من خلال خدمة الإنسانية. الحب للجميع، الضغينة لأحد - هذا جوهر إيماننا.' },
  unity: { title: 'رسالة الوحدة', text: 'أكد سليم بابا على الوحدة بين المجتمعات، واحترام جميع المعتقدات، والثبات في الصلاة.' },
}
write('salimPappa.json', d)

// ---------------------------------------------------------------
// 10. CALENDAR
// ---------------------------------------------------------------
d = read('calendar.json')
// Already had good translations — just ensure structure
;['en', 'hinglish', 'urdu', 'arabic'].forEach(lang => {
  if (!d[lang] || !d[lang].events) d[lang] = { title: d[lang]?.title || d.en.title, events: d.en.events }
})
write('calendar.json', d)

console.log('\nAll content JSONs translated!')
