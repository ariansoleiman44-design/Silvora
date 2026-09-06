import type { ProcessStep } from "@/data/process";

/**
 * «من الحقل إلى العلف» — العربية.
 * Structure (index, image) comes from data/process.ts; only the prose
 * is translated here, and the order must match one-for-one.
 */
export const processStepsAr: ProcessStep[] = [
  {
    index: 1,
    title: "الزراعة",
    summary: "الذرة المناسبة في التربة المناسبة.",
    detail:
      "جودة السيلاج تُحسم في الحقل. اختيار المحصول وكثافة الزراعة والعناية بالتربة تضع سقف كل ما يأتي بعدها.",
    image: "seedling",
  },
  {
    index: 2,
    title: "الحصاد",
    summary: "القطع في اللحظة التي ينضج فيها النبات.",
    detail:
      "التوقيت يوازن بين الغلّة والنشا والرطوبة. والحصاد داخل النافذة المستهدفة هو ما يجعل البالة تتخمّر بنظافة.",
    image: "harvester",
  },
  {
    index: 3,
    title: "الفرم",
    summary: "قصير، متجانس، ثابت.",
    detail: "الفرم القصير المتساوي يُكبس أشدّ، ويتخمّر أسرع، ويختلط بانتظام في العليقة.",
    image: "harvesterHead",
  },
  {
    index: 4,
    title: "الكبس",
    summary: "أخرج الهواء.",
    detail:
      "الكثافة حماية. كل بالة تُكبس لطرد الأكسجين، فيبدأ التخمّر سريعًا ولا يجد الفساد موضعًا يبدأ منه.",
    image: "compaction",
  },
  {
    index: 5,
    title: "التغليف",
    summary: "أحكمها، طبقة فوق طبقة.",
    detail:
      "طبقات متعدّدة من الغشاء المطاطي تُحكم البالة ضد الهواء والماء، وتبقى محكمة خلال المناولة.",
    image: "baleClose",
  },
  {
    index: 6,
    title: "التخمّر",
    summary: "دع المحصول يحفظ نفسه.",
    detail:
      "مُحكمة ودون إزعاج، يخفض التخمّر الطبيعي الحموضة ويثبّت القيمة الغذائية للمحصول.",
    image: "balesBlack",
  },
  {
    index: 7,
    title: "التوصيل",
    summary: "حمولات مخطّطة، ومناولة حذرة.",
    detail: "تُحمَّل البالات بثبات وتُسلَّم وفق جدول يوافق طريقة تغذيتك.",
    image: "tractorTrailer",
  },
  {
    index: 8,
    title: "التغذية",
    summary: "افتح بالة تشبه سابقتها.",
    detail: "ثبات الفرم والكثافة والتخمّر يعني أن العليقة تتصرّف بالطريقة نفسها كل يوم.",
    image: "dairyBarn",
  },
];
