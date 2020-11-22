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
  onCloseConnection: async function () {
    if (!this.data.connectBle.deviceId) return
    console.log('close connect ble start')
    // need close Connection
    const closeConnectRes = await util.wxAsyncPromise('closeBLEConnection', {
      deviceId: this.data.connectBle.deviceId
    })
    if (closeConnectRes._fail) return
    this.setData({
      connectBle: {},
      connectDevice: null
    })
    console.log('close connect ble ', closeConnectRes.errMsg)
  },
  onConnectBlueItem: async function (event) {
    wx.showLoading({
      title: 'connecting ...'
    })
    await (async () => {
      const deviceId = event.currentTarget.dataset.id
      console.log('click ble item', deviceId)
      if (this.data.connectBle.deviceId) {
        this.onCloseConnection()
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
  onUnload: function () {
    if (this.data.connectBle.deviceId) this.onCloseConnection()
    if (this.data.scaning) this.stopScan()
  },
  // select image
  // show image
  // hanlde image
  // to byte data
  // send data
  onWirteByConnect: async function () {
    if (!this.data.connectBle.deviceId) return
    const {
      deviceId,
      serviceId,
      characteristicId,
    } = this.data.connectBle
    wx.navigateTo({
      url: '../canvas/index',
      events: {
        onSendBleData: async function (data) {
          console.log('get data from canvas')
          for (let i = 0; i < data.length; i++) {
            const uint8StringArr = data[i];
            const t_buffer = new ArrayBuffer(uint8StringArr.length + 1)
            const t_dv = new DataView(t_buffer)
            // set position index
            t_dv.setUint8(0, i)
            uint8StringArr.forEach((b, offset) => t_dv.setUint8(offset + 1, parseInt(b)))
            const writeResult = await util.wxAsyncPromise('writeBLECharacteristicValue', {
              deviceId,
              serviceId,
              characteristicId,
              value: t_buffer,
            })
            console.log('writeBLECharacteristicValue', `data index : ${i} ,`, writeResult.errMsg)
            if (writeResult._fail) {
              break
            }
            wx.showToast({
              title: `SEND(${i+1}/${data.length})...`,
              icon: 'success',
              duration: 550
            })
            await util.delay(0.5)
          }
        },
      },
    })
  }
})