import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'public', 'placeholders');
const dirs = ['signs', 'styles', 'templates', 'colors', 'decorations'];
for (const d of dirs) {
  fs.mkdirSync(path.join(root, d), { recursive: true });
}

// 1. Shop Logo SVG
fs.writeFileSync(
  path.join(root, 'logo.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" rx="34" fill="#FFF9F5" stroke="#F7B7C8" stroke-width="4"/>
    <circle cx="60" cy="60" r="44" fill="#FDECEF"/>
    <path d="M40 48C40 42 45 38 52 38H68C75 38 80 42 80 48V74C80 80 75 84 68 84H52C45 84 40 80 40 74V48Z" fill="#FFFFFF" stroke="#5D473A" stroke-width="3"/>
    <path d="M48 38C48 31 54 28 60 34C66 28 72 31 72 38" stroke="#E58CA5" stroke-width="4" stroke-linecap="round"/>
    <circle cx="52" cy="56" r="3" fill="#5D473A"/>
    <circle cx="68" cy="56" r="3" fill="#5D473A"/>
    <path d="M55 64Q60 69 65 64" stroke="#E58CA5" stroke-width="3" stroke-linecap="round" fill="none"/>
    <text x="60" y="106" text-anchor="middle" font-family="Prompt, sans-serif" font-size="11" font-weight="600" fill="#5D473A">SIGN STUDIO</text>
  </svg>`
);

// 2. Hero Banner SVG
fs.writeFileSync(
  path.join(root, 'hero-banner.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 540" fill="none">
    <rect width="800" height="540" rx="40" fill="#FFF9F5"/>
    <circle cx="680" cy="110" r="95" fill="#FDECEF"/>
    <circle cx="120" cy="430" r="110" fill="#F3ECFF"/>
    <circle cx="420" cy="80" r="48" fill="#FFF2CC"/>
    <!-- Sample Card 1: Minimal Sign -->
    <g transform="translate(80, 75)">
      <rect width="280" height="360" rx="28" fill="#FFFFFF" stroke="#EAD9CE" stroke-width="3"/>
      <rect x="24" y="24" width="90" height="28" rx="14" fill="#FDECEF"/>
      <text x="69" y="43" text-anchor="middle" font-family="Prompt, sans-serif" font-size="12" font-weight="600" fill="#E58CA5">MINIMAL</text>
      <text x="140" y="95" text-anchor="middle" font-family="Prompt, sans-serif" font-size="22" font-weight="700" fill="#5D473A">PASTEL SHOP</text>
      <text x="140" y="122" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" fill="#8B7365">ป้ายร้านค้า &amp; ป้ายบัญชีมินิมอล</text>
      <rect x="34" y="150" width="212" height="68" rx="16" fill="#FFF9F5" stroke="#F2E6DF" stroke-width="2"/>
      <text x="140" y="180" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="600" fill="#5D473A">ธนาคารกสิกรไทย (KBank)</text>
      <text x="140" y="203" text-anchor="middle" font-family="Prompt, sans-serif" font-size="16" font-weight="700" fill="#E58CA5">123-4-56789-0</text>
      <rect x="34" y="240" width="212" height="44" rx="14" fill="#F4F9F6"/>
      <text x="140" y="267" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="600" fill="#4C7A63">OPEN DAILY 09:00 - 20:00</text>
      <text x="140" y="325" text-anchor="middle" font-family="Prompt, sans-serif" font-size="12" fill="#8B7365">สะอาดตา • อ่านง่าย • มืออาชีพ</text>
    </g>
    <!-- Sample Card 2: Decorative Sign -->
    <g transform="translate(410, 95)">
      <rect width="310" height="370" rx="30" fill="#FFF5F8" stroke="#F7B7C8" stroke-width="4"/>
      <rect x="14" y="14" width="282" height="342" rx="22" fill="#FFFFFF" stroke="#F7B7C8" stroke-width="2" stroke-dasharray="8 6"/>
      <rect x="95" y="30" width="120" height="30" rx="15" fill="#F7B7C8"/>
      <text x="155" y="50" text-anchor="middle" font-family="Prompt, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF">DECORATIVE ✨</text>
      <text x="155" y="100" text-anchor="middle" font-family="Prompt, sans-serif" font-size="22" font-weight="700" fill="#5D473A">SWEETIE STUDIO</text>
      <text x="155" y="128" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" fill="#E58CA5">🎀 เลือกของตกแต่งฟรี 0 บาททุกชิ้น!</text>
      <g transform="translate(36, 152)">
        <rect width="238" height="110" rx="18" fill="#FFF9F5" stroke="#F7B7C8" stroke-width="2"/>
        <text x="119" y="34" text-anchor="middle" font-family="Prompt, sans-serif" font-size="14" font-weight="700" fill="#5D473A">เรทราคาแพ็กเกจยอดฮิต</text>
        <text x="119" y="62" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" fill="#8B7365">เซ็ต S น่ารักกรุบกริบ • 59.-</text>
        <text x="119" y="88" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" fill="#8B7365">เซ็ต M ตกแต่งจัดเต็ม • 79.-</text>
      </g>
      <rect x="52" y="286" width="206" height="42" rx="21" fill="#E58CA5"/>
      <text x="155" y="312" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">ตัวอย่างผลงาน Placeholder</text>
    </g>
  </svg>`
);

// 3. Styles Preview SVGs
fs.writeFileSync(
  path.join(root, 'styles', 'minimal.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" fill="none">
    <rect width="600" height="400" rx="28" fill="#FFF9F5"/>
    <rect x="50" y="40" width="500" height="320" rx="24" fill="#FFFFFF" stroke="#EAD9CE" stroke-width="3"/>
    <rect x="85" y="72" width="120" height="32" rx="16" fill="#FDECEF"/>
    <text x="145" y="93" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="600" fill="#E58CA5">MINIMAL STYLE</text>
    <text x="300" y="155" text-anchor="middle" font-family="Prompt, sans-serif" font-size="28" font-weight="700" fill="#5D473A">เรียบง่าย สะอาดตา</text>
    <text x="300" y="192" text-anchor="middle" font-family="Prompt, sans-serif" font-size="16" fill="#8B7365">ใช้โทนสีพาสเทลสบายตา มีพื้นที่ว่าง เน้นข้อความชัดเจน</text>
    <rect x="150" y="230" width="300" height="72" rx="18" fill="#FFF9F5" stroke="#EAD9CE" stroke-width="2"/>
    <text x="300" y="272" text-anchor="middle" font-family="Prompt, sans-serif" font-size="16" font-weight="600" fill="#5D473A">ราคาเพิ่ม +0 บาท (รวมในราคาฐาน)</text>
  </svg>`
);

fs.writeFileSync(
  path.join(root, 'styles', 'decorative.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" fill="none">
    <rect width="600" height="400" rx="28" fill="#FFF2F6"/>
    <circle cx="90" cy="80" r="45" fill="#DCD2F5" opacity="0.6"/>
    <circle cx="520" cy="320" r="55" fill="#FCE8A6" opacity="0.7"/>
    <rect x="50" y="40" width="500" height="320" rx="26" fill="#FFFFFF" stroke="#F7B7C8" stroke-width="4"/>
    <rect x="66" y="56" width="468" height="288" rx="20" fill="none" stroke="#E58CA5" stroke-width="2" stroke-dasharray="10 6"/>
    <rect x="195" y="74" width="210" height="34" rx="17" fill="#E58CA5"/>
    <text x="300" y="96" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">✨ DECORATIVE STYLE 🎀</text>
    <text x="300" y="158" text-anchor="middle" font-family="Prompt, sans-serif" font-size="28" font-weight="700" fill="#5D473A">ตกแต่งจัดเต็ม น่ารักสดใส</text>
    <text x="300" y="195" text-anchor="middle" font-family="Prompt, sans-serif" font-size="16" fill="#8B7365">กรอบลวดลาย โบว์ ดอกไม้ สติกเกอร์ และประกายวิบวับ</text>
    <rect x="135" y="232" width="330" height="72" rx="18" fill="#FDECEF" stroke="#F7B7C8" stroke-width="2"/>
    <text x="300" y="274" text-anchor="middle" font-family="Prompt, sans-serif" font-size="16" font-weight="700" fill="#E58CA5">เพิ่มลูกเล่นพิเศษ + ของตกแต่งฟรีทุกชิ้น</text>
  </svg>`
);

// 4. Sign Category SVGs (15 categories)
const signTitles = [
  ['ป้ายร้านค้า', 'Shop Banner', '#FDECEF', '#E58CA5'],
  ['ป้ายรายละเอียดร้าน', 'Shop Details', '#FFF6E8', '#D99B52'],
  ['ป้ายบัญชีธนาคาร', 'Bank Account', '#EBF7F2', '#529E7E'],
  ['ป้ายแจ้งช่องทางชำระเงิน', 'Payment Channels', '#EEF4FC', '#5C8AC4'],
  ['ป้ายเครดิต', 'Credit & Trust', '#F3EEFC', '#8A6BC4'],
  ['ป้ายรีวิว', 'Customer Review', '#FDECEF', '#E58CA5'],
  ['ป้ายเปิด-ปิดร้าน', 'Open - Close Hours', '#FFF6E8', '#D99B52'],
  ['ป้ายเรทราคา', 'Price Rate Chart', '#FDECEF', '#E58CA5'],
  ['ป้ายโปรโมชั่น', 'Promotion Sale', '#FDE8E8', '#D96B6B'],
  ['ป้ายขอบคุณลูกค้า', 'Thank You Card', '#F3EEFC', '#8A6BC4'],
  ['ป้ายแจ้งเลขพัสดุ', 'Parcel Tracking', '#EBF7F2', '#529E7E'],
  ['ป้ายช่องทางติดต่อ', 'Social Contacts', '#EEF4FC', '#5C8AC4'],
  ['ป้ายแจ้งวันหยุด', 'Holiday Notice', '#FFF6E8', '#D99B52'],
  ['ป้ายกฎและเงื่อนไขร้าน', 'Shop Rules', '#F4F1EE', '#7A685D'],
  ['ป้ายประกาศและป้ายอื่น ๆ', 'Custom Sign', '#FDECEF', '#E58CA5'],
];

signTitles.forEach(([th, en, bg, accent], idx) => {
  const num = String(idx + 1).padStart(2, '0');
  fs.writeFileSync(
    path.join(root, 'signs', `sign-${num}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 340" fill="none">
      <rect width="480" height="340" rx="26" fill="${bg}"/>
      <rect x="28" y="28" width="424" height="284" rx="22" fill="#FFFFFF" stroke="${accent}" stroke-opacity="0.35" stroke-width="3"/>
      <rect x="165" y="54" width="150" height="30" rx="15" fill="${bg}"/>
      <text x="240" y="74" text-anchor="middle" font-family="Prompt, sans-serif" font-size="12" font-weight="600" fill="${accent}">${en.toUpperCase()}</text>
      <text x="240" y="140" text-anchor="middle" font-family="Prompt, sans-serif" font-size="26" font-weight="700" fill="#5D473A">${th}</text>
      <rect x="80" y="170" width="320" height="58" rx="14" fill="#FFF9F5" stroke="#EAD9CE" stroke-width="1.5"/>
      <text x="240" y="204" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" fill="#8B7365">ตัวอย่างป้ายสำเร็จรูป (แก้ไขข้อความได้)</text>
      <text x="240" y="274" text-anchor="middle" font-family="Prompt, sans-serif" font-size="12" font-weight="600" fill="${accent}">Custom Sign Studio • Placeholder #${num}</text>
    </svg>`
  );
});

// 5. Template Gallery SVGs (MIN-001..MIN-010 & DEC-001..DEC-010)
const minNames = [
  'Soft Cream Welcome',
  'Pure Pastel Shop Info',
  'Clean Bank Slip Card',
  'Easy Pay Minimal',
  'Trust Badge Minimal',
  'Warm Quote Review',
  'Daily Hours Minimal',
  'Neat Price Table',
  'Minimal Promo Highlight',
  'Simple Thank You Note',
];
minNames.forEach((title, i) => {
  const code = `MIN-${String(i + 1).padStart(3, '0')}`;
  fs.writeFileSync(
    path.join(root, 'templates', `${code}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 620" fill="none">
      <rect width="500" height="620" rx="32" fill="#FFF9F5"/>
      <rect x="36" y="36" width="428" height="548" rx="24" fill="#FFFFFF" stroke="#E8D8CE" stroke-width="3"/>
      <rect x="66" y="66" width="110" height="32" rx="16" fill="#FDECEF"/>
      <text x="121" y="87" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="700" fill="#E58CA5">${code}</text>
      <text x="410" y="87" text-anchor="end" font-family="Prompt, sans-serif" font-size="12" font-weight="600" fill="#8B7365">MINIMAL</text>
      <text x="250" y="175" text-anchor="middle" font-family="Prompt, sans-serif" font-size="26" font-weight="700" fill="#5D473A">${title}</text>
      <line x1="170" y1="205" x2="330" y2="205" stroke="#F7B7C8" stroke-width="3" stroke-linecap="round"/>
      <rect x="74" y="240" width="352" height="190" rx="20" fill="#FFF9F5" stroke="#EFE2D9" stroke-width="2"/>
      <text x="250" y="305" text-anchor="middle" font-family="Prompt, sans-serif" font-size="16" font-weight="600" fill="#5D473A">พื้นที่จัดวางข้อมูลป้ายของคุณ</text>
      <text x="250" y="340" text-anchor="middle" font-family="Prompt, sans-serif" font-size="14" fill="#8B7365">โทนมินิมอล สะอาดตา อ่านง่าย</text>
      <text x="250" y="375" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" fill="#E58CA5">เลือกของตกแต่งเพิ่มได้ฟรี 0 บาท</text>
      <rect x="130" y="480" width="240" height="46" rx="23" fill="#F4F1EE"/>
      <text x="250" y="508" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="600" fill="#5D473A">ตัวอย่างเทมเพลต ${code}</text>
    </svg>`
  );
});

const decNames = [
  'Sweet Ribbon Shop Sign',
  'Floral Story Shop Details',
  'Sparkle Cute Bank Card',
  'Pastel Rainbow Payment',
  'Lovely Star Review Frame',
  'Candy Price Chart',
  'Express Parcel Cute Alert',
  'Social Connect Pastel Card',
  'Holiday Vacation Notice',
  'Sweet Rules & Care Guide',
];
decNames.forEach((title, i) => {
  const code = `DEC-${String(i + 1).padStart(3, '0')}`;
  fs.writeFileSync(
    path.join(root, 'templates', `${code}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 620" fill="none">
      <rect width="500" height="620" rx="32" fill="#FFF2F6"/>
      <circle cx="70" cy="80" r="45" fill="#FCE8A6" opacity="0.65"/>
      <circle cx="435" cy="540" r="55" fill="#DCD2F5" opacity="0.65"/>
      <rect x="32" y="32" width="436" height="556" rx="28" fill="#FFFFFF" stroke="#F7B7C8" stroke-width="4"/>
      <rect x="48" y="48" width="404" height="524" rx="22" fill="none" stroke="#E58CA5" stroke-width="2" stroke-dasharray="10 6"/>
      <rect x="70" y="72" width="120" height="34" rx="17" fill="#E58CA5"/>
      <text x="130" y="94" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">🎀 ${code}</text>
      <text x="420" y="94" text-anchor="end" font-family="Prompt, sans-serif" font-size="12" font-weight="700" fill="#E58CA5">DECORATIVE ✨</text>
      <text x="250" y="175" text-anchor="middle" font-family="Prompt, sans-serif" font-size="25" font-weight="700" fill="#5D473A">${title}</text>
      <rect x="74" y="218" width="352" height="220" rx="24" fill="#FFF9F5" stroke="#F7B7C8" stroke-width="2.5"/>
      <text x="250" y="285" text-anchor="middle" font-family="Prompt, sans-serif" font-size="17" font-weight="700" fill="#5D473A">✨ กรอบตกแต่ง + สติกเกอร์จัดเต็ม ✨</text>
      <text x="250" y="322" text-anchor="middle" font-family="Prompt, sans-serif" font-size="14" fill="#8B7365">ประดับโบว์ ดอกไม้ หัวใจ ดาว ฟรีทุกชิ้น</text>
      <text x="250" y="360" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="600" fill="#E58CA5">FREE DECORATIONS 0 THB</text>
      <rect x="115" y="480" width="270" height="48" rx="24" fill="#FDECEF"/>
      <text x="250" y="509" text-anchor="middle" font-family="Prompt, sans-serif" font-size="13" font-weight="700" fill="#E58CA5">ตัวอย่างเทมเพลต ${code}</text>
    </svg>`
  );
});

// 6. Color Swatches SVGs
const colors = [
  ['pink', '#F7B7C8'],
  ['blue', '#B8DCF5'],
  ['purple', '#DCD2F5'],
  ['red', '#F5A6A6'],
  ['yellow', '#FCE8A6'],
  ['green', '#B8E4D0'],
  ['cream', '#FFF6EB'],
  ['gray', '#8A8480'],
  ['multicolor', '#F9D1E0'],
];
for (const [slug, hex] of colors) {
  fs.writeFileSync(
    path.join(root, 'colors', `${slug}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="28" fill="${hex}" stroke="#EAD9CE" stroke-width="3"/>
      <circle cx="60" cy="60" r="28" fill="#FFFFFF" fill-opacity="0.55"/>
    </svg>`
  );
}

// 7. 30 Free Decoration SVGs
const decPalette = [
  '#F7B7C8', '#F7B7C8', '#F7B7C8', '#F7B7C8',
  '#B8DCF5', '#B8DCF5', '#B8DCF5',
  '#DCD2F5', '#DCD2F5', '#DCD2F5',
  '#F5A6A6', '#F5A6A6', '#F5A6A6',
  '#FCE8A6', '#FCE8A6', '#FCE8A6', '#FCE8A6',
  '#B8E4D0', '#B8E4D0', '#B8E4D0',
  '#FFF2E2', '#FFF2E2', '#FFF2E2',
  '#B8B2AE', '#B8B2AE', '#B8B2AE',
  '#F7B7C8', '#B8DCF5', '#DCD2F5', '#FCE8A6',
];

for (let i = 1; i <= 30; i++) {
  const num = String(i).padStart(2, '0');
  const fill = decPalette[i - 1] || '#F7B7C8';
  fs.writeFileSync(
    path.join(root, 'decorations', `dec-${num}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
      <rect width="200" height="200" rx="32" fill="#FFF9F5" stroke="#F2E6DF" stroke-width="3"/>
      <circle cx="100" cy="92" r="52" fill="${fill}" fill-opacity="0.45"/>
      <circle cx="100" cy="92" r="34" fill="${fill}" stroke="#5D473A" stroke-width="2.5"/>
      <text x="100" y="98" text-anchor="middle" font-family="Prompt, sans-serif" font-size="14" font-weight="700" fill="#5D473A">FREE #${num}</text>
      <rect x="46" y="156" width="108" height="24" rx="12" fill="#EBF7F2"/>
      <text x="100" y="172" text-anchor="middle" font-family="Prompt, sans-serif" font-size="11" font-weight="700" fill="#3B7A5E">ฟรี 0 บาท</text>
    </svg>`
  );
}

console.log('Generated all SVG placeholders in public/placeholders/');
