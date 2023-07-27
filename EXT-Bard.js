/**
 ** Module : EXT-Bard
 ** @bugsounet
 ** 07-2023
 ** support: https://forum.bugsounet.fr
 **/

Module.register("EXT-Bard", {
  defaults: {
    debug: false,
    COOKIE_KEY: null,
    scrollActivate: true,
    scrollStep: 25,
    scrollInterval: 1000,
    scrollStart: 10000
  },

  start: function () {
    this.ready = false
    this.session = {}
  },

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  notificationReceived: function(noti, payload,sender) {
    switch(noti) {
      case "GW_READY":
        if (sender.name == "Gateway") {
          this.preparePopup()
          this.sendNotification("HELLO", this.name)
          this.sendSocketNotification("INIT", this.config)
        }
        break
      case "EXT_BARD-SHOW":
        if (!this.ready) return
        var bard = document.getElementById("EXT_BARD")
        bard.classList.remove("hidden")
        break
      case "EXT_STOP":
      case "EXT_BARD-HIDE":
        var bard = document.getElementById("EXT_BARD")
        bard.classList.add("hidden")
        break
      case "EXT_BARD-QUERY":
        if (payload && this.ready) this.sendSocketNotification("QUERY", payload)
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
      case "INITIALIZED":
        this.ready = true
        break
      case "REPLY":
        var replyStatus = document.getElementById("EXT_BARD-Status")
        replyStatus.src = "modules/EXT-Bard/resources/standby.gif"
        var reply = document.getElementById("EXT_BARD-Webview")
        reply.src= "modules/EXT-Bard/tmp/output/tmp.html?seed="+Date.now()
        break
      case "THINK":
        var thinkStatus = document.getElementById("EXT_BARD-Status")
        thinkStatus.src = "modules/EXT-Bard/resources/think.gif"
        var Text = document.getElementById("EXT_BARD-Text")
        Text.textContent = payload
        break
      case "ERROR":
        this.sendNotification("EXT_ALERT", {
          message: "[BARD] " + payload,
          type: "error"
        })
        break
      case "TB_RESULT":
        this.tbResult(payload)
        break
    }
  },

  preparePopup() {
    var Bard = document.createElement("div")
    Bard.id = "EXT_BARD"
    Bard.classList.add("hidden")
    
      var Container = document.createElement("div")
      Container.id = "EXT_BARD-Container"
      Bard.appendChild(Container)
  
        var TopBar = document.createElement("div")
        TopBar.id = "EXT_BARD-TopBar"
        Container.appendChild(TopBar)
          var Status = document.createElement("img")
          Status.id = "EXT_BARD-Status"
          Status.src = "modules/EXT-Bard/resources/standby.gif"
          TopBar.appendChild(Status)
          var Text = document.createElement("div")
          Text.id = "EXT_BARD-Text"
          Text.textContent = "EXT-Bard Ready!"
          TopBar.appendChild(Text)

        Content = document.createElement("div")
        Content.id = "EXT_BARD-Content"
        Container.appendChild(Content)
          var Box = document.createElement("div")
          Box.id = "EXT_BARD-Box"
          Content.appendChild(Box)
          var Webview = document.createElement("webview")
          Webview.id = "EXT_BARD-Webview"
          Webview.scrolling="no"
          Webview.src= "modules/EXT-Bard/tmp/output/tmp.html?seed="+Date.now()
          Webview.addEventListener("did-stop-loading", (event) => {
            event.stopPropagation()
            if (Webview.getURL() == "about:blank") return
            Webview.executeJavaScript(`
            var timer = null
            var timerScroll = null
            function scrollDown(posY){
              clearTimeout(timer)
              timer = null
              var scrollHeight = document.body.scrollHeight
              if (posY == 0) console.log("Begin Scrolling")
              if (posY > scrollHeight) posY = scrollHeight
              document.documentElement.scrollTop = document.body.scrollTop = posY;
              if (posY == scrollHeight) {
                clearTimeout(timer)
                timer = null
                clearTimeout(timerScroll)
                timerScroll = null
                console.log("End Scrolling")
                return
              }
              timer = setTimeout(function(){
                if (posY < scrollHeight) {
                  posY = posY + ${this.config.scrollStep}
                  scrollDown(posY);
                }
              }, ${this.config.scrollInterval});
            };
            if (${this.config.scrollActivate}) {
              timerScroll = setTimeout(() => scrollDown(0), ${this.config.scrollStart});
            };`)
          })
          Box.appendChild(Webview)

    document.body.appendChild(Bard)
  },

  getStyles: function () {
    return [ "EXT-Bard.css" ]
  },

  /********************************/
  /*** EXT-TelegramBot Commands ***/
  /********************************/
  EXT_TELBOTCommands: function(commander) {
    commander.add({
      command: "bard",
      description: "Make a conversation with Google Bard",
      callback: "tbBard"
    })
  },

  tbBard: function(command, handler) {
    if (!this.ready) return handler.reply("TEXT", "Not available actually.")
    let key = Date.now()
    this.session[key] = handler
    if (handler.args) {
      handler.reply("TEXT", "Query Bard for " + handler.args + "...")
      this.sendSocketNotification("TB_QUERY", {TBkey:key, Query: handler.args})
    } else {
      handler.reply("TEXT", "Ask your Query for Google Bard")
    }
  },

  tbResult: function(result) {
    if (result.TBKey && result.Result && this.session[result.TBKey]) {
      var handler = this.session[result.TBKey]
      handler.reply("TEXT", TelegramBotExtraChars(result.Result), {parse_mode:"Markdown"})
      this.session[result.TBKey] = null
      delete this.session[result.TBKey]
    } else {
      this.sendNotification("EXT_TELBOT-TELL_ADMIN", "Bard data received error")
    }
  }
})
