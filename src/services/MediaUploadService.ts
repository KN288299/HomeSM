import axios, { AxiosProgressEvent } from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '../config/api';

interface UploadOptions {
  token: string;
  onProgress?: (progress: number) => void;
  onRetry?: (attempt: number, maxAttempts: number) => void;
  maxRetries?: number;
  timeout?: number;
  retryDelay?: number;
}

interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  attempts?: number;
}

class MediaUploadService {
  private static instance: MediaUploadService;
  private uploadQueue: Map<string, Promise<UploadResult>> = new Map();

  static getInstance(): MediaUploadService {
    if (!MediaUploadService.instance) {
      MediaUploadService.instance = new MediaUploadService();
    }
    return MediaUploadService.instance;
  }

  // 检查网络连接状态
  private async checkNetworkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.warn('网络连接检查失败:', error);
      return false;
    }
  }

  // 等待网络恢复
  private async waitForNetwork(maxWait: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      if (await this.checkNetworkConnection()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  }

  // 通用上传方法
  private async uploadWithRetry(
    endpoint: string,
    formData: FormData,
    options: UploadOptions
  ): Promise<UploadResult> {
    const {
      token,
      onProgress,
      onRetry,
      maxRetries = 3,
      timeout = 30000,
      retryDelay = 2000
    } = options;

    let lastError: any = null;
    let attempts = 0;

    // 首先检查网络连接
    if (!(await this.checkNetworkConnection())) {
      console.log('网络未连接，等待网络恢复...');
      if (!(await this.waitForNetwork())) {
        return {
          success: false,
          error: '网络连接不可用，请检查您的网络设置',
          attempts
        };
      }
    }

    for (attempts = 1; attempts <= maxRetries; attempts++) {
      try {
        console.log(`📤 开始第${attempts}次上传尝试...`);

        if (attempts > 1 && onRetry) {
          onRetry(attempts, maxRetries);
        }

        // 为每次重试调整超时时间
        const currentTimeout = timeout + (attempts - 1) * 10000;

        const response = await axios.post(`${BASE_URL}${endpoint}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: currentTimeout,
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          }
        });

        if (response.data && response.status === 200) {
          console.log(`✅ 第${attempts}次上传成功`);
          return {
            success: true,
            url: response.data.audioUrl || response.data.imageUrl || response.data.videoUrl,
            filename: response.data.fileName,
            attempts
          };
        } else {
          throw new Error(`服务器返回错误状态: ${response.status}`);
        }

      } catch (error: any) {
        lastError = error;
        console.error(`❌ 第${attempts}次上传失败:`, error.message);

        // 检查是否是网络错误
        if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !error.response) {
          console.log('检测到网络错误，检查连接状态...');
          if (!(await this.checkNetworkConnection())) {
            console.log('网络断开，等待恢复...');
            await this.waitForNetwork(10000); // 等待10秒
          }
        }

        // 如果不是最后一次尝试，等待后重试
        if (attempts < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempts - 1); // 指数退避
          console.log(`⏱️ ${delay}ms后进行第${attempts + 1}次重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: this.getErrorMessage(lastError),
      attempts
    };
  }

  // 获取友好的错误信息
  private getErrorMessage(error: any): string {
    if (!error) return '未知错误';

    if (error.code === 'ECONNABORTED') {
      return '上传超时，请检查网络连接';
    }

    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return '网络连接失败，请检查网络设置';
    }

    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 400:
          return '文件格式不正确或文件损坏';
        case 401:
          return '认证失败，请重新登录';
        case 413:
          return '文件太大，请选择较小的文件';
        case 500:
          return '服务器内部错误，请稍后重试';
        default:
          return `服务器错误 (${status})`;
      }
    }

    return error.message || '上传失败';
  }

  // 预处理文件URI
  private processFileUri(uri: string): string {
    // 为提升兼容性，保持原始scheme。多数RN环境与服务器均能接受包含 file:// 的路径。
    // 某些老设备/库要求去掉 file://，如后续发现问题可按需在调用点传入已处理路径。
    return uri;
  }

  // 上传语音文件
  async uploadVoice(
    audioUri: string, 
    duration: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const uploadId = `voice_${Date.now()}`;
    
    // 防止重复上传
    if (this.uploadQueue.has(uploadId)) {
      return this.uploadQueue.get(uploadId)!;
    }

    const uploadPromise = this.performVoiceUpload(audioUri, duration, options);
    this.uploadQueue.set(uploadId, uploadPromise);

    try {
      const result = await uploadPromise;
      return result;
    } finally {
      this.uploadQueue.delete(uploadId);
    }
  }

  private async performVoiceUpload(
    audioUri: string,
    duration: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // 验证音频URI
      if (!audioUri || audioUri === 'Already recording') {
        throw new Error('无效的音频文件路径');
      }

      const formData = new FormData();
      const fileName = audioUri.split('/').pop() || `voice_message_${Date.now()}.mp3`;
      
      // 🎵 智能音频类型检测和MIME类型设置
      let mimeType = 'audio/mp3'; // 默认值
      const fileExtension = fileName.toLowerCase();
      
      if (fileExtension.includes('.m4a')) {
        mimeType = 'audio/m4a';
      } else if (fileExtension.includes('.mp3')) {
        mimeType = 'audio/mpeg'; // 标准MIME类型
      } else if (fileExtension.includes('.wav')) {
        mimeType = 'audio/wav';
      } else if (fileExtension.includes('.aac')) {
        mimeType = 'audio/aac';
      } else if (fileExtension.includes('.mp4')) {
        mimeType = 'audio/mp4'; // iOS可能使用的格式
      }
      
      // 平台特定优化
      if (Platform.OS === 'ios' && mimeType === 'audio/mp3') {
        // iOS通常不会生成mp3，如果检测到可能是命名错误
        console.warn('⚠️ iOS设备生成了MP3文件，这可能不正常');
      } else if (Platform.OS === 'android' && mimeType === 'audio/m4a') {
        // Android发送m4a也是可能的，但不常见
        console.log('📱 Android设备发送M4A文件');
      }
      
      console.log('📝 构造语音上传FormData:', {
        uri: audioUri,
        fileName,
        mimeType,
        duration
      });
      
      formData.append('audio', {
        uri: this.processFileUri(audioUri),
        type: mimeType,
        name: fileName
      } as any);

      // 可选：添加时长信息
      if (duration) {
        formData.append('duration', duration);
      }

      // 语音文件通常较小，使用较短的超时时间
      const voiceOptions = {
        ...options,
        timeout: options.timeout || 30000, // 增加到30秒
        maxRetries: options.maxRetries || 5, // 增加重试次数
        retryDelay: options.retryDelay || 2000
      };

      return await this.uploadWithRetry('/api/upload/audio', formData, voiceOptions);
    } catch (error: any) {
      console.error('语音上传预处理失败:', error);
      return {
        success: false,
        error: `语音文件处理失败: ${error.message || '未知错误'}`
      };
    }
  }

  // 上传图片文件
  async uploadImage(
    imageUri: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const uploadId = `image_${Date.now()}`;
    
    if (this.uploadQueue.has(uploadId)) {
      return this.uploadQueue.get(uploadId)!;
    }

    const uploadPromise = this.performImageUpload(imageUri, options);
    this.uploadQueue.set(uploadId, uploadPromise);

    try {
      const result = await uploadPromise;
      return result;
    } finally {
      this.uploadQueue.delete(uploadId);
    }
  }

  private async performImageUpload(
    imageUri: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `image_${Date.now()}.${fileExt}`;
      
      formData.append('image', {
        uri: this.processFileUri(imageUri),
        type: 'image/jpeg',
        name: fileName
      } as any);

      // 图片文件使用中等超时时间
      const imageOptions = {
        ...options,
        timeout: options.timeout || 40000,
        maxRetries: options.maxRetries || 3
      };

      return await this.uploadWithRetry('/api/upload/image', formData, imageOptions);
    } catch (error) {
      console.error('图片上传预处理失败:', error);
      return {
        success: false,
        error: '图片文件处理失败'
      };
    }
  }

  // 上传视频文件
  async uploadVideo(
    videoUri: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const uploadId = `video_${Date.now()}`;
    
    if (this.uploadQueue.has(uploadId)) {
      return this.uploadQueue.get(uploadId)!;
    }

    const uploadPromise = this.performVideoUpload(videoUri, options);
    this.uploadQueue.set(uploadId, uploadPromise);

    try {
      const result = await uploadPromise;
      return result;
    } finally {
      this.uploadQueue.delete(uploadId);
    }
  }

  private async performVideoUpload(
    videoUri: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      const rawName = videoUri.split('/').pop() || '';
      const lowerName = rawName.toLowerCase();
      const extMatch = lowerName.match(/\.([a-z0-9]+)(?:\?|#|$)/);
      const fileExt = extMatch ? extMatch[1] : (lowerName.includes('.mov') ? 'mov' : 'mp4');
      const fileName = rawName && rawName.includes('.') ? rawName : `video_${Date.now()}.${fileExt}`;
      let mimeType = 'video/mp4';
      switch (fileExt) {
        case 'mp4':
          mimeType = 'video/mp4';
          break;
        case 'mov':
          mimeType = 'video/quicktime';
          break;
        case 'm4v':
          mimeType = 'video/x-m4v';
          break;
        case '3gp':
        case '3gpp':
          mimeType = 'video/3gpp';
          break;
        case 'mkv':
          mimeType = 'video/x-matroska';
          break;
        default:
          mimeType = 'video/mp4';
      }
      
      formData.append('video', {
        uri: this.processFileUri(videoUri),
        type: mimeType,
        name: fileName
      } as any);

      // 视频文件通常较大，使用更长的超时时间，支持500MB大文件
      const videoOptions = {
        ...options,
        timeout: options.timeout || 600000, // 10分钟，支持500MB文件上传
        maxRetries: options.maxRetries || 5,
        retryDelay: options.retryDelay || 5000 // 增加重试延迟到5秒
      };

      return await this.uploadWithRetry('/api/upload/video', formData, {
        ...videoOptions,
        onProgress: (p: number) => {
          // 委托真实回调
          if (options.onProgress) {
            options.onProgress(p);
          }
        }
      });
    } catch (error) {
      console.error('视频上传预处理失败:', error);
      return {
        success: false,
        error: '视频文件处理失败'
      };
    }
  }

  // 取消所有正在进行的上传
  cancelAllUploads(): void {
    this.uploadQueue.clear();
  }

  // 获取当前上传队列状态
  getUploadQueueStatus(): { 
    totalUploads: number;
    activeUploads: string[];
  } {
    return {
      totalUploads: this.uploadQueue.size,
      activeUploads: Array.from(this.uploadQueue.keys())
    };
  }
}

export default MediaUploadService.getInstance(); 