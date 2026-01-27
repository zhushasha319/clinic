"use server";
import { ServerActionResponse, DepartmentData, BannerImageData } from "@/types";
import prisma from "@/db/prisma";

interface GetDepartmentData {
  departments: DepartmentData[];
}

/** 获取全部科室并按创建时间排序，返回标准响应。 */
export async function getDepartments(): Promise<
  ServerActionResponse<GetDepartmentData>
> {
  try {
    // 尝试从数据库获取所有科室
    // 结果按 createdAt 升序排列
    const departments = await prisma.department.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    // 查询成功后返回成功响应
    return {
      success: true,
      data: { departments },
      message: "科室获取成功。",
    };
  } catch (error) {
    // 记录错误以便排查
    console.error("获取科室出错：", error);

    // If an error occurs, return a failure response
    return {
      success: false,
      message: "获取科室失败",
      error:
        error instanceof Error
          ? error.message
          : "获取科室时发生未知错误",
      errorType: "SERVER_ERROR",
    };
  }
}

interface BannerResponse {
  banners: BannerImageData[];
}

/** 拉取 Banner 列表并按排序字段升序返回。 */
export async function getBanners(): Promise<
  ServerActionResponse<BannerResponse>
> {
  try {
    // 获取 BannerImage 表的所有记录。
    // orderBy 确保按顺序返回 Banner
    // 按 order 字段从小到大排序。
    const banners = await prisma.bannerImage.findMany({
      orderBy: {
        order: "asc",
      },
    });

    // 返回包含数据的标准成功响应。
    return {
      success: true,
      data: { banners },
      message: "Banner 图片获取成功。",
    };
  } catch (error) {
    // 将具体错误写入服务端日志以便排查。
    console.error("获取 Banner 出错：", error);

    // 生成返回给客户端的错误信息。
    const errorMessage =
      error instanceof Error ? error.message : "发生意外错误。";

    // 返回标准错误响应。
    return {
      success: false,
      message: "获取 Banner 图片失败，请稍后再试。",
      error: errorMessage,
      errorType: "SERVER_ERROR",
    };
  }
}

