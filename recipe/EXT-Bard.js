/** Vocal control for enable EXT-Bard **/
/**  @bugsounet  **/
/** 27/07/2023 **/

var recipe = {
  transcriptionHooks: {
    "EXT_Bard": {
      pattern: "bard",
      command: "EXT_Bard"
    }
  },
  commands: {
    "EXT_Bard": {
      notificationExec: {
        notification: "EXT_BARD-SHOW"
      },
      displayResponse: false,
      bardMode: true
    }
  }
}
exports.recipe = recipe
