//index.js
//获取应用实例
const util = require('../../utils/util.js')

const app = getApp()

Page({
  data: {
    scaning: false,
    devices: []
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
    const deviceId = event.currentTarget.dataset.id
    console.log('deviceId', deviceId)
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
  }
})