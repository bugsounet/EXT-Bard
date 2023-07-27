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
    }
  },

  initialize: async function() {
    this.Bard = await this.loadBard()
    try {
      await this.Bard.init(this.config.COOKIE_KEY)
      this.Ids = this.loadIds()
      if (this.Ids) this.conversation = new this.Bard.Chat(this.Ids)
      else this.conversation = new this.Bard.Chat()
    } catch (e) {
      console.error("[BARD]", e)
    }
  },

  BardQuery: async function(query) {
    log("[Query]", query)
    this.sendSocketNotification("THINK", query)
    let result = await this.conversation.ask(query)
    log("[Result]", result)
    this.createHTML(result)
    if (!this.Ids) {
      let exportIds = await this.conversation.export()
      this.saveIds(exportIds)
    }
  },

  loadBard: async function () {
    const loaded = await import("bard-ai")
    return loaded.default
  },

  createHTML: function(result) {
    try {
      fs.writeFileSync(this.tmpPath+ "/input/tmp.md", result)
      log("MD file saved!")
    } catch (err) {
      console.error("[BARD]", err.message)
      this.sendSocketNotification("ERROR", err.message)
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
        log("HTML File Created!")
      })
    } catch (err) {
      console.error("[BARD]", err.message)
      this.sendSocketNotification("ERROR", err.message)
    }
  },

  loadIds() {
    var result = null
    
     try {
       let Ids = fs.readFileSync(this.tmpPath + "/Chat/Ids.json")
       result = JSON.parse(Ids)
       console.log("[BARD] Continue last Conversation")
     } catch (e) {
       if (e.code == "ENOENT") console.log("[BARD] Create new Conversation")
       else console.error("[BARD]", e.message)
     }
     return result
  },

  saveIds(Ids) {
    try {
       let result = JSON.stringify(Ids)
       fs.writeFileSync(this.tmpPath + "/Chat/Ids.json", result)
       this.Ids = Ids
       log("[BARD] Conversation Ids Saved")
    } catch (e) {
      console.error("[BARD]", e.message)
      this.Ids = null
    }
  }
})
