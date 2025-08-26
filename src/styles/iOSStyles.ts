import { StyleSheet, Platform, Dimensions, StatusBar } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * iOS专用样式配置
 * 针对iOS设备的UI特性进行优化
 */

// 检查是否为iOS平台
const isIOSPlatform = Platform.OS === 'ios';

// iOS字体缩放比例 - 比Android稍小以适应iOS UI规范
const IOS_FONT_SCALE = 0.9;

// iOS安全区域常量
export const IOS_SAFE_AREA_TOP = 0; // 顶部不再额外预留安全区，由系统处理
const IOS_HEADER_HEIGHT = 48; // 略微收紧页头高度
const IOS_INPUT_HEIGHT = 44; // iOS标准输入框高度

// 主页面页头统一配置
const IOS_MAIN_HEADER_HEIGHT = 100; // 主页面页头高度 - 增加高度给顶部更多空间
const IOS_MAIN_HEADER_PADDING_TOP = isIOSPlatform ? 55 : 30; // iOS增加paddingTop避免被灵动岛遮挡

// 聊天页面页头配置 - 与主页保持一致的高度
export const IOS_CHAT_HEADER_HEIGHT = IOS_MAIN_HEADER_HEIGHT; // 与主页页头高度保持一致
const IOS_CHAT_HEADER_PADDING_TOP = IOS_MAIN_HEADER_PADDING_TOP; // 与主页保持一致的paddingTop

/**
 * 根据字体大小获取iOS适配的大小
 */
export const getIOSFontSize = (fontSize: number): number => {
  return Math.round(fontSize * IOS_FONT_SCALE);
};

/**
 * iOS专用聊天界面样式
 */
export const iOSChatStyles = StyleSheet.create({
  // 页头样式优化 - 与主页页面保持一致的高度
  headerContainer: {
    height: IOS_CHAT_HEADER_HEIGHT, // 与主页页头高度保持一致
    backgroundColor: '#fff',
    paddingTop: IOS_CHAT_HEADER_PADDING_TOP, // 与主页保持一致的paddingTop
    paddingHorizontal: 15, // 与主页保持一致的水平内边距
    borderBottomWidth: isIOSPlatform ? 0.5 : 1, // 与主页保持一致的分割线
    borderBottomColor: isIOSPlatform ? '#c6c6c8' : '#eee',
    shadowColor: isIOSPlatform ? '#000' : undefined,
    shadowOffset: isIOSPlatform ? { width: 0, height: 0.5 } : undefined,
    shadowOpacity: isIOSPlatform ? 0.1 : undefined,
    shadowRadius: isIOSPlatform ? 0 : undefined,
    elevation: isIOSPlatform ? 0 : 2,
    justifyContent: 'flex-end', // 确保chatHeader位于底部正确位置
  },
  
  chatHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 0, // 移除水平内边距，由父容器控制
    paddingVertical: 12, // 增加垂直padding确保内容居中
    height: IOS_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // 返回按钮优化
  backButton: {
    width: 44, // 增加触摸区域
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8, // iOS风格的边距调整
  },
  
  // 页头中心区域
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16, // 确保左右对称
  },
  
  // 页头文字样式
  chatHeaderName: {
    fontSize: getIOSFontSize(17), // iOS标准导航标题大小
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: 0, // 移除水平边距，依赖父容器居中
  },
  
  onlineStatusText: {
    fontSize: getIOSFontSize(11),
    color: '#8E8E93', // iOS系统灰色
  },
  
  // 消息气泡样式
  messageText: {
    fontSize: getIOSFontSize(18), // 增大消息文字字体
    lineHeight: getIOSFontSize(22),
  },
  
  // 消息时间样式
  messageTime: {
    fontSize: getIOSFontSize(11),
    marginTop: 3,
    marginHorizontal: 4,
  },
  
  // 输入区域样式
  inputContainer: {
    backgroundColor: '#F2F2F7', // iOS系统背景色
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 0, // 完全移除底部间距，让SafeAreaView处理
    borderTopWidth: 0.5,
    borderTopColor: '#c6c6c8',
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: IOS_INPUT_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  
  textInput: {
    flex: 1,
    fontSize: getIOSFontSize(18), // 增大输入框字体
    lineHeight: getIOSFontSize(22),
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlignVertical: 'center',
    color: '#000',
  },
  
  // 按钮样式
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF', // iOS蓝色
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B81',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  // 更多选项面板
  moreOptionsPanel: {
    flexDirection: 'row', // 横向排列
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 0, // 完全移除底部间距，让SafeAreaView处理
    borderTopWidth: 0.5,
    borderTopColor: '#c6c6c8',
    justifyContent: 'space-around', // 平均分布
  },
  
  moreOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  
  moreOptionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: (screenWidth - 32 - 40) / 4, // 4列布局
    paddingVertical: 12,
  },
  
  moreOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  
  moreOptionText: {
    fontSize: getIOSFontSize(12),
    color: '#333',
    textAlign: 'center',
  },
  
  // 消息列表样式
  messagesList: {
    padding: 12,
    paddingBottom: 20,
    paddingTop: 15,
  },
  
  // 加载样式
  loadingText: {
    marginTop: 10,
    color: '#8E8E93',
    fontSize: getIOSFontSize(14),
  },
  
  // 网络状态横幅
  networkBanner: {
    position: 'absolute',
    top: IOS_SAFE_AREA_TOP,
    left: 0,
    right: 0,
    backgroundColor: '#FF9500', // iOS橙色警告
    paddingVertical: 6,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  
  networkBannerText: {
    color: '#fff',
    fontSize: getIOSFontSize(13),
    textAlign: 'center',
    fontWeight: '500',
  },
  
  connectingBanner: {
    position: 'absolute',
    top: IOS_SAFE_AREA_TOP + 30,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B81',
    paddingVertical: 6,
    paddingHorizontal: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  connectingBannerText: {
    color: '#fff',
    fontSize: getIOSFontSize(13),
    textAlign: 'center',
    fontWeight: '500',
    marginLeft: 6,
  },
});

/**
 * iOS专用主页面页头样式
 * 统一首页、订单页、信息页的页头高度和位置
 */
export const iOSMainHeaderStyles = StyleSheet.create({
  // 统一的页头容器样式
  headerContainer: {
    height: IOS_MAIN_HEADER_HEIGHT,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: IOS_MAIN_HEADER_PADDING_TOP,
    paddingHorizontal: 15,
    borderBottomWidth: isIOSPlatform ? 0.5 : 1,
    borderBottomColor: isIOSPlatform ? '#c6c6c8' : '#eee',
    shadowColor: isIOSPlatform ? '#000' : undefined,
    shadowOffset: isIOSPlatform ? { width: 0, height: 0.5 } : undefined,
    shadowOpacity: isIOSPlatform ? 0.1 : undefined,
    shadowRadius: isIOSPlatform ? 0 : undefined,
    elevation: isIOSPlatform ? 0 : 2,
  },
  
  // 页头标题样式
  headerTitle: {
    fontSize: getIOSFontSize(20),
    fontWeight: isIOSPlatform ? '600' : 'bold',
    color: '#333',
    textAlign: 'center',
  },
  
  // 左右按钮区域样式
  headerLeft: {
    position: 'absolute',
    left: 15,
    top: IOS_MAIN_HEADER_PADDING_TOP,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerRight: {
    position: 'absolute',
    right: 15,
    top: IOS_MAIN_HEADER_PADDING_TOP,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // 通用按钮样式
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: isIOSPlatform ? 16 : 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isIOSPlatform ? '#F2F2F7' : '#f0f0f0',
    marginLeft: 8,
  },
  
  // 位置按钮样式（首页专用） - 优化iOS触摸体验
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isIOSPlatform ? '#F2F2F7' : '#f2f2f2',
    paddingHorizontal: isIOSPlatform ? 12 : 10, // iOS增加水平padding
    paddingVertical: isIOSPlatform ? 8 : 5,     // iOS增加垂直padding，达到44pt最小触摸目标
    borderRadius: isIOSPlatform ? 18 : 15,      // iOS调整圆角以适应更大尺寸
    marginRight: 10,
    minHeight: isIOSPlatform ? 36 : 25,         // iOS确保最小高度
    minWidth: isIOSPlatform ? 80 : 70,          // iOS确保最小宽度便于点击
  },
  
  locationText: {
    fontSize: getIOSFontSize(13),   // iOS稍微增大字体
    color: isIOSPlatform ? '#333' : '#666',  // iOS使用更深的颜色增强可读性
    marginLeft: 4,                  // iOS稍微增加间距
    fontWeight: isIOSPlatform ? '500' : 'normal', // iOS增加字体权重
  },
  
  // 搜索按钮样式 - 优化iOS触摸体验
  searchButton: {
    width: isIOSPlatform ? 36 : 30,     // iOS调整为更合适的尺寸
    height: isIOSPlatform ? 36 : 30,    // iOS调整为更合适的尺寸
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: isIOSPlatform ? 18 : 15,     // iOS圆形按钮设计，调整圆角
    backgroundColor: isIOSPlatform ? '#F2F2F7' : 'transparent', // iOS添加背景色增强视觉反馈
    // iOS添加轻微阴影增强按钮感知
    ...(isIOSPlatform && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    }),
  },
});

/**
 * iOS专用消息气泡样式
 */
export const iOSMessageStyles = StyleSheet.create({
  messageContainer: {
    marginVertical: 3, // 减少消息间距
    paddingHorizontal: 16,
    width: '100%', // 允许容器全宽
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  
  messageBubble: {
    borderRadius: 18,
    padding: 14, // 增加内边距让气泡更大
    minHeight: 38, // 增加最小高度
    maxWidth: '100%', // 允许由外层容器控制最大宽度，避免过早换行
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  
  myBubble: {
    backgroundColor: '#007AFF', // iOS蓝色
    borderBottomRightRadius: 4,
  },
  
  otherBubble: {
    backgroundColor: '#E5E5EA', // iOS灰色
    borderBottomLeftRadius: 4,
  },
  
  myMessageText: {
    color: '#fff',
    fontSize: getIOSFontSize(18), // 增大我的消息字体
    lineHeight: getIOSFontSize(22),
  },
  
  otherMessageText: {
    color: '#000',
    fontSize: getIOSFontSize(18), // 增大对方消息字体
    lineHeight: getIOSFontSize(22),
  },
  
  myMessageTime: {
    color: '#999',
    alignSelf: 'flex-end',
    fontSize: getIOSFontSize(11),
  },
  
  otherMessageTime: {
    color: '#999',
    fontSize: getIOSFontSize(11),
  },
});

/**
 * iOS专用模态框样式
 */
export const iOSModalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: screenWidth - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  
  modalTitle: {
    fontSize: getIOSFontSize(17),
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  
  modalText: {
    fontSize: getIOSFontSize(15),
    color: '#000',
    textAlign: 'center',
    lineHeight: getIOSFontSize(20),
    marginBottom: 20,
  },
  
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  
  modalButtonSecondary: {
    backgroundColor: '#F2F2F7',
  },
  
  modalButtonText: {
    fontSize: getIOSFontSize(16),
    fontWeight: '500',
    textAlign: 'center',
  },
  
  modalButtonTextPrimary: {
    color: '#fff',
  },
  
  modalButtonTextSecondary: {
    color: '#007AFF',
  },
});

/**
 * 检查是否为iOS平台
 */
export const isIOS = Platform.OS === 'ios';

/**
 * 获取平台特定的样式
 */
export const getPlatformStyles = (iosStyle: any, androidStyle: any) => {
  return isIOS ? iosStyle : androidStyle;
};

/**
 * iOS常用颜色
 */
export const iOSColors = {
  systemBlue: '#007AFF',
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  separator: '#C6C6C8',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemGreen: '#34C759',
  systemTealBlue: '#5AC8FA',
  systemIndigo: '#5856D6',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D92',
};

// iOS底部导航栏样式
export const iOSTabBarStyles = {
  // 调整后的导航栏高度 - 向上移动10%
  tabBarHeight: isIOS ? 75 : 60, // iOS增加高度以适应安全区域
  
  // 导航栏容器样式
  tabBarStyle: {
    height: isIOS ? 75 : 60,
    paddingBottom: isIOS ? 20 : 5, // iOS底部安全区域适配
    paddingTop: isIOS ? 8 : 5, // 增加顶部间距，向上移动效果
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    // iOS向上移动10%的效果
    transform: isIOS ? [{ translateY: -6 }] : [],
  },
  
  // 标签文字样式 - 增加与图标的间距
  tabBarLabelStyle: {
    fontSize: getIOSFontSize(11),
    marginTop: isIOS ? 4 : -5, // iOS增加图标和文字间距
    marginBottom: isIOS ? 8 : 5,
    fontWeight: isIOS ? ('500' as any) : 'normal',
  },
  
  // 图标样式优化
  tabBarIconStyle: {
    marginTop: isIOS ? 2 : 0,
    marginBottom: isIOS ? 2 : 0,
  },
  

};

export default {
  iOSChatStyles,
  iOSMainHeaderStyles,
  iOSMessageStyles,
  iOSModalStyles,
  iOSTabBarStyles,
  getIOSFontSize,
  isIOS,
  getPlatformStyles,
  iOSColors,
};
