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
  
  const responseData = response.data.data
  if (responseData.content) {
    responseData.content = responseData.content.map((post: any) => {
      if (post.likedByUser !== undefined && post.isLikedByUser === undefined) {
        post.isLikedByUser = post.likedByUser
      }
      return post
    })
  }
  
  return responseData
}

export const getPostsByUserInterests = async (page = 0, size = 10): Promise<PageResponse<PostResponse>> => {
  const response = await axiosInstance.get('/api/community/posts/my-interests', {
    params: { page, size }
  })
  
  // Java boolean 필드 매핑 수정
  const responseData = response.data.data
  if (responseData.content) {
    responseData.content = responseData.content.map((post: any) => {
      if (post.likedByUser !== undefined && post.isLikedByUser === undefined) {
        post.isLikedByUser = post.likedByUser
      }
      return post
    })
  }
  
  return responseData
}

export const getPostsByStock = async (stockCode: string, page = 0, size = 10): Promise<PageResponse<PostResponse>> => {
  const response = await axiosInstance.get(`/api/community/posts/stock/${stockCode}`, {
    params: { page, size }
  })
  
  const responseData = response.data.data
  if (responseData.content) {
    responseData.content = responseData.content.map((post: any) => {
      if (post.likedByUser !== undefined && post.isLikedByUser === undefined) {
        post.isLikedByUser = post.likedByUser
      }
      return post
    })
  }
  
  return responseData
}

export const searchPosts = async (keyword: string, page = 0, size = 10): Promise<PageResponse<PostResponse>> => {
  const response = await axiosInstance.get('/api/community/posts/search', {
    params: { keyword, page, size }
  })
  
  const responseData = response.data.data
  if (responseData.content) {
    responseData.content = responseData.content.map((post: any) => {
      if (post.likedByUser !== undefined && post.isLikedByUser === undefined) {
        post.isLikedByUser = post.likedByUser
      }
      return post
    })
  }
  
  return responseData
}

export const updatePost = async (postId: number, data: PostCreateRequest): Promise<PostResponse> => {
  const response = await axiosInstance.put(`/api/community/posts/${postId}`, data)
  return response.data.data
}

export const deletePost = async (postId: number): Promise<void> => {
  await axiosInstance.delete(`/api/community/posts/${postId}`)
}

export const togglePostLike = async (postId: number): Promise<PostResponse> => {
  const response = await axiosInstance.post(`/api/community/posts/${postId}/like`)
  
  // Java boolean 필드가 JSON으로 변환될 때 isLikedByUser -> likedByUser로 변환될 수 있음
  const responseData = response.data.data
  if (responseData.likedByUser !== undefined && responseData.isLikedByUser === undefined) {
    responseData.isLikedByUser = responseData.likedByUser
  }
  
  return responseData
}

export const getUserFavoriteStocks = async (): Promise<FavoriteStock[]> => {
  const response = await axiosInstance.get('/api/community/user/favorite-stocks')
  return response.data.data
}

export const getRecentActivePosts = async () => {
  const response = await axiosInstance.get('/api/community/recent-active');
  return response.data;
};

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