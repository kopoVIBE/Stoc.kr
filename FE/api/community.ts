import axiosInstance from './axiosInstance'

export interface PostResponse {
  id: number
  title: string
  content: string
  authorNickname: string
  stockCode: string
  stockName: string
  likes: number
  commentCount: number
  isLikedByUser: boolean
  createdAt: string
  updatedAt: string
}

export interface CommentResponse {
  id: number
  content: string
  authorNickname: string
  createdAt: string
  updatedAt: string
}

export interface PostCreateRequest {
  title: string
  content: string
  stockCode?: string
  stockName?: string
}

export interface CommentCreateRequest {
  content: string
}

export interface FavoriteStock {
  code: string
  name: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// 게시글 API
export const createPost = async (data: PostCreateRequest): Promise<PostResponse> => {
  const response = await axiosInstance.post('/api/community/posts', data)
  return response.data.data
}

export const getAllPosts = async (page = 0, size = 10): Promise<PageResponse<PostResponse>> => {
  const response = await axiosInstance.get('/api/community/posts', {
    params: { page, size }
  })
  return response.data.data
}

export const getPostsByUserInterests = async (page = 0, size = 10): Promise<PageResponse<PostResponse>> => {
  const response = await axiosInstance.get('/api/community/posts/my-interests', {
    params: { page, size }
  })
  return response.data.data
}

export const getPostsByStock = async (stockCode: string, page = 0, size = 10): Promise<PageResponse<PostResponse>> => {
  const response = await axiosInstance.get(`/api/community/posts/stock/${stockCode}`, {
    params: { page, size }
  })
  return response.data.data
}

export const searchPosts = async (keyword: string, page = 0, size = 10): Promise<PageResponse<PostResponse>> => {
  const response = await axiosInstance.get('/api/community/posts/search', {
    params: { keyword, page, size }
  })
  return response.data.data
}

export const updatePost = async (postId: number, data: PostCreateRequest): Promise<PostResponse> => {
  const response = await axiosInstance.put(`/api/community/posts/${postId}`, data)
  return response.data.data
}

export const deletePost = async (postId: number): Promise<void> => {
  await axiosInstance.delete(`/api/community/posts/${postId}`)
}

export const togglePostLike = async (postId: number): Promise<PostResponse> => {
  console.log("좋아요 API 호출 - postId:", postId)
  const response = await axiosInstance.post(`/api/community/posts/${postId}/like`)
  console.log("좋아요 API 응답:", response.data)
  console.log("좋아요 API 응답 데이터:", response.data.data)
  return response.data.data
}

export const getUserFavoriteStocks = async (): Promise<FavoriteStock[]> => {
  const response = await axiosInstance.get('/api/community/user/favorite-stocks')
  return response.data.data
}

// 댓글 API
export const createComment = async (postId: number, data: CommentCreateRequest): Promise<CommentResponse> => {
  const response = await axiosInstance.post(`/api/community/posts/${postId}/comments`, data)
  return response.data.data
}

export const getCommentsByPost = async (postId: number): Promise<CommentResponse[]> => {
  const response = await axiosInstance.get(`/api/community/posts/${postId}/comments`)
  return response.data.data
}

export const updateComment = async (commentId: number, data: CommentCreateRequest): Promise<CommentResponse> => {
  const response = await axiosInstance.put(`/api/community/comments/${commentId}`, data)
  return response.data.data
}

export const deleteComment = async (commentId: number): Promise<void> => {
  await axiosInstance.delete(`/api/community/comments/${commentId}`)
} 