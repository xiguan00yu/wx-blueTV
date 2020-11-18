//index.js
//获取应用实例
const util = require('../../utils/util.js')

const app = getApp()

Page({
  data: {
    scaning: false,
    devices: [],
    connectBle: {},
    connectDevice: null
  },
  //事件处理函数
  toLogScreen: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  startScan: async function () {
    const startDiscovery = await util.wxAsyncPromise('startBluetoothDevicesDiscovery')
    console.log('startDiscovery', startDiscovery.errMsg)
    if (!startDiscovery._fail) {
      this.setData({
        scaning: true
      })
    }
  },
  stopScan: async function () {
    const stopDiscovery = await util.wxAsyncPromise('stopBluetoothDevicesDiscovery')
    console.log('stopDiscovery', stopDiscovery.errMsg)
    if (!stopDiscovery._fail) {
      this.setData({
        scaning: false
      })
    }
  },
  onConnectBlueItem: async function (event) {
    wx.showLoading({
      title: 'connecting ...'
    })
    await (async () => {
      const deviceId = event.currentTarget.dataset.id
      console.log('click ble item', deviceId)
      if (this.data.connectBle.deviceId) {
        // need close Connection
        const closeConnectRes = await util.wxAsyncPromise('closeBLEConnection', {
          deviceId
        })
        if (closeConnectRes._fail) return
        this.setData({
          connectBle: {},
          connectDevice: null
        })
        console.log('close connect ble ', closeConnectRes.errMsg)
        return
      }
      // ===== into connect =====
      const createBle = await util.wxAsyncPromise('createBLEConnection', {
        deviceId
      });
      if (createBle._fail) return
      console.log('create ble connect', deviceId)
      const bleServices = await util.wxAsyncPromise('getBLEDeviceServices', {
        deviceId
      });
      if (bleServices._fail) return
      console.log('connect blue get services', bleServices.services)
      const needCheckServices = bleServices.services || []
      // record connect
      const connectBle = {}
      for (let i = 0; i < needCheckServices.length; i++) {
        const service = needCheckServices[i];
        const bleCharacter = await util.wxAsyncPromise('getBLEDeviceCharacteristics', {
          deviceId,
          serviceId: service.uuid
        });
        console.log('get charateristics', bleCharacter.errMsg)
        if (bleCharacter._fail) continue
        const findCharacter = bleCharacter.characteristics.find(c => c.properties.write)
        console.log('connect blue get character', findCharacter)
        if (findCharacter) {
          Object.assign(connectBle, {
            deviceId,
            serviceId: service.uuid,
            characteristicId: findCharacter.uuid,
          })
          break;
        }
      }
      if (Object.keys(connectBle).length > 0) {
        this.setData({
          connectBle,
          connectDevice: this.data.devices.find(d => d.deviceId === deviceId)
        })
      }


      this.stopScan()

    })()
    wx.hideLoading()
  },
  onLoad: async function () {
    const that = this
    // listener device found
    wx.onBluetoothDeviceFound(async function () {
      const getDevicesRes = await util.wxAsyncPromise('getBluetoothDevices')
      if (!getDevicesRes._fail) {
        that.setData({
          devices: getDevicesRes.devices
        })
      }
    })
    // init bluetooth
    const initBlue = await util.wxAsyncPromise('openBluetoothAdapter')
    console.log('initBlue', initBlue.errMsg)
    if (initBlue._fail) return
  },
  onTryScan: function () {
    if (!this.data.scaning) this.startScan()
    if (this.data.scaning) this.stopScan()
  },
  onHide: function () {
    if (this.data.scaning) this.stopScan()
  },
})