/** Vocal control for enable/disable EXT-Bard **/
/**  @bugsounet  **/
/** 30/07/2023 **/

var recipe = {
  transcriptionHooks: {
    "EXT_Bard_START": {
      pattern: "^(bard)($)",
      command: "EXT_Bard_START"
    },
    "EXT_Bard_STOP": {
      pattern: "^(bard stop)($)",
      command: "EXT_Bard_STOP"
    }
  },

  commands: {
    "EXT_Bard_START": {
      notificationExec: { notification: "EXT_BARD-SHOW" },
      displayResponse: false,
      bardMode: true,
      soundExec: { chime: "opening" }
    },
    "EXT_Bard_STOP": {
      notificationExec: { notification: "EXT_BARD-HIDE" },
      displayResponse: false,
      bardMode: false,
      soundExec: { chime: "closing" }
    }
  }
}
exports.recipe = recipe
