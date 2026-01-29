export const bannerImageData = [
  {
    id: "banner-1",
    name: "Main Welcome Banner",
    imageUrl: "/images/banner/banner1.jpg",
  },
];

// -----------------------------------------------------------------------------
// 科室板块的数据
// -----------------------------------------------------------------------------
export const departmentData = [
  {
    id: "dept-cardiology",
    name: "心内科",
    iconName: "Heart",
    description: "专注心血管疾病的诊断、治疗与长期管理。",
    aliases: ["心脏科"],
  },
  {
    id: "dept-neurology",
    name: "神经内科",
    iconName: "Brain",
    description: "覆盖头痛、眩晕、癫痫及神经系统疾病评估。",
    aliases: ["神经科"],
  },
  {
    id: "dept-pediatrics",
    name: "儿科",
    iconName: "Baby",
    description: "提供儿童常见病、多发病的诊疗与健康管理。",
  },
  {
    id: "dept-orthopedics",
    name: "骨科",
    iconName: "Bone",
    description: "针对骨关节损伤、运动损伤与康复提供服务。",
  },
  {
    id: "dept-dermatology",
    name: "皮肤科",
    iconName: "Sparkles",
    description: "皮肤问题、过敏与皮肤健康管理的专业门诊。",
  },
  {
    id: "dept-ophthalmology",
    name: "眼科",
    iconName: "Eye",
    description: "视力检查、眼部疾病诊疗与日常护眼指导。",
  },
];

// -----------------------------------------------------------------------------
// “我们的医生”板块的数据
// 这里将用户与资料信息合并为简化对象。
// -----------------------------------------------------------------------------
export const doctorData = [
  {
    id: "doc-1",
    name: "王静宁",
    specialty: "心内科",
    rating: 4.9,
    reviewCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZG9jdG9yfGVufDB8fDB8fHww",
  },
  {
    id: "doc-2",
    name: "赵昊宇",
    specialty: "神经内科",
    rating: 4.8,
    reviewCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZG9jdG9yfGVufDB8fDB8fHww",
  },
  {
    id: "doc-3",
    name: "林可儿",
    specialty: "儿科",
    rating: 4.9,
    reviewCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGRvY3RvcnxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: "doc-4",
    name: "周明远",
    specialty: "骨科",
    rating: 4.7,
    reviewCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8ZG9jdG9yfGVufDB8fDB8fHww",
  },
  {
    id: "doc-5",
    name: "陈雅诗",
    specialty: "皮肤科",
    rating: 4.8,
    reviewCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGRvY3RvcnxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: "doc-6",
    name: "许泽川",
    specialty: "眼科",
    rating: 4.9,
    reviewCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGRvY3RvcnxlbnwwfHwwfHx8MA%3D%3D",
  },
];

// -----------------------------------------------------------------------------
// 患者评价板块的数据
// -----------------------------------------------------------------------------

const reviewDates = [
  "2025-12-18",
  "2025-12-10",
  "2025-12-02",
  "2025-11-24",
  "2025-11-16",
  "2025-11-08",
  "2025-10-30",
  "2025-10-22",
  "2025-10-14",
  "2025-10-06",
];

const testimonialTemplates = [
  {
    patientName: "刘女士",
    rating: 5,
    testimonialText: "医生解释很清楚，治疗方案也很安心。",
    patientImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    patientName: "张先生",
    rating: 5,
    testimonialText: "沟通耐心，检查细致，整体体验很好。",
    patientImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
  },
  {
    patientName: "王阿姨",
    rating: 5,
    testimonialText: "复诊安排合理，恢复情况明显改善。",
    patientImage:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
  },
  {
    patientName: "周同学",
    rating: 4,
    testimonialText: "诊断专业，给的建议很实用。",
    patientImage:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
  },
  {
    patientName: "林女士",
    rating: 5,
    testimonialText: "护士与医生配合到位，流程顺畅。",
    patientImage:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
  },
  {
    patientName: "赵先生",
    rating: 5,
    testimonialText: "医生态度好，问题都能及时解答。",
    patientImage:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFufGVufDB8fDB8fHww",
  },
  {
    patientName: "何女士",
    rating: 4,
    testimonialText: "就诊体验整体不错，诊室环境干净。",
    patientImage:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
  },
  {
    patientName: "孙女士",
    rating: 5,
    testimonialText: "治疗效果好，复诊安排很贴心。",
    patientImage:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
  },
  {
    patientName: "吴先生",
    rating: 5,
    testimonialText: "医生很专业，检查结果解释得很清楚。",
    patientImage:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFufGVufDB8fDB8fHww",
  },
  {
    patientName: "郑女士",
    rating: 5,
    testimonialText: "细致耐心，建议具体可执行。",
    patientImage:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
  },
];

export const testimonialData = doctorData.flatMap((doctor) =>
  testimonialTemplates.map((template, index) => ({
    id: `review-${doctor.id}-${index + 1}`,
    doctorId: doctor.id,
    doctorName: doctor.name,
    rating: template.rating,
    testimonialText: template.testimonialText,
    reviewDate: reviewDates[index],
    patientName: template.patientName,
    patientImage: template.patientImage,
  }))
);

// -----------------------------------------------------------------------------
// 主导出：汇总所有模拟数据，便于统一引入。
// 也可按上方示例分别导出各个常量。
// -----------------------------------------------------------------------------
const allDummyData = {
  banners: bannerImageData,
  departments: departmentData,
  doctors: doctorData,
  testimonials: testimonialData,
};

export default allDummyData;


