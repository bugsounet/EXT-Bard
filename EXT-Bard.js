/**
 ** Module : EXT-Bard
 ** @bugsounet
 ** 07-2023
 ** support: https://forum.bugsounet.fr
 **/

Module.register("EXT-Bard", {
  defaults: {
    debug: true,
    COOKIE_KEY: null
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
      case "EXT_BARD-RESET":
        this.sendSocketNotification("RESET")
        break
      case "EXT_BARD-SHOW":
        var bard = document.getElementById("EXT_BARD")
        bard.classList.remove("hidden")
        break
      case "EXT_STOP":
      case "EXT_BARD-HIDE":
        var bard = document.getElementById("EXT_BARD")
        bard.classList.add("hidden")
        break
      case "EXT_BARD-QUERY":
        if (payload) this.sendSocketNotification("QUERY", payload)
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
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
          Box.appendChild(Webview)

    document.body.appendChild(Bard)
  },

  getStyles: function () {
    return [ "EXT-Bard.css" ]
  },
})
