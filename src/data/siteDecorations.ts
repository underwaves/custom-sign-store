/** Standalone pieces cropped from the 6 artwork sheets in `ของตกแต่ง` (03, 05, 06, 07, 13, 15). */
const piece = (sourceId: string, number: number) =>
  `/decorations/split-user-assets/${sourceId}/${sourceId}-${String(number).padStart(2, '0')}.png`;

export const SITE_DECORATIONS = {
  /** Cute character mascots — used for welcome banners, guides, reviews, auth, and helper callouts */
  mascots: {
    rabbitCute: piece('05', 6),          // Fluffy white bunny holding carrot (Free 0฿ gift, welcome, profile)
    bearPudding: piece('03', 1),         // White bear hugging giant peach pudding (Hero, celebration, featured)
    mascotDonut: piece('03', 7),         // White mascot in donut ring with yellow bow (Categories, popular picks)
    mascotToast: piece('03', 4),         // Cute toast bread with mascot face (Minimal style, Step 1, beginner guide)
    mascotBerryFace: piece('03', 5),     // Strawberry/orange with cute mascot face (Favorites, sweet callouts)
    mascotHeadBerry: piece('03', 8),     // White mascot head with berry on top (FAQ, chat helper, tips)
    mascotEatingBerry: piece('07', 1),   // White mascot happily eating giant berry (Customer reviews, satisfaction)
    bumbleBee: piece('06', 2),           // Cute round bumblebee (Express delivery, order tracking, active status)
    bearPancake: piece('06', 6),         // Bear pancake sandwich with strawberry (Package cards, cozy steps)
    honeyBearBottle: piece('06', 7),     // Honey bear squeeze bottle (Custom text/color form inputs, sweet details)
    bearBun: piece('06', 8),             // Cozy bear bun with strawberry (Card corner buddy, warm notes)
    toastEggSmile: piece('13', 1),       // Smiling toast with fried egg (Start order, login/register, fresh pick)
    chocoStrawberryFace: piece('15', 5), // Chocolate-dipped strawberry with face (Decorative style, special badge)
  },

  /** Cakes, parfaits, pancakes & puddings — used for sign templates, style showcases, packages, and pricing cards */
  sweets: {
    strawberry: piece('06', 1),          // Classic red strawberry
    peach: piece('06', 2),               // Legacy alias (bumblebee/peach set 06)
    berry: piece('07', 3),               // Twin red berries with stem
    fruitOrange: piece('06', 3),         // Strawberry jam splash / warm accent
    miniHeart: piece('05', 3),           // Cute red mini heart
    miniPudding: piece('13', 19),        // Custard pudding with spoon
    custardPuddingSpoon: piece('13', 19), // Custard pudding with spoon (explicit alias)
    pancakeTower: piece('03', 6),        // Stacked pancake & macaron tower (Decorative style, multi-layer work)
    squarePeachCake: piece('03', 9),     // Square peach cake with berry (Square/frame sign templates)
    roundPeachCake: piece('03', 10),     // Round peach cake with berry (Rounded sign templates)
    bowPeachCake: piece('03', 11),       // Peach cake topped with bow (Gift/recommended package)
    strawberryPancake: piece('06', 4),   // Fluffy pancake with big strawberry (Popular sign highlight)
    parfaitCupcake: piece('07', 2),      // Tall cupcake parfait with cherry (Vertical/showcase cards)
    shortcakeSlice: piece('07', 4),      // Strawberry shortcake slice (Sweet pastel theme)
    creamPuffBerry: piece('07', 5),      // Meringue cream puff with berry (Soft minimal/pastel accent)
    berryMacaron: piece('07', 6),        // Cream macaron/dorayaki with berry (Price/tag companion)
    rectBerryCake: piece('07', 7),       // Rectangular berry cake (Banner & header cards)
    twinCreamBuns: piece('07', 8),       // Twin cream buns with berries (Comparison & pair cards)
    whippedCreamDollop: piece('07', 9),  // Whipped cream dollop with berries (Corner frame topping)
    cherryPieTart: piece('13', 10),      // Retro cherry pie tart (Craftsmanship & quality guarantee)
    cherryCreamTart: piece('13', 23),    // Cherry cream tart (Gallery & template details)
    pinkCupcakeStar: piece('15', 10),    // Pink cupcake with face & green star (Decorative style highlight)
    pinkRollCake: piece('15', 11),       // Pink roll cake with strawberry & green star (Sweet blossom theme)
    cherryCustardPudding: piece('15', 15), // Custard pudding with cherry & face (Order summary & reward)
    pinkSyrupPancakes: piece('15', 21),  // Pancake stack with pink syrup & cherries (Multi-item / cart summary)
  },

  /** Cafe drinks & bottles — used for payment/QR signs, cafe shop signs, contact, and refreshing callouts */
  cafe: {
    icedBearCup: piece('13', 4),         // Iced drink cup with bear logo (Shop/cafe signs, payment QR signs)
    cherryMilkCarton: piece('13', 5),    // Cherry milk carton (Product listing, daily fresh shop signs)
    sweetSauceBottle: piece('13', 13),   // Squeeze sauce bottle (Customizing details & toppings)
    glassDrink: piece('13', 18),         // Retro glass drink (Light card accent)
    melonSodaFloat: piece('15', 17),     // Melon soda float with face (Featured showcase, live preview)
  },

  /** Fresh fruits & cute veggies — used for category tags, filter bars, and lively corner pairings */
  fruits: {
    miniPeachBerry: piece('03', 3),      // Mini peach berry
    orangeCarrotDuo: piece('05', 4),     // Orange & carrot duo (Fresh & colorful palette)
    watermelonApple: piece('05', 5),     // Watermelon & apple slice (Vibrant color options)
    veggieDuo: piece('05', 11),          // Broccoli & pink turnip (Variety of props)
    pinkPeachDuo: piece('05', 12),       // Pink peach duo with green leaves (Soft pastel theme)
    jamSplash: piece('06', 3),           // Strawberry jam splash
    honeyDrop: piece('06', 5),           // Golden honey drop
    twinBerries: piece('07', 3),         // Twin red berries
  },

  /** Bows & ribbons — used as top-center or corner pins on frames so cards feel like wrapped stationery gifts */
  bows: {
    pinkBow: piece('07', 10),            // Large coral-pink bow with berry center
    miniBow: piece('03', 2),             // Cute peach-orange striped bow
    cuteRibbon: piece('15', 2),          // Pink ribbon curl flourish
    redRibbonCurl: piece('13', 11),      // Retro red ribbon curl
    redRibbonMini: piece('13', 16),      // Small retro ribbon curl
    pinkRibbonTall: piece('15', 22),     // Tall vertical ribbon wave
  },

  /** Sparkles, stars & clouds — used to balance opposite corners and highlight badges/steps */
  sparkles: {
    starBurst: piece('15', 27),          // Mint green star burst cluster
    starMini: piece('15', 1),            // Mint green single star
    starDuo: piece('13', 3),             // Retro sparkle duo
    sparkleShine: piece('15', 16),       // Pink/mint sparkle shine
    yellowCrossStar: piece('13', 2),     // Retro yellow star
    mintSparkleCluster: piece('15', 19), // Mint & pink sparkle cluster
    skyCloverPuff: piece('05', 2),       // Sky-blue clover/cloud puff
    skyCloudLarge: piece('05', 7),       // Fluffy sky-blue cloud puff
    skyCloudMedium: piece('05', 8),      // Medium sky-blue cloud puff
    redHeartTilt: piece('05', 9),        // Tilted red heart
    redHeartSmall: piece('05', 10),      // Small red heart
  },

  /** Stamps & tiny badges — used next to headings, tags, and card footers */
  badges: {
    stampCircle: piece('15', 3),         // Mint circle stamp
    stampSquare: piece('05', 1),         // Pink sakura flower stamp
    sakuraFlower: piece('05', 13),       // Pink sakura blossom
    heartDot: piece('13', 20),           // Retro heart/dot stamp
    pinkWaveMini: piece('13', 24),       // Mini wave accent
  },
};

export interface CardDecorPreset {
  /** Primary illustration placed in a corner (e.g. top-right or bottom-right) */
  primary: string;
  /** Pin or bow placed at the top corner or header badge */
  pin: string;
  /** Small secondary sparkle/flower/heart in the opposite corner for balance */
  secondary: string;
  /** Short Thai label explaining the thematic mood (for alt/accessibility or subtle tag) */
  themeLabel: string;
}

/**
 * Purposeful rotating decoration presets for Category / Product cards:
 * Each category gets a matching visual story (e.g. Shop/Payment -> Iced Bear Cup, Price tag -> Peach Cake, Name tag -> Mascot Donut, etc.)
 */
export const CATEGORY_DECOR_PRESETS: CardDecorPreset[] = [
  {
    primary: SITE_DECORATIONS.cafe.icedBearCup,
    pin: SITE_DECORATIONS.bows.miniBow,
    secondary: SITE_DECORATIONS.sparkles.starMini,
    themeLabel: 'ธีมคาเฟ่ & ร้านค้า',
  },
  {
    primary: SITE_DECORATIONS.mascots.mascotDonut,
    pin: SITE_DECORATIONS.bows.pinkBow,
    secondary: SITE_DECORATIONS.badges.stampSquare,
    themeLabel: 'ธีมป้ายสุดคิวท์',
  },
  {
    primary: SITE_DECORATIONS.sweets.bowPeachCake,
    pin: SITE_DECORATIONS.sparkles.skyCloudLarge,
    secondary: SITE_DECORATIONS.sweets.miniHeart,
    themeLabel: 'ธีมหวานละมุน',
  },
  {
    primary: SITE_DECORATIONS.mascots.honeyBearBottle,
    pin: SITE_DECORATIONS.bows.cuteRibbon,
    secondary: SITE_DECORATIONS.fruits.miniPeachBerry,
    themeLabel: 'ธีมคัสตอมจัดเต็ม',
  },
  {
    primary: SITE_DECORATIONS.sweets.pinkRollCake,
    pin: SITE_DECORATIONS.bows.miniBow,
    secondary: SITE_DECORATIONS.sparkles.starBurst,
    themeLabel: 'ธีมพาสเทลสดใส',
  },
  {
    primary: SITE_DECORATIONS.cafe.cherryMilkCarton,
    pin: SITE_DECORATIONS.badges.stampSquare,
    secondary: SITE_DECORATIONS.sparkles.yellowCrossStar,
    themeLabel: 'ธีมป้ายเมนู & ราคา',
  },
  {
    primary: SITE_DECORATIONS.mascots.bearPancake,
    pin: SITE_DECORATIONS.bows.pinkBow,
    secondary: SITE_DECORATIONS.fruits.honeyDrop,
    themeLabel: 'ธีมโฮมมี่อบอุ่น',
  },
  {
    primary: SITE_DECORATIONS.sweets.parfaitCupcake,
    pin: SITE_DECORATIONS.sparkles.skyCloverPuff,
    secondary: SITE_DECORATIONS.sparkles.redHeartTilt,
    themeLabel: 'ธีมป้ายพรีเมียม',
  },
];

/**
 * Purposeful presets for the 4 Recommended Sign Packages / Tiers
 */
export const PACKAGE_DECOR_PRESETS: CardDecorPreset[] = [
  {
    // Package 1: Starter / Minimal compact sign -> Cute Toast Mascot + Mini Bow
    primary: SITE_DECORATIONS.mascots.mascotToast,
    pin: SITE_DECORATIONS.bows.miniBow,
    secondary: SITE_DECORATIONS.sparkles.skyCloverPuff,
    themeLabel: 'เซตเริ่มต้นคลีนใส',
  },
  {
    // Package 2: Popular Sweet Pastel sign -> Round Peach Cake + Sakura Stamp
    primary: SITE_DECORATIONS.sweets.roundPeachCake,
    pin: SITE_DECORATIONS.badges.stampSquare,
    secondary: SITE_DECORATIONS.sweets.miniHeart,
    themeLabel: 'เซตยอดฮิตพาสเทล',
  },
  {
    // Package 3: Full Decorative Cafe/Shop sign -> Pancake Tower + Pink Bow
    primary: SITE_DECORATIONS.sweets.pancakeTower,
    pin: SITE_DECORATIONS.bows.pinkBow,
    secondary: SITE_DECORATIONS.sparkles.starMini,
    themeLabel: 'เซตตกแต่งจัดเต็ม',
  },
  {
    // Package 4: Special Custom / Multi-purpose -> Bear hugging Pudding + Star Burst
    primary: SITE_DECORATIONS.mascots.bearPudding,
    pin: SITE_DECORATIONS.sparkles.starBurst,
    secondary: SITE_DECORATIONS.fruits.pinkPeachDuo,
    themeLabel: 'เซตพรีเมียมคุ้มค่า',
  },
];

/**
 * Purposeful presets for Step-by-Step guides (How to Order / Wizard Steps)
 */
export const STEP_DECOR_PRESETS: CardDecorPreset[] = [
  {
    // Step 1: Choose Category -> Smiling Toast with Egg (Fresh start)
    primary: SITE_DECORATIONS.mascots.toastEggSmile,
    pin: SITE_DECORATIONS.bows.miniBow,
    secondary: SITE_DECORATIONS.sparkles.yellowCrossStar,
    themeLabel: 'เริ่มเลือกแบบป้าย',
  },
  {
    // Step 2: Choose Style & Template -> Pink Cupcake with Star (Design & Style)
    primary: SITE_DECORATIONS.sweets.pinkCupcakeStar,
    pin: SITE_DECORATIONS.bows.pinkBow,
    secondary: SITE_DECORATIONS.sparkles.starMini,
    themeLabel: 'เลือกโทนและเทมเพลต',
  },
  {
    // Step 3: Pick Free 0฿ Decorations -> Cute Bunny holding Carrot (Free gift)
    primary: SITE_DECORATIONS.mascots.rabbitCute,
    pin: SITE_DECORATIONS.badges.stampSquare,
    secondary: SITE_DECORATIONS.sparkles.skyCloudLarge,
    themeLabel: 'เลือกของตกแต่งฟรี 0฿',
  },
  {
    // Step 4: Fill Details & Confirm -> Melon Soda Float / Honey Bear (Sweet finish)
    primary: SITE_DECORATIONS.cafe.melonSodaFloat,
    pin: SITE_DECORATIONS.bows.cuteRibbon,
    secondary: SITE_DECORATIONS.sweets.miniHeart,
    themeLabel: 'กรอกข้อมูล & ยืนยัน',
  },
];

/**
 * Purposeful presets for Highlights / Why Choose Us cards
 */
export const HIGHLIGHT_DECOR_PRESETS: CardDecorPreset[] = [
  {
    // Highlight 1: Free 0฿ Decorations -> Cute Bunny + Bow
    primary: SITE_DECORATIONS.mascots.rabbitCute,
    pin: SITE_DECORATIONS.bows.pinkBow,
    secondary: SITE_DECORATIONS.sweets.miniHeart,
    themeLabel: 'ฟรีของตกแต่งทุกชิ้น',
  },
  {
    // Highlight 2: Clear Transparent Pricing -> Custard Pudding with Spoon + Star
    primary: SITE_DECORATIONS.sweets.custardPuddingSpoon,
    pin: SITE_DECORATIONS.sparkles.starMini,
    secondary: SITE_DECORATIONS.badges.stampCircle,
    themeLabel: 'ราคาชัดเจนไม่บวกเพิ่ม',
  },
  {
    // Highlight 3: Easy Step-by-Step Wizard -> Honey Bear Bottle + Mini Bow
    primary: SITE_DECORATIONS.mascots.honeyBearBottle,
    pin: SITE_DECORATIONS.bows.miniBow,
    secondary: SITE_DECORATIONS.fruits.honeyDrop,
    themeLabel: 'สั่งง่ายทีละขั้นตอน',
  },
  {
    // Highlight 4: Fast Tracking & Care -> Cute Bumblebee + Cloud Puff
    primary: SITE_DECORATIONS.mascots.bumbleBee,
    pin: SITE_DECORATIONS.sparkles.skyCloudLarge,
    secondary: SITE_DECORATIONS.badges.stampSquare,
    themeLabel: 'เช็กสถานะได้ตลอด',
  },
];

/**
 * Purposeful presets for Customer Review cards
 */
export const REVIEW_DECOR_PRESETS: CardDecorPreset[] = [
  {
    primary: SITE_DECORATIONS.mascots.mascotEatingBerry,
    pin: SITE_DECORATIONS.bows.pinkBow,
    secondary: SITE_DECORATIONS.sweets.miniHeart,
    themeLabel: 'รีวิวความประทับใจ',
  },
  {
    primary: SITE_DECORATIONS.mascots.chocoStrawberryFace,
    pin: SITE_DECORATIONS.badges.stampSquare,
    secondary: SITE_DECORATIONS.sparkles.starMini,
    themeLabel: 'งานจริงสีหวานตรงปก',
  },
  {
    primary: SITE_DECORATIONS.mascots.bearBun,
    pin: SITE_DECORATIONS.bows.miniBow,
    secondary: SITE_DECORATIONS.sparkles.redHeartTilt,
    themeLabel: 'แม่ค้าแนะนำดีมาก',
  },
];

/**
 * Rotating accents for Template Gallery cards so every template card frame looks lively
 */
export const TEMPLATE_CARD_ACCENTS = [
  { corner: SITE_DECORATIONS.bows.miniBow, badge: SITE_DECORATIONS.sweets.strawberry },
  { corner: SITE_DECORATIONS.badges.stampSquare, badge: SITE_DECORATIONS.fruits.miniPeachBerry },
  { corner: SITE_DECORATIONS.sparkles.starMini, badge: SITE_DECORATIONS.sweets.berryMacaron },
  { corner: SITE_DECORATIONS.sparkles.skyCloverPuff, badge: SITE_DECORATIONS.sweets.creamPuffBerry },
  { corner: SITE_DECORATIONS.bows.pinkBow, badge: SITE_DECORATIONS.sweets.shortcakeSlice },
  { corner: SITE_DECORATIONS.sparkles.yellowCrossStar, badge: SITE_DECORATIONS.sweets.miniPudding },
  { corner: SITE_DECORATIONS.sweets.miniHeart, badge: SITE_DECORATIONS.mascots.mascotBerryFace },
  { corner: SITE_DECORATIONS.badges.stampCircle, badge: SITE_DECORATIONS.sweets.pinkCupcakeStar },
];
