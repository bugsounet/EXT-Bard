"use strict"

var NodeHelper = require("node_helper")
var log = (...args) => { /* do nothing */ }
var mds = require('markdown-styles')
var path = require('path')
var fs = require("fs")

module.exports = NodeHelper.create({
  start: function() {
    this.config = null
    this.tmpPath = path.resolve(__dirname, 'tmp')
    this.Bard = null
    this.Conversation = null
    this.Ids = null
  },

  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[BARD] EXT-Bard Version:", require('./package.json').version, "rev:", require('./package.json').rev)
        this.config = payload
        if (this.config.debug) log = (...args) => { console.log("[BARD]", ...args) }
        this.initialize()
        break
      case "QUERY":
        if (!this.conversation) return
        this.BardQuery(payload)
        break
      case "TB_QUERY":
        if (!this.conversation) return
        let query = payload.Query
        let telegramBot = payload.TBkey
        this.BardQuery(query, telegramBot)
        break
    }
  },

  initialize: async function() {
    this.Bard = await this.loadBard()
    try {
      await this.Bard.init(this.config.COOKIE_KEY)
      this.Ids = this.loadIds()
      if (this.Ids) this.conversation = new this.Bard.Chat(this.Ids)
      else this.conversation = new this.Bard.Chat()
      this.sendSocketNotification("INITIALIZED")
      console.log("[BARD] Initialized!")
    } catch (e) {
      console.error("[BARD]", e.message)
      this.sendSocketNotification("Error", e.message)
    }
  },

  BardQuery: async function(query, Telegram) {
    log("[Query]", query)
    if (!Telegram) this.sendSocketNotification("THINK", query)
    let result = await this.conversation.ask(query)
    log("[Result]", result)
    if (!this.Ids) {
      let exportIds = await this.conversation.export()
      this.saveIds(exportIds)
    }
    if (Telegram) return this.sendSocketNotification("TB_RESULT", { Result: result, TBKey: Telegram }) 
    this.createHTML(result)
  },

  loadBard: async function () {
    const loaded = await import("bard-ai")
    return loaded.default
  },

  createHTML: function(result) {
    try {
      fs.writeFileSync(this.tmpPath+ "/input/tmp.md", result)
      log("[MD] MD file saved!")
    } catch (e) {
      console.error("[BARD] [MD]", e.message)
      this.sendSocketNotification("ERROR", e.message)
      return
    }

    /** generate HTML file from the MD source file **/
    try {
      mds.render(mds.resolveArgs({
        input: this.tmpPath + '/input',
        output: this.tmpPath + '/output',
        layout: this.tmpPath + '/layout'
      }), () => {
        this.sendSocketNotification("REPLY", result)
        log("[HTML] File Created!")
      })
    } catch (e) {
      console.error("[BARD] [HTML]", e.message)
      this.sendSocketNotification("ERROR", e.message)
    }
  },

  loadIds() {
    var result = null
    
     try {
       let Ids = fs.readFileSync(this.tmpPath + "/Chat/Ids.json")
       result = JSON.parse(Ids)
       console.log("[BARD] [Ids] Continue last Conversation")
     } catch (e) {
       if (e.code == "ENOENT") console.log("[BARD] [Ids] Create new Conversation")
       else {
         console.error("[BARD] [Ids] ", e.message)
         this.sendSocketNotification("Error", e.message)
       }
     }
     return result
  },

  saveIds(Ids) {
    try {
       let result = JSON.stringify(Ids)
       fs.writeFileSync(this.tmpPath + "/Chat/Ids.json", result)
       this.Ids = Ids
       log("[BARD] [Ids] Conversation Ids Saved")
    } catch (e) {
      console.error("[BARD] [Ids]", e.message)
      this.sendSocketNotification("Error", e.message)
      this.Ids = null
    }
  }
})
