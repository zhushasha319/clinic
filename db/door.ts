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
  { id: "dept-cardiology", name: "心脏科", iconName: "Heart" },
  { id: "dept-neurology", name: "神经科", iconName: "Brain" },
  { id: "dept-pediatrics", name: "儿科", iconName: "Baby" },
  { id: "dept-orthopedics", name: "骨科", iconName: "Bone" },
  { id: "dept-dermatology", name: "皮肤科", iconName: "Sparkles" },
  { id: "dept-ophthalmology", name: "眼科", iconName: "Eye" },
];

// -----------------------------------------------------------------------------
// “我们的医生”板块的数据
// 这里将用户与资料信息合并为简化对象。
// -----------------------------------------------------------------------------
export const doctorData = [
  {
    id: "doc-1",
    name: "Dr. Evelyn Reed",
    specialty: "心脏科",
    rating: 4.8,
    reviewCount: 156,
    imageUrl:
      "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZG9jdG9yfGVufDB8fDB8fHww",
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Thorne",
    specialty: "神经科",
    rating: 4.9,
    reviewCount: 212,
    imageUrl:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZG9jdG9yfGVufDB8fDB8fHww",
  },
  {
    id: "doc-3",
    name: "Dr. Lena Petrova",
    specialty: "儿科",
    rating: 4.7,
    reviewCount: 189,
    imageUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZG9jdG9yfGVufDB8fDB8fHww",
  },
];

// -----------------------------------------------------------------------------
// 患者评价板块的数据
// -----------------------------------------------------------------------------

export const testimonialData = [
  {
    id: "review-1",
    patientName: "John Doe",
    rating: 5,
    testimonialText:
      "Dr. Reed is an exceptional cardiologist. She took the time to explain my condition thoroughly and created a treatment plan that worked perfectly for me.",
    reviewDate: "March 15, 2024",
    patientImage:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGpvaG58ZW58MHx8MHx8fDA%3D",
  },
  {
    id: "review-2",
    patientName: "Alice Johnson",
    rating: 5,
    testimonialText:
      "Dr. Thorne's expertise in neurology is unmatched. He was patient, insightful, and helped me understand my treatment options clearly. Highly recommended!",
    reviewDate: "February 28, 2024",
    patientImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: "review-3",
    patientName: "Sam Wilson",
    rating: 5,
    testimonialText:
      "Dr. Petrova is wonderful with kids. My son felt completely at ease during his check-up. We are so glad to have found her.",
    reviewDate: "January 10, 2024",
    patientImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
  },
];

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


