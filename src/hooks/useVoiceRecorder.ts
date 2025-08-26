import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, Alert, PermissionsAndroid, Animated } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// 常量定义
const CONSTANTS = {
  PULSE_DURATION: 800,
  CACHE_MAX_AGE: 30,
};

interface UseVoiceRecorderProps {
  onError: (error: any, message: string) => void;
  onRecordingComplete: (audioUrl: string, duration: string) => void;
}

interface UseVoiceRecorderReturn {
  // 状态
  isRecording: boolean;
  recordTime: string;
  showPreview: boolean;
  recordingUri: string;
  isPlaying: boolean;
  pulseAnim: Animated.Value;
  
  // 方法
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  playPreview: () => Promise<void>;
  confirmSendVoiceMessage: () => void;
  toggleVoiceMode: () => void;
  
  // 辅助状态
  isVoiceMode: boolean;
  hasRecordingPermission: boolean;
}

export const useVoiceRecorder = ({
  onError,
  onRecordingComplete,
}: UseVoiceRecorderProps): UseVoiceRecorderReturn => {
  // 状态管理
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [showPreview, setShowPreview] = useState(false);
  const [recordingUri, setRecordingUri] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [hasRecordingPermission, setHasRecordingPermission] = useState(false);
  
  // 引用
  const audioRecorderPlayerRef = useRef(new AudioRecorderPlayer());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isRequestingPermission = useRef(false);

  // 初始化时检查权限状态
  useEffect(() => {
    const checkInitialPermission = async () => {
      try {
        if (Platform.OS === 'ios') {
          const result = await check(PERMISSIONS.IOS.MICROPHONE);
          console.log('初始化检查iOS麦克风权限:', result);
          setHasRecordingPermission(result === RESULTS.GRANTED);
        } else {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          console.log('初始化检查Android录音权限:', granted);
          setHasRecordingPermission(granted);
        }
      } catch (error) {
        console.warn('初始化权限检查失败:', error);
        setHasRecordingPermission(false);
      }
    };

    checkInitialPermission();
  }, []);

  // 权限检查 - 修改为不自动触发录音
  const requestRecordingPermission = useCallback(async (): Promise<boolean> => {
    // 防止重复请求权限
    if (isRequestingPermission.current) {
      console.log('正在请求权限中...');
      return false;
    }

    try {
      isRequestingPermission.current = true;
      
      if (Platform.OS === 'android') {
        // 先检查是否已有权限
        const existingPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (existingPermission) {
          console.log('已有录音权限');
          setHasRecordingPermission(true);
          return true;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '录音权限',
            message: '应用需要访问您的麦克风来录制语音消息',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('录音权限已授予');
          setHasRecordingPermission(true);
          return true;
        } else {
          console.log('录音权限被拒绝');
          Alert.alert(
            '权限被拒绝',
            '录音权限被拒绝，请在设置中手动开启权限',
            [
              { text: '取消', style: 'cancel' },
              { 
                text: '去设置', 
                onPress: () => {
                  // 可以引导用户去设置页面
                }
              }
            ]
          );
          setHasRecordingPermission(false);
          return false;
        }
      } else {
        // iOS权限检查
        const result = await check(PERMISSIONS.IOS.MICROPHONE);
        console.log('iOS麦克风权限检查结果:', result);
        
        if (result === RESULTS.GRANTED) {
          console.log('iOS麦克风权限已授予');
          setHasRecordingPermission(true);
          return true;
        } else if (result === RESULTS.DENIED) {
          console.log('iOS麦克风权限被拒绝，请求权限...');
          const requestResult = await request(PERMISSIONS.IOS.MICROPHONE);
          console.log('iOS权限请求结果:', requestResult);
          const hasPermission = requestResult === RESULTS.GRANTED;
          setHasRecordingPermission(hasPermission);
          
          if (!hasPermission) {
            Alert.alert(
              '麦克风权限被拒绝',
              '录制语音消息需要麦克风权限。请前往 设置 > 隐私与安全性 > 麦克风 中开启权限。',
              [
                { text: '取消', style: 'cancel' },
                { 
                  text: '去设置',
                  onPress: () => {
                    // iOS设置页面
                    require('react-native').Linking.openURL('app-settings:');
                  }
                }
              ]
            );
          }
          
          return hasPermission;
        } else if (result === RESULTS.BLOCKED) {
          console.log('iOS麦克风权限被永久拒绝');
          Alert.alert(
            '麦克风权限被禁用',
            '录制语音消息需要麦克风权限。权限已被永久拒绝，请前往 设置 > 隐私与安全性 > 麦克风 中手动开启。',
            [
              { text: '取消', style: 'cancel' },
              { 
                text: '去设置',
                onPress: () => {
                  require('react-native').Linking.openURL('app-settings:');
                }
              }
            ]
          );
          setHasRecordingPermission(false);
          return false;
        } else {
          console.log('iOS麦克风权限状态未知:', result);
          Alert.alert('权限错误', '无法获取麦克风权限状态，请重启应用后重试');
          setHasRecordingPermission(false);
          return false;
        }
      }
    } catch (error) {
      console.error('检查录音权限时出错:', error);
      onError(error, '检查录音权限失败');
      setHasRecordingPermission(false);
      return false;
    } finally {
      isRequestingPermission.current = false;
    }
  }, [onError]);

  // 动画控制
  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: CONSTANTS.PULSE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: CONSTANTS.PULSE_DURATION,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulseAnimation = useCallback(() => {
    pulseAnim.setValue(1);
    Animated.timing(pulseAnim, { 
      toValue: 1,
      duration: 0,
      useNativeDriver: true
    }).stop();
  }, [pulseAnim]);

  // 开始录音 - 优化权限检查逻辑
  const startRecording = useCallback(async () => {
    try {
      // 如果已经在录音，不允许重复开始
      if (isRecording) {
        console.log('已在录音中，忽略重复请求');
        return;
      }

      // 优化权限检查：先快速检查，避免阻塞用户按住操作
      if (!hasRecordingPermission) {
        console.log('💡 检测到无麦克风权限，开始权限请求流程...');
        
        // 显示友好提示，然后请求权限
        if (Platform.OS === 'ios') {
          // 🔧 iOS首次使用修复：iOS需要更明确的权限说明，并集成初始化管理器
          const hasPermission = await requestRecordingPermission();
          if (!hasPermission) {
            console.log('❌ iOS麦克风权限被拒绝，录音已取消');
            return;
          }
          
          // 🍎 权限获取成功后，通知iOS初始化管理器完成音频会话设置
          try {
            const IOSInitializationManager = require('../services/IOSInitializationManager').default;
            await IOSInitializationManager.getInstance().initializeAudioSessionAfterPermission();
            console.log('✅ [VoiceRecorder] iOS权限后音频会话设置完成');
          } catch (audioError) {
            console.warn('⚠️ [VoiceRecorder] iOS权限后音频会话设置失败:', audioError);
            // 不中断录音流程，继续使用原方案
          }
        } else {
          // Android权限处理
          const hasPermission = await requestRecordingPermission();
          if (!hasPermission) {
            console.log('❌ Android录音权限被拒绝，录音已取消');
            return;
          }
        }
        
        console.log('✅ 麦克风权限已获取，继续录音流程');
      }

      // 强制清理之前的状态
      try {
        await audioRecorderPlayerRef.current.stopRecorder();
        audioRecorderPlayerRef.current.removeRecordBackListener();
        // 稍等确保完全停止
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (cleanupError) {
        console.log('清理录音器状态:', cleanupError);
      }

      // 优化录音格式配置：使用跨平台兼容的音频格式
      let audioPath: string | undefined;
      const timestamp = Date.now();
      
      // 🎵 音频格式优化：
      // iOS: 使用m4a格式，但确保服务器端能转换为mp3
      // Android: 继续使用mp3格式
      // 注意：后续需要确保VoiceMessageItem能正确播放两种格式
      const fileExtension = Platform.OS === 'ios' ? '.m4a' : '.mp3';
      const fileName = `voice_message_${timestamp}${fileExtension}`;

      if (Platform.OS === 'android') {
        // Android：使用缓存目录，mp3格式兼容性最好
        audioPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        const dirExists = await RNFS.exists(RNFS.CachesDirectoryPath);
        if (!dirExists) {
          await RNFS.mkdir(RNFS.CachesDirectoryPath);
        }
        console.log('📱 Android录音路径 (MP3):', audioPath);
      } else {
        // iOS：使用Document目录，需带 file:// 前缀
        audioPath = `file://${RNFS.DocumentDirectoryPath}/${fileName}`;
        const dirExists = await RNFS.exists(RNFS.DocumentDirectoryPath);
        if (!dirExists) {
          await RNFS.mkdir(RNFS.DocumentDirectoryPath);
        }
        console.log('🍎 iOS录音路径 (M4A):', audioPath);
      }

      // iOS特定：强化音频会话管理
      if (Platform.OS === 'ios') {
        try {
          console.log('🎙️ iOS录音环境初始化...');
          
          // 导入IOSAudioSession
          const IOSAudioSession = require('../utils/IOSAudioSession').default;
          const audioSession = IOSAudioSession.getInstance();
          
          // 强制重置音频会话，确保干净的录音环境
          console.log('🔄 重置iOS音频会话状态...');
          await audioSession.reset();
          
          // 等待音频会话完全重置
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // 准备录音会话
          console.log('🎤 配置iOS录音音频会话...');
          await audioSession.prepareForRecording();
          
          // 额外等待确保音频会话完全激活
          await new Promise(resolve => setTimeout(resolve, 300));
          
          console.log('✅ iOS录音音频会话配置成功');
        } catch (audioSessionError) {
          console.warn('⚠️ iOS音频会话配置失败，尝试继续录音:', audioSessionError);
          // iOS音频会话配置失败不应阻止录音尝试
          // 某些设备可能不支持音频会话配置，但基础录音功能仍可用
        }
      }

      // iOS/Android：开始录音前确保没有残留的播放/录音占用音频会话
      try {
        await audioRecorderPlayerRef.current.stopPlayer();
      } catch {}
      try {
        await audioRecorderPlayerRef.current.stopRecorder();
      } catch {}
      
      let result: string | undefined;
      try {
        if (Platform.OS === 'ios') {
          // 显式指定iOS录音参数（使用库要求的 *IOS 键名）
          result = await audioRecorderPlayerRef.current.startRecorder(audioPath, {
            AVEncoderAudioQualityKeyIOS: 96,
            AVNumberOfChannelsKeyIOS: 1,
            AVFormatIDKeyIOS: 'aac',
            AVSampleRateKeyIOS: 44100,
          } as any);
        } else {
          result = await audioRecorderPlayerRef.current.startRecorder(audioPath);
        }
      } catch (startErr: any) {
        console.warn('首次启动录音失败，尝试回退路径:', startErr?.message || startErr);
        if (Platform.OS === 'ios') {
          // 回退到Document目录的自定义m4a路径（确保带 file:// 前缀）
          const fallbackPath = `file://${RNFS.DocumentDirectoryPath}/${fileName}`;
          try {
            const dirExists = await RNFS.exists(RNFS.DocumentDirectoryPath);
            if (!dirExists) {
              await RNFS.mkdir(RNFS.DocumentDirectoryPath);
            }
            console.log('使用iOS回退录音路径:', fallbackPath);
            result = await audioRecorderPlayerRef.current.startRecorder(fallbackPath, {
              AVEncoderAudioQualityKeyIOS: 96,
              AVNumberOfChannelsKeyIOS: 1,
              AVFormatIDKeyIOS: 'aac',
              AVSampleRateKeyIOS: 44100,
            } as any);
          } catch (fallbackErr) {
            throw fallbackErr;
          }
        } else {
          throw startErr;
        }
      }
      
      // 检查是否返回了无效状态
      if (typeof result === 'string' && (
        result.includes('Already recording') || 
        result.includes('Already stopped') ||
        result === 'Already recording' ||
        result.includes('error') ||
        result.includes('Error') ||
        result.includes('failed') ||
        result.includes('Failed')
      )) {
        console.log('检测到录音器状态异常:', result);
        throw new Error(`录音器状态异常: ${result}`);
      }
      
      // iOS特定：验证结果
      if (Platform.OS === 'ios' && (!result || result.length < 10)) {
        console.error('iOS录音启动返回异常结果:', result);
        throw new Error('iOS录音启动失败，请检查麦克风权限和音频设置');
      }
      
      setRecordingUri(result);
      
      audioRecorderPlayerRef.current.addRecordBackListener((e) => {
        const seconds = Math.floor(e.currentPosition / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        setRecordTime(
          `${minutes < 10 ? '0' + minutes : minutes}:${
            remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds
          }`
        );
      });
      
      setIsRecording(true);
      startPulseAnimation();
      console.log('录音已开始:', result);
    } catch (error: any) {
      console.error('录音启动失败:', error);
      
      // iOS特定错误处理
      let errorMessage = '无法启动录音，请重试';
      if (Platform.OS === 'ios') {
        if (error.message?.includes('permission') || error.message?.includes('Permission')) {
          errorMessage = 'iOS麦克风权限异常，请到设置中重新授权';
        } else if (error.message?.includes('audio session') || error.message?.includes('Audio')) {
          errorMessage = 'iOS音频会话异常，请关闭其他音频应用';
        } else if (error.message?.includes('file') || error.message?.includes('path')) {
          errorMessage = 'iOS文件系统错误，请重启应用';
        } else {
          errorMessage = `iOS录音启动失败: ${error.message || '未知错误'}`;
        }
      }
      
      onError(error, errorMessage);
      setIsRecording(false);
      setRecordTime('00:00');
      stopPulseAnimation();
    }
  }, [hasRecordingPermission, isRecording, requestRecordingPermission, startPulseAnimation, stopPulseAnimation, onError]);

  // 停止录音 - 修复文件检查逻辑
  const stopRecording = useCallback(async () => {
    try {
      if (!isRecording) {
        console.log('没有正在进行的录音');
        return;
      }
      
      console.log('停止录音...');
      const result = await audioRecorderPlayerRef.current.stopRecorder();
      audioRecorderPlayerRef.current.removeRecordBackListener();
      setIsRecording(false);
      stopPulseAnimation();
      console.log('录音已保存:', result);
      
      // 检查返回结果是否为有效路径
      if (typeof result !== 'string' || 
          result.includes('Already stopped') || 
          result.includes('error') ||
          result.length < 10) {
        console.log('录音停止返回无效结果:', result);
        throw new Error('录音保存失败，请重试');
      }
      
      // 检查录音文件是否存在
      let fileExists = false;
      try {
        fileExists = await RNFS.exists(result);
      } catch (fileCheckError) {
        console.log('检查文件存在性失败:', fileCheckError);
        fileExists = false;
      }
      
      if (!fileExists) {
        console.log('录音文件不存在:', result);
        throw new Error('录音文件保存失败');
      }
      
      // 检查录音时长
      if (recordTime === '00:00' || recordTime === '0:00') {
        console.log('录音时间过短，删除文件');
        try {
          await RNFS.unlink(result);
        } catch (deleteError) {
          console.log('删除短录音文件失败:', deleteError);
        }
        Alert.alert('录音时间过短', '请录制至少1秒的语音消息');
        setRecordTime('00:00');
        setRecordingUri('');
        return;
      }
      
      console.log('录音成功，显示预览');
      setShowPreview(true);
    } catch (error: any) {
      console.error('停止录音失败:', error);
      onError(error, '录音保存失败，请重试');
      setIsRecording(false);
      setRecordTime('00:00');
      setRecordingUri('');
      stopPulseAnimation();
    }
  }, [isRecording, recordTime, stopPulseAnimation, onError]);

  // 取消录音
  const cancelRecording = useCallback(async () => {
    try {
      // 停止录音器
      if (isRecording) {
        await audioRecorderPlayerRef.current.stopRecorder();
        audioRecorderPlayerRef.current.removeRecordBackListener();
        setIsRecording(false);
        stopPulseAnimation();
      }
      
      // 删除录音文件
      if (recordingUri) {
        try {
          await RNFS.unlink(recordingUri);
          console.log('已删除录音文件:', recordingUri);
        } catch (deleteError) {
          console.log('删除录音文件失败:', deleteError);
        }
      }
      
      setShowPreview(false);
      setRecordingUri('');
      setRecordTime('00:00');
      setIsPlaying(false);
      
      // 停止播放器
      try {
        await audioRecorderPlayerRef.current.stopPlayer();
      } catch (stopPlayerError) {
        console.log('停止播放器失败:', stopPlayerError);
      }
    } catch (error) {
      console.log('取消录音时出错:', error);
    }
  }, [isRecording, recordingUri, stopPulseAnimation]);

  // 播放预览
  const playPreview = useCallback(async () => {
    try {
      if (!recordingUri) {
        console.log('没有录音文件可播放');
        return;
      }
      
      if (isPlaying) {
        // 停止播放
        await audioRecorderPlayerRef.current.stopPlayer();
        setIsPlaying(false);
        console.log('停止播放录音');
      } else {
        // 开始播放
        console.log('开始播放录音预览:', recordingUri);
        // iOS：准备播放会话并走外放
        if (Platform.OS === 'ios') {
          try {
            const IOSAudioSession = require('../utils/IOSAudioSession').default;
            const audioSession = IOSAudioSession.getInstance();
            // 如果不是播放模式，重置后进入播放模式
            if (audioSession.getCurrentMode() !== 'playback') {
              await audioSession.reset();
            }
            await audioSession.prepareForPlayback();
            try {
              await audioRecorderPlayerRef.current.setSubscriptionDuration(0.1);
            } catch {}
          } catch (iosSessionErr) {
            console.warn('iOS预览播放会话准备失败，继续尝试播放:', iosSessionErr);
          }
        }

        // 防御：确保没有残留的录音器占用
        try { await audioRecorderPlayerRef.current.stopRecorder(); } catch {}
        try { await audioRecorderPlayerRef.current.stopPlayer(); } catch {}

        await audioRecorderPlayerRef.current.startPlayer(recordingUri);
        setIsPlaying(true);
        
        audioRecorderPlayerRef.current.addPlayBackListener((e) => {
          if (e.currentPosition === e.duration) {
            setIsPlaying(false);
            audioRecorderPlayerRef.current.removePlayBackListener();
          }
        });
      }
    } catch (error: any) {
      onError(error, '播放录音失败');
      setIsPlaying(false);
    }
  }, [recordingUri, isPlaying, onError]);

  // 确认发送语音消息
  const confirmSendVoiceMessage = useCallback(() => {
    if (recordingUri && recordTime) {
      onRecordingComplete(recordingUri, recordTime);
      setShowPreview(false);
      setRecordingUri('');
      setRecordTime('00:00');
      setIsPlaying(false);
    }
  }, [recordingUri, recordTime, onRecordingComplete]);

  // 切换语音模式
  const toggleVoiceMode = useCallback(() => {
    setIsVoiceMode(!isVoiceMode);
  }, [isVoiceMode]);

  return {
    // 状态
    isRecording,
    recordTime,
    showPreview,
    recordingUri,
    isPlaying,
    pulseAnim,
    isVoiceMode,
    hasRecordingPermission,
    
    // 方法
    startRecording,
    stopRecording,
    cancelRecording,
    playPreview,
    confirmSendVoiceMessage,
    toggleVoiceMode,
  };
}; 