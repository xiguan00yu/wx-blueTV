const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function wxAsyncPromise(name, options) {
  return new Promise((resolve, reject) => {
    wx[name]({
      ...(options || {}),
      success: function (res) {
        resolve(res);
      },
      fail: function (res) {
        resolve({
          ...res,
          _fail: true
        });
      },
    });
  });
}

module.exports = {
  formatTime,
  wxAsyncPromise
}