export default {
  common: {
    login: '登录',
    logout: '退出登录',
    back: '返回',
    confirm: '确认',
    cancel: '取消',
    tip: '提示',
    backHome: '返回首页',
    language: '语言',
    ready: '已就绪',
    upcoming: '待开发',
    notAvailable: '暂无'
  },
  language: {
    zhCn: '中文',
    lo: 'ພາສາລາວ'
  },
  login: {
    title: '医助端管理平台',
    subtitle: '一站式患者问诊全流程管理，患者建档、四诊数据采集、诊疗流程协同、病历归档全链路覆盖。',
    portalLabel: 'Assistant Portal',
    visualTitle: '医助端管理平台',
    visualSubtitle: '一站式患者问诊全流程管理，患者建档、四诊数据采集、诊疗流程协同、病历归档全链路覆盖。',
    accountLoginTitle: '医助账号登录',
    selectTenant: '请选择租户',
    inputUsername: '请输入用户名',
    inputPassword: '请输入密码',
    rememberMe: '记住密码',
    loginBtn: '登录',
    loggingIn: '登录中...',
    usernameLabel: '用户名',
    passwordLabel: '密码',
    tenantLabel: '租户',
    footer: 'Lao Online Clinic Assistant',
    footerNotice: '仅限医疗机构授权医助人员使用',
    footerSupport: '如有账号问题，请联系系统管理员',
    features: {
      archive: '患者档案快速建档与检索',
      remote: '远程视频诊疗流程协同',
      device: '中医四诊仪数据采集与绑定',
      records: '就诊记录与诊疗报告归档'
    }
  },
  logout: {
    confirmText: '确定退出医助端吗？'
  },
  menu: {
    assistantSystem: '医助工作台',
    assistantPortal: '医助门户',
    profile: '个人中心',
    workbench: '工作台',
    patientIdentify: '患者识别',
    intake: '信息录入',
    doctorSelect: '选择接诊医生',
    videoGuide: '视频导诊'
  },
  assistant: {
    systemBrand: '远程智慧医疗系统',
    topbarStatus: '系统在线',
    emptyPage: '该页面内容已清空，当前仅保留基础 .vue 模板，等待后续重新开发。',
    workbench: {
      pageTitle: '医助工作台',
      pageSubtitle: '请选择您需要的操作',
      enterNow: '立即前往',
      clinicTitle: '患者就诊',
      clinicDescription: '输入就诊号，识别患者并接诊',
      recordTitle: '就诊记录',
      recordDescription: '查看历史就诊记录与报告',
      pendingTitle: '诊疗未完成',
      pendingDescription: '查看未完成诊疗任务',
      description: '工作台页面已重置为基础模板，保留顶部状态和退出能力，等待重新开发。',
      cardAuthTitle: '鉴权链路',
      cardRoutingTitle: '静态路由',
      cardI18nTitle: '双语界面',
      cardI18nDescription: '中文、老挝语文案可统一切换并持久化。'
    },
    records: {
      pageTitle: '就诊记录查询',
      pageSubtitle: '请输入患者信息或选择筛选条件，查询历史就诊记录',
      backToWorkbench: '返回工作台',
      description: '静态就诊记录查询页面，展示本地模拟的历史记录数据。',
      allFilter: '全部科',
      recentSevenDays: '近7天',
      recentThirtyDays: '近30天',
      completedFilter: '已完成',
      cancelledFilter: '已取消',
      searchPlaceholder: '请输入患者姓名/就诊号/身份证号/手机号',
      listTitle: '就诊记录',
      totalSuffix: '项',
      visitDate: '就诊日期',
      visitId: '就诊ID',
      patientInfo: '患者信息',
      doctorInfo: '接诊医生',
      chiefComplaint: '主诉',
      contractStatus: '合同状态',
      action: '操作',
      completed: '已完成',
      incomplete: '未完成',
      cancelled: '已取消',
      viewDetail: '查看详情',
      patientAgeGender: '{age}岁/{gender}',
      doctorMeta: '{title}--{department}',
      male: '男',
      female: '女'
    },
    pendingRecords: {
      pageTitle: '未完成列表',
      pageSubtitle: '请输入患者信息或选择筛选条件，查询历史就诊记录',
      backToWorkbench: '返回工作台',
      description: '静态未完成列表页面，展示本地模拟的未完成诊疗数据。',
      allFilter: '全部科',
      recentSevenDays: '近7天',
      recentThirtyDays: '近30天',
      completedFilter: '已完成',
      cancelledFilter: '已取消',
      searchPlaceholder: '请输入患者姓名/就诊号/身份证号/手机号',
      listTitle: '就诊记录',
      totalSuffix: '项',
      visitDate: '就诊日期',
      visitId: '就诊ID',
      patientInfo: '患者信息',
      doctorInfo: '接诊医生',
      action: '操作',
      reconnect: '重新连接',
      patientAgeGender: '{age}岁/{gender}',
      doctorMeta: '{title}--{department}',
      male: '男',
      female: '女'
    },
    patientIdentify: {
      pageTitle: '患者就诊',
      pageSubtitle: '请输入患者就诊号/身份证号/手机号，完成患者识别',
      submitText: '识别患者',
      verifying: '识别中...',
      emptyDataMessage: '未查询到患者信息，正在进入信息录入页面',
      verifySuccess: '患者识别请求已提交',
      description: '请输入患者就诊号/身份证号/手机号，完成患者识别。',
      tabs: {
        visitNo: '就诊号',
        idCard: '身份证号',
        phone: '手机号'
      },
      placeholders: {
        visitNo: '请输入就诊号',
        idCard: '请输入身份证号',
        phone: '请输入手机号'
      }
    },
    intake: {
      pageTitle: '患者信息录入',
      pageSubtitle: '请完善患者基本信息、病例信息，完成问诊仪数据采集',
      basicTitle: '患者基本信息',
      caseTitle: '病例信息',
      fourDiagnosis: {
        title: '四诊仪数据采集',
        pending: '未采集',
        deviceStatusOffline: '设备未连接',
        connectDevice: '连接设备',
        diagnosisTitle: '四诊仪诊断结果',
        cards: {
          inspection: {
            title: '望诊',
            subtitle: '（舌象/面象）',
            empty: '暂无采集预览',
            action: '采集舌象/面象数据'
          },
          pulse: {
            title: '切诊',
            subtitle: '（脉象）',
            empty: '暂无脉诊波形',
            action: '采集脉象数据'
          },
          auscultation: {
            title: '闻诊',
            subtitle: '（声息/气味）',
            empty: '采集后自动填充闻诊结果',
            action: '采集闻诊数据'
          },
          inquiry: {
            title: '问诊',
            subtitle: '（十问）',
            empty: '采集后自动填充问诊结果',
            action: '采集问诊数据'
          }
        }
      },
      submitSummary: '提交患者信息并完成采集',
      saveIdle: '等待保存',
      saveSaving: '保存中...',
      saveSaved: '已自动保存',
      saveError: '保存失败',
      fields: {
        name: '姓名',
        sex: '性别',
        birthday: '出生日期',
        age: '年龄',
        idCard: '身份证号',
        phone: '手机号',
        medicalAccount: '医保信息',
        address: '居住地址',
        chiefComplaint: '主诉',
        presentIllness: '现病史',
        pastHistory: '既往史',
        allergyHistory: '过敏史',
        familyHistory: '家族史'
      },
      sexOptions: {
        male: '男',
        female: '女'
      },
      placeholders: {
        name: '请输入患者姓名',
        birthday: '请输入出生日期',
        age: '请输入年龄',
        idCard: '请输入身份证号',
        phone: '请输入手机号',
        medicalAccount: '请输入医保卡号/医保类型',
        address: '请输入详细居住地址',
        chiefComplaint: '请输入患者本次就诊的主要症状及持续时间',
        presentIllness: '请输入患者本次疾病的发生、发展、诊疗过程',
        pastHistory: '请输入患者既往病史、手术史、传染病史等',
        allergyHistory: '请填写患者药物/食物过敏史，无则填无',
        familyHistory: '请输入患者家族遗传病史、传染病史等'
      },
      receivedDataDescription: '已接收到患者识别返回数据，可在此基础上进行下一步处理。',
      emptyDataDescription: '当前没有患者识别返回数据，请继续后续信息录入流程。',
      description: '信息录入页面已清空为基础模板，后续按新方案重新开发。'
    },
    doctorSelect: {
      pageTitle: '选择接诊医生',
      pageSubtitle: '请为患者选择在线医生，发起远程视频诊疗',
      description: '请为患者选择接诊医生，准备发起远程视频诊疗。',
      allDepartments: '全部科室',
      patientVisitNo: '就诊ID',
      currentComplaint: '本次就诊',
      loadingDepartments: '科室加载中...',
      noDepartments: '暂无科室信息',
      loadingDoctors: '医生加载中...',
      refreshDoctors: '刷新医生',
      refreshingDoctors: '刷新中...',
      noDoctors: '当前科室暂无医生',
      online: '在线',
      offline: '离线',
      selectDoctor: '选择医生',
      selectedDoctor: '已选择',
      footerTip: '请选择接诊医生',
      footerAction: '发起视频诊疗',
      footerLoading: '发起中...',
      createRoomSuccess: '视频诊疗房间已创建',
      ageSuffix: '岁',
      specialties: '擅长',
      metrics: {
        consultations: '接诊量',
        approval: '好评率'
      }
    },
    patientVideo: {
      header: {
        title: '患者视频就诊',
        syncing: '同步患者信息中...',
        syncFailed: '患者信息同步失败'
      },
      waiting: {
        description: '患者视频就诊等待页面，当前已接入双屏广播同步。',
        tip: '系统正在为您匹配最佳接诊资源，请稍候',
        fields: {
          patientId: '患者ID',
          caseId: '病例ID',
          doctorId: '医生ID',
          roomId: '房间ID'
        }
      },
      consultation: {
        description: '患者视频就诊页面已接入 DingRTC 双语会诊能力。',
        subtitleTitle: '实时字幕翻译',
        subtitleRecord: '会话记录',
        subtitleStarting: '启动中',
        subtitleRetryNeeded: '需重试',
        subtitleReady: '实时同步中',
        retrySubtitle: '重试字幕',
        subtitleEmptyTitle: '进入房间后字幕默认开启。',
        subtitleEmptyDescription: '当任一方发言时，双语内容会以聊天记录形式展示在这里。',
        translation: '翻译',
        recognizing: '识别中...',
        sourceText: '原文',
        muted: '静音',
        micOn: '静音',
        micOff: '取消静音',
        cameraOn: '关闭视频',
        cameraOff: '开启视频',
        leave: '结束问诊',
        inCall: '通话中',
        selfBadge: '您',
        doctorPrefix: '医生: ',
        waitingDoctor: '等待医生接入',
        connected: '实时连接中',
        footerSubtitle: '区域医疗中心 · 双语实时会诊',
        doctorId: '医生ID',
        caseId: '病例ID',
          channelId: '房间号',
          errorTitle: '无法进入视频就诊',
          backToWaiting: '返回等待页',
          missingParams: '入会参数不完整，请重新从等待页进入视频就诊。',
          joinFailed: '加入房间失败，请稍后重试。',
          chatPlaceholder: '请输入老挝语消息，系统会自动翻译成中文后发送。',
          chatSend: '发送消息',
          chatSending: '发送中',
          chatConnecting: '聊天通道连接中，请稍候。',
          chatConnected: '聊天通道已连接，可直接发送文字消息。',
          chatUnavailable: '聊天通道暂不可用，请稍后重试。',
          chatDoctorUnavailable: '当前未获取到医生信息，暂时无法发送消息。',
          chatCaseUnavailable: '当前未获取到病例信息，暂时无法发送消息。',
          chatConnectFailed: '聊天通道连接失败，暂时无法发送文字消息。',
          chatInputRequired: '请输入要发送的消息内容。',
          chatTranslateFailed: '消息翻译失败，请稍后重试。',
          chatSendFailed: '消息已回显，但 websocket 发送失败。',
          chatSaveFailed: '消息已回显，但聊天记录保存失败。'
        }
    },
    videoGuide: {
      description: '视频导诊页面已清空为基础模板，后续按新方案重新开发。'
    }
  },
  error: {
    notFoundDesc: '抱歉，当前页面不存在或暂无访问权限。'
  },
  message: {
    sessionExpired: '无效的会话，或者会话已过期，请重新登录。',
    authCheckFailed: '身份校验失败，请重新登录。',
    networkError: '后端接口连接异常',
    timeout: '系统接口请求超时',
    systemError: '系统异常，请稍后再试',
    loadTenantFailed: '租户信息加载失败，请稍后重试'
  },
  route: {
    login: '医助登录',
    notFound: '页面不存在',
    workbench: '工作台',
    records: '就诊记录',
    pendingRecords: '诊疗未完成',
    patientIdentify: '患者识别',
    intake: '信息录入',
    doctorSelect: '选择接诊医生',
    videoGuide: '视频导诊',
    patientWaiting: '患者候诊',
    patientConsultation: '患者视频就诊'
  }
}
