import axiosInstance from './axiosInstance'

export interface NewsResponse {
  id: string
  title: string
  content: string
  source: string
  category: string[]
  url: string
  publishedAt: string
  crawledAt: string
}

// 모든 뉴스 조회
export const getAllNews = async (): Promise<NewsResponse[]> => {
  try {
    const response = await axiosInstance.get('/api/news')
    return response.data
  } catch (error) {
    console.error('뉴스 조회 실패:', error)
    throw error
  }
}

// 키워드로 뉴스 검색
export const searchNews = async (keyword: string): Promise<NewsResponse[]> => {
  try {
    const response = await axiosInstance.get('/api/news/search', {
      params: { keyword }
    })
    return response.data
  } catch (error) {
    console.error('뉴스 검색 실패:', error)
    throw error
  }
} 