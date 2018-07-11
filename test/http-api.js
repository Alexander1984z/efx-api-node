/* eslint-env mocha */

const { assert } = require('chai')
const nock = require('nock')

const instance = require('./instance')
const {ZeroEx} = require('0x.js')
const utils = require('ethereumjs-util')

let efx

before(async () => {
  efx = await instance()
})

it('efx.cancelOrder(orderId)', async () => {
  const orderId = 1

  nock('https://api.ethfinex.com:443')
    .post('/trustless/cancelOrder', async (body) => {

      const {OrderId, ethOrderMethod, signature} = body

      assert.equal(orderId, orderId)
      assert.equal(ethOrderMethod, '0x')

      assert.ok(signature)

      const {ecRecover} = efx.web3.eth.personal

      // sign the orderId from scratch
      let toSign = utils.sha3(orderId.toString(16))
      toSign = utils.bufferToHex(toSign).slice(2)

      const recovered = await ecRecover(toSign, signature)

      assert.equal(efx.config.account.toLowerCase(), recovered.toLowerCase())

      return true
    })
    .reply(200, { all: 'good' })

  const response = await efx.cancelOrder(orderId)
  // TODO:
  // - record real response using nock.recorder.rec()
  // - validate the actual response
  assert.ok(response)
})

it('efx.getOrder(orderId)', async () => {
  const orderId = 1

  nock('https://api.ethfinex.com:443')
    .post('/trustless/getOrder', (body) => {
      assert.equal(body.id, orderId)

      return true
    })
    .reply(200, { all: 'good' })

  const response = await efx.getOrder(orderId)
  // TODO:
  // - record real response using nock.recorder.rec()
  // - validate the actual response
  assert.ok(response)
})

it('efx.getOrders()', async () => {
  nock('https://api.ethfinex.com:443')
    .post('/trustless/getOrders', (body) => {
      return true
    })
    .reply(200, { all: 'good' })

  const response = await efx.getOrders()
  // TODO:
  // - record real response using nock.recorder.rec()
  // - validate the actual response
  assert.ok(response)
})

it('efx.getPendingOrders()', async () => {
  nock('https://api.ethfinex.com:443')
    .post('/trustless/getPendingOrders', (body) => {
      assert.equal(body.protocol, '0x')

      return true
    })
    .reply(200, { all: 'good' })

  const response = await efx.getPendingOrders()
  // TODO:
  // - record real response using nock.recorder.rec()
  // - validate the actual response
  assert.ok(response)
})

it('efx.registerOrderList()', async () => {
  nock('https://api.ethfinex.com:443')
    .post('/trustless/registerOrderlist', async (body) => {
      const {
        request,
        signature
      } = body

      const {
        address,
        usage
      } = request

      assert.ok(address)
      assert.ok(request)
      assert.ok(signature)
      assert.equal(usage, 'efx-portal-orders')

      const {ecRecover} = efx.web3.eth.personal

      const recovered = await ecRecover(request, signature)

      assert.equal(address.toLowerCase(), recovered.toLowerCase())

      return true
    })
    .reply(200, {
      status: 'success',
      id: 1
    })

  const response = await efx.registerOrderList()

  assert.equal(response.status, 'success')
  assert.ok(response.id)
})

it("efx.releaseTokens('ZRX', 10)", async () => {
  const token = 'ZRX'
  const unlockUntil = 10

  nock('https://api.ethfinex.com:443')
    .post('/trustless/releaseTokens', async (body) => {

      assert.ok(body.address)
      assert.equal(body.tokenAddress, efx.CURRENCIES[token].tokenAddress)
      assert.ok(body.unlockUntil)

      return true
    })
    .reply(200, {
      status: 'success',
      releaseSignature: '0x...'
    })

  const response = await efx.releaseTokens(token, unlockUntil)

  assert.ok(response.releaseSignature)
  assert.equal(response.status, 'success')
})

it('efx.submitOrder()', async () => {
  nock('https://api.ethfinex.com:443')
    .post('/trustless/submitOrder', async (body) => {
      assert.ok(body.cid)
      assert.equal(body.type, 'EXCHANGE LIMIT')
      assert.equal(body.symbol, 'tETHUSD')
      assert.equal(body.amount, 1)
      assert.equal(body.price, 100)

      const {orderObject} = body

      const orderHash = ZeroEx.getOrderHashHex(orderObject)

      const {ecRecover} = efx.web3.eth.personal

      const recovered = await ecRecover(orderHash, orderObject.ecSignature)

      assert.equal(efx.config.account.toLowerCase(), recovered.toLowerCase())

      return true
    })
    .reply(200, { all: 'good' })

  const symbol = 'ETHUSD'
  const amount = 1
  const price = 100

  const response = await efx.submitOrder(symbol, amount, price)
  // TODO:
  // - record real response using nock.recorder.rec()
  // - validate the actual response
  assert.ok(response)
})
