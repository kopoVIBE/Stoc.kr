import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 개선된 시간 포맷팅 함수
export const formatTimeAgo = (dateString: string): string => {
  try {
    const now = new Date()
    const publishedDate = new Date(dateString)
    
    // 유효한 날짜인지 확인
    if (isNaN(publishedDate.getTime())) {
      return "시간 정보 없음"
    }
    
    const diffInMs = now.getTime() - publishedDate.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    
    // 음수 시간 차이 처리 (미래 시간)
    if (diffInMinutes < 0) {
      return "방금 전"
    }
    
    // 1분 미만
    if (diffInMinutes < 1) {
      return "방금 전"
    }
    
    // 1시간 미만
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    }
    
    // 1일 미만
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}시간 전`
    }
    
    // 1주일 미만
    if (diffInMinutes < 10080) {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days}일 전`
    }
    
    // 1개월 미만
    if (diffInMinutes < 43200) {
      const weeks = Math.floor(diffInMinutes / 10080)
      return `${weeks}주 전`
    }
    
    // 1년 미만
    if (diffInMinutes < 525600) {
      const months = Math.floor(diffInMinutes / 43200)
      return `${months}개월 전`
    }
    
    // 1년 이상
    const years = Math.floor(diffInMinutes / 525600)
    return `${years}년 전`
    
  } catch (error) {
    console.error("시간 포맷팅 에러:", error)
    return "시간 정보 없음"
  }
}
