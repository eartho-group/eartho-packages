import { useState } from 'react';
import apiService from './api.service';
import { getSession } from 'next-auth/react';

const FileService = () => {
  const [isLoading, setIsLoading] = useState(false);

  const uploadFile = async (file: string | Blob) => {
    const session = await getSession()
    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);

    try {
      const data = await apiService.file('/files/',
        formData, {
        accessToken: session?.accessToken
      }
      )
      setTimeout(() => setIsLoading(false), 500);
      return data.url[0];
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsLoading(false);
      throw error; // Rethrow the error if needed
    }
  };

  return { uploadFile, isLoading };
};

export default FileService;
