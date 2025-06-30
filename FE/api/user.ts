import axiosInstance from '@/api/axiosInstance';
export const getUserProfile = async () => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
};

export const updateUserProfile = async (data: any) => {
    const response = await axiosInstance.put('/users/me', data);
    return response.data;
};